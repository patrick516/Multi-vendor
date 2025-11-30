// backend/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const cron = require("node-cron");
const nodemailer = require("nodemailer");
const prisma = require("./config/prisma");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const productRoutes = require("./routes/products");
const orderRoutes = require("./routes/orders");
const commissionRoutes = require("./routes/commissions");
const cartRoutes = require("./routes/cart");
const statsRoutes = require("./routes/stats");
const subscriptionRoutes = require("./routes/subscriptions");
const categoryRoutes = require("./routes/categories");
const metaRoutes = require("./routes/meta");
const searchRoutes = require("./routes/search");
const messageRoutes = require("./routes/messages");

const app = express();

// IMPORTANT for Render
const PORT = process.env.PORT || 5000;

// ============================
// CORS CONFIG
// ============================

// You can set this in Render as e.g.
// ALLOWED_ORIGINS="http://localhost:5173,http://localhost:3000,https://admin.yourdomain.com,https://yourdomain.com"
const defaultOrigins = [
  "http://localhost:5173", // Vite admin (local)
  "http://localhost:3000", // Next.js website (local)
];

const envOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow tools like Postman / curl (no origin)
      if (!origin) return callback(null, true);

      if (!allowedOrigins.includes(origin)) {
        const msg = `CORS blocked: origin ${origin} is not allowed`;
        console.warn(msg);
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(morgan("dev"));

// Serve uploaded images (works locally & on Render,
// but remember Render disk is NOT permanent)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: process.env.BRAND_NAME || "Multi Vendor Shop",
    timestamp: new Date().toISOString(),
  });
});

// ============================
// API ROUTES
// ============================

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin/commissions", commissionRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/public", statsRoutes);
app.use("/api/admin/subscriptions", subscriptionRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/meta", metaRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/admin/messages", messageRoutes);

// ============================
// GLOBAL ERROR HANDLER
// ============================

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message || err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

// ============================
// SUBSCRIPTION CRON JOB
// ============================

// Only create transporter if SMTP is configured
let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
} else {
  console.warn(
    "[MAIL] SMTP not fully configured. Subscription emails will be disabled."
  );
}

// Run every day at midnight (server time)
if (transporter) {
  cron.schedule("0 0 * * *", async () => {
    try {
      console.log("[CRON] Running subscription check...");

      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const vendors = await prisma.user.findMany({
        where: {
          role: "VENDOR",
          mustPay: true,
        },
      });

      for (const vendor of vendors) {
        if (!vendor.nextPaymentDue) continue;

        const due = vendor.nextPaymentDue;

        const dueDate = due.toDateString();
        const tomorrowDate = tomorrow.toDateString();

        // 1 day reminder
        if (dueDate === tomorrowDate && vendor.subscriptionActive) {
          await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: vendor.email,
            subject: "Subscription Reminder",
            text: `Hello ${
              vendor.name
            },\n\nYour vendor subscription expires tomorrow (${due.toDateString()}). Please pay to avoid suspension.\n\n${
              process.env.BRAND_NAME || "Our Marketplace"
            }`,
          });
        }

        // Overdue -> suspend
        if (due < now && vendor.subscriptionActive) {
          await prisma.user.update({
            where: { id: vendor.id },
            data: { subscriptionActive: false },
          });

          await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: vendor.email,
            subject: "Account Suspended",
            text: `Hello ${
              vendor.name
            },\n\nYour vendor subscription has expired and your account has been suspended. Please pay your subscription and contact admin to reactivate.\n\n${
              process.env.BRAND_NAME || "Our Marketplace"
            }`,
          });
        }
      }
    } catch (err) {
      console.error("[CRON] Subscription check failed:", err);
    }
  });
}

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
