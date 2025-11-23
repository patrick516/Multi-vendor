// backend/controllers/ordersController.js
const prisma = require("../config/prisma");
const { createCartRequest } = require("./cartController");

// GET /api/orders
async function getOrders(req, res) {
  try {
    let where = {};

    if (req.user.role === "CUSTOMER") {
      where = { customerId: req.user.id };
    } else if (req.user.role === "VENDOR") {
      where = { items: { some: { product: { vendorId: req.user.id } } } };
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, email: true } },
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(orders);
  } catch (err) {
    console.error("getOrders error:", err);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
}

// POST /api/orders (generic)
async function createOrder(req, res) {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Order items are required" });
    }

    const productIds = items.map((i) => Number(i.productId));
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== items.length) {
      return res
        .status(400)
        .json({ message: "One or more products not found" });
    }

    let totalAmount = 0;
    const orderItemsData = items.map((item) => {
      const product = products.find((p) => p.id === Number(item.productId));
      const quantity = Number(item.quantity) || 1;
      const unitPrice = product.displayPrice || product.basePrice || 0;
      totalAmount += unitPrice * quantity;

      return {
        productId: product.id,
        quantity,
        unitPrice,
      };
    });

    const order = await prisma.order.create({
      data: {
        customerId: req.user.id,
        totalAmount,
        status: "PENDING",
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: true,
      },
    });

    res.status(201).json(order);
  } catch (err) {
    console.error("createOrder error:", err);
    res.status(500).json({ message: "Failed to create order" });
  }
}

// PUT /api/orders/:id (update status)
async function updateOrder(req, res) {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const validStatuses = ["PENDING", "PAID", "CANCELLED", "COMPLETED"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (req.user.role !== "SUPER_ADMIN") {
      const ownsAny = order.items.some(
        (item) => item.product.vendorId === req.user.id
      );
      if (!ownsAny) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { status },
    });

    return res.json({
      message: "Order updated successfully",
      order: updated,
    });
  } catch (err) {
    console.error("updateOrder error:", err);
    res.status(500).json({ message: "Failed to update order" });
  }
}

// POST /api/orders/buy-now
async function buyNow(req, res) {
  req.body.type = "BUY_NOW";
  req.body.skipOrder = false;
  return createCartRequest(req, res);
}

// POST /api/orders/contact-vendor
async function contactVendor(req, res) {
  req.body.type = "CONTACT";
  req.body.skipOrder = true; // we only want a lead + email
  return createCartRequest(req, res);
}

module.exports = {
  getOrders,
  createOrder,
  updateOrder,
  buyNow,
  contactVendor,
};
