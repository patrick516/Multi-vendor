// backend/config/transporter.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: require("../config/prisma")
      ? process.env.SMTP_PASS
      : process.env.SMTP_PASS,
  },
});

module.exports = transporter;
