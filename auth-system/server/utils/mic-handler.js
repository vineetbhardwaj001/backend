const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");

ffmpeg.setFfmpegPath("C:/ffmpeg/bin/ffmpeg.exe");
ffmpeg.setFfprobePath("C:/ffmpeg/bin/ffprobe.exe");

const rootDir = path.join(__dirname, "../uploads/mic_chunks");

function saveChunk(buffer, index, socketId) {
  const userDir = path.join(rootDir, socketId);
  if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });

  const chunkPath = path.join(userDir, `chunk_${index}.webm`);
  fs.writeFileSync(chunkPath, Buffer.from(buffer));
  return chunkPath;
}

function mergeChunksAndConvert(socketId, callback = () => {}) {
  const userDir = path.join(rootDir, socketId);
  const mergedWebm = path.join(userDir, "merged.webm");
  const finalWavPath = path.join(userDir, "final.wav");

  const chunkFiles = fs.readdirSync(userDir)
    .filter(f => f.endsWith(".webm"))
    .map(f => path.join(userDir, f))
    .sort();

  if (chunkFiles.length === 0) {
    console.error("❌ No chunks found to merge for", socketId);
    return;
  }

  const fileListPath = path.join(userDir, "inputs.txt");
  fs.writeFileSync(fileListPath, chunkFiles.map(f => `file '${f.replace(/\\/g, "/")}'`).join("\n"));

  ffmpeg()
    .input(fileListPath)
    .inputOptions(["-f", "concat", "-safe", "0"])
    .outputOptions("-c", "copy")
    .output(mergedWebm)
    .on("end", () => {
      ffmpeg(mergedWebm)
        .toFormat("wav")
        .output(finalWavPath)
        .on("end", () => callback(finalWavPath))
        .on("error", (err) => {
          console.error("❌ Error converting to WAV:", err.message);
        })
        .run();
    })
    .on("error", (err) => {
      console.error("❌ Error merging chunks:", err.message);
    })
    .run();
}

module.exports = { saveChunk, mergeChunksAndConvert };
