// backend/routes/stats.js
const express = require("express");
const router = express.Router();
const {
  getPublicStats,
  getMarketplaceStats,
  getTopProducts,
} = require("../controllers/statsController");

router.get("/stats", getPublicStats);
router.get("/marketplace", getMarketplaceStats);
router.get("/top-products", getTopProducts);

module.exports = router;
