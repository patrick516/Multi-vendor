// backend/routes/categories.js
const express = require("express");
const router = express.Router();
const { getCategories } = require("../controllers/metaController");

// Public or protected? For now, keep public (website can also use it)
router.get("/", getCategories);

module.exports = router;
