
import { useState, useEffect } from "react";
import PdfUpload from "./PdfUpload";
import CAPAManagement from "./CapaManagement";
import {
  Activity, AlertTriangle, ArrowUpRight, Bell,
  CheckCircle2, ChevronDown, ClipboardList,
  FileSearch, FlaskConical, LayoutDashboard,
  Plus, Search, Settings, ShieldCheck, Sparkles, Users
} from "lucide-react";

const API = "http://127.0.0.1:8000/api/investigations/";

function App() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    severity: "Medium",
    source: "Manual"
  });

  const [investigations, setInvestigations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const fetchInvestigations = async () => {
    try {
      const response = await fetch(API);
      if (!response.ok) throw new Error("Could not load investigations");
      const data = await response.json();
      setInvestigations(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchInvestigations();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Submission failed");
      }

      setResult(data);

      setFormData({
        title: "",
        description: "",
        severity: "Medium",
        source: "Manual"
      });

      await fetchInvestigations();

      document.getElementById("analysis-result")?.scrollIntoView({
        behavior: "smooth"
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      label: "Total Investigations",
      value: investigations.length,
      icon: ClipboardList
    },
    {
      label: "Open Investigations",
      value: investigations.filter(
        item => item.status === "Received" ||
                item.status === "Processing"
      ).length,
      icon: Activity
    },
    {
      label: "Analysis Unavailable",
      value: investigations.filter(
        item => item.status === "Analysis Unavailable"
      ).length,
      icon: AlertTriangle
    },
    {
      label: "Analysis Completed",
      value: investigations.filter(
        item => item.status === "Analysis Completed"
      ).length,
      icon: CheckCircle2
    }
  ];

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-IN");
  };

  const renderList = (items) => {
    if (!Array.isArray(items) || items.length === 0) {
      return <p>No recommendations available.</p>;
    }

    return (
      <ul>
        {items.map((item, index) => (
          <li key={index}>
            {typeof item === "string" ? item : JSON.stringify(item)}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon"><ShieldCheck size={25} /></div>
          <div>
            <h2>AIVOA<span>.AI</span></h2>
            <p>QUALITY INTELLIGENCE</p>
          </div>
        </div>

        <div className="workspace">
          <span className="workspace-label">WORKSPACE</span>
          <button className="workspace-button">
            <FlaskConical size={17} />
            Pharmaceutical QA
            <ChevronDown size={15} />
          </button>
        </div>

        <span className="nav-label">MAIN MENU</span>

        <nav className="navigation">
          <a className="nav-item active" href="#">
            <LayoutDashboard size={19} /> Dashboard
          </a>
          <a className="nav-item" href="#history">
            <FileSearch size={19} /> Investigations
          </a>
          <a className="nav-item" href="#analysis-result">
            <ClipboardList size={19} /> CAPA Management
          </a>
          <a className="nav-item" href="#">
            <Users size={19} /> Team & Review
          </a>
        </nav>

        <div className="sidebar-bottom">
          <a className="nav-item" href="#">
            <Settings size={19} /> Settings
          </a>
          <div className="user-profile">
            <div className="avatar">QA</div>
            <div>
              <strong>Quality Admin</strong>
              <span>Quality Assurance</span>
            </div>
            <ChevronDown size={16} />
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span> Dashboard
          </div>
          <div className="topbar-actions">
            <div className="system-status">
              <span className="status-dot"></span>
              System operational
            </div>
            <button className="icon-button" aria-label="Search">
              <Search size={19} />
            </button>
            <button className="icon-button" aria-label="Notifications">
              <Bell size={19} />
            </button>
          </div>
        </header>

        <section className="page-content">
          <div className="welcome-row">
            <div>
              <p className="eyebrow">QUALITY MANAGEMENT OVERVIEW</p>
              <h1>Investigation Dashboard</h1>
              <p className="subtitle">
                Monitor quality incidents and manage AI-assisted investigations.
              </p>
            </div>
            <button
              className="primary-button"
              onClick={() =>
                document.getElementById("incident-input")?.scrollIntoView({
                  behavior: "smooth"
                })
              }
            >
              <Plus size={18} /> New Investigation
            </button>
          </div>

          <div className="stats-grid">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div className="stat-card" key={stat.label}>
                  <div className="stat-top">
                    <span>{stat.label}</span>
                    <div className="stat-icon"><Icon size={19} /></div>
                  </div>
                  <h2>{stat.value}</h2>
                  <p>Live database count</p>
                </div>
              );
            })}
          </div>

          <section className="ai-banner">
            <div className="ai-banner-content">
              <div className="ai-label">
                <Sparkles size={16} /> AI-POWERED INVESTIGATION
              </div>
              <h2>Investigate smarter with AI</h2>
              <p>
                Submit pharmaceutical quality incidents and receive
                preliminary root-cause hypotheses and CAPA suggestions.
              </p>
              <button
                className="banner-button"
                onClick={() =>
                  document.getElementById("incident-input")?.scrollIntoView({
                    behavior: "smooth"
                  })
                }
              >
                Start an investigation <ArrowUpRight size={17} />
              </button>
            </div>
            <div className="ai-banner-art">
              <div className="ai-orbit orbit-one"></div>
              <div className="ai-orbit orbit-two"></div>
              <div className="ai-center"><Sparkles size={43} /></div>
            </div>
          </section>

          <div className="section-heading" id="history">
            <div>
              <h2>Investigation History</h2>
              <p>Records retrieved from your database.</p>
            </div>
            <button className="text-button" onClick={fetchInvestigations}>
              Refresh <ArrowUpRight size={16} />
            </button>
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>INVESTIGATION ID</th>
                  <th>INCIDENT</th>
                  <th>DATE</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {fetching ? (
                  <tr><td colSpan="4">Loading investigations...</td></tr>
                ) : investigations.length === 0 ? (
                  <tr><td colSpan="4">No investigations found.</td></tr>
                ) : (
                  investigations.map((item) => (
                    <tr key={item.investigation_id}>
                      <td className="id-cell">
                        {item.investigation_id.slice(0, 8)}
                      </td>
                      <td className="incident-cell">{item.title}</td>
                      <td>{formatDate(item.created_at)}</td>
                      <td>
                        <span className="status-badge info">
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <section className="upload-section" id="incident-input">
            <div className="section-heading">
              <div>
                <h2>New Quality Investigation</h2>
                <p>Enter incident details for AI-assisted analysis.</p>
              </div>
            </div>

            <form className="investigation-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="title">Incident Title</label>
                <input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Production Batch Failure"
                  minLength={3}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Incident Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the incident, observations and deviations..."
                  rows={6}
                  minLength={10}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="severity">Severity Level</label>
                <select
                  id="severity"
                  name="severity"
                  value={formData.severity}
                  onChange={handleChange}
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Critical</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="source">Investigation Source</label>
                <select
                  id="source"
                  name="source"
                  value={formData.source}
                  onChange={handleChange}
                >
                  <option value="Manual">Manual Entry</option>
                  <option value="Incident Report">Incident Report</option>
                  <option value="Quality Audit">Quality Audit</option>
                  <option value="Customer Complaint">Customer Complaint</option>
                </select>
              </div>

              <button className="primary-button" type="submit" disabled={loading}>
                {loading ? "AI is analyzing..." : "Submit & Analyze Incident"}
              </button>
            </form>

            {error && <p className="form-error">{error}</p>}
          </section>

          <PdfUpload
  onSuccess={(data) => {
    setResult(data);
    fetchInvestigations();
  }}
/>

          {result && (
            <section className="upload-section" id="analysis-result">
              <div className="section-heading">
                <div>
                  <h2>Investigation Analysis</h2>
                  <p>{result.title}</p>
                </div>
              </div>

              <div className="form-success">
                <h3>{result.message}</h3>
                <p><strong>Investigation ID:</strong> {result.investigation_id}</p>
                <p><strong>Status:</strong> {result.status}</p>
                <a
  href={`${API}${result.investigation_id}/report`}
  className="primary-button"
  style={{
    display: "inline-flex",
    textDecoration: "none",
    marginTop: "15px"
  }}
  target="_blank"
  rel="noreferrer"
>
  Download RCA Report (PDF)
</a>
              </div>

              {result.analysis ? (
                <div className="investigation-form">
                  <h3>Incident Summary</h3>
                  <p>{result.analysis.summary}</p>

                  <h3>Potential Root Causes</h3>
                  {Array.isArray(result.analysis.potential_root_causes) &&
                    result.analysis.potential_root_causes.map((cause, index) => (
                      <div key={index}>
                        <h4>{index + 1}. {cause.cause}</h4>
                        <p>{cause.rationale}</p>
                        <strong>Evidence to check</strong>
                        {renderList(cause.evidence_to_check)}
                      </div>
                    ))}

                  <h3>Immediate Containment</h3>
                  {renderList(result.analysis.immediate_containment)}

                  <h3>Corrective Actions</h3>
                  {renderList(result.analysis.corrective_actions)}

                  <h3>Preventive Actions</h3>
                  {renderList(result.analysis.preventive_actions)}

                  <h3>Missing Information</h3>
                  {renderList(result.analysis.missing_information)}

                  <h3>QA Review</h3>
                  <p>{result.analysis.qa_review_note}</p>

                  <p>
                    <strong>Important:</strong> AI suggestions are preliminary
                    hypotheses and require qualified QA review and verification.
                  </p>
                </div>
              ) : (
                <p className="form-error">
                  AI analysis is unavailable. {result.analysis_error}
                </p>
              )}
            </section>
          )}
          <CAPAManagement />

          <footer>
            AIVOA.AI - AI-assisted quality investigation platform
            <span>Version 1.0</span>
          </footer>
        </section>
      </main>
    </div>
  );
}

export default App;
