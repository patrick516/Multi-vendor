// backend/routes/commissions.js
const express = require("express");
const router = express.Router();
const {
  getCommissionSummary,
  getVendorCommissions,
  markCommissionPaid,
  markVendorCommissionsPaid,
} = require("../controllers/commissionController");
const { authRequired, requireRole } = require("../middleware/auth");

// Only SUPER_ADMIN
router.get(
  "/summary",
  authRequired,
  requireRole("SUPER_ADMIN"),
  getCommissionSummary
);
router.get(
  "/vendor/:vendorId",
  authRequired,
  requireRole("SUPER_ADMIN"),
  getVendorCommissions
);
router.post(
  "/:id/mark-paid",
  authRequired,
  requireRole("SUPER_ADMIN"),
  markCommissionPaid
);

// NEW: mark all pending commissions for a vendor as PAID
router.post(
  "/vendor/:vendorId/mark-paid-all",
  authRequired,
  requireRole("SUPER_ADMIN"),
  markVendorCommissionsPaid
);

module.exports = router;
