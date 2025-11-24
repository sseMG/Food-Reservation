const RepositoryFactory = require("../repositories/repository.factory");

/**
 * GET /api/cart
 */
exports.get = async (req, res) => {
  try {
    const uid = req.user && req.user.id;
    if (!uid) return res.status(401).json({ error: "Unauthorized" });

    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Invalid user session" });
    }

    const cartRepo = RepositoryFactory.getCartRepository();
    let cart = await cartRepo.findByUserId(uid);
    
    if (!cart) {
      cart = await cartRepo.create({ userId: uid, items: [] });
    }
    
    const items = cart.items || [];
    return res.json({ 
      status: 200, 
      data: { 
        items, 
        cart: items.reduce((m, it) => ({ ...m, [it.itemId]: it.qty }), {}) 
      } 
    });
  } catch (err) {
    console.error("[CART] get error:", err && err.message);
    return res.status(500).json({ error: "Failed to load cart" });
  }
};

/**
 * POST /api/cart/add
 * Body: { itemId, qty = 1, name?, price? }
 */
exports.addItem = async (req, res) => {
  try {
    const uid = req.user && req.user.id;
    if (!uid) return res.status(401).json({ error: "Unauthorized" });

    const { itemId, qty = 1, name = "", price = 0 } = req.body || {};
    if (!itemId) return res.status(400).json({ error: "itemId required" });
    
    const q = Math.max(0, Number(qty) || 0);
    if (q <= 0) return res.status(400).json({ error: "qty must be > 0" });

    const cartRepo = RepositoryFactory.getCartRepository();
    const cart = await cartRepo.addItem(uid, { itemId, qty: q, name, price });
    
    return res.json({ status: 200, data: { ok: true, items: cart.items } });
  } catch (err) {
    console.error("[CART] addItem error:", err && err.message);
    return res.status(500).json({ error: "Failed to add to cart" });
  }
};

/**
 * POST /api/cart/update
 */
exports.updateItem = async (req, res) => {
  try {
    const uid = req.user && req.user.id;
    if (!uid) return res.status(401).json({ error: "Unauthorized" });
    
    const { itemId, qty } = req.body || {};
    if (!itemId || typeof qty === "undefined") return res.status(400).json({ error: "itemId and qty required" });
    
    const q = Math.max(0, Number(qty) || 0);

    const cartRepo = RepositoryFactory.getCartRepository();
    const cart = await cartRepo.updateItem(uid, itemId, q);
    
    if (!cart) return res.status(404).json({ error: "Cart or item not found" });
    
    return res.json({ status: 200, data: { ok: true, items: cart.items } });
  } catch (err) {
    console.error("[CART] updateItem error:", err && err.message);
    return res.status(500).json({ error: "Failed to update cart" });
  }
};

/**
 * POST /api/cart/remove
 */
exports.removeItem = async (req, res) => {
  try {
    const uid = req.user && req.user.id;
    if (!uid) return res.status(401).json({ error: "Unauthorized" });
    
    const { itemId } = req.body || {};
    if (!itemId) return res.status(400).json({ error: "itemId required" });

    const cartRepo = RepositoryFactory.getCartRepository();
    const cart = await cartRepo.removeItem(uid, itemId);
    
    if (!cart) return res.status(404).json({ error: "Cart not found" });
    
    return res.json({ status: 200, data: { ok: true, items: cart.items } });
  } catch (err) {
    console.error("[CART] removeItem error:", err && err.message);
    return res.status(500).json({ error: "Failed to remove from cart" });
  }
};

/**
 * POST /api/cart/clear
 */
exports.clear = async (req, res) => {
  try {
    const uid = req.user && req.user.id;
    if (!uid) return res.status(401).json({ error: "Unauthorized" });

    const cartRepo = RepositoryFactory.getCartRepository();
    await cartRepo.clear(uid);
    
    return res.json({ status: 200, data: { ok: true } });
  } catch (err) {
    console.error("[CART] clear error:", err && err.message);
    return res.status(500).json({ error: "Failed to clear cart" });
  }
};