import { useEffect, useState } from "react";
import { api } from "../lib/api";
import StatusPill from "../components/StatusPill";

const STATUS_TABS = [
  "All",
  "Application Received",
  "Under Review",
  "Withdrawn",
];

export default function Applications() {
  const [apps, setApps] = useState([]);
  const [tab, setTab] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [resumeLoadingId, setResumeLoadingId] = useState(null);

  // Evaluation states
  const [evaluationLoadingId, setEvaluationLoadingId] = useState(null);
  const [evaluations, setEvaluations] = useState({});
  const [evaluationError, setEvaluationError] = useState(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        const params = tab === "All" ? {} : { status: tab };
        const data = await api.listApplications(params);

        setApps(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [tab]);

  // ---------------------------------------------------------
  // Withdraw application
  // ---------------------------------------------------------

  async function handleWithdraw(id) {
    const reason =
      window.prompt("Reason for withdrawal (optional):") || undefined;

    try {
      await api.withdrawApplication(id, reason);

      setApps((prev) =>
        prev.map((a) =>
          a.application_id === id
            ? {
                ...a,
                current_status: "Withdrawn",
              }
            : a
        )
      );
    } catch (e) {
      window.alert(e.message);
    }
  }

  // ---------------------------------------------------------
  // View resume
  // ---------------------------------------------------------

  async function handleViewResume(id) {
    setResumeLoadingId(id);

    try {
      const { url } = await api.getResumeUrl(id);

      window.open(
        url,
        "_blank",
        "noopener,noreferrer"
      );
    } catch (e) {
      window.alert(e.message);
    } finally {
      setResumeLoadingId(null);
    }
  }

  // ---------------------------------------------------------
  // Evaluate application
  // ---------------------------------------------------------

  async function handleEvaluate(application) {
  const id = application.application_id;

  // Show this candidate in the evaluation card
  setSelectedApplication(application);
  setSelectedApplicationId(id);

  setEvaluationLoadingId(id);
  setEvaluationError(null);

  try {
    const result = await api.evaluateApplication(id);

    setEvaluations((prev) => ({
      ...prev,
      [id]: result,
    }));
  } catch (e) {
    setEvaluationError(e.message);
  } finally {
    setEvaluationLoadingId(null);
  }
}

  // ---------------------------------------------------------
  // Render
  // ---------------------------------------------------------
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-display font-semibold text-ink">
        Applications
      </h1>

      

      <div className="mt-5 flex gap-1 border-b border-line">
        {STATUS_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t
                ? "border-accent text-accent"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* General error */}
      {error && (
        <div className="mt-4 rounded-lg border border-bad/30 bg-bad/5 px-4 py-3 text-sm text-bad">
          {error}
        </div>
      )}

      {/* Evaluation error */}
      {evaluationError && (
        <div className="mt-4 rounded-lg border border-bad/30 bg-bad/5 px-4 py-3 text-sm text-bad">
          Evaluation failed: {evaluationError}
        </div>
      )}

      <div className="mt-4 bg-white border border-line rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-canvas text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Candidate</th>
              <th className="px-4 py-3">Position</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Applied</th>
              <th className="px-4 py-3">Evaluation</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>

          <tbody>
            {/* Loading */}
            {loading && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-6 text-center text-muted"
                >
                  Loading…
                </td>
              </tr>
            )}

            {/* Empty */}
            {!loading && apps.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-6 text-center text-muted"
                >
                  No applications in this view yet.
                </td>
              </tr>
            )}

            {/* Applications */}
            {apps.map((a) => {
              const evaluation =
                evaluations[a.application_id];

              const isEvaluating =
                evaluationLoadingId ===
                a.application_id;

              return (
                <tr
                  key={a.application_id}
                  className="border-t border-line"
                >
                  {/* Candidate */}
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink flex items-center gap-1.5">
                      {a.candidate_name}

                      {a.has_potential_duplicates && (
                        <span
                          title="Potential duplicate — see Duplicates page"
                          className="text-[10px] px-1.5 py-0.5 rounded bg-warn/10 text-warn font-medium"
                        >
                          Dup?
                        </span>
                      )}

                      {a.email_bounced && (
                        <span
                          title={
                            a.email_bounce_reason ||
                            "Email bounced"
                          }
                          className="text-[10px] px-1.5 py-0.5 rounded bg-bad/10 text-bad font-medium"
                        >
                          Bounced
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-muted">
                      {a.email}
                    </div>
                  </td>

                  {/* Position */}
                  <td className="px-4 py-3">
                    {a.position}
                  </td>

                  {/* Department */}
                  <td className="px-4 py-3">
                    {a.department}
                  </td>

                  {/* Source */}
                  <td className="px-4 py-3 text-muted">
                    {a.source}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <StatusPill
                      status={a.current_status}
                    />
                  </td>

                  {/* Applied */}
                  <td className="px-4 py-3 text-muted">
                    {new Date(
                      a.application_date
                    ).toLocaleDateString()}
                  </td>

                  {/* Evaluation */}
                  <td>
                    
                    <button
                      onClick={() => handleEvaluate(a)}
                      disabled={evaluationLoadingId === a.application_id}
                      className="px-3 py-1.5 rounded-md bg-accent text-white text-xs font-medium hover:opacity-90 disabled:opacity-50"
                    >
                      {evaluationLoadingId === a.application_id
                        ? "Evaluating..."
                        : "Evaluate"}
                    </button>
                  </td>
                 
                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-3">
                      {a.resume_url && (
                        <button
                          onClick={() =>
                            handleViewResume(
                              a.application_id
                            )
                          }
                          disabled={
                            resumeLoadingId ===
                            a.application_id
                          }
                          className="text-xs text-accent hover:underline disabled:opacity-50"
                        >
                          {resumeLoadingId ===
                          a.application_id
                            ? "Opening…"
                            : "View resume"}
                        </button>
                      )}

                      {a.current_status !==
                        "Withdrawn" && (
                        <button
                          onClick={() =>
                            handleWithdraw(
                              a.application_id
                            )
                          }
                          className="text-xs text-bad hover:underline"
                        >
                          Withdraw
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Evaluation details */}
      {selectedApplicationId &&
        evaluations[selectedApplicationId] && (
          <EvaluationCard
            evaluation={evaluations[selectedApplicationId]}
            application={apps.find(
              (a) => a.application_id === selectedApplicationId
            )}
          />
      )}
    </div>
  );
}


// ============================================================
// Evaluation Card
// ============================================================

function EvaluationCard({ evaluation,application}) {
  return (
    <div className="mt-6 bg-white border border-line rounded-lg p-6">
      <h2 className="text-lg font-display font-semibold text-ink">
        Application Evaluation
      </h2>

      {application && (
      <div className="mt-2">
        <h3 className="text-base font-semibold text-ink">
          {application.candidate_name}
        </h3>

        <p className="text-sm text-muted">
          {application.position} · {application.department}
        </p>
      </div>
    )}
      

      {/* Score */}
      <div className="mt-4">
        <div className="text-xs uppercase tracking-wide text-muted">
          Matching Score
        </div>

        <div className="mt-1 text-4xl font-display font-semibold text-accent">
          {evaluation.matching_score}%
        </div>
      </div>

      {/* Matched skills */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-ink">
          Matching Skills
        </h3>

        <div className="mt-2 flex flex-wrap gap-2">
          {evaluation.matching_skills?.length ? (
            evaluation.matching_skills.map(
              (skill) => (
                <span
                  key={skill}
                  className="px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs"
                >
                  ✓ {skill}
                </span>
              )
            )
          ) : (
            <span className="text-xs text-muted">
              No matching skills
            </span>
          )}
        </div>
      </div>

      {/* Missing skills */}
      <div className="mt-5">
        <h3 className="text-sm font-semibold text-ink">
          Missing Skills
        </h3>

        <div className="mt-2 flex flex-wrap gap-2">
          {evaluation.missing_skills?.length ? (
            evaluation.missing_skills.map(
              (skill) => (
                <span
                  key={skill}
                  className="px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-xs"
                >
                  ✗ {skill}
                </span>
              )
            )
          ) : (
            <span className="text-xs text-muted">
              No missing required skills
            </span>
          )}
        </div>
      </div>

      {/* Required skills */}
      <div className="mt-5">
        <h3 className="text-sm font-semibold text-ink">
          Required Skills Matched
        </h3>

        <p className="mt-1 text-sm text-muted">
          {evaluation.matched_required_skills
            ?.length || 0}{" "}
          skill(s)
        </p>
      </div>

      {/* Preferred skills */}
      <div className="mt-5">
        <h3 className="text-sm font-semibold text-ink">
          Preferred Skills Matched
        </h3>

        <p className="mt-1 text-sm text-muted">
          {evaluation.matched_preferred_skills
            ?.length || 0}{" "}
          skill(s)
        </p>
      </div>
    </div>
  );
}