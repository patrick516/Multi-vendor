// backend/controllers/commissionController.js
const prisma = require("../config/prisma");

// GET /api/admin/commissions/summary
// Returns per-vendor totals + global totals
async function getCommissionSummary(req, res) {
  try {
    const byVendor = await prisma.vendorCommission.groupBy({
      by: ["vendorId"],
      _sum: { totalCommission: true },
      _count: { id: true },
      where: {},
    });

    const vendors = await prisma.user.findMany({
      where: { id: { in: byVendor.map((v) => v.vendorId) } },
      select: { id: true, name: true, email: true },
    });

    const vendorMap = new Map(vendors.map((v) => [v.id, v]));

    const vendorRows = byVendor.map((row) => {
      const vendor = vendorMap.get(row.vendorId);
      return {
        vendorId: row.vendorId,
        vendorName: vendor?.name || vendor?.email || "Unknown",
        vendorEmail: vendor?.email || null,
        totalCommission: row._sum.totalCommission || 0,
        salesCount: row._count.id,
      };
    });

    const globalTotals = await prisma.vendorCommission.aggregate({
      _sum: { totalCommission: true },
      _count: { id: true },
      where: {},
    });

    res.json({
      vendors: vendorRows,
      totals: {
        totalCommission: globalTotals._sum.totalCommission || 0,
        salesCount: globalTotals._count.id || 0,
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

module.exports = {
  getCommissionSummary,
  getVendorCommissions,
  markCommissionPaid,
};
