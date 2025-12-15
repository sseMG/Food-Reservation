const { load, save } = require("../lib/db");

function defaultRules() {
  return {
    ranges: [],
    months: [],
    weekdays: [],
    updatedAt: new Date().toISOString(),
  };
}

function normalizeDateString(v) {
  if (!v) return "";
  const s = String(v).trim();
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function normalizeRange(r) {
  const from = normalizeDateString(r?.from);
  const to = normalizeDateString(r?.to);
  if (!from || !to) return null;
  return from <= to ? { from, to } : { from: to, to: from };
}

function normalizeMonth(m) {
  const year = Number(m?.year);
  const month = Number(m?.month);
  if (!Number.isFinite(year) || !Number.isFinite(month)) return null;
  if (month < 1 || month > 12) return null;
  return { year, month };
}

function normalizeWeekdays(arr) {
  const set = new Set();
  for (const v of Array.isArray(arr) ? arr : []) {
    const n = Number(v);
    if (Number.isFinite(n) && n >= 0 && n <= 6) set.add(n);
  }
  return Array.from(set).sort((a, b) => a - b);
}

function normalizeRules(body) {
  const ranges = (Array.isArray(body?.ranges) ? body.ranges : [])
    .map(normalizeRange)
    .filter(Boolean);

  const months = (Array.isArray(body?.months) ? body.months : [])
    .map(normalizeMonth)
    .filter(Boolean);

  const weekdays = normalizeWeekdays(body?.weekdays);

  return {
    ranges,
    months,
    weekdays,
    updatedAt: new Date().toISOString(),
  };
}

function isDateRestricted(dateStr, rules) {
  const dStr = normalizeDateString(dateStr);
  if (!dStr) return false;

  const d = new Date(dStr);
  if (Number.isNaN(d.getTime())) return false;

  const yyyy = d.getFullYear();
  const mm = d.getMonth() + 1;
  const dow = d.getDay();

  const r = rules || defaultRules();

  if (Array.isArray(r.weekdays) && r.weekdays.includes(dow)) return true;

  if (Array.isArray(r.months)) {
    for (const m of r.months) {
      if (Number(m?.year) === yyyy && Number(m?.month) === mm) return true;
    }
  }

  if (Array.isArray(r.ranges)) {
    for (const rg of r.ranges) {
      const from = normalizeDateString(rg?.from);
      const to = normalizeDateString(rg?.to);
      if (!from || !to) continue;
      if (from <= dStr && dStr <= to) return true;
    }
  }

  return false;
}

async function readRules() {
  const db = await load();
  const stored = db?.reservationDateRestrictions;
  if (stored && typeof stored === "object") {
    return {
      ranges: Array.isArray(stored.ranges) ? stored.ranges : [],
      months: Array.isArray(stored.months) ? stored.months : [],
      weekdays: Array.isArray(stored.weekdays) ? stored.weekdays : [],
      updatedAt: stored.updatedAt || new Date().toISOString(),
    };
  }
  const def = defaultRules();
  db.reservationDateRestrictions = def;
  await save(db);
  return def;
}

exports.get = async (_req, res) => {
  try {
    const rules = await readRules();
    return res.json(rules);
  } catch (e) {
    console.error("[reservationDateRestrictions] get failed", e && e.message);
    return res.status(500).json({ error: "Failed to load reservation date restrictions" });
  }
};

exports.updateAdmin = async (req, res) => {
  try {
    const next = normalizeRules(req.body || {});
    const db = await load();
    db.reservationDateRestrictions = next;
    await save(db);
    return res.json(next);
  } catch (e) {
    console.error("[reservationDateRestrictions] update failed", e && e.message);
    return res.status(500).json({ error: "Failed to update reservation date restrictions" });
  }
};

exports._isDateRestricted = isDateRestricted;
exports._readRules = readRules;
