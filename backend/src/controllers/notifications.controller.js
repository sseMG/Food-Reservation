const RepositoryFactory = require("../repositories/repository.factory");

function nowISO() {
  return new Date().toISOString();
}

/**
 * Notification shape:
 * { id, for: "admin" | "<userId>", actor, type, title, body, data?, read: false, createdAt }
 */

exports.addNotification = async (notif = {}) => {
  const notificationRepo = RepositoryFactory.getNotificationRepository();
  const userRepo = RepositoryFactory.getUserRepository();
  
  // Get user data if actor is provided
  let actorData = null;
  if (notif.actor) {
    const user = await userRepo.findById(notif.actor);
    if (user) {
      actorData = {
        id: user.id,
        name: user.name,
        email: user.email,
        profilePictureUrl: user.profilePictureUrl || null
      };
    }
  }

  const n = await notificationRepo.create({
    id: notif.id || "notif_" + Date.now().toString(36),
    for: notif.for || "admin",
    actor: actorData || notif.actor,
    type: notif.type || "misc",
    title: notif.title || "",
    body: notif.body || "",
    data: notif.data || null,
    read: !!notif.read,
    createdAt: notif.createdAt || nowISO(),
  });
  
  return n;
};

exports.listAdmin = async (req, res) => {
  try {
    const notificationRepo = RepositoryFactory.getNotificationRepository();
    const rows = await notificationRepo.findAll({ for: "admin" });
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

    const notificationRepo = RepositoryFactory.getNotificationRepository();
    const rows = await notificationRepo.findAll({ for: String(uid) });
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

    const notificationRepo = RepositoryFactory.getNotificationRepository();
    const target = await notificationRepo.findById(id);
    
    if (!target) return res.status(404).json({ error: "Not found" });

    const uid = req.user && (req.user.id || req.user._id);
    if (req.user?.role !== "admin" && String(target.for) !== String(uid)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await notificationRepo.update(id, { read: true });
    return res.json({ ok: true, id });
  } catch (err) {
    console.error("[NOTIFICATIONS] markRead error:", err);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
};

exports.markManyReadAdmin = async (req, res) => {
  try {
    const { ids = [], all = false } = req.body || {};
    const notificationRepo = RepositoryFactory.getNotificationRepository();

    if (all) {
      await notificationRepo.markAllRead("admin");
      return res.json({ ok: true });
    }
    
    const idArray = Array.isArray(ids) ? ids.map(String) : [];
    await notificationRepo.markManyRead(idArray, "admin");
    return res.json({ ok: true });
  } catch (err) {
    console.error("[NOTIFICATIONS] markManyReadAdmin error:", err);
    res.status(500).json({ error: "Failed to mark notifications as read" });
  }
};

exports.delete = async (req, res) => {
  const id = req.params.id;
  try {
    const notificationRepo = RepositoryFactory.getNotificationRepository();
    const result = await notificationRepo.delete(id);
    if (!result) return res.status(404).json({ error: "Not Found" });
    return res.json({ ok: true });
  } catch (err) {
    console.error("[NOTIFICATIONS] delete error:", err);
    res.status(500).json({ error: "Failed to delete notification", details: err.message });
  }
};