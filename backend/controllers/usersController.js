// backend/controllers/usersController.js

const bcrypt = require("bcryptjs");
const nodeCrypto = require("crypto");
const prisma = require("../config/prisma");
const { sendMail } = require("../config/mailer");

// GET /api/users/me
async function getMe(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }, // req.user comes from authRequired
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        subscriptionActive: true,
        lastPaymentDate: true,
        nextPaymentDue: true,
        subscriptionAmount: true,
        mustPay: true,
      },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json(user);
  } catch (err) {
    console.error("getMe error:", err);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
}

// GET /api/users (admin only)
async function getUsers(req, res) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        subscriptionActive: true,
        mustPay: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(users);
  } catch (err) {
    console.error("getUsers error:", err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
}

// DELETE /api/users/:id
async function deleteUser(req, res) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    // Don't allow deleting yourself
    if (req.user && req.user.id === id) {
      return res
        .status(400)
        .json({ message: "You cannot delete your own account." });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        products: true,
        orders: true,
        vendorCommissions: true,
        cartLeads: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // If user has related data, block hard delete to avoid FK issues
    if (
      (user.products && user.products.length > 0) ||
      (user.orders && user.orders.length > 0) ||
      (user.vendorCommissions && user.vendorCommissions.length > 0) ||
      (user.cartLeads && user.cartLeads.length > 0)
    ) {
      return res.status(400).json({
        message:
          "This user has related products/orders. Please block the account instead of deleting it.",
      });
    }

    await prisma.user.delete({
      where: { id },
    });

    return res.json({ message: "User deleted successfully." });
  } catch (err) {
    console.error("deleteUser error:", err);
    res.status(500).json({ message: "Failed to delete user" });
  }
}

/**
 * Admin: reset a user's password (generate temporary password)
 * POST /api/users/:id/reset-password
 */
async function adminResetUserPassword(req, res) {
  try {
    // Only SUPER_ADMIN can do this
    if (!req.user || req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const userId = Number(req.params.id);
    if (!userId || Number.isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate new temporary password
    const tempPassword = nodeCrypto.randomBytes(6).toString("hex");
    const hashed = await bcrypt.hash(tempPassword, 10);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashed,
        mustChangePassword: true, // force change on next login
      },
    });

    // Build login URL
    const baseUrl =
      (process.env.FRONTEND_BASE_URL &&
        process.env.FRONTEND_BASE_URL.replace(/\/$/, "")) ||
      "http://localhost:5173";
    const loginUrl = `${baseUrl}/login`;

    const subject = `${
      process.env.BRAND_NAME || "Trade Point Malawi"
    } — Vendor account password reset`;
    const text = `
Hello ${updatedUser.name || updatedUser.email},

A new temporary password has been generated for your vendor account on ${
      process.env.BRAND_NAME || "Trade Point Malawi"
    }.

Login details:
- Portal URL: ${loginUrl}
- Email: ${updatedUser.email}
- Temporary password: ${tempPassword}

Please log in and change your password as soon as possible.

Thank you,
${process.env.BRAND_NAME || "Trade Point Malawi"} Admin
`.trim();

    try {
      await sendMail({
        to: updatedUser.email,
        subject,
        text,
        html: text.replace(/\n/g, "<br/>"),
      });
    } catch (mailErr) {
      console.error("[MAIL] Failed to send reset email:", mailErr);
      // don't block the response just because email failed
    }

    return res.json({
      message: "Temporary password generated successfully.",
      temporaryPassword: tempPassword,
    });
  } catch (err) {
    console.error("adminResetUserPassword error:", err);
    return res.status(500).json({ message: "Failed to reset user password" });
  }
}

module.exports = {
  getMe,
  getUsers,
  deleteUser,
  adminResetUserPassword,
};
