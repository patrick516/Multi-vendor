// backend/routes/products.js
const express = require("express");
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  markProductSold,
} = require("../controllers/productsController");
const { authRequired, requireRole } = require("../middleware/auth");
const uploadProductImages = require("../middleware/uploadProductImages");

// Public list
router.get("/", getProducts);
router.get("/:id", getProductById);

// Protected (vendor / super admin) - create product with images
router.post(
  "/",
  authRequired,
  requireRole("VENDOR", "SUPER_ADMIN"),
  uploadProductImages,
  createProduct
);

router.put("/:id", authRequired, updateProduct);
router.delete("/:id", authRequired, deleteProduct);

// Vendor marks item as sold
router.post(
  "/:id/mark-sold",
  authRequired,
  requireRole("VENDOR", "SUPER_ADMIN"),
  markProductSold
);

module.exports = router;
