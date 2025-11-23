const BaseRepository = require('../base.repository');
const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');
const { normalizeMongoDoc, normalizeMongoDocs, createIdFilter, sanitizeForResponse } = require('../utils/normalize');

class MongoNotificationRepository extends BaseRepository {
  constructor() {
    super();
    this.collectionName = 'notifications';
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
    
    if (query.for) {
      mongoQuery.for = String(query.for);
    }
    if (query.read !== undefined) {
      mongoQuery.read = query.read;
    }
    if (query.type) {
      mongoQuery.type = String(query.type);
    }
    
    const docs = await col.find(mongoQuery).sort({ createdAt: -1 }).toArray();
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
    
    const doc = await col.findOne(mongoQuery);
    return doc ? sanitizeForResponse(normalizeMongoDoc(doc)) : null;
  }

  async create(data) {
    const col = this.getCollection();
    const id = data.id || `notif_${Date.now().toString(36)}`;
    const notification = {
      id,
      for: data.for || 'admin',
      actor: data.actor || null,
      type: data.type || 'misc',
      title: data.title || '',
      body: data.body || '',
      data: data.data || null,
      read: data.read || false,
      createdAt: data.createdAt || new Date().toISOString(),
    };
    
    const result = await col.insertOne(notification);
    const created = await col.findOne({ _id: result.insertedId });
    return sanitizeForResponse(normalizeMongoDoc(created));
  }

  async update(id, data) {
    const col = this.getCollection();
    const filter = createIdFilter(id);
    
    const result = await col.findOneAndUpdate(
      filter,
      { $set: data },
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
    
    if (query.for) mongoQuery.for = String(query.for);
    if (query.read !== undefined) mongoQuery.read = query.read;
    if (query.type) mongoQuery.type = String(query.type);
    
    return await col.countDocuments(mongoQuery);
  }

  /**
   * Mark multiple notifications as read
   */
  async markManyRead(ids, forUser = null) {
    const col = this.getCollection();
    const mongoQuery = { id: { $in: ids.map(String) } };
    if (forUser) {
      mongoQuery.for = String(forUser);
    }
    
    const result = await col.updateMany(
      mongoQuery,
      { $set: { read: true } }
    );
    return result.modifiedCount;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllRead(forUser) {
    const col = this.getCollection();
    const result = await col.updateMany(
      { for: String(forUser), read: false },
      { $set: { read: true } }
    );
    return result.modifiedCount;
  }
}

module.exports = new MongoNotificationRepository();

