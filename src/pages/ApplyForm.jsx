import { useEffect, useMemo, useState } from "react";
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

  // Departments
  const [departments, setDepartments] = useState([]);

  // Job requirements / positions
  const [jobRequirements, setJobRequirements] = useState([]);

  // Loading state for dropdowns
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Dropdown loading error
  const [optionsError, setOptionsError] = useState(null);

  // =========================================================
  // Load Departments + Job Requirements
  // =========================================================

  useEffect(() => {
    async function loadApplicationOptions() {
      try {
        setLoadingOptions(true);
        setOptionsError(null);

        const [departmentsData, jobRequirementsData] =
          await Promise.all([
            api.listDepartments(),
            api.listJobRequirements(),
          ]);

        setDepartments(departmentsData || []);
        setJobRequirements(jobRequirementsData || []);
      } catch (err) {
        console.error(
          "Failed to load departments or positions:",
          err
        );

        setOptionsError(
          "Unable to load available departments and positions. Please refresh the page."
        );
      } finally {
        setLoadingOptions(false);
      }
    }

    loadApplicationOptions();
  }, []);

  // =========================================================
  // Filter positions based on selected department
  // =========================================================

  const selectedDepartment = useMemo(() => {
    return departments.find(
      (department) =>
        department.name === form.department
    );
  }, [departments, form.department]);

  const availablePositions = useMemo(() => {
    if (!selectedDepartment) {
      return [];
    }

    return jobRequirements.filter(
      (requirement) =>
        requirement.department_id ===
        selectedDepartment.department_id
    );
  }, [jobRequirements, selectedDepartment]);

  // =========================================================
  // Update form field
  // =========================================================

  function update(field, value) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  // =========================================================
  // Department change
  // Reset position when department changes
  // =========================================================

  function handleDepartmentChange(value) {
    setForm((currentForm) => ({
      ...currentForm,
      department: value,
      position: "",
    }));
  }

  // =========================================================
  // Resume validation
  // =========================================================

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
      setResumeError(
        "Please upload a PDF, DOC, or DOCX file."
      );

      setResumeFile(null);
      return;
    }

    // Validate file size
    if (file.size > MAX_RESUME_MB * 1024 * 1024) {
      setResumeError(
        `File must be under ${MAX_RESUME_MB}MB.`
      );

      setResumeFile(null);
      return;
    }

    setResumeFile(file);
  }

  // =========================================================
  // Submit application
  // =========================================================

  async function handleSubmit(e) {
    e.preventDefault();

    setStatus("submitting");
    setError(null);

    // Check CAPTCHA
    if (!captchaToken) {
      setError(
        "Please complete the CAPTCHA verification."
      );

      setStatus("error");
      return;
    }

    // Check consent
    if (!form.consent_given) {
      setError(
        "Please accept the consent checkbox before submitting."
      );

      setStatus("error");
      return;
    }

    try {
      let resumePath = null;

      // Upload resume first
      if (resumeFile) {
        setResumeUploadState("uploading");

        const response =
          await api.uploadResume(
            resumeFile,
            captchaToken
          );

        resumePath = response.resume_path;

        setResumeUploadState("uploaded");
      }

      // Submit application
      await api.submitApplication({
        ...form,

        // Storage path returned by resume upload
        resume_url: resumePath,

        // CAPTCHA token
        captcha_token: captchaToken,
      });

      setStatus("done");
    } catch (err) {
      console.error(
        "Application submission error:",
        err
      );

      setError(
        err?.message ||
          "Something went wrong while submitting your application."
      );

      setStatus("error");

      setResumeUploadState((currentState) =>
        currentState === "uploading"
          ? "error"
          : currentState
      );
    }
  }

  // =========================================================
  // Success screen
  // =========================================================

  if (status === "done") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas px-4">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-display font-semibold text-ink">
            Application received
          </h1>

          <p className="mt-2 text-sm text-muted">
            Thanks — you'll get a confirmation email shortly,
            and we'll be in touch as your application moves
            through review.
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // Application form
  // =========================================================

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

        {/* General Error */}
        {error && (
          <div className="mb-4 rounded-md border border-bad/30 bg-bad/5 px-3 py-2 text-xs text-bad">
            {error}
          </div>
        )}

        {/* Department / Position Loading Error */}
        {optionsError && (
          <div className="mb-4 rounded-md border border-bad/30 bg-bad/5 px-3 py-2 text-xs text-bad">
            {optionsError}
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
                update(
                  "candidate_name",
                  e.target.value
                )
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
              onChange={(e) =>
                update("email", e.target.value)
              }
              className="w-full border border-line rounded-md px-3 py-2 text-sm"
              placeholder="you@example.com"
            />
          </Field>

          {/* Phone */}
          <Field label="Phone">
            <input
              type="tel"
              value={form.phone}
              onChange={(e) =>
                update("phone", e.target.value)
              }
              className="w-full border border-line rounded-md px-3 py-2 text-sm"
              placeholder="Phone number"
            />
          </Field>

          {/* Department + Position */}
          <div className="grid grid-cols-2 gap-3">

            {/* Department Dropdown */}
            <Field label="Department">
              <select
                required
                value={form.department}
                onChange={(e) =>
                  handleDepartmentChange(
                    e.target.value
                  )
                }
                disabled={loadingOptions}
                className="w-full border border-line rounded-md px-3 py-2 text-sm bg-white disabled:opacity-50"
              >
                <option value="">
                  {loadingOptions
                    ? "Loading..."
                    : "Select department"}
                </option>

                {departments.map((department) => (
                  <option
                    key={department.department_id}
                    value={department.name}
                  >
                    {department.name}
                  </option>
                ))}
              </select>
            </Field>

            {/* Position Dropdown */}
            <Field label="Position">
              <select
                required
                value={form.position}
                onChange={(e) =>
                  update(
                    "position",
                    e.target.value
                  )
                }
                disabled={
                  loadingOptions ||
                  !form.department
                }
                className="w-full border border-line rounded-md px-3 py-2 text-sm bg-white disabled:opacity-50"
              >
                <option value="">
                  {!form.department
                    ? "Select department first"
                    : loadingOptions
                    ? "Loading..."
                    : "Select position"}
                </option>

                {availablePositions.map(
                  (requirement) => (
                    <option
                      key={requirement.requirement_id}
                      value={requirement.position}
                    >
                      {requirement.position}
                    </option>
                  )
                )}
              </select>
            </Field>

          </div>

          {/* No positions available */}
          {form.department &&
            !loadingOptions &&
            availablePositions.length === 0 && (
              <div className="text-xs text-muted">
                No positions are currently available for
                this department.
              </div>
            )}

          {/* Portfolio / GitHub / LinkedIn */}
          <Field label="Portfolio / GitHub / LinkedIn (optional)">
            <div className="grid grid-cols-3 gap-2">

              <input
                type="url"
                placeholder="Portfolio"
                value={form.portfolio}
                onChange={(e) =>
                  update(
                    "portfolio",
                    e.target.value
                  )
                }
                className="border border-line rounded-md px-3 py-2 text-sm"
              />

              <input
                type="url"
                placeholder="GitHub"
                value={form.github}
                onChange={(e) =>
                  update(
                    "github",
                    e.target.value
                  )
                }
                className="border border-line rounded-md px-3 py-2 text-sm"
              />

              <input
                type="url"
                placeholder="LinkedIn"
                value={form.linkedin}
                onChange={(e) =>
                  update(
                    "linkedin",
                    e.target.value
                  )
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
              disabled={
                status === "submitting"
              }
              className="w-full text-sm text-muted file:mr-3 file:rounded-md file:border file:border-line file:bg-canvas file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-ink"
            />

            {/* Selected File */}
            {resumeFile &&
              resumeUploadState !== "error" && (
                <div className="mt-1 text-xs text-muted">
                  {resumeUploadState ===
                  "uploading"
                    ? "Uploading…"
                    : resumeUploadState ===
                      "uploaded"
                    ? `Uploaded: ${resumeFile.name}`
                    : resumeFile.name}
                </div>
              )}

            {/* Resume Error */}
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
                update(
                  "consent_given",
                  e.target.checked
                )
              }
              className="mt-0.5"
            />

            <span>
              I consent to my application data being
              processed for recruitment purposes, in line
              with the privacy notice.
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={
              status === "submitting" ||
              loadingOptions
            }
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

// =========================================================
// Reusable Field Component
// =========================================================

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