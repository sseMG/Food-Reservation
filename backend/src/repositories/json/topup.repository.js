const BaseRepository = require('../base.repository');
const { load, save } = require('../../lib/db');

class JsonTopupRepository extends BaseRepository {
  constructor() {
    super();
    this.collectionName = 'topups';
  }

  async findById(id) {
    const db = await load();
    const topups = Array.isArray(db[this.collectionName]) ? db[this.collectionName] : [];
    return topups.find(t => String(t.id) === String(id)) || null;
  }

  async findAll(query = {}) {
    const db = await load();
    let topups = Array.isArray(db[this.collectionName]) ? db[this.collectionName] : [];
    
    // Apply filters
    if (query.userId) {
      topups = topups.filter(t => String(t.userId) === String(query.userId));
    }
    if (query.status) {
      topups = topups.filter(t => String(t.status) === String(query.status));
    }
    
    return topups;
  }

  async findOne(query = {}) {
    const db = await load();
    const topups = Array.isArray(db[this.collectionName]) ? db[this.collectionName] : [];
    
    if (query.id) {
      return topups.find(t => String(t.id) === String(query.id)) || null;
    }
    if (query.userId && query.status) {
      return topups.find(t => 
        String(t.userId) === String(query.userId) && 
        String(t.status) === String(query.status)
      ) || null;
    }
    
    return null;
  }

  async create(data) {
    const db = await load();
    db[this.collectionName] = Array.isArray(db[this.collectionName]) ? db[this.collectionName] : [];
    
    const id = data.id || `top_${Date.now().toString(36)}`;
    const topup = {
      id,
      ...data,
      status: data.status || 'Pending',
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
    
    db[this.collectionName].push(topup);
    await save(db);
    return topup;
  }

  async update(id, data) {
    const db = await load();
    db[this.collectionName] = Array.isArray(db[this.collectionName]) ? db[this.collectionName] : [];
    
    const index = db[this.collectionName].findIndex(t => String(t.id) === String(id));
    if (index === -1) return null;
    
    db[this.collectionName][index] = {
      ...db[this.collectionName][index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    
    await save(db);
    return db[this.collectionName][index];
  }

  async delete(id) {
    const db = await load();
    db[this.collectionName] = Array.isArray(db[this.collectionName]) ? db[this.collectionName] : [];
    
    const index = db[this.collectionName].findIndex(t => String(t.id) === String(id));
    if (index === -1) return false;
    
    db[this.collectionName].splice(index, 1);
    await save(db);
    return true;
  }

  async count(query = {}) {
    const topups = await this.findAll(query);
    return topups.length;
  }
}

module.exports = new JsonTopupRepository();

