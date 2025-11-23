// backend/routes/subscriptions.js
const express = require("express");
const router = express.Router();
const {
  listVendors,
  markVendorPaid,
  blockVendor,
  unblockVendor,
  updateSubscriptionAmount,
  getVendorPayments,
} = require("../controllers/subscriptionController");
const { authRequired, requireRole } = require("../middleware/auth");

// All these routes are SUPER_ADMIN only
router.get("/vendors", authRequired, requireRole("SUPER_ADMIN"), listVendors);

router.post(
  "/vendor/:vendorId/mark-paid",
  authRequired,
  requireRole("SUPER_ADMIN"),
  markVendorPaid
);

router.post(
  "/vendor/:vendorId/block",
  authRequired,
  requireRole("SUPER_ADMIN"),
  blockVendor
);

router.post(
  "/vendor/:vendorId/unblock",
  authRequired,
  requireRole("SUPER_ADMIN"),
  unblockVendor
);

router.post(
  "/settings/update",
  authRequired,
  requireRole("SUPER_ADMIN"),
  updateSubscriptionAmount
);

router.get(
  "/vendor/:vendorId/payments",
  authRequired,
  requireRole("SUPER_ADMIN"),
  getVendorPayments
);

module.exports = router;
