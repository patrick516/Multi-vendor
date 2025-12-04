// backend/controllers/authController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodeCrypto = require("crypto");
const prisma = require("../config/prisma");
const { sendMail } = require("../config/mailer");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

/**
 * Helpers
 */
function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

// Helper: check if the request is coming from a SUPER_ADMIN (via JWT)
function isRequestFromSuperAdmin(req) {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) return false;

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded && decoded.role === "SUPER_ADMIN";
  } catch {
    return false;
  }
}

// Helper: send welcome email with temporary password & login link (admin-created user)
async function sendNewUserEmail(user, plainPassword) {
  try {
    const baseUrl =
      (process.env.FRONTEND_BASE_URL &&
        process.env.FRONTEND_BASE_URL.replace(/\/$/, "")) ||
      "http://localhost:5173";

    const loginUrl = `${baseUrl}/login`;

    const subject = `Your ${
      process.env.BRAND_NAME || "Multi Vendor Shop"
    } account`;
    const text = `
Hello ${user.name || user.email},

An administrator has created an account for you on ${
      process.env.BRAND_NAME || "Multi Vendor Shop"
    }.

Login details:
- Portal URL: ${loginUrl}
- Email: ${user.email}
- Temporary password: ${plainPassword}

On your first login, you will be prompted to change this password.
For security, please change it immediately and do not share it with anyone.

Regards,
${process.env.BRAND_NAME || "Multi Vendor Shop"} Admin
`.trim();

    await sendMail({
      to: user.email,
      subject,
      text,
      html: text.replace(/\n/g, "<br/>"),
    });
  } catch (err) {
    console.error("Failed to send new user email:", err);
    // don't fail registration just because email failed
  }
}

/**
 * Public vendor registration from website
 * POST /api/auth/vendor-register
 */
async function publicVendorRegister(req, res) {
  try {
    const { name, email, phone } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({
        message:
          "This email is already registered. If you forgot your password, please contact the admin.",
      });
    }

    const tempPassword = nodeCrypto.randomBytes(6).toString("hex"); // 12 chars
    const hashed = await bcrypt.hash(tempPassword, 10);

    const user = await prisma.user.create({
      data: {
        name: name || "",
        email,
        password: hashed,
        role: "VENDOR",
        mustPay: true,
        subscriptionActive: false,
      },
    });

    const accountsText = [
      process.env.ADMIN_ACCOUNT_TNM && `• ${process.env.ADMIN_ACCOUNT_TNM}`,
      process.env.ADMIN_ACCOUNT_AIRTEL &&
        `• ${process.env.ADMIN_ACCOUNT_AIRTEL}`,
      process.env.ADMIN_ACCOUNT_BANK && `• ${process.env.ADMIN_ACCOUNT_BANK}`,
    ]
      .filter(Boolean)
      .join("\n");

    // NEW: build login URL for vendors
    const baseUrl =
      (process.env.FRONTEND_BASE_URL &&
        process.env.FRONTEND_BASE_URL.replace(/\/$/, "")) ||
      "http://localhost:5173";
    const loginUrl = `${baseUrl}/login`;

    const subject = "Your Trade Point Malawi vendor account";
    const text = `
Hello ${name || email},

Your vendor account has been created on Trade Point Malawi.

Login details:
- Portal URL: ${loginUrl}
- Email: ${email}
- Temporary password: ${tempPassword}

Please log in and change your password as soon as possible.

Note: Your account will only be fully active after your subscription payment is confirmed.

Subscription payment options:
${accountsText || "(Admin has not configured payment accounts yet.)"}

Once you pay your subscription fee, contact the admin so your account can be activated.

Thank you,
${process.env.BRAND_NAME || "Trade Point Malawi"} Admin
`.trim();

    try {
      await sendMail({
        to: email,
        subject,
        text,
        html: text.replace(/\n/g, "<br/>"),
      });
    } catch (e) {
      console.error("Failed to send vendor welcome email:", e);
      // do not fail the request just because email failed
    }

    return res.status(201).json({
      message:
        "Vendor account created. A temporary password has been emailed to you.",
    });
  } catch (err) {
    console.error("publicVendorRegister error:", err);
    return res.status(500).json({ message: "Failed to create vendor account" });
  }
}

/**
 * Admin / system registration: POST /api/auth/register
 */
async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const totalUsers = await prisma.user.count();

    let userRole;
    let mustChangePassword = false;

    if (totalUsers === 0) {
      // First user ever: always SUPER_ADMIN
      userRole = "SUPER_ADMIN";
      mustChangePassword = false; // admin sets their own password
    } else {
      // After first user: only SUPER_ADMIN can create any accounts
      const isAdmin = isRequestFromSuperAdmin(req);
      if (!isAdmin) {
        return res.status(403).json({
          message:
            "Registration is disabled. Only the existing admin can create new accounts.",
        });
      }

      // For this project, every new user (besides first) is a VENDOR.
      userRole = "VENDOR";
      mustChangePassword = true;
    }

    const user = await prisma.user.create({
      data: {
        name: name || "",
        email,
        password: hashed,
        role: userRole,
        mustChangePassword,
      },
    });

    // If this is an admin-created account (not the very first user), send welcome email
    if (totalUsers > 0) {
      await sendNewUserEmail(user, password);
    }

    const token = signToken(user);

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
      token,
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Failed to register user" });
  }
}

/**
 * Login
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signToken(user);

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        subscriptionActive: user.subscriptionActive,
        mustPay: user.mustPay,
        lastPaymentDate: user.lastPaymentDate,
        nextPaymentDue: user.nextPaymentDue,
        subscriptionAmount: user.subscriptionAmount,
      },
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Failed to login" });
  }
}

/**
 * Change password (logged-in)
 */
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Current and new password are required" });
    }

    const userId = req.user.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashed,
        mustChangePassword: false,
      },
    });

    return res.json({
      message: "Password changed successfully",
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role,
        mustChangePassword: updated.mustChangePassword,
      },
    });
  } catch (err) {
    console.error("changePassword error:", err);
    return res.status(500).json({ message: "Failed to change password" });
  }
}

// -----------------------------
// Forgot Password (request OTP)
// POST /api/auth/forgot-password
// body: { email }
// -----------------------------
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const genericMessage =
      "If an account with that email exists, we have sent a reset code.";

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Avoid leaking existence of account – always respond the same
      await new Promise((resolve) => setTimeout(resolve, 500));
      return res.json({ message: genericMessage });
    }

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));

    const tokenHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    // Clear old tokens for this email
    await prisma.passwordResetToken.deleteMany({ where: { email } });

    // Save new token
    await prisma.passwordResetToken.create({
      data: {
        email,
        tokenHash,
        expiresAt,
      },
    });

    const subject = `${
      process.env.BRAND_NAME || "Trade Point Malawi"
    } — Password Reset Code`;
    const text = `
Hi ${user.name || email},

You requested a password reset for your account on ${
      process.env.BRAND_NAME || "Trade Point Malawi"
    }.

Your one-time reset code is: ${otp}

This code will expire in 15 minutes. If you did not request this, you can ignore this email.

Thanks,
${process.env.BRAND_NAME || "Trade Point Malawi"} Team
`.trim();

    await sendMail({
      to: email,
      subject,
      text,
      html: text.replace(/\n/g, "<br/>"),
    });

    return res.json({ message: genericMessage });
  } catch (err) {
    console.error("forgotPassword error:", err);
    return res.json({
      message:
        "If an account with that email exists, we have sent a reset code.",
    });
  }
}

// -----------------------------
// Reset Password (using OTP)
// POST /api/auth/reset-password
// body: { email, otp, newPassword }
// -----------------------------
async function resetPassword(req, res) {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        message: "Email, OTP, and new password are required",
      });
    }

    const tokenRecord = await prisma.passwordResetToken.findFirst({
      where: {
        email,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!tokenRecord) {
      return res.status(400).json({
        message: "Invalid or expired reset code",
      });
    }

    const isValid = await bcrypt.compare(otp, tokenRecord.tokenHash);
    if (!isValid) {
      return res.status(400).json({
        message: "Invalid or expired reset code",
      });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    const user = await prisma.user.update({
      where: { email },
      data: {
        password: hashed,
        mustChangePassword: false,
      },
    });

    await prisma.passwordResetToken.deleteMany({ where: { email } });

    // Optionally log in automatically
    const token = signToken(user);

    return res.json({
      message: "Password has been reset successfully.",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("resetPassword error:", err);
    return res.status(500).json({ message: "Failed to reset password" });
  }
}

module.exports = {
  register,
  login,
  changePassword,
  publicVendorRegister,
  forgotPassword,
  resetPassword,
};

// backend/controllers/authController.js
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// const nodeCrypto = require("crypto");
// const prisma = require("../config/prisma");
// const { sendMail } = require("../config/mailer");

// const JWT_SECRET = process.env.JWT_SECRET;
// const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// /**
//  * Helpers
//  */
// function signToken(user) {
//   return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
//     expiresIn: JWT_EXPIRES_IN,
//   });
// }

// // Helper: check if the request is coming from a SUPER_ADMIN (via JWT)
// function isRequestFromSuperAdmin(req) {
//   const authHeader = req.headers.authorization || "";
//   if (!authHeader.startsWith("Bearer ")) return false;

//   const token = authHeader.slice(7);
//   try {
//     const decoded = jwt.verify(token, JWT_SECRET);
//     return decoded && decoded.role === "SUPER_ADMIN";
//   } catch {
//     return false;
//   }
// }

// // Helper: send welcome email with temporary password & login link (admin-created user)
// async function sendNewUserEmail(user, plainPassword) {
//   try {
//     const baseUrl =
//       (process.env.FRONTEND_BASE_URL &&
//         process.env.FRONTEND_BASE_URL.replace(/\/$/, "")) ||
//       "http://localhost:5173";

//     const loginUrl = `${baseUrl}/login`;

//     const subject = `Your ${
//       process.env.BRAND_NAME || "Multi Vendor Shop"
//     } account`;
//     const text = `
// Hello ${user.name || user.email},

// An administrator has created an account for you on ${
//       process.env.BRAND_NAME || "Multi Vendor Shop"
//     }.

// Login details:
// - Portal URL: ${loginUrl}
// - Email: ${user.email}
// - Temporary password: ${plainPassword}

// On your first login, you will be prompted to change this password.
// For security, please change it immediately and do not share it with anyone.

// Regards,
// ${process.env.BRAND_NAME || "Multi Vendor Shop"} Admin
// `.trim();

//     await sendMail({
//       to: user.email,
//       subject,
//       text,
//       html: text.replace(/\n/g, "<br/>"),
//       // replyTo: "your-gmail@..." // if you want replies to go to your Gmail later
//     });
//   } catch (err) {
//     console.error("Failed to send new user email:", err);
//     // don't fail registration just because email failed
//   }
// }

// /**
//  * Public vendor registration from website
//  * POST /api/auth/vendor-register (or your mapped route)
//  */
// async function publicVendorRegister(req, res) {
//   try {
//     const { name, email, phone } = req.body;

//     if (!email) {
//       return res.status(400).json({ message: "Email is required" });
//     }

//     const existing = await prisma.user.findUnique({ where: { email } });
//     if (existing) {
//       return res.status(409).json({
//         message:
//           "This email is already registered. If you forgot your password, please contact the admin.",
//       });
//     }

//     const tempPassword = nodeCrypto.randomBytes(6).toString("hex"); // 12 chars
//     const hashed = await bcrypt.hash(tempPassword, 10);

//     const user = await prisma.user.create({
//       data: {
//         name: name || "",
//         email,
//         password: hashed,
//         role: "VENDOR", // public signups are vendors
//         mustPay: true,
//         subscriptionActive: false,
//       },
//     });

//     const accountsText = [
//       process.env.ADMIN_ACCOUNT_TNM && `• ${process.env.ADMIN_ACCOUNT_TNM}`,
//       process.env.ADMIN_ACCOUNT_AIRTEL &&
//         `• ${process.env.ADMIN_ACCOUNT_AIRTEL}`,
//       process.env.ADMIN_ACCOUNT_BANK && `• ${process.env.ADMIN_ACCOUNT_BANK}`,
//     ]
//       .filter(Boolean)
//       .join("\n");

//     const subject = "Your Trade Point Malawi vendor account";
//     const text = `
// Hello ${name || email},

// Your vendor account has been created on Trade Point Malawi.

// Login details:
// - Email: ${email}
// - Temporary password: ${tempPassword}

// Please log in and change your password as soon as possible.

// Note: Your account will only be fully active after your subscription payment is confirmed.

// Subscription payment options:
// ${accountsText || "(Admin has not configured payment accounts yet.)"}

// Once you pay your subscription fee, contact the admin so your account can be activated.

// Thank you,
// ${process.env.BRAND_NAME || "Trade Point Malawi"} Admin
// `.trim();

//     try {
//       await sendMail({
//         to: email,
//         subject,
//         text,
//         html: text.replace(/\n/g, "<br/>"),
//       });
//     } catch (e) {
//       console.error("Failed to send vendor welcome email:", e);
//       // do not fail the request just because email failed
//     }

//     return res.status(201).json({
//       message:
//         "Vendor account created. A temporary password has been emailed to you.",
//     });
//   } catch (err) {
//     console.error("publicVendorRegister error:", err);
//     return res.status(500).json({ message: "Failed to create vendor account" });
//   }
// }

// /**
//  * Admin / system registration: POST /api/auth/register
//  */
// // Admin / system registration: POST /api/auth/register
// async function register(req, res) {
//   try {
//     const { name, email, password } = req.body;

//     if (!email || !password) {
//       return res
//         .status(400)
//         .json({ message: "Email and password are required" });
//     }

//     const existing = await prisma.user.findUnique({ where: { email } });
//     if (existing) {
//       return res.status(409).json({ message: "Email already registered" });
//     }

//     const hashed = await bcrypt.hash(password, 10);

//     const totalUsers = await prisma.user.count();

//     let userRole;
//     let mustChangePassword = false;

//     if (totalUsers === 0) {
//       // First user ever: always SUPER_ADMIN
//       userRole = "SUPER_ADMIN";
//       mustChangePassword = false; // admin sets their own password
//     } else {
//       // After first user: only SUPER_ADMIN can create any accounts
//       const isAdmin = isRequestFromSuperAdmin(req);
//       if (!isAdmin) {
//         return res.status(403).json({
//           message:
//             "Registration is disabled. Only the existing admin can create new accounts.",
//         });
//       }

//       // 🔴 IMPORTANT: For this project, every new user (besides first) is a VENDOR.
//       // We completely ignore any 'role' from the request.
//       userRole = "VENDOR";
//       mustChangePassword = true;
//     }

//     const user = await prisma.user.create({
//       data: {
//         name: name || "",
//         email,
//         password: hashed,
//         role: userRole,
//         mustChangePassword,
//       },
//     });

//     // If this is an admin-created account (not the very first user), send welcome email
//     if (totalUsers > 0) {
//       await sendNewUserEmail(user, password);
//     }

//     const token = signToken(user);

//     res.status(201).json({
//       user: {
//         id: user.id,
//         email: user.email,
//         name: user.name,
//         role: user.role,
//         mustChangePassword: user.mustChangePassword,
//       },
//       token,
//     });
//   } catch (err) {
//     console.error("Register error:", err);
//     res.status(500).json({ message: "Failed to register user" });
//   }
// }

// /**
//  * Login
//  */
// async function login(req, res) {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password) {
//       return res
//         .status(400)
//         .json({ message: "Email and password are required" });
//     }

//     const user = await prisma.user.findUnique({ where: { email } });
//     if (!user) {
//       return res.status(401).json({ message: "Invalid credentials" });
//     }

//     const valid = await bcrypt.compare(password, user.password);
//     if (!valid) {
//       return res.status(401).json({ message: "Invalid credentials" });
//     }

//     const token = signToken(user);

//     return res.json({
//       user: {
//         id: user.id,
//         email: user.email,
//         name: user.name,
//         role: user.role,
//         subscriptionActive: user.subscriptionActive,
//         mustPay: user.mustPay,
//         lastPaymentDate: user.lastPaymentDate,
//         nextPaymentDue: user.nextPaymentDue,
//         subscriptionAmount: user.subscriptionAmount,
//       },
//       token,
//     });
//   } catch (err) {
//     console.error("Login error:", err);
//     res.status(500).json({ message: "Failed to login" });
//   }
// }

// /**
//  * Change password
//  */
// async function changePassword(req, res) {
//   try {
//     const { currentPassword, newPassword } = req.body;

//     if (!currentPassword || !newPassword) {
//       return res
//         .status(400)
//         .json({ message: "Current and new password are required" });
//     }

//     const userId = req.user.id;

//     const user = await prisma.user.findUnique({ where: { id: userId } });
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const valid = await bcrypt.compare(currentPassword, user.password);
//     if (!valid) {
//       return res.status(401).json({ message: "Current password is incorrect" });
//     }

//     const hashed = await bcrypt.hash(newPassword, 10);

//     const updated = await prisma.user.update({
//       where: { id: userId },
//       data: {
//         password: hashed,
//         mustChangePassword: false,
//       },
//     });

//     return res.json({
//       message: "Password changed successfully",
//       user: {
//         id: updated.id,
//         email: updated.email,
//         name: updated.name,
//         role: updated.role,
//         mustChangePassword: updated.mustChangePassword,
//       },
//     });
//   } catch (err) {
//     console.error("changePassword error:", err);
//     return res.status(500).json({ message: "Failed to change password" });
//   }
// }

// module.exports = {
//   register,
//   login,
//   changePassword,
//   publicVendorRegister,
// };
