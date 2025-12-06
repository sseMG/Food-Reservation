const BaseRepository = require('../base.repository');
const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');
const { normalizeMongoDoc, normalizeMongoDocs, createIdFilter, sanitizeForResponse } = require('../utils/normalize');

class MongoMenuRepository extends BaseRepository {
  constructor() {
    super();
    this.collectionName = 'menu';
  }

  getCollection() {
    if (mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB not connected');
    }
    return mongoose.connection.db.collection(this.collectionName);
  }

  async findById(id) {
    const col = this.getCollection();
    const filter = createIdFilter(id);
    const doc = await col.findOne(filter);
    return doc ? sanitizeForResponse(normalizeMongoDoc(doc)) : null;
  }

  async findAll(query = {}) {
    const col = this.getCollection();
    const mongoQuery = {};
    
    // Filter deleted items unless explicitly requested
    if (query.includeDeleted !== 'true') {
      mongoQuery.deleted = { $ne: true };
    }
    
    if (query.category) {
      mongoQuery.category = query.category;
    }
    if (query.visible !== undefined) {
      mongoQuery.visible = query.visible;
    }
    
    const docs = await col.find(mongoQuery).toArray();
    return normalizeMongoDocs(docs).map(sanitizeForResponse);
  }

  async findOne(query = {}) {
    const col = this.getCollection();
    const mongoQuery = {};
    
    if (query.id) {
      const filter = createIdFilter(query.id);
      const doc = await col.findOne(filter);
      return doc ? sanitizeForResponse(normalizeMongoDoc(doc)) : null;
    }
    if (query.name) {
      mongoQuery.name = query.name;
    }
    
    const doc = await col.findOne(mongoQuery);
    return doc ? sanitizeForResponse(normalizeMongoDoc(doc)) : null;
  }

  async create(data) {
    const col = this.getCollection();
    // Generate id if not provided
    const id = data.id || `ITM_${Date.now()}`;
    const item = {
      id,
      ...data,
      visible: data.visible !== undefined ? data.visible : true,
      deleted: false,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
    
    const result = await col.insertOne(item);
    const created = await col.findOne({ _id: result.insertedId });
    // If findOne returns null (shouldn't happen, but handle it), return the inserted document
    if (!created) {
      return sanitizeForResponse(normalizeMongoDoc({ ...item, _id: result.insertedId }));
    }
    return sanitizeForResponse(normalizeMongoDoc(created));
  }

  async update(id, data) {
    const col = this.getCollection();
    const filter = createIdFilter(id);
    
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
    // Soft delete
    return await this.update(id, {
      deleted: true,
      deletedAt: new Date().toISOString(),
      visible: false,
    });
  }

  async count(query = {}) {
    const col = this.getCollection();
    const mongoQuery = {};
    
    if (query.includeDeleted !== 'true') {
      mongoQuery.deleted = { $ne: true };
    }
    if (query.category) mongoQuery.category = query.category;
    if (query.visible !== undefined) mongoQuery.visible = query.visible;
    
    return await col.countDocuments(mongoQuery);
  }

  /**
   * Increment stock (atomic operation)
   */
  async incrementStock(id, amount) {
    const col = this.getCollection();
    const filter = createIdFilter(id);
    const requestedAmount = Number(amount);
    
    // Use atomic findOneAndUpdate
    const result = await col.findOneAndUpdate(
      filter,
      {
        $inc: { stock: requestedAmount },
        $set: { updatedAt: new Date().toISOString() }
      },
      {
        returnDocument: 'after'
      }
    );
    
    // Handle both old (result.value) and new (result directly) MongoDB driver formats
    const doc = result?.value || result;
    if (!doc) {
      return null; // Item not found
    }
    
    return sanitizeForResponse(normalizeMongoDoc(doc));
  }

  /**
   * Decrement stock (atomic operation with validation)
   */
  async decrementStock(id, amount) {
    const col = this.getCollection();
    const filter = createIdFilter(id);
    const requestedAmount = Number(amount);
    
    // Use atomic findOneAndUpdate with stock validation
    // Only decrement if stock >= amount (prevents overselling)
    const result = await col.findOneAndUpdate(
      {
        $and: [
          filter,
          { stock: { $gte: requestedAmount } }
        ]
      },
      {
        $inc: { stock: -requestedAmount },
        $set: { updatedAt: new Date().toISOString() }
      },
      {
        returnDocument: 'after'
      }
    );
    
    // Handle both old (result.value) and new (result directly) MongoDB driver formats
    const doc = result?.value || result;
    if (!doc) {
      // Either item not found or insufficient stock
      const existing = await col.findOne(filter);
      if (!existing) {
        return null;  // Item not found
      }
      // Insufficient stock
      throw new Error(`Insufficient stock for item ${id}. Available: ${existing.stock || 0}, Requested: ${requestedAmount}`);
    }
    
    return sanitizeForResponse(normalizeMongoDoc(doc));
  }
}

module.exports = new MongoMenuRepository();

