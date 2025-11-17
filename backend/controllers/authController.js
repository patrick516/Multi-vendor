// backend/controllers/authController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

// Helper: try to read SUPER_ADMIN from Authorization header
function isRequestFromSuperAdmin(req) {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) return false;

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded && decoded.role === "SUPER_ADMIN";
  } catch {
    return false;
  }
}

// POST /api/auth/register
// Rules:
// - If there are 0 users: create FIRST user as SUPER_ADMIN (no auth needed)
// - If there is already at least 1 user:
//   - Only SUPER_ADMIN (with valid token) may create users
//   - New users can be VENDOR or CUSTOMER (NOT SUPER_ADMIN)
async function register(req, res) {
  try {
    const { name, email, password, role } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);

    // Count existing users
    const totalUsers = await prisma.user.count();

    let userRole;

    if (totalUsers === 0) {
      // 👑 First user ever: always SUPER_ADMIN, public registration allowed
      userRole = "SUPER_ADMIN";
    } else {
      // After first user: registration is ADMIN-ONLY
      const isAdmin = isRequestFromSuperAdmin(req);
      if (!isAdmin) {
        return res.status(403).json({
          message:
            "Registration is disabled. Only the existing admin can create new accounts.",
        });
      }

      // Only allow VENDOR or CUSTOMER for new users
      const allowedRoles = ["VENDOR", "CUSTOMER"];
      if (role === "SUPER_ADMIN") {
        return res.status(400).json({
          message: "Only one SUPER_ADMIN is allowed in the system.",
        });
      }

      userRole = allowedRoles.includes(role) ? role : "CUSTOMER";
    }

    const user = await prisma.user.create({
      data: {
        name: name || "",
        email,
        password: hashed,
        role: userRole,
      },
    });

    const token = signToken(user);

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Failed to register user" });
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signToken(user);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Failed to login" });
  }
}

module.exports = {
  register,
  login,
};
