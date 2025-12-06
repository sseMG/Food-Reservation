const BaseRepository = require('../base.repository');
const { load, save } = require('../../lib/db');
const { Mutex } = require('async-mutex');

class JsonMenuRepository extends BaseRepository {
  constructor() {
    super();
    this.collectionName = 'menu';
    this.stockMutex = new Mutex();
  }

  async findById(id) {
    const db = await load();
    const menu = Array.isArray(db[this.collectionName]) ? db[this.collectionName] : [];
    return menu.find(m => String(m.id) === String(id)) || null;
  }

  async findAll(query = {}) {
    const db = await load();
    let menu = Array.isArray(db[this.collectionName]) ? db[this.collectionName] : [];
    
    // Filter deleted items unless explicitly requested
    if (query.includeDeleted !== 'true') {
      menu = menu.filter(item => !item.deleted);
    }
    
    // Apply other filters
    if (query.category) {
      menu = menu.filter(item => item.category === query.category);
    }
    if (query.visible !== undefined) {
      menu = menu.filter(item => item.visible === query.visible);
    }
    
    return menu;
  }

  async findOne(query = {}) {
    const db = await load();
    const menu = Array.isArray(db[this.collectionName]) ? db[this.collectionName] : [];
    
    if (query.id) {
      return menu.find(m => String(m.id) === String(query.id)) || null;
    }
    if (query.name) {
      return menu.find(m => m.name === query.name) || null;
    }
    
    return null;
  }

  async create(data) {
    const db = await load();
    db[this.collectionName] = Array.isArray(db[this.collectionName]) ? db[this.collectionName] : [];
    
    const id = data.id || `ITM_${Date.now()}`;
    const item = {
      id,
      ...data,
      visible: data.visible !== undefined ? data.visible : true,
      deleted: false,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
    
    db[this.collectionName].push(item);
    await save(db);
    return item;
  }

  async update(id, data) {
    const db = await load();
    db[this.collectionName] = Array.isArray(db[this.collectionName]) ? db[this.collectionName] : [];
    
    const index = db[this.collectionName].findIndex(m => String(m.id) === String(id));
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
    // Soft delete
    return await this.update(id, {
      deleted: true,
      deletedAt: new Date().toISOString(),
      visible: false,
    });
  }

  async count(query = {}) {
    const items = await this.findAll(query);
    return items.length;
  }

  /**
   * Increment stock (thread-safe)
   */
  async incrementStock(id, amount) {
    const release = await this.stockMutex.acquire();
    try {
      const db = await load();
      const menu = Array.isArray(db[this.collectionName]) ? db[this.collectionName] : [];
      const index = menu.findIndex(m => String(m.id) === String(id));
      
      if (index === -1) return null;
      
      const newStock = Number(menu[index].stock || 0) + Number(amount);
      menu[index] = {
        ...menu[index],
        stock: newStock,
        updatedAt: new Date().toISOString(),
      };
      
      await save(db);
      return menu[index];
    } finally {
      release();
    }
  }

  /**
   * Decrement stock (thread-safe with validation)
   */
  async decrementStock(id, amount) {
    const release = await this.stockMutex.acquire();
    try {
      const db = await load();
      const menu = Array.isArray(db[this.collectionName]) ? db[this.collectionName] : [];
      const index = menu.findIndex(m => String(m.id) === String(id));
      
      if (index === -1) return null;
      
      const currentStock = Number(menu[index].stock || 0);
      const requestedAmount = Number(amount);
      
      // Prevent overselling: check if we have enough stock
      if (currentStock < requestedAmount) {
        throw new Error(`Insufficient stock for item ${id}. Available: ${currentStock}, Requested: ${requestedAmount}`);
      }
      
      const newStock = currentStock - requestedAmount;
      menu[index] = {
        ...menu[index],
        stock: newStock,
        updatedAt: new Date().toISOString(),
      };
      
      await save(db);
      return menu[index];
    } finally {
      release();
    }
  }
}

module.exports = new JsonMenuRepository();

