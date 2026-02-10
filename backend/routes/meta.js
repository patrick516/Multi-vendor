// backend/routes/meta.js
const express = require("express");
const router = express.Router();
const { getDistricts } = require("../controllers/metaController");

// Public (no auth): list of districts to use in frontend & website
router.get("/districts", getDistricts);

module.exports = router;
