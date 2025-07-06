const mongoose = require("mongoose");

const audioSchema = new mongoose.Schema({
  filename: String,
  type: { type: String, enum: ["ideal", "practice"] },
  chords: [
    {
      time: Number,
      chord: String,
      stringIndex: Number,
      correct: Boolean
    }
  ],
  pitchCurve: [
    {
      time: Number,
      freq: Number
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model("Audio", audioSchema);
