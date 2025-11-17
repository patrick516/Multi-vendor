// backend/controllers/productsController.js
const prisma = require("../config/prisma");
const nodemailer = require("nodemailer");

const MARKUP_TYPE = process.env.ADMIN_MARKUP_TYPE || "FLAT"; // FLAT | PERCENT
const MARKUP_VALUE = Number(process.env.ADMIN_MARKUP_VALUE || "0");

// helper to compute display price + commission
function applyMarkup(basePrice) {
  let displayPrice = basePrice;
  if (MARKUP_TYPE === "PERCENT") {
    displayPrice = basePrice + (basePrice * MARKUP_VALUE) / 100;
  } else {
    // FLAT
    displayPrice = basePrice + MARKUP_VALUE;
  }
  const commissionPerUnit = displayPrice - basePrice;
  return { displayPrice, commissionPerUnit };
}

// Helper to build a public URL for files
function buildFileUrl(req, filename) {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  return `${baseUrl}/uploads/products/${filename}`;
}

// ========================
// POST /api/products
// Vendor / SUPER_ADMIN creates product
// ========================
async function createProduct(req, res) {
  try {
    const { name, description, price, basePrice, stock, imageUrl, categoryId } =
      req.body;

    // Vendor always sends their price; allow `basePrice` or `price` for convenience
    const vendorBasePrice = Number(basePrice || price);
    if (!name || !vendorBasePrice) {
      return res
        .status(400)
        .json({ message: "Name and vendor price are required" });
    }

    // Files from multer
    const files = req.files || {};
    const mainImageFile = files.mainImage && files.mainImage[0];
    const galleryFiles = files.galleryImages || [];

    let mainImageUrl = null;
    let galleryImageUrls = [];

    if (mainImageFile) {
      mainImageUrl = buildFileUrl(req, mainImageFile.filename);
    } else if (imageUrl) {
      // fallback: allow pure JSON request without file upload (e.g. old clients)
      mainImageUrl = imageUrl;
    }

    galleryImageUrls = galleryFiles.map((f) => buildFileUrl(req, f.filename));

    // If you want to hard-require main image when using this route:
    if (!mainImageUrl) {
      return res
        .status(400)
        .json({ message: "Main image is required for this product" });
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

        // images
        mainImageUrl,
        galleryImageUrls,
        imageUrl: mainImageUrl, // keep legacy field in sync

        categoryId: categoryId ? Number(categoryId) : null,
        vendorId: req.user.id, // from auth token
      },
    });

    res.status(201).json({
      ...product,
      info: `Note: Display price is MK ${displayPrice.toFixed(
        2
      )} (your base price MK ${vendorBasePrice.toFixed(
        2
      )} + commission MK ${commissionPerUnit.toFixed(2)} per unit).`,
    });
  } catch (err) {
    console.error("createProduct error:", err);
    res.status(500).json({ message: "Failed to create product" });
  }
}

// ========================
// Email + mark-sold logic (unchanged, just kept as is)
// ========================

// mail transporter (basic)
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

async function getProducts(req, res) {
  try {
    const products = await prisma.product.findMany({
      include: { vendor: true, category: true },
    });
    res.json(products);
  } catch (err) {
    console.error("getProducts error:", err);
    res.status(500).json({ message: "Failed to fetch products" });
  }
}

// backend/controllers/productsController.js

// ... keep everything above unchanged (applyMarkup, createProduct, markProductSold, getProducts, etc.)

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
  updateProduct,
  deleteProduct,
};
