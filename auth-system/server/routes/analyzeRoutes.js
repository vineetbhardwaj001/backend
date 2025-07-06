const express = require("express");
const multer = require("multer");
const path = require("path");
const { analyzeAudio } = require("../controller/analyzeController");

const router = express.Router();

// Set up storage for uploaded practice audio
const storage = multer.diskStorage({
  destination: path.join(__dirname, "../uploads"),
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + file.originalname);
  },
});

const upload = multer({ storage });

// Main route: Accepts optional 'practice' file + 'idealPath' from client
router.post("/analyze", upload.single("practice"), analyzeAudio);

module.exports = router;
