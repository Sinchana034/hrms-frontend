import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";

const Assessments = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const applicationId = searchParams.get("applicationId");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [assessment, setAssessment] = useState(null);

  const handleCreateAssessment = async () => {
    if (!applicationId) {
      setError("Application ID is missing.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await api.createAssessment(applicationId);

      setAssessment(data);
    } catch (err) {
      console.error("Create assessment error:", err);
      setError(err.message || "Failed to create assessment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-6">
      <div className="max-w-3xl mx-auto">

        <div className="bg-white border rounded-xl p-8 shadow-sm">

          <button
            onClick={() => navigate("/shortlisting")}
            className="text-sm text-slate-700 mb-8"
          >
            ← Back to Shortlisting
          </button>

          <h1 className="text-3xl font-semibold text-slate-900">
            Assessment
          </h1>

          <p className="text-slate-500 mt-2">
            Create an assessment for the shortlisted candidate.
          </p>

          <div className="bg-slate-100 rounded-lg p-5 mt-8">
            <p className="font-semibold text-slate-800">
              Application ID
            </p>

            <p className="text-slate-700 mt-1 break-all">
              {applicationId || "Not provided"}
            </p>
          </div>

          {!assessment && (
            <button
              onClick={handleCreateAssessment}
              disabled={loading || !applicationId}
              className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Assessment"}
            </button>
          )}

          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
              {error}
            </div>
          )}

          {assessment && (
            <div className="mt-8 border border-green-200 bg-green-50 rounded-xl p-6">

              <h2 className="text-xl font-semibold text-green-800">
                Assessment Created Successfully
              </h2>

              <div className="mt-5 space-y-4">

                <div>
                  <p className="text-sm text-slate-500">
                    Candidate
                  </p>

                  <p className="font-medium">
                    {assessment.candidate_name}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    Email
                  </p>

                  <p className="font-medium">
                    {assessment.candidate_email}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    Assessment URL
                  </p>

                  <div className="flex gap-2 mt-1">
                    <input
                      value={assessment.assessment_url}
                      readOnly
                      className="flex-1 border rounded-lg px-3 py-2 bg-white text-sm"
                    />

                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(
                          assessment.assessment_url
                        )
                      }
                      className="bg-slate-800 text-white px-4 py-2 rounded-lg"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    Expires At
                  </p>

                  <p className="font-medium">
                    {new Date(
                      assessment.expires_at
                    ).toLocaleString()}
                  </p>
                </div>

              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default Assessments;