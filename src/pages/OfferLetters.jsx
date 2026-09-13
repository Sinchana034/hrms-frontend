import { useEffect, useState } from "react";
import { api } from "../lib/api";

const OfferLetters = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [offerDetails, setOfferDetails] = useState({});

  // =========================================================
  // LOAD SELECTED CANDIDATES
  // =========================================================

  const loadCandidates = async () => {
    try {
      setLoading(true);

      setError("");

      const [selectedCandidates, existingOffers] =
        await Promise.all([
          api.getSelectedCandidates(),
          api.getOfferLetters().catch(() => []),
        ]);

      setCandidates(selectedCandidates || []);

      const existingByApplication = {};

      for (const offer of existingOffers || []) {
        existingByApplication[offer.application_id] = {
          salary: offer.salary,
          joiningDate: offer.joining_date,
          status: offer.status,
        };
      }

      setOfferDetails(existingByApplication);
    } catch (err) {
      console.error(
        "Failed to load selected candidates:",
        err
      );

      setError(
        err.message ||
          "Failed to load selected candidates."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCandidates();
  }, []);

  // =========================================================
  // HANDLE INPUT CHANGE
  // =========================================================

  const handleInputChange = (
    applicationId,
    field,
    value
  ) => {
    setOfferDetails((previous) => ({
      ...previous,

      [applicationId]: {
        ...previous[applicationId],

        [field]: value,
      },
    }));
  };

  // =========================================================
  // GENERATE OFFER LETTER
  // =========================================================

  const [sendingId, setSendingId] = useState(null);

  const handleGenerateOffer = async (
    candidate
  ) => {
    const details =
      offerDetails[
        candidate.application_id
      ];

    if (
      !details?.salary ||
      !details?.joiningDate
    ) {
      alert(
        "Please enter salary/package and joining date."
      );

      return;
    }

    setSendingId(candidate.application_id);

    try {
      const result = await api.generateOfferLetter(
        candidate.application_id,
        details.salary,
        details.joiningDate
      );

      if (result.notification_sent) {
        alert(
          `Offer letter generated and emailed to ${candidate.candidate_name}.`
        );
      } else {
        alert(
          `Offer letter generated, but the email failed to send: ${
            result.notification_error || "unknown error"
          }. The offer is saved — you can retry sending it.`
        );
      }

      setOfferDetails((previous) => ({
        ...previous,

        [candidate.application_id]: {
          ...previous[candidate.application_id],

          status: result.notification_sent
            ? "Sent"
            : "Generated",
        },
      }));
    } catch (err) {
      console.error(
        "Failed to generate offer letter:",
        err
      );

      alert(
        err.message ||
          "Failed to generate offer letter."
      );
    } finally {
      setSendingId(null);
    }
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-6">

      <div className="max-w-6xl mx-auto">

        {/* HEADER */}

        <div className="mb-8">

          <h1 className="text-3xl font-semibold text-slate-900">

            Offer Letters

          </h1>

          <p className="text-slate-500 mt-2">

            Generate and manage offer letters
            for selected candidates.

          </p>

        </div>

        {/* ERROR */}

        {error && (

          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">

            {error}

          </div>

        )}

        {/* LOADING */}

        {loading && (

          <div className="bg-white border rounded-xl p-10 text-center text-slate-500">

            Loading selected candidates...

          </div>

        )}

        {/* CANDIDATES */}

        {!loading && (

          <>

            {candidates.length === 0 ? (

              <div className="bg-white border rounded-xl p-10 text-center">

                <h2 className="text-xl font-semibold text-slate-700">

                  No selected candidates found

                </h2>

                <p className="text-slate-500 mt-2">

                  Candidates who pass the final
                  selection process will appear here.

                </p>

              </div>

            ) : (

              <div className="space-y-6">

                {candidates.map(
                  (candidate) => {

                    const details =
                      offerDetails[
                        candidate.application_id
                      ] || {};

                    return (

                      <div
                        key={
                          candidate.application_id
                        }
                        className="bg-white border rounded-xl shadow-sm p-6"
                      >

                        {/* CANDIDATE HEADER */}

                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-5">

                          <div>

                            <h2 className="text-xl font-semibold text-slate-800">

                              {
                                candidate.candidate_name
                              }

                            </h2>

                            <p className="text-slate-500 mt-1">

                              {
                                candidate.email
                              }

                            </p>

                          </div>

                          <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold">

                            Selected

                          </span>

                        </div>

                        {/* CANDIDATE DETAILS */}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 border-b">

                          <div>

                            <p className="text-sm text-slate-500">

                              Position

                            </p>

                            <p className="font-semibold text-slate-800 mt-1">

                              {
                                candidate.position ||
                                "Not specified"
                              }

                            </p>

                          </div>

                          <div>

                            <p className="text-sm text-slate-500">

                              Final Score

                            </p>

                            <p className="font-semibold text-green-700 mt-1">

                              {
                                candidate.final_score
                              }%

                            </p>

                          </div>

                          <div>

                            <p className="text-sm text-slate-500">

                              Selection Result

                            </p>

                            <p className="font-semibold text-green-700 mt-1">

                              {
                                candidate.prediction
                              }

                            </p>

                          </div>

                        </div>

                        {/* OFFER FORM */}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">

                          {/* SALARY */}

                          <div>

                            <label className="block text-sm font-medium text-slate-700 mb-2">

                              Salary / Package

                            </label>

                            <input
                              type="text"
                              placeholder="Example: ₹5,00,000 per year"
                              value={
                                details.salary ||
                                ""
                              }
                              onChange={(event) =>
                                handleInputChange(
                                  candidate.application_id,
                                  "salary",
                                  event.target.value
                                )
                              }
                              className="w-full border border-slate-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                            />

                          </div>

                          {/* JOINING DATE */}

                          <div>

                            <label className="block text-sm font-medium text-slate-700 mb-2">

                              Joining Date

                            </label>

                            <input
                              type="date"
                              value={
                                details.joiningDate ||
                                ""
                              }
                              onChange={(event) =>
                                handleInputChange(
                                  candidate.application_id,
                                  "joiningDate",
                                  event.target.value
                                )
                              }
                              className="w-full border border-slate-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                            />

                          </div>

                        </div>

                        {/* OFFER STATUS */}

                        {details.status ===
                          "Sent" && (

                          <div className="mt-5 bg-green-50 border border-green-200 rounded-lg p-4">

                            <p className="font-semibold text-green-700">

                              ✓ Offer Letter Sent

                            </p>

                            <p className="text-sm text-green-600 mt-1">

                              The offer letter has been
                              emailed to the candidate.

                            </p>

                          </div>

                        )}

                        {details.status ===
                          "Generated" && (

                          <div className="mt-5 bg-amber-50 border border-amber-200 rounded-lg p-4">

                            <p className="font-semibold text-amber-700">

                              ⚠ Offer Letter Generated, Email Failed

                            </p>

                            <p className="text-sm text-amber-600 mt-1">

                              The offer is saved but the
                              email didn't go out. Click
                              the button again to retry sending.

                            </p>

                          </div>

                        )}

                        {/* BUTTON */}

                        <div className="mt-6 flex justify-end">

                          <button
                            onClick={() =>
                              handleGenerateOffer(
                                candidate
                              )
                            }
                            disabled={
                              sendingId ===
                              candidate.application_id
                            }
                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition"
                          >

                            {sendingId ===
                            candidate.application_id
                              ? "Sending..."
                              : details.status ===
                                "Sent"
                              ? "Offer Sent"
                              : details.status ===
                                "Generated"
                              ? "Retry Sending"
                              : "Generate Offer Letter"}

                          </button>

                        </div>

                      </div>

                    );

                  }
                )}

              </div>

            )}

          </>

        )}

      </div>

    </div>
  );
};

export default OfferLetters;