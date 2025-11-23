// backend/controllers/usersController.js
const prisma = require("../config/prisma");

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
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(users);
  } catch (err) {
    console.error("getUsers error:", err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
}

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

module.exports = {
  getMe,
  getUsers,
  deleteUser,
};
