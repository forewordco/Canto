/* ===================================================================
   SCRIPT PANELS — Character & Location sidebar panels for screenplay docs.
   
   Auto-populates from block content (character blocks → characters,
   scene-heading blocks → locations). Supports add/remove.
   =================================================================== */

import { useState, useMemo } from "react";
import {
  UserCircle,
  MapPin,
  Plus,
  X,
  FilmScript,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import type { DocBlock, WorkspaceDoc } from "../../lib/types";

interface ScriptPanelsProps {
  doc: WorkspaceDoc;
  blocks: DocBlock[];
  onUpdate: (updates: Partial<WorkspaceDoc>) => void;
}

export function ScriptPanels({ doc, blocks, onUpdate }: ScriptPanelsProps) {
  const [activePanel, setActivePanel] = useState<"characters" | "locations">("characters");
  const [addInput, setAddInput] = useState("");
  const [addingOpen, setAddingOpen] = useState(false);

  /* ─── Auto-detect characters from content ─── */
  const detectedCharacters = useMemo(() => {
    const chars = new Set<string>();
    blocks
      .filter((b) => b.type === "character")
      .forEach((b) => {
        const name = b.content.trim().toUpperCase();
        if (name) chars.add(name);
      });
    return Array.from(chars).sort();
  }, [blocks]);

  /* ─── Auto-detect locations from scene headings ─── */
  const detectedLocations = useMemo(() => {
    const locs = new Set<string>();
    blocks
      .filter((b) => b.type === "scene-heading")
      .forEach((b) => {
        const match = b.content.match(/(?:INT\.|EXT\.|INT\.\/EXT\.)\s*(.+?)(?:\s*[-–—]\s*|$)/i);
        const loc = match?.[1]?.trim().toUpperCase() || b.content.trim().toUpperCase();
        if (loc) locs.add(loc);
      });
    return Array.from(locs).sort();
  }, [blocks]);

  /* ─── Merged lists (saved + detected) ─── */
  const savedCharacters = doc.characters || [];
  const savedLocations = doc.locations || [];

  const allCharacters = useMemo(() => {
    const merged = new Set([...savedCharacters.map((c) => c.toUpperCase()), ...detectedCharacters]);
    return Array.from(merged).sort();
  }, [savedCharacters, detectedCharacters]);

  const allLocations = useMemo(() => {
    const merged = new Set([...savedLocations.map((l) => l.toUpperCase()), ...detectedLocations]);
    return Array.from(merged).sort();
  }, [savedLocations, detectedLocations]);

  const items = activePanel === "characters" ? allCharacters : allLocations;

  /* ─── Add item ─── */
  const handleAdd = () => {
    const value = addInput.trim().toUpperCase();
    if (!value) return;
    if (activePanel === "characters") {
      if (!savedCharacters.map((c) => c.toUpperCase()).includes(value)) {
        onUpdate({ characters: [...savedCharacters, value] });
      }
    } else {
      if (!savedLocations.map((l) => l.toUpperCase()).includes(value)) {
        onUpdate({ locations: [...savedLocations, value] });
      }
    }
    setAddInput("");
    setAddingOpen(false);
  };

  /* ─── Remove item ─── */
  const handleRemove = (name: string) => {
    if (activePanel === "characters") {
      onUpdate({ characters: savedCharacters.filter((c) => c.toUpperCase() !== name.toUpperCase()) });
    } else {
      onUpdate({ locations: savedLocations.filter((l) => l.toUpperCase() !== name.toUpperCase()) });
    }
  };

  /* ─── Count occurrences ─── */
  const getCount = (name: string): number => {
    if (activePanel === "characters") {
      return blocks.filter((b) => b.type === "character" && b.content.trim().toUpperCase() === name).length;
    } else {
      return blocks.filter((b) => {
        if (b.type !== "scene-heading") return false;
        const match = b.content.match(/(?:INT\.|EXT\.|INT\.\/EXT\.)\s*(.+?)(?:\s*[-–—]\s*|$)/i);
        const loc = match?.[1]?.trim().toUpperCase() || b.content.trim().toUpperCase();
        return loc === name;
      }).length;
    }
  };

  return (
    <div
      className="rounded-[8px] overflow-hidden"
      style={{ background: "var(--neutral-50)", border: "1px solid var(--border-default)" }}
    >
      {/* Tab bar */}
      <div className="flex border-b" style={{ borderColor: "var(--border-default)" }}>
        <button
          onClick={() => setActivePanel("characters")}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 transition-colors"
          style={{
            background: activePanel === "characters" ? "var(--surface-bg)" : "transparent",
            color: activePanel === "characters" ? "var(--text-primary)" : "var(--text-quaternary)",
            fontSize: "11px",
            fontWeight: 600,
            borderBottom: activePanel === "characters" ? "2px solid #8B5CF6" : "2px solid transparent",
          }}
        >
          <UserCircle className="w-3.5 h-3.5" />
          Characters
          <span
            className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold"
            style={{ background: "var(--neutral-200)", color: "var(--text-quaternary)" }}
          >
            {allCharacters.length}
          </span>
        </button>
        <button
          onClick={() => setActivePanel("locations")}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 transition-colors"
          style={{
            background: activePanel === "locations" ? "var(--surface-bg)" : "transparent",
            color: activePanel === "locations" ? "var(--text-primary)" : "var(--text-quaternary)",
            fontSize: "11px",
            fontWeight: 600,
            borderBottom: activePanel === "locations" ? "2px solid #8B5CF6" : "2px solid transparent",
          }}
        >
          <MapPin className="w-3.5 h-3.5" />
          Locations
          <span
            className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold"
            style={{ background: "var(--neutral-200)", color: "var(--text-quaternary)" }}
          >
            {allLocations.length}
          </span>
        </button>
      </div>

      {/* Panel content */}
      <div className="p-2 space-y-0.5 max-h-64 overflow-y-auto">
        {items.length === 0 ? (
          <div className="text-center py-4" style={{ color: "var(--text-quaternary)", fontSize: "12px" }}>
            {activePanel === "characters" ? (
              <>
                <UserCircle className="w-5 h-5 mx-auto mb-1.5" />
                <p>No characters yet</p>
                <p className="mt-0.5" style={{ fontSize: "11px" }}>
                  Add character blocks or add manually
                </p>
              </>
            ) : (
              <>
                <MapPin className="w-5 h-5 mx-auto mb-1.5" />
                <p>No locations yet</p>
                <p className="mt-0.5" style={{ fontSize: "11px" }}>
                  Add scene headings or add manually
                </p>
              </>
            )}
          </div>
        ) : (
          items.map((name) => {
            const count = getCount(name);
            const isSaved = activePanel === "characters"
              ? savedCharacters.map((c) => c.toUpperCase()).includes(name)
              : savedLocations.map((l) => l.toUpperCase()).includes(name);
            return (
              <div
                key={name}
                className="group flex items-center gap-2 px-2 py-1.5 rounded-[5px] hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
              >
                {activePanel === "characters" ? (
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white shrink-0"
                    style={{
                      background: `hsl(${(name.charCodeAt(0) * 37) % 360}, 55%, 55%)`,
                      fontSize: "9px",
                      fontWeight: 700,
                    }}
                  >
                    {name.charAt(0)}
                  </div>
                ) : (
                  <MapPin
                    className="w-4 h-4 shrink-0"
                    style={{ color: `hsl(${(name.charCodeAt(0) * 53) % 360}, 50%, 50%)` }}
                  />
                )}
                <span
                  className="flex-1 truncate"
                  style={{
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "var(--text-primary)",
                    fontFamily: "'Courier Prime', monospace",
                  }}
                >
                  {name}
                </span>
                {count > 0 && (
                  <span
                    className="text-[10px] tabular-nums"
                    style={{ color: "var(--text-quaternary)" }}
                  >
                    ×{count}
                  </span>
                )}
                <button
                  onClick={() => handleRemove(name)}
                  className="hidden group-hover:flex w-4 h-4 rounded-full items-center justify-center shrink-0"
                  style={{ background: "var(--neutral-200)", color: "var(--text-quaternary)" }}
                  title="Remove"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Add button */}
      <div className="px-2 pb-2">
        <AnimatePresence>
          {addingOpen ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.1 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-1.5">
                <input
                  value={addInput}
                  onChange={(e) => setAddInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAdd();
                    if (e.key === "Escape") { setAddingOpen(false); setAddInput(""); }
                  }}
                  placeholder={activePanel === "characters" ? "Character name..." : "Location name..."}
                  className="flex-1 px-2 py-1 rounded-[4px] outline-none"
                  style={{
                    background: "var(--surface-bg)",
                    border: "1px solid var(--border-default)",
                    fontSize: "11px",
                    color: "var(--text-primary)",
                    fontFamily: "'Courier Prime', monospace",
                    textTransform: "uppercase",
                  }}
                  autoFocus
                />
                <button
                  onClick={handleAdd}
                  className="px-2 py-1 rounded-[4px] text-white"
                  style={{ background: "#8B5CF6", fontSize: "10px", fontWeight: 600 }}
                >
                  Add
                </button>
                <button
                  onClick={() => { setAddingOpen(false); setAddInput(""); }}
                  className="p-0.5 rounded-[3px]"
                  style={{ color: "var(--text-quaternary)" }}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          ) : (
            <button
              onClick={() => setAddingOpen(true)}
              className="flex items-center gap-1 w-full px-2 py-1 rounded-[4px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
              style={{ color: "var(--text-quaternary)", fontSize: "11px", fontWeight: 500 }}
            >
              <Plus className="w-3 h-3" />
              Add {activePanel === "characters" ? "character" : "location"}
            </button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default ScriptPanels;
