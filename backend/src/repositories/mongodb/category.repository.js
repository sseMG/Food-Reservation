const BaseRepository = require('../base.repository');
const mongoose = require('mongoose');
const { DEFAULT_CATEGORIES } = require('../../constants/categories');

function normalizeName(name) {
  return String(name || '').trim();
}

function toKey(name) {
  return normalizeName(name).toLowerCase();
}

class MongoCategoryRepository extends BaseRepository {
  constructor() {
    super();
    this.collectionName = 'food_categories';
  }

  getCollection() {
    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB not connected');
    }
    return mongoose.connection.db.collection(this.collectionName);
  }

  async findAll() {
    const col = this.getCollection();
    const docs = await col.find({}).sort({ iconID: 1 }).toArray();

    // Migrate documents that do not have numeric id to have one, and remove legacy fields
    let nextIconID = 0;
    for (const d of docs) {
      // migrate legacy id -> iconID or track max iconID
      if (typeof d.iconID === 'number' && d.iconID >= nextIconID) {
        nextIconID = d.iconID + 1;
      } else if (typeof d.id === 'number' && d.id >= nextIconID) {
        nextIconID = d.id + 1;
      }
    }
    const updates = [];
    for (const d of docs) {
      if (typeof d.iconID !== 'number') {
        const assignIconID = nextIconID++;
        updates.push({ filter: { _id: d._id }, update: { $set: { iconID: assignIconID, name: normalizeName(d.name) }, $unset: { id: '', key: '', createdAt: '', updatedAt: '' } } });
      } else if (d.name !== normalizeName(d.name)) {
        updates.push({ filter: { _id: d._id }, update: { $set: { name: normalizeName(d.name) } } });
      }
    }
    if (updates.length > 0) {
      await Promise.all(updates.map(u => col.updateOne(u.filter, u.update)));
    }
    const migrated = await col.find({}).sort({ iconID: 1 }).toArray();
    return migrated.map((doc) => ({ iconID: doc.iconID, name: doc.name })).filter((c) => c && c.name);
  }

  async create(data) {
    const name = normalizeName(data && data.name);
    if (!name) throw new Error('Category name is required');
    const col = this.getCollection();
    if (data && typeof data.iconID !== 'undefined') {
      if (!Number.isInteger(data.iconID) || data.iconID < 0) throw new Error('iconID must be a non-negative integer');
    }
    // Check for existing category by name (case-insensitive)
    function escapeRegex(str) { return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
    const existing = await col.findOne({ name: { $regex: `^${escapeRegex(name)}$`, $options: 'i' } });
    if (existing) return { iconID: existing.iconID, name: existing.name };

    // Compute next numeric id
    const max = await col.find({}, { projection: { iconID: 1 } }).sort({ iconID: -1 }).limit(1).toArray();
    const nextIconID = (max && max.length > 0 && typeof max[0].iconID === 'number') ? max[0].iconID + 1 : 0;
    const validatedIconID = (typeof data.iconID === 'number' && Number.isInteger(data.iconID) && data.iconID >= 0) ? data.iconID : nextIconID;
    const inserted = await col.insertOne({ iconID: validatedIconID, name });
    return { iconID: validatedIconID, name };
  }

  async delete(name) {
    const target = normalizeName(name);
    if (!target) return false;
    const col = this.getCollection();
    function escapeRegex(str) { return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
    const res = await col.deleteOne({ name: { $regex: `^${escapeRegex(target)}$`, $options: 'i' } });
    return res.deletedCount > 0;
  }

  async rename(oldName, newName, newIconID) {
    const from = normalizeName(oldName);
    const to = normalizeName(newName);
    if (!from || !to) throw new Error('Both current and new category names are required');
    const col = this.getCollection();
    function escapeRegex(str) { return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
    const existing = await col.findOne({ name: { $regex: `^${escapeRegex(from)}$`, $options: 'i' } });
    if (!existing) {
      throw new Error('Category not found');
    }
    const duplicate = await col.findOne({ name: { $regex: `^${escapeRegex(to)}$`, $options: 'i' } });
    if (duplicate) {
      throw new Error('Category already exists');
    }
    const updateObj = { name: to };
    if (typeof newIconID !== 'undefined') {
      if (!Number.isInteger(newIconID) || newIconID < 0) throw new Error('iconID must be a non-negative integer');
      updateObj.iconID = newIconID;
    }
    await col.updateOne({ _id: existing._id }, { $set: updateObj });
    return to;
  }

  async ensureDefaults(defaults = DEFAULT_CATEGORIES) {
    const col = this.getCollection();
    const existingDocs = await col.find({}, { projection: { iconID: 1, name: 1 } }).toArray();
    const existingKeys = new Map(existingDocs.map((doc) => [String(doc.name || '').trim().toLowerCase(), doc]));
    const docsToInsert = [];
    let maxIconID = existingDocs.reduce((max, d) => (typeof d.iconID === 'number' && d.iconID > max ? d.iconID : max), -1);
    for (let i = 0; i < defaults.length; i++) {
      const def = defaults[i];
      const norm = normalizeName(def);
      if (!norm) continue;
      const key = toKey(norm);
      if (existingKeys.has(key)) {
        // ensure the default category gets reserved iconID = i
        const doc = existingKeys.get(key);
        if (doc.iconID !== i) {
          await col.updateOne({ name: doc.name }, { $set: { iconID: i } });
        }
      } else {
        // insert with iconID as reserved index
        docsToInsert.push({ iconID: i, name: norm });
        existingKeys.set(key, { iconID: i, name: norm });
        if (i > maxIconID) maxIconID = i;
      }
    }
    if (docsToInsert.length > 0) {
      await col.insertMany(docsToInsert);
    }
    return this.findAll();
  }
}

module.exports = new MongoCategoryRepository();


