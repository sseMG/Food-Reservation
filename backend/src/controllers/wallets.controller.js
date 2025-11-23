// server/src/controllers/wallets.controller.js
const path = require('path');
const fs = require('fs-extra');
const { load, save } = require('../lib/db');
const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
fs.ensureDirSync(UPLOAD_DIR);

function safeName(name = '') {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/**
 * Helper: are we connected to Mongo?
 */
function usingMongo() {
  return !!(mongoose && mongoose.connection && mongoose.connection.readyState === 1);
}

// Public: list active wallets
exports.list = async (req, res) => {
  try {
    if (usingMongo()) {
      const db = mongoose.connection.db;
      const wallets = await db.collection("wallets").find({ active: { $ne: false } }).toArray();
      console.log('[WALLET] List: returning', wallets.length, 'wallets');
      return res.json({ status: 200, data: wallets });
    }

    const db = await load();
    const wallets = Array.isArray(db.wallets)
      ? db.wallets.filter(w => w.active !== false)
      : [];
    console.log('[WALLET] List: returning', wallets.length, 'wallets');
    res.json({ status: 200, data: wallets });
  } catch (err) {
    console.error("[WALLET] list error:", err);
    res.status(500).json({ error: "Failed to list wallets" });
  }
};

// Public: get one by provider (e.g., "gcash", "maya")
exports.getOne = async (req, res) => {
  try {
    const provider = String(req.params.provider || '').trim().toLowerCase();
    if (!provider) {
      console.log('[WALLET] GetOne: missing provider');
      return res.status(400).json({ error: 'Missing provider' });
    }

    if (usingMongo()) {
      const db = mongoose.connection.db;
      const found = await db.collection("wallets").findOne({ 
        provider: provider,
        active: { $ne: false }
      });

      if (!found) {
        console.log('[WALLET] GetOne: wallet not found', provider);
        return res.status(404).json({ error: 'Wallet not found' });
      }
      console.log('[WALLET] GetOne: wallet found', provider);
      return res.json({ status: 200, data: found });
    }

    const db = await load();
    const list = Array.isArray(db.wallets) ? db.wallets : [];
    const found = list.find(w => String(w.provider).toLowerCase() === provider);

    if (!found || found.active === false) {
      console.log('[WALLET] GetOne: wallet not found', provider);
      return res.status(404).json({ error: 'Wallet not found' });
    }
    console.log('[WALLET] GetOne: wallet found', provider);
    res.json({ status: 200, data: found });
  } catch (err) {
    console.error("[WALLET] getOne error:", err);
    res.status(500).json({ error: "Failed to get wallet" });
  }
};

// Authenticated: return current user's wallet/balance information
exports.me = async (req, res) => {
  try {
    const uid = req.user && (req.user.id || req.user._id);
    if (!uid) {
      console.log('[WALLET] Me: unauthorized');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (usingMongo()) {
      const db = mongoose.connection.db;
      const usersCol = db.collection("users");
      const user = await usersCol.findOne({ 
        $or: [{ id: String(uid) }, { _id: ObjectId.isValid(uid) ? new ObjectId(uid) : null }]
      });
      
      if (!user) { 
        console.log('[WALLET] Me: user not found', uid);
        return res.status(404).json({ error: 'User not found' });
      }

      console.log('[WALLET] Me: returning wallet for user', uid);
      return res.json({
        status: 200,
        data: {
          balance: Number(user.balance) || 0,
          id: user.id || user._id?.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          user: user.studentId || user.sid || null,
          studentId: user.studentId || user.sid || user.student_id || null,
          phone: user.phone || user.contact || null,
          profilePictureUrl: user.profilePictureUrl || null
        }
      });
    }

    const db = await load();
    const user = (db.users || []).find((u) => String(u.id) === String(uid));
    
    if (!user) { 
      console.log('[WALLET] Me: user not found', uid);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('[WALLET] Me: returning wallet for user', uid);
    return res.json({
      status: 200,
      data: {
        balance: Number(user.balance) || 0,
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        user: user.studentId || user.sid || null,
        studentId: user.studentId || user.sid || user.student_id || null,
        phone: user.phone || user.contact || null,
        profilePictureUrl: user.profilePictureUrl || null
      }
    });
  } catch (e) {
    console.error(e);
    console.log('[WALLET] Me: failed to load wallet', e.message);
    res.status(500).json({ error: 'Failed to load wallet' });
  }
};

// Admin: add/update wallet with optional qr image (req.file provided by multer)
exports.upsert = async (req, res) => {
  try {
    const provider =
      (req.params && req.params.provider) ||
      (req.body && req.body.provider);
    if (!provider) return res.status(400).json({ error: 'Missing provider' });

    const key = String(provider).toLowerCase();

    // Save QR file if provided
    let qrUrl = '';
    if (req.file) {
      if (req.file.path || req.file.filename) {
        const filename = req.file.filename || path.basename(req.file.path);
        const current = req.file.path || path.join(UPLOAD_DIR, filename);
        const dest = path.join(UPLOAD_DIR, filename);
        if (current !== dest) {
          await fs.move(current, dest, { overwrite: true });
        }
        qrUrl = `/uploads/${filename}`;
      } else if (req.file.buffer) {
        const ext = (req.file.mimetype || '').split('/').pop() || 'png';
        const filename = `${Date.now()}_${safeName(provider)}.${ext}`;
        const dest = path.join(UPLOAD_DIR, filename);
        await fs.writeFile(dest, req.file.buffer);
        qrUrl = `/uploads/${filename}`;
      }
    }

    if (usingMongo()) {
      const db = mongoose.connection.db;
      const walletsCol = db.collection("wallets");
      
      const existing = await walletsCol.findOne({ provider: key });

      const payload = {
        provider: key,
        accountName: (req.body && req.body.accountName) || (existing && existing.accountName) || '',
        mobile: (req.body && req.body.mobile) || (existing && existing.mobile) || '',
        reference: (req.body && req.body.reference) || (existing && existing.reference) || '',
        qrImageUrl: qrUrl || (existing && existing.qrImageUrl) || '',
        active: req.body && Object.prototype.hasOwnProperty.call(req.body, 'active')
          ? (req.body.active === 'true' || req.body.active === true)
          : (existing ? existing.active : true),
        updatedAt: new Date().toISOString(),
      };

      if (existing) {
        await walletsCol.updateOne({ provider: key }, { $set: payload });
        const updated = await walletsCol.findOne({ provider: key });
        return res.json(updated);
      } else {
        payload.createdAt = new Date().toISOString();
        await walletsCol.insertOne(payload);
        return res.json(payload);
      }
    }

    const db = await load();
    db.wallets = Array.isArray(db.wallets) ? db.wallets : [];
    let existing = db.wallets.find(w => String(w.provider).toLowerCase() === key);

    if (!qrUrl && existing) {
      qrUrl = existing.qrImageUrl;
    }

    const payload = {
      provider: key,
      accountName: (req.body && req.body.accountName) || (existing && existing.accountName) || '',
      mobile: (req.body && req.body.mobile) || (existing && existing.mobile) || '',
      reference: (req.body && req.body.reference) || (existing && existing.reference) || '',
      qrImageUrl: qrUrl,
      active: req.body && Object.prototype.hasOwnProperty.call(req.body, 'active')
        ? (req.body.active === 'true' || req.body.active === true)
        : (existing ? existing.active : true),
      updatedAt: new Date().toISOString(),
    };

    if (existing) {
      Object.assign(existing, payload);
    } else {
      db.wallets.push({
        ...payload,
        createdAt: new Date().toISOString(),
      });
      existing = payload;
    }

    await save(db);
    res.json(existing);
  } catch (err) {
    console.error("[WALLET] upsert error:", err);
    res.status(500).json({ error: "Failed to upsert wallet" });
  }
};

// Authenticated: charge the current user's wallet for a reservation or other ref
exports.charge = async (req, res) => {
  try {
    const uid = req.user && (req.user.id || req.user._id);
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });

    const { amount, refType, refId } = req.body || {};
    const amt = Number(amount || 0);
    if (!amt || amt <= 0) return res.status(400).json({ error: 'Invalid amount' });

    if (usingMongo()) {
      const db = mongoose.connection.db;
      const usersCol = db.collection("users");
      const transactionsCol = db.collection("transactions");

      // Idempotent: if a transaction already exists for this refId+refType, return it
      if (refId) {
        const exists = await transactionsCol.findOne({
          $or: [
            { ref: String(refId) },
            { refId: String(refId) },
            { reference: String(refId) }
          ],
          type: refType || 'Reservation'
        });
        if (exists) return res.json({ transaction: exists });
      }

      const user = await usersCol.findOne({ 
        $or: [{ id: String(uid) }, { _id: ObjectId.isValid(uid) ? new ObjectId(uid) : null }]
      });
      if (!user) return res.status(404).json({ error: 'User not found' });

      const balance = Number(user.balance) || 0;
      if (balance < amt) return res.status(400).json({ error: 'Insufficient balance' });

      // Deduct balance
      await usersCol.updateOne(
        { $or: [{ id: String(uid) }, { _id: ObjectId.isValid(uid) ? new ObjectId(uid) : null }] },
        { $inc: { balance: -amt } }
      );

      const txId = `txn_${Date.now().toString(36)}`;
      const tx = {
        id: txId,
        userId: user.id || user._id?.toString(),
        type: refType || 'Reservation',
        amount: amt,
        ref: refId || null,
        createdAt: new Date().toISOString(),
        status: 'Success',
      };
      await transactionsCol.insertOne(tx);

      const newBalance = balance - amt;
      return res.json({ transaction: tx, balance: newBalance });
    }

    const db = await load();
    db.transactions = Array.isArray(db.transactions) ? db.transactions : [];

    // Idempotent: if a transaction already exists for this refId+refType, return it
    if (refId) {
      const exists = db.transactions.find(
        (t) => String(t.ref || t.refId || t.reference) === String(refId) && String(t.type || t.refType || '') === String(refType || '')
      );
      if (exists) return res.json({ transaction: exists });
    }

    const user = (db.users || []).find((u) => String(u.id) === String(uid));
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (typeof user.balance !== 'number') user.balance = Number(user.balance) || 0;

    // Ensure sufficient balance
    if (user.balance < amt) return res.status(400).json({ error: 'Insufficient balance' });

    user.balance = Number(user.balance) - amt;

    const txId = `txn_${Date.now().toString(36)}`;
    const tx = {
      id: txId,
      userId: user.id,
      type: refType || 'Reservation',
      amount: amt,
      ref: refId || null,
      createdAt: new Date().toISOString(),
      status: 'Success',
    };
    db.transactions.push(tx);

    await save(db);
    return res.json({ transaction: tx, balance: user.balance });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to charge wallet' });
  }
};

// Add this new endpoint
exports.updateProfile = async (req, res) => {
  try {
    const uid = req.user && (req.user.id || req.user._id);
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });

    const { name, email, studentId, phone } = req.body || {};

    if (usingMongo()) {
      const db = mongoose.connection.db;
      const usersCol = db.collection("users");

      const user = await usersCol.findOne({ 
        $or: [{ id: String(uid) }, { _id: ObjectId.isValid(uid) ? new ObjectId(uid) : null }]
      });
      if (!user) return res.status(404).json({ error: 'User not found' });

      const update = { updatedAt: new Date().toISOString() };
      if (name) update.name = name;
      if (email) update.email = email;
      if (studentId) update.studentId = studentId;
      if (phone) update.phone = phone;

      // Handle profile picture if provided
      if (req.file) {
        const ext = path.extname(req.file.originalname) || '.jpg';
        const filename = `profile-${user.id || user._id}-${Date.now()}${ext}`;
        const filePath = path.join(UPLOAD_DIR, filename);
        await fs.writeFile(filePath, req.file.buffer);
        update.profilePictureUrl = `/uploads/${filename}`;
      }

      await usersCol.updateOne(
        { $or: [{ id: String(uid) }, { _id: ObjectId.isValid(uid) ? new ObjectId(uid) : null }] },
        { $set: update }
      );

      const updated = await usersCol.findOne({ 
        $or: [{ id: String(uid) }, { _id: ObjectId.isValid(uid) ? new ObjectId(uid) : null }]
      });

      return res.json({ 
        ok: true, 
        user: {
          id: updated.id || updated._id?.toString(),
          name: updated.name,
          email: updated.email,
          studentId: updated.studentId,
          phone: updated.phone,
          profilePictureUrl: updated.profilePictureUrl
        }
      });
    }

    const db = await load();
    const users = Array.isArray(db.users) ? db.users : [];
    const idx = users.findIndex(u => String(u.id) === String(uid));
    if (idx === -1) return res.status(404).json({ error: 'User not found' });

    const user = users[idx];

    // Update fields if provided
    if (name) user.name = name;
    if (email) user.email = email;
    if (studentId) user.studentId = studentId;
    if (phone) user.phone = phone;

    // Handle profile picture if provided
    if (req.file) {
      const ext = path.extname(req.file.originalname) || '.jpg';
      const filename = `profile-${user.id}-${Date.now()}${ext}`;
      const filePath = path.join(UPLOAD_DIR, filename);
      await fs.writeFile(filePath, req.file.buffer);
      user.profilePictureUrl = `/uploads/${filename}`;
    }

    user.updatedAt = new Date().toISOString();
    users[idx] = user;
    db.users = users;
    await save(db);

    res.json({ 
      ok: true, 
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        studentId: user.studentId,
        phone: user.phone,
        profilePictureUrl: user.profilePictureUrl
      }
    });
  } catch (err) {
    console.error('[WALLET] updateProfile failed:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};
