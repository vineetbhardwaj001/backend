const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
const http = require("http");
const socketIo = require("socket.io");
const { exec } = require("child_process");
const ffmpeg = require("fluent-ffmpeg");
const cleanupScript = path.join(__dirname, "cleanupChunks.js");


// FFmpeg setup
const ffmpegPath = "C:/ffmpeg/bin/ffmpeg.exe";
const ffprobePath = "C:/ffmpeg/bin/ffprobe.exe";
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

// Load env variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'https://5cz083bb-5173.inc1.devtunnels.ms',
    methods: ["GET", "POST"],
  },
});

app.use(express.json());
app.use(cors());
// Routes
const authRoutes = require('./routes/authRoutes');
const uploadRoutes = require("./routes/uploadRoutes");
const analyzeRoutes = require('./routes/analyzeRoutes');
const uploadIdealRoute = require("./routes/uploadIdeal");
const uploadPractice = require("./routes/upload-practice");
const uploadBothRoute = require("./routes/uploadBothRoute");



// Routes
app.use("/api", uploadRoutes);
app.use("/api", analyzeRoutes);
app.use("/api", uploadBothRoute);
app.use("/api", uploadIdealRoute);
app.use("/api", uploadPractice);
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('🎸 Auth System & Chord Analysis Server Running');
});

// Upload directories
const rootPath = path.resolve(__dirname, ".."); // ek level upar jao
const uploadDir = path.join(__dirname, "uploads");
const chunksDir = path.join(uploadDir, "chunks");

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(chunksDir)) fs.mkdirSync(chunksDir, { recursive: true });

// Default route
app.get("/", (req, res) => {
  res.send("🎸 Aaroh AI Backend Running");
});

// Socket.IO handlers
io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  let userChunkFiles = {};

  socket.on("mic-audio-chunk", (buffer) => {
    const filename = `chunk_${Date.now()}_${Math.floor(Math.random() * 9999)}.webm`;
    const chunkPath = path.join(chunksDir, filename);
    fs.writeFileSync(chunkPath, Buffer.from(buffer));

    if (!userChunkFiles[socket.id]) userChunkFiles[socket.id] = [];
    userChunkFiles[socket.id].push(chunkPath);

    console.log("✅ Saved chunk:", filename);
  });

  socket.on("mic-recording-end", () => {
  console.log("🎤 mic-recording-end event received");

  const chunkPaths = userChunkFiles[socket.id] || [];
  console.log("📦 Chunks to merge:", chunkPaths.length);
  console.log("🧾 Chunk paths:", chunkPaths);

  if (chunkPaths.length === 0) {
    console.log("❌ No chunks to merge");
    socket.emit("status", "❌ No chunks recorded.");
    return;
  }

  const timestamp = Date.now();
  const mergedWebmPath = path.join(uploadDir, `merged_${timestamp}.webm`);
  const mergedWavPath = mergedWebmPath.replace(".webm", ".wav");
  const fileListPath = path.join(uploadDir, `filelist_${timestamp}.txt`);
  const idealPath = path.join(uploadDir, "ideal.wav");

  const fileListContent = chunkPaths.map(p => `file '${p.replace(/\\/g, "/")}'`).join('\n');
  fs.writeFileSync(fileListPath, fileListContent);
  console.log("📄 File list content:\n", fileListContent);

  const ffmpegCmd = `${ffmpegPath} -f concat -safe 0 -i "${fileListPath}" -c:v libvpx -b:v 1M -c:a libvorbis "${mergedWebmPath}"`;

  console.log("🔧 FFmpeg merge command:", ffmpegCmd);
  console.log("🔁 Step 2: Merging chunks...");
  socket.emit("status", "🔁 Step 2: Merging chunks...");

  exec(ffmpegCmd, (err, stdout, stderr) => {
    if (err) {
      console.error("❌ FFmpeg merge error:", stderr);
      socket.emit("status", "❌ Chunk merging failed.");
      return;
    }

    console.log("📤 FFmpeg merge output:", stdout);
    console.log("✅ Step 3: Chunks merged");
    socket.emit("status", "✅ Step 3: Chunks merged");

    if (!fs.existsSync(mergedWebmPath)) {
      console.error("❌ Merged WebM not found:", mergedWebmPath);
      socket.emit("status", "❌ Merged WebM missing.");
      return;
    }

    ffmpeg(mergedWebmPath)
      .output(mergedWavPath)
      .audioCodec('pcm_s16le')
      .format('wav')
      .on("end", () => {
        console.log("✅ Step 4: Converted to WAV");
        socket.emit("status", "✅ Step 4: Converted to WAV");

        const pythonPath = `"C:/Program Files/Python312/python.exe"`; // Update if needed
        const scriptPath = path.join(__dirname, "python-model", "predict.py");
        const cmd = `${pythonPath} "${scriptPath}" "${idealPath}" "${mergedWavPath}"`;

        console.log("👉 Running command:");
        console.log("🧠 Step 5: Analyzing audio...");
        socket.emit("status", "🧠 Step 5: Analyzing audio...");

        exec(cmd, (err, stdout, stderr) => {
          if (err) {
            console.error("❌ Python error:", stderr);
            socket.emit("status", "❌ Python processing failed.");
            return;
          }

          try {
          const result = JSON.parse(stdout);
          // Process feedback details
const total = result.feedback.length;
const correct = result.feedback.filter(f => f.correct).length;
const mistakes = total - correct;
const accuracy = result.accuracy || 0;
const level = result.level || "Beginner";
const stars = accuracy >= 90 ? 5 : accuracy >= 75 ? 4 : accuracy >= 60 ? 3 : accuracy >= 40 ? 2 : 1;

// Missing chords
const missingChords = result.feedback
  .filter(f => !f.correct)
  .map(f => ({ chord: f.chord, time: f.start }));

// Best and worst chords
const chordStats = {};
result.feedback.forEach(f => {
  if (!chordStats[f.chord]) chordStats[f.chord] = { correct: 0, total: 0 };
  chordStats[f.chord].total += 1;
  if (f.correct) chordStats[f.chord].correct += 1;
});

let bestChord = null;
let worstChord = null;
let bestAccuracy = 0;
let worstAccuracy = 1;

for (const [chord, stats] of Object.entries(chordStats)) {
  const acc = stats.correct / stats.total;
  if (acc > bestAccuracy) {
    bestAccuracy = acc;
    bestChord = chord;
  }
  if (acc < worstAccuracy) {
    worstAccuracy = acc;
    worstChord = chord;
  }
}

// Transition mistakes
const transitionsWrong = {};
for (let i = 1; i < result.feedback.length; i++) {
  const prev = result.feedback[i - 1];
  const curr = result.feedback[i];
  if (!prev.correct || !curr.correct) {
    const key = `${prev.chord}->${curr.chord}`;
    transitionsWrong[key] = (transitionsWrong[key] || 0) + 1;
  }
}
const transitionList = Object.entries(transitionsWrong).map(([k, v]) => {
  const [from, to] = k.split("->");
  return { from, to, count: v };
});

// Duration
const duration = result.feedback[result.feedback.length - 1]?.end || 0;

// Auto guidance
let guidance = "";
let tariff = "";
if (level === "Professional") {
  guidance = "Excellent! You’re at a professional level. Keep refining your chord transitions.";
  tariff = "🔥 You nailed it! 🎸";
} else if (level === "Intermediate") {
  guidance = "You're doing well. Focus on accuracy and tempo balance.";
  tariff = "🚀 Solid progress! Push a little more for perfection.";
} else {
  guidance = "You're at the Beginner level. Practice slow transitions, especially between F, C, and Am chords.";
  tariff = "💪 Great start! Keep practicing daily and you'll hit Intermediate soon!";
}

// Emit final summary
socket.emit("mic-final-feedback", {
  summary: {
    totalChords: total,
    correctChords: correct,
    mistakes,
    accuracy,
    level,
    stars,
    missingChords,
    bestChord,
    worstChord,
    duration,
    transitionsWrong: transitionList,
    guidance,
    tariff
  }
});

/*const total = result.feedback.length;
const correct = result.feedback.filter(f => f.correct).length;
const mistakes = total - correct;
const accuracy = result.accuracy || 0;
const level = result.level || "Beginner";
const stars = accuracy >= 90 ? 5 : accuracy >= 75 ? 4 : accuracy >= 60 ? 3 : accuracy >= 40 ? 2 : 1;

const missing = result.feedback
  .filter(f => !f.correct)
  .map(f => ({
    chord: f.chord,
    time: f.start
  }));

// Auto guidance
let guidance = "";
let tariff = "";

if (level === "Professional") {
  guidance = "Excellent! You’re at a professional level. Keep refining your chord transitions.";
  tariff = "🔥 You nailed it! 🎸";
} else if (level === "Intermediate") {
  guidance = "You're doing well. Focus on accuracy and tempo balance.";
  tariff = "🚀 Solid progress! Push a little more for perfection.";
} else {
  guidance = "You're at the Beginner level. Practice slow transitions, especially between F, C, and Am chords.";
  tariff = "💪 Great start! Keep practicing daily and you'll hit Intermediate soon!";
}

socket.emit("chord-feedback", result.feedback); // raw feedback if needed

// Human-readable box format
socket.emit("mic-final-feedback", {
  mic_summary: {
    totalChords: total,
    correctChords: correct,
    mistakes,
    accuracy,
    level,
    stars,
    missingChords: missing,
    guidance,
    tariff
  }
});*/

            console.log("✅ Step 6: Feedback sent");
            socket.emit("status", "✅ Step 6: Feedback sent");
          } catch (err) {
            console.error("❌ JSON parse error:", stdout);
            socket.emit("status", "❌ Failed to parse AI output.");
          }
        });
      })
      .on("error", (err) => {
        console.error("❌ FFmpeg WAV error:", err.message);
        console.error("❌ Full FFmpeg error:", err);
        socket.emit("status", "❌ WAV conversion failed.");
      })
      .run(); // Start the ffmpeg process
  });
});


  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
    // Optional: Cleanup if any unmerged chunks remain

  });
});
setInterval(() => {
  console.log("🧹 Running cleanup of old uploads...");
  exec(`node "${cleanupScript}"`);
}, 5 * 60 * 1000); // every 5 minutes

// Start MongoDB + Server
mongoose
  .connect(process.env.MONGO_URI, {})
  .then(() => {
    console.log("✅ MongoDB Connected");
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 Server + WebSocket running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => console.error("❌ MongoDB connection failed:", err));






/* ye code work hai per feedback not handle
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
const http = require("http");
const socketIo = require("socket.io");
const { exec, spawn } = require("child_process");
const ffmpeg = require("fluent-ffmpeg");

const cleanupScript = path.join(__dirname, "cleanupChunks.js");
const { saveChunk, mergeChunksAndConvert } = require('./utils/mic-handler');

// FFmpeg setup
const ffmpegPath = "C:/ffmpeg/bin/ffmpeg.exe";
const ffprobePath = "C:/ffmpeg/bin/ffprobe.exe";
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

// Load env variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.use(express.json());
app.use(cors());

// Upload directories
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// API Routes
app.use("/api", require('./routes/uploadRoutes'));
app.use("/api", require('./routes/analyzeRoutes'));
app.use("/api", require('./routes/uploadBothRoute'));
app.use("/api", require('./routes/uploadIdeal'));
app.use("/api", require('./routes/upload-practice'));
app.use("/api/auth", require('./routes/authRoutes'));

app.get("/", (req, res) => {
  res.send("🎸 Aaroh AI Backend Running");
});

// 🔌 SOCKET.IO Mic Audio Logic
let chunkIndexMap = {};

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);
  chunkIndexMap[socket.id] = 0;

  socket.on("mic-audio-chunk", (buffer) => {
    const index = chunkIndexMap[socket.id]++;
    const chunkPath = saveChunk(buffer, index, socket.id);
    console.log(`✅ Chunk saved: ${chunkPath}`);

    // Optional: Live feedback per chunk (for real-time updates)
    // socket.emit("chord-feedback", { chord: "C", time: index, stringIndex: index % 6 });
  });

socket.on("mic-audio-final", () => {
  console.log("📥 Mic final received... merging and analyzing");

  mergeChunksAndConvert(socket.id, (finalWavPath) => {
    console.log("🎧 WAV ready:", finalWavPath);

    const idealPath = path.join(uploadDir, "ideal.wav");
    if (!fs.existsSync(idealPath)) {
      socket.emit("status", "❌ ideal.wav not found");
      return;
    }

    const scriptPath = path.join(__dirname, "python-model", "predict.py");
    const py = spawn("python", [scriptPath, idealPath, finalWavPath]);

    let result = "";
    py.stdout.on("data", (data) => result += data.toString());

    py.stderr.on("data", (data) => {
      console.error("🐍 Python error:", data.toString());
      socket.emit("status", "❌ Python error: " + data.toString());
    });

    py.on("close", () => {
      try {
        const parsed = JSON.parse(result);
        socket.emit("chord-feedback", parsed);
        socket.emit("summary-feedback", {
          accuracy: parsed.accuracy,
          level: parsed.level,
        });
        socket.emit("status", "✅ Final feedback sent");
      } catch (err) {
        console.error("❌ JSON Parse Error:", result);
        socket.emit("status", "❌ Could not parse AI output");
      }
    });
  });
});



  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
    delete chunkIndexMap[socket.id];
  });
});

// 🧹 Clean old chunks every 5 minutes
setInterval(() => {
  console.log("🧹 Running cleanup of old uploads...");
  exec(`node "${cleanupScript}"`);
}, 5 * 60 * 1000);

// 🚀 Start Server
mongoose
  .connect(process.env.MONGO_URI, {})
  .then(() => {
    console.log("✅ MongoDB Connected");
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 Server + WebSocket running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => console.error("❌ MongoDB connection failed:", err));
*/

/*const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
const http = require("http");
const socketIo = require("socket.io");
const { exec } = require("child_process");
const ffmpeg = require("fluent-ffmpeg");
const cleanupScript = path.join(__dirname, "cleanupChunks.js");


// FFmpeg setup
const ffmpegPath = "C:/ffmpeg/bin/ffmpeg.exe";
const ffprobePath = "C:/ffmpeg/bin/ffprobe.exe";
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

// Load env variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.use(express.json());
app.use(cors());
// Routes
const authRoutes = require('./routes/authRoutes');
const uploadRoutes = require("./routes/uploadRoutes");
const analyzeRoutes = require('./routes/analyzeRoutes');
const uploadIdealRoute = require("./routes/uploadIdeal");
const uploadPractice = require("./routes/upload-practice");
const uploadBothRoute = require("./routes/uploadBothRoute");



// Routes
app.use("/api", uploadRoutes);
app.use("/api", analyzeRoutes);
app.use("/api", uploadBothRoute);
app.use("/api", uploadIdealRoute);
app.use("/api", uploadPractice);
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('🎸 Auth System & Chord Analysis Server Running');
});

// Upload directories
const rootPath = path.resolve(__dirname, ".."); // ek level upar jao
const uploadDir = path.join(__dirname, "uploads");
const chunksDir = path.join(uploadDir, "chunks");

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(chunksDir)) fs.mkdirSync(chunksDir, { recursive: true });

// Default route
app.get("/", (req, res) => {
  res.send("🎸 Aaroh AI Backend Running");
});

// Socket.IO handlers
io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  let userChunkFiles = {};

  socket.on("mic-audio-chunk", (buffer) => {
    const filename = `chunk_${Date.now()}_${Math.floor(Math.random() * 9999)}.webm`;
    const chunkPath = path.join(chunksDir, filename);
    fs.writeFileSync(chunkPath, Buffer.from(buffer));

    if (!userChunkFiles[socket.id]) userChunkFiles[socket.id] = [];
    userChunkFiles[socket.id].push(chunkPath);

    console.log("✅ Saved chunk:", filename);
  });

  socket.on("mic-recording-end", () => {
    const chunkPaths = userChunkFiles[socket.id] || [];
    if (chunkPaths.length === 0) {
      console.log("❌ No chunks to merge");
      socket.emit("status", "❌ No chunks recorded.");
      return;
    }

    const timestamp = Date.now();
    const mergedWebmPath = path.join(uploadDir, `merged_${timestamp}.webm`);
    const mergedWavPath = mergedWebmPath.replace(".webm", ".wav");
    const fileListPath = path.join(uploadDir, `filelist_${timestamp}.txt`);
    const idealPath = path.join(uploadDir, "ideal.wav");

    const fileListContent = chunkPaths.map(p => `file '${p.replace(/\\/g, "/")}'`).join('\n');
    fs.writeFileSync(fileListPath, fileListContent);

    const ffmpegCmd = `${ffmpegPath} -f concat -safe 0 -i "${fileListPath}" -c copy "${mergedWebmPath}"`;

    console.log("🔁 Step 2: Merging chunks...");
    socket.emit("status", "🔁 Step 2: Merging chunks...");

    exec(ffmpegCmd, (err, stdout, stderr) => {
      if (err) {
        console.error("❌ FFmpeg merge error:", stderr);
        socket.emit("status", "❌ Chunk merging failed.");
        return;
      }

      console.log("✅ Step 3: Chunks merged");
      socket.emit("status", "✅ Step 3: Chunks merged");

      ffmpeg(mergedWebmPath)
        .toFormat("wav")
        .on("end", () => {
          console.log("✅ Step 4: Converted to WAV");
          socket.emit("status", "✅ Step 4: Converted to WAV");

          const pythonPath = `"C:/Program Files/Python312/python.exe"`; // Update path if needed
          const scriptPath = path.join(__dirname, "python-model", "predict.py");
          const cmd = `${pythonPath} "${scriptPath}" "${idealPath}" "${mergedWavPath}"`;

          console.log("🧠 Step 5: Analyzing audio...");
          socket.emit("status", "🧠 Step 5: Analyzing audio...");

          exec(cmd, (err, stdout, stderr) => {
            if (err) {
              console.error("❌ Python error:", stderr);
              socket.emit("status", "❌ Python processing failed.");
              return;
            }

            try {
              const result = JSON.parse(stdout);
              socket.emit("chord-feedback", result);
              socket.emit("summary-feedback", {
                accuracy: result.accuracy,
                level: result.level,
              });
              console.log("✅ Step 6: Feedback sent");
              socket.emit("status", "✅ Step 6: Feedback sent");
            } catch (err) {
              console.error("❌ JSON parse error:", stdout);
              socket.emit("status", "❌ Failed to parse AI output.");
            }

          });
        })
        .on("error", (err) => {
          console.error("❌ FFmpeg WAV error:", err.message);
          socket.emit("status", "❌ WAV conversion failed.");
        })
        .save(mergedWavPath);
    });
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
    // Optional: Cleanup if any unmerged chunks remain
   
  });
});
setInterval(() => {
  console.log("🧹 Running cleanup of old uploads...");
  exec(`node "${cleanupScript}"`);
}, 5 * 60 * 1000); // every 5 minutes

// Start MongoDB + Server
mongoose
  .connect(process.env.MONGO_URI, {})
  .then(() => {
    console.log("✅ MongoDB Connected");
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 Server + WebSocket running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => console.error("❌ MongoDB connection failed:", err));

*/



/*50% working 
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require("path");
const fs = require('fs');
const dotenv = require('dotenv');
const http = require("http");
const socketIo = require("socket.io");

// Routes
const authRoutes = require('./routes/authRoutes');
const uploadRoutes = require("./routes/uploadRoutes");
const analyzeRoutes = require('./routes/analyzeRoutes');
const uploadIdealRoute = require("./routes/uploadIdeal");
const uploadPractice = require("./routes/upload-practice");
const uploadBothRoute = require("./routes/uploadBothRoute");

// Load environment variables
dotenv.config();

// Express app and server
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173", // Frontend origin
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(express.json());
app.use(cors());

// Request logging middleware
app.use((req, res, next) => {
  console.log("📥 Request received:");
  console.log("➡️ Method:", req.method);
  console.log("➡️ URL:", req.url);
  console.log("📦 Body:", req.body);
  next();
});

// Debug .env info
console.log("🔑 Email user:", process.env.EMAIL_USER);
console.log("🔑 Email pass:", process.env.EMAIL_PASS ? "✔️ Loaded" : "❌ Not Loaded");
console.log("🔑 Key:", process.env.RESEND_API_KEY);

// File upload directory
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
app.use("/uploads", express.static(uploadDir));

// Routes
app.use("/api", uploadRoutes);
app.use("/api", analyzeRoutes);
app.use("/api", uploadBothRoute);
app.use("/api", uploadIdealRoute);
app.use("/api", uploadPractice);
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('🎸 Auth System & Chord Analysis Server Running');
});

// Socket.IO for mic live audio input
io.on("connection", (socket) => {
  console.log("🎧 User connected:", socket.id);

  socket.on("mic-audio-chunk", (chunk) => {
    console.log("🔊 Audio chunk received:", chunk?.byteLength || "N/A");
    // ⏳ TODO: Send chunk to Python model for prediction and emit feedback
    // socket.emit("chord-feedback", { chord: "C", correct: true, start: 1.0 });
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected");
  });
});

// MongoDB Connection + Server Start
mongoose.connect(process.env.MONGO_URI, {})
  .then(() => {
    console.log('✅ MongoDB Connected');
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 Server + WebSocket running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => console.error('❌ DB Connection Error:', err));*/


/*100% working
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const path = require("path");
const fs = require('fs'); 
const socketIo = require("socket.io");
const uploadRoutes = require("./routes/uploadRoutes");
const analyzeRoutes = require('./routes/analyzeRoutes');
const uploadIdealRoute = require("./routes/uploadIdeal");
const uploadPractice = require("./routes/upload-practice");


require('dotenv').config(); 

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  console.log("📥 Request received:");
  console.log("➡️ Method:", req.method);
  console.log("➡️ URL:", req.url);
  console.log("📦 Body:", req.body);
  next();
});
console.log("🔑 Email user:", process.env.EMAIL_USER);
console.log("🔑 Email pass:", process.env.EMAIL_PASS ? "✔️ Loaded" : "❌ Not Loaded");
console.log("🔑 Key:", process.env.RESEND_API_KEY);

app.use(cors());

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api", uploadRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', analyzeRoutes);
app.use("/api", require("./routes/uploadBothRoute"));
app.use("/api", uploadIdealRoute);
app.use("/api", uploadPractice);


app.get('/', (req, res) => {
  res.send('Auth System Running');
});

mongoose.connect(process.env.MONGO_URI, {
 
})
.then(() => {
  console.log('✅ MongoDB Connected');
  app.listen(process.env.PORT || 5000, () => {
    console.log(`🚀 Server running on http://localhost:${process.env.PORT || 5000}`);
  });
})
.catch((err) => console.error('❌ DB Connection Error:', err));*/
