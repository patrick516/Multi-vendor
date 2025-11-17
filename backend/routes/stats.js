// backend/routes/stats.js
const express = require("express");
const router = express.Router();
const { getPublicStats } = require("../controllers/statsController");

// Public stats for website
router.get("/stats", getPublicStats);

module.exports = router;
