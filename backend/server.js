const express = require("express");
const cors = require("cors");
const multer = require("multer");
const QRCode = require("qrcode");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const { encrypt, decrypt } = require("./cryptoUtil");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Upload folder FIRST (important)
const uploadFolder = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder);
}

// ✅ Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadFolder);
  },
  filename: function (req, file, cb) {
    const uniqueName =
      crypto.randomBytes(8).toString("hex") +
      path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

/**
 * Encrypt & Generate QR
 */
app.post("/encrypt", upload.single("file"), async (req, res) => {
  try {
    let payload;

    if (req.file) {
      // ✅ Read file from disk properly
      const filePath = path.join(uploadFolder, req.file.filename);
      const fileData = fs.readFileSync(filePath);

      payload = {
        type: "file",
        name: req.file.originalname,
        data: fileData.toString("base64"),
      };
    } else {
      payload = { type: "text", data: req.body.text };
    }

    const qrData = JSON.stringify(payload);
    const qrImage = await QRCode.toDataURL(qrData);

    const encrypted = encrypt(qrImage);

    res.json(encrypted);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Encryption failed" });
  }
});

/**
 * Decrypt & Restore QR
 */
app.post("/decrypt", (req, res) => {
  try {
    const { cipherText, key } = req.body;
    const decryptedQR = decrypt(cipherText, key);

    res.json({ qrImage: decryptedQR });
  } catch (err) {
    res.status(400).json({ error: "Invalid key or corrupted data" });
  }
});

/**
 * Upload File & Generate Link
 */
app.post("/upload-file", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log("Uploaded File:", req.file); // debug

   const fileUrl = `${req.protocol}://${req.get("host")}/view/${req.file.filename}`;

    return res.status(200).json({
      success: true,
      link: fileUrl
    });

  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({
      success: false,
      error: "Upload failed"
    });
  }
});


/**
 * Serve File
 */
app.get("/view/:filename", (req, res) => {
  const filePath = path.join(uploadFolder, req.params.filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("File not found");
  }

  const ext = path.extname(filePath).toLowerCase();

  // Set content type for inline viewing
  if (ext === ".jpg" || ext === ".jpeg") {
    res.type("image/jpeg");
  } else if (ext === ".png") {
    res.type("image/png");
  } else if (ext === ".mp4") {
    res.type("video/mp4");
  } else if (ext === ".pdf") {
    res.type("application/pdf");
  }

  res.sendFile(filePath);
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

