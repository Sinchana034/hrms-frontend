import { useEffect, useState } from "react";
import { api } from "../lib/api";

const Interviews = () => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreateForm, setShowCreateForm] = useState(false);

  const [form, setForm] = useState({
    application_id: "",
    interview_type: "Technical",
    interviewer_name: "",
    interviewer_email: "",
    scheduled_at: "",
    duration_minutes: 60,
    meeting_link: "",
    notes: "",
  });

  const [creating, setCreating] = useState(false);

  // =========================================================
  // LOAD INTERVIEWS
  // =========================================================

  const loadInterviews = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await api.listInterviews();

      setInterviews(data || []);
    } catch (err) {
      console.error("Load interviews error:", err);

      setError(
        err.message || "Failed to load interviews."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInterviews();
  }, []);

  // =========================================================
  // FORM CHANGE
  // =========================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =========================================================
  // CREATE INTERVIEW
  // =========================================================

  const handleCreateInterview = async (event) => {
    event.preventDefault();

    if (!form.application_id.trim()) {
      setError("Application ID is required.");
      return;
    }

    try {
      setCreating(true);
      setError("");

      const payload = {
        application_id: form.application_id.trim(),
        interview_type: form.interview_type,
        interviewer_name:
          form.interviewer_name || null,
        interviewer_email:
          form.interviewer_email || null,
        scheduled_at:
          form.scheduled_at
            ? new Date(form.scheduled_at).toISOString()
            : null,
        duration_minutes:
          Number(form.duration_minutes),
        meeting_link:
          form.meeting_link || null,
        notes:
          form.notes || null,
      };

      await api.createInterview(payload);

      setForm({
        application_id: "",
        interview_type: "Technical",
        interviewer_name: "",
        interviewer_email: "",
        scheduled_at: "",
        duration_minutes: 60,
        meeting_link: "",
        notes: "",
      });

      setShowCreateForm(false);

      await loadInterviews();

    } catch (err) {
      console.error(
        "Create interview error:",
        err
      );

      setError(
        err.message ||
          "Failed to create interview."
      );
    } finally {
      setCreating(false);
    }
  };

  // =========================================================
  // CANCEL INTERVIEW
  // =========================================================

  const handleCancelInterview = async (interviewId) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this interview?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await api.cancelInterview(interviewId);

      await loadInterviews();

    } catch (err) {
      console.error(
        "Cancel interview error:",
        err
      );

      setError(
        err.message ||
          "Failed to cancel interview."
      );
    }
  };

  // =========================================================
  // STATUS STYLE
  // =========================================================

  const getStatusStyle = (status) => {
    switch (status) {
      case "Scheduled":
        return {
          backgroundColor: "#dbeafe",
          color: "#1d4ed8",
        };

      case "In Progress":
        return {
          backgroundColor: "#fef3c7",
          color: "#92400e",
        };

      case "Completed":
        return {
          backgroundColor: "#dcfce7",
          color: "#166534",
        };

      case "Cancelled":
        return {
          backgroundColor: "#fee2e2",
          color: "#991b1b",
        };

      default:
        return {
          backgroundColor: "#f1f5f9",
          color: "#475569",
        };
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div style={styles.center}>
        <p>Loading interviews...</p>
      </div>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div style={styles.container}>

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div style={styles.header}>

        <div>
          <h1 style={styles.title}>
            Interviews
          </h1>

          <p style={styles.subtitle}>
            Schedule and manage candidate interviews.
          </p>
        </div>

        <button
          style={styles.createButton}
          onClick={() =>
            setShowCreateForm(
              !showCreateForm
            )
          }
        >
          {showCreateForm
            ? "Close"
            : "+ Schedule Interview"}
        </button>

      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div style={styles.errorBox}>
          {error}
        </div>
      )}

      {/* =====================================================
          CREATE FORM
      ===================================================== */}

      {showCreateForm && (
        <div style={styles.formCard}>

          <h2 style={styles.formTitle}>
            Schedule Interview
          </h2>

          <form
            onSubmit={handleCreateInterview}
          >

            <div style={styles.formGrid}>

              {/* Application ID */}

              <div style={styles.field}>
                <label style={styles.label}>
                  Application ID *
                </label>

                <input
                  name="application_id"
                  value={
                    form.application_id
                  }
                  onChange={handleChange}
                  placeholder="Enter application ID"
                  style={styles.input}
                />
              </div>

              {/* Interview Type */}

              <div style={styles.field}>
                <label style={styles.label}>
                  Interview Type
                </label>

                <select
                  name="interview_type"
                  value={
                    form.interview_type
                  }
                  onChange={handleChange}
                  style={styles.input}
                >
                  <option value="Technical">
                    Technical
                  </option>

                  <option value="HR">
                    HR
                  </option>

                  <option value="Managerial">
                    Managerial
                  </option>

                  <option value="Final">
                    Final
                  </option>
                </select>
              </div>

              {/* Interviewer */}

              <div style={styles.field}>
                <label style={styles.label}>
                  Interviewer Name
                </label>

                <input
                  name="interviewer_name"
                  value={
                    form.interviewer_name
                  }
                  onChange={handleChange}
                  placeholder="Interviewer name"
                  style={styles.input}
                />
              </div>

              {/* Interviewer Email */}

              <div style={styles.field}>
                <label style={styles.label}>
                  Interviewer Email
                </label>

                <input
                  type="email"
                  name="interviewer_email"
                  value={
                    form.interviewer_email
                  }
                  onChange={handleChange}
                  placeholder="interviewer@example.com"
                  style={styles.input}
                />
              </div>

              {/* Date */}

              <div style={styles.field}>
                <label style={styles.label}>
                  Scheduled Date & Time
                </label>

                <input
                  type="datetime-local"
                  name="scheduled_at"
                  value={
                    form.scheduled_at
                  }
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>

              {/* Duration */}

              <div style={styles.field}>
                <label style={styles.label}>
                  Duration (minutes)
                </label>

                <input
                  type="number"
                  name="duration_minutes"
                  min="15"
                  max="480"
                  value={
                    form.duration_minutes
                  }
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>

              {/* Meeting Link */}

              <div style={styles.field}>
                <label style={styles.label}>
                  Meeting Link
                </label>

                <input
                  type="url"
                  name="meeting_link"
                  value={
                    form.meeting_link
                  }
                  onChange={handleChange}
                  placeholder="https://..."
                  style={styles.input}
                />
              </div>

              {/* Notes */}

              <div style={styles.field}>
                <label style={styles.label}>
                  Notes
                </label>

                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Interview notes..."
                  rows="3"
                  style={styles.textarea}
                />
              </div>

            </div>

            <div style={styles.formActions}>

              <button
                type="button"
                style={styles.cancelButton}
                onClick={() =>
                  setShowCreateForm(false)
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                style={styles.saveButton}
                disabled={creating}
              >
                {creating
                  ? "Scheduling..."
                  : "Schedule Interview"}
              </button>

            </div>

          </form>
        </div>
      )}

      {/* =====================================================
          EMPTY STATE
      ===================================================== */}

      {interviews.length === 0 && (
        <div style={styles.emptyBox}>

          <h2>
            No interviews scheduled
          </h2>

          <p>
            Schedule an interview for a candidate
            to see it here.
          </p>

        </div>
      )}

      {/* =====================================================
          INTERVIEW CARDS
      ===================================================== */}

      {interviews.map((interview) => {

        const statusStyle =
          getStatusStyle(
            interview.status
          );

        return (
          <div
            key={interview.interview_id}
            style={styles.card}
          >

            {/* Card Header */}

            <div style={styles.cardHeader}>

              <div>

                <h2 style={styles.cardTitle}>
                  {interview.interview_type}
                  {" "}
                  Interview
                </h2>

                <p style={styles.applicationId}>
                  Application ID:{" "}
                  {interview.application_id}
                </p>

              </div>

              <span
                style={{
                  ...styles.status,
                  ...statusStyle,
                }}
              >
                {interview.status}
              </span>

            </div>

            {/* Information */}

            <div style={styles.infoGrid}>

              <div>
                <div style={styles.infoLabel}>
                  Interviewer
                </div>

                <div style={styles.infoValue}>
                  {interview.interviewer_name ||
                    "Not assigned"}
                </div>
              </div>

              <div>
                <div style={styles.infoLabel}>
                  Interviewer Email
                </div>

                <div style={styles.infoValue}>
                  {interview.interviewer_email ||
                    "Not provided"}
                </div>
              </div>

              <div>
                <div style={styles.infoLabel}>
                  Scheduled
                </div>

                <div style={styles.infoValue}>
                  {interview.scheduled_at
                    ? new Date(
                        interview.scheduled_at
                      ).toLocaleString()
                    : "Not scheduled"}
                </div>
              </div>

              <div>
                <div style={styles.infoLabel}>
                  Duration
                </div>

                <div style={styles.infoValue}>
                  {interview.duration_minutes} minutes
                </div>
              </div>

            </div>

            {/* Meeting Link */}

            {interview.meeting_link && (
              <div style={styles.meetingBox}>

                <span>
                  Meeting:
                </span>

                <a
                  href={
                    interview.meeting_link
                  }
                  target="_blank"
                  rel="noreferrer"
                  style={styles.meetingLink}
                >
                  Open Meeting
                </a>

              </div>
            )}

            {/* Notes */}

            {interview.notes && (
              <div style={styles.notesBox}>

                <div style={styles.infoLabel}>
                  Notes
                </div>

                <p style={styles.notes}>
                  {interview.notes}
                </p>

              </div>
            )}

            {/* Actions */}

            <div style={styles.cardActions}>

              {interview.status !==
                "Cancelled" &&
                interview.status !==
                  "Completed" && (

                <button
                  style={styles.cancelInterviewButton}
                  onClick={() =>
                    handleCancelInterview(
                      interview.interview_id
                    )
                  }
                >
                  Cancel Interview
                </button>
              )}

            </div>

          </div>
        );
      })}

    </div>
  );
};


// =============================================================
// STYLES
// =============================================================

const styles = {

  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "32px",
    backgroundColor: "#f8fafc",
    minHeight: "100vh",
  },

  center: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  header: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "26px",
    marginBottom: "20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
  },

  title: {
    margin: 0,
    fontSize: "28px",
    color: "#1e293b",
  },

  subtitle: {
    marginTop: "7px",
    color: "#64748b",
  },

  createButton: {
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    padding: "12px 20px",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "14px",
  },

  errorBox: {
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    borderRadius: "8px",
    padding: "15px",
    marginBottom: "20px",
  },

  formCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "26px",
    marginBottom: "20px",
  },

  formTitle: {
    marginTop: 0,
    marginBottom: "20px",
    color: "#1e293b",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "18px",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
  },

  label: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#475569",
  },

  input: {
    border: "1px solid #cbd5e1",
    borderRadius: "7px",
    padding: "10px 12px",
    fontSize: "14px",
    outline: "none",
  },

  textarea: {
    border: "1px solid #cbd5e1",
    borderRadius: "7px",
    padding: "10px 12px",
    fontSize: "14px",
    resize: "vertical",
  },

  formActions: {
    marginTop: "22px",
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
  },

  cancelButton: {
    backgroundColor: "#ffffff",
    color: "#334155",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    padding: "10px 18px",
    cursor: "pointer",
    fontWeight: "600",
  },

  saveButton: {
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    padding: "10px 18px",
    cursor: "pointer",
    fontWeight: "600",
  },

  emptyBox: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "50px",
    textAlign: "center",
    color: "#64748b",
  },

  card: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "24px",
    marginBottom: "18px",
    boxShadow:
      "0 2px 5px rgba(0,0,0,0.04)",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
  },

  cardTitle: {
    margin: 0,
    fontSize: "20px",
    color: "#1e293b",
  },

  applicationId: {
    marginTop: "6px",
    color: "#64748b",
    fontSize: "13px",
    wordBreak: "break-all",
  },

  status: {
    padding: "6px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    gap: "20px",
    marginTop: "24px",
  },

  infoLabel: {
    fontSize: "12px",
    color: "#64748b",
    marginBottom: "5px",
  },

  infoValue: {
    fontSize: "14px",
    color: "#1e293b",
    fontWeight: "500",
    wordBreak: "break-word",
  },

  meetingBox: {
    marginTop: "20px",
    padding: "12px 15px",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },

  meetingLink: {
    color: "#2563eb",
    fontWeight: "600",
    textDecoration: "none",
  },

  notesBox: {
    marginTop: "20px",
    paddingTop: "18px",
    borderTop: "1px solid #e2e8f0",
  },

  notes: {
    margin: "5px 0 0",
    color: "#475569",
    fontSize: "14px",
  },

  cardActions: {
    marginTop: "20px",
    paddingTop: "18px",
    borderTop: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "flex-end",
  },

  cancelInterviewButton: {
    backgroundColor: "#dc2626",
    color: "#ffffff",
    border: "none",
    borderRadius: "7px",
    padding: "9px 15px",
    cursor: "pointer",
    fontWeight: "600",
  },
};

export default Interviews;