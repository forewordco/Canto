/* ===================================================================
   UNSPLASH SEARCH MODAL — Reusable Unsplash photo search for blocks.
   
   Used by unsplash-image blocks and gallery blocks to search and
   select photos from Unsplash via the /unsplash/search server route.
   =================================================================== */

import { useState, useRef, useCallback } from "react";
import { MagnifyingGlass, X, CircleNotch } from "@phosphor-icons/react";
import { motion } from "motion/react";
import type { UnsplashImageMeta } from "../../lib/types";
import { api } from "../../lib/api";

interface UnsplashSearchModalProps {
  /** "single" selects one image and closes; "multi" allows selecting many */
  mode: "single" | "multi";
  onSelectSingle?: (meta: UnsplashImageMeta) => void;
  onSelectMulti?: (images: UnsplashImageMeta[]) => void;
  onClose: () => void;
}

interface UnsplashResult {
  id: string;
  url: string;
  thumb: string;
  photographer: string;
  profileUrl: string;
}

export function UnsplashSearchModal({
  mode,
  onSelectSingle,
  onSelectMulti,
  onClose,
}: UnsplashSearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UnsplashResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchUnsplash = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await api.get<{
        results: UnsplashResult[];
      }>(`/unsplash/search?query=${encodeURIComponent(q)}&per_page=18`, {
        skipAuth: true,
      });
      if (error || !data?.results) {
        console.error("[UnsplashSearch] error:", error);
        setResults([]);
      } else {
        setResults(data.results);
      }
    } catch (err) {
      console.error("[UnsplashSearch] failed:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => searchUnsplash(value), 400);
  };

  const toMeta = (r: UnsplashResult): UnsplashImageMeta => ({
    id: r.id,
    url: r.url,
    thumbUrl: r.thumb,
    photographer: r.photographer,
    photographerUrl: r.profileUrl,
  });

  const handleSelectImage = (r: UnsplashResult) => {
    if (mode === "single") {
      onSelectSingle?.(toMeta(r));
      onClose();
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(r.id)) next.delete(r.id);
        else next.add(r.id);
        return next;
      });
    }
  };

  const handleConfirmMulti = () => {
    const images = results
      .filter((r) => selected.has(r.id))
      .map(toMeta);
    onSelectMulti?.(images);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="fixed inset-0 bg-black/40" />
      <motion.div
        className="relative w-full max-w-lg rounded-[12px] shadow-2xl border overflow-hidden"
        style={{ background: "var(--surface-bg)", borderColor: "var(--border-default)" }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h3
            style={{
              color: "var(--text-primary)",
              fontSize: "15px",
              fontWeight: 600,
            }}
          >
            {mode === "single" ? "Search Unsplash" : "Add Gallery Images"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-[5px] transition-colors hover:bg-black/[0.05]"
            style={{ color: "var(--text-quaternary)" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search input */}
        <div className="px-4 pb-3">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-[6px]"
            style={{
              background: "var(--neutral-50)",
              border: "1px solid var(--border-default)",
            }}
          >
            <MagnifyingGlass
              className="w-4 h-4 shrink-0"
              style={{ color: "var(--text-quaternary)" }}
            />
            <input
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search free high-resolution photos..."
              className="flex-1 bg-transparent outline-none"
              style={{ color: "var(--text-primary)", fontSize: "13px" }}
              autoFocus
            />
            {query && (
              <button
                onClick={() => {
                  setQuery("");
                  setResults([]);
                }}
                style={{ color: "var(--text-quaternary)" }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="px-4 pb-4 max-h-[360px] overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <CircleNotch
                className="w-5 h-5 animate-spin"
                style={{ color: "var(--text-quaternary)" }}
              />
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {results.map((r) => {
                const isSelected = selected.has(r.id);
                return (
                  <button
                    key={r.id}
                    onClick={() => handleSelectImage(r)}
                    className={`rounded-[6px] overflow-hidden border-2 transition-all group relative ${
                      isSelected
                        ? "border-[var(--accent-primary)] ring-1 ring-[var(--accent-primary)]"
                        : "border-transparent hover:border-[var(--accent-primary)]"
                    }`}
                  >
                    <img
                      src={r.thumb}
                      alt=""
                      className="w-full h-24 object-cover"
                      loading="lazy"
                    />
                    <div className="absolute bottom-0 inset-x-0 px-1.5 py-0.5 bg-gradient-to-t from-black/60 to-transparent">
                      <span
                        style={{
                          fontSize: "9px",
                          color: "rgba(255,255,255,0.85)",
                        }}
                        className="truncate block"
                      >
                        {r.photographer}
                      </span>
                    </div>
                    {mode === "multi" && isSelected && (
                      <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[var(--accent-primary)] flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          viewBox="0 0 24 24"
                        >
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div
              className="text-center py-12"
              style={{ color: "var(--text-quaternary)", fontSize: "13px" }}
            >
              No results found
            </div>
          )}

          {!query && !loading && (
            <div
              className="text-center py-12"
              style={{ color: "var(--text-quaternary)", fontSize: "13px" }}
            >
              Search for free photos from Unsplash
            </div>
          )}
        </div>

        {/* Multi-select footer */}
        {mode === "multi" && selected.size > 0 && (
          <div
            className="flex items-center justify-between px-4 py-3 border-t"
            style={{ borderColor: "var(--border-default)" }}
          >
            <span style={{ color: "var(--text-tertiary)", fontSize: "13px" }}>
              {selected.size} photo{selected.size !== 1 ? "s" : ""} selected
            </span>
            <button
              onClick={handleConfirmMulti}
              className="px-4 py-1.5 rounded-[6px] text-white"
              style={{
                background: "var(--accent-primary)",
                fontSize: "13px",
                fontWeight: 500,
              }}
            >
              Add to Gallery
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
