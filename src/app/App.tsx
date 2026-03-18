import { Component, type ErrorInfo, type ReactNode, lazy, Suspense, useState, useEffect, startTransition } from "react";

/* ═══════════════════════════════════════════════════════════
   Canto — App Entry Point

   Clean boot: lazy-loads AppInner with ErrorBoundary protection.
   The old diagnostic sequential-import wrapper has been removed;
   all modules are verified correct and Vite handles bundling.
   ═══════════════════════════════════════════════════════════ */

/* ─── Supabase initialization (must run before any API calls) ─── */

import { projectId, publicAnonKey } from "/utils/supabase/info";
import { initSupabase, isSupabaseConfigured } from "./lib/supabase";

if (!isSupabaseConfigured()) {
  initSupabase(`https://${projectId}.supabase.co`, publicAnonKey);
}

/* ─── Error Boundary ─── */

interface EBState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  state: EBState = { hasError: false, error: null, errorInfo: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[Canto] React Error Boundary caught:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            fontFamily: "'Albert Sans', system-ui, sans-serif",
            background: "#fafafa",
          }}
        >
          <div style={{ maxWidth: "600px", width: "100%" }}>
            <div
              style={{
                background: "white",
                borderRadius: "12px",
                padding: "2rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                border: "1px solid #e5e5e5",
              }}
            >
              <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#1a1a1a", marginBottom: "8px" }}>
                Canto encountered an error
              </h1>
              <p style={{ fontSize: "14px", color: "#666", marginBottom: "16px" }}>
                The application crashed during rendering. Details below:
              </p>
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  marginBottom: "16px",
                }}
              >
                <p style={{ fontSize: "13px", fontWeight: 600, color: "#dc2626", marginBottom: "4px" }}>
                  {this.state.error?.name}: {this.state.error?.message}
                </p>
              </div>
              <details style={{ marginBottom: "16px" }}>
                <summary style={{ fontSize: "13px", color: "#666", cursor: "pointer" }}>
                  Stack trace
                </summary>
                <pre
                  style={{
                    fontSize: "11px",
                    background: "#f5f5f5",
                    padding: "12px",
                    borderRadius: "6px",
                    overflow: "auto",
                    maxHeight: "300px",
                    marginTop: "8px",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {this.state.error?.stack}
                </pre>
              </details>
              {this.state.errorInfo?.componentStack && (
                <details style={{ marginBottom: "16px" }}>
                  <summary style={{ fontSize: "13px", color: "#666", cursor: "pointer" }}>
                    Component stack
                  </summary>
                  <pre
                    style={{
                      fontSize: "11px",
                      background: "#f5f5f5",
                      padding: "12px",
                      borderRadius: "6px",
                      overflow: "auto",
                      maxHeight: "200px",
                      marginTop: "8px",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Reload App
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ─── Loading Screen ─── */

function LoadingScreen() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Albert Sans', sans-serif",
        background: "oklch(0.985 0.005 260)",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            background: "oklch(0.7 0.18 25)",
            boxShadow: "0 4px 16px oklch(0.7 0.18 25 / 0.25)",
            color: "white",
            fontSize: "28px",
          }}
        >
          ✦
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
          <div
            style={{
              width: "16px",
              height: "16px",
              border: "2px solid oklch(0.6 0.02 260)",
              borderTopColor: "transparent",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <span style={{ color: "oklch(0.5 0.02 260)", fontSize: "14px" }}>
            Loading Canto...
          </span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

/* ─── Lazy AppInner ─── */

const LazyAppInner = lazy(() => import("./AppInner").catch((err) => {
  console.error("[Canto] Failed to load AppInner:", err);
  throw err;
}));

function AppInnerLoader() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    startTransition(() => setReady(true));
  }, []);
  if (!ready) return <LoadingScreen />;
  return <LazyAppInner />;
}

/* ─── Default Export ─── */

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingScreen />}>
        <AppInnerLoader />
      </Suspense>
    </ErrorBoundary>
  );
}