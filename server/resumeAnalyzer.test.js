const test = require("node:test");
const assert = require("node:assert/strict");
const { calculateMatchScore } = require("./server.js");

test("calculates a meaningful resume to job match score", () => {
  const resumeText = "Experienced React developer with Node.js API work and SQL database experience.";
  const jobDescription = "We are hiring a React engineer with Node.js and SQL skills.";

  const result = calculateMatchScore(resumeText, jobDescription);

  assert.ok(result.score >= 0 && result.score <= 100);
  assert.ok(result.matchedKeywords.includes("react"));
  assert.ok(result.matchedKeywords.includes("node"));
  assert.ok(result.matchedKeywords.includes("sql"));
  assert.ok(Array.isArray(result.missingKeywords));
});
