// server/src/lib/db.js
const fs = require("fs");
const path = require("path");
const { DEFAULT_CATEGORIES } = require("../constants/categories");
const DB = path.join(__dirname, "..", "data", "db.json");

function readRaw() {
  try {
    return fs.readFileSync(DB, "utf8");
  } catch (err) {
    return null;
  }
}

function save(obj) {
  fs.writeFileSync(DB, JSON.stringify(obj, null, 2), "utf8");
}

function load() {
  let data = { users: [], menu: [], reservations: [], topups: [], transactions: [], notifications: [], carts: [], food_categories: [] };
  const raw = readRaw();
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch (err) {
      console.error("[DB] invalid db.json, starting with empty DB", err && err.message);
    }
  }

  data.users = Array.isArray(data.users) ? data.users : [];
  data.menu = Array.isArray(data.menu) ? data.menu : [];
  data.reservations = Array.isArray(data.reservations) ? data.reservations : [];
  data.topups = Array.isArray(data.topups) ? data.topups : [];
  data.transactions = Array.isArray(data.transactions) ? data.transactions : [];
  data.notifications = Array.isArray(data.notifications) ? data.notifications : [];
  data.carts = Array.isArray(data.carts) ? data.carts : [];
  data.food_categories = Array.isArray(data.food_categories) ? data.food_categories : [];

  const catSeen = new Set();
  const normalizedCategories = [];
  // Gather existing iconIDs and map values; migrate legacy `id` -> `iconID`.
  let maxIconID = -1;
  for (const c of data.food_categories) {
    let name = typeof c === 'string' ? String(c || '').trim() : (c && String(c.name || '').trim());
    if (!name) continue;
    const key = name.toLowerCase();
    if (catSeen.has(key)) continue;
    catSeen.add(key);
    let iconID = null;
    if (c && typeof c.iconID === 'number') {
      iconID = c.iconID;
    } else if (c && typeof c.id === 'number') {
      // migrate older id field to iconID
      iconID = c.id;
    }
    if (typeof iconID === 'number' && iconID > maxIconID) maxIconID = iconID;
    normalizedCategories.push({ name, iconID });
  }
  // Ensure default categories (reserved icons 0..n)
  for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
    const def = DEFAULT_CATEGORIES[i];
    const norm = String(def || '').trim();
    if (!norm) continue;
    const key = norm.toLowerCase();
    if (catSeen.has(key)) {
      // overwrite iconID for default categories so they keep expected indices
      for (const obj of normalizedCategories) {
        if (obj.name.toLowerCase() === key) {
          obj.iconID = i;
        }
      }
    } else {
      catSeen.add(key);
      normalizedCategories.push({ name: norm, iconID: i });
    }
    if (i > maxIconID) maxIconID = i;
  }
  // Assign iconID to entries that are missing it
  for (const obj of normalizedCategories) {
    if (typeof obj.iconID !== 'number') {
      obj.iconID = ++maxIconID;
    }
  }
  data.food_categories = normalizedCategories;

  // --- migration: ensure studentId for all users ---
  const used = new Set();
  for (const u of data.users) {
    if (u && u.studentId) used.add(String(u.studentId).trim());
  }

  const genUnique9 = () => {
    let id;
    let attempts = 0;
    do {
      const num = Math.floor(100000000 + Math.random() * 900000000); // 9-digit
      id = String(num).padStart(9, "0");
      attempts++;
      if (attempts > 10000) break;
    } while (used.has(id));
    used.add(id);
    return id;
  };

  // try to assign preferred admin id
  for (const u of data.users) {
    if (u && (u.role === "admin" || String(u.email || "").toLowerCase().includes("admin"))) {
      if (!u.studentId) {
        const preferred = "000000001";
        if (!used.has(preferred)) {
          u.studentId = preferred;
          used.add(preferred);
        } else {
          u.studentId = genUnique9();
        }
      } else {
        u.studentId = String(u.studentId).trim();
      }
    }
  }

  // assign for remaining users
  for (const u of data.users) {
    if (!u.studentId) {
      u.studentId = genUnique9();
    } else {
      u.studentId = String(u.studentId).trim();
      if (!used.has(u.studentId)) used.add(u.studentId);
    }
  }

  // --- migration: populate topups' studentId from user records when possible ---
  const usersById = {};
  for (const u of data.users) {
    if (u && u.id) usersById[String(u.id)] = u;
  }
  let topupsChanged = false;
  for (const t of data.topups) {
    if (!t) continue;
    // prefer existing explicit studentId, else resolve by userId
    if (!t.studentId || t.studentId === "N/A") {
      if (t.userId && usersById[t.userId] && usersById[t.userId].studentId) {
        t.studentId = usersById[t.userId].studentId;
        topupsChanged = true;
      }
    } else {
      // normalize string
      t.studentId = String(t.studentId);
    }
  }

  // persist migration changes if any
  if (topupsChanged || true) {
    // always persist user studentId normalization/creation
    try {
      fs.writeFileSync(DB, JSON.stringify(data, null, 2), "utf8");
    } catch (err) {
      console.error("[DB] failed to save db.json after migration", err && err.message);
    }
  }

  return data;
}

module.exports = { load, save };
