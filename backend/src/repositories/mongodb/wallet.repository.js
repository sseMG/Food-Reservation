const BaseRepository = require('../base.repository');
const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');
const { normalizeMongoDoc, normalizeMongoDocs, sanitizeForResponse } = require('../utils/normalize');

class MongoWalletRepository extends BaseRepository {
  constructor() {
    super();
    this.collectionName = 'wallets';
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
        { provider: String(id).toLowerCase() },
        { _id: ObjectId.isValid(id) ? new ObjectId(id) : null }
      ]
    });
    return doc ? sanitizeForResponse(normalizeMongoDoc(doc)) : null;
  }

  async findAll(query = {}) {
    const col = this.getCollection();
    const mongoQuery = {};
    
    // Filter active wallets by default
    if (query.active !== false) {
      mongoQuery.active = { $ne: false };
    }
    
    if (query.provider) {
      mongoQuery.provider = String(query.provider).toLowerCase();
    }
    
    const docs = await col.find(mongoQuery).toArray();
    return normalizeMongoDocs(docs).map(sanitizeForResponse);
  }

  async findOne(query = {}) {
    const col = this.getCollection();
    const mongoQuery = {};
    
    if (query.id) {
      return await this.findById(query.id);
    }
    if (query.provider) {
      mongoQuery.provider = String(query.provider).toLowerCase();
      mongoQuery.active = { $ne: false };
    }
    
    const doc = await col.findOne(mongoQuery);
    return doc ? sanitizeForResponse(normalizeMongoDoc(doc)) : null;
  }

  async create(data) {
    const col = this.getCollection();
    const wallet = {
      provider: String(data.provider).toLowerCase(),
      accountName: data.accountName || '',
      mobile: data.mobile || '',
      reference: data.reference || '',
      qrImageUrl: data.qrImageUrl || '',
      active: data.active !== undefined ? data.active : true,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
    
    const result = await col.insertOne(wallet);
    const created = await col.findOne({ _id: result.insertedId });
    return sanitizeForResponse(normalizeMongoDoc(created));
  }

  async update(id, data) {
    const col = this.getCollection();
    const filter = {
      $or: [
        { id: String(id) },
        { provider: String(id).toLowerCase() },
        { _id: ObjectId.isValid(id) ? new ObjectId(id) : null }
      ]
    };
    
    const update = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    
    if (update.provider) {
      update.provider = String(update.provider).toLowerCase();
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
    const filter = {
      $or: [
        { id: String(id) },
        { provider: String(id).toLowerCase() },
        { _id: ObjectId.isValid(id) ? new ObjectId(id) : null }
      ]
    };
    const result = await col.deleteOne(filter);
    return result.deletedCount > 0;
  }

  async count(query = {}) {
    const col = this.getCollection();
    const mongoQuery = {};
    
    if (query.active !== false) {
      mongoQuery.active = { $ne: false };
    }
    if (query.provider) {
      mongoQuery.provider = String(query.provider).toLowerCase();
    }
    
    return await col.countDocuments(mongoQuery);
  }

  /**
   * Upsert wallet by provider
   */
  async upsertByProvider(provider, data) {
    const col = this.getCollection();
    const filter = { provider: String(provider).toLowerCase() };
    
    const update = {
      ...data,
      provider: String(provider).toLowerCase(),
      updatedAt: new Date().toISOString(),
    };
    
    const result = await col.findOneAndUpdate(
      filter,
      { 
        $set: update,
        $setOnInsert: { createdAt: new Date().toISOString() }
      },
      { 
        upsert: true,
        returnDocument: 'after'
      }
    );
    
    return sanitizeForResponse(normalizeMongoDoc(result.value));
  }
}

module.exports = new MongoWalletRepository();

