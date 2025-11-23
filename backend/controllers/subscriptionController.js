// backend/controllers/subscriptionController.js
const prisma = require("../config/prisma");
const nodemailer = require("nodemailer");

// Email transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

// Send email helper
async function sendEmail(to, subject, text) {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      text,
    });
  } catch (err) {
    console.error("Email send failed:", err);
  }
}

// ===========================
// GET ALL VENDORS + SUBS
// ===========================
async function listVendors(req, res) {
  try {
    const vendors = await prisma.user.findMany({
      where: { role: "VENDOR" },
      select: {
        id: true,
        name: true,
        email: true,
        subscriptionActive: true,
        lastPaymentDate: true,
        nextPaymentDue: true,
        subscriptionAmount: true,
        createdAt: true,
      },
      orderBy: { name: "asc" },
    });

    return res.json(vendors);
  } catch (err) {
    console.error("listVendors error:", err);
    return res.status(500).json({ message: "Failed to fetch vendors" });
  }
}

// ===========================
// MARK PAID – now records payment history
// ===========================
async function markVendorPaid(req, res) {
  try {
    const vendorId = Number(req.params.vendorId);

    const now = new Date();
    const nextDue = new Date();
    nextDue.setDate(now.getDate() + 30);

    // Update vendor fields
    const vendor = await prisma.user.update({
      where: { id: vendorId },
      data: {
        lastPaymentDate: now,
        nextPaymentDue: nextDue,
        subscriptionActive: true,
      },
    });

    const amount = vendor.subscriptionAmount || 1000;

    // Record payment history
    await prisma.subscriptionPayment.create({
      data: {
        vendorId: vendor.id,
        amount,
        periodStart: now,
        periodEnd: nextDue,
        paidAt: now,
      },
    });

    await sendEmail(
      vendor.email,
      "Subscription Payment Approved",
      `Hello ${
        vendor.name
      },\n\nYour subscription payment has been approved.\nYour account is active until: ${nextDue.toDateString()}.\n\nThank you,\n${
        process.env.BRAND_NAME || "Trade Point Malawi"
      }`
    );

    return res.json({ message: "Vendor marked as paid", vendor });
  } catch (err) {
    console.error("markVendorPaid:", err);
    return res.status(500).json({ message: "Failed to mark vendor paid" });
  }
}

// ===========================
// BLOCK VENDOR
// ===========================
async function blockVendor(req, res) {
  try {
    const vendorId = Number(req.params.vendorId);

    const vendor = await prisma.user.update({
      where: { id: vendorId },
      data: { subscriptionActive: false },
    });

    await sendEmail(
      vendor.email,
      "Account Suspended",
      `Hello ${
        vendor.name
      },\n\nYour vendor account has been suspended due to unpaid subscription.\nPlease contact admin.\n\n${
        process.env.BRAND_NAME || "Trade Point Malawi"
      }`
    );

    return res.json({ message: "Vendor blocked", vendor });
  } catch (err) {
    console.error("blockVendor:", err);
    return res.status(500).json({ message: "Failed to block vendor" });
  }
}

// ===========================
// UNBLOCK VENDOR
// ===========================
async function unblockVendor(req, res) {
  try {
    const vendorId = Number(req.params.vendorId);

    const vendor = await prisma.user.update({
      where: { id: vendorId },
      data: { subscriptionActive: true },
    });

    await sendEmail(
      vendor.email,
      "Account Reactivated",
      `Hello ${
        vendor.name
      },\n\nYour vendor account has been reactivated.\nYou can now continue selling.\n\n${
        process.env.BRAND_NAME || "Trade Point Malawi"
      }`
    );

    return res.json({ message: "Vendor unblocked", vendor });
  } catch (err) {
    console.error("unblockVendor:", err);
    return res.status(500).json({ message: "Failed to unblock vendor" });
  }
}

// UPDATE SUBSCRIPTION AMOUNT
// ===========================
// UPDATE SUBSCRIPTION AMOUNT
// ===========================
async function updateSubscriptionAmount(req, res) {
  try {
    const { amount } = req.body;

    if (!amount || isNaN(amount)) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const numericAmount = Number(amount);

    // Upsert global settings (create if missing, update if exists)
    const updated = await prisma.subscriptionSettings.upsert({
      where: { id: 1 },
      update: {
        amount: numericAmount,
        updatedAt: new Date(),
      },
      create: {
        amount: numericAmount,
        updatedAt: new Date(),
      },
    });

    // 🔹 NEW: update all vendors' subscriptionAmount so UI sees new value
    await prisma.user.updateMany({
      where: { role: "VENDOR" },
      data: { subscriptionAmount: numericAmount },
    });

    // Notify all vendors by email
    const vendors = await prisma.user.findMany({
      where: { role: "VENDOR" },
      select: { email: true, name: true },
    });

    vendors.forEach((vendor) => {
      sendEmail(
        vendor.email,
        "Subscription Fee Updated",
        `Hello ${
          vendor.name
        },\n\nThe monthly vendor subscription fee has been updated to MK${numericAmount}.\n\n${
          process.env.BRAND_NAME || "Trade Point Malawi"
        }`
      );
    });

    return res.json({
      message: "Subscription fee updated",
      updated,
    });
  } catch (err) {
    console.error("updateSubscriptionAmount:", err);
    return res.status(500).json({ message: "Failed to update amount" });
  }
}

// GET VENDOR DETAILS + PAYMENT HISTORY

async function getVendorPayments(req, res) {
  try {
    const vendorId = Number(req.params.vendorId);

    const vendor = await prisma.user.findUnique({
      where: { id: vendorId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        subscriptionAmount: true,
        lastPaymentDate: true,
        nextPaymentDue: true,
      },
    });

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    const payments = await prisma.subscriptionPayment.findMany({
      where: { vendorId },
      orderBy: { paidAt: "desc" },
    });

    return res.json({ vendor, payments });
  } catch (err) {
    console.error("getVendorPayments:", err);
    return res
      .status(500)
      .json({ message: "Failed to fetch vendor payment history" });
  }
}

// ===========================
// DAILY CHECK: reminders & auto-block
// ===========================
async function runDailySubscriptionCheck() {
  try {
    const now = new Date();

    const vendors = await prisma.user.findMany({
      where: {
        role: "VENDOR",
        mustPay: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        subscriptionActive: true,
        nextPaymentDue: true,
      },
    });

    for (const v of vendors) {
      if (!v.nextPaymentDue) continue;

      const due = v.nextPaymentDue;
      const diffMs = due.getTime() - now.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      // Reminder at ~2 days before due date
      if (diffDays <= 2 && diffDays > 0) {
        await sendEmail(
          v.email,
          "Subscription payment reminder",
          `Hello ${
            v.name
          },\n\nThis is a reminder that your vendor subscription will expire on ${due.toDateString()}.\n\nPlease pay your subscription fee to avoid account suspension.\n\n${
            process.env.BRAND_NAME || "Trade Point Malawi"
          }`
        );
      }

      // Auto-block if overdue and still active
      if (now >= due && v.subscriptionActive) {
        await prisma.user.update({
          where: { id: v.id },
          data: { subscriptionActive: false },
        });

        await sendEmail(
          v.email,
          "Account Suspended – Subscription overdue",
          `Hello ${
            v.name
          },\n\nYour vendor account has been suspended because your subscription has passed the due date (${due.toDateString()}).\n\nPlease pay your subscription fee and contact admin to reactivate your account.\n\n${
            process.env.BRAND_NAME || "Trade Point Malawi"
          }`
        );
      }
    }
  } catch (err) {
    console.error("runDailySubscriptionCheck:", err);
  }
}

module.exports = {
  listVendors,
  markVendorPaid,
  blockVendor,
  unblockVendor,
  updateSubscriptionAmount,
  getVendorPayments,
  runDailySubscriptionCheck,
};
