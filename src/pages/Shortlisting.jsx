import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useNavigate } from "react-router-dom";

const SHORTLISTING_THRESHOLD = 70;

const Shortlisting = () => {
  const [candidates, setCandidates] = useState([]);
  const [shortlistedCandidates, setShortlistedCandidates] = useState([]);
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [assessmentResults, setAssessmentResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const navigate = useNavigate();

  // =========================================================
  // FETCH CANDIDATES
  // =========================================================

  const loadCandidates = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await api.listShortlisting();

      console.log("SHORTLISTING DATA:", data);

      setCandidates(data || []);

      return data || [];
    } catch (err) {
      console.error("Failed to load candidates:", err);

      setError(
        err.message || "Failed to load candidates"
      );

      return [];
    } finally {
      setLoading(false);
    }
  };

  const loadShortlistedCandidates = async () => {
    try {
      const data = await api.listShortlisted();

      console.log("SHORTLISTED CANDIDATES:", data);

      setShortlistedCandidates(data || []);
    } catch (err) {
      console.error(
        "Failed to load shortlisted candidates:",
        err
      );
    }
  };

  // =========================================================
  // LOAD ASSESSMENT RESULT
  // =========================================================

  const loadAssessmentResult = async (applicationId) => {
    if (!applicationId) {
      return null;
    }

    try {
      const result =
        await api.getAssessmentResult(applicationId);

      console.log(
        "Assessment result:",
        applicationId,
        result
      );

      setAssessmentResults((previous) => ({
        ...previous,
        [applicationId]: result,
      }));

      return result;
    } catch (err) {
      console.error(
        `Failed to load assessment result for ${applicationId}:`,
        err
      );

      setAssessmentResults((previous) => ({
        ...previous,
        [applicationId]: null,
      }));

      return null;
    }
  };

  // =========================================================
  // LOAD INITIAL DATA
  // =========================================================

  useEffect(() => {
    const loadData = async () => {
      const candidatesData = await loadCandidates();

      await loadShortlistedCandidates();

      if (
        !candidatesData ||
        candidatesData.length === 0
      ) {
        return;
      }

      for (const candidate of candidatesData) {
        const application =
          candidate?.application;

        const decision =
          candidate?.decision;

        const applicationId =
          application?.application_id;

        if (!applicationId) {
          console.warn(
            "Skipping candidate because application_id is missing:",
            candidate
          );

          continue;
        }

        // Load assessment only for shortlisted candidates
        if (
          decision?.decision ===
          "shortlisted"
        ) {
          await loadAssessmentResult(
            applicationId
          );
        }
      }
    };

    loadData();
  }, []);

  // =========================================================
  // GET CANDIDATE NAME
  // =========================================================

  const getCandidateName = (application) => {
    if (!application) {
      return "Unknown Candidate";
    }

    if (application.name) {
      return application.name;
    }

    if (application.full_name) {
      return application.full_name;
    }

    if (application.candidate_name) {
      return application.candidate_name;
    }

    if (application.applicant_name) {
      return application.applicant_name;
    }

    return "Unknown Candidate";
  };

  // =========================================================
  // GET MATCHING SCORE
  // =========================================================

  const getMatchingScore = (
    evaluation
  ) => {
    if (!evaluation) {
      return 0;
    }

    return Number(
      evaluation.matching_score || 0
    );
  };

  // =========================================================
  // CHECK CANDIDATE ELIGIBILITY
  // =========================================================

  const isEligible = (candidate) => {
    if (!candidate) {
      return false;
    }

    if (
      typeof candidate.eligible ===
      "boolean"
    ) {
      return candidate.eligible;
    }

    const score =
      getMatchingScore(
        candidate.evaluation
      );

    return (
      score >=
      SHORTLISTING_THRESHOLD
    );
  };

  // =========================================================
  // GET APPLICATION ID
  // =========================================================

  const getApplicationId = (
    candidate
  ) => {
    return (
      candidate?.application
        ?.application_id
    );
  };

  // =========================================================
  // SELECT / UNSELECT CANDIDATE
  // =========================================================

  const toggleCandidate = (
    applicationId
  ) => {
    if (!applicationId) {
      return;
    }

    setSelectedCandidates(
      (previous) => {
        if (
          previous.includes(
            applicationId
          )
        ) {
          return previous.filter(
            (id) =>
              id !== applicationId
          );
        }

        return [
          ...previous,
          applicationId,
        ];
      }
    );
  };

  // =========================================================
  // SELECT ALL ELIGIBLE
  // =========================================================

  const selectAllEligible = () => {
    const eligibleIds = candidates
      .filter((candidate) =>
        isEligible(candidate)
      )
      .map((candidate) =>
        getApplicationId(candidate)
      )
      .filter(Boolean);

    setSelectedCandidates(
      eligibleIds
    );
  };

  // =========================================================
  // CLEAR SELECTION
  // =========================================================

  const clearSelection = () => {
    setSelectedCandidates([]);
  };

  // =========================================================
  // SHORTLIST ONE CANDIDATE
  // =========================================================

  const shortlistCandidate = async (
    applicationId
  ) => {
    if (!applicationId) {
      alert(
        "Application ID is missing."
      );
      return;
    }

    try {
      setProcessing(true);

      await api.makeShortlistingDecision(
        applicationId,
        "shortlisted",
        null
      );

      await loadCandidates();

      await loadShortlistedCandidates();

      await loadAssessmentResult(
        applicationId
      );

      setSelectedCandidates(
        (previous) =>
          previous.filter(
            (id) =>
              id !== applicationId
          )
      );

      alert(
        "Candidate shortlisted successfully."
      );
    } catch (err) {
      console.error(err);

      alert(
        err.message ||
          "Failed to shortlist candidate"
      );
    } finally {
      setProcessing(false);
    }
  };

  // =========================================================
  // REJECT ONE CANDIDATE
  // =========================================================

  const rejectCandidate = async (
    applicationId
  ) => {
    if (!applicationId) {
      alert(
        "Application ID is missing."
      );
      return;
    }

    try {
      setProcessing(true);

      await api.makeShortlistingDecision(
        applicationId,
        "non_shortlisted",
        "Rejected by HR during resume shortlisting"
      );

      await loadCandidates();

      setSelectedCandidates(
        (previous) =>
          previous.filter(
            (id) =>
              id !== applicationId
          )
      );

      alert(
        "Candidate rejected."
      );
    } catch (err) {
      console.error(err);

      alert(
        err.message ||
          "Failed to reject candidate"
      );
    } finally {
      setProcessing(false);
    }
  };

  // =========================================================
  // SHORTLIST SELECTED
  // =========================================================

  const shortlistSelected = async () => {
    if (
      selectedCandidates.length ===
      0
    ) {
      alert(
        "Please select at least one candidate."
      );

      return;
    }

    try {
      setProcessing(true);

      for (
        const applicationId of selectedCandidates
      ) {
        await api.makeShortlistingDecision(
          applicationId,
          "shortlisted",
          null
        );
      }

      setSelectedCandidates([]);

      await loadCandidates();

      await loadShortlistedCandidates();

      alert(
        "Selected candidates have been shortlisted."
      );
    } catch (err) {
      console.error(err);

      alert(
        err.message ||
          "Failed to shortlist candidates"
      );
    } finally {
      setProcessing(false);
    }
  };

  // =========================================================
  // REJECT SELECTED
  // =========================================================

  const rejectSelected = async () => {
    if (
      selectedCandidates.length ===
      0
    ) {
      alert(
        "Please select at least one candidate."
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Reject ${selectedCandidates.length} selected candidate(s)?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setProcessing(true);

      for (
        const applicationId of selectedCandidates
      ) {
        await api.makeShortlistingDecision(
          applicationId,
          "non_shortlisted",
          "Rejected by HR during resume shortlisting"
        );
      }

      setSelectedCandidates([]);

      await loadCandidates();

      alert(
        "Selected candidates have been rejected."
      );
    } catch (err) {
      console.error(err);

      alert(
        err.message ||
          "Failed to reject candidates"
      );
    } finally {
      setProcessing(false);
    }
  };

  // =========================================================
  // PROVIDE ASSESSMENT
  // =========================================================

  const provideAssessment = async (
    applicationId
  ) => {
    if (!applicationId) {
      alert(
        "Application ID is missing."
      );

      return;
    }

    try {
      setProcessing(true);

      const result =
        await api.createAssessment(
          applicationId
        );

      console.log(
        "Assessment created:",
        result
      );

      navigate(
        `/assessments?applicationId=${applicationId}`
      );
    } catch (err) {
      console.error(
        "Failed to create assessment:",
        err
      );

      alert(
        err.message ||
          "Failed to create assessment"
      );
    } finally {
      setProcessing(false);
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div style={styles.center}>
        <h3>
          Loading candidates...
        </h3>
      </div>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorBox}>
          <strong>Error:</strong>{" "}
          {error}
        </div>

        <button
          style={
            styles.primaryButton
          }
          onClick={
            loadCandidates
          }
        >
          Try Again
        </button>
      </div>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div style={styles.container}>

      {/* HEADER */}

      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            ML Resume Shortlisting
          </h1>

          <p style={styles.subtitle}>
            Review candidates based on
            resume matching and select
            candidates for the next
            recruitment stage.
          </p>
        </div>

        <div
          style={
            styles.thresholdBox
          }
        >
          <div
            style={
              styles.thresholdLabel
            }
          >
            Shortlisting threshold
          </div>

          <div
            style={
              styles.thresholdValue
            }
          >
            {
              SHORTLISTING_THRESHOLD
            }
            %
          </div>
        </div>
      </div>

      {/* FILTER BAR */}

      <div style={styles.filterBar}>

        <button
          onClick={() =>
            setActiveFilter("all")
          }
          style={
            activeFilter === "all"
              ? styles.activeFilter
              : styles.filterButton
          }
        >
          All
        </button>

        <button
          onClick={() =>
            setActiveFilter(
              "shortlisted"
            )
          }
          style={
            activeFilter ===
            "shortlisted"
              ? styles.activeFilter
              : styles.filterButton
          }
        >
          Shortlisted
        </button>

        <button
          onClick={() =>
            setActiveFilter(
              "non_shortlisted"
            )
          }
          style={
            activeFilter ===
            "non_shortlisted"
              ? styles.activeFilter
              : styles.filterButton
          }
        >
          Non-Shortlisted
        </button>

      </div>

      {/* ACTION BAR */}

      <div style={styles.actionBar}>

        <button
          style={
            styles.secondaryButton
          }
          onClick={
            selectAllEligible
          }
          disabled={processing}
        >
          Select All Eligible
        </button>

        <button
          style={
            styles.secondaryButton
          }
          onClick={
            clearSelection
          }
          disabled={
            processing ||
            selectedCandidates.length ===
              0
          }
        >
          Clear Selection
        </button>

        <div
          style={
            styles.selectionText
          }
        >
          {
            selectedCandidates.length
          }{" "}
          candidate
          {selectedCandidates.length !==
          1
            ? "s"
            : ""}{" "}
          selected
        </div>

        <button
          style={
            styles.primaryButton
          }
          onClick={
            shortlistSelected
          }
          disabled={
            processing ||
            selectedCandidates.length ===
              0
          }
        >
          Shortlist Selected
        </button>

        <button
          style={
            styles.dangerButton
          }
          onClick={
            rejectSelected
          }
          disabled={
            processing ||
            selectedCandidates.length ===
              0
          }
        >
          Reject Selected
        </button>

      </div>

      {/* EMPTY STATE */}

      {candidates.length === 0 && (
        <div style={styles.emptyBox}>
          <h3>
            No candidates found
          </h3>

          <p>
            There are currently no
            candidates available for
            shortlisting.
          </p>
        </div>
      )}

      {/* CANDIDATE CARDS */}

      {candidates
        .filter((candidate) => {
          if (
            activeFilter === "all"
          ) {
            return true;
          }

          return (
            candidate?.decision
              ?.decision ===
            activeFilter
          );
        })
        .map(
          (
            candidate,
            index
          ) => {
            const application =
              candidate?.application;

            const evaluation =
              candidate?.evaluation;

            const decision =
              candidate?.decision;

            const applicationId =
              getApplicationId(
                candidate
              );

            const candidateName =
              getCandidateName(
                application
              );

            const matchingScore =
              getMatchingScore(
                evaluation
              );

            const eligible =
              isEligible(
                candidate
              );

            const assessment =
              applicationId
                ? assessmentResults[
                    applicationId
                  ]
                : null;

            return (
              <div
                key={
                  applicationId ||
                  `candidate-${index}`
                }
                style={
                  styles.card
                }
              >

                {/* CANDIDATE HEADER */}

                <div
                  style={
                    styles.cardHeader
                  }
                >

                  <div
                    style={
                      styles.leftSection
                    }
                  >

                    <input
                      type="checkbox"
                      checked={
                        applicationId
                          ? selectedCandidates.includes(
                              applicationId
                            )
                          : false
                      }
                      onChange={() =>
                        toggleCandidate(
                          applicationId
                        )
                      }
                      disabled={
                        processing ||
                        !eligible ||
                        !applicationId
                      }
                      style={
                        styles.checkbox
                      }
                    />

                    <div>
                      <h2
                        style={
                          styles.candidateName
                        }
                      >
                        {
                          candidateName
                        }
                      </h2>

                      <p
                        style={
                          styles.position
                        }
                      >
                        {application?.position ||
                          "Position not available"}
                      </p>
                    </div>

                  </div>

                  <div
                    style={
                      styles.scoreContainer
                    }
                  >

                    <div
                      style={
                        styles.scoreLabel
                      }
                    >
                      Matching Score
                    </div>

                    <div
                      style={{
                        ...styles.score,
                        color:
                          eligible
                            ? "#16803c"
                            : "#dc2626",
                      }}
                    >
                      {matchingScore.toFixed(
                        1
                      )}
                      %
                    </div>

                  </div>

                </div>

                {/* ELIGIBILITY */}

                <div
                  style={{
                    ...styles.eligibilityBox,
                    backgroundColor:
                      eligible
                        ? "#f0fdf4"
                        : "#fff1f2",
                    borderColor:
                      eligible
                        ? "#bbf7d0"
                        : "#fecaca",
                  }}
                >

                  <h3
                    style={{
                      ...styles.eligibilityTitle,
                      color:
                        eligible
                          ? "#166534"
                          : "#991b1b",
                    }}
                  >
                    {eligible
                      ? "Eligible"
                      : "Not Eligible"}
                  </h3>

                  <p
                    style={{
                      ...styles.eligibilityText,
                      color:
                        eligible
                          ? "#166534"
                          : "#991b1b",
                    }}
                  >
                    {candidate?.eligibility_reason ||
                      (eligible
                        ? "Candidate meets the required criteria."
                        : `Score ${matchingScore.toFixed(
                            1
                          )}% is below the required ${SHORTLISTING_THRESHOLD}%.`)}
                  </p>

                </div>

                {/* CANDIDATE INFORMATION */}

                <div
                  style={
                    styles.infoGrid
                  }
                >

                  <div>
                    <div
                      style={
                        styles.infoLabel
                      }
                    >
                      Email
                    </div>

                    <div
                      style={
                        styles.infoValue
                      }
                    >
                      {application?.email ||
                        "Not available"}
                    </div>
                  </div>

                  <div>
                    <div
                      style={
                        styles.infoLabel
                      }
                    >
                      Application Status
                    </div>

                    <div
                      style={
                        styles.infoValue
                      }
                    >
                      {application?.current_status ||
                        "Not available"}
                    </div>
                  </div>

                  <div>
                    <div
                      style={
                        styles.infoLabel
                      }
                    >
                      Application ID
                    </div>

                    <div
                      style={
                        styles.infoValue
                      }
                    >
                      {applicationId ||
                        "Not available"}
                    </div>
                  </div>

                </div>

                {/* HR DECISION */}

                {decision && (
                  <div
                    style={
                      styles.decisionBox
                    }
                  >
                    <strong>
                      HR Decision:{" "}
                      {
                        decision.decision
                      }
                    </strong>

                    {decision.reason && (
                      <p
                        style={
                          styles.reason
                        }
                      >
                        Reason:{" "}
                        {
                          decision.reason
                        }
                      </p>
                    )}
                  </div>
                )}

                {/* ASSESSMENT RESULT */}

                {assessment && (
                  <div
                    style={
                      styles.assessmentResultBox
                    }
                  >

                    <h3
                      style={
                        styles.assessmentTitle
                      }
                    >
                      Assessment Result
                    </h3>

                    <p
                      style={
                        styles.assessmentStatus
                      }
                    >
                      Status:{" "}
                      <strong>
                        {
                          assessment.status
                        }
                      </strong>
                    </p>

                    <div
                      style={
                        styles.assessmentGrid
                      }
                    >

                      <div>
                        <div
                          style={
                            styles.infoLabel
                          }
                        >
                          Score
                        </div>

                        <div
                          style={
                            styles.assessmentValue
                          }
                        >
                          {assessment.score !==
                            null &&
                          assessment.score !==
                            undefined
                            ? `${Number(
                                assessment.score
                              ).toFixed(
                                2
                              )}%`
                            : "Not completed"}
                        </div>
                      </div>

                      <div>
                        <div
                          style={
                            styles.infoLabel
                          }
                        >
                          Result
                        </div>

                        <div
                          style={{
                            ...styles.assessmentValue,
                            color:
                              assessment.result ===
                              "Passed"
                                ? "#16803c"
                                : assessment.result ===
                                  "Failed"
                                ? "#dc2626"
                                : "#374151",
                          }}
                        >
                          {assessment.result ||
                            "Pending"}
                        </div>
                      </div>

                      <div>
                        <div
                          style={
                            styles.infoLabel
                          }
                        >
                          Pass Threshold
                        </div>

                        <div
                          style={
                            styles.assessmentValue
                          }
                        >
                          {
                            assessment.pass_threshold
                          }
                          %
                        </div>
                      </div>

                    </div>

                  </div>
                )}

                {/* NEXT RECRUITMENT STAGE */}

                {decision?.decision ===
                  "shortlisted" && (
                  <div
                    style={
                      styles.assessmentSection
                    }
                  >

                    {/* NO ASSESSMENT */}

                    {!assessment && (
                      <>
                        <div>
                          <h3
                            style={
                              styles.assessmentHeading
                            }
                          >
                            Candidate Assessment
                          </h3>

                          <p
                            style={
                              styles.assessmentDescription
                            }
                          >
                            Create and provide an
                            assessment for this
                            shortlisted candidate.
                          </p>
                        </div>

                        <button
                          style={
                            styles.assessmentButton
                          }
                          onClick={() =>
                            provideAssessment(
                              applicationId
                            )
                          }
                          disabled={
                            processing ||
                            !applicationId
                          }
                        >
                          Provide Assessment
                        </button>
                      </>
                    )}

                    {/* ASSESSMENT PASSED */}

                    {assessment &&
                      assessment.status ===
                        "Completed" &&
                      assessment.result ===
                        "Passed" && (
                        <>
                          <div>
                            <h3
                              style={
                                styles.assessmentHeading
                              }
                            >
                              AI Interview
                            </h3>

                            <p
                              style={{
                                ...styles.assessmentDescription,
                                color:
                                  "#166534",
                                fontWeight:
                                  "600",
                              }}
                            >
                              Candidate is eligible
                              for AI Interview
                            </p>
                          </div>

                          <button
                            style={
                              styles.assessmentButton
                            }
                            onClick={() =>
                              navigate(
                                `/ai-interviews?applicationId=${applicationId}`
                              )
                            }
                            disabled={
                              processing ||
                              !applicationId
                            }
                          >
                            Create AI Interview
                          </button>
                        </>
                      )}

                    {/* ASSESSMENT FAILED */}

                    {assessment &&
                      assessment.status ===
                        "Completed" &&
                      assessment.result ===
                        "Failed" && (
                        <div>
                          <h3
                            style={
                              styles.assessmentHeading
                            }
                          >
                            Assessment Failed
                          </h3>

                          <p
                            style={{
                              ...styles.assessmentDescription,
                              color:
                                "#dc2626",
                              fontWeight:
                                "600",
                            }}
                          >
                            Candidate is not eligible
                            for AI Interview.
                          </p>
                        </div>
                      )}

                    {/* ASSESSMENT IN PROGRESS */}

                    {assessment &&
                      assessment.status !==
                        "Completed" && (
                        <>
                          <div>
                            <h3
                              style={
                                styles.assessmentHeading
                              }
                            >
                              Candidate Assessment
                            </h3>

                            <p
                              style={
                                styles.assessmentDescription
                              }
                            >
                              Assessment is currently{" "}
                              <strong>
                                {
                                  assessment.status
                                }
                              </strong>
                              .
                            </p>
                          </div>

                          <button
                            style={
                              styles.assessmentButton
                            }
                            onClick={() =>
                              provideAssessment(
                                applicationId
                              )
                            }
                            disabled={
                              processing ||
                              !applicationId
                            }
                          >
                            View / Provide Assessment
                          </button>
                        </>
                      )}

                  </div>
                )}

                {/* ACTION BUTTONS */}

                {!decision && (
                  <div
                    style={
                      styles.cardActions
                    }
                  >

                    <button
                      style={
                        styles.shortlistButton
                      }
                      onClick={() =>
                        shortlistCandidate(
                          applicationId
                        )
                      }
                      disabled={
                        processing ||
                        !applicationId ||
                        !eligible
                      }
                    >
                      Shortlist
                    </button>

                    <button
                      style={
                        styles.rejectButton
                      }
                      onClick={() =>
                        rejectCandidate(
                          applicationId
                        )
                      }
                      disabled={
                        processing ||
                        !applicationId
                      }
                    >
                      Reject
                    </button>

                  </div>
                )}

              </div>
            );
          }
        )}

    </div>
  );
};

// =============================================================
// STYLES
// =============================================================

const styles = {
  filterBar: {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
  },

  filterButton: {
    padding: "10px 20px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    background: "#ffffff",
    cursor: "pointer",
    fontWeight: "600",
  },

  activeFilter: {
    padding: "10px 20px",
    border: "1px solid #2563eb",
    borderRadius: "8px",
    background: "#2563eb",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: "600",
  },

  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "32px",
    backgroundColor: "#f8fafc",
    minHeight: "100vh",
  },

  center: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
  },

  header: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "28px",
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
    marginTop: "8px",
    color: "#64748b",
    fontSize: "15px",
  },

  thresholdBox: {
    border: "1px solid #bfdbfe",
    backgroundColor: "#eff6ff",
    borderRadius: "10px",
    padding: "15px 22px",
    textAlign: "center",
  },

  thresholdLabel: {
    color: "#475569",
    fontSize: "13px",
  },

  thresholdValue: {
    color: "#2563eb",
    fontSize: "24px",
    fontWeight: "700",
    marginTop: "4px",
  },

  actionBar: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "16px",
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },

  selectionText: {
    marginLeft: "auto",
    color: "#475569",
    fontWeight: "600",
  },

  primaryButton: {
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    padding: "11px 18px",
    cursor: "pointer",
    fontWeight: "600",
  },

  secondaryButton: {
    backgroundColor: "#ffffff",
    color: "#334155",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    padding: "11px 18px",
    cursor: "pointer",
    fontWeight: "600",
  },

  dangerButton: {
    backgroundColor: "#dc2626",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    padding: "11px 18px",
    cursor: "pointer",
    fontWeight: "600",
  },

  emptyBox: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "40px",
    textAlign: "center",
    color: "#64748b",
  },

  card: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "26px",
    marginBottom: "20px",
    boxShadow:
      "0 2px 5px rgba(0,0,0,0.04)",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
  },

  leftSection: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },

  checkbox: {
    width: "20px",
    height: "20px",
  },

  candidateName: {
    margin: 0,
    fontSize: "24px",
    color: "#1e293b",
  },

  position: {
    margin: "5px 0 0",
    color: "#64748b",
    fontSize: "16px",
  },

  scoreContainer: {
    textAlign: "right",
  },

  scoreLabel: {
    color: "#64748b",
    fontSize: "13px",
  },

  score: {
    fontSize: "28px",
    fontWeight: "700",
    marginTop: "5px",
  },

  eligibilityBox: {
    border: "1px solid",
    borderRadius: "10px",
    padding: "16px",
    marginTop: "24px",
  },

  eligibilityTitle: {
    margin: 0,
    fontSize: "17px",
  },

  eligibilityText: {
    margin: "6px 0 0",
    fontSize: "15px",
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: "20px",
    marginTop: "24px",
  },

  infoLabel: {
    color: "#64748b",
    fontSize: "13px",
    marginBottom: "5px",
  },

  infoValue: {
    color: "#1e293b",
    fontSize: "15px",
    fontWeight: "500",
    wordBreak: "break-word",
  },

  decisionBox: {
    marginTop: "20px",
    padding: "16px",
    border: "1px solid #e2e8f0",
    backgroundColor: "#f8fafc",
    borderRadius: "9px",
    color: "#1e293b",
  },

  reason: {
    margin: "8px 0 0",
    color: "#64748b",
  },

  assessmentResultBox: {
    marginTop: "20px",
    padding: "20px",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    backgroundColor: "#f8fafc",
  },

  assessmentTitle: {
    margin: 0,
    fontSize: "18px",
    color: "#1e293b",
  },

  assessmentStatus: {
    color: "#475569",
    marginTop: "10px",
  },

  assessmentGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: "30px",
    marginTop: "15px",
  },

  assessmentValue: {
    fontSize: "17px",
    fontWeight: "700",
    color: "#1e293b",
  },

  assessmentSection: {
    borderTop:
      "1px solid #e2e8f0",
    marginTop: "22px",
    paddingTop: "22px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
  },

  assessmentHeading: {
    margin: 0,
    fontSize: "19px",
    color: "#1e293b",
  },

  assessmentDescription: {
    color: "#64748b",
    margin: "7px 0 0",
  },

  assessmentButton: {
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    padding: "13px 22px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  cardActions: {
    display: "flex",
    gap: "10px",
    marginTop: "22px",
    paddingTop: "20px",
    borderTop:
      "1px solid #e2e8f0",
  },

  shortlistButton: {
    backgroundColor: "#16a34a",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    padding: "11px 20px",
    cursor: "pointer",
    fontWeight: "600",
  },

  rejectButton: {
    backgroundColor: "#dc2626",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    padding: "11px 20px",
    cursor: "pointer",
    fontWeight: "600",
  },

  errorBox: {
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "15px",
  },
};

export default Shortlisting;