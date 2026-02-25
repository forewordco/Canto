import { useEffect, useState } from "react";
import { Sparkle, CircleNotch, Warning, CheckCircle } from "@phosphor-icons/react";

/* ═══════════════════════════════════════════════════════════
   OAUTH CALLBACK HANDLER
   Detects ?code=&state= in the URL when window.opener exists.
   Exchanges the code via the parent window and posts a message
   back. Gmail callbacks use "gmail-" prefixed state values.
   ═══════════════════════════════════════════════════════════ */

type CallbackStatus = "processing" | "success" | "error";

interface OAuthCallbackProps {
  /** Called when OAuth processing is complete and this component should unmount */
  onComplete?: () => void;
}

export function OAuthCallback({ onComplete }: OAuthCallbackProps) {
  const [status, setStatus] = useState<CallbackStatus>("processing");
  const [message, setMessage] = useState("Processing authentication...");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    const errorParam = params.get("error");
    const errorDescription = params.get("error_description");

    // If no code or error, this isn't an OAuth callback
    if (!code && !errorParam) {
      onComplete?.();
      return;
    }

    // Handle OAuth error
    if (errorParam) {
      setStatus("error");
      setMessage(errorDescription || `OAuth error: ${errorParam}`);

      if (window.opener) {
        window.opener.postMessage(
          { type: "oauth-error", error: errorParam, errorDescription },
          window.location.origin
        );
        setTimeout(() => window.close(), 2000);
      }
      return;
    }

    if (!code) return;

    // Determine callback type from state
    const isGmail = state?.startsWith("gmail-");
    const callbackType = isGmail ? "gmail" : state?.startsWith("gcal-") ? "gcal" : "auth";

    // Post message to parent window
    if (window.opener) {
      window.opener.postMessage(
        {
          type: `oauth-callback-${callbackType}`,
          code,
          state,
        },
        window.location.origin
      );

      setStatus("success");
      setMessage(
        callbackType === "gmail"
          ? "Gmail connected successfully!"
          : callbackType === "gcal"
          ? "Google Calendar connected!"
          : "Authentication successful!"
      );

      // Close popup after brief delay
      setTimeout(() => window.close(), 1500);
    } else {
      // Not a popup — clear URL params and notify parent component
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, "", cleanUrl);

      setStatus("success");
      setMessage("Authentication successful! Redirecting...");
      setTimeout(() => onComplete?.(), 1000);
    }
  }, [onComplete]);

  return (
    <div
      className="flex items-center justify-center min-h-screen w-full"
      style={{
        background: "oklch(0.985 0.005 260)",
        fontFamily: "'Albert Sans', sans-serif",
      }}
    >
      <div className="text-center space-y-4">
        <div
          className="w-12 h-12 rounded-[12px] flex items-center justify-center mx-auto"
          style={{
            background:
              status === "error"
                ? "oklch(0.7 0.18 25 / 0.1)"
                : status === "success"
                ? "oklch(0.65 0.15 180 / 0.1)"
                : "oklch(0.7 0.18 25 / 0.1)",
          }}
        >
          {status === "processing" && (
            <CircleNotch
              className="w-6 h-6 animate-spin"
              style={{ color: "oklch(0.7 0.18 25)" }}
            />
          )}
          {status === "success" && (
            <CheckCircle
              className="w-6 h-6"
              weight="fill"
              style={{ color: "oklch(0.65 0.15 180)" }}
            />
          )}
          {status === "error" && (
            <Warning
              className="w-6 h-6"
              weight="fill"
              style={{ color: "oklch(0.7 0.18 25)" }}
            />
          )}
        </div>

        <p
          style={{
            color: "oklch(0.3 0.02 260)",
            fontSize: "15px",
            fontWeight: 500,
          }}
        >
          {message}
        </p>

        {status === "processing" && (
          <p
            style={{
              color: "oklch(0.6 0.02 260)",
              fontSize: "13px",
            }}
          >
            Please wait...
          </p>
        )}

        {status === "error" && (
          <button
            onClick={() => window.close()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[6px] mt-2 transition-colors hover:bg-black/[0.04]"
            style={{
              color: "oklch(0.55 0.18 25)",
              fontSize: "13px",
              fontWeight: 500,
              border: "1px solid oklch(0.92 0.01 260)",
            }}
          >
            Close Window
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Check if the current URL has OAuth callback parameters.
 */
export function hasOAuthCallback(): boolean {
  const params = new URLSearchParams(window.location.search);
  return !!(params.get("code") || params.get("error"));
}
