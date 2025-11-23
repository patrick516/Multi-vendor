// backend/controllers/metaController.js
const prisma = require("../config/prisma");
const malawiDistricts = require("../constants/malawiDistricts");

// GET /api/meta/districts
async function getDistricts(req, res) {
  try {
    // For now we return the static list.
    // Later you can switch this to read from a District table if you create one.
    res.json(malawiDistricts);
  } catch (err) {
    console.error("getDistricts error:", err);
    res.status(500).json({ message: "Failed to fetch districts" });
  }
}

// GET /api/categories
async function getCategories(req, res) {
  try {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: { name: "asc" },
    });

    res.json(categories);
  } catch (err) {
    console.error("getCategories error:", err);
    res.status(500).json({ message: "Failed to fetch categories" });
  }
}

module.exports = {
  getDistricts,
  getCategories,
};
