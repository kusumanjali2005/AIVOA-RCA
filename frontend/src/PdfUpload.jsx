
import { useState } from "react";

const API = "http://127.0.0.1:8000/api/investigations/upload-pdf/";

export default function PdfUpload({ onSuccess }) {
  const [file, setFile] = useState(null);
  const [severity, setSeverity] = useState("Medium");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function handleUpload(e) {
    e.preventDefault();

    if (!file) {
      setError("Please select a PDF file.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("severity", severity);

    try {
      const response = await fetch(API, {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "PDF upload failed.");
      }

      setResult(data);

      if (onSuccess) {
        onSuccess(data);
      }
    } catch (err) {
      setError(err.message || "Unable to upload PDF.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="investigation-form" style={{ marginTop: 24 }}>
      <h2>Upload Investigation PDF</h2>
      <p>Upload a pharmaceutical quality report for AI-assisted RCA.</p>

      <form onSubmit={handleUpload}>
        <div className="form-group">
          <label>Select PDF Document</label>
          <input
            type="file"
            accept=".pdf,application/pdf"
            onChange={(e) => {
              setFile(e.target.files?.[0] || null);
              setResult(null);
              setError("");
            }}
          />
        </div>

        <div className="form-group">
          <label>Severity</label>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>

        <button type="submit" disabled={loading || !file}>
          {loading ? "Extracting and analyzing..." : "Upload and Analyze PDF"}
        </button>
      </form>

      {error && <p className="form-error">{error}</p>}

      {result && (
        <div className="form-success">
          <h3>PDF Analysis Submitted Successfully</h3>
          <p><strong>Investigation:</strong> {result.title}</p>
          <p><strong>Status:</strong> {result.status}</p>
          <p><strong>ID:</strong> {result.investigation_id}</p>

          {result.analysis?.summary && (
            <>
              <h4>AI Analysis</h4>
              <p>{result.analysis.summary}</p>
            </>
          )}

          {result.analysis_error && (
            <p>{result.analysis_error}</p>
          )}
        </div>
      )}
    </section>
  );
}
