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
      mongoQuery.email = query.email.toLowerCase();
    }
    if (query.studentId) {
      mongoQuery.studentId = String(query.studentId);
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
      mongoQuery.email = query.email.toLowerCase();
    }
    if (query.studentId) {
      mongoQuery.studentId = String(query.studentId);
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
    return sanitizeForResponse(normalizeMongoDoc(created));
  }

  async update(id, data) {
    const col = this.getCollection();
    const filter = createIdFilter(id);
    
    const update = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    
    if (update.email) {
      update.email = update.email.toLowerCase();
    }
    
    const result = await col.findOneAndUpdate(
      filter,
      { $set: update },
      { returnDocument: 'after' }
    );
    
    return result.value ? sanitizeForResponse(normalizeMongoDoc(result.value)) : null;
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
    if (query.studentId) mongoQuery.studentId = String(query.studentId);
    
    return await col.countDocuments(mongoQuery);
  }

  /**
   * Increment user balance
   */
  async incrementBalance(userId, amount) {
    const col = this.getCollection();
    const filter = createIdFilter(userId);
    const result = await col.findOneAndUpdate(
      filter,
      { $inc: { balance: Number(amount) } },
      { returnDocument: 'after' }
    );
    return result.value ? sanitizeForResponse(normalizeMongoDoc(result.value)) : null;
  }

  /**
   * Decrement user balance
   */
  async decrementBalance(userId, amount) {
    const col = this.getCollection();
    const filter = createIdFilter(userId);
    
    // First get current balance to ensure it doesn't go negative
    const user = await col.findOne(filter);
    if (!user) return null;
    
    const currentBalance = Number(user.balance || 0);
    const newBalance = Math.max(0, currentBalance - Number(amount));
    
    const result = await col.findOneAndUpdate(
      filter,
      { $set: { balance: newBalance } },
      { returnDocument: 'after' }
    );
    return result.value ? sanitizeForResponse(normalizeMongoDoc(result.value)) : null;
  }
}

module.exports = new MongoUserRepository();

