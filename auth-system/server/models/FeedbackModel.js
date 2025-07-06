const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema({
  userId: String, // Optional for now
  idealAudioId: { type: mongoose.Schema.Types.ObjectId, ref: "Audio" },
  practiceAudioId: { type: mongoose.Schema.Types.ObjectId, ref: "Audio" },
  totalChords: Number,
  correctChords: Number,
  wrongChords: Number,
  accuracy: Number,
  starRating: Number,
  medal: String,
  pitchAccuracy: Number
}, { timestamps: true });

module.exports = mongoose.model("Feedback", feedbackSchema);
