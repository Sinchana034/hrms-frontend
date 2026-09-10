import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

const Assessment = () => {
  const { token } = useParams();

  const [assessment, setAssessment] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    const loadAssessment = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE}/assessments/access/${token}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || "Unable to load assessment");
        }

        setAssessment(data);
        setAnswers(new Array(data.total_questions).fill(null));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadAssessment();
  }, [token]);

  const handleAnswer = (questionIndex, option) => {
    setAnswers((previous) => {
      const updated = [...previous];
      updated[questionIndex] = option;
      return updated;
    });
  };

  const handleSubmit = async () => {
    if (answers.some((answer) => answer === null)) {
      setError("Please answer all questions before submitting.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const response = await fetch(
        `${API_BASE}/assessments/access/${token}/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            answers,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to submit assessment");
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading assessment...</p>
      </div>
    );
  }

  if (error && !assessment) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-lg w-full border rounded-xl p-6">
          <h1 className="text-xl font-semibold mb-3">
            Assessment unavailable
          </h1>

          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-lg w-full border rounded-xl p-8 text-center">
          <h1 className="text-2xl font-semibold mb-4">
            Assessment Completed
          </h1>

          <p className="text-lg mb-2">
            Score: <strong>{result.score}%</strong>
          </p>

          <p className="mb-2">
            Result: <strong>{result.result}</strong>
          </p>

          <p className="text-sm text-gray-600">
            Correct answers: {result.correct_answers} /{" "}
            {result.total_questions}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">

        <div className="bg-white border rounded-xl p-6 mb-6">
          <h1 className="text-2xl font-semibold">
            {assessment.position} Assessment
          </h1>

          <p className="text-gray-600 mt-2">
            Total Questions: {assessment.total_questions}
          </p>

          <p className="text-gray-600">
            Pass Threshold: {assessment.pass_threshold}%
          </p>

          <p className="text-gray-600">
            Expires: {new Date(assessment.expires_at).toLocaleString()}
          </p>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {assessment.questions.map((question, index) => (
          <div
            key={index}
            className="bg-white border rounded-xl p-6 mb-5"
          >
            <h2 className="font-medium mb-4">
              {index + 1}. {question.question}
            </h2>

            <div className="space-y-3">
              {question.options.map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-3 border rounded-lg p-3 cursor-pointer hover:bg-slate-50"
                >
                  <input
                    type="radio"
                    name={`question-${index}`}
                    value={option}
                    checked={answers[index] === option}
                    onChange={() =>
                      handleAnswer(index, option)
                    }
                  />

                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-black text-white py-3 rounded-lg disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit Assessment"}
        </button>

      </div>
    </div>
  );
};

export default Assessment;