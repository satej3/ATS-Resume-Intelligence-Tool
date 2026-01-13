const { parseResume } = require("../services/resumeParser.service");
const { performATSAnalysis } = require("../services/ats.engine");

async function analyzeResume(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Resume file is required",
      });
    }

    if (!req.body.jobDescription) {
      return res.status(400).json({
        success: false,
        message: "Job description is required",
      });
    }

    const resumeText = await parseResume(req.file);
    const { jobDescription } = req.body;

    // Use advanced NLP-based ATS engine
    const result = performATSAnalysis(resumeText, jobDescription);

    res.json({ success: true, analysis: result });
  } catch (err) {
    console.error('ATS Analysis Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// Test endpoint for direct JSON input (for testing purposes)
async function testAnalyze(req, res) {
  try {
    const { resumeText, jobDescription } = req.body;

    if (!resumeText) {
      return res.status(400).json({
        success: false,
        message: "Resume text is required",
      });
    }

    if (!jobDescription) {
      return res.status(400).json({
        success: false,
        message: "Job description is required",
      });
    }

    // Use advanced NLP-based ATS engine
    const result = performATSAnalysis(resumeText, jobDescription);

    res.json({ success: true, analysis: result });
  } catch (err) {
    console.error("Error in testAnalyze:", err);
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { analyzeResume, testAnalyze };
