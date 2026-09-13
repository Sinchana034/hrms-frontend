import { supabase } from "./supabase";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";


async function authHeaders() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error("Supabase session error:", error);
    throw new Error(error.message);
  }

  const token = data.session?.access_token;

  if (!token) {
    throw new Error("No active login session");
  }

  console.log("Supabase session found:", {
    user: data.session?.user?.email,
    expiresAt: data.session?.expires_at,
  });

  return {
    Authorization: `Bearer ${token}`,
  };
}

async function request(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.auth === false ? {} : await authHeaders()),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));

    const error = new Error(
      body.detail || `Request failed: ${res.status}`
    );

    error.status = res.status;

    throw error;
  }

  if (res.status === 204) {
    return null;
  }

  return res.json();
}

export const api = {
  listApplications: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/applications${qs ? `?${qs}` : ""}`);
  },
  getApplication: (id) => request(`/applications/${id}`),
  evaluateApplication: (id) =>
  request(`/applications/${id}/evaluate`, {
    method: "POST",
  }),
  withdrawApplication: (id, reason) =>
    request(`/applications/${id}/withdraw`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  // Public — no auth header needed, used by the candidate-facing form.
  submitApplication: (payload) =>
    request("/applications", { method: "POST", body: JSON.stringify(payload), auth: false }),
    // Public — resume upload happens before final submit so the candidate
  // gets upload feedback while still filling out the rest of the form.
  // Needs its own CAPTCHA token since this request lands before the main
  // application submit (which already carries its own token).
  uploadResume: async (file, captchaToken) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("captcha_token", captchaToken);
    const res = await fetch(`${API_BASE}/applications/resume-upload`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail || `Resume upload failed: ${res.status}`);
    }
    return res.json();
  },
  // HR-only — short-lived signed URL, resume lives in a private bucket.
  getResumeUrl: (applicationId) => request(`/applications/${applicationId}/resume-url`),
  triggerDuplicateCheck: (applicationId) =>
    request(`/applications/${applicationId}/duplicate-check`, { method: "POST" }),

  // Duplicates (Section 6.3)
  listDuplicates: (status = "pending") =>
    request(`/duplicates?status=${status}`),

  resolveDuplicate: (duplicateId, resolution, canonicalApplicationId) =>
    request(`/duplicates/${duplicateId}/resolve`, {
      method: "POST",
      body: JSON.stringify({
        resolution,
        canonical_application_id: canonicalApplicationId,
      }),
    }),

  // Job Requirements
 // Public — used by the candidate application form
  listJobRequirements: () =>
    request("/job-requirements", {
      auth: false,
  }),

  getJobRequirement: (id) =>
    request(`/job-requirements/${id}`),

  createJobRequirement: (payload) =>
    request("/job-requirements", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateJobRequirement: (id, payload) =>
    request(`/job-requirements/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  deleteJobRequirement: (id) =>
    request(`/job-requirements/${id}`, {
      method: "DELETE",
    }),

  
    // Departments
  // Public — used by the candidate application form
  listDepartments: () =>
  request("/departments", {
    auth: false,
  }),

  getDepartment: (id) =>
    request(`/departments/${id}`),

  createDepartment: (payload) =>
    request("/departments", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateDepartment: (id, payload) =>
    request(`/departments/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  deleteDepartment: (id) =>
    request(`/departments/${id}`, {
      method: "DELETE",
    }),

  // ML Resume Shortlisting
  listShortlisting: () =>
    request("/shortlisting"),

  listShortlisted: () =>
    request("/shortlisting/shortlisted"),

  listNonShortlisted: () =>
    request("/shortlisting/non-shortlisted"),

  makeShortlistingDecision: (applicationId, decision, reason = null) =>
    request(`/shortlisting/${applicationId}/decision`, {
      method: "POST",
      body: JSON.stringify({
        decision,
        reason,
      }),
    }),
  // Email sync (Section 6.2)
  emailSyncStatus: () => request("/email-sync/status"),
  gmailConnectUrl: () => request("/email-sync/gmail/connect"),
  gmailSync: () => request("/email-sync/gmail/sync", { method: "POST" }),

  // Bounce / suppression (Section 10)
  listSuppressions: () => request("/suppression-list"),
  clearSuppression: (email) =>
    request(`/suppression-list/${encodeURIComponent(email)}/clear`, { method: "POST" }),

  me: () => request("/auth/me"),
  syncMfaStatus: () => request("/auth/mfa/sync-status", { method: "POST" }),


    // HR — Create candidate assessment
  createAssessment: (applicationId) =>
    request(`/assessments/${applicationId}/create`, {
      method: "POST",
    }),
    // HR — Get assessment result
 getAssessmentResult: async (applicationId) => {
  try {
    return await request(
      `/assessments/${applicationId}/result`
    );
  } catch (err) {
    if (err.status === 404) {
      console.log(
        `No assessment created yet for ${applicationId}`
      );

      return null;
    }

    throw err;
  }
},
  // =========================================================
  // Interviews
  // =========================================================

  listInterviews: () =>
    request("/interviews"),

  getInterview: (interviewId) =>
    request(`/interviews/${interviewId}`),

  getApplicationInterviews: (applicationId) =>
    request(`/interviews/application/${applicationId}`),

  createInterview: (payload) =>
    request("/interviews", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateInterview: (interviewId, payload) =>
    request(`/interviews/${interviewId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  cancelInterview: (interviewId) =>
    request(`/interviews/${interviewId}`, {
      method: "DELETE",
    }),

    // Candidate Assessment — public token-based access
  getAssessment: (token) =>
    request(`/assessments/access/${token}`, {
      auth: false,
    }),

  submitAssessment: (token, answers) =>
    request(`/assessments/access/${token}/submit`, {
      method: "POST",
      body: JSON.stringify({
        answers,
      }),
      auth: false,
    }),

      // HR — Create AI Interview
  createAIInterview: (applicationId) =>
    request(`/ai-interviews/${applicationId}/create`, {
      method: "POST",
    }),

// =========================================================
// Final Selection
// =========================================================

calculateFinalSelection: (
  applicationId,
  aiInterviewScore,
  hrInterviewScore
) =>
  request(
    `/final-selection/${applicationId}/calculate`,
    {
      method: "POST",
      body: JSON.stringify({
        ai_interview_score: Number(aiInterviewScore),
        hr_interview_score: Number(hrInterviewScore),
      }),
    }
  ),

getFinalSelection: (applicationId) =>
  request(`/final-selection/${applicationId}`),

getSelectedCandidates: () =>
  request("/final-selection/selected-candidates"),

getRejectedCandidates: () =>
  request("/final-selection/rejected-candidates"),

// =========================================================
// OFFER LETTERS
// =========================================================

generateOfferLetter: (
  applicationId,
  salary,
  joiningDate
) =>
  request(
    `/offer-letters/${applicationId}`,
    {
      method: "POST",

      body: JSON.stringify({
        salary,
        joining_date: joiningDate,
      }),
    }
  ),

getOfferLetters: () =>
  request("/offer-letters/"),
};

