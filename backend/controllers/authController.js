// backend/controllers/authController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const prisma = require("../config/prisma");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// Email transporter (reuse SMTP settings)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

// Helper: check if the request is coming from a SUPER_ADMIN (via JWT)
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

// Helper: send welcome email with temporary password & login link
async function sendNewUserEmail(user, plainPassword) {
  try {
    const loginUrl =
      process.env.FRONTEND_BASE_URL?.replace(/\/$/, "") + "/login" ||
      "http://localhost:5173/login";

    const subject = `Your ${
      process.env.BRAND_NAME || "Multi Vendor Shop"
    } account`;
    const text = `
Hello ${user.name || user.email},

An administrator has created an account for you on ${
      process.env.BRAND_NAME || "Multi Vendor Shop"
    }.

Login details:
- Portal URL: ${loginUrl}
- Email: ${user.email}
- Temporary password: ${plainPassword}

On your first login, you will be prompted to change this password. 
For security, please change it immediately and do not share it with anyone.

Regards,
${process.env.BRAND_NAME || "Multi Vendor Shop"} Admin
`;

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: user.email,
      subject,
      text,
    });
  } catch (err) {
    console.error("Failed to send new user email:", err);
    // don't fail registration just because email failed
  }
}

// POST /api/auth/register
// Rules:
// - If there are 0 users: create FIRST user as SUPER_ADMIN (no auth needed, mustChangePassword=false)
// - If there is already at least 1 user:
//   - Only SUPER_ADMIN (with valid token) may create users
//   - New users can be VENDOR or CUSTOMER (NOT SUPER_ADMIN)
//   - New users get mustChangePassword=true and welcome email
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
    let mustChangePassword = false;

    if (totalUsers === 0) {
      // 👑 First user ever: always SUPER_ADMIN
      userRole = "SUPER_ADMIN";
      mustChangePassword = false; // admin sets their own password
    } else {
      // After first user: only SUPER_ADMIN can create accounts
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

      // Admin-created accounts must change password on first login
      mustChangePassword = true;
    }

    const user = await prisma.user.create({
      data: {
        name: name || "",
        email,
        password: hashed,
        role: userRole,
        mustChangePassword,
      },
    });

    // If this is an admin-created account (not the very first user), send welcome email
    if (totalUsers > 0) {
      await sendNewUserEmail(user, password);
    }

    const token = signToken(user);

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
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
        mustChangePassword: user.mustChangePassword,
      },
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Failed to login" });
  }
}

// below login
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Current and new password are required" });
    }

    const userId = req.user.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashed,
        mustChangePassword: false,
      },
    });

    return res.json({
      message: "Password changed successfully",
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role,
        mustChangePassword: updated.mustChangePassword,
      },
    });
  } catch (err) {
    console.error("changePassword error:", err);
    return res.status(500).json({ message: "Failed to change password" });
  }
}

module.exports = {
  register,
  login,
  changePassword,
};
