// backend/routes/cart.js
const express = require("express");
const router = express.Router();
const { createCartLead } = require("../controllers/cartController");

// Public endpoint – customers are not authenticated
router.post("/", createCartLead);

module.exports = router;
