const prisma = require("../config/prisma");
const malawiDistricts = require("../constants/malawiDistricts");
const nodemailer = require("nodemailer");

// We keep these env vars for future flexibility, but they no longer affect price
const MARKUP_TYPE = process.env.ADMIN_MARKUP_TYPE || "FLAT"; // FLAT | PERCENT
const MARKUP_VALUE = Number(process.env.ADMIN_MARKUP_VALUE || "0");

// ✅ No top up: displayPrice is exactly the vendor's base price, commission is 0
function applyMarkup(basePrice) {
  const displayPrice = basePrice;
  const commissionPerUnit = 0;
  return { displayPrice, commissionPerUnit };
}

function buildFileUrl(req, filename) {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  return `${baseUrl}/uploads/products/${filename}`;
}

// POST /api/products
async function createProduct(req, res) {
  try {
    const {
      name,
      description,
      basePrice,
      price, // fallback name
      stock,
      imageUrl, // optional legacy field
      categoryId,
      district,
      area,
      latitude,
      longitude,
    } = req.body;

    const vendorBasePrice = Number(basePrice || price);
    if (!name || !vendorBasePrice) {
      return res
        .status(400)
        .json({ message: "Name and vendor price are required" });
    }

    if (!district || !malawiDistricts.includes(district)) {
      return res.status(400).json({ message: "Valid district is required" });
    }

    if (!categoryId) {
      return res.status(400).json({ message: "Category is required" });
    }

    // 🔹 NEW: build image URL from uploaded file (mainImage)
    let mainImageUrl = null;
    const files = req.files || {};

    if (files.mainImage && files.mainImage.length > 0) {
      const file = files.mainImage[0];
      mainImageUrl = buildFileUrl(req, file.filename);
    }

    let galleryImageUrls = [];
    if (files.galleryImages && files.galleryImages.length > 0) {
      galleryImageUrls = files.galleryImages.map((f) =>
        buildFileUrl(req, f.filename)
      );
    }

    const { displayPrice, commissionPerUnit } = applyMarkup(vendorBasePrice);

    const product = await prisma.product.create({
      data: {
        name,
        description: description || "",
        basePrice: vendorBasePrice,
        displayPrice,
        commissionPerUnit,
        stock: stock ? Number(stock) : 1,
        imageUrl: mainImageUrl || imageUrl || null,
        galleryImageUrls,
        categoryId: Number(categoryId),
        district,
        area: area || null,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        vendorId: req.user.id, // admin or vendor
      },
    });

    res.status(201).json(product);
  } catch (err) {
    console.error("createProduct error:", err);
    res.status(500).json({ message: "Failed to create product" });
  }
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Helper: send email to vendor
async function sendVendorSaleEmail(vendor, product, commissionRecord) {
  const accountsText = [
    process.env.ADMIN_ACCOUNT_TNM && `• ${process.env.ADMIN_ACCOUNT_TNM}`,
    process.env.ADMIN_ACCOUNT_AIRTEL && `• ${process.env.ADMIN_ACCOUNT_AIRTEL}`,
    process.env.ADMIN_ACCOUNT_BANK && `• ${process.env.ADMIN_ACCOUNT_BANK}`,
  ]
    .filter(Boolean)
    .join("\n");

  const subject = `Product sold: ${product.name}`;
  const text = `
Hello ${vendor.name || vendor.email},

This is a reminder that the product "${
    product.name
  }" has been marked as SOLD in the system.

Details:
- Quantity: ${commissionRecord.quantity}
- Total customer price: MK ${(
    commissionRecord.displayPrice * commissionRecord.quantity
  ).toFixed(2)}
- Your base amount: MK ${(
    commissionRecord.basePrice * commissionRecord.quantity
  ).toFixed(2)}
- Commission due to admin: MK ${commissionRecord.totalCommission.toFixed(2)}

Please pay the admin commission using one of the following accounts:

${accountsText || "Admin account details are currently not configured."}

Thank you,
${process.env.BRAND_NAME || "Multi Vendor Shop"} Admin
`;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: vendor.email,
      subject,
      text,
    });
  } catch (e) {
    console.error("Failed to send vendor sale email:", e);
  }
}

// POST /api/products/:id/mark-sold
// vendor marks a product as sold (quantity param)
async function markProductSold(req, res) {
  try {
    const id = Number(req.params.id);
    const { quantity = 1 } = req.body;

    const product = await prisma.product.findUnique({
      where: { id },
      include: { vendor: true },
    });

    if (!product) return res.status(404).json({ message: "Product not found" });

    // Only vendor who owns it or SUPER_ADMIN
    if (req.user.role !== "SUPER_ADMIN" && product.vendorId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const qty = Number(quantity) || 1;
    const newStock = Math.max(product.stock - qty, 0);

    // create commission record
    const totalCommission = product.commissionPerUnit * qty;

    const commissionRecord = await prisma.vendorCommission.create({
      data: {
        vendorId: product.vendorId,
        productId: product.id,
        quantity: qty,
        basePrice: product.basePrice,
        displayPrice: product.displayPrice,
        commission: product.commissionPerUnit,
        totalCommission,
      },
    });

    // update product stock (and optionally deactivate if zero)
    const updatedProduct = await prisma.product.update({
      where: { id: product.id },
      data: {
        stock: newStock,
        isActive: newStock > 0,
      },
    });

    // send email reminder to vendor
    if (product.vendor?.email) {
      await sendVendorSaleEmail(product.vendor, product, commissionRecord);
    }

    res.json({
      message: "Product marked as sold and commission recorded.",
      product: updatedProduct,
      commission: commissionRecord,
    });
  } catch (err) {
    console.error("markProductSold error:", err);
    res.status(500).json({ message: "Failed to mark product as sold" });
  }
}

// GET /api/products?district=Blantyre&categoryId=1&search=toyota
async function getProducts(req, res) {
  try {
    const { district, categoryId, search, vendorId } = req.query;

    const where = {
      isActive: true,
      ...(district ? { district } : {}),
      ...(categoryId ? { categoryId: Number(categoryId) } : {}),
      ...(vendorId ? { vendorId: Number(vendorId) } : {}), // ✅ Added here
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        vendor: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(products);
  } catch (err) {
    console.error("getProducts error:", err);
    res.status(500).json({ message: "Failed to fetch products" });
  }
}

// GET /api/products/:id
async function getProductById(req, res) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        vendor: { select: { id: true, name: true, email: true } },
        category: true,
      },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (err) {
    console.error("getProductById error:", err);
    res.status(500).json({ message: "Failed to fetch product" });
  }
}

// backend/controllers/productsController.js

async function updateProduct(req, res) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    // Find existing product
    const existing = await prisma.product.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Permission: only SUPER_ADMIN or the vendor who owns it
    if (req.user.role !== "SUPER_ADMIN" && existing.vendorId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { name, basePrice, stock, description, categoryId } = req.body;

    const data = {};

    if (name !== undefined) {
      data.name = String(name);
    }

    // If basePrice is provided, recompute markup + commission
    if (basePrice !== undefined) {
      const bp = Number(basePrice);
      if (Number.isNaN(bp) || bp < 0) {
        return res.status(400).json({ message: "Invalid basePrice value" });
      }
      const { displayPrice, commissionPerUnit } = applyMarkup(bp);
      data.basePrice = bp;
      data.displayPrice = displayPrice;
      data.commissionPerUnit = commissionPerUnit;
    }

    if (stock !== undefined) {
      const s = Number(stock);
      if (Number.isNaN(s) || s < 0) {
        return res.status(400).json({ message: "Invalid stock value" });
      }
      data.stock = s;
    }

    if (description !== undefined) {
      data.description = description || "";
    }

    if (categoryId !== undefined) {
      data.categoryId =
        categoryId === null || categoryId === "" ? null : Number(categoryId);
    }

    const updated = await prisma.product.update({
      where: { id },
      data,
    });

    return res.json({
      message: "Product updated successfully",
      product: updated,
    });
  } catch (err) {
    console.error("updateProduct error:", err);
    return res.status(500).json({ message: "Failed to update product" });
  }
}

async function deleteProduct(req, res) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    const existing = await prisma.product.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Permission: only SUPER_ADMIN or the vendor who owns it
    if (req.user.role !== "SUPER_ADMIN" && existing.vendorId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await prisma.product.delete({
      where: { id },
    });

    return res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("deleteProduct error:", err);
    return res.status(500).json({ message: "Failed to delete product" });
  }
}

module.exports = {
  createProduct,
  markProductSold,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
