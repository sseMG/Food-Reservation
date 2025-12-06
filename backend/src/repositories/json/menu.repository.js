const BaseRepository = require('../base.repository');
const { load, save } = require('../../lib/db');

class JsonMenuRepository extends BaseRepository {
  constructor() {
    super();
    this.collectionName = 'menu';
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
   * Increment stock
   */
  async incrementStock(id, amount) {
    const item = await this.findById(id);
    if (!item) return null;
    
    const newStock = Number(item.stock || 0) + Number(amount);
    return await this.update(id, { stock: newStock });
  }

  /**
   * Decrement stock
   */
  async decrementStock(id, amount) {
    const item = await this.findById(id);
    if (!item) return null;
    
    const newStock = Math.max(0, Number(item.stock || 0) - Number(amount));
    return await this.update(id, { stock: newStock });
  }
}

module.exports = new JsonMenuRepository();

