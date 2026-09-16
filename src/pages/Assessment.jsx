import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

// -----------------------------------------------------------------
// Proctoring tuning constants — kept together and named so these
// are easy to find and adjust without hunting through the component.
// -----------------------------------------------------------------

// How many flagged violations (of any type, combined) before the
// assessment is automatically ended.
const VIOLATION_THRESHOLD = 3;

// Minimum time between two violations of the SAME type, so a single
// continuous event (e.g. one long tab-away, one long sentence spoken)
// counts once rather than spamming the violation count every tick.
const VIOLATION_COOLDOWN_MS = 8000;

// Voice detection: how loud (root-mean-square of the mic's time-domain
// signal, 0–1 scale) counts as "talking" rather than background noise,
// and how long that loudness must be sustained before it's flagged —
// this avoids counting a cough, a chair creak, or a door closing.
const VOICE_RMS_THRESHOLD = 0.06;
const VOICE_SUSTAIN_MS = 1500;

const VIOLATION_LABELS = {
  tab_switch: "You switched away from this tab",
  camera_off: "Your camera was turned off or disconnected",
  voice_detected: "Talking was detected during the assessment",
};

const Assessment = () => {
  const { token } = useParams();

  const [assessment, setAssessment] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  // phase: "loading" | "precheck" | "in_progress" | "terminated"
  const [phase, setPhase] = useState("loading");
  const [mediaReady, setMediaReady] = useState(false);
  const [mediaError, setMediaError] = useState("");
  const [violations, setViolations] = useState([]);
  const [warningMessage, setWarningMessage] = useState("");

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const voiceIntervalRef = useRef(null);
  const talkingSinceRef = useRef(null);
  const lastViolationAtRef = useRef({});

  // Kept in a ref (not state) so the auto-submit path always reads
  // the latest answers even inside listeners set up once on mount.
  const answersRef = useRef([]);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const phaseRef = useRef(phase);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // -----------------------------------------------------
  // Load assessment
  // -----------------------------------------------------

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
        setPhase("precheck");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadAssessment();
  }, [token]);

  // -----------------------------------------------------
  // Cleanup helper — stops every media resource. Called on
  // normal submit, forced termination, and unmount so nothing
  // keeps the camera/mic light on after the assessment ends.
  // -----------------------------------------------------

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
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    document.removeEventListener(
      "visibilitychange",
      handleVisibilityChange
    );
  }, []);

  useEffect(() => {
    return () => stopMonitoring();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -----------------------------------------------------
  // Violation handling
  // -----------------------------------------------------

  const reportViolationToServer = (violationType) => {
    fetch(`${API_BASE}/assessments/access/${token}/violation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ violation_type: violationType }),
    }).catch(() => {
      // Best-effort logging only — a network hiccup here must not
      // block or alter the candidate's local experience.
    });
  };

  const flagViolation = useCallback(
    (violationType) => {
      if (phaseRef.current !== "in_progress") return;

      const now = Date.now();
      const lastAt = lastViolationAtRef.current[violationType] || 0;

      if (now - lastAt < VIOLATION_COOLDOWN_MS) return;
      lastViolationAtRef.current[violationType] = now;

      reportViolationToServer(violationType);

      setViolations((previous) => {
        const updated = [
          ...previous,
          { type: violationType, at: now },
        ];

        setWarningMessage(
          `${VIOLATION_LABELS[violationType]}. Warning ${updated.length} of ${VIOLATION_THRESHOLD}.`
        );

        if (updated.length >= VIOLATION_THRESHOLD) {
          forceSubmit(violationType);
        }

        return updated;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  function handleVisibilityChange() {
    if (document.hidden) {
      flagViolation("tab_switch");
    }
  }

  // -----------------------------------------------------
  // Pre-check: request camera + mic, show live preview
  // -----------------------------------------------------

  const requestMediaAccess = async () => {
    setMediaError("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      streamRef.current = stream;
      setMediaReady(true);
    } catch (err) {
      console.error("Media access denied:", err);
      setMediaError(
        "Camera and microphone access are required to take this assessment. Please allow access and try again."
      );
    }
  };

  // The precheck and in-progress views each render their own <video>
  // element (different DOM nodes, same ref variable) — this runs
  // after either one mounts and attaches whatever stream we already
  // have, since setting streamRef.current alone doesn't trigger a
  // re-render or touch the DOM by itself.
  useEffect(() => {
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [mediaReady, phase]);

  const beginMonitoring = (stream) => {
    // Camera-off detection: if the video track ends (permission
    // revoked, device unplugged, tab loses the device to another
    // app) while the assessment is still in progress, that's a
    // violation.
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.onended = () => flagViolation("camera_off");
    }

    // Tab-switch detection.
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Voice detection — sample mic loudness periodically; only
    // flags after loudness is sustained for VOICE_SUSTAIN_MS, so
    // brief noises don't count.
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (AudioContextClass) {
      const audioContext = new AudioContextClass();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);

      const data = new Uint8Array(analyser.fftSize);

      voiceIntervalRef.current = setInterval(() => {
        analyser.getByteTimeDomainData(data);

        let sumSquares = 0;
        for (let i = 0; i < data.length; i++) {
          const normalized = (data[i] - 128) / 128;
          sumSquares += normalized * normalized;
        }
        const rms = Math.sqrt(sumSquares / data.length);

        if (rms > VOICE_RMS_THRESHOLD) {
          if (!talkingSinceRef.current) {
            talkingSinceRef.current = Date.now();
          } else if (
            Date.now() - talkingSinceRef.current >
            VOICE_SUSTAIN_MS
          ) {
            flagViolation("voice_detected");
            talkingSinceRef.current = null;
          }
        } else {
          talkingSinceRef.current = null;
        }
      }, 200);

      audioContextRef.current = audioContext;
    }
  };

  const handleStartAssessment = () => {
    if (!streamRef.current) return;
    beginMonitoring(streamRef.current);
    setPhase("in_progress");
  };

  // -----------------------------------------------------
  // Answering + submission
  // -----------------------------------------------------

  const handleAnswer = (questionIndex, option) => {
    setAnswers((previous) => {
      const updated = [...previous];
      updated[questionIndex] = option;
      return updated;
    });
  };

  const submitToServer = async (submittedAnswers, terminatedReason) => {
    const response = await fetch(
      `${API_BASE}/assessments/access/${token}/submit`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: submittedAnswers,
          terminated_reason: terminatedReason || null,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Failed to submit assessment");
    }

    return data;
  };

  const handleSubmit = async () => {
    if (answers.some((answer) => answer === null)) {
      setError("Please answer all questions before submitting.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const data = await submitToServer(answers, null);

      stopMonitoring();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const forceSubmit = async (violationType) => {
    setPhase("terminated");
    stopMonitoring();

    try {
      const data = await submitToServer(
        answersRef.current,
        violationType
      );
      setResult(data);
    } catch (err) {
      setError(err.message);
    }
  };

  // -----------------------------------------------------
  // Render states
  // -----------------------------------------------------

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
    const wasTerminated = phase === "terminated";

    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-lg w-full border rounded-xl p-8 text-center">
          <h1 className="text-2xl font-semibold mb-4">
            {wasTerminated
              ? "Assessment Ended Early"
              : "Assessment Completed"}
          </h1>

          {wasTerminated && (
            <p className="text-red-600 mb-4 text-sm">
              This assessment was ended automatically after repeated
              proctoring warnings ({VIOLATION_THRESHOLD} violations).
              Only the answers submitted before that point were scored.
            </p>
          )}

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

  if (phase === "terminated" && !result) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-lg w-full border rounded-xl p-8 text-center">
          <h1 className="text-xl font-semibold mb-2">
            Ending assessment...
          </h1>
          <p className="text-gray-600 text-sm">
            Too many proctoring warnings were triggered. Submitting your
            answers now.
          </p>
        </div>
      </div>
    );
  }

  // Pre-check gate — camera/mic permission required before the
  // candidate can see any questions.
  if (phase === "precheck") {
    return (
      <div className="min-h-screen bg-slate-50 py-10 px-4">
        <div className="max-w-lg mx-auto bg-white border rounded-xl p-6">
          <h1 className="text-xl font-semibold mb-2">
            {assessment.position} Assessment
          </h1>

          <p className="text-gray-600 text-sm mb-5">
            This assessment is monitored. Your camera must stay on for
            the full duration, this browser tab must stay in focus, and
            talking during the assessment is flagged. After{" "}
            {VIOLATION_THRESHOLD} warnings of any kind, the assessment
            ends automatically and is scored on whatever was answered
            so far.
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
                Camera preview will appear here
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
              onClick={requestMediaAccess}
              className="w-full bg-black text-white py-3 rounded-lg"
            >
              Enable Camera &amp; Microphone
            </button>
          ) : (
            <button
              onClick={handleStartAssessment}
              className="w-full bg-black text-white py-3 rounded-lg"
            >
              Start Assessment
            </button>
          )}
        </div>
      </div>
    );
  }

  // In progress — the original question flow, plus the small
  // persistent camera preview and violation warning banner.
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">

        <div className="bg-white border rounded-xl p-6 mb-6 flex items-start justify-between gap-4">
          <div>
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

        {warningMessage && (
          <div className="bg-amber-100 border border-amber-300 text-amber-800 text-sm p-4 rounded-lg mb-6">
            ⚠ {warningMessage}
          </div>
        )}

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
                    onChange={() => handleAnswer(index, option)}
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