const RepositoryFactory = require("../repositories/repository.factory");

exports.list = async (req, res) => {
  try {
    const menuRepo = RepositoryFactory.getMenuRepository();
    const items = await menuRepo.findAll({ 
      includeDeleted: req.query.includeDeleted 
    });
    console.log('[MENU] List: returning', items.length, 'items');
    res.json({ status: 200, data: items });
  } catch (err) {
    console.error("[MENU] list error:", err);
    res.status(500).json({ error: "Failed to list menu items" });
  }
};

exports.create = async (req, res) => {
  try {
    const menuRepo = RepositoryFactory.getMenuRepository();
    const payload = { ...(req.body || {}) };
    
    if (req.file && req.file.filename) {
      payload.img = payload.img || `/uploads/${req.file.filename}`;
    }

    if (payload.price != null) payload.price = Number(payload.price);
    if (payload.stock != null) payload.stock = Number(payload.stock);
    if (payload.visible === undefined) payload.visible = true;

    const item = await menuRepo.create(payload);
    return res.json({ ok: true, item });
  } catch (err) {
    console.error("[MENU] create error:", err);
    return res.status(500).json({ error: "Failed to create item", details: err.message || String(err) });
  }
};

exports.update = async (req, res) => {
  try {
    const menuRepo = RepositoryFactory.getMenuRepository();
    const id = req.params.id;
    const payload = { ...(req.body || {}) };
    
    if (req.file) {
      if (req.file.filename) {
        payload.img = payload.img || `/uploads/${req.file.filename}`;
      } else if (req.file.path) {
        payload.img = payload.img || req.file.path;
      }
    }

    if (payload.price != null) payload.price = Number(payload.price);
    if (payload.stock != null) payload.stock = Number(payload.stock);

    // Only allow specific fields to be updated
    const allowedFields = ["name", "price", "category", "stock", "img", "desc", "visible"];
    const updateData = {};
    allowedFields.forEach((f) => {
      if (payload[f] !== undefined) updateData[f] = payload[f];
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const item = await menuRepo.update(id, updateData);
    if (!item) return res.status(404).json({ error: "Not Found" });
    
    return res.json({ ok: true, item });
  } catch (err) {
    console.error("[MENU] update error:", err);
    return res.status(500).json({ error: "Failed to update item", details: err.message || String(err) });
  }
};

exports.remove = async (req, res) => {
  try {
    const menuRepo = RepositoryFactory.getMenuRepository();
    const id = req.params.id;
    
    const result = await menuRepo.delete(id);
    if (!result) {
      return res.status(404).json({ error: "Item not found" });
    }

    console.log('[MENU] Soft delete: item marked as deleted', id);
    res.json({ success: true });
  } catch (err) {
    console.error("[MENU] delete error:", err);
    return res.status(500).json({ error: "Failed to delete item" });
  }
};
