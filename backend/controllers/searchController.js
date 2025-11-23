// backend/controllers/searchController.js
const prisma = require("../config/prisma");

// GET /api/search?q=...
// Return products + categories + vendors matching the query
async function universalSearch(req, res) {
  try {
    const q = (req.query.q || "").toString().trim();

    if (!q) {
      return res.json({
        products: [],
        categories: [],
        vendors: [],
      });
    }

    const term = q;

    // Products: name or description contains term
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: term, mode: "insensitive" } },
          { description: { contains: term, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        basePrice: true,
        displayPrice: true,
        district: true,
        area: true,
        category: {
          select: { id: true, name: true },
        },
      },
      take: 8,
      orderBy: { createdAt: "desc" },
    });

    // Categories: name contains term
    const categories = await prisma.category.findMany({
      where: {
        name: { contains: term, mode: "insensitive" },
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
      take: 6,
      orderBy: { name: "asc" },
    });

    // Vendors: name or email contains term
    const vendors = await prisma.user.findMany({
      where: {
        role: "VENDOR",
        OR: [
          { name: { contains: term, mode: "insensitive" } },
          { email: { contains: term, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        subscriptionActive: true,
      },
      take: 5,
      orderBy: { name: "asc" },
    });

    return res.json({
      products,
      categories,
      vendors,
    });
  } catch (err) {
    console.error("universalSearch error:", err);
    return res
      .status(500)
      .json({ message: "Failed to perform universal search" });
  }
}

module.exports = {
  universalSearch,
};
