// backend/routes/messages.js
const express = require("express");
const router = express.Router();
const { authRequired, requireRole } = require("../middleware/auth");
const {
  sendVendorMessage,
  getMessageHistory,
  deleteMessage,
} = require("../controllers/messageController");

// Send a message to one / many / all vendors
router.post(
  "/vendors",
  authRequired,
  requireRole("SUPER_ADMIN"),
  sendVendorMessage
);

// History (admin only)
router.get(
  "/history",
  authRequired,
  requireRole("SUPER_ADMIN"),
  getMessageHistory
);

// Delete a message log (admin only)
router.delete("/:id", authRequired, requireRole("SUPER_ADMIN"), deleteMessage);

module.exports = router;
