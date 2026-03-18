import { useState, useCallback, type FormEvent } from "react";
import {
  Sparkle,
  Eye,
  EyeSlash,
  EnvelopeSimple,
  Lock,
  ArrowRight,
  CircleNotch,
  Warning,
  GoogleLogo,
} from "@phosphor-icons/react";
import { useAuth } from "../lib/auth";

/* ═══════════════════════════════════════════════════════════
   AUTH SCREEN — Login / Signup with branded UI.
   Tabbed interface with email/password forms.
   ═══════════════════════════════════════════════════════════ */

type AuthTab = "sign-in" | "sign-up";

export function AuthScreen() {
  const { signIn, signUp, skipAuth, isDevMode, authState } = useAuth();
  const [tab, setTab] = useState<AuthTab>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError(null);
    setSuccess(null);
    setShowPassword(false);
  }, []);

  const switchTab = useCallback(
    (newTab: AuthTab) => {
      setTab(newTab);
      resetForm();
    },
    [resetForm]
  );

  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError(null);
      setSuccess(null);

      // Validation
      if (!email.trim()) {
        setError("Email is required");
        return;
      }
      if (!validateEmail(email)) {
        setError("Please enter a valid email address");
        return;
      }
      if (!password) {
        setError("Password is required");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }

      if (tab === "sign-up") {
        if (password !== confirmPassword) {
          setError("Passwords don't match");
          return;
        }
      }

      setLoading(true);
      try {
        if (tab === "sign-in") {
          const { error: authError } = await signIn(email, password);
          if (authError) setError(authError);
        } else {
          const { error: authError } = await signUp(email, password);
          if (authError) {
            // Check if it's a "check email" message (not really an error)
            if (authError.includes("check your email")) {
              setSuccess(authError);
            } else {
              setError(authError);
            }
          }
        }
      } catch {
        setError("An unexpected error occurred. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [email, password, confirmPassword, tab, signIn, signUp]
  );

  return (
    <div
      className="flex items-center justify-center min-h-screen w-full px-4"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.97 0.01 25) 0%, oklch(0.99 0.005 260) 50%, oklch(0.97 0.008 180) 100%)",
        fontFamily: "'Albert Sans', sans-serif",
      }}
    >
      <div className="w-full max-w-[420px]">
        {/* Logo & branding */}
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-[14px] flex items-center justify-center mx-auto mb-4 shadow-lg"
            style={{
              background: "oklch(0.7 0.18 25)",
              boxShadow:
                "0 4px 16px oklch(0.7 0.18 25 / 0.3), 0 2px 4px oklch(0 0 0 / 0.06)",
            }}
          >
            <Sparkle className="w-7 h-7 text-white" weight="fill" />
          </div>
          <h1
            style={{
              color: "oklch(0.2 0.02 260)",
              fontSize: "26px",
              fontWeight: 700,
              letterSpacing: "-0.01em",
            }}
          >
            Canto
          </h1>
          <p
            className="mt-1"
            style={{
              color: "oklch(0.5 0.02 260)",
              fontSize: "14px",
            }}
          >
            Project management for creative teams
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-[12px] overflow-hidden"
          style={{
            background: "white",
            boxShadow:
              "0 8px 32px oklch(0 0 0 / 0.06), 0 2px 8px oklch(0 0 0 / 0.04), 0 0 0 1px oklch(0 0 0 / 0.03)",
          }}
        >
          {/* Tab switcher */}
          <div
            className="flex border-b"
            style={{ borderColor: "oklch(0.94 0.008 260)" }}
          >
            {(["sign-in", "sign-up"] as AuthTab[]).map((t) => (
              <button
                key={t}
                onClick={() => switchTab(t)}
                className="flex-1 py-3.5 text-center relative transition-colors"
                style={{
                  color:
                    tab === t
                      ? "oklch(0.7 0.18 25)"
                      : "oklch(0.55 0.02 260)",
                  fontSize: "14px",
                  fontWeight: tab === t ? 600 : 400,
                }}
              >
                {t === "sign-in" ? "Sign In" : "Sign Up"}
                {tab === t && (
                  <div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] rounded-full"
                    style={{
                      width: "40px",
                      background: "oklch(0.7 0.18 25)",
                    }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
            {/* Error / Success message */}
            {error && (
              <div
                className="flex items-start gap-2.5 px-3.5 py-3 rounded-[6px]"
                style={{
                  background: "oklch(0.7 0.18 25 / 0.06)",
                  color: "oklch(0.55 0.18 25)",
                  fontSize: "13px",
                }}
              >
                <Warning
                  className="w-4 h-4 shrink-0 mt-0.5"
                  weight="fill"
                />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div
                className="flex items-start gap-2.5 px-3.5 py-3 rounded-[6px]"
                style={{
                  background: "oklch(0.65 0.15 180 / 0.08)",
                  color: "oklch(0.45 0.12 180)",
                  fontSize: "13px",
                }}
              >
                <Sparkle
                  className="w-4 h-4 shrink-0 mt-0.5"
                  weight="fill"
                />
                <span>{success}</span>
              </div>
            )}

            {/* Email */}
            <div>
              <label
                className="block mb-1.5"
                style={{
                  color: "oklch(0.35 0.02 260)",
                  fontSize: "13px",
                  fontWeight: 500,
                }}
              >
                Email
              </label>
              <div className="relative">
                <EnvelopeSimple
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px]"
                  style={{ color: "oklch(0.6 0.02 260)" }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full rounded-[6px] border pl-10 pr-4 py-2.5 outline-none transition-all"
                  style={{
                    borderColor: "oklch(0.92 0.01 260)",
                    fontSize: "14px",
                    color: "oklch(0.2 0.02 260)",
                    background: "oklch(0.985 0.003 260)",
                  }}
                  onFocus={(e) =>
                    (e.target.style.borderColor = "oklch(0.7 0.18 25 / 0.5)")
                  }
                  onBlur={(e) =>
                    (e.target.style.borderColor = "oklch(0.92 0.01 260)")
                  }
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                className="block mb-1.5"
                style={{
                  color: "oklch(0.35 0.02 260)",
                  fontSize: "13px",
                  fontWeight: 500,
                }}
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px]"
                  style={{ color: "oklch(0.6 0.02 260)" }}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    tab === "sign-up"
                      ? "Min. 6 characters"
                      : "Enter your password"
                  }
                  autoComplete={
                    tab === "sign-in" ? "current-password" : "new-password"
                  }
                  className="w-full rounded-[6px] border pl-10 pr-11 py-2.5 outline-none transition-all"
                  style={{
                    borderColor: "oklch(0.92 0.01 260)",
                    fontSize: "14px",
                    color: "oklch(0.2 0.02 260)",
                    background: "oklch(0.985 0.003 260)",
                  }}
                  onFocus={(e) =>
                    (e.target.style.borderColor = "oklch(0.7 0.18 25 / 0.5)")
                  }
                  onBlur={(e) =>
                    (e.target.style.borderColor = "oklch(0.92 0.01 260)")
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-black/5 transition-colors"
                  style={{ color: "oklch(0.55 0.02 260)" }}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeSlash className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password (signup only) */}
            {tab === "sign-up" && (
              <div>
                <label
                  className="block mb-1.5"
                  style={{
                    color: "oklch(0.35 0.02 260)",
                    fontSize: "13px",
                    fontWeight: 500,
                  }}
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px]"
                    style={{ color: "oklch(0.6 0.02 260)" }}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                    className="w-full rounded-[6px] border pl-10 pr-4 py-2.5 outline-none transition-all"
                    style={{
                      borderColor: "oklch(0.92 0.01 260)",
                      fontSize: "14px",
                      color: "oklch(0.2 0.02 260)",
                      background: "oklch(0.985 0.003 260)",
                    }}
                    onFocus={(e) =>
                      (e.target.style.borderColor = "oklch(0.7 0.18 25 / 0.5)")
                    }
                    onBlur={(e) =>
                      (e.target.style.borderColor = "oklch(0.92 0.01 260)")
                    }
                  />
                </div>
              </div>
            )}

            {/* Forgot password link */}
            {tab === "sign-in" && (
              <div className="text-right">
                <button
                  type="button"
                  className="transition-colors hover:underline"
                  style={{
                    color: "oklch(0.55 0.18 25)",
                    fontSize: "13px",
                    fontWeight: 500,
                  }}
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full rounded-[6px] py-2.5 transition-all duration-150 mt-2"
              style={{
                background: loading
                  ? "oklch(0.75 0.14 25)"
                  : "oklch(0.7 0.18 25)",
                color: "white",
                fontSize: "14px",
                fontWeight: 600,
                boxShadow:
                  "0 1px 3px oklch(0.7 0.18 25 / 0.3), 0 1px 2px oklch(0 0 0 / 0.04)",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.85 : 1,
              }}
              onMouseEnter={(e) => {
                if (!loading)
                  e.currentTarget.style.background = "oklch(0.65 0.18 25)";
              }}
              onMouseLeave={(e) => {
                if (!loading)
                  e.currentTarget.style.background = "oklch(0.7 0.18 25)";
              }}
            >
              {loading ? (
                <CircleNotch className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>
                    {tab === "sign-in"
                      ? "Sign In"
                      : "Create Account"}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 py-1">
              <div
                className="flex-1 h-px"
                style={{ background: "oklch(0.92 0.01 260)" }}
              />
              <span
                style={{
                  color: "oklch(0.6 0.02 260)",
                  fontSize: "12px",
                }}
              >
                or
              </span>
              <div
                className="flex-1 h-px"
                style={{ background: "oklch(0.92 0.01 260)" }}
              />
            </div>

            {/* Google OAuth */}
            <button
              type="button"
              className="flex items-center justify-center gap-2.5 w-full rounded-[6px] border py-2.5 transition-colors hover:bg-black/[0.02]"
              style={{
                borderColor: "oklch(0.92 0.01 260)",
                color: "oklch(0.3 0.02 260)",
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              <GoogleLogo className="w-[18px] h-[18px]" weight="bold" />
              <span>Continue with Google</span>
            </button>
          </form>
        </div>

        {/* Dev mode skip */}
        {authState === "unconfigured" && (
          <div className="mt-6 text-center">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[6px] mb-3"
              style={{
                background: "oklch(0.85 0.15 85 / 0.15)",
                color: "oklch(0.55 0.12 85)",
                fontSize: "12px",
                fontWeight: 500,
              }}
            >
              <Warning className="w-3.5 h-3.5" weight="fill" />
              <span>Supabase not configured — running in preview mode</span>
            </div>
            <br />
            <button
              onClick={skipAuth}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-[6px] transition-colors hover:bg-black/[0.04]"
              style={{
                color: "oklch(0.55 0.18 25)",
                fontSize: "14px",
                fontWeight: 500,
                border: "1px solid oklch(0.7 0.18 25 / 0.3)",
              }}
            >
              <Sparkle className="w-4 h-4" weight="fill" />
              <span>Enter Preview Mode</span>
            </button>
          </div>
        )}

        {/* Footer */}
        <p
          className="text-center mt-6"
          style={{
            color: "oklch(0.6 0.02 260)",
            fontSize: "12px",
          }}
        >
          By continuing, you agree to Canto Terms of Service
        </p>
      </div>
    </div>
  );
}