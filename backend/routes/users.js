// backend/routes/users.js
const express = require("express");
const router = express.Router();
const { getMe, getUsers } = require("../controllers/usersController");
const { authRequired, requireRole } = require("../middleware/auth");

router.get("/me", authRequired, getMe);
router.get("/", authRequired, requireRole("SUPER_ADMIN"), getUsers);

module.exports = router;
