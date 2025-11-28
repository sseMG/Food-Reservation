const RepositoryFactory = require("../repositories/repository.factory");
const { DEFAULT_CATEGORIES } = require("../constants/categories");

const normalizeName = (name) => String(name || "").trim();
const toKey = (name) => normalizeName(name).toLowerCase();
const getName = (objOrString) => normalizeName(typeof objOrString === 'string' ? objOrString : (objOrString && objOrString.name));
const isDefaultCategory = (name) => {
  const key = toKey(name);
  return DEFAULT_CATEGORIES.some((def) => toKey(def) === key);
};

const dedupe = (list = []) => {
  const seen = new Set();
  const result = [];
  for (const item of list) {
    const norm = getName(item);
    if (!norm) continue;
    const key = toKey(norm);
    if (seen.has(key)) continue;
    seen.add(key);
    // If item is object with iconID, prefer it; otherwise build object
    if (item && typeof item === 'object' && item.name) {
      result.push({ iconID: item.iconID, name: norm });
    } else {
      result.push({ name: norm });
    }
  }
  return result;
};

async function fetchCategories() {
  const repo = RepositoryFactory.getCategoryRepository();
  const categories = await repo.findAll();
  // repo.findAll now returns objects [{ iconID, name }]; ensure defaults are included by ensureDefaults logic
  return dedupe(categories || []);
}

exports.list = async (_req, res) => {
  try {
    const categories = await fetchCategories();
    res.json({ status: 200, data: categories });
  } catch (err) {
    console.error("[CATEGORIES] list error:", err);
    res.status(500).json({ error: "Failed to load categories" });
  }
};

exports.create = async (req, res) => {
  try {
    const name = normalizeName(req.body && req.body.name);
    const iconID = typeof req.body.iconID === 'number' ? req.body.iconID : undefined;
    if (!name) {
      return res.status(400).json({ error: "Category name is required" });
    }
    if (typeof iconID !== 'undefined' && (!Number.isInteger(iconID) || iconID < 0)) {
      return res.status(400).json({ error: "iconID must be a non-negative integer" });
    }
    const categories = await fetchCategories();
    if (categories.some((c) => toKey(c.name || c) === toKey(name))) {
      return res.status(409).json({ error: "Category already exists" });
    }
    const repo = RepositoryFactory.getCategoryRepository();
    await repo.create({ name, iconID });
    const updated = await fetchCategories();
    res.json({ ok: true, categories: updated });
  } catch (err) {
    console.error("[CATEGORIES] create error:", err);
    res.status(500).json({ error: "Failed to create category" });
  }
};

exports.rename = async (req, res) => {
  try {
    const { oldName, newName, iconID } = req.body || {};
    const from = normalizeName(oldName);
    const to = normalizeName(newName);
    if (!from || !to) {
      return res.status(400).json({ error: "Both current and new category names are required" });
    }
    if (typeof iconID !== 'undefined' && (!Number.isInteger(iconID) || iconID < 0)) {
      return res.status(400).json({ error: "iconID must be a non-negative integer" });
    }
    if (isDefaultCategory(from)) {
      return res.status(403).json({ error: "Default categories cannot be renamed" });
    }
    const categories = await fetchCategories();
    if (!categories.some((c) => toKey(c.name || c) === toKey(from))) {
      return res.status(404).json({ error: "Category not found" });
    }
    if (categories.some((c) => toKey(c.name || c) === toKey(to))) {
      return res.status(409).json({ error: "Target category name already exists" });
    }

    const repo = RepositoryFactory.getCategoryRepository();
    await repo.rename(from, to, iconID);

    // Update menu items to reflect the rename
    const menuRepo = RepositoryFactory.getMenuRepository();
    const menuItems = await menuRepo.findAll({ includeDeleted: "true" });
    const toUpdate = menuItems.filter((item) => toKey(item.category) === toKey(from));
    await Promise.all(
      toUpdate.map((item) =>
        menuRepo.update(item.id, {
          category: to,
        })
      )
    );

    const updated = await fetchCategories();
    res.json({ ok: true, categories: updated, renamed: toUpdate.length });
  } catch (err) {
    console.error("[CATEGORIES] rename error:", err);
    res.status(500).json({ error: "Failed to rename category" });
  }
};

exports.remove = async (req, res) => {
  try {
    const name = normalizeName(req.body && req.body.name || req.query && req.query.name);
    if (!name) {
      return res.status(400).json({ error: "Category name is required" });
    }
    if (isDefaultCategory(name)) {
      return res.status(403).json({ error: "Default categories cannot be deleted" });
    }

    const menuRepo = RepositoryFactory.getMenuRepository();
    const menuItems = await menuRepo.findAll({ includeDeleted: "false" });
    const hasItems = menuItems.some((item) => toKey(item.category) === toKey(name));
    if (hasItems) {
      return res.status(409).json({ error: "Cannot delete category with existing menu items" });
    }

    const repo = RepositoryFactory.getCategoryRepository();
    const deleted = await repo.delete(name);
    if (!deleted) {
      return res.status(404).json({ error: "Category not found" });
    }
    const updated = await fetchCategories();
    res.json({ ok: true, categories: updated });
  } catch (err) {
    console.error("[CATEGORIES] delete error:", err);
    res.status(500).json({ error: "Failed to delete category" });
  }
};

exports.fromMenu = async (req, res) => {
  try {
    const includeZeroStock = req.query.includeZeroStock === "true";
    const menuRepo = RepositoryFactory.getMenuRepository();
    const menuItems = await menuRepo.findAll({ includeDeleted: req.query.includeDeleted });
    const categoriesFromMenu = dedupe(
      menuItems
        .filter((item) => {
          const stock = Number(item.stock ?? 0);
          return includeZeroStock ? true : stock > 0;
        })
        .map((item) => item.category)
    );
    // Map deduped menu category names to known categories (with id if exists)
    const categoryRepo = RepositoryFactory.getCategoryRepository();
    const existing = await categoryRepo.findAll();
    const existingByKey = new Map((existing || []).map((c) => [toKey(c.name || c), c]));
    const categories = categoriesFromMenu.map((c) => {
      const name = c && c.name ? c.name : String(c || '').trim();
      const key = toKey(name);
      return existingByKey.get(key) || { name };
    });
    res.json({ status: 200, data: categories });
  } catch (err) {
    console.error("[CATEGORIES] fromMenu error:", err);
    res.status(500).json({ error: "Failed to extract categories from menu" });
  }
};


