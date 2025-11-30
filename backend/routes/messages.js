// backend/routes/messages.js
const express = require("express");
const router = express.Router();
const { authRequired, requireRole } = require("../middleware/auth");
const {
  sendVendorMessage,
  getMessageHistory,
} = require("../controllers/messageController");

// Send a message to one / many / all vendors
router.post(
  "/vendors",
  authRequired,
  requireRole("SUPER_ADMIN"), // or ["SUPER_ADMIN"] if only admins should send
  sendVendorMessage
);

// History (admin only)
router.get(
  "/history",
  authRequired,
  requireRole("SUPER_ADMIN"),
  getMessageHistory
);

module.exports = router;
