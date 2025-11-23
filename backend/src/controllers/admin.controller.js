const path = require("path");
const fs = require("fs-extra");
const RepositoryFactory = require("../repositories/repository.factory");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
fs.ensureDirSync(UPLOAD_DIR);

function safeName(name = "") {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

exports.listMenu = async (_req, res) => {
  try {
    const menuRepo = RepositoryFactory.getMenuRepository();
    const menu = await menuRepo.findAll({ includeDeleted: 'true' });
    res.json({ status: 200, data: menu });
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

    const menuRepo = RepositoryFactory.getMenuRepository();
    const item = await menuRepo.create({
      name: name.trim(),
      category: category.trim(),
      price: p,
      stock: s,
      img,
      isActive: !!JSON.parse(String(isActive)),
      visible: true,
      deleted: false,
    });
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

    const menuRepo = RepositoryFactory.getMenuRepository();
    
    // Get existing item to get name for image filename
    const existing = await menuRepo.findById(id);
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

    const updated = await menuRepo.update(id, patch);
    if (!updated) {
      return res.status(404).json({ error: "Item not found" });
    }
    
    console.log('[ADMIN] Update menu: item updated', id);
    res.json({ status: 200, data: updated });
  } catch (err) {
    console.error("[ADMIN] updateMenu error:", err);
    res.status(500).json({ error: "Failed to update menu item" });
  }
};

exports.deleteMenu = async (req, res) => {
  try {
    const id = req.params.id;
    
    const menuRepo = RepositoryFactory.getMenuRepository();
    const result = await menuRepo.delete(id);
    
    if (!result) {
      console.log('[ADMIN] Delete menu: item not found', id);
      return res.status(404).json({ error: "Item not found" });
    }
    
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
    const reservationRepo = RepositoryFactory.getReservationRepository();
    const userRepo = RepositoryFactory.getUserRepository();
    
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Get all reservations
    const reservations = await reservationRepo.findAll({});
    const users = await userRepo.findAll({});

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
        const user = users.find(u => String(u.id) === String(r.userId));
        return {
          id: r.id,
          product: (Array.isArray(r.items) && r.items[0]) ? r.items[0].name : "Reservation",
          customer: r.student || (user ? user.name : null) || "Guest",
          time: new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          amount: Number(r.total) || 0,
          status: r.status || 'Pending'
        };
      });

    console.log('[ADMIN] Dashboard: success');
    res.json({ status: 200, data: { totalSales, ordersToday, newUsers, pending, recentOrders: recent } });
  } catch (e) {
    console.log('[ADMIN] Dashboard: error', e.message);
    res.status(500).json({ error: 'Failed to compute dashboard' });
  }
};
