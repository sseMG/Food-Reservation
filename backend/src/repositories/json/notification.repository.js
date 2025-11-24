const BaseRepository = require('../base.repository');
const { load, save } = require('../../lib/db');

class JsonNotificationRepository extends BaseRepository {
  constructor() {
    super();
    this.collectionName = 'notifications';
  }

  async findById(id) {
    const db = await load();
    const notifications = Array.isArray(db[this.collectionName]) ? db[this.collectionName] : [];
    return notifications.find(n => String(n.id) === String(id)) || null;
  }

  async findAll(query = {}) {
    const db = await load();
    let notifications = Array.isArray(db[this.collectionName]) ? db[this.collectionName] : [];
    
    // Apply filters
    if (query.for) {
      notifications = notifications.filter(n => String(n.for) === String(query.for));
    }
    if (query.read !== undefined) {
      notifications = notifications.filter(n => n.read === query.read);
    }
    if (query.type) {
      notifications = notifications.filter(n => String(n.type) === String(query.type));
    }
    
    return notifications;
  }

  async findOne(query = {}) {
    const db = await load();
    const notifications = Array.isArray(db[this.collectionName]) ? db[this.collectionName] : [];
    
    if (query.id) {
      return notifications.find(n => String(n.id) === String(query.id)) || null;
    }
    
    return null;
  }

  async create(data) {
    const db = await load();
    db[this.collectionName] = Array.isArray(db[this.collectionName]) ? db[this.collectionName] : [];
    
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
    
    // Insert at beginning (newest first)
    db[this.collectionName].unshift(notification);
    await save(db);
    return notification;
  }

  async update(id, data) {
    const db = await load();
    db[this.collectionName] = Array.isArray(db[this.collectionName]) ? db[this.collectionName] : [];
    
    const index = db[this.collectionName].findIndex(n => String(n.id) === String(id));
    if (index === -1) return null;
    
    db[this.collectionName][index] = {
      ...db[this.collectionName][index],
      ...data,
    };
    
    await save(db);
    return db[this.collectionName][index];
  }

  async delete(id) {
    const db = await load();
    db[this.collectionName] = Array.isArray(db[this.collectionName]) ? db[this.collectionName] : [];
    
    const index = db[this.collectionName].findIndex(n => String(n.id) === String(id));
    if (index === -1) return false;
    
    db[this.collectionName].splice(index, 1);
    await save(db);
    return true;
  }

  async count(query = {}) {
    const notifications = await this.findAll(query);
    return notifications.length;
  }

  /**
   * Mark multiple notifications as read
   */
  async markManyRead(ids, forUser = null) {
    const db = await load();
    db[this.collectionName] = Array.isArray(db[this.collectionName]) ? db[this.collectionName] : [];
    
    let updated = 0;
    for (const notification of db[this.collectionName]) {
      if (forUser && String(notification.for) !== String(forUser)) continue;
      if (ids.includes(String(notification.id))) {
        notification.read = true;
        updated++;
      }
    }
    
    if (updated > 0) {
      await save(db);
    }
    return updated;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllRead(forUser) {
    const db = await load();
    db[this.collectionName] = Array.isArray(db[this.collectionName]) ? db[this.collectionName] : [];
    
    let updated = 0;
    for (const notification of db[this.collectionName]) {
      if (String(notification.for) === String(forUser) && !notification.read) {
        notification.read = true;
        updated++;
      }
    }
    
    if (updated > 0) {
      await save(db);
    }
    return updated;
  }
}

module.exports = new JsonNotificationRepository();

