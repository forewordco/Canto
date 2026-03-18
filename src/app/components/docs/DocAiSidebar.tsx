/* ===================================================================
   DOC AI SIDEBAR — Document-aware AI chat sidebar (D11-4).
   
   A dedicated 320px sidebar panel with chat interface, sends document
   title + content as context to AI. Responses can be "inserted" as
   blocks at cursor position.
   =================================================================== */

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Sparkle,
  PaperPlaneTilt,
  X,
  CircleNotch,
  Copy,
  ArrowDown,
  Trash,
  Robot,
  User,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import { api } from "../../lib/api";
import { toast } from "sonner";

/* ─── Types ─── */
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface DocAiSidebarProps {
  docTitle: string;
  docContent: string;
  onClose: () => void;
  onInsertText?: (text: string) => void;
}

export function DocAiSidebar({ docTitle, docContent, onClose, onInsertText }: DocAiSidebarProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: "user",
      content: text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = messages.slice(-10).map((m) => ({ role: m.role, content: m.content }));

      const { data, error } = await api.post<{ reply: string }>("/ai/doc-chat", {
        message: text,
        docTitle,
        docContent: docContent.slice(0, 4000),
        history,
      });

      if (error || !data?.reply) {
        const errMsg: ChatMessage = {
          id: `msg_${Date.now()}_err`,
          role: "assistant",
          content: `Sorry, I encountered an error: ${error || "No response from AI"}`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errMsg]);
      } else {
        const assistantMsg: ChatMessage = {
          id: `msg_${Date.now()}_ai`,
          role: "assistant",
          content: data.reply,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch {
      const errMsg: ChatMessage = {
        id: `msg_${Date.now()}_err`,
        role: "assistant",
        content: "Sorry, something went wrong. Please try again.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard?.writeText(content).then(() => toast.success("Copied to clipboard"));
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <motion.div
      className="flex flex-col h-full"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.15 }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 shrink-0"
        style={{ borderBottom: "1px solid var(--border-default)" }}
      >
        <Sparkle className="w-4 h-4" weight="fill" style={{ color: "#8B5CF6" }} />
        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
          Doc AI
        </span>
        <span
          className="px-1.5 py-0.5 rounded-[4px]"
          style={{ fontSize: "10px", fontWeight: 500, color: "#8B5CF6", background: "rgba(139, 92, 246, 0.1)" }}
        >
          Context-aware
        </span>
        <div className="flex-1" />
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="p-1 rounded-[4px] transition-colors hover:bg-black/[0.04]"
            style={{ color: "var(--text-quaternary)" }}
            title="Clear chat"
          >
            <Trash className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={onClose}
          className="p-1 rounded-[4px] transition-colors hover:bg-black/[0.04]"
          style={{ color: "var(--text-quaternary)" }}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Sparkle className="w-8 h-8 mx-auto mb-3" weight="duotone" style={{ color: "#8B5CF6" }} />
            <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
              Doc AI Assistant
            </p>
            <p className="mt-1 max-w-[200px] mx-auto" style={{ fontSize: "12px", color: "var(--text-tertiary)", lineHeight: 1.5 }}>
              I can see your document "{docTitle || "Untitled"}". Ask me anything about it!
            </p>
            <div className="mt-4 space-y-1.5">
              {[
                "Suggest improvements",
                "Help me rewrite the intro",
                "What's missing from this doc?",
                "Generate a conclusion",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => { setInput(suggestion); inputRef.current?.focus(); }}
                  className="block w-full text-left px-3 py-2 rounded-[6px] transition-colors hover:bg-black/[0.04]"
                  style={{ fontSize: "12px", color: "var(--text-secondary)", border: "1px solid var(--border-default)" }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : ""}`}>
            {msg.role === "assistant" && (
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: "rgba(139, 92, 246, 0.1)" }}
              >
                <Robot className="w-3.5 h-3.5" style={{ color: "#8B5CF6" }} />
              </div>
            )}
            <div
              className={`group relative max-w-[85%] rounded-[8px] px-3 py-2 ${msg.role === "user" ? "" : ""}`}
              style={{
                background: msg.role === "user" ? "#8B5CF6" : "var(--neutral-100)",
                color: msg.role === "user" ? "white" : "var(--text-primary)",
                fontSize: "13px",
                lineHeight: 1.6,
              }}
            >
              <div
                className="prose prose-sm max-w-none whitespace-pre-wrap"
                style={{ fontSize: "13px" }}
              >
                {msg.content}
              </div>
              {msg.role === "assistant" && (
                <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => copyMessage(msg.content)}
                    className="p-0.5 rounded-[3px] transition-colors hover:bg-black/[0.05]"
                    style={{ color: "var(--text-quaternary)" }}
                    title="Copy"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  {onInsertText && (
                    <button
                      onClick={() => { onInsertText(msg.content); toast.success("Inserted into document"); }}
                      className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-[3px] transition-colors hover:bg-black/[0.05]"
                      style={{ color: "#8B5CF6", fontSize: "10px", fontWeight: 600 }}
                    >
                      <ArrowDown className="w-3 h-3" /> Insert
                    </button>
                  )}
                </div>
              )}
            </div>
            {msg.role === "user" && (
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: "var(--neutral-200)" }}
              >
                <User className="w-3.5 h-3.5" style={{ color: "var(--text-tertiary)" }} />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "rgba(139, 92, 246, 0.1)" }}
            >
              <Robot className="w-3.5 h-3.5" style={{ color: "#8B5CF6" }} />
            </div>
            <div
              className="rounded-[8px] px-3 py-2.5"
              style={{ background: "var(--neutral-100)" }}
            >
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: "#8B5CF6", animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: "#8B5CF6", animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: "#8B5CF6", animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        className="px-3 py-2.5 shrink-0"
        style={{ borderTop: "1px solid var(--border-default)" }}
      >
        <div
          className="flex items-end gap-2 rounded-[8px] px-3 py-2"
          style={{ background: "var(--neutral-50)", border: "1px solid var(--border-default)" }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your document..."
            rows={1}
            className="flex-1 bg-transparent outline-none resize-none"
            style={{
              fontSize: "13px",
              color: "var(--text-primary)",
              maxHeight: "80px",
              lineHeight: 1.5,
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="p-1.5 rounded-[5px] transition-colors hover:opacity-80 disabled:opacity-30 shrink-0"
            style={{ background: "#8B5CF6", color: "white" }}
          >
            {loading ? (
              <CircleNotch className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <PaperPlaneTilt className="w-3.5 h-3.5" weight="fill" />
            )}
          </button>
        </div>
        <p className="mt-1.5 text-center" style={{ fontSize: "10px", color: "var(--text-quaternary)" }}>
          AI has context of "{docTitle || "Untitled"}"
        </p>
      </div>
    </motion.div>
  );
}

export default DocAiSidebar;
