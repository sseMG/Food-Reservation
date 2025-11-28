const express = require("express");
const router = express.Router();
const Categories = require("../controllers/categories.controller");

router.get("/", Categories.list);
router.get("/from-menu", Categories.fromMenu);

module.exports = router;


