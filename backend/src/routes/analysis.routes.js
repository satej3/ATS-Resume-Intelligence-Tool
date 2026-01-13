const express = require("express");
const multer = require("multer");
const { analyzeResume, testAnalyze } = require("../controllers/analysis.controller");

const router = express.Router();
const upload = multer();

router.post("/analyze", upload.single("resume"), analyzeResume);
router.post("/test", testAnalyze); // Test endpoint for JSON input

module.exports = router;
