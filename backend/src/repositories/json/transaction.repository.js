const BaseRepository = require('../base.repository');
const { load, save } = require('../../lib/db');

class JsonTransactionRepository extends BaseRepository {
  constructor() {
    super();
    this.collectionName = 'transactions';
  }

  async findById(id) {
    const db = await load();
    const transactions = Array.isArray(db[this.collectionName]) ? db[this.collectionName] : [];
    return transactions.find(t => String(t.id) === String(id)) || null;
  }

  async findAll(query = {}) {
    const db = await load();
    let transactions = Array.isArray(db[this.collectionName]) ? db[this.collectionName] : [];
    
    // Apply filters
    if (query.userId) {
      transactions = transactions.filter(t => String(t.userId) === String(query.userId));
    }
    if (query.type) {
      transactions = transactions.filter(t => String(t.type) === String(query.type));
    }
    if (query.status) {
      transactions = transactions.filter(t => String(t.status) === String(query.status));
    }
    if (query.ref) {
      transactions = transactions.filter(t => 
        String(t.ref || t.refId || t.reference) === String(query.ref)
      );
    }
    if (query.topupId) {
      transactions = transactions.filter(t => String(t.topupId) === String(query.topupId));
    }
    
    return transactions;
  }

  async findOne(query = {}) {
    const db = await load();
    const transactions = Array.isArray(db[this.collectionName]) ? db[this.collectionName] : [];
    
    if (query.id) {
      return transactions.find(t => String(t.id) === String(query.id)) || null;
    }
    if (query.ref && query.type) {
      return transactions.find(t => 
        String(t.ref || t.refId || t.reference) === String(query.ref) &&
        String(t.type) === String(query.type)
      ) || null;
    }
    if (query.topupId && query.type) {
      return transactions.find(t => 
        String(t.topupId) === String(query.topupId) &&
        String(t.type) === String(query.type)
      ) || null;
    }
    
    return null;
  }

  async create(data) {
    const db = await load();
    db[this.collectionName] = Array.isArray(db[this.collectionName]) ? db[this.collectionName] : [];
    
    const id = data.id || `txn_${Date.now().toString(36)}`;
    const transaction = {
      id,
      ...data,
      status: data.status || 'Success',
      createdAt: data.createdAt || new Date().toISOString(),
    };
    
    db[this.collectionName].push(transaction);
    await save(db);
    return transaction;
  }

  async update(id, data) {
    const db = await load();
    db[this.collectionName] = Array.isArray(db[this.collectionName]) ? db[this.collectionName] : [];
    
    const index = db[this.collectionName].findIndex(t => String(t.id) === String(id));
    if (index === -1) return null;
    
    db[this.collectionName][index] = {
      ...db[this.collectionName][index],
      ...data,
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
    const transactions = await this.findAll(query);
    return transactions.length;
  }
}

module.exports = new JsonTransactionRepository();

