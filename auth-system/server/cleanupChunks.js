// cleanupChunks.js
const fs = require("fs");
const path = require("path");

const UPLOAD_DIR = path.join(__dirname, "uploads");
const MAX_AGE_MINUTES = 7;
const now = Date.now();

fs.readdir(UPLOAD_DIR, (err, files) => {
  if (err) {
    console.error("❌ Failed to read upload folder:", err);
    return;
  }

  files.forEach((file) => {
    const filePath = path.join(UPLOAD_DIR, file);

    fs.stat(filePath, (err, stats) => {
      if (err) {
        console.error("❌ Stat error for:", file);
        return;
      }

      const ageMinutes = (now - stats.mtimeMs) / 60000;

      if (ageMinutes > MAX_AGE_MINUTES) {
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error("❌ Error deleting file:", file, err.message);
          } else {
            console.log("🗑️ Deleted old file:", file);
          }
        });
      }
    });
  });
});
