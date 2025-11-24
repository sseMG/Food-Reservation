const BaseRepository = require('../base.repository');
const { load, save } = require('../../lib/db');

class JsonCartRepository extends BaseRepository {
  constructor() {
    super();
    this.collectionName = 'carts';
  }

  async findById(id) {
    const db = await load();
    const carts = Array.isArray(db[this.collectionName]) ? db[this.collectionName] : [];
    return carts.find(c => String(c.id || c.userId) === String(id)) || null;
  }

  async findByUserId(userId) {
    const db = await load();
    const carts = Array.isArray(db[this.collectionName]) ? db[this.collectionName] : [];
    return carts.find(c => String(c.userId) === String(userId)) || null;
  }

  async findAll(query = {}) {
    const db = await load();
    let carts = Array.isArray(db[this.collectionName]) ? db[this.collectionName] : [];
    
    if (query.userId) {
      carts = carts.filter(c => String(c.userId) === String(query.userId));
    }
    
    return carts;
  }

  async findOne(query = {}) {
    if (query.userId) {
      return await this.findByUserId(query.userId);
    }
    if (query.id) {
      return await this.findById(query.id);
    }
    return null;
  }

  async create(data) {
    const db = await load();
    db[this.collectionName] = Array.isArray(db[this.collectionName]) ? db[this.collectionName] : [];
    
    const id = data.id || `cart_${Date.now().toString(36)}`;
    const cart = {
      id,
      userId: data.userId,
      items: Array.isArray(data.items) ? data.items : [],
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
    
    db[this.collectionName].push(cart);
    await save(db);
    return cart;
  }

  async update(id, data) {
    const db = await load();
    db[this.collectionName] = Array.isArray(db[this.collectionName]) ? db[this.collectionName] : [];
    
    const index = db[this.collectionName].findIndex(c => 
      String(c.id || c.userId) === String(id)
    );
    if (index === -1) return null;
    
    db[this.collectionName][index] = {
      ...db[this.collectionName][index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    
    await save(db);
    return db[this.collectionName][index];
  }

  async updateByUserId(userId, data) {
    const cart = await this.findByUserId(userId);
    if (!cart) return null;
    return await this.update(cart.id, data);
  }

  async delete(id) {
    const db = await load();
    db[this.collectionName] = Array.isArray(db[this.collectionName]) ? db[this.collectionName] : [];
    
    const index = db[this.collectionName].findIndex(c => 
      String(c.id || c.userId) === String(id)
    );
    if (index === -1) return false;
    
    db[this.collectionName].splice(index, 1);
    await save(db);
    return true;
  }

  async count(query = {}) {
    const carts = await this.findAll(query);
    return carts.length;
  }

  /**
   * Add item to cart
   */
  async addItem(userId, item) {
    let cart = await this.findByUserId(userId);
    
    if (!cart) {
      cart = await this.create({ userId, items: [] });
    }
    
    const items = cart.items || [];
    const existingIndex = items.findIndex(it => String(it.itemId) === String(item.itemId));
    
    if (existingIndex >= 0) {
      items[existingIndex].qty = (items[existingIndex].qty || 0) + (item.qty || 1);
    } else {
      items.push({
        itemId: String(item.itemId),
        qty: item.qty || 1,
        name: item.name || '',
        price: item.price || 0,
      });
    }
    
    return await this.updateByUserId(userId, { items });
  }

  /**
   * Update item quantity in cart
   */
  async updateItem(userId, itemId, qty) {
    const cart = await this.findByUserId(userId);
    if (!cart) return null;
    
    const items = cart.items || [];
    const index = items.findIndex(it => String(it.itemId) === String(itemId));
    
    if (index === -1) return null;
    
    if (qty <= 0) {
      items.splice(index, 1);
    } else {
      items[index].qty = qty;
    }
    
    return await this.updateByUserId(userId, { items });
  }

  /**
   * Remove item from cart
   */
  async removeItem(userId, itemId) {
    return await this.updateItem(userId, itemId, 0);
  }

  /**
   * Clear cart
   */
  async clear(userId) {
    return await this.updateByUserId(userId, { items: [] });
  }
}

module.exports = new JsonCartRepository();

