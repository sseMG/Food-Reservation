const BaseRepository = require('../base.repository');
const { load, save } = require('../../lib/db');

class JsonUserRepository extends BaseRepository {
  constructor() {
    super();
    this.collectionName = 'users';
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
      users = users.filter(u => u.email === query.email);
    }
    if (query.studentId) {
      users = users.filter(u => String(u.studentId) === String(query.studentId));
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
      return users.find(u => String(u.email).toLowerCase() === String(query.email).toLowerCase()) || null;
    }
    if (query.studentId) {
      return users.find(u => String(u.studentId) === String(query.studentId)) || null;
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
   * Increment user balance
   */
  async incrementBalance(userId, amount) {
    const db = await load();
    const user = await this.findById(userId);
    if (!user) return null;
    
    const newBalance = Number(user.balance || 0) + Number(amount);
    return await this.update(userId, { balance: newBalance });
  }

  /**
   * Decrement user balance
   */
  async decrementBalance(userId, amount) {
    const user = await this.findById(userId);
    if (!user) return null;
    
    const newBalance = Math.max(0, Number(user.balance || 0) - Number(amount));
    return await this.update(userId, { balance: newBalance });
  }
}

module.exports = new JsonUserRepository();

