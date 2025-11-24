const BaseRepository = require('../base.repository');
const { load, save } = require('../../lib/db');

class JsonWalletRepository extends BaseRepository {
  constructor() {
    super();
    this.collectionName = 'wallets';
  }

  async findById(id) {
    const db = await load();
    const wallets = Array.isArray(db[this.collectionName]) ? db[this.collectionName] : [];
    return wallets.find(w => String(w.id || w.provider) === String(id)) || null;
  }

  async findAll(query = {}) {
    const db = await load();
    let wallets = Array.isArray(db[this.collectionName]) ? db[this.collectionName] : [];
    
    // Filter active wallets by default
    if (query.active !== false) {
      wallets = wallets.filter(w => w.active !== false);
    }
    
    // Apply other filters
    if (query.provider) {
      wallets = wallets.filter(w => 
        String(w.provider).toLowerCase() === String(query.provider).toLowerCase()
      );
    }
    
    return wallets;
  }

  async findOne(query = {}) {
    const db = await load();
    const wallets = Array.isArray(db[this.collectionName]) ? db[this.collectionName] : [];
    
    if (query.id) {
      return wallets.find(w => String(w.id) === String(query.id)) || null;
    }
    if (query.provider) {
      return wallets.find(w => 
        String(w.provider).toLowerCase() === String(query.provider).toLowerCase() &&
        w.active !== false
      ) || null;
    }
    
    return null;
  }

  async create(data) {
    const db = await load();
    db[this.collectionName] = Array.isArray(db[this.collectionName]) ? db[this.collectionName] : [];
    
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
    
    db[this.collectionName].push(wallet);
    await save(db);
    return wallet;
  }

  async update(id, data) {
    const db = await load();
    db[this.collectionName] = Array.isArray(db[this.collectionName]) ? db[this.collectionName] : [];
    
    // Can update by id or provider
    const index = db[this.collectionName].findIndex(w => 
      String(w.id || w.provider) === String(id) ||
      String(w.provider).toLowerCase() === String(id).toLowerCase()
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

  async delete(id) {
    const db = await load();
    db[this.collectionName] = Array.isArray(db[this.collectionName]) ? db[this.collectionName] : [];
    
    const index = db[this.collectionName].findIndex(w => 
      String(w.id || w.provider) === String(id)
    );
    if (index === -1) return false;
    
    db[this.collectionName].splice(index, 1);
    await save(db);
    return true;
  }

  async count(query = {}) {
    const wallets = await this.findAll(query);
    return wallets.length;
  }

  /**
   * Upsert wallet by provider
   */
  async upsertByProvider(provider, data) {
    const existing = await this.findOne({ provider });
    if (existing) {
      return await this.update(existing.id || existing.provider, data);
    }
    return await this.create({ ...data, provider });
  }
}

module.exports = new JsonWalletRepository();

