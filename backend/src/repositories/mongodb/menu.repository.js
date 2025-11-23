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
    const item = {
      ...data,
      visible: data.visible !== undefined ? data.visible : true,
      deleted: false,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
    
    const result = await col.insertOne(item);
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
    
    const result = await col.findOneAndUpdate(
      filter,
      { $set: update },
      { returnDocument: 'after' }
    );
    
    return result.value ? sanitizeForResponse(normalizeMongoDoc(result.value)) : null;
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
   * Increment stock
   */
  async incrementStock(id, amount) {
    const col = this.getCollection();
    const filter = createIdFilter(id);
    const result = await col.findOneAndUpdate(
      filter,
      { $inc: { stock: Number(amount) } },
      { returnDocument: 'after' }
    );
    return result.value ? sanitizeForResponse(normalizeMongoDoc(result.value)) : null;
  }

  /**
   * Decrement stock
   */
  async decrementStock(id, amount) {
    const col = this.getCollection();
    const filter = createIdFilter(id);
    
    // Use aggregation pipeline to ensure stock doesn't go negative
    const result = await col.findOneAndUpdate(
      filter,
      [
        {
          $set: {
            stock: {
              $max: [0, { $subtract: ['$stock', Number(amount)] }]
            }
          }
        }
      ],
      { returnDocument: 'after' }
    );
    return result.value ? sanitizeForResponse(normalizeMongoDoc(result.value)) : null;
  }
}

module.exports = new MongoMenuRepository();

