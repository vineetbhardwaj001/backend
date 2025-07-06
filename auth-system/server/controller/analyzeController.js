const { exec } = require("child_process");
const path = require("path");

exports.analyzeAudio = (req, res) => {
  const { idealPath } = req.body;
  const practiceFile = req.file;

  // No input at all
  if (!idealPath && !practiceFile) {
    return res.status(400).json({ message: "At least one audio (ideal or practice) is required" });
  }

  const pythonPath = `"C:/Program Files/Python312/python.exe"`;
  const scriptPath = `"${path.join(__dirname, "../python-model/predict.py")}"`;

  const idealFull = idealPath
    ? path.join(__dirname, "../uploads", path.basename(idealPath))
    : null;

  const practiceFull = practiceFile ? practiceFile.path : null;

  let command;
  if (idealFull && practiceFull) {
    command = `${pythonPath} ${scriptPath} "${idealFull}" "${practiceFull}"`;
  } else if (idealFull) {
    command = `${pythonPath} ${scriptPath} "${idealFull}"`;
  } else if (practiceFull) {
    command = `${pythonPath} ${scriptPath} "${practiceFull}"`;
  }

  exec(command, (err, stdout, stderr) => {
    if (err) {
      console.error("❌ Python error:", stderr);
      return res.status(500).json({ message: "Python script failed" });
    }

    try {
      const result = JSON.parse(stdout);
      res.status(200).json(result);
    } catch (e) {
      console.error("❌ Failed to parse Python JSON:", stdout);
      res.status(500).json({ message: "Invalid output from Python script" });
    }
  });
};


/*ye code bhiideal or oractice 
const { exec } = require("child_process");
const path = require("path");

exports.analyzeAudio = (req, res) => {
  const { idealPath, practicePath } = req.body;

  // Handle missing case
  if (!idealPath && !practicePath) {
    return res.status(400).json({ message: "At least one file path is required" });
  }

  // Resolve actual paths
  const idealFull = idealPath
    ? path.join(__dirname, "../uploads", path.basename(idealPath))
    : null;
  const practiceFull = practicePath
    ? path.join(__dirname, "../uploads", path.basename(practicePath))
    : null;

  // Build Python command based on what was uploaded
  const pythonPath = `"C:/Program Files/Python312/python.exe"`; // Or use just "python" if it's in PATH
  const scriptPath = `"${path.join(__dirname, "../python-model/predict.py")}"`;

  let command;
  if (idealFull && practiceFull) {
    command = `${pythonPath} ${scriptPath} "${idealFull}" "${practiceFull}"`;
  } else if (practiceFull) {
    command = `${pythonPath} ${scriptPath} "${practiceFull}"`;
  } else if (idealFull) {
    command = `${pythonPath} ${scriptPath} "${idealFull}"`;
  }

  if (!command) {
    return res.status(400).json({ message: "No valid file path to analyze" });
  }

  exec(command, (err, stdout, stderr) => {
    if (err) {
      console.error("❌ Python error:", stderr);
      return res.status(500).json({ message: "Python script failed" });
    }

    try {
      const output = JSON.parse(stdout);
      return res.status(200).json(output);
    } catch (e) {
      console.error("❌ Failed to parse Python JSON:", stdout);
      return res.status(500).json({ message: "Invalid Python output" });
    }
  });
};
*/


//ye code ideal or practies auido ko feedback deta hai

/*const { exec } = require("child_process");
const path = require("path");

exports.analyzeAudio = (req, res) => {
  const { idealPath, practicePath } = req.body;

  // 🛑 Validate
  if (!idealPath || !practicePath) {
    return res.status(400).json({ message: "Missing ideal or practice audio path" });
  }

  // ✅ Resolve full absolute paths
  const idealFull = path.join(__dirname, "../uploads", path.basename(idealPath));
  const practiceFull = path.join(__dirname, "../uploads", path.basename(practicePath));
 

  // ✅ Use proper Python path for Windows
  const pythonPath = `"C:/Program Files/Python312/python.exe"`;
  const scriptPath = `"${path.join(__dirname, "../python-model/predict.py")}"`;

  // ✅ Run both files with Python
  const command = `${pythonPath} ${scriptPath} "${idealFull}" "${practiceFull}"`;

  exec(command, (err, stdout, stderr) => {
    if (err) {
      console.error("❌ Python execution error:", stderr);
      return res.status(500).json({ error: "Python execution failed" });
    }

    try {
      const output = JSON.parse(stdout);
      res.status(200).json(output); // contains feedback, accuracy, level
    } catch (e) {
      console.error("❌ JSON parse error from Python:", stdout);
      res.status(500).json({ error: "Invalid JSON output from Python" });
    }
  });
};*/




/*const { exec } = require("child_process");
const path = require("path");

exports.analyzeAudio = (req, res) => {
  const { audioPath } = req.body;
  if (!audioPath) return res.status(400).json({ message: "Missing audio path" });

  const fullPath = path.join(__dirname, "../uploads", path.basename(audioPath));

 const pythonPath = `"C:/Program Files/Python312/python.exe"`;
  const scriptPath = `"${path.join(__dirname, "../python-model/predict.py")}"`;

 exec(`${pythonPath} ${scriptPath} "${fullPath}"`, (err, stdout, stderr) => {    if (err) {
      console.error("Error running Python script:", stderr);
      return res.status(500).json({ message: "Chord analysis failed" });
    }

    try {
      const feedback = JSON.parse(stdout);
      res.status(200).json({ feedback });
    } catch (e) {
      console.error("Invalid JSON from Python:", stdout);
      res.status(500).json({ message: "Invalid response from Python script" });
    }
  });
};
*/