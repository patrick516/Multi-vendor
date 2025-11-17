const express = require("express");
const router = express.Router();
const {
  getOrders,
  createOrder,
  updateOrder,
} = require("../controllers/ordersController");
const { authRequired } = require("../middleware/auth");

router.get("/", authRequired, getOrders);
router.post("/", authRequired, createOrder);
router.put("/:id", authRequired, updateOrder); // 👈 NEW

module.exports = router;
