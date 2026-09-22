import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

const API_BASE =
  import.meta.env.VITE_API_BASE || "http://localhost:8000";

// -----------------------------------------------------------------
// Proctoring constants
// -----------------------------------------------------------------

const VIOLATION_THRESHOLD = 3;
const VIOLATION_COOLDOWN_MS = 8000;

const VOICE_RMS_THRESHOLD = 0.06;
const VOICE_SUSTAIN_MS = 1500;

const VIOLATION_LABELS = {
  tab_switch: "You switched away from this tab",
  fullscreen_exit: "You exited fullscreen mode",
  camera_off: "Your camera was turned off or disconnected",
  voice_detected: "Talking was detected during the assessment",
};

// -----------------------------------------------------------------
// Component
// -----------------------------------------------------------------

const Assessment = () => {
  const { token } = useParams();

  const [assessment, setAssessment] = useState(null);
  const [answers, setAnswers] = useState([]);

  const [currentQuestion, setCurrentQuestion] = useState(0);

  const [timeRemaining, setTimeRemaining] = useState(null);
  const [terminationReason, setTerminationReason] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  // loading | precheck | in_progress | terminated | completed
  const [phase, setPhase] = useState("loading");

  const [mediaReady, setMediaReady] = useState(false);
  const [mediaError, setMediaError] = useState("");

  const [violations, setViolations] = useState([]);
  const [warningMessage, setWarningMessage] = useState("");

  const [fullscreenBlocked, setFullscreenBlocked] = useState(false);

  // -----------------------------------------------------------------
  // Refs
  // -----------------------------------------------------------------

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const audioContextRef = useRef(null);
  const voiceIntervalRef = useRef(null);

  const talkingSinceRef = useRef(null);
  const lastViolationAtRef = useRef({});

  const answersRef = useRef([]);
  const phaseRef = useRef(phase);

  // Keep latest answers available to event listeners.
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  // Keep latest phase available to event listeners.
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // -----------------------------------------------------------------
  // Load assessment
  // -----------------------------------------------------------------

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
          throw new Error(
            data.detail || "Unable to load assessment"
          );
        }

        setAssessment(data);

        const restoredAnswers =
          data.saved_answers ||
          new Array(data.total_questions).fill(null);

        setAnswers(restoredAnswers);

        const firstUnanswered = restoredAnswers.findIndex(
          (answer) => answer === null
        );

        setCurrentQuestion(
          firstUnanswered === -1
            ? data.total_questions - 1
            : firstUnanswered
        );

        setPhase("precheck");
      } catch (err) {
        console.error("Failed to load assessment:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadAssessment();
  }, [token]);

  // -----------------------------------------------------------------
  // Stop camera/microphone monitoring
  // -----------------------------------------------------------------

  const stopMonitoring = useCallback(() => {
    if (voiceIntervalRef.current) {
      clearInterval(voiceIntervalRef.current);
      voiceIntervalRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });

      streamRef.current = null;
    }

    document.removeEventListener(
      "visibilitychange",
      handleVisibilityChange
    );
  }, []);


  // Cleanup on component unmount.
  useEffect(() => {
    return () => stopMonitoring();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -----------------------------------------------------------------
  // Report tab/browser close
  // -----------------------------------------------------------------

  const reportTabClose = () => {
    if (phaseRef.current !== "in_progress") {
      return;
    }

    const url =
      `${API_BASE}/assessments/access/${token}/tab-close`;

    const payload = JSON.stringify({});

    // sendBeacon is reliable while the page is unloading.
    if (navigator.sendBeacon) {
      const blob = new Blob(
        [payload],
        { type: "text/plain" }
      );

      navigator.sendBeacon(url, blob);
    } else {
      fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
        },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  };

  // Detect browser/tab close.
  useEffect(() => {
    const handlePageHide = () => {
      reportTabClose();
    };

    window.addEventListener(
      "pagehide",
      handlePageHide
    );

    return () => {
      window.removeEventListener(
        "pagehide",
        handlePageHide
      );
    };
  }, [token]);

  // -----------------------------------------------------------------
  // Format timer
  // -----------------------------------------------------------------

  const formatTime = (milliseconds) => {
    if (milliseconds === null) {
      return "--:--";
    }

    const totalSeconds = Math.ceil(
      milliseconds / 1000
    );

    const minutes = Math.floor(
      totalSeconds / 60
    );

    const seconds = totalSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      seconds
    ).padStart(2, "0")}`;
  };

  // -----------------------------------------------------------------
  // Submit helper
  // -----------------------------------------------------------------

  const submitToServer = async (
    submittedAnswers,
    terminatedReason = null
  ) => {
    const response = await fetch(
      `${API_BASE}/assessments/access/${token}/submit`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answers: submittedAnswers,
          terminated_reason:
            terminatedReason || null,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail ||
          "Failed to submit assessment"
      );
    }

    return data;
  };

  // -----------------------------------------------------------------
  // Time expired
  // -----------------------------------------------------------------

  const handleTimeExpired = async () => {
    if (phaseRef.current !== "in_progress") {
      return;
    }

    setTerminationReason("time_expired");
    setPhase("completed");
    setSubmitting(true);

    try {
      const data = await submitToServer(
        answersRef.current,
        "time_expired"
      );

      stopMonitoring();

      setResult(data);
    } catch (err) {
      console.error(
        "Automatic submission failed:",
        err
      );

      setError(
        "Time expired, but automatic submission failed. Please contact HR."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // -----------------------------------------------------------------
  // Timer
  //
  // IMPORTANT:
  // The timer is calculated from assessment.exam_deadline.
  // It does NOT locally reset to 25 minutes.
  // -----------------------------------------------------------------

  useEffect(() => {
    if (
      !assessment?.exam_deadline ||
      phase !== "in_progress"
    ) {
      return;
    }

    let timer;

    const updateTimer = () => {
      const remaining = Math.max(
        0,
        new Date(
          assessment.exam_deadline
        ).getTime() - Date.now()
      );

      setTimeRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
        handleTimeExpired();
      }
    };

    timer = setInterval(
      updateTimer,
      1000
    );

    updateTimer();

    return () => {
      clearInterval(timer);
    };
  }, [assessment, phase]);

  // -----------------------------------------------------------------
  // Violation reporting
  // -----------------------------------------------------------------

  const reportViolationToServer = (
    violationType
  ) => {
    fetch(
      `${API_BASE}/assessments/access/${token}/violation`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          violation_type: violationType,
        }),
      }
    ).catch(() => {
      // Best effort only.
    });
  };

  // -----------------------------------------------------------------
  // Force submit after proctoring violations
  // -----------------------------------------------------------------

  const forceSubmit = async (
    violationType
  ) => {
    setPhase("terminated");
    setTerminationReason(violationType);

    stopMonitoring();

    try {
      const data = await submitToServer(
        answersRef.current,
        violationType
      );

      setResult(data);
    } catch (err) {
      console.error(
        "Forced submission failed:",
        err
      );

      setError(err.message);
    }
  };

  // -----------------------------------------------------------------
  // Violation handler
  // -----------------------------------------------------------------

  const flagViolation = useCallback(
    (violationType) => {
      if (
        phaseRef.current !==
        "in_progress"
      ) {
        return;
      }

      const now = Date.now();

      const lastAt =
        lastViolationAtRef.current[
          violationType
        ] || 0;

      if (
        now - lastAt <
        VIOLATION_COOLDOWN_MS
      ) {
        return;
      }

      lastViolationAtRef.current[
        violationType
      ] = now;

      reportViolationToServer(
        violationType
      );

      setViolations((previous) => {
        const updated = [
          ...previous,
          {
            type: violationType,
            at: now,
          },
        ];

        setWarningMessage(
          `${VIOLATION_LABELS[violationType]}. Warning ${updated.length} of ${VIOLATION_THRESHOLD}.`
        );

        if (
          updated.length >=
          VIOLATION_THRESHOLD
        ) {
          forceSubmit(
            violationType
          );
        }

        return updated;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // -----------------------------------------------------------------
  // Tab switch detection
  // -----------------------------------------------------------------

  function handleVisibilityChange() {
    if (document.hidden) {
      flagViolation(
        "tab_switch"
      );
    }
  }

    // -----------------------------------------------------------------
  // Fullscreen exit detection
  // -----------------------------------------------------------------

  const handleFullscreenChange = useCallback(() => {
  if (
    phaseRef.current !== "in_progress"
  ) {
    return;
  }

  if (!document.fullscreenElement) {
    setFullscreenBlocked(true);
    flagViolation("fullscreen_exit");
  } else {
    setFullscreenBlocked(false);
  }
}, [flagViolation]);

    useEffect(() => {
    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange
    );

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      );
    };
  }, [handleFullscreenChange]);
  // -----------------------------------------------------------------
  // Camera + microphone
  // -----------------------------------------------------------------

  const requestMediaAccess =
    async () => {
      setMediaError("");

      try {
        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              video: true,
              audio: true,
            }
          );

        streamRef.current =
          stream;

        setMediaReady(true);
      } catch (err) {
        console.error(
          "Media access denied:",
          err
        );

        setMediaError(
          "Camera and microphone access are required to take this assessment. Please allow access and try again."
        );
      }
    };

  // Attach stream to video element.
  useEffect(() => {
    if (
      videoRef.current &&
      streamRef.current
    ) {
      videoRef.current.srcObject =
        streamRef.current;
    }
  }, [mediaReady, phase]);

  // -----------------------------------------------------------------
  // Start monitoring
  // -----------------------------------------------------------------

  const beginMonitoring = (
    stream
  ) => {
    // Camera-off detection.
    const videoTrack =
      stream.getVideoTracks()[0];

    if (videoTrack) {
      videoTrack.onended = () => {
        flagViolation(
          "camera_off"
        );
      };
    }

    // Tab-switch detection.
    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    // Voice detection.
    const AudioContextClass =
      window.AudioContext ||
      window.webkitAudioContext;

    if (AudioContextClass) {
      const audioContext =
        new AudioContextClass();

      const source =
        audioContext.createMediaStreamSource(
          stream
        );

      const analyser =
        audioContext.createAnalyser();

      analyser.fftSize = 2048;

      source.connect(analyser);

      const data =
        new Uint8Array(
          analyser.fftSize
        );

      voiceIntervalRef.current =
        setInterval(() => {
          analyser.getByteTimeDomainData(
            data
          );

          let sumSquares = 0;

          for (
            let i = 0;
            i < data.length;
            i++
          ) {
            const normalized =
              (data[i] - 128) /
              128;

            sumSquares +=
              normalized *
              normalized;
          }

          const rms = Math.sqrt(
            sumSquares /
              data.length
          );

          if (
            rms >
            VOICE_RMS_THRESHOLD
          ) {
            if (
              !talkingSinceRef.current
            ) {
              talkingSinceRef.current =
                Date.now();
            } else if (
              Date.now() -
                talkingSinceRef.current >
              VOICE_SUSTAIN_MS
            ) {
              flagViolation(
                "voice_detected"
              );

              talkingSinceRef.current =
                null;
            }
          } else {
            talkingSinceRef.current =
              null;
          }
        }, 200);

      audioContextRef.current =
        audioContext;
    }
  };

  // -----------------------------------------------------------------
  // Start assessment
  // -----------------------------------------------------------------

    const handleStartAssessment =
    async () => {
      if (!streamRef.current) {
        return;
      }

      try {
        // Request fullscreen from the user's click.
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        }
      } catch (err) {
        console.error(
          "Fullscreen request failed:",
          err
        );
      }

      beginMonitoring(
        streamRef.current
      );

      setPhase(
        "in_progress"
      );
    };

  // -----------------------------------------------------------------
  // Save answer
  // -----------------------------------------------------------------

  const handleAnswer = async (
    questionIndex,
    option
  ) => {
    // Update UI immediately.
    setAnswers((previous) => {
      const updated = [
        ...previous,
      ];

      updated[questionIndex] =
        option;

      return updated;
    });

    // Save to backend.
    try {
      const response =
        await fetch(
          `${API_BASE}/assessments/access/${token}/answer`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              question_index:
                questionIndex,
              selected_option:
                option,
            }),
          }
        );

      if (!response.ok) {
        const data =
          await response.json();

        throw new Error(
          data.detail ||
            "Failed to save answer"
        );
      }
    } catch (err) {
      console.error(
        "Failed to save answer:",
        err
      );

      setError(
        "Unable to save your answer. Please check your connection."
      );
    }
  };

  // -----------------------------------------------------------------
  // Normal submit
  // -----------------------------------------------------------------

  const handleSubmit =
    async () => {
      if (
        answers.some(
          (answer) =>
            answer === null
        )
      ) {
        setError(
          "Please answer all questions before submitting."
        );

        return;
      }

      try {
        setSubmitting(true);
        setError("");

        const data =
          await submitToServer(
            answers,
            null
          );

        // Assessment is finished.
        setPhase(
          "completed"
        );

        stopMonitoring();

        setResult(data);
      } catch (err) {
        console.error(
          "Submit failed:",
          err
        );

        setError(
          err.message
        );
      } finally {
        setSubmitting(false);
      }
    };

  // -----------------------------------------------------------------
  // Loading
  // -----------------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>
          Loading assessment...
        </p>
      </div>
    );
  }

  // -----------------------------------------------------------------
  // Assessment unavailable
  // -----------------------------------------------------------------

  if (error && !assessment) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-lg w-full border rounded-xl p-6">
          <h1 className="text-xl font-semibold mb-3">
            Assessment unavailable
          </h1>

          <p className="text-red-600">
            {error}
          </p>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------
  // Result
  // -----------------------------------------------------------------

  if (result) {
    const wasTerminated =
      phase === "terminated";

    const wasTimeExpired =
      terminationReason ===
      "time_expired";

    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-lg w-full border rounded-xl p-8 text-center">
          <h1 className="text-2xl font-semibold mb-4">
            {wasTerminated
              ? "Assessment Ended Early"
              : "Assessment Completed"}
          </h1>

          {wasTimeExpired && (
            <p className="text-red-600 mb-4 text-sm">
              The 25-minute assessment
              time limit expired. Your
              answers were submitted
              automatically.
            </p>
          )}

          {wasTerminated &&
            !wasTimeExpired && (
              <p className="text-red-600 mb-4 text-sm">
                This assessment was
                ended automatically
                after repeated
                proctoring warnings.
                Only the answers
                submitted before that
                point were scored.
              </p>
            )}

          <p className="text-lg mb-2">
            Score:{" "}
            <strong>
              {result.score}%
            </strong>
          </p>

          <p className="mb-2">
            Result:{" "}
            <strong>
              {result.result}
            </strong>
          </p>

          <p className="text-sm text-gray-600">
            Correct answers:{" "}
            {result.correct_answers} /{" "}
            {result.total_questions}
          </p>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------
  // Terminating
  // -----------------------------------------------------------------

  if (
    phase === "terminated" &&
    !result
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-lg w-full border rounded-xl p-8 text-center">
          <h1 className="text-xl font-semibold mb-2">
            Ending assessment...
          </h1>

          <p className="text-gray-600 text-sm">
            Too many proctoring
            warnings were triggered.
            Submitting your answers
            now.
          </p>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------
  // Pre-check
  // -----------------------------------------------------------------

  if (phase === "precheck") {
    return (
      <div className="min-h-screen bg-slate-50 py-10 px-4">
        <div className="max-w-lg mx-auto bg-white border rounded-xl p-6">
          <h1 className="text-xl font-semibold mb-2">
            {assessment.position}{" "}
            Assessment
          </h1>

          <p className="text-gray-600 text-sm mb-5">
            This assessment is
            monitored. Your camera
            must stay on for the full
            duration, this browser tab
            must stay in focus, and
            talking during the
            assessment is flagged.
            After{" "}
            {VIOLATION_THRESHOLD}{" "}
            warnings of any kind, the
            assessment ends
            automatically.
          </p>

          <div className="bg-slate-100 rounded-lg overflow-hidden aspect-video mb-4 flex items-center justify-center">
            {mediaReady ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-sm text-gray-500">
                Camera preview will
                appear here
              </span>
            )}
          </div>

          {mediaError && (
            <div className="bg-red-100 text-red-700 text-sm p-3 rounded-lg mb-4">
              {mediaError}
            </div>
          )}

          {!mediaReady ? (
            <button
              onClick={
                requestMediaAccess
              }
              className="w-full bg-black text-white py-3 rounded-lg"
            >
              Enable Camera &amp;
              Microphone
            </button>
          ) : (
            <button
              onClick={
                handleStartAssessment
              }
              className="w-full bg-black text-white py-3 rounded-lg"
            >
              Start Assessment
            </button>
          )}
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------
  // In progress
  // -----------------------------------------------------------------

  const currentQuestionData =
    assessment.questions[
      currentQuestion
    ];

  const isLastQuestion =
    currentQuestion ===
    assessment.questions.length - 1;

  const isFirstQuestion =
    currentQuestion === 0;

  const currentAnswer =
    answers[currentQuestion];

  // -----------------------------------------------------------------
  // Next question
  // -----------------------------------------------------------------

  const handleNextQuestion =
    () => {
      if (
        currentAnswer === null ||
        currentAnswer === undefined
      ) {
        setError(
          "Please select an answer before continuing."
        );

        return;
      }

      setError("");

      if (!isLastQuestion) {
        setCurrentQuestion(
          (previous) =>
            previous + 1
        );
      }
    };

  // -----------------------------------------------------------------
  // Previous question
  // -----------------------------------------------------------------

  const handlePreviousQuestion =
    () => {
      setError("");

      if (!isFirstQuestion) {
        setCurrentQuestion(
          (previous) =>
            previous - 1
        );
      }
    };

  // -----------------------------------------------------------------
  // Main UI
  // -----------------------------------------------------------------

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Header */}

        <div className="bg-white border rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between gap-4">

            <div>
              <h1 className="text-2xl font-semibold">
                {assessment.position}{" "}
                Assessment
              </h1>

              <p className="text-gray-600 mt-2">
                Question{" "}
                {currentQuestion + 1}{" "}
                of{" "}
                {assessment.total_questions}
              </p>

              <p className="text-gray-600">
                Pass Threshold:{" "}
                {assessment.pass_threshold}%
              </p>

              <p className="text-gray-600">
                Assessment expires:{" "}
                {new Date(
                  assessment.expires_at
                ).toLocaleString()}
              </p>
            </div>

            {/* Timer */}

            <div className="text-center shrink-0">
              <p className="text-sm text-gray-500">
                Time Remaining
              </p>

              <p
                className={`font-bold text-2xl ${
                  timeRemaining !== null &&
                  timeRemaining <=
                    5 * 60 * 1000
                    ? "text-red-600"
                    : "text-black"
                }`}
              >
                {formatTime(
                  timeRemaining
                )}
              </p>
            </div>

            {/* Camera */}

            <div className="w-28 h-20 bg-slate-900 rounded-lg overflow-hidden shrink-0">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            </div>

          </div>
        </div>

        {/* Progress */}

        <div className="bg-white border rounded-xl p-4 mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>
              Progress
            </span>

            <span>
              {currentQuestion + 1}{" "}
              /{" "}
              {assessment.total_questions}
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-black h-2 rounded-full transition-all"
              style={{
                width: `${
                  ((currentQuestion + 1) /
                    assessment.total_questions) *
                  100
                }%`,
              }}
            />
          </div>
        </div>

        {/* Warning */}

        {warningMessage && (
          <div className="bg-amber-100 border border-amber-300 text-amber-800 text-sm p-4 rounded-lg mb-6">
            ⚠ {warningMessage}
          </div>
        )}

        {/* Error */}

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Current question */}

        <div className="bg-white border rounded-xl p-6 mb-6">

          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500">
              Question{" "}
              {currentQuestion + 1}
            </span>

            {currentQuestionData.skill && (
              <span className="text-xs bg-gray-100 px-3 py-1 rounded-full">
                {currentQuestionData.skill}
              </span>
            )}
          </div>

          <h2 className="text-lg font-medium mb-6">
            {currentQuestionData.question}
          </h2>

          <div className="space-y-3">
            {currentQuestionData.options.map(
              (option) => (
                <label
                  key={option}
                  className={`flex items-center gap-3 border rounded-lg p-4 cursor-pointer transition ${
                    currentAnswer ===
                    option
                      ? "border-black bg-gray-50"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion}`}
                    value={option}
                    checked={
                      currentAnswer ===
                      option
                    }
                    onChange={() =>
                      handleAnswer(
                        currentQuestion,
                        option
                      )
                    }
                  />

                  <span>
                    {option}
                  </span>
                </label>
              )
            )}
          </div>
        </div>

        {/* Navigation */}

        <div className="flex gap-3">

          <button
            onClick={
              handlePreviousQuestion
            }
            disabled={
              isFirstQuestion ||
              submitting
            }
            className="flex-1 border border-gray-300 bg-white text-black py-3 rounded-lg disabled:opacity-40"
          >
            Previous
          </button>

          {!isLastQuestion ? (
            <button
              onClick={
                handleNextQuestion
              }
              disabled={submitting}
              className="flex-1 bg-black text-white py-3 rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          ) : (
            <button
              onClick={
                handleSubmit
              }
              disabled={
                submitting ||
                answers.some(
                  (answer) =>
                    answer === null
                )
              }
              className="flex-1 bg-black text-white py-3 rounded-lg disabled:opacity-50"
            >
              {submitting
                ? "Submitting..."
                : "Submit Assessment"}
            </button>
          )}

        </div>
      </div>
      {fullscreenBlocked && (
          <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center shadow-2xl">
              <div className="text-4xl mb-4">
                🔒
              </div>

              <h2 className="text-2xl font-bold mb-3">
                Fullscreen Required
              </h2>

              <p className="text-gray-600 mb-6">
                You exited fullscreen mode.
                Please return to fullscreen
                to continue your assessment.
              </p>

              <button
                onClick={async () => {
                  try {
                    await document.documentElement.requestFullscreen();
                  } catch (err) {
                    console.error(
                      "Unable to restore fullscreen:",
                      err
                    );
                  }
                }}
                className="w-full bg-black text-white py-3 rounded-lg font-medium"
              >
                Return to Fullscreen
              </button>
            </div>
          </div>
        )}
    </div>
  );
};

export default Assessment;