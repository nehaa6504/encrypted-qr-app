const express = require("express");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const fs = require("fs");
const QRCode = require("qrcode");
const cryptoUtil = require("./cryptoUtil");

const app = express();

app.use(cors());
app.use(express.json());

// ===============================
// 📁 Upload Folder Setup
// ===============================

const uploadPath = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const cleanName = file.originalname.replace(/\s+/g, "-");
    const uniqueName = Date.now() + "-" + cleanName;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// ===============================
// 📁 Serve Uploaded Files
// ===============================

app.use("/file", express.static(uploadPath));

// ===============================
// 🌍 Serve Frontend
// ===============================

app.use(express.static(path.join(__dirname, "../frontend")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// ===============================
// 📤 Upload Route (Generate Public Link)
// ===============================

app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const BASE_URL = `${req.protocol}://${req.get("host")}`;
  const fileUrl = `${BASE_URL}/file/${req.file.filename}`;

  res.json({ fileUrl });
});

// ===============================
// 🔐 Encrypt Route
// ===============================

app.post("/encrypt", upload.single("file"), async (req, res) => {
  try {
    let dataToEncrypt = "";

    if (req.file) {
      const fileBuffer = fs.readFileSync(req.file.path);
      dataToEncrypt = fileBuffer.toString("base64");
    } else if (req.body.text) {
      dataToEncrypt = req.body.text;
    } else {
      return res.status(400).json({ error: "No data provided" });
    }

    const qrImage = await QRCode.toDataURL(dataToEncrypt);

    const result = cryptoUtil.encrypt(qrImage);

    res.json({
      cipherText: result.cipherText,
      key: result.key,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Encryption failed" });
  }
});

// ===============================
// 🔓 Decrypt Route
// ===============================

app.post("/decrypt", async (req, res) => {
  try {
    const { cipherText, key } = req.body;

    if (!cipherText || !key) {
      return res.status(400).json({ error: "Missing data" });
    }

    const decryptedQR = cryptoUtil.decrypt(cipherText, key);

    res.json({
      qrImage: decryptedQR,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Decryption failed" });
  }
});

// ===============================
// 🚀 Start Server
// ===============================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});