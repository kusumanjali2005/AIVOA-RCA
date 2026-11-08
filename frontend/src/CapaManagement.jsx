
import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";

export default function CAPAManagement() {
  const [investigations, setInvestigations] = useState([]);
  const [actions, setActions] = useState([]);
  const [form, setForm] = useState({
    investigation_id: "",
    action_type: "Corrective",
    description: "",
    owner: "",
    due_date: ""
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const cardStyle = {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "18px",
    marginBottom: "16px"
  };

  const fieldStyle = {
    width: "100%",
    padding: "11px",
    border: "1px solid #d1d5db",
    borderRadius: "7px",
    marginTop: "6px",
    marginBottom: "14px",
    boxSizing: "border-box",
    fontSize: "14px"
  };

  const buttonStyle = {
    padding: "10px 16px",
    background: "#4f46e5",
    color: "white",
    border: "none",
    borderRadius: "7px",
    cursor: "pointer",
    marginRight: "8px"
  };

  async function loadData() {
    try {
      const [investigationResponse, capaResponse] = await Promise.all([
        fetch(`${API}/api/investigations/`),
        fetch(`${API}/api/capa/`)
      ]);

      if (!investigationResponse.ok || !capaResponse.ok) {
        throw new Error("Could not load dashboard data.");
      }

      const investigationData = await investigationResponse.json();
      const capaData = await capaResponse.json();

      const investigationList = Array.isArray(investigationData)
        ? investigationData
        : investigationData.investigations ||
          investigationData.items ||
          [];

      setInvestigations(investigationList);
      setActions(capaData.actions || []);
    } catch (err) {
      setError(err.message || "Unable to load CAPA data.");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    });
  }

  async function createAction(event) {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API}/api/capa/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to create CAPA action.");
      }

      setMessage("CAPA action created successfully.");
      setForm({
        investigation_id: "",
        action_type: "Corrective",
        description: "",
        owner: "",
        due_date: ""
      });

      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id, status) {
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API}/api/capa/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not update CAPA status.");
      }

      setMessage("CAPA status updated.");
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteAction(id) {
    if (!window.confirm("Delete this CAPA action?")) return;

    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API}/api/capa/${id}`, {
        method: "DELETE"
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not delete CAPA action.");
      }

      setMessage("CAPA action deleted.");
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section style={{ marginTop: "30px" }}>
      <h2 style={{ marginBottom: "6px" }}>CAPA Management</h2>
      <p style={{ color: "#6b7280", marginTop: 0 }}>
        Create, assign, and track corrective and preventive actions.
      </p>

      <div style={cardStyle}>
        <h3>Create a CAPA Action</h3>

        <form onSubmit={createAction}>
          <label>Related Investigation</label>
          <select
            name="investigation_id"
            value={form.investigation_id}
            onChange={handleChange}
            required
            style={fieldStyle}
          >
            <option value="">Select an investigation</option>
            {investigations.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title || item.id}
              </option>
            ))}
          </select>

          <label>Action Type</label>
          <select
            name="action_type"
            value={form.action_type}
            onChange={handleChange}
            style={fieldStyle}
          >
            <option value="Corrective">Corrective Action</option>
            <option value="Preventive">Preventive Action</option>
          </select>

          <label>Action Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Describe the action to be performed..."
            required
            minLength={5}
            rows={3}
            style={fieldStyle}
          />

          <label>Assigned Owner / Team</label>
          <input
            name="owner"
            value={form.owner}
            onChange={handleChange}
            placeholder="e.g. Quality Assurance Team"
            required
            minLength={2}
            style={fieldStyle}
          />

          <label>Due Date</label>
          <input
            type="date"
            name="due_date"
            value={form.due_date}
            onChange={handleChange}
            required
            style={fieldStyle}
          />

          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? "Creating..." : "Create CAPA"}
          </button>
        </form>

        {message && (
          <p style={{ color: "green" }}>{message}</p>
        )}
        {error && (
          <p style={{ color: "red" }}>{error}</p>
        )}
      </div>

      <div style={cardStyle}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px"
        }}>
          <h3>CAPA Action Tracker ({actions.length})</h3>
          <button onClick={loadData} style={buttonStyle}>
            Refresh
          </button>
        </div>

        {actions.length === 0 ? (
          <p style={{ color: "#6b7280" }}>
            No CAPA actions created yet.
          </p>
        ) : (
          actions.map((action) => (
            <div
              key={action.id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "9px",
                padding: "14px",
                marginTop: "12px"
              }}
            >
              <strong>{action.action_type} Action</strong>
              <p>{action.description}</p>
              <p><strong>Owner:</strong> {action.owner}</p>
              <p><strong>Due date:</strong> {action.due_date}</p>
              <p>
                <strong>Investigation:</strong>{" "}
                {investigations.find(
                  (item) => item.id === action.investigation_id
                )?.title || action.investigation_id}
              </p>

              <label>Progress: </label>
              <select
                value={action.status}
                onChange={(event) =>
                  updateStatus(action.id, event.target.value)
                }
                style={{ ...fieldStyle, width: "auto", minWidth: "150px" }}
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>

              <button
                onClick={() => deleteAction(action.id)}
                style={{
                  ...buttonStyle,
                  background: "#dc2626"
                }}
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
