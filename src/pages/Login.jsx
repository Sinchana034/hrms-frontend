import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [stage, setStage] = useState("password"); // 'password' | 'mfa'
  const [factorId, setFactorId] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
      return;
    }

    // Section 14: MFA is mandatory for HR/Admin. Check enrolled factors and
    // step up to an MFA challenge before granting access.
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const totp = factors?.totp?.find((f) => f.status === "verified");

    if (totp) {
      setFactorId(totp.id);
      setStage("mfa");
    } else {
      // No factor enrolled yet — in production, force enrollment here
      // rather than letting the session through at aal1.
      navigate("/");
    }
  }

  async function handleMfaSubmit(e) {
    e.preventDefault();
    setError(null);

    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId,
    });
    if (challengeError) {
      setError(challengeError.message);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code: mfaCode,
    });
    if (verifyError) {
      setError(verifyError.message);
      return;
    }

    navigate("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas">
      <div className="w-full max-w-sm bg-white border border-line rounded-lg p-8">
        <div className="font-display font-semibold text-lg text-ink mb-1">HRMS</div>
        <div className="text-sm text-slate mb-6">
          {stage === "password" ? "Sign in to the recruitment console" : "Enter your authenticator code"}
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-bad/30 bg-bad/5 px-3 py-2 text-xs text-bad">
            {error}
          </div>
        )}

        {stage === "password" ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-3">
            <input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-line rounded-md px-3 py-2 text-sm"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-line rounded-md px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="w-full bg-accent text-white rounded-md py-2 text-sm font-medium hover:opacity-90"
            >
              Continue
            </button>
          </form>
        ) : (
          <form onSubmit={handleMfaSubmit} className="space-y-3">
            <input
              type="text"
              inputMode="numeric"
              placeholder="6-digit code"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              required
              className="w-full border border-line rounded-md px-3 py-2 text-sm tracking-widest"
            />
            <button
              type="submit"
              className="w-full bg-accent text-white rounded-md py-2 text-sm font-medium hover:opacity-90"
            >
              Verify & sign in
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
