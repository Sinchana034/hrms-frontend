import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";

const FinalSelection = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const applicationId = searchParams.get("applicationId");
  const aiScoreFromUrl = searchParams.get("aiScore");

  const [aiScore] = useState(
    aiScoreFromUrl || ""
  );

  const [hrScore, setHrScore] = useState("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // =========================================================
  // CALCULATE FINAL SELECTION
  // =========================================================

  const handleCalculate = async () => {
    setError("");

    if (!applicationId) {
      setError("Application ID is missing.");
      return;
    }

    if (aiScore === "") {
      setError("AI Interview score is missing.");
      return;
    }

    if (hrScore === "") {
      setError("Please enter the HR Interview score.");
      return;
    }

    const ai = Number(aiScore);
    const hr = Number(hrScore);

    if (ai < 0 || ai > 100) {
      setError(
        "AI Interview score must be between 0 and 100."
      );
      return;
    }

    if (hr < 0 || hr > 100) {
      setError(
        "HR Interview score must be between 0 and 100."
      );
      return;
    }

    try {
      setLoading(true);

      const data =
        await api.calculateFinalSelection(
            applicationId,
            ai,
            hr
        );

      console.log(
        "Final selection:",
        data
      );

      setResult(data);

    } catch (err) {
      console.error(
        "Final selection error:",
        err
      );

      setError(
        err.message ||
        "Failed to calculate final selection."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-6">

      <div className="max-w-4xl mx-auto">

        <div className="bg-white border rounded-xl p-8 shadow-sm">

          {/* =====================================================
              BACK
          ====================================================== */}

          <button
            onClick={() =>
              navigate(
                `/ai-interviews?applicationId=${applicationId}`
              )
            }
            className="text-sm text-slate-700 hover:text-slate-900 mb-8"
          >
            ← Back to AI Interview
          </button>

          {/* =====================================================
              TITLE
          ====================================================== */}

          <h1 className="text-3xl font-semibold text-slate-900">
            Final Candidate Selection
          </h1>

          <p className="text-slate-500 mt-2">
            Combine all candidate scores to determine the
            final selection result.
          </p>

          {/* =====================================================
              APPLICATION ID
          ====================================================== */}

          <div className="bg-slate-100 rounded-lg p-5 mt-8">

            <p className="font-semibold text-slate-800">
              Application ID
            </p>

            <p className="text-slate-700 mt-1 break-all">
              {applicationId || "Not provided"}
            </p>

          </div>

          {/* =====================================================
              ERROR
          ====================================================== */}

          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
              {error}
            </div>
          )}

          {!result && (
            <>
              {/* =================================================
                  AI SCORE
              ================================================== */}

              <div className="mt-8 border border-purple-200 bg-purple-50 rounded-xl p-6">

                <h2 className="text-xl font-semibold text-purple-800">
                  AI Interview Score
                </h2>

                <p className="text-purple-700 mt-2">
                  Score entered during the AI Interview stage.
                </p>

                <div className="mt-5">

                  <label className="block font-semibold text-slate-800">
                    AI Interview Score
                  </label>

                  <input
                    type="number"
                    value={aiScore}
                    disabled
                    className="mt-2 w-full md:w-80 border border-slate-300 rounded-lg px-4 py-3 bg-slate-100"
                  />

                </div>

              </div>

              {/* =================================================
                  HR SCORE
              ================================================== */}

              <div className="mt-6 border border-blue-200 bg-blue-50 rounded-xl p-6">

                <h2 className="text-xl font-semibold text-blue-800">
                  HR Interview Evaluation
                </h2>

                <p className="text-blue-700 mt-2">
                  Enter the candidate's HR Interview score
                  manually.
                </p>

                <div className="mt-5">

                  <label
                    htmlFor="hrScore"
                    className="block font-semibold text-slate-800"
                  >
                    HR Interview Score
                  </label>

                  <input
                    id="hrScore"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={hrScore}
                    onChange={(e) =>
                      setHrScore(e.target.value)
                    }
                    placeholder="Enter score (0-100)"
                    className="mt-2 w-full md:w-80 border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <p className="text-sm text-slate-500 mt-2">
                    Enter a score between 0 and 100.
                  </p>

                </div>

              </div>

              {/* =================================================
                  CALCULATE BUTTON
              ================================================== */}

              <button
                onClick={handleCalculate}
                disabled={
                  loading ||
                  !applicationId ||
                  aiScore === "" ||
                  hrScore === ""
                }
                className="mt-8 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? "Calculating..."
                  : "Calculate Final Selection"}
              </button>

            </>
          )}

          {/* =====================================================
              FINAL RESULT
          ====================================================== */}

          {result && (
            <div className="mt-8">

              {/* Candidate */}

              <div className="border rounded-xl p-6">

                <h2 className="text-xl font-semibold text-slate-900">
                  Candidate Result
                </h2>

                <div className="mt-5 space-y-3">

                  <p>
                    <strong>Candidate:</strong>{" "}
                    {result.candidate_name}
                  </p>

                  <p>
                    <strong>Email:</strong>{" "}
                    {result.candidate_email}
                  </p>

                  <p>
                    <strong>Position:</strong>{" "}
                    {result.position}
                  </p>

                </div>

              </div>

              {/* Scores */}

              <div className="mt-6 border rounded-xl p-6">

                <h2 className="text-xl font-semibold text-slate-900">
                  Score Breakdown
                </h2>

                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm text-slate-500">
                      Resume Score
                    </p>
                    <p className="text-2xl font-bold text-slate-900">
                      {result.scores.resume_score}%
                    </p>
                    <p className="text-xs text-slate-500">
                      Weight: 25%
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm text-slate-500">
                      Assessment Score
                    </p>
                    <p className="text-2xl font-bold text-slate-900">
                      {result.scores.assessment_score}%
                    </p>
                    <p className="text-xs text-slate-500">
                      Weight: 25%
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm text-slate-500">
                      AI Interview Score
                    </p>
                    <p className="text-2xl font-bold text-slate-900">
                      {result.scores.ai_interview_score}%
                    </p>
                    <p className="text-xs text-slate-500">
                      Weight: 25%
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm text-slate-500">
                      HR Interview Score
                    </p>
                    <p className="text-2xl font-bold text-slate-900">
                      {result.scores.hr_interview_score}%
                    </p>
                    <p className="text-xs text-slate-500">
                      Weight: 25%
                    </p>
                  </div>

                </div>

              </div>

              {/* Final Score */}

              <div className="mt-6 border border-green-200 bg-green-50 rounded-xl p-8 text-center">

                <p className="text-sm text-green-700 font-medium">
                  FINAL SCORE
                </p>

                <p className="text-5xl font-bold text-green-800 mt-2">
                  {result.final_score}%
                </p>

                <div className="mt-6">

                  <span
                    className={`inline-block px-6 py-3 rounded-lg text-xl font-bold ${
                      result.prediction === "Selected"
                        ? "bg-green-600 text-white"
                        : "bg-red-600 text-white"
                    }`}
                  >
                    {result.prediction}
                  </span>

                </div>

              </div>

              {/* Explanation */}

              <div className="mt-6 bg-slate-50 border rounded-xl p-6">

                <h3 className="font-semibold text-slate-800">
                  Selection Logic
                </h3>

                <p className="text-slate-600 mt-2">
                  Final score =
                  (Resume × 25%) +
                  (Assessment × 25%) +
                  (AI Interview × 25%) +
                  (HR Interview × 25%)
                </p>

                <p className="text-slate-600 mt-2">
                  Candidates with a final score of
                  <strong> 70% or above </strong>
                  are currently marked as
                  <strong> Selected</strong>.
                </p>

              </div>

              {/* Back */}

              <button
                onClick={() =>
                  navigate("/shortlisting")
                }
                className="mt-8 bg-slate-800 hover:bg-slate-900 text-white px-6 py-3 rounded-lg font-medium"
              >
                Back to Shortlisting
              </button>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default FinalSelection;
