// backend/routes/commissions.js
const express = require("express");
const router = express.Router();
const {
  getCommissionSummary,
  getVendorCommissions,
  markCommissionPaid,
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

module.exports = router;
