
import { useState } from "react";
import "./App.css";

function App() {
  const [resume, setResume] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleResumeChange = (event) => {
    const selectedFile = event.target.files?.[0];

    if (selectedFile) {
      const allowedExtensions = /\.(pdf|doc|docx)$/i;

      if (!allowedExtensions.test(selectedFile.name)) {
        setResume(null);
        setError("Please upload a PDF, DOC, or DOCX file.");
        return;
      }

      setResume(selectedFile);
      setAnalysis(null);
      setError("");
    }
  };

  const handleUpload = async () => {
    if (!resume) {
      setError("Please select your resume first.");
      return;
    }

    if (!jobDescription.trim()) {
      setError("Please paste the job description first.");
      return;
    }

    setIsLoading(true);
    setError("");
    setAnalysis(null);

    const formData = new FormData();
    formData.append("resume", resume);
    formData.append("jobDescription", jobDescription.trim());

    // Local development uses the Express backend on port 5001.
    // Production uses the VITE_API_URL environment variable.
    const apiBaseUrl =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:5001"
    : "https://ai-resume-analyzer-server-beta.vercel.app";
       import.meta.env.VITE_API_URL;

    if (!apiBaseUrl) {
      setError(
        "Backend URL is missing. Set VITE_API_URL in your frontend environment."
      );
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${apiBaseUrl.replace(/\/+$/, "")}/api/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      // Read the response as text first to avoid JSON parsing errors
      // when the backend returns an empty or non-JSON response.
      const responseText = await response.text();

      let data;

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error(
          `The backend returned an invalid response (HTTP ${response.status}). Check the backend URL and server logs.`
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message || `Request failed with HTTP ${response.status}.`
        );
      }

      if (!data.analysis) {
        throw new Error(
          data.message || "The backend did not return resume analysis."
        );
      }

      setAnalysis(data.analysis);
    } catch (uploadError) {
      console.error("Resume analysis error:", uploadError);
      setError(
        uploadError.message ||
          "Unable to analyze the resume. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const matchedKeywords = analysis?.matchedKeywords ?? [];
  const missingKeywords = analysis?.missingKeywords ?? [];
  const strengths = analysis?.strengths ?? [];
  const suggestions = analysis?.suggestions ?? [];

  return (
    <div className="app">
      <header className="header">
        <h1>AI Resume Analyzer</h1>
        <p>Analyze your resume against any job description</p>
      </header>

      <main className="container">
        <section className="card">
          <h2>Upload Your Resume</h2>

          <div className="upload-box">
            <div className="upload-icon">📄</div>

            <p>
              {resume
                ? `Selected: ${resume.name}`
                : "Choose your resume"}
            </p>

            <span>Supported formats: PDF, DOC, DOCX</span>

            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleResumeChange}
            />
          </div>
        </section>

        <section className="card">
          <h2>Job Description</h2>

          <textarea
            placeholder="Paste the complete job description here..."
            rows={10}
            value={jobDescription}
            onChange={(event) => {
              setJobDescription(event.target.value);
              setError("");
            }}
          />

          <p className="helper-text">
            Tip: Include the job responsibilities, required skills, and
            qualifications for a more useful comparison.
          </p>
        </section>

        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        <button
          className="analyze-btn"
          onClick={handleUpload}
          disabled={isLoading}
        >
          {isLoading ? "Analyzing Resume..." : "Analyze Resume"}
        </button>

        {isLoading && (
          <p className="loading-message">
            Please wait while your resume is being analyzed.
          </p>
        )}

        {analysis && (
          <section className="card result-card">
            <h2>Resume Analysis Results</h2>

            <div className="score-row">
              <span className="score-label">Resume Match Score</span>
              <strong className="score-value">
                {Number.isFinite(Number(analysis.score))
                  ? `${analysis.score}%`
                  : "N/A"}
              </strong>
            </div>

            <p className="summary">
              {analysis.summary || "Analysis completed."}
            </p>

            <div className="keyword-section">
              <h3>Matched Keywords</h3>

              <div className="keyword-list">
                {matchedKeywords.length > 0 ? (
                  matchedKeywords.map((keyword, index) => (
                    <span
                      key={`${keyword}-${index}`}
                      className="keyword match"
                    >
                      {keyword}
                    </span>
                  ))
                ) : (
                  <span className="keyword empty">
                    No direct keyword matches found.
                  </span>
                )}
              </div>
            </div>

            <div className="keyword-section">
              <h3>Missing Keywords</h3>

              <div className="keyword-list">
                {missingKeywords.length > 0 ? (
                  missingKeywords.map((keyword, index) => (
                    <span
                      key={`${keyword}-${index}`}
                      className="keyword missing"
                    >
                      {keyword}
                    </span>
                  ))
                ) : (
                  <span className="keyword empty">
                    No missing keywords were identified.
                  </span>
                )}
              </div>
            </div>

            <div className="keyword-section">
              <h3>Resume Strengths</h3>

              {strengths.length > 0 ? (
                <ul className="analysis-list">
                  {strengths.map((strength, index) => (
                    <li key={`${strength}-${index}`}>{strength}</li>
                  ))}
                </ul>
              ) : (
                <p>No strengths were returned by the backend.</p>
              )}
            </div>

            <div className="keyword-section">
              <h3>Suggestions for Improvement</h3>

              {suggestions.length > 0 ? (
                <ul className="analysis-list">
                  {suggestions.map((suggestion, index) => (
                    <li key={`${suggestion}-${index}`}>{suggestion}</li>
                  ))}
                </ul>
              ) : (
                <p>No improvement suggestions were returned.</p>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
