const Notifications = require("./notifications.controller");
const RepositoryFactory = require("../repositories/repository.factory");
const ImageUploadFactory = require("../repositories/image-upload/image-upload.factory");

// Add peso formatter at the top of the file
const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

exports.create = async (req, res) => {
  try {
    // multer may attach a file and may also raise a MulterError which is handled
    // by Express' error middleware; however, in some setups multer errors
    // surface here as `req.fileValidationError` or thrown. We'll defensively
    // check for common multer overflow case and return a 413.
    if (req.file && req.file.size && req.file.size > 8 * 1024 * 1024) {
      console.log('[TOPUP] Create: uploaded file too large');
      return res.status(413).json({ error: 'Uploaded file too large (limit 8MB).' });
    }
    const { amount, reference = "", provider } = req.body || {};
    const method = provider || req.body.method || 'gcash';
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      console.log('[TOPUP] Create: invalid amount');
      return res.status(400).json({ error: "Invalid amount" });
    }

    const uid = req.user?.id || req.user?._id;
    if (!uid) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const now = new Date().toISOString();

    const userRepo = RepositoryFactory.getUserRepository();
    const topupRepo = RepositoryFactory.getTopupRepository();

    const owner = await userRepo.findById(uid) || {};

    const studentName = req.body.payerName || owner.name || "—";
    const submittedStudentId = (req?.body?.studentId && String(req.body.studentId).trim()) || owner.studentId || "N/A";

    const topup = await topupRepo.create({
      userId: String(uid),
      student: studentName,
      studentId: submittedStudentId,
      contact: (req?.body?.contact) ? req.body.contact : (owner.phone || 'N/A'),
      email: (req?.body?.email) ? req.body.email : (owner.email || 'N/A'),
      provider: method,
      amount: amt,
      reference,
      status: "Pending",
      proofUrl: req.file ? await (async () => {
        const imageRepo = ImageUploadFactory.getRepository();
        const result = await imageRepo.upload(req.file, {
          prefix: `topup-${uid}`,
          folder: 'topups'
        });
        return result.url;
      })() : null,
      submittedAt: now,
    });

    // Updated notification code
    try {
      Notifications.addNotification({
        for: "admin",
        actor: owner.id || uid,
        type: "topup:created",
        title: "New Top-up Request",
        body: `${studentName} submitted a top-up request for ${peso.format(amt)}`,
        data: {
          topupId: topup.id,
          amount: amt,
          provider: method,
          studentId: submittedStudentId,
          reference: reference,
          student: {
            name: studentName,
            contact: topup.contact,
            email: topup.email
          }
        },
        createdAt: now
      });
    } catch (e) {
      console.error("Failed to create notification:", e);
    }

    res.json(topup);
  } catch (err) {
    console.error("[TOPUP] create error:", err);
    res.status(500).json({ error: "Failed to create topup" });
  }
};

exports.mine = async (req, res) => {
  try {
    const uid = req.user?.id || req.user?._id;
    if (!uid) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const topupRepo = RepositoryFactory.getTopupRepository();
    const rows = await topupRepo.findAll({ userId: String(uid) });
    console.log('[TOPUP] Mine: returning', rows.length, 'topups for user', uid);
    res.json({ status: 200, data: rows });
  } catch (err) {
    console.error("[TOPUP] mine error:", err);
    res.status(500).json({ error: "Failed to fetch topups" });
  }
};

// Admin: list all topups
exports.listAdmin = async (req, res) => {
  try {
    const topupRepo = RepositoryFactory.getTopupRepository();
    const userRepo = RepositoryFactory.getUserRepository();

    const topups = await topupRepo.findAll({});
    const users = await userRepo.findAll({});

    const enriched = topups.map((t) => {
      const u = users.find((x) => String(x.id) === String(t.userId));
      return {
        ...t,
        student: (u && (u.name || u.email)) || t.student || t.userId,
      };
    });

    console.log('[TOPUP] ListAdmin: returning', enriched.length, 'topups');
    res.json({ status: 200, data: enriched });
  } catch (err) {
    console.error("[TOPUP] listAdmin error:", err);
    res.status(500).json({ error: "Failed to list topups" });
  }
};

// Admin: set status for a topup (Approved|Rejected)
exports.setStatus = async (req, res) => {
  const { id } = req.params || {};
  const { status, reason } = req.body || {};
  if (!id) return res.status(400).json({ error: 'Missing id' });
  if (!status) return res.status(400).json({ error: 'Missing status' });

  const now = new Date().toISOString();

  const topupRepo = RepositoryFactory.getTopupRepository();
  const userRepo = RepositoryFactory.getUserRepository();
  const transactionRepo = RepositoryFactory.getTransactionRepository();

  const topup = await topupRepo.findById(id);
  if (!topup) {
    console.log(`[TOPUP] setStatus: topup not found for id: ${id}`);
    return res.status(404).json({ error: 'Not found' });
  }

  const prev = topup.status;
  const newStatus = String(status || '').toLowerCase();
  const prevStatus = String(prev || '').toLowerCase();

  const update = {
    status: status,
  };

  // Store rejection reason if provided
  if (status.toLowerCase() === 'rejected' && reason) {
    update.rejectionReason = reason;
  }

  // If moving into Approved from a non-approved state, credit user's balance and add a transaction.
  if (newStatus === 'approved' && prevStatus !== 'approved') {
    const userId = topup.userId;
    const amount = Number(topup.amount) || 0;
    if (amount > 0 && userId) {
      // Check if transaction already exists (idempotency)
      const existingTx = await transactionRepo.findOne({
        topupId: topup.id,
        type: 'TopUp'
      });

      if (!existingTx) {
        // Credit user balance
        await userRepo.incrementBalance(userId, amount);

        // Record transaction
        await transactionRepo.create({
          userId: userId,
          type: 'TopUp',
          amount: amount,
          reference: topup.reference || null,
          topupId: topup.id,
        });

        update.credited = true;
        update.creditedAt = now;
      }
    }
  }

  const updated = await topupRepo.update(id, update);
  if (!updated) {
    console.error(`[TOPUP] setStatus: failed to update topup ${id}. Topup exists but update returned null.`);
    return res.status(404).json({ error: 'Not found' });
  }

  // Update notification
  try {
    if (updated && updated.userId) {
      const notifTitle = `Top-up ${status}`;
      let notifBody = `Your top-up request for ${peso.format(updated.amount)} was ${status.toLowerCase()}`;

      if (status.toLowerCase() === 'rejected' && reason) {
        notifBody += `\nReason: ${reason}`;
      }

      Notifications.addNotification({
        id: "notif_" + Date.now().toString(36),
        for: updated.userId,
        actor: req.user && req.user.id,
        type: "topup:status",
        title: notifTitle,
        body: notifBody,
        data: {
          topupId: updated.id,
          status: updated.status,
          amount: updated.amount,
          rejectionReason: reason || null
        },
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
  } catch (e) {
    console.error("Notification publish failed", e && e.message);
  }

  return res.json(updated);
};
