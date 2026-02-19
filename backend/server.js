const express = require("express");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const fs = require("fs");

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

// Multer storage config
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
// 📁 Serve Uploaded Files Publicly
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
// 📤 Upload Route
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
// 🚀 Start Server
// ===============================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
