const path = require("path");
const fs = require("fs-extra");
const { load, save, nextId } = require("../lib/db");
const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
fs.ensureDirSync(UPLOAD_DIR);

function safeName(name = "") {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/**
 * Helper: are we connected to Mongo?
 */
function usingMongo() {
  return !!(mongoose && mongoose.connection && mongoose.connection.readyState === 1);
}

exports.listMenu = async (_req, res) => {
  try {
    if (usingMongo()) {
      const db = mongoose.connection.db;
      const menu = await db.collection("menu").find({}).toArray();
      return res.json({ status: 200, data: menu });
    }

    const db = await load();
    res.json({ status: 200, data: db.menu || [] });
  } catch (err) {
    console.error("[ADMIN] listMenu error:", err);
    res.status(500).json({ error: "Failed to list menu" });
  }
};

exports.addMenu = async (req, res) => {
  try {
    const { name = "", category = "", price, stock, isActive = true } = req.body || {};
    if (!name.trim() || !category.trim()) {
      return res.status(400).json({ error: "Missing name or category" });
    }
    const p = Number(price);
    const s = Number(stock);
    if (Number.isNaN(p) || Number.isNaN(s)) {
      return res.status(400).json({ error: "Price/stock must be numeric" });
    }

    // handle optional image upload
    let img = "";
    if (req.file) {
      const ext = (req.file.mimetype || "").split("/").pop() || "png";
      const filename = `${Date.now()}_${safeName(name)}.${ext}`;
      const dest = path.join(UPLOAD_DIR, filename);
      await fs.writeFile(dest, req.file.buffer);
      img = `/uploads/${filename}`;
    }

    if (usingMongo()) {
      const db = mongoose.connection.db;
      const now = new Date().toISOString();
      const item = {
        name: name.trim(),
        category: category.trim(),
        price: p,
        stock: s,
        img,
        isActive: !!JSON.parse(String(isActive)),
        visible: true,
        deleted: false,
        createdAt: now,
        updatedAt: now,
      };
      const result = await db.collection("menu").insertOne(item);
      return res.json({ status: 200, data: { ...item, _id: result.insertedId, id: result.insertedId.toString() } });
    }

    const db = await load();
    const item = {
      id: db.menu.length ? nextId(db.menu, "ITM") : "ITM-1",
      name: name.trim(),
      category: category.trim(),
      price: p,
      stock: s,
      img,
      isActive: !!JSON.parse(String(isActive)),
      createdAt: new Date().toISOString(),
    };

    db.menu.push(item);
    await save(db);
    res.json({ status: 200, data: item });
  } catch (err) {
    console.error("[ADMIN] addMenu error:", err);
    res.status(500).json({ error: "Failed to add menu item" });
  }
};

exports.updateMenu = async (req, res) => {
  try {
    const id = req.params.id;
    const patch = { ...req.body };
    if ("price" in patch) patch.price = Number(patch.price);
    if ("stock" in patch) patch.stock = Number(patch.stock);
    if ("isActive" in patch) patch.isActive = !!JSON.parse(String(patch.isActive));

    if (usingMongo()) {
      const db = mongoose.connection.db;
      const col = db.collection("menu");
      
      // Get existing item to get name for image filename
      const existing = await col.findOne({ $or: [{ id }, { _id: ObjectId.isValid(id) ? new ObjectId(id) : null }] });
      if (!existing) {
        return res.status(404).json({ error: "Item not found" });
      }

      if (req.file) {
        const ext = (req.file.mimetype || "").split("/").pop() || "png";
        const filename = `${Date.now()}_${safeName(existing.name || "item")}.${ext}`;
        const dest = path.join(UPLOAD_DIR, filename);
        await fs.writeFile(dest, req.file.buffer);
        patch.img = `/uploads/${filename}`;
      }

      patch.updatedAt = new Date().toISOString();
      const filter = { $or: [{ id }, { _id: ObjectId.isValid(id) ? new ObjectId(id) : null }] };
      const result = await col.findOneAndUpdate(
        filter,
        { $set: patch },
        { returnDocument: "after" }
      );
      
      if (!result.value) {
        return res.status(404).json({ error: "Item not found" });
      }
      
      console.log('[ADMIN] Update menu: item updated', id);
      return res.json({ status: 200, data: result.value });
    }

    const db = await load();
    const idx = db.menu.findIndex(m => String(m.id) === String(id));
    if (idx === -1) {
      console.log('[ADMIN] Update menu: item not found', id);
      return res.status(404).json({ error: "Item not found" });
    }

    if (req.file) {
      const ext = (req.file.mimetype || "").split("/").pop() || "png";
      const filename = `${Date.now()}_${safeName(db.menu[idx].name)}.${ext}`;
      const dest = path.join(UPLOAD_DIR, filename);
      await fs.writeFile(dest, req.file.buffer);
      patch.img = `/uploads/${filename}`;
    }

    db.menu[idx] = { ...db.menu[idx], ...patch };
    await save(db);
    console.log('[ADMIN] Update menu: item updated', id);
    res.json({ status: 200, data: db.menu[idx] });
  } catch (err) {
    console.error("[ADMIN] updateMenu error:", err);
    res.status(500).json({ error: "Failed to update menu item" });
  }
};

exports.deleteMenu = async (req, res) => {
  try {
    const id = req.params.id;
    
    if (usingMongo()) {
      const db = mongoose.connection.db;
      const col = db.collection("menu");
      const filter = { $or: [{ id }, { _id: ObjectId.isValid(id) ? new ObjectId(id) : null }] };
      const result = await col.deleteOne(filter);
      
      if (result.deletedCount === 0) {
        console.log('[ADMIN] Delete menu: item not found', id);
        return res.status(404).json({ error: "Item not found" });
      }
      
      console.log('[ADMIN] Delete menu: item deleted', id);
      return res.json({ status: 200, data: { ok: true } });
    }

    const db = await load();
    const before = db.menu.length;
    db.menu = db.menu.filter(m => String(m.id) !== String(id));
    if (db.menu.length === before) {
      console.log('[ADMIN] Delete menu: item not found', id);
      return res.status(404).json({ error: "Item not found" });
    }
    await save(db);
    console.log('[ADMIN] Delete menu: item deleted', id);
    res.json({ status: 200, data: { ok: true } });
  } catch (err) {
    console.error("[ADMIN] deleteMenu error:", err);
    res.status(500).json({ error: "Failed to delete menu item" });
  }
};

// Admin dashboard: aggregate simple stats and recent orders
exports.dashboard = async (req, res) => {
  try {
    if (usingMongo()) {
      const db = mongoose.connection.db;
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      // Get all reservations
      const reservations = await db.collection("reservations").find({}).toArray();
      const users = await db.collection("users").find({}).toArray();

      // total sales: sum of reservation totals
      const totalSales = reservations.reduce((s, r) => s + (Number(r.total) || 0), 0);

      // orders today: count reservations with createdAt on today's date
      const ordersToday = reservations.filter(r => new Date(r.createdAt) >= startOfToday).length;

      // new users: count users
      const newUsers = users.length;

      // pending reservations
      const pending = reservations.filter(r => String(r.status) === 'Pending').length;

      // recent orders: latest 5 reservations with small summary
      const recent = reservations
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map(r => {
          const user = users.find(u => String(u.id || u._id) === String(r.userId));
          return {
            id: r.id || r._id,
            product: (Array.isArray(r.items) && r.items[0]) ? r.items[0].name : "Reservation",
            customer: r.student || (user ? user.name : null) || "Guest",
            time: new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            amount: Number(r.total) || 0,
            status: r.status || 'Pending'
          };
        });

      console.log('[ADMIN] Dashboard: success');
      return res.json({ status: 200, data: { totalSales, ordersToday, newUsers, pending, recentOrders: recent } });
    }

    const db = await load();

    // total sales: sum of reservation totals
    const totalSales = (Array.isArray(db.reservations) ? db.reservations : []).reduce((s, r) => s + (Number(r.total) || 0), 0);

    // orders today: count reservations with createdAt on today's date
    const startOfToday = new Date();
    startOfToday.setHours(0,0,0,0);
    const ordersToday = (db.reservations || []).filter(r => new Date(r.createdAt) >= startOfToday).length;

    // new users: best-effort: count users (no createdAt available) -> return total users
    const newUsers = Array.isArray(db.users) ? db.users.length : 0;

    // pending reservations
    const pending = (db.reservations || []).filter(r => String(r.status) === 'Pending').length;

    // recent orders: latest 5 reservations with small summary
    const recent = (Array.isArray(db.reservations) ? db.reservations.slice() : [])
      .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0,5)
      .map(r => ({
        id: r.id,
        product: (Array.isArray(r.items) && r.items[0]) ? r.items[0].name : "Reservation",
        customer: r.student || (db.users.find(u => u.id === r.userId) || {}).name || "Guest",
        time: new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        amount: Number(r.total) || 0,
        status: r.status || 'Pending'
      }));

    console.log('[ADMIN] Dashboard: success');
    res.json({ status: 200, data: { totalSales, ordersToday, newUsers, pending, recentOrders: recent } });
  } catch (e) {
    console.log('[ADMIN] Dashboard: error', e.message);
    res.status(500).json({ error: 'Failed to compute dashboard' });
  }
};
