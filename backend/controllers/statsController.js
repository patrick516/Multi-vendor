// backend/controllers/statsController.js
const prisma = require("../config/prisma");

async function getPublicStats(req, res) {
  try {
    // Total vendors (accounts with role VENDOR)
    const totalVendors = await prisma.user.count({
      where: { role: "VENDOR" },
    });

    // Vendors who actually have at least one active product
    const vendorsWithProducts = await prisma.product.groupBy({
      by: ["vendorId"],
      where: { isActive: true },
    });
    const vendorsSellingNow = vendorsWithProducts.length;

    // Products
    const totalActiveProducts = await prisma.product.count({
      where: { isActive: true },
    });

    const productsInStock = await prisma.product.count({
      where: {
        isActive: true,
        stock: { gt: 0 },
      },
    });

    // Commission (admin revenue tracked)
    const commissionAgg = await prisma.vendorCommission.aggregate({
      _sum: { totalCommission: true },
    });
    const totalAdminCommission = commissionAgg._sum.totalCommission || 0;

    // Cart leads / requests (trust signal)
    const totalCartLeads = await prisma.cartLead.count({});

    // Recent (last 30 days) cart requests
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentCartLeads = await prisma.cartLead.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    res.json({
      totalVendors,
      vendorsSellingNow,
      totalActiveProducts,
      productsInStock,
      totalAdminCommission,
      currency: "MWK",
      totalCartLeads,
      recentCartLeads,
    });
  } catch (err) {
    console.error("getPublicStats error:", err);
    res.status(500).json({ message: "Failed to fetch stats" });
  }
}

module.exports = {
  getPublicStats,
};
