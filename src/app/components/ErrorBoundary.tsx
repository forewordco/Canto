/* ===================================================================
   ERROR BOUNDARY — React error boundary with graceful fallback UI.

   Wraps major app sections to prevent full-page crashes.
   Shows a branded fallback with error info and retry button.
   Logs contextual error info to console for debugging.

   Phase 16 of Canto build plan (P16-1).
   =================================================================== */

import { Component, type ErrorInfo, type ReactNode } from "react";
import { Warning, ArrowClockwise } from "@phosphor-icons/react";

/* ── Props & State ── */

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Display name for the section (e.g. "Projects", "Calendar") */
  section?: string;
  /** Optional custom fallback UI */
  fallback?: ReactNode;
  /** Optional callback when error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/* ── Component ── */

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const section = this.props.section || "Unknown Section";
    console.error(
      `[ErrorBoundary] Uncaught error in "${section}":`,
      error,
      "\nComponent stack:",
      errorInfo.componentStack
    );
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const section = this.props.section || "this section";
      const errorMessage = this.state.error?.message || "An unexpected error occurred";

      return (
        <div className="flex items-center justify-center min-h-[200px] p-6">
          <div className="text-center max-w-sm space-y-3">
            <div
              className="w-12 h-12 rounded-[12px] flex items-center justify-center mx-auto"
              style={{
                background: "oklch(0.7 0.18 25 / 0.1)",
              }}
            >
              <Warning
                className="w-6 h-6"
                weight="fill"
                style={{ color: "oklch(0.7 0.18 25)" }}
              />
            </div>
            <div>
              <h3
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  marginBottom: "4px",
                }}
              >
                Something went wrong
              </h3>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text-tertiary)",
                  lineHeight: 1.5,
                }}
              >
                An error occurred in {section}. This has been logged for debugging.
              </p>
            </div>

            {/* Error details (collapsible) */}
            <details className="text-left">
              <summary
                className="cursor-pointer select-none"
                style={{
                  fontSize: "11px",
                  color: "var(--text-quaternary)",
                  fontWeight: 500,
                }}
              >
                Error details
              </summary>
              <pre
                className="mt-1 p-2 rounded-[6px] overflow-auto max-h-[120px]"
                style={{
                  fontSize: "10px",
                  color: "var(--text-tertiary)",
                  background: "var(--neutral-100)",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {errorMessage}
              </pre>
            </details>

            <button
              onClick={this.handleRetry}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] transition-colors hover:brightness-95"
              style={{
                background: "oklch(0.7 0.18 25)",
                color: "white",
                fontSize: "12px",
                fontWeight: 500,
              }}
            >
              <ArrowClockwise className="w-3.5 h-3.5" />
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
