const BaseRepository = require('../base.repository');
const { load, save } = require('../../lib/db');

class JsonReservationRepository extends BaseRepository {
  constructor() {
    super();
    this.collectionName = 'reservations';
  }

  async findById(id) {
    const db = await load();
    const reservations = Array.isArray(db[this.collectionName]) ? db[this.collectionName] : [];
    return reservations.find(r => String(r.id) === String(id)) || null;
  }

  async findAll(query = {}) {
    const db = await load();
    let reservations = Array.isArray(db[this.collectionName]) ? db[this.collectionName] : [];
    
    // Apply filters
    if (query.userId) {
      reservations = reservations.filter(r => String(r.userId) === String(query.userId));
    }
    if (query.status) {
      reservations = reservations.filter(r => String(r.status) === String(query.status));
    }
    if (query.student) {
      reservations = reservations.filter(r => 
        String(r.student || '').toLowerCase() === String(query.student).toLowerCase()
      );
    }
    
    return reservations;
  }

  async findOne(query = {}) {
    const db = await load();
    const reservations = Array.isArray(db[this.collectionName]) ? db[this.collectionName] : [];
    
    if (query.id) {
      return reservations.find(r => String(r.id) === String(query.id)) || null;
    }
    if (query.userId && query.status) {
      return reservations.find(r => 
        String(r.userId) === String(query.userId) && 
        String(r.status) === String(query.status)
      ) || null;
    }
    
    return null;
  }

  async create(data) {
    const db = await load();
    db[this.collectionName] = Array.isArray(db[this.collectionName]) ? db[this.collectionName] : [];
    
    const id = data.id || `RES_${Date.now().toString(36)}${Math.floor(Math.random() * 900 + 100).toString(36)}`;
    const reservation = {
      id,
      ...data,
      status: data.status || 'Pending',
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
    
    db[this.collectionName].push(reservation);
    await save(db);
    return reservation;
  }

  async update(id, data) {
    const db = await load();
    db[this.collectionName] = Array.isArray(db[this.collectionName]) ? db[this.collectionName] : [];
    
    const index = db[this.collectionName].findIndex(r => String(r.id) === String(id));
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
    
    const index = db[this.collectionName].findIndex(r => String(r.id) === String(id));
    if (index === -1) return false;
    
    db[this.collectionName].splice(index, 1);
    await save(db);
    return true;
  }

  async count(query = {}) {
    const reservations = await this.findAll(query);
    return reservations.length;
  }
}

module.exports = new JsonReservationRepository();

