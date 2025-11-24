const RepositoryFactory = require("../repositories/repository.factory");

exports.addStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { qty } = req.body;
    const menuRepo = RepositoryFactory.getMenuRepository();
    await menuRepo.incrementStock(id, Number(qty));
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Unable to update stock" });
  }
};