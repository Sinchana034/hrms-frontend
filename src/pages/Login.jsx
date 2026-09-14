import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [stage, setStage] = useState("password");
  // password | mfa | signup

  const [factorId, setFactorId] = useState(null);

  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const navigate = useNavigate();


  // =========================================
  // LOGIN
  // =========================================

  async function handlePasswordSubmit(e) {
    e.preventDefault();

    setError(null);
    setMessage(null);

    const { error: signInError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (signInError) {
      setError(signInError.message);
      return;
    }


    // Check MFA

    const { data: factors } =
      await supabase.auth.mfa.listFactors();

    const totp =
      factors?.totp?.find(
        (f) => f.status === "verified"
      );


    if (totp) {
      setFactorId(totp.id);
      setStage("mfa");
    } else {
      navigate("/");
    }
  }


  // =========================================
  // MFA
  // =========================================

  async function handleMfaSubmit(e) {
    e.preventDefault();

    setError(null);

    const {
      data: challenge,
      error: challengeError,
    } = await supabase.auth.mfa.challenge({
      factorId,
    });


    if (challengeError) {
      setError(challengeError.message);
      return;
    }


    const { error: verifyError } =
      await supabase.auth.mfa.verify({
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


  // =========================================
  // SIGN UP
  // =========================================

  async function handleSignup(e) {
    e.preventDefault();

    setError(null);
    setMessage(null);


    const {
      data,
      error: signupError,
    } = await supabase.auth.signUp({
      email,
      password,
    });


    if (signupError) {
      setError(signupError.message);
      return;
    }


    // If email confirmation is enabled

    if (data.user && !data.session) {
      setMessage(
        "Account created successfully. Please check your email to confirm your account."
      );
    } else {
      setMessage(
        "Account created successfully. You can now sign in."
      );
    }
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas">

      <div className="w-full max-w-sm bg-white border border-line rounded-lg p-8">


        {/* Header */}

        <div className="font-display font-semibold text-lg text-ink mb-1">
          HRMS
        </div>


        <div className="text-sm text-muted mb-6">

          {stage === "password" &&
            "Sign in to the recruitment console"}

          {stage === "signup" &&
            "Create a new HRMS account"}

          {stage === "mfa" &&
            "Enter your authenticator code"}

        </div>


        {/* Error */}

        {error && (
          <div className="mb-4 rounded-md border border-bad/30 bg-bad/5 px-3 py-2 text-xs text-bad">
            {error}
          </div>
        )}


        {/* Success Message */}

        {message && (
          <div className="mb-4 rounded-md border border-green-300 bg-green-50 px-3 py-2 text-xs text-green-700">
            {message}
          </div>
        )}


        {/* ========================= */}
        {/* LOGIN */}
        {/* ========================= */}

        {stage === "password" && (

          <form
            onSubmit={handlePasswordSubmit}
            className="space-y-3"
          >

            <input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              required
              className="w-full border border-line rounded-md px-3 py-2 text-sm"
            /> 


            <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              required
              className="w-full border border-line rounded-md px-3 py-2 pr-10 text-sm"
            />

            <button
                type="button"
                onClick={() => {
                  setEmail("sinchana032004@gmail.com");
                  setPassword("rgtvertex");
                }}
                className="w-full border border-line rounded-md py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Fill Test Credentials
              </button>

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
            >
              {showPassword ? "👁️" : "👁️"}
            </button>
          </div>


            <button
              type="submit"
              className="w-full bg-accent text-white rounded-md py-2 text-sm font-medium hover:opacity-90"
            >
              Sign In
            </button>


            {/* Create Account */}

            <button
              type="button"
              onClick={() => {
                setStage("signup");
                setError(null);
                setMessage(null);
              }}
              className="w-full border border-line rounded-md py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Create New Account
            </button>

          </form>

        )}


        {/* ========================= */}
        {/* SIGN UP */}
        {/* ========================= */}

        {stage === "signup" && (

          <form
            onSubmit={handleSignup}
            className="space-y-3"
          >

            <input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              required
              className="w-full border border-line rounded-md px-3 py-2 text-sm"
            />


            <input
              type="password"
              placeholder="Create password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              required
              minLength={6}
              className="w-full border border-line rounded-md px-3 py-2 text-sm"
            />


            <button
              type="submit"
              className="w-full bg-accent text-white rounded-md py-2 text-sm font-medium hover:opacity-90"
            >
              Create Account
            </button>


            <button
              type="button"
              onClick={() => {
                setStage("password");
                setError(null);
                setMessage(null);
              }}
              className="w-full text-sm text-blue-600 hover:underline"
            >
              Already have an account? Sign In
            </button>

          </form>

        )}


        {/* ========================= */}
        {/* MFA */}
        {/* ========================= */}

        {stage === "mfa" && (

          <form
            onSubmit={handleMfaSubmit}
            className="space-y-3"
          >

            <input
              type="text"
              inputMode="numeric"
              placeholder="6-digit code"
              value={mfaCode}
              onChange={(e) =>
                setMfaCode(e.target.value)
              }
              required
              className="w-full border border-line rounded-md px-3 py-2 text-sm tracking-widest"
            />


            <button
              type="submit"
              className="w-full bg-accent text-white rounded-md py-2 text-sm font-medium hover:opacity-90"
            >
              Verify & Sign In
            </button>


            <button
              type="button"
              onClick={() => {
                setStage("password");
                setError(null);
              }}
              className="w-full text-sm text-blue-600 hover:underline"
            >
              Back to Sign In
            </button>

          </form>

        )}

      </div>

    </div>
  );
}