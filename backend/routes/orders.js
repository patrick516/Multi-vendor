// backend/routes/orders.js
const express = require("express");
const router = express.Router();
const {
  getOrders,
  createOrder,
  updateOrder,
  buyNow,
  contactVendor,
} = require("../controllers/ordersController");
const { authRequired } = require("../middleware/auth");

// Admin / vendor orders
router.get("/", authRequired, getOrders);
router.post("/", authRequired, createOrder);
router.put("/:id", authRequired, updateOrder);

// Public endpoints used by website
router.post("/buy-now", buyNow);
router.post("/contact-vendor", contactVendor);

module.exports = router;
