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

async function getMarketplaceStats(req, res) {
  try {
    const totalVendors = await prisma.user.count({
      where: {
        role: "VENDOR",
        subscriptionActive: true,
      },
    });

    const totalActiveProducts = await prisma.product.count({
      where: {
        isActive: true,
        vendor: { subscriptionActive: true },
      },
    });

    const ordersAgg = await prisma.order.aggregate({
      _sum: { totalAmount: true },
      _count: { id: true },
      where: {
        status: { in: ["PAID", "COMPLETED"] },
      },
    });

    res.json({
      totalVendors,
      totalActiveProducts,
      totalTrackedRevenue: ordersAgg._sum.totalAmount || 0,
      totalCompletedOrders: ordersAgg._count.id || 0,
    });
  } catch (err) {
    console.error("getMarketplaceStats error:", err);
    res.status(500).json({ message: "Failed to fetch marketplace stats" });
  }
}

// NEW: Top products endpoint
async function getTopProducts(req, res) {
  try {
    const limit = Number(req.query.limit || 10);

    // Get most recent active products from active vendors
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        vendor: { subscriptionActive: true },
      },
      include: {
        category: true,
        vendor: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Pick at most one product per category
    const seenCategories = new Set();
    const top = [];

    for (const p of products) {
      const catId = p.categoryId || 0;
      if (!seenCategories.has(catId)) {
        top.push(p);
        seenCategories.add(catId);
      }
      if (top.length >= limit) break;
    }

    // If fewer than limit, fill with remaining newest products
    if (top.length < limit) {
      for (const p of products) {
        if (!top.find((tp) => tp.id === p.id)) {
          top.push(p);
          if (top.length >= limit) break;
        }
      }
    }

    res.json(top.slice(0, limit));
  } catch (err) {
    console.error("getTopProducts error:", err);
    res.status(500).json({ message: "Failed to fetch top products" });
  }
}

module.exports = {
  getMarketplaceStats,
  getTopProducts,
  getPublicStats,
};
