const express = require("express");
const router = express.Router();
const {
  register,
  login,
  changePassword,
  publicVendorRegister,
} = require("../controllers/authController");
const { authRequired } = require("../middleware/auth");

router.post("/register", register);
router.post("/login", login);
router.post("/change-password", authRequired, changePassword);
router.post("/vendor-register", publicVendorRegister);

module.exports = router;
