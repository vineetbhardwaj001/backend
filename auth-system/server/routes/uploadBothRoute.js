const express = require("express");
const multer = require("multer");
const path = require("path");

const router = express.Router();

// 🔧 Setup Multer storage
const storage = multer.diskStorage({
  destination: path.join(__dirname, "../uploads"),
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + file.originalname);
  },
});
const upload = multer({ storage });

// 🟢 Allow either file (not both required)
router.post(
  "/upload-both",
  upload.fields([
    { name: "ideal", maxCount: 1 },
    { name: "practice", maxCount: 1 },
  ]),
  (req, res) => {
    const idealFile = req.files?.ideal?.[0];
    const practiceFile = req.files?.practice?.[0];

    if (!idealFile && !practiceFile) {
      return res.status(400).json({ message: "At least one file must be uploaded" });
    }

    const idealPath = idealFile ? `/uploads/${idealFile.filename}` : null;
    const practicePath = practiceFile ? `/uploads/${practiceFile.filename}` : null;

    return res.status(200).json({ idealPath, practicePath });
  }
);

module.exports = router;


/* ye code ideal or practies ka hai
const express = require("express");
const multer = require("multer");
const path = require("path");

const router = express.Router();

const storage = multer.diskStorage({
  destination: path.join(__dirname, "../uploads"),
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + file.originalname);
  },
});
const upload = multer({ storage });

router.post("/upload-both", upload.fields([
  { name: "ideal", maxCount: 1 },
  { name: "practice", maxCount: 1 }
]), (req, res) => {
  if (!req.files || !req.files.ideal || !req.files.practice) {
    return res.status(400).json({ message: "Both files required" });
  }

  const idealPath = `/uploads/${req.files.ideal[0].filename}`;
  const practicePath = `/uploads/${req.files.practice[0].filename}`;

  res.status(200).json({ idealPath, practicePath });
});

module.exports = router;*/
