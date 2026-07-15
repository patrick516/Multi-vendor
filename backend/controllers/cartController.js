const prisma = require("../config/prisma");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { sendMail } = require("../config/mailer");
// Convert Malawi numbers: 0882 → 265882
function normalizeToWhatsAppPhone(rawPhone, defaultCountry = "265") {
  if (!rawPhone) return null;
  let digits = rawPhone.replace(/[^\d]/g, "");

  if (!digits) return null;

  if (digits.startsWith("0") && digits.length >= 9 && digits.length <= 10) {
    return defaultCountry + digits.slice(1);
  }

  // If already starts with 265 keep it
  if (digits.startsWith(defaultCountry)) return digits;

  // Fallback: prefix
  return defaultCountry + digits;
}

function buildWhatsAppLink(phone, message) {
  if (!phone) return null;
  const encoded = encodeURIComponent(message || "");
  return `https://wa.me/${phone}?text=${encoded}`;
}

// ----------------------------------------------
// Helper: create or reuse a customer user
// ----------------------------------------------
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

// ------------------------------------------------------
// Main createCartRequest
// ------------------------------------------------------
async function createCartRequest(req, res) {
  try {
    const {
      productId,
      quantity,
      customerName,
      customerEmail,
      customerPhone,
      note,
      type,
      skipOrder,
    } = req.body;

    if (!productId || !customerName) {
      return res
        .status(400)
        .json({ message: "productId and customerName are required" });
    }

    const leadType = type === "BUY_NOW" ? "BUY_NOW" : "CONTACT";
    const qty = Number(quantity) || 1;

    const product = await prisma.product.findUnique({
      where: { id: Number(productId) },
      include: { vendor: true },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (!product.vendor || !product.vendor.email) {
      return res
        .status(400)
        .json({ message: "Vendor email missing — contact admin." });
    }

    const vendorEmail = product.vendor.email;
    const vendorName = product.vendor.name || vendorEmail;

    // Create or reuse a user for BUY NOW orders
    const customerUser = await findOrCreateCustomerUser(
      customerName,
      customerEmail,
    );

    // Calculate price
    const unitPrice =
      typeof product.displayPrice === "number" && !isNaN(product.displayPrice)
        ? product.displayPrice
        : product.basePrice || 0;

    const totalAmount = unitPrice * qty;

    // 1) Create CartLead (userId optional)
    const lead = await prisma.cartLead.create({
      data: {
        productId: product.id,
        vendorId: product.vendorId,
        customerName,
        customerEmail: customerEmail || null,
        customerPhone: customerPhone || null,
        quantity: qty,
        note: note || null,
        status: "NEW",
        type: leadType,
      },
    });

    // 2) Create Order (if BUY NOW)
    let order = null;
    if (!skipOrder && leadType === "BUY_NOW") {
      order = await prisma.order.create({
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
    }

    // -------------------------------------------------------
    // 🔥 PREFILLED WHATSAPP MESSAGE FOR THE VENDOR
    // -------------------------------------------------------
    const waNumber = normalizeToWhatsAppPhone(customerPhone);

    const waMessage = `
Hello ${customerName},

Regarding your enquiry on Trade Point Malawi:

Product: ${product.name}
Product ID: ${product.id}
Quantity: ${qty}

Message from customer:
${note || "No message provided."}

Contact details:
Phone: ${customerPhone || "N/A"}
Email: ${customerEmail || "N/A"}
`.trim();

    const whatsappLink = buildWhatsAppLink(waNumber, waMessage);

    // -------------------------------------------------------
    // 3) SEND EMAIL TO VENDOR (UPDATED WITH WHATSAPP LINK)
    // -------------------------------------------------------
    const subject =
      leadType === "BUY_NOW"
        ? `New BUY NOW order: ${qty} x ${product.name}`
        : `New enquiry: ${product.name}`;

    const text = `
Hello ${vendorName},

You have a new ${leadType === "BUY_NOW" ? "BUY NOW order" : "customer enquiry"}.

Product: ${product.name}
Quantity: ${qty}
Customer: ${customerName}
Contact: ${customerPhone || "N/A"} / ${customerEmail || "N/A"}
Message: ${note || "N/A"}

Click below to reply instantly on WhatsApp:
${whatsappLink || "Customer did not provide a valid phone number."}

Regards,
${process.env.BRAND_NAME || "Trade Point Malawi"} System
`.trim();

    try {
      await sendMail({
        to: vendorEmail,
        subject,
        text,
      });
    } catch (mailErr) {
      console.error("[MAIL] Vendor notification failed, continuing:", mailErr);
    }

    return res.status(201).json({
      message:
        leadType === "BUY_NOW"
          ? "Buy now request sent to vendor."
          : "Your message has been sent to the vendor.",
      lead,
      order,
    });
  } catch (err) {
    console.error("createCartRequest error:", err);
    return res.status(500).json({ message: "Failed to process your request" });
  }
}

module.exports = {
  createCartRequest,
};
