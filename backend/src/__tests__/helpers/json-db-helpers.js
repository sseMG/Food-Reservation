const { load, save } = require('../../lib/db');

/**
 * Test-only helper: reset JSON DB collections used in tests.
 * Keeps defaults logic in repositories/controllers untouched.
 */
async function resetJsonCategories() {
  const db = await load();
  // Clear JSON food_categories so category tests start from a clean slate
  db.food_categories = [];
  await save(db);
}

module.exports = {
  resetJsonCategories,
};
