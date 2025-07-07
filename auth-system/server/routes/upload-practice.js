// server/routes/upload-practice.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const { exec } = require("child_process");
const router = express.Router();

const storage = multer.diskStorage({
  destination: path.join(__dirname, "../uploads"),
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + file.originalname);
  },
});
const upload = multer({ storage });

router.post("/upload-practice", upload.single("practice"), (req, res) => {
  const idealPath = req.body.idealPath;
  const practiceFile = req.file;

  if (!idealPath || !practiceFile) {
    return res.status(400).json({ message: "Missing data" });
  }

  const practicePath = path.join(__dirname, "../uploads", practiceFile.filename);
   const python = "python3"; 
  // const python = `"C:/Program Files/Python312/python.exe"`;
  const script = path.join(__dirname, "../python-model/predict.py");

  const command = `${python} "${script}" "${idealPath}" "${practicePath}"`;

  exec(command, (err, stdout, stderr) => {
    if (err) {
      console.error("Python error:", stderr);
      return res.status(500).json({ message: "Python script failed" });
    }

    try {
      const result = JSON.parse(stdout);
      res.status(200).json(result);
    } catch (e) {
      console.error("JSON parse error:", stdout);
      res.status(500).json({ message: "Invalid Python output" });
    }
  });
});

module.exports = router;
