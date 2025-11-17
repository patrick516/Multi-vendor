// backend/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const productRoutes = require("./routes/products");
const orderRoutes = require("./routes/orders");
const commissionRoutes = require("./routes/commissions");
const cartRoutes = require("./routes/cart");
const statsRoutes = require("./routes/stats");

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

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message || err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
