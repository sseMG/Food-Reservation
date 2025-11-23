const { load, save } = require("../lib/db");
const Notifications = require("./notifications.controller");
const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");

// Add peso formatter at the top of the file
const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

/**
 * Helper: are we connected to Mongo?
 */
function usingMongo() {
  return !!(mongoose && mongoose.connection && mongoose.connection.readyState === 1);
}

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

    if (usingMongo()) {
      const db = mongoose.connection.db;
      const usersCol = db.collection("users");
      const topupsCol = db.collection("topups");

      const owner = await usersCol.findOne({ 
        $or: [{ id: String(uid) }, { _id: ObjectId.isValid(uid) ? new ObjectId(uid) : null }]
      }) || {};

      const studentName = req.body.payerName || owner.name || "—";
      const submittedStudentId = (req?.body?.studentId && String(req.body.studentId).trim()) || owner.studentId || "N/A";

      const topup = {
        id: "top_" + Date.now().toString(36),
        userId: String(uid),
        student: studentName,
        studentId: submittedStudentId,
        contact: (req?.body?.contact) ? req.body.contact : (owner.phone || 'N/A'),
        email: (req?.body?.email) ? req.body.email : (owner.email || 'N/A'),
        provider: method,
        amount: amt,
        reference,
        status: "Pending",
        proofUrl: req.file ? (req.file.filename ? `/uploads/${req.file.filename}` : (req.file.path || null)) : null,
        submittedAt: now,
        createdAt: now
      };

      await topupsCol.insertOne(topup);

      // Updated notification code
      try {
        Notifications.addNotification({
          for: "admin",
          actor: owner.id || owner._id?.toString() || uid,
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

      return res.json(topup);
    }

    const db = load();
    const users = Array.isArray(db.users) ? db.users : [];
    const owner = users.find((u) => String(u.id) === String(uid)) || {};

    const studentName = req.body.payerName || owner.name || "—";
    const submittedStudentId = (req?.body?.studentId && String(req.body.studentId).trim()) || owner.studentId || "N/A";

    const topup = {
      id: "top_" + Date.now().toString(36),
      userId: uid,
      student: studentName,
      studentId: submittedStudentId,
      contact: (req?.body?.contact) ? req.body.contact : (owner.phone || 'N/A'),
      email: (req?.body?.email) ? req.body.email : (owner.email || 'N/A'),
      provider: method,
      amount: amt,
      reference,
      status: "Pending",
      proofUrl: req.file ? (req.file.filename ? `/uploads/${req.file.filename}` : (req.file.path || null)) : null,
      submittedAt: now,
      createdAt: now
    };
    db.topups = Array.isArray(db.topups) ? db.topups : [];
    db.topups.push(topup);
    save(db);

    // Updated notification code
    try {
      const user = users.find(u => String(u.id) === String(uid));
      Notifications.addNotification({
        for: "admin",
        actor: user?.id || uid,
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

    if (usingMongo()) {
      const db = mongoose.connection.db;
      const topupsCol = db.collection("topups");
      const rows = await topupsCol.find({ userId: String(uid) }).toArray();
      console.log('[TOPUP] Mine: returning', rows.length, 'topups for user', uid);
      return res.json({ status: 200, data: rows });
    }

    const db = load();
    const rows = db.topups.filter(t => String(t.userId) === String(uid));
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
    if (usingMongo()) {
      const db = mongoose.connection.db;
      const topupsCol = db.collection("topups");
      const usersCol = db.collection("users");
      
      const topups = await topupsCol.find({}).toArray();
      const users = await usersCol.find({}).toArray();
      
      const enriched = topups.map((t) => {
        const u = users.find((x) => String(x.id || x._id) === String(t.userId));
        return {
          ...t,
          student: (u && (u.name || u.email)) || t.student || t.userId,
        };
      });
      
      console.log('[TOPUP] ListAdmin: returning', enriched.length, 'topups');
      return res.json({ status: 200, data: enriched });
    }

    const db = load();
    const users = Array.isArray(db.users) ? db.users : [];
    const topups = (Array.isArray(db.topups) ? db.topups : []).map((t) => {
      const u = users.find((x) => String(x.id) === String(t.userId));
      return {
        ...t,
        // prefer user's full name or email when available for admin display
        student: (u && (u.name || u.email)) || t.student || t.userId,
      };
    });
    console.log('[TOPUP] ListAdmin: returning', topups.length, 'topups');
    res.json({ status: 200, data: topups });
  } catch (err) {
    console.error("[TOPUP] listAdmin error:", err);
    res.status(500).json({ error: "Failed to list topups" });
  }
};

// Admin: set status for a topup (Approved|Rejected)
exports.setStatus = async (req, res) => {
  try {
    const { id } = req.params || {};
    const { status, reason } = req.body || {};
    if (!id) return res.status(400).json({ error: 'Missing id' });
    if (!status) return res.status(400).json({ error: 'Missing status' });

    const now = new Date().toISOString();

    if (usingMongo()) {
      const db = mongoose.connection.db;
      const topupsCol = db.collection("topups");
      const usersCol = db.collection("users");
      const transactionsCol = db.collection("transactions");

      const topup = await topupsCol.findOne({ 
        $or: [{ id: String(id) }, { _id: ObjectId.isValid(id) ? new ObjectId(id) : null }]
      });
      if (!topup) return res.status(404).json({ error: 'Not found' });

      const prev = topup.status;
      const newStatus = String(status || '').toLowerCase();
      const prevStatus = String(prev || '').toLowerCase();

      const update = {
        status: status,
        updatedAt: now
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
          const existingTx = await transactionsCol.findOne({ 
            topupId: topup.id,
            type: 'TopUp'
          });

          if (!existingTx) {
            // Credit user balance
            await usersCol.updateOne(
              { $or: [{ id: String(userId) }, { _id: ObjectId.isValid(userId) ? new ObjectId(userId) : null }] },
              { $inc: { balance: amount } }
            );

            // Record transaction
            const txn = {
              id: 'txn_' + Date.now().toString(36),
              userId: userId,
              type: 'TopUp',
              amount: amount,
              reference: topup.reference || null,
              topupId: topup.id,
              createdAt: now
            };
            await transactionsCol.insertOne(txn);

            update.credited = true;
            update.creditedAt = now;
          }
        }
      }

      await topupsCol.updateOne(
        { $or: [{ id: String(id) }, { _id: ObjectId.isValid(id) ? new ObjectId(id) : null }] },
        { $set: update }
      );

      const updated = await topupsCol.findOne({ 
        $or: [{ id: String(id) }, { _id: ObjectId.isValid(id) ? new ObjectId(id) : null }]
      });

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
    }

    const db = load();
    const i = (db.topups || []).findIndex(t => String(t.id) === String(id));
    if (i === -1) return res.status(404).json({ error: 'Not found' });

    const prev = db.topups[i].status;
    db.topups[i].status = status;
    db.topups[i].updatedAt = now;
    
    // Store rejection reason if provided
    if (status.toLowerCase() === 'rejected' && reason) {
      db.topups[i].rejectionReason = reason;
    }

    // If moving into Approved from a non-approved state, credit user's balance and add a transaction.
    // Make this idempotent: skip if we've already recorded a transaction for this topup.
    const newStatus = String(status || '').toLowerCase();
    const prevStatus = String(prev || '').toLowerCase();
    if (newStatus === 'approved' && prevStatus !== 'approved') {
      const userId = db.topups[i].userId;
      const amount = Number(db.topups[i].amount) || 0;
      if (amount > 0 && userId) {
        db.users = Array.isArray(db.users) ? db.users : [];
        const uidx = db.users.findIndex((x) => String(x.id) === String(userId));
        if (uidx !== -1) {
          db.transactions = Array.isArray(db.transactions) ? db.transactions : [];
          const already = db.transactions.some(t => String(t.topupId) === String(db.topups[i].id) && t.type === 'TopUp');
          if (!already) {
            // ensure numeric balance
            db.users[uidx].balance = Number(db.users[uidx].balance || 0) + amount;

            // record a transaction (link to topup to make it idempotent)
            const txn = {
              id: 'txn_' + Date.now().toString(36),
              userId: userId,
              type: 'TopUp',
              amount: amount,
              reference: db.topups[i].reference || null,
              topupId: db.topups[i].id,
              createdAt: now
            };
            db.transactions.push(txn);

            // mark topup as credited so UI / future logic can inspect it
            db.topups[i].credited = true;
            db.topups[i].creditedAt = now;
          }
        }
      }
    }

    save(db);
  
  // Update notification to include rejection reason
  try {
    const target = db.topups[i];
    if (target && target.userId) {
      const notifTitle = `Top-up ${status}`;
      let notifBody = `Your top-up request for ${peso.format(target.amount)} was ${status.toLowerCase()}`;
      
      // Add reason to notification if rejected
      if (status.toLowerCase() === 'rejected' && reason) {
        notifBody += `\nReason: ${reason}`;
      }

      Notifications.addNotification({
        id: "notif_" + Date.now().toString(36),
        for: target.userId,
        actor: req.user && req.user.id,
        type: "topup:status",
        title: notifTitle,
        body: notifBody,
        data: { 
          topupId: target.id, 
          status: target.status,
          amount: target.amount,
          rejectionReason: reason || null  // Include reason in notification data
        },
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
  } catch (e) {
    console.error("Notification publish failed", e && e.message);
  }
  res.json(db.topups[i]);
};
