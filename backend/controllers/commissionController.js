// backend/controllers/commissionController.js
const prisma = require("../config/prisma");

// GET /api/admin/commissions/summary
// Returns per-vendor totals + global totals including pending vs paid
async function getCommissionSummary(req, res) {
  try {
    // All commissions grouped per vendor (regardless of status)
    const allByVendor = await prisma.vendorCommission.groupBy({
      by: ["vendorId"],
      _sum: { totalCommission: true },
      _count: { id: true },
    });

    // Pending only
    const pendingByVendor = await prisma.vendorCommission.groupBy({
      by: ["vendorId"],
      _sum: { totalCommission: true },
      where: { status: "PENDING" },
    });

    // Paid only
    const paidByVendor = await prisma.vendorCommission.groupBy({
      by: ["vendorId"],
      _sum: { totalCommission: true },
      where: { status: "PAID" },
    });

    const vendors = await prisma.user.findMany({
      where: { id: { in: allByVendor.map((v) => v.vendorId) } },
      select: { id: true, name: true, email: true },
    });

    const vendorMap = new Map(vendors.map((v) => [v.id, v]));
    const pendingMap = new Map(
      pendingByVendor.map((r) => [r.vendorId, r._sum.totalCommission || 0])
    );
    const paidMap = new Map(
      paidByVendor.map((r) => [r.vendorId, r._sum.totalCommission || 0])
    );

    const vendorRows = allByVendor.map((row) => {
      const vendor = vendorMap.get(row.vendorId);
      const total = row._sum.totalCommission || 0;
      const pending = pendingMap.get(row.vendorId) || 0;
      const paid = paidMap.get(row.vendorId) || 0;

      return {
        vendorId: row.vendorId,
        vendorName: vendor?.name || vendor?.email || "Unknown",
        vendorEmail: vendor?.email || null,
        totalCommission: total,
        pendingCommission: pending,
        paidCommission: paid,
        salesCount: row._count.id,
      };
    });

    // Global totals
    const globalAll = await prisma.vendorCommission.aggregate({
      _sum: { totalCommission: true },
      _count: { id: true },
    });
    const globalPending = await prisma.vendorCommission.aggregate({
      _sum: { totalCommission: true },
      where: { status: "PENDING" },
    });
    const globalPaid = await prisma.vendorCommission.aggregate({
      _sum: { totalCommission: true },
      where: { status: "PAID" },
    });

    res.json({
      vendors: vendorRows,
      totals: {
        totalCommission: globalAll._sum.totalCommission || 0,
        pendingCommission: globalPending._sum.totalCommission || 0,
        paidCommission: globalPaid._sum.totalCommission || 0,
        salesCount: globalAll._count.id || 0,
      },
    });
  } catch (err) {
    console.error("getCommissionSummary error:", err);
    res.status(500).json({ message: "Failed to fetch commission summary" });
  }
}

// GET /api/admin/commissions/vendor/:vendorId
async function getVendorCommissions(req, res) {
  try {
    const vendorId = Number(req.params.vendorId);

    const commissions = await prisma.vendorCommission.findMany({
      where: { vendorId },
      include: {
        product: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(commissions);
  } catch (err) {
    console.error("getVendorCommissions error:", err);
    res.status(500).json({ message: "Failed to fetch vendor commissions" });
  }
}

// POST /api/admin/commissions/:id/mark-paid
async function markCommissionPaid(req, res) {
  try {
    const id = Number(req.params.id);

    const commission = await prisma.vendorCommission.findUnique({
      where: { id },
    });
    if (!commission)
      return res.status(404).json({ message: "Commission record not found" });

    const updated = await prisma.vendorCommission.update({
      where: { id },
      data: {
        status: "PAID",
        paidAt: new Date(),
      },
    });

    res.json({ message: "Commission marked as PAID", commission: updated });
  } catch (err) {
    console.error("markCommissionPaid error:", err);
    res.status(500).json({ message: "Failed to update commission status" });
  }
}

// POST /api/admin/commissions/vendor/:vendorId/mark-paid-all
// Marks all PENDING commissions for a vendor as PAID
async function markVendorCommissionsPaid(req, res) {
  try {
    const vendorId = Number(req.params.vendorId);

    const result = await prisma.vendorCommission.updateMany({
      where: { vendorId, status: "PENDING" },
      data: {
        status: "PAID",
        paidAt: new Date(),
      },
    });

    return res.json({
      message: "All pending commissions for this vendor marked as PAID",
      updatedCount: result.count,
    });
  } catch (err) {
    console.error("markVendorCommissionsPaid error:", err);
    res.status(500).json({ message: "Failed to update commissions" });
  }
}

module.exports = {
  getCommissionSummary,
  getVendorCommissions,
  markCommissionPaid,
  markVendorCommissionsPaid,
};
