// const express = require("express");
// const cors = require("cors");
// const dotenv = require("dotenv");

// dotenv.config();

// const sendLicenseRoute = require("./routes/sendLicense");

// const app = express();
// app.use(cors());
// app.use(express.json());

// app.use("/send-license", sendLicenseRoute);

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`✅ Server running at http://localhost:${PORT}`);
// });

// zxrf nyix flbe xaas 

const express = require("express")
const bodyParser = require("body-parser")
const crypto = require("crypto")
const fs = require("fs")
const path = require("path")
const nodemailer = require("nodemailer")
const dotenv = require("dotenv")
dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(bodyParser.json())

let licenseDatabase = new Map()
const DB_FILE = path.join(__dirname, "licenses.json")

// Load licenses from file
function loadLicenses() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, "utf8")
      const parsedData = JSON.parse(data)
      licenseDatabase = new Map(parsedData)
      console.log(`Loaded ${licenseDatabase.size} licenses from ${DB_FILE}`)
    } catch (error) {
      console.error("Error loading licenses:", error)
    }
  }
}

// Save licenses to file
function saveLicenses() {
  try {
    const data = JSON.stringify(Array.from(licenseDatabase.entries()), null, 2)
    fs.writeFileSync(DB_FILE, data, "utf8")
    console.log(`Saved ${licenseDatabase.size} licenses to ${DB_FILE}`)
  } catch (error) {
    console.error("Error saving licenses:", error)
  }
}

// Dummy machine ID
function getMachineId() {
  return "DUMMY-MACHINE-ID-V0-12345"
}

// SHA256 hashing (optional)
function generateSha256Hash(input) {
  const hash = crypto.createHash("sha256")
  hash.update(input)
  return hash.digest("hex")
}

// ✅ Route to receive license and send email
app.post("/send-license", (req, res) => {
  const { email, licenseKey } = req.body
  if (!email || !licenseKey) {
    return res.status(400).json({ status: "ERROR", message: "Email and licenseKey are required." })
  }

  const machineId = getMachineId()
  licenseDatabase.set(email, { licenseKey, machineId })
  saveLicenses()

  console.log(`Received license for ${email}: ${licenseKey} on machine ${machineId}`)

  // Email Setup
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  })

  const mailOptions = {
    from: `"Virex Security" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your Virex License Key 🔐",
    html: `
      <div style="font-family:sans-serif;font-size:16px;">
        <h2 style="color:#0057b7;">Welcome to Virex Antivirus</h2>
        <p>Here is your license key:</p>
        <div style="background:#f3f3f3;padding:10px 15px;border-radius:5px;font-size:20px;">
          <strong>${licenseKey}</strong>
        </div>
        <p>Use this key to activate your antivirus software.</p>
        <p>Thank you,<br>The Virex Team</p>
      </div>
    `
  }

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("❌ Failed to send email:", error)
      return res.status(500).json({ status: "ERROR", message: "Failed to send email." })
    }
    console.log("✅ Email sent:", info.response)
    res.json({ status: "SUCCESS", message: "License key sent successfully." })
  })
})

// ✅ License validation
app.post("/validate-license-machine", (req, res) => {
  const { email, licenseKey, machineId } = req.body
  if (!email || !licenseKey || !machineId) {
    return res.status(400).json({ status: "ERROR", message: "Email, licenseKey, and machineId are required." })
  }

  console.log(`Validating: ${email}, ${licenseKey}, ${machineId}`)
  const stored = licenseDatabase.get(email)

  if (stored) {
    if (stored.machineId !== machineId) {
      return res.json({ status: "ERROR", message: "This license is already activated on another device." })
    } else {
      if (stored.licenseKey === licenseKey) {
        return res.json({ status: "ALREADY_ACTIVATED", message: "This license is already active on this device." })
      } else {
        licenseDatabase.set(email, { licenseKey, machineId })
        saveLicenses()
        return res.json({ status: "VALID", message: "License activated successfully." })
      }
    }
  } else {
    if (licenseKey.length === 14 && licenseKey[4] === "-" && licenseKey[9] === "-") {
      licenseDatabase.set(email, { licenseKey, machineId })
      saveLicenses()
      return res.json({ status: "VALID", message: "License activated successfully." })
    } else {
      return res.json({ status: "ERROR", message: "Invalid license key format." })
    }
  }
})

// Start server
loadLicenses()
app.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`)
})
