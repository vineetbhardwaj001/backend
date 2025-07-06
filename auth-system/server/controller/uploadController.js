// controllers/uploadController.js
 
// ✅ Add this
//this code save audio to local storges.
//exports.uploadAudio = (req, res) => {
 // if (!req.file) {
  //  return res.status(400).json({ message: "No audio file uploaded" });
 // }

  //return res.status(200).json({
    //message: "Audio uploaded successfully",
    //filePath: `/uploads/${req.file.filename}`,
  //});
//};

// controller/uploadController.js

exports.uploadAudio = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const filePath = `/uploads/${req.file.filename}`;
  console.log("📂 File saved at:", filePath);
  console.log("📝 Saved File:", req.file.path);


  res.status(200).json({
    message: "Upload successful!",
    filePath,
  });
};

/*exports.analyzeAudio = async (req, res) => {
  const { audioPath } = req.body;

  if (!audioPath) {
    return res.status(400).json({ message: "Audio path is required" });
  }

  // Dummy feedback (replace with real logic)
 const feedback = [
    { chord: "C", start: 0, duration: 2, correct: true },
    { chord: "G", start: 2, duration: 2, correct: false },
    { chord: "Am", start: 4, duration: 2, correct: true }
  ];
  

  res.status(200).json({ message: "Feedback generated", feedback });
};*/
