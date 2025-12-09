const BaseRepository = require('../base.repository');
const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');
const { normalizeMongoDoc, normalizeMongoDocs, createIdFilter, sanitizeForResponse } = require('../utils/normalize');

class MongoUserRepository extends BaseRepository {
  constructor() {
    super();
    this.collectionName = 'users';
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
    
    if (query.role) {
      mongoQuery.role = query.role;
    }
    if (query.email) {
      mongoQuery.email = String(query.email).toLowerCase().trim();
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
    if (query.email) {
      mongoQuery.email = String(query.email).toLowerCase().trim();
    }
    
    const doc = await col.findOne(mongoQuery);
    return doc ? sanitizeForResponse(normalizeMongoDoc(doc)) : null;
  }

  async create(data) {
    const col = this.getCollection();
    const id = data.id || `usr_${Date.now().toString(36)}`;
    const user = {
      id,
      ...data,
      email: data.email ? data.email.toLowerCase() : data.email,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
    
    const result = await col.insertOne(user);
    const created = await col.findOne({ _id: result.insertedId });
    // If findOne returns null (shouldn't happen, but handle it), return the inserted document
    if (!created) {
      return sanitizeForResponse(normalizeMongoDoc({ ...user, _id: result.insertedId }));
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
    
    if (update.email) {
      update.email = update.email.toLowerCase();
    }
    
    // Update the document
    await col.updateOne(filter, { $set: update });
    
    // Get the updated document
    const updated = await col.findOne(filter);
    return updated ? sanitizeForResponse(normalizeMongoDoc(updated)) : null;
  }

  async delete(id) {
    const col = this.getCollection();
    const filter = createIdFilter(id);
    const result = await col.deleteOne(filter);
    return result.deletedCount > 0;
  }

  async count(query = {}) {
    const col = this.getCollection();
    const mongoQuery = {};
    
    if (query.role) mongoQuery.role = query.role;
    if (query.email) mongoQuery.email = query.email.toLowerCase();
    
    return await col.countDocuments(mongoQuery);
  }

  /**
   * Increment user balance (atomic operation)
   */
  async incrementBalance(userId, amount) {
    const col = this.getCollection();
    const filter = createIdFilter(userId);
    const requestedAmount = Number(amount);
    
    // Use atomic findOneAndUpdate
    const result = await col.findOneAndUpdate(
      filter,
      {
        $inc: { balance: requestedAmount },
        $set: { updatedAt: new Date().toISOString() }
      },
      {
        returnDocument: 'after'
      }
    );
    
    // Handle both old (result.value) and new (result directly) MongoDB driver formats
    const doc = result?.value || result;
    if (!doc) {
      return null; // User not found
    }
    
    return sanitizeForResponse(normalizeMongoDoc(doc));
  }

  /**
   * Decrement user balance (atomic operation with validation)
   */
  async decrementBalance(userId, amount) {
    const col = this.getCollection();
    const filter = createIdFilter(userId);
    const requestedAmount = Number(amount);
    
    // Use atomic findOneAndUpdate with balance validation
    // Only decrement if balance >= amount (prevents negative balance)
    const result = await col.findOneAndUpdate(
      {
        $and: [
          filter,
          { balance: { $gte: requestedAmount } }
        ]
      },
      {
        $inc: { balance: -requestedAmount },
        $set: { updatedAt: new Date().toISOString() }
      },
      {
        returnDocument: 'after'
      }
    );
    
    // Handle both old (result.value) and new (result directly) MongoDB driver formats
    const doc = result?.value || result;
    if (!doc) {
      // Either user not found or insufficient balance
      const existing = await col.findOne(filter);
      if (!existing) {
        return null;  // User not found
      }
      // Insufficient balance
      throw new Error(`Insufficient balance for user ${userId}. Available: ${existing.balance || 0}, Requested: ${requestedAmount}`);
    }
    
    return sanitizeForResponse(normalizeMongoDoc(doc));
  }
}

module.exports = new MongoUserRepository();

