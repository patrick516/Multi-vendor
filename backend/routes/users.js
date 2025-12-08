// backend/routes/users.js
const express = require("express");
const router = express.Router();
const {
  getMe,
  getUsers,
  deleteUser,
  adminResetUserPassword,
} = require("../controllers/usersController");
const { authRequired, requireRole } = require("../middleware/auth");

router.get("/me", authRequired, getMe);
router.get("/", authRequired, requireRole("SUPER_ADMIN"), getUsers);
router.delete("/:id", authRequired, requireRole("SUPER_ADMIN"), deleteUser);
router.post(
  "/:id/reset-password",
  authRequired,
  requireRole("SUPER_ADMIN"),
  adminResetUserPassword
);

module.exports = router;
