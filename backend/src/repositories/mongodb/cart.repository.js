const BaseRepository = require('../base.repository');
const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');
const { normalizeMongoDoc, normalizeMongoDocs, sanitizeForResponse } = require('../utils/normalize');

class MongoCartRepository extends BaseRepository {
  constructor() {
    super();
    this.collectionName = 'carts';
  }

  getCollection() {
    if (mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB not connected');
    }
    return mongoose.connection.db.collection(this.collectionName);
  }

  async findById(id) {
    const col = this.getCollection();
    const doc = await col.findOne({
      $or: [
        { id: String(id) },
        { userId: String(id) },
        { _id: ObjectId.isValid(id) ? new ObjectId(id) : null }
      ]
    });
    return doc ? sanitizeForResponse(normalizeMongoDoc(doc)) : null;
  }

  async findByUserId(userId) {
    const col = this.getCollection();
    const doc = await col.findOne({ userId: String(userId) });
    return doc ? sanitizeForResponse(normalizeMongoDoc(doc)) : null;
  }

  async findAll(query = {}) {
    const col = this.getCollection();
    const mongoQuery = {};
    
    if (query.userId) {
      mongoQuery.userId = String(query.userId);
    }
    
    const docs = await col.find(mongoQuery).toArray();
    return normalizeMongoDocs(docs).map(sanitizeForResponse);
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
    const col = this.getCollection();
    const id = data.id || `cart_${Date.now().toString(36)}`;
    const cart = {
      id,
      userId: String(data.userId),
      items: Array.isArray(data.items) ? data.items : [],
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
    
    const result = await col.insertOne(cart);
    const created = await col.findOne({ _id: result.insertedId });
    // If findOne returns null (shouldn't happen, but handle it), return the inserted document
    if (!created) {
      return sanitizeForResponse(normalizeMongoDoc({ ...cart, _id: result.insertedId }));
    }
    return sanitizeForResponse(normalizeMongoDoc(created));
  }

  async update(id, data) {
    const col = this.getCollection();
    const filter = {
      $or: [
        { id: String(id) },
        { userId: String(id) },
        { _id: ObjectId.isValid(id) ? new ObjectId(id) : null }
      ]
    };
    
    const update = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    
    const result = await col.findOneAndUpdate(
      filter,
      { $set: update },
      { returnDocument: 'after' }
    );
    
    return result.value ? sanitizeForResponse(normalizeMongoDoc(result.value)) : null;
  }

  async updateByUserId(userId, data) {
    const col = this.getCollection();
    const filter = { userId: String(userId) };
    
    // First check if document exists
    const existing = await col.findOne(filter);
    if (!existing) {
      return null;
    }
    
    const update = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    
    // Update the document
    await col.updateOne(filter, { $set: update });
    
    // Get the updated document
    const updated = await col.findOne(filter);
    return updated ? sanitizeForResponse(normalizeMongoDoc(updated)) : null;
  }

  async delete(id) {
    const col = this.getCollection();
    const filter = {
      $or: [
        { id: String(id) },
        { userId: String(id) },
        { _id: ObjectId.isValid(id) ? new ObjectId(id) : null }
      ]
    };
    const result = await col.deleteOne(filter);
    return result.deletedCount > 0;
  }

  async count(query = {}) {
    const col = this.getCollection();
    const mongoQuery = {};
    
    if (query.userId) mongoQuery.userId = String(query.userId);
    
    return await col.countDocuments(mongoQuery);
  }

  /**
   * Add item to cart
   */
  async addItem(userId, item) {
    const col = this.getCollection();
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

module.exports = new MongoCartRepository();

