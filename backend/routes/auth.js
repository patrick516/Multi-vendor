const express = require("express");
const router = express.Router();
const {
  register,
  login,
  changePassword,
  publicVendorRegister,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");
const { authRequired } = require("../middleware/auth");

router.post("/register", register);
router.post("/login", login);
router.post("/change-password", authRequired, changePassword);
router.post("/vendor-register", publicVendorRegister);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
