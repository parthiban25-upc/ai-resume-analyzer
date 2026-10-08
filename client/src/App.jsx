import { useState } from "react";
import "./App.css";

function App() {
  const [resume, setResume] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleResumeChange = (event) => {
    const selectedFile = event.target.files[0];

    if (selectedFile) {
      setResume(selectedFile);
      setError("");
    }
  };

  const handleUpload = async () => {
    if (!resume) {
      setError("Please select a resume first.");
      return;
    }

    if (!jobDescription.trim()) {
      setError("Please paste a job description to compare against your resume.");
      return;
    }

    setIsLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("resume", resume);
    formData.append("jobDescription", jobDescription);

    try {
     const response = await fetch(
  "https://ai-resume-analyzer-server-beta.vercel.app/api/upload",
  {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to analyze the resume.");
      }

      setAnalysis(data.analysis);
    } catch (uploadError) {
      console.error("Upload error:", uploadError);
      setAnalysis(null);
      setError(uploadError.message || "Failed to upload resume.");
    } finally {
      setIsLoading(false);
    }
  };

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
              {resume ? `Selected: ${resume.name}` : "Upload your resume"}
            </p>

            <span>PDF or DOCX</span>

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
            placeholder="Paste the job description here..."
            rows="10"
            value={jobDescription}
            onChange={(event) => setJobDescription(event.target.value)}
          ></textarea>
        </section>

        {error && <p className="error-message">{error}</p>}

        <button
          className="analyze-btn"
          onClick={handleUpload}
          disabled={isLoading}
        >
          {isLoading ? "Analyzing..." : "Analyze Resume"}
        </button>

        {analysis && (
          <section className="card result-card">
            <h2>Resume Match</h2>
            <div className="score-row">
              <span className="score-label">Match Score</span>
              <strong className="score-value">{analysis.score}%</strong>
            </div>
            <p className="summary">{analysis.summary}</p>

            <div className="keyword-section">
              <h3>Matched Keywords</h3>
              <div className="keyword-list">
                {analysis.matchedKeywords.length > 0 ? (
                  analysis.matchedKeywords.map((keyword) => (
                    <span key={keyword} className="keyword match">
                      {keyword}
                    </span>
                  ))
                ) : (
                  <span className="keyword empty">No direct keyword matches yet.</span>
                )}
              </div>
            </div>

            <div className="keyword-section">
              <h3>Missing Keywords</h3>
              <div className="keyword-list">
                {analysis.missingKeywords.length > 0 ? (
                  analysis.missingKeywords.map((keyword) => (
                    <span key={keyword} className="keyword missing">
                      {keyword}
                    </span>
                  ))
                ) : (
                  <span className="keyword empty">Everything important is covered.</span>
                )}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;