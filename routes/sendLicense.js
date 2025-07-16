const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
require("dotenv").config();

router.post("/", async (req, res) => {
  const { email, licenseKey } = req.body;

  if (!email || !licenseKey) {
    return res.status(400).json({ error: "Email and licenseKey are required." });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const htmlContent = `
      <h2 style="color: #2563eb;">Virex Security - License Key</h2>
      <p>Thank you for choosing Virex Security!</p>
      <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p><strong>Your License Key:</strong></p>
        <p style="font-size: 24px; font-weight: bold;">${licenseKey}</p>
      </div>
      <p>This key is tied to your email and machine.</p>
    `;

    const mailOptions = {
      from: `"Virex Security" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your Virex License Key",
      html: htmlContent
    };

    await transporter.sendMail(mailOptions);
    return res.status(200).json({ message: "✅ Email sent successfully." });
  } catch (error) {
    console.error("❌ Email error:", error);
    return res.status(500).json({ error: "Failed to send email." });
  }
});

module.exports = router;
