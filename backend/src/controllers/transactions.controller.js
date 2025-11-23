// backend/src/controllers/transactions.controller.js
// Orders-only "transactions" for the current user

const RepositoryFactory = require("../repositories/repository.factory");

// Map one reservation/order into a transaction row for the UI
function mapReservationToTx(r) {
  const id = r.id || r.ref || r.reference || r._id || `R-${Math.random().toString(36).slice(2)}`;
  const createdAt = r.createdAt || r.date || r.time || r.when || r.pickupTime || new Date().toISOString();
  const status = r.status || "Success";

  // best-effort total
  let total = Number(r.total ?? r.amount ?? 0);
  if (!Number.isFinite(total) || total === 0) {
    // compute from items + menu if needed
    const items = Array.isArray(r.items) ? r.items : [];
    const priceMap = new Map((r.menu || []).map(m => [m.id, Number(m.price) || 0])); // fallback if reservation carries menu
    total = items.reduce((sum, it) => {
      const qty = Number(it.qty || it.quantity || 1);
      const price =
        Number(it.price) ||
        Number(priceMap.get(it.menuId || it.id)) ||
        0;
      return sum + qty * price;
    }, 0);
  }

  return {
    id,                          // show in Ref column
    title: r.title || "Food Order",
    createdAt,                   // date/time
    status,                      // Pending | Success | etc.
    statusLC: String(status).toLowerCase(),
    direction: "debit",          // orders are always money-out
    sign: -1,
    amount: Math.abs(Number(total) || 0),
    raw: r,
  };
}

exports.getMyTransactions = async (req, res) => {
  try {
    // your auth middleware typically sets req.user (id or {_id, id})
    const userId = req.user?.id || req.user?._id || req.user;

    if (!userId) {
        console.log('[TRANSACTION] GetMyTransactions: unauthorized');
        return res.status(401).json({ error: "Unauthorized" });
    }

    console.log('[TRANSACTION] GetMyTransactions: userId', userId);

    const userRepo = RepositoryFactory.getUserRepository();
    const reservationRepo = RepositoryFactory.getReservationRepository();
    const transactionRepo = RepositoryFactory.getTransactionRepository();

    // Get user for matching
    const me = await userRepo.findById(userId);

    // Get user's reservations
    let mine = await reservationRepo.findAll({ userId: String(userId) });

    // Legacy fallback: match by student name/email/id
    if (me) {
      const allReservations = await reservationRepo.findAll({});
      const legacyRows = allReservations.filter(r => {
        if (r.userId) return false;
        const student = String(r.student || "").trim().toLowerCase();
        if (!student) return false;
        const name = String(me.name || "").trim().toLowerCase();
        const email = String(me.email || "").trim().toLowerCase();
        return student === name || student === email || student === String(me.id).toLowerCase();
      });
      mine = [...mine, ...legacyRows];
    }

    const resRows = mine.map(mapReservationToTx);

    // Get persisted transactions
    const myResIds = new Set(mine.map((r) => String(r.id)));

    let persisted = await transactionRepo.findAll({ userId: String(userId) });
    
    // Also get transactions that reference user's reservations
    const refTransactions = [];
    for (const resId of myResIds) {
      const refTx = await transactionRepo.findOne({ ref: resId });
      if (refTx && !persisted.find(t => String(t.id) === String(refTx.id))) {
        refTransactions.push(refTx);
      }
    }
    persisted = [...persisted, ...refTransactions];

    const filteredPersisted = persisted
      .filter((t) => {
        const type = (t.type || t.kind || "").toString().toLowerCase();
        const isTopup = type.includes("topup") || type === "topup" || (t.topupId != null) || type.includes("top-");
        const ref = String(t.ref || t.reference || "").toLowerCase();
        const hasResRef = ref.includes("res-") || ref.startsWith("res-");
        return !isTopup || hasResRef;
      })
      .map((t) => {
        const isTopup = ((t.type || "") + "").toString().toLowerCase().includes("topup") || (t.topupId != null);
        return {
          id: t.id || t.txId || `TX-${Math.random().toString(36).slice(2)}`,
          title: isTopup ? "Top-Up" : (t.title || t.type || "Transaction"),
          createdAt: t.createdAt || t.date || new Date().toISOString(),
          status: t.status || "Success",
          statusLC: String(t.status || "Success").toLowerCase(),
          direction: isTopup ? "credit" : (t.direction || (Number(t.amount || 0) < 0 ? "debit" : "credit")),
          sign: isTopup ? 1 : (Number(t.amount || 0) < 0 ? -1 : 1),
          amount: Math.abs(Number(t.amount || t.value || 0) || 0),
          raw: t,
        };
      });

    const merged = [...filteredPersisted, ...resRows];
    merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    console.log('[TRANSACTION] GetMyTransactions: returning', merged.length, 'transactions for user', userId);
    return res.json({ status: 200, data: merged });
  } catch (err) {
    console.error("[TRANSACTION] getMyTransactions error:", err);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
};

// Alias `mine` to match route import: `const { mine } = require(...);`
exports.mine = exports.getMyTransactions;
