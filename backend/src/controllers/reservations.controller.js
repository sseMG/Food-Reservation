// backend/src/controllers/reservations.controller.js
const Notifications = require("./notifications.controller");
const RepositoryFactory = require("../repositories/repository.factory");
const ReservationDateRestrictions = require("./reservationDateRestrictions.controller");

/**
 * POST /api/reservations
 * Create a reservation (Pending). Validate items and total but do NOT
 * deduct stock or charge wallet here. That happens when admin approves.
 */
exports.create = async (req, res) => {
  try {
    const {
      items = [],
      grade = "",
      section = "",
      pickupDate = "",
      slot = "",
      note = "",
      student = "",
    } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      console.log('[RESERVATION] Create: no items');
      return res.status(400).json({ error: "No items" });
    }
    if (!slot) {
      console.log('[RESERVATION] Create: missing pickup slot');
      return res.status(400).json({ error: "Missing pickup slot" });
    }

    if (!pickupDate) {
      console.log('[RESERVATION] Create: missing pickup date');
      return res.status(400).json({ error: "Missing pickup date" });
    }

    const uid = req?.user?.id || req?.user?._id;
    if (!uid) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const rules = await ReservationDateRestrictions._readRules();
      if (ReservationDateRestrictions._isDateRestricted(pickupDate, rules)) {
        return res.status(400).json({ error: "Selected pickup date is restricted. Please choose another date." });
      }
    } catch (e) {
      console.error('[RESERVATION] Create: restriction check failed', e && e.message);
    }

    const userRepo = RepositoryFactory.getUserRepository();
    const menuRepo = RepositoryFactory.getMenuRepository();
    const reservationRepo = RepositoryFactory.getReservationRepository();
    const transactionRepo = RepositoryFactory.getTransactionRepository();

    // Get user
    const user = await userRepo.findById(uid);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Validate and normalize items
    const normalized = [];
    const menuItems = await menuRepo.findAll({ includeDeleted: 'true' });
    
    for (const it of items) {
      const { id, qty } = it || {};
      let m = menuItems.find((x) => String(x.id) === String(id));
      if (!m) {
        const incoming = String(id || "").trim();
        const incomingSuffix = incoming.split("-").pop();
        m = menuItems.find((x) => {
          const sid = String(x.id || "").trim();
          const sfx = sid.split("-").pop();
          return (sfx && incomingSuffix && sfx === incomingSuffix) || sid === incoming;
        });
      }
      if (!m) {
        console.log('[RESERVATION] Create: item not found', id);
        return res.status(400).json({ error: `Item ${id} not found` });
      }

      const q = Number(qty) || 0;
      if (q <= 0) {
        console.log('[RESERVATION] Create: invalid quantity', id);
        return res.status(400).json({ error: "Invalid quantity" });
      }

      if (typeof m.stock === "number" && m.stock < 0) {
        console.log('[RESERVATION] Create: invalid stock', m.name);
        return res.status(400).json({ error: `Invalid stock for ${m.name}` });
      }

      normalized.push({
        id: m.id,
        name: m.name,
        price: Number(m.price) || 0,
        qty: q,
      });
    }

    const total = normalized.reduce((s, r) => s + r.price * r.qty, 0);

    // Check wallet balance
    const userBalance = Number(user.balance) || 0;
    if (userBalance < total) {
      return res.status(400).json({ error: "Insufficient balance. Please top-up first." });
    }

    // Deduct wallet and stock with proper error handling and rollback
    let balanceDeducted = false;
    const stockDeducted = [];
    
    try {
      // Deduct wallet first
      await userRepo.decrementBalance(uid, total);
      balanceDeducted = true;

      // Deduct stock for each item
      for (const it of normalized) {
        await menuRepo.decrementStock(it.id, it.qty);
        stockDeducted.push({ id: it.id, qty: it.qty });
      }
    } catch (error) {
      // Rollback: restore what was deducted
      console.error('[RESERVATION] Error during deduction, rolling back:', error.message);
      
      // Restore stock
      for (const item of stockDeducted) {
        try {
          await menuRepo.incrementStock(item.id, item.qty);
        } catch (e) {
          console.error('[RESERVATION] Failed to restore stock for item', item.id, e.message);
        }
      }
      
      // Restore balance
      if (balanceDeducted) {
        try {
          await userRepo.incrementBalance(uid, total);
        } catch (e) {
          console.error('[RESERVATION] Failed to restore balance for user', uid, e.message);
        }
      }
      
      // Return appropriate error message
      if (error.message.includes('Insufficient stock')) {
        return res.status(400).json({ error: error.message });
      } else if (error.message.includes('Insufficient balance')) {
        return res.status(400).json({ error: error.message });
      } else {
        return res.status(500).json({ error: "Failed to process reservation" });
      }
    }

    // Create transaction
    const now = new Date().toISOString();
    const reservationId = `RES_${Date.now().toString(36)}${Math.floor(Math.random() * 900 + 100).toString(36)}`;
    
    const tx = await transactionRepo.create({
      userId: user.id,
      title: "Reservation Hold",
      ref: reservationId,
      amount: total,
      direction: "debit",
      status: "Pending",
    });

    // Create reservation
    const reservation = await reservationRepo.create({
      id: reservationId,
      userId: user.id,
      student: user.name || req.user?.name,
      grade,
      section,
      when: slot,
      pickupDate,
      note,
      items: normalized,
      total,
      status: "Pending",
      transactionId: tx.id,
      charged: true,
      chargedAt: now,
      stockDeducted: true,
    });

    // Notify admins
    try {
      Notifications.addNotification({
        id: "notif_" + Date.now().toString(36),
        for: "admin",
        actor: user ? {
          id: user.id,
          name: user.name,
          email: user.email,
          profilePictureUrl: user.profilePictureUrl
        } : uid,
        type: "reservation:created",
        title: "New reservation submitted",
        body: `${user?.name || reservation.student || req.user?.email || uid} submitted a reservation`,
        data: { 
          reservationId: reservation.id,
          items: reservation.items,
          total: reservation.total,
          note: reservation.note || "",
          slot: reservation.when || reservation.slot || "",
          pickupDate: reservation.pickupDate || "",
          grade: reservation.grade || "",
          section: reservation.section || "",
          student: reservation.student || ""
        },
        read: false,
        createdAt: reservation.createdAt
      });
    } catch (e) {
      console.error("Notification publish failed", e && e.message);
    }

    res.json(reservation);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create reservation" });
  }
};

/**
 * GET /api/reservations/mine
 */
exports.mine = async (req, res) => {
  try {
    const uid = req.user?.id || req.user?._id;
    
    const reservationRepo = RepositoryFactory.getReservationRepository();
    const userRepo = RepositoryFactory.getUserRepository();

    let rows = [];
    if (uid) {
      const me = await userRepo.findById(uid);
      
      rows = await reservationRepo.findAll({ userId: String(uid) });

      // Legacy fallback: match by student name/email/id when reservation has no userId
      if (me) {
        const allReservations = await reservationRepo.findAll({});
        const legacyRows = allReservations.filter(r => {
          if (r.userId) return false;
          const student = String(r.student || "").trim().toLowerCase();
          if (!student) return false;
          const name = String(me.name || "").trim().toLowerCase();
          const email = String(me.email || "").trim().toLowerCase();
          const id = String(me.id || "").trim().toLowerCase();
          return student === name || student === email || student === id;
        });
        rows = [...rows, ...legacyRows];
      }
    } else if (req.query.student) {
      const s = String(req.query.student).toLowerCase();
      const allReservations = await reservationRepo.findAll({});
      rows = allReservations.filter(r => 
        String(r.student || "").toLowerCase().includes(s)
      );
    } else {
      return res.status(400).json({ error: "Missing identity" });
    }

    rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ status: 200, data: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch reservations" });
  }
};

/**
 * GET /api/reservations/admin
 * Optional ?status=Pending|Approved|Rejected|Claimed
 */
exports.listAdmin = async (req, res) => {
  try {
    const reservationRepo = RepositoryFactory.getReservationRepository();
    
    let query = {};
    if (req.query.status) {
      query.status = String(req.query.status);
    }
    
    const rows = await reservationRepo.findAll(query);
    rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ status: 200, data: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to list reservations" });
  }
};

/**
 * PATCH /api/reservations/admin/:id
 * body: { status }
 *
 * - Approve: Pending -> check stock, check wallet >= total,
 *   deduct wallet & stock, create debit transaction, set charged flags.
 * - Reject: Pending -> Rejected.
 * - Other (Preparing, Ready, Claimed): direct status update.
 */
exports.setStatus = async (req, res) => {
  try {
    const { id } = req.params || {};
    let { status } = req.body || {};
    if (!id) return res.status(400).json({ error: "Missing id" });
    if (!status) return res.status(400).json({ error: "Missing status" });

    // Normalize Cancelled -> Rejected
    let newStatus = status;
    if (String(newStatus).toLowerCase() === "cancelled") newStatus = "Rejected";

    const reservationRepo = RepositoryFactory.getReservationRepository();
    const userRepo = RepositoryFactory.getUserRepository();
    const transactionRepo = RepositoryFactory.getTransactionRepository();
    const menuRepo = RepositoryFactory.getMenuRepository();

    const row = await reservationRepo.findById(id);
    if (!row) return res.status(404).json({ error: "Not found" });

    const prev = row.status || "Pending";

    // Approve flow
    if (newStatus === "Approved") {
      const prevNorm = String(prev || "").trim();
      if (prevNorm !== "Pending") {
        console.log(`[RESERVATION] Cannot approve: status is "${prevNorm}" (expected "Pending") for reservation ${id}`);
        return res.status(400).json({ error: `Cannot approve: current status is "${prevNorm}". Only pending reservations can be approved.` });
      }

      // Update transaction status from Pending to Success
      if (row.transactionId) {
        await transactionRepo.update(row.transactionId, { status: "Success" });
      }

      const updated = await reservationRepo.update(id, { status: "Approved" });
      if (!updated) return res.status(404).json({ error: "Not found" });

      const tx = row.transactionId ? await transactionRepo.findById(row.transactionId) : null;
      const user = row.userId ? await userRepo.findById(row.userId) : null;

      // Notify user
      try {
        if (row.userId) {
          Notifications.addNotification({
            id: "notif_" + Date.now().toString(36),
            for: row.userId,
            actor: req.user && req.user.id,
            type: "reservation:status",
            title: `Reservation ${row.id} Approved`,
            body: `Your reservation ${row.id} has been approved.`,
            data: { 
              reservationId: row.id, 
              status: "Approved",
              items: row.items,
              total: row.total,
              note: row.note || "",
              slot: row.when || row.slot || "",
              grade: row.grade,
              section: row.section,
              student: row.student,
              transactionId: row.transactionId
            },
            read: false,
            createdAt: new Date().toISOString(),
          });
        }
      } catch (e) {
        console.error("Notification publish failed", e && e.message);
      }

      return res.json({ status: 200, data: { reservation: updated, transaction: tx, user } });
    }

    if (newStatus === "Rejected") {
      const allowedPrev = ["Pending", "Approved"];
      if (!allowedPrev.includes(prev)) {
        return res.status(400).json({ error: "Refund/cancellation not allowed for current order state" });
      }

      const total = Number(row.total || 0);
      
      // Restore wallet & stock if not already refunded
      if (!row.refunded && row.charged && total > 0) {
        // Restore wallet
        if (row.userId) {
          await userRepo.incrementBalance(row.userId, total);
        }

        // Restore stock
        if (row.stockDeducted && row.items) {
          for (const it of row.items) {
            await menuRepo.incrementStock(it.id, it.qty);
          }
        }

        // Create refund transaction
        const refundTx = await transactionRepo.create({
          userId: row.userId,
          title: "Refund",
          ref: row.id,
          amount: total,
          direction: "credit",
          status: "Success",
        });

        const updated = await reservationRepo.update(id, {
          refunded: true,
          refundTransactionId: refundTx.id,
          status: "Rejected"
        });

        // Notify user
        try {
          if (row.userId) {
            Notifications.addNotification({
              id: "notif_" + Date.now().toString(36),
              for: row.userId,
              actor: req.user && req.user.id,
              type: "reservation:status",
              title: `Reservation ${row.id} Rejected`,
              body: `Your reservation ${row.id} has been rejected. Refund has been applied.`,
              data: { 
                reservationId: row.id, 
                status: "Rejected",
                items: row.items,
                total: row.total,
                note: row.note || "",
                slot: row.when || row.slot || "",
                grade: row.grade,
                section: row.section,
                student: row.student
              },
              read: false,
              createdAt: new Date().toISOString(),
            });
          }
        } catch (e) {
          console.error("Notification publish failed", e && e.message);
        }

        return res.json({ status: 200, data: { reservation: updated } });
      } else {
        const updated = await reservationRepo.update(id, { status: "Rejected" });
        return res.json({ status: 200, data: { reservation: updated } });
      }
    }

    // Preparing / Ready / Claimed - validate state machine transitions
    const validTransitions = {
      'Approved': ['Preparing'],
      'Preparing': ['Ready'],
      'Ready': ['Claimed'],
      'Claimed': []
    };

    const allowedNext = validTransitions[prev] || [];
    if (!allowedNext.includes(newStatus)) {
      console.warn(`[RESERVATION] Invalid transition: ${prev} -> ${newStatus} for ${id}`);
      return res.status(400).json({ 
        error: `Invalid status transition from ${prev} to ${newStatus}`,
        details: `Allowed transitions from ${prev}: ${allowedNext.join(', ') || 'none (terminal state)'}`
      });
    }

    // Check if already in requested state (idempotency)
    if (prev === newStatus) {
      return res.status(409).json({ 
        error: `Order is already in ${newStatus} status`,
        reservation: row
      });
    }

    const updated = await reservationRepo.update(id, { status: newStatus });
    if (!updated) return res.status(404).json({ error: "Not found" });

    // notify user about reservation status change
    try {
      if (row.userId) {
        Notifications.addNotification({
          id: "notif_" + Date.now().toString(36),
          for: row.userId,
          actor: req.user && req.user.id,
          type: "reservation:status",
          title: `Reservation ${row.id} ${status}`,
          body: `Your reservation ${row.id} is now ${status}.`,
          data: { reservationId: row.id, status },
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error("Notification publish failed", e && e.message);
    }

    return res.json({ status: 200, data: { reservation: updated } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update reservation" });
  }
};

