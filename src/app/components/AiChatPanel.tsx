/* ===================================================================
   AI CHAT PANEL — Floating assistant for Canto.

   Bottom-right floating panel with chat interface.
   Powered by Gemini 2.0 Flash via the /ai/chat server route.
   Phase 12-5 continuation.
   =================================================================== */

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Sparkle,
  X,
  PaperPlaneTilt,
  CircleNotch,
  Robot,
  Trash,
  ArrowsIn,
  ArrowsOut,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import { chatWithAi } from "../lib/ai";
import { useData } from "../lib/data";
import { useIsMobile } from "./ui/use-mobile";

/* ─── Types ─── */

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

/* ─── Component ─── */

export function AiChatPanel() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { projects } = useData();
  const isMobile = useIsMobile();

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Build context from current projects
  const buildContext = useCallback(() => {
    const projNames = Object.keys(projects);
    if (projNames.length === 0) return "";
    const summaries = projNames.slice(0, 5).map((name) => {
      const p = projects[name];
      const total = p.tasks.length;
      const done = p.tasks.filter((t) => t.completed).length;
      return `- ${p.name}: ${done}/${total} tasks done, phase: ${p.productionPhase}`;
    });
    return `User's projects:\n${summaries.join("\n")}`;
  }, [projects]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-u`,
      role: "user",
      content: trimmed,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const result = await chatWithAi({
        message: trimmed,
        context: buildContext(),
      });

      const aiMsg: ChatMessage = {
        id: `msg-${Date.now()}-a`,
        role: "assistant",
        content: result?.reply || "Sorry, I couldn't process that request. Please try again.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error("[AI Chat] Error:", err);
      const errMsg: ChatMessage = {
        id: `msg-${Date.now()}-e`,
        role: "assistant",
        content: "An error occurred while processing your request. Please try again.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errMsg]);
    }

    setLoading(false);
  }, [input, loading, buildContext]);

  const handleClear = useCallback(() => {
    setMessages([]);
  }, []);

  return (
    <>
      {/* ── Floating trigger button ── */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onClick={() => setOpen(true)}
            className={`fixed z-[60] w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow ${isMobile ? "bottom-24 right-4" : "bottom-20 right-6"}`}
            style={{
              background: "#6340c4",
              color: "white",
            }}
            aria-label="Open AI Assistant"
          >
            <Sparkle size={22} weight="fill" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Chat panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`fixed z-[60] flex flex-col shadow-2xl overflow-hidden ${isMobile ? "rounded-t-xl" : "rounded-xl"}`}
            style={{
              ...(isMobile
                ? {
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "85vh",
                    maxHeight: "85vh",
                    borderRadius: "16px 16px 0 0",
                    paddingBottom: "env(safe-area-inset-bottom, 0px)",
                  }
                : {
                    bottom: "24px",
                    right: "24px",
                    width: expanded ? "480px" : "380px",
                    height: expanded ? "600px" : "480px",
                    maxHeight: "calc(100vh - 48px)",
                    maxWidth: "calc(100vw - 48px)",
                  }),
              background: "var(--surface-primary, #fff)",
              border: isMobile ? "none" : "1px solid #e1e5eb",
            }}
          >
            {/* ── Header ── */}
            <div
              className="flex items-center justify-between px-4 py-3 shrink-0"
              style={{
                borderBottom: "1px solid var(--border-default, oklch(0.92 0.01 260))",
                background: "oklch(0.55 0.2 280 / 0.04)",
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-[6px] flex items-center justify-center"
                  style={{ background: "oklch(0.55 0.2 280 / 0.12)" }}
                >
                  <Robot size={16} weight="fill" style={{ color: "oklch(0.55 0.2 280)" }} />
                </div>
                <div>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                    Canto AI
                  </span>
                  <span
                    className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium"
                    style={{ background: "oklch(0.55 0.2 280 / 0.1)", color: "oklch(0.55 0.2 280)" }}
                  >
                    Gemini 2.0
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    onClick={handleClear}
                    className="p-1.5 rounded-[6px] transition-colors hover:bg-black/[0.05]"
                    style={{ color: "var(--text-quaternary)" }}
                    title="Clear chat"
                  >
                    <Trash size={14} />
                  </button>
                )}
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="p-1.5 rounded-[6px] transition-colors hover:bg-black/[0.05] hidden md:flex"
                  style={{ color: "var(--text-quaternary)" }}
                  title={expanded ? "Collapse" : "Expand"}
                >
                  {expanded ? <ArrowsIn size={14} /> : <ArrowsOut size={14} />}
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-[6px] transition-colors hover:bg-black/[0.05]"
                  style={{ color: "var(--text-quaternary)" }}
                  title="Close"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* ── Messages area ── */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-8">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ background: "oklch(0.55 0.2 280 / 0.08)" }}
                  >
                    <Sparkle size={24} weight="fill" style={{ color: "oklch(0.55 0.2 280)" }} />
                  </div>
                  <div>
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                      How can I help?
                    </p>
                    <p style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "4px", maxWidth: "240px" }}>
                      Ask about your projects, get writing help, brainstorm ideas, or plan your tasks.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 justify-center mt-2">
                    {[
                      "Summarize my projects",
                      "Help me plan a sprint",
                      "Write a status update",
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => {
                          setInput(suggestion);
                          requestAnimationFrame(() => inputRef.current?.focus());
                        }}
                        className="px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors hover:bg-black/[0.04]"
                        style={{
                          border: "1px solid var(--border-default, oklch(0.92 0.01 260))",
                          color: "var(--text-tertiary)",
                        }}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className="max-w-[85%] rounded-xl px-3.5 py-2.5"
                    style={{
                      background:
                        msg.role === "user"
                          ? "oklch(0.55 0.2 280)"
                          : "var(--neutral-100, oklch(0.96 0.005 260))",
                      color: msg.role === "user" ? "white" : "var(--text-primary)",
                    }}
                  >
                    <p
                      className="whitespace-pre-wrap break-words"
                      style={{ fontSize: "13px", lineHeight: 1.55 }}
                    >
                      {msg.content}
                    </p>
                    <span
                      style={{
                        fontSize: "10px",
                        opacity: 0.5,
                        display: "block",
                        marginTop: "4px",
                        textAlign: msg.role === "user" ? "right" : "left",
                      }}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div
                    className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl"
                    style={{ background: "var(--neutral-100, oklch(0.96 0.005 260))" }}
                  >
                    <CircleNotch size={14} className="animate-spin" style={{ color: "oklch(0.55 0.2 280)" }} />
                    <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>Thinking...</span>
                  </div>
                </div>
              )}
            </div>

            {/* ── Input area ── */}
            <div
              className="shrink-0 px-3 py-3"
              style={{
                borderTop: "1px solid var(--border-default, oklch(0.92 0.01 260))",
              }}
            >
              <div
                className="flex items-end gap-2 rounded-xl px-3 py-2"
                style={{
                  background: "var(--neutral-50, oklch(0.98 0.003 260))",
                  border: "1px solid var(--border-default, oklch(0.92 0.01 260))",
                }}
              >
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Ask Canto AI..."
                  rows={1}
                  className="flex-1 bg-transparent outline-none resize-none"
                  style={{
                    fontSize: "13px",
                    color: "var(--text-primary)",
                    maxHeight: "100px",
                    lineHeight: 1.5,
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className="p-1.5 rounded-[6px] transition-all disabled:opacity-30"
                  style={{
                    color: "white",
                    background: input.trim() ? "oklch(0.55 0.2 280)" : "oklch(0.55 0.2 280 / 0.3)",
                  }}
                >
                  <PaperPlaneTilt size={14} weight="fill" />
                </button>
              </div>
              <p className="text-center mt-1.5" style={{ fontSize: "10px", color: "var(--text-quaternary)" }}>
                Powered by Gemini 2.0 Flash · Responses may be inaccurate
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}