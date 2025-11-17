// backend/controllers/cartController.js
const prisma = require("../config/prisma");
const transporter = require("../config/mailer"); // you created this earlier

async function createCartLead(req, res) {
  try {
    const {
      productId,
      customerName,
      customerEmail,
      customerPhone,
      note,
      quantity,
    } = req.body;

    if (!productId || !customerName) {
      return res
        .status(400)
        .json({ message: "productId and customerName are required" });
    }

    const product = await prisma.product.findUnique({
      where: { id: Number(productId) },
      include: {
        vendor: { select: { id: true, name: true, email: true } },
      },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const qty = Number(quantity) || 1;

    const lead = await prisma.cartLead.create({
      data: {
        productId: product.id,
        vendorId: product.vendorId,
        customerName,
        customerEmail: customerEmail || null,
        customerPhone: customerPhone || null,
        quantity: qty,
        note: note || null,
      },
    });

    // send email notification to admin + vendor
    const adminEmail = process.env.SUPPORT_EMAIL || process.env.SMTP_USER;
    const to = [
      adminEmail,
      product.vendor?.email, // may be null
    ]
      .filter(Boolean)
      .join(",");

    const subject = `New cart request (${qty} x ${product.name})`;

    const accountsText = [
      process.env.ADMIN_ACCOUNT_TNM && `• ${process.env.ADMIN_ACCOUNT_TNM}`,
      process.env.ADMIN_ACCOUNT_AIRTEL &&
        `• ${process.env.ADMIN_ACCOUNT_AIRTEL}`,
      process.env.ADMIN_ACCOUNT_BANK && `• ${process.env.ADMIN_ACCOUNT_BANK}`,
    ]
      .filter(Boolean)
      .join("\n");

    const text = `
A customer added the following product to cart:

Product: ${product.name}
Vendor: ${product.vendor?.name || product.vendor?.email || product.vendorId}
Quantity requested: ${qty}
Display price per unit: MK ${
      product.displayPrice ?? product.basePrice ?? product.price
    }
Total (customer side): MK ${
      (product.displayPrice ?? product.basePrice ?? product.price) * qty
    }

Customer details:
- Name: ${customerName}
- Email: ${customerEmail || "N/A"}
- Phone: ${customerPhone || "N/A"}
- Note: ${note || "N/A"}

Please contact the customer to proceed with the business.

Admin accounts for commission (for your reference):
${accountsText || "Not configured."}

Generated automatically by ${process.env.BRAND_NAME || "Multi Vendor Shop"}.
`;

    if (to) {
      try {
        await transporter.sendMail({
          from: process.env.SMTP_FROM,
          to,
          subject,
          text,
        });
      } catch (e) {
        console.error("Failed to send cart lead email:", e);
      }
    }

    res.status(201).json({ message: "Cart lead created", lead });
  } catch (err) {
    console.error("createCartLead error:", err);
    res.status(500).json({ message: "Failed to create cart lead" });
  }
}

module.exports = {
  createCartLead,
};
