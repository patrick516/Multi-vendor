// backend/controllers/cartController.js
const prisma = require("../config/prisma");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

// Reuse your SMTP settings (same as productsController)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Helper: find or create a "customer" user for this email
async function findOrCreateCustomerUser(customerName, customerEmail) {
  const safeEmail =
    customerEmail && customerEmail.trim().length > 0
      ? customerEmail.trim()
      : `web-guest-${Date.now()}-${Math.random()
          .toString(16)
          .slice(2)}@guest.local`;

  let user = await prisma.user.findUnique({
    where: { email: safeEmail },
  });

  if (!user) {
    const randomPass = crypto.randomBytes(16).toString("hex");
    const hashed = await bcrypt.hash(randomPass, 10);

    user = await prisma.user.create({
      data: {
        name: customerName || "",
        email: safeEmail,
        password: hashed,
        role: "CUSTOMER",
        mustChangePassword: false,
      },
    });
  }

  return user;
}

// POST /api/cart
// Public endpoint: creates a lead, notifies vendor via email, and records an Order
async function createCartRequest(req, res) {
  try {
    const {
      productId,
      quantity,
      customerName,
      customerEmail,
      customerPhone,
      note,
    } = req.body;

    if (!productId || !customerName) {
      return res
        .status(400)
        .json({ message: "productId and customerName are required" });
    }

    const qty = Number(quantity) || 1;

    const product = await prisma.product.findUnique({
      where: { id: Number(productId) },
      include: {
        vendor: true,
      },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (!product.vendor || !product.vendor.email) {
      return res.status(400).json({
        message:
          "Vendor email is not configured for this product. Contact admin.",
      });
    }

    const vendorEmail = product.vendor.email;
    const vendorName = product.vendor.name || product.vendor.email;

    // 1) ensure we have a customer user for orders
    const customerUser = await findOrCreateCustomerUser(
      customerName,
      customerEmail
    );

    const unitPrice =
      typeof product.displayPrice === "number" && !isNaN(product.displayPrice)
        ? product.displayPrice
        : product.basePrice || 0;

    const totalAmount = unitPrice * qty;

    // Create an Order so vendor sees it in Orders page
    await prisma.order.create({
      data: {
        customerId: customerUser.id,
        totalAmount,
        status: "PENDING",
        customerPhone: customerPhone || null,
        customerNote: note || null,
        items: {
          create: {
            productId: product.id,
            quantity: qty,
            unitPrice,
          },
        },
      },
    });
    // 2) Send email to vendor
    const subject = `New order request: ${qty} x ${product.name}`;
    const text = `
Hello ${vendorName},

A customer has requested to buy your product "${product.name}".

Details:
- Product: ${product.name}
- Quantity requested: ${qty}
- Customer name: ${customerName}
- Customer email: ${customerEmail || "N/A"}
- Customer phone: ${customerPhone || "N/A"}
- Note: ${note || "N/A"}

Please contact the customer as soon as possible to process payment and delivery.

You can log in to your vendor portal to update this sale by marking the product as SOLD with the appropriate quantity. This will keep your stock and commission records up to date.

Regards,
${process.env.BRAND_NAME || "Multi Vendor Shop"} System
`;

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: vendorEmail,
      subject,
      text,
    };

    if (customerEmail && customerEmail.trim().length > 0) {
      mailOptions.replyTo = customerEmail.trim();
    }

    await transporter.sendMail(mailOptions);

    return res.status(201).json({
      message: "Cart request sent to vendor and order recorded.",
    });
  } catch (err) {
    console.error("createCartRequest error:", err);
    return res
      .status(500)
      .json({ message: "Failed to send cart request to vendor" });
  }
}

module.exports = {
  createCartRequest,
};
