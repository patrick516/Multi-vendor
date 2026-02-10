// backend/controllers/messageController.js
const prisma = require("../config/prisma");
const transporter = require("../config/transporter");
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
 */
async function sendVendorMessage(req, res) {
  try {
    assertAdmin(req);

    const { vendorIds, subject, message } = req.body || {};

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ message: "Message body is required." });
    }

    // Normalize vendor IDs
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

/**
 * DELETE /api/admin/messages/:id
 * Deletes a message log and its recipient records.
 */
async function deleteMessage(req, res) {
  try {
    assertAdmin(req);

    const id = Number(req.params.id);
    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid message id" });
    }

    const existing = await prisma.messageLog.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Delete recipients first (to satisfy FK constraints)
    await prisma.messageRecipient.deleteMany({
      where: { messageId: id },
    });

    await prisma.messageLog.delete({
      where: { id },
    });

    return res.json({ message: "Message deleted successfully." });
  } catch (err) {
    console.error("deleteMessage error:", err);
    return res.status(err.status || 500).json({
      message: err.message || "Failed to delete message",
    });
  }
}

module.exports = {
  sendVendorMessage,
  getMessageHistory,
  deleteMessage,
};
