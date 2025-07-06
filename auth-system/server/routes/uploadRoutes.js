const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { uploadAudio } = require('../controller/uploadController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

router.post('/upload', upload.single('audio'), uploadAudio);

module.exports = router;








/*// routes/uploadRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const {
  uploadAudio,
  analyzeAudio // ✅ add this
} = require("../controller/uploadController");

// Set up Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// 🔽 Routes
router.post("/upload", upload.single("audio"), uploadAudio);
router.post("/analyze", analyzeAudio); // ✅ added

module.exports = router;*/

