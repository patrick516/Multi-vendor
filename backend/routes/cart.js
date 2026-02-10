// backend/routes/cart.js
const express = require("express");
const router = express.Router();
const { createCartRequest } = require("../controllers/cartController");
router.post("/", createCartRequest);

module.exports = router;
