/* ===================================================================
   SCREEN READER ANNOUNCER — ARIA live region for status updates.

   Provides a visually hidden aria-live region and a `useAnnounce`
   hook to push messages to screen readers without visual changes.

   Phase 16-4 of Canto build plan (accessibility).
   =================================================================== */

import { createContext, useContext, useState, useCallback, useRef } from "react";

interface AnnounceContextValue {
  announce: (message: string, priority?: "polite" | "assertive") => void;
}

const AnnounceContext = createContext<AnnounceContextValue>({
  announce: () => {},
});

export function useAnnounce() {
  return useContext(AnnounceContext);
}

export function ScreenReaderAnnouncer({ children }: { children: React.ReactNode }) {
  const [politeMessage, setPoliteMessage] = useState("");
  const [assertiveMessage, setAssertiveMessage] = useState("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const announce = useCallback((message: string, priority: "polite" | "assertive" = "polite") => {
    // Clear first to ensure re-announcement of same message
    if (priority === "assertive") {
      setAssertiveMessage("");
      requestAnimationFrame(() => setAssertiveMessage(message));
    } else {
      setPoliteMessage("");
      requestAnimationFrame(() => setPoliteMessage(message));
    }

    // Auto-clear after 5s to keep region clean
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setPoliteMessage("");
      setAssertiveMessage("");
    }, 5000);
  }, []);

  return (
    <AnnounceContext.Provider value={{ announce }}>
      {children}

      {/* Visually hidden live regions */}
      <div
        aria-live="polite"
        aria-atomic="true"
        role="status"
        className="sr-only"
        style={{
          position: "absolute",
          width: "1px",
          height: "1px",
          padding: 0,
          margin: "-1px",
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        {politeMessage}
      </div>

      <div
        aria-live="assertive"
        aria-atomic="true"
        role="alert"
        className="sr-only"
        style={{
          position: "absolute",
          width: "1px",
          height: "1px",
          padding: 0,
          margin: "-1px",
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        {assertiveMessage}
      </div>
    </AnnounceContext.Provider>
  );
}