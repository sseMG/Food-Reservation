const { load, save } = require("../lib/db");
const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");

/**
 * Helper: are we connected to Mongo?
 */
function usingMongo() {
  return !!(mongoose && mongoose.connection && mongoose.connection.readyState === 1);
}

function nowISO() {
  return new Date().toISOString();
}

/**
 * Notification shape:
 * { id, for: "admin" | "<userId>", actor, type, title, body, data?, read: false, createdAt }
 */

exports.addNotification = async (notif = {}) => {
  if (usingMongo()) {
    const db = mongoose.connection.db;
    const notificationsCol = db.collection("notifications");
    const usersCol = db.collection("users");
    
    // Get user data if actor is provided
    let actorData = null;
    if (notif.actor) {
      const user = await usersCol.findOne({ 
        $or: [{ id: String(notif.actor) }, { _id: ObjectId.isValid(notif.actor) ? new ObjectId(notif.actor) : null }]
      });
      if (user) {
        actorData = {
          id: user.id || user._id?.toString(),
          name: user.name,
          email: user.email,
          profilePictureUrl: user.profilePictureUrl || null
        };
      }
    }

    const n = {
      id: notif.id || "notif_" + Date.now().toString(36),
      for: notif.for || "admin",
      actor: actorData || notif.actor,
      type: notif.type || "misc",
      title: notif.title || "",
      body: notif.body || "",
      data: notif.data || null,
      read: !!notif.read,
      createdAt: notif.createdAt || nowISO(),
    };
    
    await notificationsCol.insertOne(n);
    return n;
  }

  const db = load();
  db.notifications = Array.isArray(db.notifications) ? db.notifications : [];
  
  // Get user data if actor is provided
  let actorData = null;
  if (notif.actor) {
    const user = (db.users || []).find(u => String(u.id) === String(notif.actor));
    if (user) {
      actorData = {
        id: user.id,
        name: user.name,
        email: user.email,
        profilePictureUrl: user.profilePictureUrl || null
      };
    }
  }

  const n = {
    id: notif.id || "notif_" + Date.now().toString(36),
    for: notif.for || "admin",
    actor: actorData || notif.actor,
    type: notif.type || "misc",
    title: notif.title || "",
    body: notif.body || "",
    data: notif.data || null,
    read: !!notif.read,
    createdAt: notif.createdAt || nowISO(),
  };
  
  // newest first
  db.notifications.unshift(n);
  save(db);
  return n;
};

exports.listAdmin = async (req, res) => {
  try {
    if (usingMongo()) {
      const db = mongoose.connection.db;
      const rows = await db.collection("notifications").find({ for: "admin" }).toArray();
      return res.json({ status: 200, data: rows });
    }

    const db = load();
    const rows = (db.notifications || []).filter((x) => x.for === "admin");
    res.json({ status: 200, data: rows });
  } catch (err) {
    console.error("[NOTIFICATIONS] listAdmin error:", err);
    res.status(500).json({ error: "Failed to list admin notifications" });
  }
};

exports.mine = async (req, res) => {
  try {
    const uid = req.user && (req.user.id || req.user._id);
    if (!uid) return res.status(401).json({ error: "Unauthorized" });

    if (usingMongo()) {
      const db = mongoose.connection.db;
      const rows = await db.collection("notifications").find({ for: String(uid) }).toArray();
      return res.json({ status: 200, data: rows });
    }

    const db = load();
    const rows = (db.notifications || []).filter((n) => String(n.for) === String(uid));
    res.json({ status: 200, data: rows });
  } catch (err) {
    console.error("[NOTIFICATIONS] mine error:", err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

exports.markRead = async (req, res) => {
  try {
    const { id } = req.params || {};
    if (!id) return res.status(400).json({ error: "Missing id" });

    if (usingMongo()) {
      const db = mongoose.connection.db;
      const notificationsCol = db.collection("notifications");
      const target = await notificationsCol.findOne({ 
        $or: [{ id: String(id) }, { _id: ObjectId.isValid(id) ? new ObjectId(id) : null }]
      });
      
      if (!target) return res.status(404).json({ error: "Not found" });

      const uid = req.user && (req.user.id || req.user._id);
      if (req.user?.role !== "admin" && String(target.for) !== String(uid)) {
        return res.status(403).json({ error: "Forbidden" });
      }

      await notificationsCol.updateOne(
        { $or: [{ id: String(id) }, { _id: ObjectId.isValid(id) ? new ObjectId(id) : null }] },
        { $set: { read: true } }
      );
      return res.json({ ok: true, id });
    }

    const db = load();
    db.notifications = db.notifications || [];
    const i = db.notifications.findIndex((n) => String(n.id) === String(id));
    if (i === -1) return res.status(404).json({ error: "Not found" });

    const target = db.notifications[i];
    const uid = req.user && req.user.id;
    if (req.user?.role !== "admin" && String(target.for) !== String(uid)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    db.notifications[i].read = true;
    save(db);
    res.json({ ok: true, id });
  } catch (err) {
    console.error("[NOTIFICATIONS] markRead error:", err);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
};

exports.markManyReadAdmin = async (req, res) => {
  try {
    const { ids = [], all = false } = req.body || {};

    if (usingMongo()) {
      const db = mongoose.connection.db;
      const notificationsCol = db.collection("notifications");
      
      if (all) {
        await notificationsCol.updateMany(
          { for: "admin" },
          { $set: { read: true } }
        );
        return res.json({ ok: true });
      }
      
      const set = new Set((Array.isArray(ids) ? ids : []).map(String));
      await notificationsCol.updateMany(
        { for: "admin", id: { $in: Array.from(set) } },
        { $set: { read: true } }
      );
      return res.json({ ok: true });
    }

    const db = load();
    db.notifications = db.notifications || [];
    if (all) {
      for (const n of db.notifications) {
        if (n.for === "admin") n.read = true;
      }
      save(db);
      return res.json({ ok: true });
    }
    const set = new Set((Array.isArray(ids) ? ids : []).map(String));
    for (const n of db.notifications) {
      if (n.for === "admin" && set.has(String(n.id))) n.read = true;
    }
    save(db);
    res.json({ ok: true });
  } catch (err) {
    console.error("[NOTIFICATIONS] markManyReadAdmin error:", err);
    res.status(500).json({ error: "Failed to mark notifications as read" });
  }
};

exports.delete = async (req, res) => {
  const id = req.params.id;
  try {
    // If Mongo is available, remove from collection
    if (mongoose && mongoose.connection && mongoose.connection.readyState === 1) {
      const db = mongoose.connection.db;
      const col = db.collection("notifications");
      const result = await col.findOneAndDelete({ $or: [{ id }, { _id: id }] });
      if (!result.value) return res.status(404).json({ error: "Not Found" });
      return res.json({ ok: true });
    }

    // Fallback to file DB
    const db = await load();
    db.notifications = Array.isArray(db.notifications) ? db.notifications : [];
    const idx = db.notifications.findIndex(
      (n) => String(n.id) === String(id) || String(n._id) === String(id)
    );
    if (idx === -1) return res.status(404).json({ error: "Not Found" });
    db.notifications.splice(idx, 1);
    await save(db);
    return res.json({ ok: true });
  } catch (err) {
    console.error("[NOTIFICATIONS] delete error:", err);
    res.status(500).json({ error: "Failed to delete notification", details: err.message });
  }
};