// backend/controllers/categoryController.js
const prisma = require("../config/prisma");

// GET /api/categories
async function getCategories(req, res) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    res.json(categories);
  } catch (err) {
    console.error("getCategories error:", err);
    res.status(500).json({ message: "Failed to fetch categories" });
  }
}

module.exports = {
  getCategories,
};
