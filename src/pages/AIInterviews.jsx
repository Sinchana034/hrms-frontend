import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";

const AIInterviews = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const applicationId = searchParams.get("applicationId");

  const [loading, setLoading] = useState(false);
  const [interview, setInterview] = useState(null);
  const [error, setError] = useState("");
  const [aiScore, setAiScore] = useState("");

  // =========================================================
  // CREATE AI INTERVIEW
  // =========================================================

  const handleCreateInterview = async () => {
    if (!applicationId) {
      setError("Application ID is missing.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await api.createAIInterview(
        applicationId
      );

      console.log(
        "AI Interview created:",
        data
      );

      setInterview(data);

    } catch (err) {
      console.error(
        "Create AI interview error:",
        err
      );

      setError(
        err.message ||
        "Failed to create AI interview."
      );

    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // HANDLE AI SCORE
  // =========================================================

  const handleScoreChange = (e) => {
    const value = e.target.value;

    // Allow empty input
    if (value === "") {
      setAiScore("");
      return;
    }

    const numberValue = Number(value);

    if (
      numberValue >= 0 &&
      numberValue <= 100
    ) {
      setAiScore(value);
    }
  };

  // =========================================================
  // CONTINUE TO FINAL SELECTION
  // =========================================================

  const handleContinue = () => {
    if (aiScore === "") {
      setError(
        "Please enter the AI Interview score."
      );
      return;
    }

    const score = Number(aiScore);

    if (score < 0 || score > 100) {
      setError(
        "AI Interview score must be between 0 and 100."
      );
      return;
    }

    navigate(
      `/final-selection?applicationId=${applicationId}&aiScore=${score}`
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-6">

      <div className="max-w-4xl mx-auto">

        <div className="bg-white border rounded-xl p-8 shadow-sm">

          {/* =====================================================
              BACK BUTTON
          ====================================================== */}

          <button
            onClick={() => navigate("/shortlisting")}
            className="text-sm text-slate-700 hover:text-slate-900 mb-8"
          >
            ← Back to Shortlisting
          </button>

          {/* =====================================================
              PAGE TITLE
          ====================================================== */}

          <h1 className="text-3xl font-semibold text-slate-900">
            AI Interview
          </h1>

          <p className="text-slate-500 mt-2">
            Generate technical interview questions based on
            the candidate's skills.
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
              ERROR MESSAGE
          ====================================================== */}

          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
              {error}
            </div>
          )}

          {/* =====================================================
              CREATE INTERVIEW
          ====================================================== */}

          {!interview && (
            <div className="mt-8 border border-blue-200 bg-blue-50 rounded-xl p-6">

              <h2 className="text-xl font-semibold text-blue-800">
                AI Interview Preparation
              </h2>

              <p className="text-blue-700 mt-2">
                Candidate has successfully passed the
                assessment and is eligible for the AI interview.
              </p>

              <p className="text-blue-700 mt-2">
                The system will generate technical questions
                based on the candidate's skills.
              </p>

              <button
                onClick={handleCreateInterview}
                disabled={
                  loading ||
                  !applicationId
                }
                className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50"
              >
                {loading
                  ? "Creating..."
                  : "Create AI Interview"}
              </button>

            </div>
          )}

          {/* =====================================================
              INTERVIEW CREATED
          ====================================================== */}

          {interview && (
            <div className="mt-8 space-y-8">

              {/* =================================================
                  INTERVIEW DETAILS
              ================================================== */}

              <div className="border border-green-200 bg-green-50 rounded-xl p-6">

                <h2 className="text-xl font-semibold text-green-800">
                  AI Interview Created Successfully
                </h2>

                <div className="mt-5 space-y-3">

                  <p className="text-slate-800">
                    <strong>Candidate:</strong>{" "}
                    {interview.candidate_name}
                  </p>

                  <p className="text-slate-800">
                    <strong>Email:</strong>{" "}
                    {interview.candidate_email}
                  </p>

                  <p className="text-slate-800">
                    <strong>Position:</strong>{" "}
                    {interview.position}
                  </p>

                  <p className="text-slate-800">
                    <strong>Status:</strong>{" "}
                    {interview.interview.status}
                  </p>

                  <p className="text-slate-800">
                    <strong>Total Questions:</strong>{" "}
                    {interview.interview.total_questions}
                  </p>

                </div>

              </div>

              {/* =================================================
                  INTERVIEW QUESTIONS
              ================================================== */}

              <div className="border border-slate-200 rounded-xl p-6">

                <h3 className="text-xl font-semibold text-slate-800 mb-4">
                  Interview Questions
                </h3>

                <p className="text-sm text-slate-500 mb-5">
                  These questions are generated based on the
                  candidate's listed skills.
                </p>

                <div className="space-y-4">

                  {interview.interview.questions.map(
                    (question, index) => (

                      <div
                        key={index}
                        className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm"
                      >

                        <p className="text-sm text-blue-600 font-medium uppercase">
                          {question.skill}
                        </p>

                        <p className="mt-2 text-slate-800">
                          <strong>
                            {index + 1}.
                          </strong>{" "}
                          {question.question}
                        </p>

                      </div>

                    )
                  )}

                </div>

              </div>

              {/* =================================================
                  MANUAL AI INTERVIEW SCORE
              ================================================== */}

              <div className="border border-purple-200 bg-purple-50 rounded-xl p-6">

                <h3 className="text-xl font-semibold text-purple-800">
                  AI Interview Evaluation
                </h3>

                <p className="text-purple-700 mt-2">
                  The AI interview will not be conducted
                  automatically for this submission.
                </p>

                <p className="text-purple-700 mt-1">
                  HR can review the generated questions and
                  manually enter the candidate's AI Interview score.
                </p>

                {/* Score Input */}

                <div className="mt-6">

                  <label
                    htmlFor="aiScore"
                    className="block font-semibold text-slate-800"
                  >
                    AI Interview Score
                  </label>

                  <input
                    id="aiScore"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={aiScore}
                    onChange={handleScoreChange}
                    placeholder="Enter score (0-100)"
                    className="mt-2 w-full md:w-80 border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />

                  <p className="text-sm text-slate-500 mt-2">
                    Enter a score between 0 and 100.
                  </p>

                </div>

                {/* Continue Button */}

                <button
                  onClick={handleContinue}
                  disabled={
                    aiScore === ""
                  }
                  className="mt-6 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue to Final Selection →
                </button>

              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default AIInterviews;