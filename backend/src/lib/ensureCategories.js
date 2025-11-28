const RepositoryFactory = require("../repositories/repository.factory");
const { DEFAULT_CATEGORIES } = require("../constants/categories");

async function ensureDefaultCategories() {
  try {
    const categoryRepo = RepositoryFactory.getCategoryRepository();
    const menuRepo = RepositoryFactory.getMenuRepository();
    
    // First ensure default categories exist
    if (typeof categoryRepo.ensureDefaults === "function") {
      await categoryRepo.ensureDefaults(DEFAULT_CATEGORIES);
    } else {
      const existing = await categoryRepo.findAll();
      const keys = new Set((existing || []).map((c) => String((c && c.name) || c || "").trim().toLowerCase()));
      for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
        const def = DEFAULT_CATEGORIES[i];
        const norm = String(def || "").trim();
        if (!norm) continue;
        const key = norm.toLowerCase();
        if (!keys.has(key)) {
          await categoryRepo.create({ name: norm, iconID: i });
          keys.add(key);
        }
      }
    }

    // Now get all menu items and extract unique categories
    try {
      const menuItems = await menuRepo.findAll({});
      const existingCategories = await categoryRepo.findAll();
      const existingKeys = new Set(existingCategories.map(c => 
        String((c && c.name) || c).trim().toLowerCase()
      ));

      // Extract unique categories from menu items
      const menuCategories = new Set();
      for (const item of menuItems) {
        if (item.category) {
          const normCategory = String(item.category).trim();
          if (normCategory) {
            menuCategories.add(normCategory);
          }
        }
      }

      // Add any new categories from menu items to the categories collection
      for (const category of menuCategories) {
        const normalized = category.trim();
        const key = normalized.toLowerCase();
        if (!existingKeys.has(key)) {
          console.log(`[CATEGORIES] Adding new category from menu items: ${normalized}`);
          await categoryRepo.create({ name: normalized });
          existingKeys.add(key);
        }
      }
    } catch (err) {
      console.error("[CATEGORIES] Error syncing categories from menu items:", 
        err && err.message ? err.message : err);
      // Don't fail the whole startup if sync fails
    }
  } catch (err) {
    console.error("[CATEGORIES] Failed to ensure default categories:", 
      err && err.message ? err.message : err);
  }
}

module.exports = {
  ensureDefaultCategories,
};


