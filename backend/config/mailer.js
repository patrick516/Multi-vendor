// backend/config/mailer.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

module.exports = transporter;

// // backend/config/mailer.js
// const { Resend } = require("resend");

// const resendApiKey = process.env.RESEND_API_KEY;
// const resendFrom = process.env.RESEND_FROM || "no-reply@example.com"; // will be replaced with your domain later

// let resendClient = null;

// if (resendApiKey) {
//   resendClient = new Resend(resendApiKey);
//   console.log("[MAIL] Resend client initialized");
// } else {
//   console.warn(
//     "[MAIL] RESEND_API_KEY is not set. Emails will be skipped until you configure it."
//   );
// }

// /**
//  * sendMail(options)
//  * options: { to, subject, text, html, replyTo? }
//  */
// async function sendMail({ to, subject, text, html, replyTo }) {
//   if (!resendClient) {
//     console.warn("[MAIL] Skipping email; Resend client not configured");
//     return;
//   }

//   try {
//     const payload = {
//       from: resendFrom,
//       to,
//       subject,
//     };

//     if (html) payload.html = html;
//     if (text) payload.text = text;
//     if (replyTo) payload.reply_to = replyTo;

//     const result = await resendClient.emails.send(payload);

//     console.log("[MAIL] Resend response:", JSON.stringify(result, null, 2));

//     if (result.error) {
//       console.error("[MAIL] Resend error:", result.error);
//     } else {
//       console.log(`[MAIL] Email sent to ${to}`);
//     }
//   } catch (err) {
//     console.error("[MAIL] Failed to send email via Resend:", err);
//   }
// }

// module.exports = { sendMail };
