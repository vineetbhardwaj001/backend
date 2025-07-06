const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");

const router = express.Router();

// ✅ Multer with original extension
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "uploads"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".wav";
    const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

router.post("/upload-ideal", upload.single("ideal"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "❌ No file uploaded" });
  }

  try {
    const uploadDir = path.join(__dirname, "..", "uploads");
    const uploadedPath = req.file.path;
    const idealPath = path.join(uploadDir, "ideal.wav"); // Final destination

    if (!fs.existsSync(uploadedPath)) {
      console.error("❌ Uploaded file missing:", uploadedPath);
      return res.status(500).json({ message: "Uploaded file not found" });
    }

    // ✅ Rename uploaded file to ideal.wav
    fs.renameSync(uploadedPath, idealPath);
    console.log("✅ File renamed to:", idealPath);

    // 🧠 Run AI script to extract ideal chords
    const python = `"C:/Program Files/Python312/python.exe"`; // Adjust if needed
    const script = path.join(__dirname, "..", "python-model", "predict.py");
    const command = `${python} "${script}" "${idealPath}"`;

    console.log("👉 Running command:", command);

    exec(command, (err, stdout, stderr) => {
      if (err) {
        console.error("❌ Python error:", stderr);
        return res.status(500).json({ message: "Python script failed" });
      }

      try {
        const result = JSON.parse(stdout); // should return { feedback: [...] }
        res.status(200).json({
          message: "✅ Ideal audio uploaded and analyzed",
          idealPath: "/uploads/ideal.wav",
          feedback: result.feedback,
        });
      } catch (e) {
        console.error("❌ JSON parse error:", stdout);
        res.status(500).json({ message: "Invalid JSON from Python script" });
      }
    });
  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({ message: "Failed to process ideal audio" });
  }
});

module.exports = router;
