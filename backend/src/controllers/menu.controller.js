const RepositoryFactory = require("../repositories/repository.factory");
const ImageUploadFactory = require("../repositories/image-upload/image-upload.factory");

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

exports.get = async (req, res) => {
  try {
    const menuRepo = RepositoryFactory.getMenuRepository();
    const id = req.params.id;

    // Return item regardless of soft-delete state (repo returns DB entry)
    const item = await menuRepo.findById(id);
    if (!item) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    return res.json({ status: 200, data: item });
  } catch (err) {
    console.error("[MENU] get error:", err);
    return res.status(500).json({ error: "Failed to get menu item" });
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
    
    // Get existing item to check for old image
    const existing = await menuRepo.findById(id);
    if (!existing) {
      return res.status(404).json({ error: "Menu item id for update not found" });
    }

    // Handle image upload and delete old image if new one is provided
    if (req.file) {
      const imageRepo = ImageUploadFactory.getRepository();
      
      // Delete old image if it exists
      if (existing.img) {
        try {
          await imageRepo.delete(existing.img);
        } catch (err) {
          console.error("[MENU] Failed to delete old menu image after update:", err);
          // Continue even if delete fails
        }
      }
      
      // Upload new image using repository pattern
      const result = await imageRepo.upload(req.file, {
        prefix: existing.name ? existing.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") : "item",
        folder: 'menu'
      });
      payload.img = result.url;
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
    
    // Get existing item to check for associated image
    const existing = await menuRepo.findById(id);
    if (!existing) {
      return res.status(404).json({ error: "Menu item id for remove not found" });
    }

    // Delete associated image if it exists
    if (existing.img) {
      try {
        const imageRepo = ImageUploadFactory.getRepository();
        await imageRepo.delete(existing.img);
      } catch (err) {
        console.error("[MENU] Failed to delete associated menu image after remove:", err);
        // Continue even if delete fails
      }
    }
    
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
