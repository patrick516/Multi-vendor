// backend/routes/orders.js
const express = require("express");
const router = express.Router();
const { getOrders, createOrder } = require("../controllers/ordersController");
const { authRequired } = require("../middleware/auth");

router.get("/", authRequired, getOrders);
router.post("/", authRequired, createOrder);

module.exports = router;
