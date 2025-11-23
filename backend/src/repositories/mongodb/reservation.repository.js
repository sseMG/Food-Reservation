const BaseRepository = require('../base.repository');
const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');
const { normalizeMongoDoc, normalizeMongoDocs, createIdFilter, sanitizeForResponse } = require('../utils/normalize');

class MongoReservationRepository extends BaseRepository {
  constructor() {
    super();
    this.collectionName = 'reservations';
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
    if (query.status) {
      mongoQuery.status = String(query.status);
    }
    if (query.student) {
      mongoQuery.student = { $regex: new RegExp(query.student, 'i') };
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
    if (query.userId) {
      mongoQuery.userId = String(query.userId);
    }
    if (query.status) {
      mongoQuery.status = String(query.status);
    }
    
    const doc = await col.findOne(mongoQuery);
    return doc ? sanitizeForResponse(normalizeMongoDoc(doc)) : null;
  }

  async create(data) {
    const col = this.getCollection();
    const id = data.id || `RES_${Date.now().toString(36)}${Math.floor(Math.random() * 900 + 100).toString(36)}`;
    const reservation = {
      id,
      ...data,
      status: data.status || 'Pending',
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
    
    const result = await col.insertOne(reservation);
    const created = await col.findOne({ _id: result.insertedId });
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
    const col = this.getCollection();
    const filter = createIdFilter(id);
    const result = await col.deleteOne(filter);
    return result.deletedCount > 0;
  }

  async count(query = {}) {
    const col = this.getCollection();
    const mongoQuery = {};
    
    if (query.userId) mongoQuery.userId = String(query.userId);
    if (query.status) mongoQuery.status = String(query.status);
    
    return await col.countDocuments(mongoQuery);
  }
}

module.exports = new MongoReservationRepository();

