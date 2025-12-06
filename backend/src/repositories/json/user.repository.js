const BaseRepository = require('../base.repository');
const { load, save } = require('../../lib/db');
const { Mutex } = require('async-mutex');

class JsonUserRepository extends BaseRepository {
  constructor() {
    super();
    this.collectionName = 'users';
    this.balanceMutex = new Mutex();
  }

  async findById(id) {
    const db = await load();
    const users = Array.isArray(db[this.collectionName]) ? db[this.collectionName] : [];
    return users.find(u => String(u.id) === String(id)) || null;
  }

  async findAll(query = {}) {
    const db = await load();
    let users = Array.isArray(db[this.collectionName]) ? db[this.collectionName] : [];
    
    // Apply filters
    if (query.role) {
      users = users.filter(u => u.role === query.role);
    }
    if (query.email) {
      const emailLower = String(query.email).toLowerCase().trim();
      users = users.filter(u => String(u.email).toLowerCase().trim() === emailLower);
    }
    if (query.studentId) {
      const studentIdStr = String(query.studentId).trim();
      users = users.filter(u => String(u.studentId).trim() === studentIdStr);
    }
    
    return users;
  }

  async findOne(query = {}) {
    const db = await load();
    const users = Array.isArray(db[this.collectionName]) ? db[this.collectionName] : [];
    
    if (query.id) {
      return users.find(u => String(u.id) === String(query.id)) || null;
    }
    if (query.email) {
      const emailLower = String(query.email).toLowerCase().trim();
      return users.find(u => String(u.email).toLowerCase().trim() === emailLower) || null;
    }
    if (query.studentId) {
      const studentIdStr = String(query.studentId).trim();
      return users.find(u => String(u.studentId).trim() === studentIdStr) || null;
    }
    
    return null;
  }

  async create(data) {
    const db = await load();
    db[this.collectionName] = Array.isArray(db[this.collectionName]) ? db[this.collectionName] : [];
    
    const id = data.id || `usr_${Date.now().toString(36)}`;
    const user = {
      id,
      ...data,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
    
    db[this.collectionName].push(user);
    await save(db);
    return user;
  }

  async update(id, data) {
    const db = await load();
    db[this.collectionName] = Array.isArray(db[this.collectionName]) ? db[this.collectionName] : [];
    
    const index = db[this.collectionName].findIndex(u => String(u.id) === String(id));
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
    
    const index = db[this.collectionName].findIndex(u => String(u.id) === String(id));
    if (index === -1) return false;
    
    db[this.collectionName].splice(index, 1);
    await save(db);
    return true;
  }

  async count(query = {}) {
    const users = await this.findAll(query);
    return users.length;
  }

  /**
   * Increment user balance (thread-safe)
   */
  async incrementBalance(userId, amount) {
    const release = await this.balanceMutex.acquire();
    try {
      const db = await load();
      const users = Array.isArray(db[this.collectionName]) ? db[this.collectionName] : [];
      const index = users.findIndex(u => String(u.id) === String(userId));
      
      if (index === -1) return null;
      
      const newBalance = Number(users[index].balance || 0) + Number(amount);
      users[index] = {
        ...users[index],
        balance: newBalance,
        updatedAt: new Date().toISOString(),
      };
      
      await save(db);
      return users[index];
    } finally {
      release();
    }
  }

  /**
   * Decrement user balance (thread-safe with validation)
   */
  async decrementBalance(userId, amount) {
    const release = await this.balanceMutex.acquire();
    try {
      const db = await load();
      const users = Array.isArray(db[this.collectionName]) ? db[this.collectionName] : [];
      const index = users.findIndex(u => String(u.id) === String(userId));
      
      if (index === -1) return null;
      
      const currentBalance = Number(users[index].balance || 0);
      const requestedAmount = Number(amount);
      
      // Prevent negative balance
      if (currentBalance < requestedAmount) {
        throw new Error(`Insufficient balance for user ${userId}. Available: ${currentBalance}, Requested: ${requestedAmount}`);
      }
      
      const newBalance = currentBalance - requestedAmount;
      users[index] = {
        ...users[index],
        balance: newBalance,
        updatedAt: new Date().toISOString(),
      };
      
      await save(db);
      return users[index];
    } finally {
      release();
    }
  }
}

module.exports = new JsonUserRepository();

