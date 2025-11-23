// backend/routes/search.js
const express = require("express");
const router = express.Router();
const { universalSearch } = require("../controllers/searchController");

// Public universal search
router.get("/", universalSearch);

module.exports = router;
