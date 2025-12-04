// backend/config/mailer.js

// Use Node 20's built-in global fetch (no require needed)

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || "Trade Point Malawi";
const BREVO_SENDER_EMAIL =
  process.env.BREVO_SENDER_EMAIL || "no-reply@example.com";

if (!BREVO_API_KEY) {
  console.warn(
    "[MAIL] BREVO_API_KEY is not set. Emails will be skipped until configured."
  );
}

/**
 * sendMail(options)
 * options: { to, subject, text, html }
 */
async function sendMail({ to, subject, text, html }) {
  if (!BREVO_API_KEY) {
    console.warn("[MAIL] Skipping email; Brevo is not configured.");
    return;
  }

  const payload = {
    sender: {
      name: BREVO_SENDER_NAME,
      email: BREVO_SENDER_EMAIL,
    },
    to: [{ email: to }],
    subject,
    textContent: text || "",
    htmlContent: html || (text ? text.replace(/\n/g, "<br/>") : ""),
  };

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY,
        accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    let data = {};
    try {
      data = await res.json();
    } catch {
      // ignore JSON parse errors (e.g. empty body)
    }

    if (!res.ok) {
      console.error(
        "[MAIL] Brevo API error:",
        res.status,
        res.statusText,
        data
      );
      throw new Error(
        data.message || `Brevo error ${res.status} ${res.statusText}`
      );
    }

    console.log("[MAIL] Brevo email sent to:", to, "response:", data);
  } catch (err) {
    console.error("[MAIL] Failed to send email via Brevo:", err);
  }
}

module.exports = {
  sendMail,
};

// // backend/config/mailer.js
// const nodemailer = require("nodemailer");

// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST || "smtp.gmail.com",
//   port: Number(process.env.SMTP_PORT || 587),
//   secure: false,
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASS, // Gmail APP password
//   },
//   tls: {
//     minVersion: "TLSv1.2",
//     rejectUnauthorized: false,
//   },
// });

// transporter.verify((err, success) => {
//   if (err) {
//     console.error("[MAIL] SMTP connection failed:", err.message || err);
//   } else {
//     console.log("[MAIL] SMTP transporter is ready");
//   }
// });

// /**
//  * Simple wrapper to send an email.
//  */
// async function sendMail({ to, subject, text, html }) {
//   try {
//     const info = await transporter.sendMail({
//       from: process.env.SMTP_FROM,
//       to,
//       subject,
//       text,
//       html,
//     });
//     console.log("[MAIL] Message sent:", info.messageId);
//   } catch (err) {
//     console.error("[MAIL] Failed to send email:", err);
//     throw err;
//   }
// }

// module.exports = {
//   transporter,
//   sendMail,
// };

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
