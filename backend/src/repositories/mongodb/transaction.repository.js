const BaseRepository = require('../base.repository');
const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');
const { normalizeMongoDoc, normalizeMongoDocs, createIdFilter, sanitizeForResponse } = require('../utils/normalize');

class MongoTransactionRepository extends BaseRepository {
  constructor() {
    super();
    this.collectionName = 'transactions';
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
    
    if (query.userId) {
      mongoQuery.userId = String(query.userId);
    }
    if (query.type) {
      mongoQuery.type = String(query.type);
    }
    if (query.status) {
      mongoQuery.status = String(query.status);
    }
    if (query.ref) {
      mongoQuery.$or = [
        { ref: String(query.ref) },
        { refId: String(query.ref) },
        { reference: String(query.ref) }
      ];
    }
    if (query.topupId) {
      mongoQuery.topupId = String(query.topupId);
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
    if (query.ref && query.type) {
      mongoQuery.$or = [
        { ref: String(query.ref) },
        { refId: String(query.ref) },
        { reference: String(query.ref) }
      ];
      mongoQuery.type = String(query.type);
    }
    if (query.topupId && query.type) {
      mongoQuery.topupId = String(query.topupId);
      mongoQuery.type = String(query.type);
    }
    
    const doc = await col.findOne(mongoQuery);
    return doc ? sanitizeForResponse(normalizeMongoDoc(doc)) : null;
  }

  async create(data) {
    const col = this.getCollection();
    const id = data.id || `txn_${Date.now().toString(36)}`;
    const transaction = {
      id,
      ...data,
      status: data.status || 'Success',
      createdAt: data.createdAt || new Date().toISOString(),
    };
    
    const result = await col.insertOne(transaction);
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
    
    if (query.userId) mongoQuery.userId = String(query.userId);
    if (query.type) mongoQuery.type = String(query.type);
    if (query.status) mongoQuery.status = String(query.status);
    
    return await col.countDocuments(mongoQuery);
  }
}

module.exports = new MongoTransactionRepository();

