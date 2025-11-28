const BaseRepository = require('../base.repository');
const { load, save } = require('../../lib/db');
const { DEFAULT_CATEGORIES } = require('../../constants/categories');

function normalizeName(name) {
  return String(name || '').trim();
}

function toKey(name) {
  return normalizeName(name).toLowerCase();
}

class JsonCategoryRepository extends BaseRepository {
  constructor() {
    super();
    this.collectionName = 'food_categories';
  }

  async findAll() {
    const db = await load();
    db[this.collectionName] = Array.isArray(db[this.collectionName]) ? db[this.collectionName] : [];

    // Migrate older string-format category arrays to object format { name, iconID }
    let changed = false;
    if (db[this.collectionName].length > 0 && typeof db[this.collectionName][0] === 'string') {
      db[this.collectionName] = db[this.collectionName].map((n, i) => ({ iconID: i, name: normalizeName(n) }));
      changed = true;
    }

    // Ensure objects have id and normalized name
    const existingIconIDs = new Set();
    db[this.collectionName] = db[this.collectionName].map((c, i) => {
      if (typeof c === 'string') c = { iconID: i, name: normalizeName(c) };
      // migrate legacy id -> iconID if present
      if (typeof c.id === 'number' && typeof c.iconID !== 'number') c.iconID = c.id;
      return {
        iconID: typeof c.iconID === 'number' ? c.iconID : i,
        name: normalizeName(c.name),
      };
    });
    db[this.collectionName].forEach(c => existingIconIDs.add(c.iconID));
    if (changed) await save(db);
    db[this.collectionName] = db[this.collectionName].sort((a, b) => a.iconID - b.iconID);
    return db[this.collectionName];
  }

  async create(data) {
    const name = normalizeName(data && data.name);
    if (!name) throw new Error('Category name is required');
    if (data && typeof data.iconID !== 'undefined') {
      if (!Number.isInteger(data.iconID) || data.iconID < 0) throw new Error('iconID must be a non-negative integer');
    }
    const db = await load();
    db[this.collectionName] = Array.isArray(db[this.collectionName]) ? db[this.collectionName] : [];

    // Normalize storage to objects and migrate legacy id -> iconID
    db[this.collectionName] = db[this.collectionName].map((c, i) => {
      if (typeof c === 'string') return { iconID: i, name: normalizeName(c) };
      if (typeof c.id === 'number' && typeof c.iconID !== 'number') c.iconID = c.id;
      return { iconID: (typeof c.iconID === 'number' ? c.iconID : i), name: normalizeName(c.name) };
    });

    const existingKeys = new Set(db[this.collectionName].map((c) => toKey(c.name)));
    if (existingKeys.has(toKey(name))) {
      return { iconID: db[this.collectionName].find((c) => toKey(c.name) === toKey(name)).iconID, name };
    }
    const nextIconID = db[this.collectionName].length > 0 ? Math.max(...db[this.collectionName].map((c) => c.iconID)) + 1 : 0;
    const validatedIconID = (typeof data.iconID === 'number' && Number.isInteger(data.iconID) && data.iconID >= 0) ? data.iconID : nextIconID;
    const newItem = { iconID: validatedIconID, name };
    db[this.collectionName].push(newItem);
    await save(db);
    return newItem;
  }

  async delete(name) {
    const target = normalizeName(name);
    if (!target) return false;
    const db = await load();
    db[this.collectionName] = Array.isArray(db[this.collectionName]) ? db[this.collectionName] : [];
    db[this.collectionName] = db[this.collectionName].map((c, i) => {
      if (typeof c === 'string') return { iconID: i, name: normalizeName(c) };
      if (typeof c.id === 'number' && typeof c.iconID !== 'number') c.iconID = c.id;
      return { iconID: (typeof c.iconID === 'number' ? c.iconID : i), name: normalizeName(c.name) };
    });
    const next = db[this.collectionName].filter((c) => toKey(c.name) !== toKey(target));
    const changed = next.length !== db[this.collectionName].length;
    if (changed) {
      db[this.collectionName] = next;
      await save(db);
    }
    return changed;
  }

  async rename(oldName, newName, newIconID) {
    const from = normalizeName(oldName);
    const to = normalizeName(newName);
    if (!from || !to) throw new Error('Both current and new category names are required');
    const db = await load();
    db[this.collectionName] = Array.isArray(db[this.collectionName]) ? db[this.collectionName] : [];
    db[this.collectionName] = db[this.collectionName].map((c, i) => {
      if (typeof c === 'string') return { iconID: i, name: normalizeName(c) };
      if (typeof c.id === 'number' && typeof c.iconID !== 'number') c.iconID = c.id;
      return { iconID: (typeof c.iconID === 'number' ? c.iconID : i), name: normalizeName(c.name) };
    });
    if (!db[this.collectionName].some((c) => toKey(c.name) === toKey(from))) {
      throw new Error('Category not found');
    }
    // Only check for duplicates if the name is actually changing
    if (toKey(from) !== toKey(to) && db[this.collectionName].some((c) => toKey(c.name) === toKey(to))) {
      throw new Error('Category already exists');
    }
    if (typeof newIconID !== 'undefined' && (!Number.isInteger(newIconID) || newIconID < 0)) {
      throw new Error('iconID must be a non-negative integer');
    }
    db[this.collectionName] = db[this.collectionName].map((c) => {
      if (toKey(c.name) === toKey(from)) {
        const obj = { iconID: c.iconID, name: to };
        if (typeof newIconID === 'number' && Number.isInteger(newIconID) && newIconID >= 0) obj.iconID = newIconID;
        return obj;
      }
      return { iconID: c.iconID, name: normalizeName(c.name) };
    });
    await save(db);
    return to;
  }

  async ensureDefaults(defaults = DEFAULT_CATEGORIES) {
    const db = await load();
    db[this.collectionName] = Array.isArray(db[this.collectionName]) ? db[this.collectionName] : [];
    db[this.collectionName] = db[this.collectionName].map((c, i) => {
      if (typeof c === 'string') return { iconID: i, name: normalizeName(c) };
      if (typeof c.id === 'number' && typeof c.iconID !== 'number') c.iconID = c.id;
      return { iconID: (typeof c.iconID === 'number' ? c.iconID : i), name: normalizeName(c.name) };
    });
    const existingKeys = new Set(db[this.collectionName].map((c) => toKey(c.name)));
    let changed = false;
    for (let i = 0; i < defaults.length; i++) {
      const def = defaults[i];
      const norm = normalizeName(def);
      if (!norm) continue;
      const key = toKey(norm);
      if (existingKeys.has(key)) {
        // update existing default category iconID to reserved index
        db[this.collectionName] = db[this.collectionName].map((c) => (toKey(c.name) === key ? { iconID: i, name: c.name } : c));
        changed = true;
      } else {
        db[this.collectionName].push({ iconID: i, name: norm });
        existingKeys.add(key);
        changed = true;
      }
    }
    if (changed) {
      await save(db);
    }
    db[this.collectionName] = db[this.collectionName].sort((a, b) => a.iconID - b.iconID);
    return db[this.collectionName];
  }
}

module.exports = new JsonCategoryRepository();


