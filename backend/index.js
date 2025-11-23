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

const app = express();
const PORT = process.env.PORT || 5000;

// Define allowed frontends
const allowedOrigins = [
  process.env.FRONTEND_BASE_URL || "http://localhost:5173", // admin panel
  "http://localhost:3000", // next.js website
];

// Middlewares
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin like Postman
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(morgan("dev"));

// Serve uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: process.env.BRAND_NAME || "Multi Vendor Shop",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
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

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message || err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

// ============================
// Subscription Cron Job
// ============================

// Create transporter here (no external module)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Run every day at midnight

// cron.schedule("0 0 * * *", async () => {
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

      // Normalize to date-only comparison
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
            process.env.BRAND_NAME
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
          text: `Hello ${vendor.name},\n\nYour vendor subscription has expired and your account has been suspended. Please pay your subscription and contact admin to reactivate.\n\n${process.env.BRAND_NAME}`,
        });
      }
    }
  } catch (err) {
    console.error("[CRON] Subscription check failed:", err);
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
