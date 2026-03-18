/* ===================================================================
   MENTION INPUT — Textarea with @-mention autocomplete.

   Detects "@" trigger in text, opens a floating dropdown of
   matching team members/projects/tasks. On select, inserts
   @[Display Name] into the text and tracks mention IDs.

   Phase 7-4 of Canto build plan.
   =================================================================== */

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  User,
  Folder,
  CheckSquare,
  At,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";

/* ─── Types ─── */

export interface MentionItem {
  id: string;
  label: string;
  type: "person" | "project" | "task";
  color?: string;
  avatarUrl?: string;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  onMentionSelect?: (item: MentionItem) => void;
  mentionItems: MentionItem[];
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  className?: string;
  /** Additional content to render inside the footer toolbar */
  toolbar?: React.ReactNode;
  /** Submit button content */
  submitLabel?: React.ReactNode;
  disabled?: boolean;
}

/* ─── Helpers ─── */

function getCaretCoords(el: HTMLTextAreaElement): { top: number; left: number } {
  // Create mirror div to measure caret position
  const mirror = document.createElement("div");
  const style = window.getComputedStyle(el);
  const props = [
    "fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing",
    "wordSpacing", "textIndent", "whiteSpace", "wordWrap", "overflowWrap",
    "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
    "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth",
    "boxSizing", "width",
  ] as const;

  mirror.style.position = "absolute";
  mirror.style.visibility = "hidden";
  mirror.style.overflow = "hidden";
  mirror.style.height = "auto";

  for (const prop of props) {
    (mirror.style as any)[prop] = style.getPropertyValue(
      prop.replace(/([A-Z])/g, "-$1").toLowerCase()
    );
  }

  const text = el.value.substring(0, el.selectionStart || 0);
  mirror.textContent = text;

  // Add span at end to measure position
  const span = document.createElement("span");
  span.textContent = "|";
  mirror.appendChild(span);
  document.body.appendChild(mirror);

  const rect = el.getBoundingClientRect();
  const spanRect = span.getBoundingClientRect();
  const mirrorRect = mirror.getBoundingClientRect();

  document.body.removeChild(mirror);

  return {
    top: spanRect.top - mirrorRect.top + rect.top - el.scrollTop,
    left: spanRect.left - mirrorRect.left + rect.left - el.scrollLeft,
  };
}

function getTypeIcon(type: MentionItem["type"]) {
  switch (type) {
    case "person": return User;
    case "project": return Folder;
    case "task": return CheckSquare;
  }
}

function getTypeColor(type: MentionItem["type"]) {
  switch (type) {
    case "person": return "oklch(0.55 0.2 280)";
    case "project": return "oklch(0.65 0.15 180)";
    case "task": return "oklch(0.72 0.17 55)";
  }
}

/* ─── Component ─── */

export function MentionInput({
  value,
  onChange,
  onSubmit,
  onMentionSelect,
  mentionItems,
  placeholder = "Write something...",
  rows = 2,
  maxLength,
  className = "",
  toolbar,
  submitLabel,
  disabled = false,
}: MentionInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStart, setMentionStart] = useState(-1);
  const [selectedIdx, setSelectedIdx] = useState(0);

  // Filter mention items by query
  const filteredItems = useMemo(() => {
    if (!mentionQuery && !showDropdown) return [];
    const q = mentionQuery.toLowerCase();
    return mentionItems
      .filter((item) => !q || item.label.toLowerCase().includes(q))
      .slice(0, 8);
  }, [mentionItems, mentionQuery, showDropdown]);

  // Reset selected idx when items change
  useEffect(() => {
    setSelectedIdx(0);
  }, [filteredItems.length]);

  // Detect "@" trigger
  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newVal = maxLength ? e.target.value.slice(0, maxLength) : e.target.value;
      onChange(newVal);

      const textarea = e.target;
      const cursorPos = textarea.selectionStart || 0;
      const textBefore = newVal.substring(0, cursorPos);

      // Find the last "@" that isn't escaped
      const atIdx = textBefore.lastIndexOf("@");

      if (atIdx >= 0) {
        // Check if "@" is at start or preceded by whitespace
        const charBefore = atIdx > 0 ? textBefore[atIdx - 1] : " ";
        if (charBefore === " " || charBefore === "\n" || atIdx === 0) {
          const query = textBefore.substring(atIdx + 1);
          // Only show if query doesn't contain spaces (still typing mention)
          if (!query.includes(" ") && query.length <= 30) {
            setMentionQuery(query);
            setMentionStart(atIdx);
            setShowDropdown(true);

            // Position dropdown
            try {
              const coords = getCaretCoords(textarea);
              setDropdownPos({ top: coords.top + 20, left: coords.left });
            } catch {
              const rect = textarea.getBoundingClientRect();
              setDropdownPos({ top: rect.bottom, left: rect.left + 16 });
            }
            return;
          }
        }
      }

      setShowDropdown(false);
    },
    [onChange, maxLength]
  );

  // Handle mention selection
  const selectMention = useCallback(
    (item: MentionItem) => {
      if (mentionStart < 0) return;

      const before = value.substring(0, mentionStart);
      const cursorPos = textareaRef.current?.selectionStart || value.length;
      const after = value.substring(cursorPos);

      const mention = `@${item.label} `;
      const newValue = before + mention + after;

      onChange(newValue);
      onMentionSelect?.(item);
      setShowDropdown(false);
      setMentionQuery("");
      setMentionStart(-1);

      // Restore focus and cursor
      requestAnimationFrame(() => {
        const textarea = textareaRef.current;
        if (textarea) {
          textarea.focus();
          const newPos = before.length + mention.length;
          textarea.setSelectionRange(newPos, newPos);
        }
      });
    },
    [value, mentionStart, onChange, onMentionSelect]
  );

  // Keyboard navigation in dropdown
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (showDropdown && filteredItems.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIdx((i) => (i + 1) % filteredItems.length);
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIdx((i) => (i - 1 + filteredItems.length) % filteredItems.length);
          return;
        }
        if (e.key === "Enter" || e.key === "Tab") {
          e.preventDefault();
          selectMention(filteredItems[selectedIdx]);
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setShowDropdown(false);
          return;
        }
      }

      // Submit on Ctrl/Cmd+Enter
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onSubmit?.();
      }
    },
    [showDropdown, filteredItems, selectedIdx, selectMention, onSubmit]
  );

  // Close dropdown on click outside
  useEffect(() => {
    if (!showDropdown) return;
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showDropdown]);

  // Render @mentions with highlighting in preview
  const renderHighlightedText = useCallback(
    (text: string) => {
      // Find @mentions in text
      const parts: React.ReactNode[] = [];
      const regex = /@([^\s@]+(?:\s[^\s@]+)?)/g;
      let lastIndex = 0;
      let match;

      while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
          parts.push(text.substring(lastIndex, match.index));
        }
        const mentionName = match[1];
        const isKnown = mentionItems.some(
          (m) => m.label.toLowerCase() === mentionName.toLowerCase()
        );
        parts.push(
          <span
            key={match.index}
            style={{
              color: isKnown ? "oklch(0.55 0.2 280)" : "var(--text-primary)",
              fontWeight: isKnown ? 500 : 400,
            }}
          >
            @{mentionName}
          </span>
        );
        lastIndex = match.index + match[0].length;
      }

      if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
      }

      return parts.length > 0 ? parts : text;
    },
    [mentionItems]
  );

  return (
    <div className={`relative ${className}`}>
      <div
        className="rounded-[8px] overflow-hidden"
        style={{ border: "1px solid var(--border-default)" }}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          className="w-full px-3 py-2 bg-transparent outline-none resize-none"
          style={{
            fontSize: "13px",
            color: "var(--text-primary)",
            fontFamily: "'Albert Sans', sans-serif",
            lineHeight: 1.5,
          }}
        />

        {toolbar && (
          <div
            className="flex items-center justify-between px-3 py-1.5 border-t"
            style={{ borderColor: "var(--border-default)", background: "var(--neutral-50)" }}
          >
            <div className="flex items-center gap-1">
              {toolbar}
              <button
                onClick={() => {
                  if (textareaRef.current) {
                    const pos = textareaRef.current.selectionStart || value.length;
                    const before = value.substring(0, pos);
                    const after = value.substring(pos);
                    const needsSpace = before.length > 0 && !before.endsWith(" ") && !before.endsWith("\n");
                    const newVal = before + (needsSpace ? " @" : "@") + after;
                    onChange(newVal);
                    requestAnimationFrame(() => {
                      textareaRef.current?.focus();
                      const newPos = pos + (needsSpace ? 2 : 1);
                      textareaRef.current?.setSelectionRange(newPos, newPos);
                      // Trigger dropdown
                      setMentionStart(pos + (needsSpace ? 1 : 0));
                      setMentionQuery("");
                      setShowDropdown(true);
                      const coords = getCaretCoords(textareaRef.current!);
                      setDropdownPos({ top: coords.top + 20, left: coords.left });
                    });
                  }
                }}
                className="p-1 rounded hover:bg-black/[0.04]"
                title="Mention someone (@)"
              >
                <At className="w-3.5 h-3.5" style={{ color: "var(--text-quaternary)" }} />
              </button>
            </div>

            {submitLabel && (
              <button
                onClick={onSubmit}
                disabled={!value.trim() || disabled}
                className="px-3 py-1 rounded-[6px] transition-colors disabled:opacity-40"
                style={{
                  background: "var(--accent-primary)",
                  color: "white",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                {submitLabel}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Mention dropdown */}
      <AnimatePresence>
        {showDropdown && filteredItems.length > 0 && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.1 }}
            className="fixed z-[9999] py-1 rounded-[8px] min-w-[200px] max-w-[280px] max-h-[240px] overflow-y-auto"
            style={{
              top: `${dropdownPos.top}px`,
              left: `${Math.min(dropdownPos.left, window.innerWidth - 290)}px`,
              background: "var(--surface-bg)",
              border: "1px solid var(--border-default)",
              boxShadow: "0 8px 30px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <div
              className="px-3 py-1"
              style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-quaternary)", letterSpacing: "0.05em" }}
            >
              SUGGESTIONS
            </div>
            {filteredItems.map((item, idx) => {
              const TypeIcon = getTypeIcon(item.type);
              const typeColor = item.color || getTypeColor(item.type);
              const initials = item.label
                .split(/\s+/)
                .map((w) => w[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);

              return (
                <button
                  key={item.id}
                  onClick={() => selectMention(item)}
                  onMouseEnter={() => setSelectedIdx(idx)}
                  className="flex items-center gap-2.5 w-full px-3 py-1.5 text-left transition-colors"
                  style={{
                    background: idx === selectedIdx ? "var(--neutral-100)" : "transparent",
                    fontSize: "13px",
                    color: "var(--text-primary)",
                  }}
                >
                  {item.type === "person" ? (
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: typeColor }}
                    >
                      {item.avatarUrl ? (
                        <img src={item.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span style={{ color: "white", fontSize: "7px", fontWeight: 700 }}>{initials}</span>
                      )}
                    </div>
                  ) : (
                    <TypeIcon className="w-4 h-4 shrink-0" style={{ color: typeColor }} />
                  )}
                  <span className="truncate">{item.label}</span>
                  <span
                    className="ml-auto shrink-0"
                    style={{ fontSize: "10px", color: "var(--text-quaternary)" }}
                  >
                    {item.type}
                  </span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default MentionInput;
