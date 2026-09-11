import { useState } from "react";
import { api } from "../lib/api";
import TurnstileWidget from "../components/TurnstileWidget";

const EMPTY = {
  candidate_name: "",
  email: "",
  phone: "",
  department: "",
  position: "",
  portfolio: "",
  github: "",
  linkedin: "",
  consent_given: false,
};

const MAX_RESUME_MB = 5;

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export default function ApplyForm() {
  const [form, setForm] = useState(EMPTY);

  const [status, setStatus] = useState("idle");
  // idle | submitting | done | error

  const [error, setError] = useState(null);

  const [captchaToken, setCaptchaToken] = useState(null);

  const [resumeFile, setResumeFile] = useState(null);
  const [resumeError, setResumeError] = useState(null);
  const [resumeUploadState, setResumeUploadState] = useState("idle");
  // idle | uploading | uploaded | error

  function update(field, value) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  function handleResumeChange(e) {
    const file = e.target.files?.[0];

    setResumeError(null);
    setResumeUploadState("idle");

    if (!file) {
      setResumeFile(null);
      return;
    }

    // Validate file type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setResumeError("Please upload a PDF, DOC, or DOCX file.");
      setResumeFile(null);
      return;
    }

    // Validate file size
    if (file.size > MAX_RESUME_MB * 1024 * 1024) {
      setResumeError(`File must be under ${MAX_RESUME_MB}MB.`);
      setResumeFile(null);
      return;
    }

    setResumeFile(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setStatus("submitting");
    setError(null);

    // Check CAPTCHA before uploading resume/submitting application
    if (!captchaToken) {
      setError("Please complete the CAPTCHA verification.");
      setStatus("error");
      return;
    }

    // Check consent
    if (!form.consent_given) {
      setError("Please accept the consent checkbox before submitting.");
      setStatus("error");
      return;
    }

    try {
      let resumePath = null;

      // Upload resume first if one was selected
      if (resumeFile) {
        setResumeUploadState("uploading");

        const response = await api.uploadResume(resumeFile, captchaToken);

        resumePath = response.resume_path;

        setResumeUploadState("uploaded");
      }

      // Submit the complete application
      await api.submitApplication({
        ...form,

        // Backend expects resume_url
        // This is the storage path returned by resume-upload
        resume_url: resumePath,

        // Backend expects captcha_token
        captcha_token: captchaToken,
      });

      setStatus("done");
    } catch (err) {
      console.error("Application submission error:", err);

      setError(
        err?.message ||
          "Something went wrong while submitting your application."
      );

      setStatus("error");

      setResumeUploadState((currentState) =>
        currentState === "uploading" ? "error" : currentState
      );
    }
  }

  // Success screen
  if (status === "done") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas px-4">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-display font-semibold text-ink">
            Application received
          </h1>

          <p className="mt-2 text-sm text-muted">
            Thanks — you'll get a confirmation email shortly, and we'll be in
            touch as your application moves through review.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas py-12 px-4">
      <form
        onSubmit={handleSubmit}
        className="max-w-lg mx-auto bg-white border border-line rounded-lg p-8"
      >
        <h1 className="text-xl font-display font-semibold text-ink mb-1">
          Apply
        </h1>

        <p className="text-sm text-muted mb-6">
          No account needed — we'll email you at every stage.
        </p>

        {/* Error message */}
        {error && (
          <div className="mb-4 rounded-md border border-bad/30 bg-bad/5 px-3 py-2 text-xs text-bad">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {/* Full Name */}
          <Field label="Full name">
            <input
              type="text"
              required
              value={form.candidate_name}
              onChange={(e) =>
                update("candidate_name", e.target.value)
              }
              className="w-full border border-line rounded-md px-3 py-2 text-sm"
              placeholder="Enter your full name"
            />
          </Field>

          {/* Email */}
          <Field label="Email">
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className="w-full border border-line rounded-md px-3 py-2 text-sm"
              placeholder="you@example.com"
            />
          </Field>

          {/* Phone */}
          <Field label="Phone">
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              className="w-full border border-line rounded-md px-3 py-2 text-sm"
              placeholder="Phone number"
            />
          </Field>

          {/* Department + Position */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Department">
              <input
                type="text"
                required
                value={form.department}
                onChange={(e) =>
                  update("department", e.target.value)
                }
                className="w-full border border-line rounded-md px-3 py-2 text-sm"
                placeholder="Department"
              />
            </Field>

            <Field label="Position">
              <input
                type="text"
                required
                value={form.position}
                onChange={(e) =>
                  update("position", e.target.value)
                }
                className="w-full border border-line rounded-md px-3 py-2 text-sm"
                placeholder="Position"
              />
            </Field>
          </div>

          {/* Portfolio / GitHub / LinkedIn */}
          <Field label="Portfolio / GitHub / LinkedIn (optional)">
            <div className="grid grid-cols-3 gap-2">
              <input
                type="url"
                placeholder="Portfolio"
                value={form.portfolio}
                onChange={(e) =>
                  update("portfolio", e.target.value)
                }
                className="border border-line rounded-md px-3 py-2 text-sm"
              />

              <input
                type="url"
                placeholder="GitHub"
                value={form.github}
                onChange={(e) =>
                  update("github", e.target.value)
                }
                className="border border-line rounded-md px-3 py-2 text-sm"
              />

              <input
                type="url"
                placeholder="LinkedIn"
                value={form.linkedin}
                onChange={(e) =>
                  update("linkedin", e.target.value)
                }
                className="border border-line rounded-md px-3 py-2 text-sm"
              />
            </div>
          </Field>

          {/* Resume */}
          <Field label="Resume (PDF, DOC, or DOCX, max 5MB — optional)">
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleResumeChange}
              disabled={status === "submitting"}
              className="w-full text-sm text-muted file:mr-3 file:rounded-md file:border file:border-line file:bg-canvas file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-ink"
            />

            {/* Selected file */}
            {resumeFile && resumeUploadState !== "error" && (
              <div className="mt-1 text-xs text-muted">
                {resumeUploadState === "uploading"
                  ? "Uploading…"
                  : resumeUploadState === "uploaded"
                  ? `Uploaded: ${resumeFile.name}`
                  : resumeFile.name}
              </div>
            )}

            {/* Resume validation error */}
            {resumeError && (
              <div className="mt-1 text-xs text-bad">
                {resumeError}
              </div>
            )}
          </Field>

          {/* Consent */}
          <label className="flex items-start gap-2 text-xs text-muted pt-2">
            <input
              type="checkbox"
              required
              checked={form.consent_given}
              onChange={(e) =>
                update("consent_given", e.target.checked)
              }
              className="mt-0.5"
            />

            <span>
              I consent to my application data being processed for
              recruitment purposes, in line with the privacy notice.
            </span>
          </label>

          {/* CAPTCHA */}
          <TurnstileWidget
            onVerify={(token) => {
              setCaptchaToken(token);
              setError(null);
            }}
            onExpire={() => {
              setCaptchaToken(null);
            }}
          />

          {/* Submit */}
          <button
            type="submit"
            disabled={status === "submitting"}
            className="w-full bg-accent text-white rounded-md py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 mt-2"
          >
            {status === "submitting"
              ? "Submitting…"
              : "Submit application"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="text-xs font-medium text-muted mb-1">
        {label}
      </div>

      {children}
    </label>
  );
}