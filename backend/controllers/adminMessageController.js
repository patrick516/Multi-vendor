// backend/controllers/adminMessageController.js
const prisma = require("../config/prisma");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * POST /api/admin/messages/vendors
 * Body: { vendorIds?: number[], subject?: string, message: string }
 * - If vendorIds provided: send only to those vendors
 * - If not provided or empty: send to all vendors
 */
async function sendVendorMessage(req, res) {
  try {
    const { vendorIds, subject, message } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({ message: "Message text is required" });
    }

    const where = {
      role: "VENDOR",
      ...(Array.isArray(vendorIds) && vendorIds.length > 0
        ? { id: { in: vendorIds.map((id) => Number(id)) } }
        : {}),
    };

    const vendors = await prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true },
    });

    if (vendors.length === 0) {
      return res
        .status(404)
        .json({ message: "No vendors found for this message" });
    }

    const brand = process.env.BRAND_NAME || "Trade Point Malawi";
    const finalSubject =
      subject && subject.trim().length > 0
        ? subject
        : `Message from ${brand} admin`;

    const promises = vendors
      .map((vendor) => {
        const to = vendor.email;
        if (!to) return null;

        const text = `Hello ${vendor.name || vendor.email},

${message}

Regards,
${brand} Admin`;

        return transporter.sendMail({
          from: process.env.SMTP_FROM,
          to,
          subject: finalSubject,
          text,
        });
      })
      .filter(Boolean);

    await Promise.all(promises);

    return res.json({
      message: `Message sent to ${vendors.length} vendor(s).`,
      count: vendors.length,
    });
  } catch (err) {
    console.error("sendVendorMessage error:", err);
    return res.status(500).json({ message: "Failed to send vendor message" });
  }
}

module.exports = {
  sendVendorMessage,
};
