// backend/controllers/messageController.js
const prisma = require("../config/prisma");
const transporter = require("../config/transporter"); // we'll create this in step 3
const { BRAND_NAME } = process.env;

// Utility: ensure we only allow SUPER_ADMIN to use these
function assertAdmin(req) {
  if (!req.user || req.user.role !== "SUPER_ADMIN") {
    const err = new Error("Forbidden");
    // @ts-ignore
    err.status = 403;
    throw err;
  }
}

/**
 * POST /api/admin/messages/vendors
 * Body: { vendorIds?: number[], subject?: string, message: string }
 *
 * - If vendorIds is empty or missing → send to all vendors.
 * - Otherwise send to the given vendor IDs.
 * - Logs a MessageLog + MessageRecipient rows.
 * - Sends email to each vendor (best-effort; failures logged, but request still succeeds).
 */
async function sendVendorMessage(req, res) {
  try {
    assertAdmin(req);

    const { vendorIds, subject, message } = req.body || {};

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ message: "Message body is required." });
    }

    // Normalize vendor IDs from body
    let ids = Array.isArray(vendorIds)
      ? vendorIds.map((v) => Number(v)).filter((v) => !Number.isNaN(v))
      : [];

    // If none provided → broadcast to all vendors
    if (!ids.length) {
      const allVendors = await prisma.user.findMany({
        where: { role: "VENDOR" },
        select: { id: true },
      });
      ids = allVendors.map((v) => v.id);
    }

    if (!ids.length) {
      return res.status(400).json({ message: "No vendors found to send to." });
    }

    // Determine targetType
    const totalVendors = await prisma.user.count({
      where: { role: "VENDOR" },
    });

    let targetType = "SINGLE";
    if (ids.length === 1) {
      targetType = "SINGLE";
    } else if (ids.length >= totalVendors) {
      targetType = "ALL";
    } else {
      targetType = "MULTI";
    }

    // Fetch full vendor info
    const vendors = await prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, email: true },
    });

    if (!vendors.length) {
      return res
        .status(400)
        .json({ message: "No matching vendors found for given IDs." });
    }

    // Create log + recipients
    const log = await prisma.messageLog.create({
      data: {
        subject: subject || null,
        message: message.trim(),
        targetType,
        recipients: {
          create: vendors.map((v) => ({
            vendorId: v.id,
          })),
        },
      },
      include: {
        recipients: {
          include: {
            vendor: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    // Send emails (best-effort)
    const emailSubject =
      subject || `${BRAND_NAME || "Trade Point Malawi"} - Notification`;

    for (const v of vendors) {
      if (!v.email) continue;
      try {
        await transporter.sendMail({
          from: process.env.SMTP_FROM,
          to: v.email,
          subject: emailSubject,
          text: message,
        });
      } catch (e) {
        console.error("Failed to send message to vendor:", v.email, e.message);
        // We do NOT fail the whole request if one email fails
      }
    }

    return res.json({
      message: "Message sent",
      log: {
        id: log.id,
        subject: log.subject,
        message: log.message,
        createdAt: log.createdAt,
        targetType: log.targetType,
        recipients: log.recipients.map((r) => ({
          id: r.vendorId,
          name: r.vendor?.name || null,
          email: r.vendor?.email,
        })),
      },
    });
  } catch (err) {
    console.error("sendVendorMessage error:", err);
    return res.status(err.status || 500).json({
      message: err.message || "Failed to send message",
    });
  }
}

/**
 * GET /api/admin/messages/history
 * Returns all message logs with recipient details.
 */
async function getMessageHistory(req, res) {
  try {
    assertAdmin(req);

    const logs = await prisma.messageLog.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        recipients: {
          include: {
            vendor: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    const result = logs.map((log) => ({
      id: log.id,
      subject: log.subject,
      message: log.message,
      createdAt: log.createdAt,
      targetType: log.targetType,
      recipients: log.recipients.map((r) => ({
        id: r.vendorId,
        name: r.vendor?.name || null,
        email: r.vendor?.email,
      })),
    }));

    return res.json(result);
  } catch (err) {
    console.error("getMessageHistory error:", err);
    return res.status(err.status || 500).json({
      message: err.message || "Failed to load message history",
    });
  }
}

module.exports = {
  sendVendorMessage,
  getMessageHistory,
};
