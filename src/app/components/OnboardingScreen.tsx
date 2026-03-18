import { useState, useRef, useCallback, type ChangeEvent } from "react";
import {
  Sparkle,
  ArrowRight,
  ArrowLeft,
  Camera,
  CircleNotch,
  User,
  Check,
  X,
  Briefcase,
} from "@phosphor-icons/react";
import { useAuth } from "../lib/auth";
import { AVATAR_COLORS } from "../lib/types";
import type { ProfileData } from "../lib/types";

/* ═══════════════════════════════════════════════════════════
   ONBOARDING SCREEN — 3-step wizard:
   Step 1: Display name + role
   Step 2: Avatar color selection + optional photo upload
   Step 3: Welcome / confirmation
   ═══════════════════════════════════════════════════════════ */

/** Color names for accessibility */
const COLOR_NAMES = [
  "Coral",
  "Peach",
  "Gold",
  "Lime",
  "Mint",
  "Teal",
  "Sky",
  "Blue",
  "Indigo",
  "Purple",
  "Magenta",
  "Pink",
  "Sand",
  "Slate",
];

export function OnboardingScreen() {
  const { profile, completeOnboarding, user, signOut } = useAuth();
  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState(() => {
    const parts = (profile?.displayName || "").trim().split(/\s+/);
    return parts[0] || "";
  });
  const [lastName, setLastName] = useState(() => {
    const parts = (profile?.displayName || "").trim().split(/\s+/);
    return parts.length > 1 ? parts.slice(1).join(" ") : "";
  });
  const [role, setRole] = useState(profile?.role || "");
  const [avatarColor, setAvatarColor] = useState(
    profile?.avatarColor || AVATAR_COLORS[0]
  );
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    profile?.avatarUrl || null
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalSteps = 3;

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0 || !parts[0]) return "?";
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleFileSelect = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) return; // 5MB limit

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const removePhoto = useCallback(() => {
    setAvatarUrl(null);
    setAvatarFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const canProceed = () => {
    if (step === 0) return firstName.trim().length >= 1 && lastName.trim().length >= 1;
    return true;
  };

  const handleComplete = useCallback(async () => {
    setLoading(true);
    try {
      const finalProfile: ProfileData = {
        ...(profile || {
          email: user?.email || "",
          theme: "light" as const,
          weekStart: "monday" as const,
          dateFormat: "mdy" as const,
        }),
        displayName: `${firstName.trim()} ${lastName.trim()}`.trim(),
        role: role.trim() || undefined,
        avatarColor,
        avatarUrl: avatarUrl || undefined,
        onboardingComplete: true,
      };

      // TODO: If avatarFile exists, upload to blob storage
      // and replace avatarUrl with the permanent URL.

      await completeOnboarding(finalProfile);
    } finally {
      setLoading(false);
    }
  }, [
    profile,
    user,
    firstName,
    lastName,
    role,
    avatarColor,
    avatarUrl,
    avatarFile,
    completeOnboarding,
  ]);

  const next = () => {
    if (step < totalSteps - 1) setStep(step + 1);
    else handleComplete();
  };

  const back = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen w-full px-4"
      style={{
        background:
          "linear-gradient(145deg, oklch(0.97 0.01 25) 0%, oklch(0.985 0.005 260) 40%, oklch(0.97 0.008 180) 100%)",
        fontFamily: "'Albert Sans', sans-serif",
      }}
    >
      <div className="w-full max-w-[480px]">
        {/* Logo */}
        <div className="text-center mb-6">
          <div
            className="w-12 h-12 rounded-[12px] flex items-center justify-center mx-auto mb-3 shadow-lg"
            style={{
              background: "oklch(0.7 0.18 25)",
              boxShadow:
                "0 4px 16px oklch(0.7 0.18 25 / 0.25), 0 2px 4px oklch(0 0 0 / 0.06)",
            }}
          >
            <Sparkle className="w-6 h-6 text-white" weight="fill" />
          </div>
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
          {/* Progress bar */}
          <div
            className="h-1"
            style={{ background: "oklch(0.94 0.008 260)" }}
          >
            <div
              className="h-full rounded-r-full transition-all duration-500 ease-out"
              style={{
                width: `${((step + 1) / totalSteps) * 100}%`,
                background: "oklch(0.7 0.18 25)",
              }}
            />
          </div>

          {/* Header */}
          <div className="px-6 pt-6 pb-2">
            <div className="flex items-center justify-between mb-1">
              <p
                style={{
                  color: "oklch(0.6 0.02 260)",
                  fontSize: "12px",
                  fontWeight: 500,
                }}
              >
                Step {step + 1} of {totalSteps}
              </p>
              <button
                onClick={signOut}
                className="p-1 rounded hover:bg-black/5 transition-colors"
                style={{ color: "oklch(0.6 0.02 260)" }}
                title="Sign out"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Step content */}
          <div className="px-6 pb-6">
            {/* ─── Step 0: Name & Role ─── */}
            {step === 0 && (
              <div className="space-y-5">
                <div>
                  <h2
                    style={{
                      color: "oklch(0.2 0.02 260)",
                      fontSize: "22px",
                      fontWeight: 700,
                    }}
                  >
                    Welcome to Canto
                  </h2>
                  <p
                    className="mt-1"
                    style={{
                      color: "oklch(0.5 0.02 260)",
                      fontSize: "14px",
                    }}
                  >
                    Let's set up your profile so your team knows who you
                    are.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      className="flex items-center gap-1.5 mb-1.5"
                      style={{
                        color: "oklch(0.35 0.02 260)",
                        fontSize: "13px",
                        fontWeight: 500,
                      }}
                    >
                      <User className="w-3.5 h-3.5" />
                      First Name
                      <span style={{ color: "oklch(0.7 0.18 25)" }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Jane"
                      maxLength={30}
                      autoFocus
                      className="w-full rounded-[6px] border px-3.5 py-2.5 outline-none transition-all"
                      style={{
                        borderColor: "oklch(0.92 0.01 260)",
                        fontSize: "14px",
                        color: "oklch(0.2 0.02 260)",
                        background: "oklch(0.985 0.003 260)",
                      }}
                      onFocus={(e) =>
                        (e.target.style.borderColor =
                          "oklch(0.7 0.18 25 / 0.5)")
                      }
                      onBlur={(e) =>
                        (e.target.style.borderColor = "oklch(0.92 0.01 260)")
                      }
                    />
                  </div>

                  <div>
                    <label
                      className="flex items-center gap-1.5 mb-1.5"
                      style={{
                        color: "oklch(0.35 0.02 260)",
                        fontSize: "13px",
                        fontWeight: 500,
                      }}
                    >
                      Last Name
                      <span style={{ color: "oklch(0.7 0.18 25)" }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                      maxLength={30}
                      className="w-full rounded-[6px] border px-3.5 py-2.5 outline-none transition-all"
                      style={{
                        borderColor: "oklch(0.92 0.01 260)",
                        fontSize: "14px",
                        color: "oklch(0.2 0.02 260)",
                        background: "oklch(0.985 0.003 260)",
                      }}
                      onFocus={(e) =>
                        (e.target.style.borderColor =
                          "oklch(0.7 0.18 25 / 0.5)")
                      }
                      onBlur={(e) =>
                        (e.target.style.borderColor = "oklch(0.92 0.01 260)")
                      }
                    />
                  </div>
                </div>

                <div>
                  <label
                    className="flex items-center gap-1.5 mb-1.5"
                    style={{
                      color: "oklch(0.35 0.02 260)",
                      fontSize: "13px",
                      fontWeight: 500,
                    }}
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    Role
                    <span
                      style={{
                        color: "oklch(0.6 0.02 260)",
                        fontWeight: 400,
                      }}
                    >
                      (optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Producer, Editor, Designer"
                    maxLength={40}
                    className="w-full rounded-[6px] border px-3.5 py-2.5 outline-none transition-all"
                    style={{
                      borderColor: "oklch(0.92 0.01 260)",
                      fontSize: "14px",
                      color: "oklch(0.2 0.02 260)",
                      background: "oklch(0.985 0.003 260)",
                    }}
                    onFocus={(e) =>
                      (e.target.style.borderColor =
                        "oklch(0.7 0.18 25 / 0.5)")
                    }
                    onBlur={(e) =>
                      (e.target.style.borderColor = "oklch(0.92 0.01 260)")
                    }
                  />
                </div>
              </div>
            )}

            {/* ─── Step 1: Avatar Color & Photo ─── */}
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <h2
                    style={{
                      color: "oklch(0.2 0.02 260)",
                      fontSize: "22px",
                      fontWeight: 700,
                    }}
                  >
                    Choose your avatar
                  </h2>
                  <p
                    className="mt-1"
                    style={{
                      color: "oklch(0.5 0.02 260)",
                      fontSize: "14px",
                    }}
                  >
                    Pick a color for your avatar, or upload a profile
                    photo.
                  </p>
                </div>

                {/* Preview avatar */}
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden"
                      style={{
                        background: avatarColor,
                      }}
                    >
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span
                          style={{
                            color: "white",
                            fontSize: "28px",
                            fontWeight: 700,
                            textShadow: "0 1px 2px oklch(0 0 0 / 0.15)",
                          }}
                        >
                          {getInitials(`${firstName.trim()} ${lastName.trim()}`)}
                        </span>
                      )}
                    </div>

                    {/* Camera button */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-md transition-transform hover:scale-105"
                      style={{
                        background: "oklch(0.7 0.18 25)",
                        color: "white",
                      }}
                    >
                      <Camera className="w-4 h-4" weight="fill" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="user"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                  </div>

                  <div className="flex-1">
                    <p
                      style={{
                        color: "oklch(0.25 0.02 260)",
                        fontSize: "16px",
                        fontWeight: 600,
                      }}
                    >
                      {`${firstName.trim()} ${lastName.trim()}`.trim() || "Your Name"}
                    </p>
                    {role && (
                      <p
                        style={{
                          color: "oklch(0.5 0.02 260)",
                          fontSize: "13px",
                        }}
                      >
                        {role}
                      </p>
                    )}
                    {avatarUrl && (
                      <button
                        onClick={removePhoto}
                        className="mt-1.5 flex items-center gap-1 transition-colors hover:underline"
                        style={{
                          color: "oklch(0.55 0.18 25)",
                          fontSize: "12px",
                          fontWeight: 500,
                        }}
                      >
                        <X className="w-3 h-3" />
                        Remove photo
                      </button>
                    )}
                  </div>
                </div>

                {/* Color grid */}
                <div>
                  <p
                    className="mb-2.5"
                    style={{
                      color: "oklch(0.4 0.02 260)",
                      fontSize: "13px",
                      fontWeight: 500,
                    }}
                  >
                    Avatar color
                  </p>
                  <div className="grid grid-cols-7 gap-2.5">
                    {AVATAR_COLORS.map((color, i) => {
                      const selected = avatarColor === color;
                      return (
                        <button
                          key={color}
                          onClick={() => setAvatarColor(color)}
                          className="w-full aspect-square rounded-full relative transition-transform hover:scale-110"
                          style={{
                            background: color,
                            boxShadow: selected
                              ? `0 0 0 2px white, 0 0 0 4px oklch(0.7 0.18 25)`
                              : "0 1px 3px oklch(0 0 0 / 0.1)",
                          }}
                          title={COLOR_NAMES[i]}
                        >
                          {selected && (
                            <Check
                              className="absolute inset-0 m-auto w-4 h-4"
                              weight="bold"
                              style={{
                                color: "white",
                                filter:
                                  "drop-shadow(0 1px 1px oklch(0 0 0 / 0.2))",
                              }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ─── Step 2: Welcome ─── */}
            {step === 2 && (
              <div className="space-y-5 text-center py-4">
                {/* Large avatar preview */}
                <div className="flex justify-center">
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center overflow-hidden shadow-lg"
                    style={{
                      background: avatarColor,
                      boxShadow: `0 4px 16px oklch(0 0 0 / 0.1), 0 0 0 3px white`,
                    }}
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span
                        style={{
                          color: "white",
                          fontSize: "36px",
                          fontWeight: 700,
                          textShadow: "0 1px 3px oklch(0 0 0 / 0.15)",
                        }}
                      >
                        {getInitials(`${firstName.trim()} ${lastName.trim()}`)}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h2
                    style={{
                      color: "oklch(0.2 0.02 260)",
                      fontSize: "22px",
                      fontWeight: 700,
                    }}
                  >
                    You're all set, {firstName.split(" ")[0]}!
                  </h2>
                  <p
                    className="mt-2 mx-auto max-w-sm"
                    style={{
                      color: "oklch(0.5 0.02 260)",
                      fontSize: "14px",
                      lineHeight: 1.6,
                    }}
                  >
                    Your workspace is ready. Start by creating your first
                    project, importing from Asana, or exploring the app.
                  </p>
                </div>

                {/* Quick action hints */}
                <div className="flex flex-col gap-2 max-w-xs mx-auto mt-2">
                  {[
                    { icon: "🎬", label: "Create a project" },
                    { icon: "📥", label: "Import from Asana" },
                    { icon: "⌨️", label: "Cmd+K to search anything" },
                  ].map((hint) => (
                    <div
                      key={hint.label}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-[6px] text-left"
                      style={{
                        background: "oklch(0.985 0.003 260)",
                        border: "1px solid oklch(0.94 0.008 260)",
                      }}
                    >
                      <span style={{ fontSize: "16px" }}>
                        {hint.icon}
                      </span>
                      <span
                        style={{
                          color: "oklch(0.35 0.02 260)",
                          fontSize: "13px",
                          fontWeight: 500,
                        }}
                      >
                        {hint.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t" style={{ borderColor: "oklch(0.94 0.008 260)" }}>
              {step > 0 ? (
                <button
                  onClick={back}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-[6px] transition-colors hover:bg-black/[0.04]"
                  style={{
                    color: "oklch(0.45 0.02 260)",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              ) : (
                <div />
              )}

              <button
                onClick={next}
                disabled={!canProceed() || loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-[6px] transition-all duration-150"
                style={{
                  background:
                    canProceed() && !loading
                      ? "oklch(0.7 0.18 25)"
                      : "oklch(0.85 0.06 25)",
                  color: "white",
                  fontSize: "14px",
                  fontWeight: 600,
                  opacity: canProceed() && !loading ? 1 : 0.6,
                  cursor:
                    canProceed() && !loading
                      ? "pointer"
                      : "not-allowed",
                  boxShadow: canProceed()
                    ? "0 1px 3px oklch(0.7 0.18 25 / 0.3)"
                    : "none",
                }}
                onMouseEnter={(e) => {
                  if (canProceed() && !loading)
                    e.currentTarget.style.background = "oklch(0.65 0.18 25)";
                }}
                onMouseLeave={(e) => {
                  if (canProceed() && !loading)
                    e.currentTarget.style.background = "oklch(0.7 0.18 25)";
                }}
              >
                {loading ? (
                  <CircleNotch className="w-5 h-5 animate-spin" />
                ) : step === totalSteps - 1 ? (
                  <>
                    <span>Get Started</span>
                    <Sparkle className="w-4 h-4" weight="fill" />
                  </>
                ) : (
                  <>
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}