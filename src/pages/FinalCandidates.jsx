import { useEffect, useState } from "react";
import { api } from "../lib/api";

const FinalCandidates = () => {
  const [selectedCandidates, setSelectedCandidates] =
    useState([]);

  const [rejectedCandidates, setRejectedCandidates] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // =========================================================
  // LOAD CANDIDATES
  // =========================================================

  const loadCandidates = async () => {

    try {

      setLoading(true);

      setError("");

      const [
        selected,
        rejected,
      ] = await Promise.all([
        api.getSelectedCandidates(),
        api.getRejectedCandidates(),
      ]);

      setSelectedCandidates(
        selected || []
      );

      setRejectedCandidates(
        rejected || []
      );

    } catch (err) {

      console.error(
        "Failed to load final candidates:",
        err
      );

      setError(
        err.message ||
        "Failed to load candidates."
      );

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {

    loadCandidates();

  }, []);

  // =========================================================
  // CANDIDATE TABLE
  // =========================================================

  const CandidateTable = ({
    candidates,
    type,
  }) => {

    if (candidates.length === 0) {

      return (

        <div className="text-center py-10 text-slate-500">

          No {type.toLowerCase()} candidates found.

        </div>

      );

    }

    return (

      <div className="overflow-x-auto">

        <table className="w-full text-sm">

          <thead>

            <tr className="border-b bg-slate-50">

              <th className="text-left p-4">
                Candidate
              </th>

              <th className="text-left p-4">
                Email
              </th>

              <th className="text-left p-4">
                Position
              </th>

              <th className="text-center p-4">
                Final Score
              </th>

              <th className="text-center p-4">
                Result
              </th>

            </tr>

          </thead>

          <tbody>

            {candidates.map(
              (candidate) => (

                <tr
                  key={
                    candidate.application_id
                  }
                  className="border-b hover:bg-slate-50"
                >

                  <td className="p-4 font-medium">

                    {
                      candidate.candidate_name
                    }

                  </td>

                  <td className="p-4 text-slate-600">

                    {
                      candidate.email
                    }

                  </td>

                  <td className="p-4">

                    {
                      candidate.position
                    }

                  </td>

                  <td className="p-4 text-center font-semibold">

                    {
                      candidate.final_score
                    }%

                  </td>

                  <td className="p-4 text-center">

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        candidate.prediction ===
                        "Selected"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >

                      {
                        candidate.prediction
                      }

                    </span>

                  </td>

                </tr>

              )
            )}

          </tbody>

        </table>

      </div>

    );

  };

  // =========================================================
  // UI
  // =========================================================

  return (

    <div className="min-h-screen bg-slate-50 py-10 px-6">

      <div className="max-w-6xl mx-auto">

        {/* Header */}

        <div className="mb-8">

          <h1 className="text-3xl font-semibold text-slate-900">

            Final Candidate Results

          </h1>

          <p className="text-slate-500 mt-2">

            View candidates who were selected
            or rejected after the final
            recruitment evaluation.

          </p>

        </div>

        {/* Error */}

        {error && (

          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">

            {error}

          </div>

        )}

        {/* Loading */}

        {loading && (

          <div className="bg-white border rounded-xl p-10 text-center text-slate-500">

            Loading candidate results...

          </div>

        )}

        {!loading && (

          <>

            {/* Summary */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

              <div className="bg-green-50 border border-green-200 rounded-xl p-6">

                <p className="text-sm text-green-700">

                  Selected Candidates

                </p>

                <p className="text-4xl font-bold text-green-800 mt-2">

                  {
                    selectedCandidates.length
                  }

                </p>

              </div>

              <div className="bg-red-50 border border-red-200 rounded-xl p-6">

                <p className="text-sm text-red-700">

                  Rejected Candidates

                </p>

                <p className="text-4xl font-bold text-red-800 mt-2">

                  {
                    rejectedCandidates.length
                  }

                </p>

              </div>

            </div>

            {/* Selected */}

            <div className="bg-white border border-green-200 rounded-xl shadow-sm mb-8">

              <div className="p-6 border-b border-green-100">

                <h2 className="text-xl font-semibold text-green-800">

                  Selected Candidates

                </h2>

                <p className="text-sm text-slate-500 mt-1">

                  Candidates who passed the
                  final selection process.

                </p>

              </div>

              <CandidateTable
                candidates={
                  selectedCandidates
                }
                type="Selected"
              />

            </div>

            {/* Rejected */}

            <div className="bg-white border border-red-200 rounded-xl shadow-sm">

              <div className="p-6 border-b border-red-100">

                <h2 className="text-xl font-semibold text-red-700">

                  Rejected Candidates

                </h2>

                <p className="text-sm text-slate-500 mt-1">

                  Candidates who did not meet
                  the final selection criteria.

                </p>

              </div>

              <CandidateTable
                candidates={
                  rejectedCandidates
                }
                type="Rejected"
              />

            </div>

          </>

        )}

      </div>

    </div>

  );

};

export default FinalCandidates;