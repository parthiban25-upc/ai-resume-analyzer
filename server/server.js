const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { PDFParse } = require("pdf-parse");
const mammoth = require("mammoth");
require("dotenv").config();

const app = express();
const clientDistPath = path.join(__dirname, "..", "client", "dist");

app.use(cors());
app.use(express.json());
app.use(express.static(clientDistPath));

const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, callback) => {
    const allowedTypes = [".pdf", ".doc", ".docx"];
    const fileExtension = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf("."));
    const isAllowed = allowedTypes.includes(fileExtension);

    if (!isAllowed) {
      callback(new Error("Only PDF and DOC/DOCX resume files are allowed."));
      return;
    }

    callback(null, true);
  },
});

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "for", "to", "of", "in", "on", "with",
  "at", "by", "from", "as", "is", "it", "be", "are", "was", "were", "this", "that",
  "these", "those", "we", "you", "your", "our", "their", "they", "he", "she", "his",
  "her", "i", "me", "my", "mine", "us", "have", "has", "had", "will", "would", "should",
  "can", "could", "may", "might", "about", "into", "over", "under", "after", "before",
  "than", "then", "also", "more", "most", "some", "any", "all", "not", "no", "yes",
  "through", "between", "during", "using", "used", "work", "working", "experience",
  "skills", "skill", "team", "strong", "background", "job", "role"
]);

function normalizeWords(text = "") {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);
}

function extractKeywords(text = "") {
  return [...new Set(
    normalizeWords(text).filter((word) => !STOP_WORDS.has(word) && word.length > 2)
  )];
}

function calculateMatchScore(resumeText = "", jobDescription = "") {
  const jobKeywords = extractKeywords(jobDescription);
  const resumeKeywords = extractKeywords(resumeText);

  if (!jobKeywords.length) {
    return {
      score: 0,
      matchedKeywords: [],
      missingKeywords: [],
      summary: "Add a job description to receive a match score.",
    };
  }

  const matchedKeywords = [...new Set(jobKeywords.filter((keyword) => resumeKeywords.includes(keyword)))];
  const missingKeywords = jobKeywords.filter((keyword) => !resumeKeywords.includes(keyword));
  const score = Math.min(100, Math.max(0, Math.round((matchedKeywords.length / jobKeywords.length) * 100)));

  let summary = "Your resume has a moderate fit for this role.";
  if (score >= 80) summary = "Strong match: your resume aligns well with the role.";
  else if (score >= 60) summary = "Good match: a few missing keywords could improve your fit.";
  else if (score >= 40) summary = "Partial match: the resume covers some of the role requirements.";
  else if (score > 0) summary = "Low match: the resume is missing several role requirements.";

  return {
    score,
    matchedKeywords,
    missingKeywords,
    summary,
  };
}

async function extractTextFromFile(filePath, fileName) {
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf("."));

  if (extension === ".pdf") {
    const pdfBuffer = fs.readFileSync(filePath);
    const parser = new PDFParse({ data: pdfBuffer });
    const pdfData = await parser.getText();
    return pdfData.text || "";
  }

  if (extension === ".docx" || extension === ".doc") {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value || "";
  }

  throw new Error("Unsupported file type. Please upload a PDF or DOCX document.");
}

app.get("/", (req, res) => {
  const indexPath = path.join(clientDistPath, "index.html");

  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }

  return res.json({
    message: "AI Resume Analyzer API is running",
  });
});

app.post("/api/upload", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Please upload a resume file.",
      });
    }

    const resumeText = await extractTextFromFile(req.file.path, req.file.originalname);
    const jobDescription = typeof req.body.jobDescription === "string" ? req.body.jobDescription : "";
    const analysis = calculateMatchScore(resumeText, jobDescription);

    return res.json({
      message: "Resume uploaded and analyzed successfully.",
      fileName: req.file.originalname,
      resumeText,
      analysis,
    });
  } catch (error) {
    console.error("Resume processing error:", error);

    return res.status(500).json({
      message: error.message || "Failed to extract resume text.",
    });
  }
});

const PORT = process.env.PORT || 5001;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = {
  app,
  calculateMatchScore,
  extractTextFromFile,
};