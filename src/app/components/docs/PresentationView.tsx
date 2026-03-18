/* ===================================================================
   PRESENTATION VIEW — Fullscreen slide presentation mode (D11-5, D13-3).
   
   AI-generated slides with keyboard navigation, speaker notes toggle,
   dark theme, slide counter, and fade transitions.
   =================================================================== */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  X,
  CaretLeft,
  CaretRight,
  SpeakerHigh,
  SpeakerSlash,
  CircleNotch,
  Sparkle,
  Presentation,
  Quotes,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import { api } from "../../lib/api";
import { toast } from "sonner";

/* ─── Types ─── */
export interface Slide {
  title: string;
  bullets: string[];
  notes: string;
  layout: "title" | "content" | "bullets" | "quote" | "image" | "closing";
}

interface PresentationViewProps {
  docTitle: string;
  docContent: string;
  onClose: () => void;
}

/* ─── Slide Color Palette ─── */
const SLIDE_ACCENTS = [
  "#8B5CF6", "#3B82F6", "#10B981", "#F59E0B", "#EC4899",
  "#6366F1", "#14B8A6", "#F97316", "#EF4444", "#22C55E",
];

export function PresentationView({ docTitle, docContent, onClose }: PresentationViewProps) {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  /* ─── Generate slides from AI ─── */
  useEffect(() => {
    const generate = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: apiError } = await api.post<{ slides: Slide[] }>("/ai/presentation", {
          title: docTitle,
          content: docContent,
        });
        if (apiError || !data?.slides) {
          setError(apiError || "Failed to generate presentation");
          return;
        }
        setSlides(data.slides);
      } catch (err) {
        console.error("[PresentationView] Generation failed:", err);
        setError("Failed to generate presentation. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    generate();
  }, [docTitle, docContent]);

  /* ─── Navigation ─── */
  const goNext = useCallback(() => {
    if (currentSlide < slides.length - 1 && !transitioning) {
      setTransitioning(true);
      setCurrentSlide((s) => s + 1);
      setTimeout(() => setTransitioning(false), 300);
    }
  }, [currentSlide, slides.length, transitioning]);

  const goPrev = useCallback(() => {
    if (currentSlide > 0 && !transitioning) {
      setTransitioning(true);
      setCurrentSlide((s) => s - 1);
      setTimeout(() => setTransitioning(false), 300);
    }
  }, [currentSlide, transitioning]);

  /* ─── Keyboard navigation ─── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft" || e.key === "Backspace") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "n" || e.key === "N") {
        setShowNotes((s) => !s);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, goNext, goPrev]);

  /* ─── Focus container on mount ─── */
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  const slide = slides[currentSlide];
  const accent = SLIDE_ACCENTS[currentSlide % SLIDE_ACCENTS.length];
  const progress = slides.length > 0 ? ((currentSlide + 1) / slides.length) * 100 : 0;

  /* ─── Loading state ─── */
  if (loading) {
    return (
      <div
        className="fixed inset-0 z-[999] flex items-center justify-center"
        style={{ background: "#0F0F14" }}
      >
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <CircleNotch
              className="w-16 h-16 animate-spin"
              style={{ color: "#8B5CF6" }}
            />
            <Sparkle
              className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ color: "#C4B5FD" }}
              weight="fill"
            />
          </div>
          <p style={{ color: "#A1A1AA", fontSize: "15px", fontWeight: 500 }}>
            Generating presentation...
          </p>
          <p style={{ color: "#52525B", fontSize: "13px" }}>
            AI is creating slides from your document
          </p>
        </div>
      </div>
    );
  }

  /* ─── Error state ─── */
  if (error || slides.length === 0) {
    return (
      <div
        className="fixed inset-0 z-[999] flex items-center justify-center"
        style={{ background: "#0F0F14" }}
      >
        <div className="text-center space-y-4 max-w-md px-6">
          <Presentation className="w-12 h-12 mx-auto" style={{ color: "#EF4444" }} />
          <p style={{ color: "#FAFAFA", fontSize: "18px", fontWeight: 600 }}>
            Couldn't generate presentation
          </p>
          <p style={{ color: "#71717A", fontSize: "14px" }}>
            {error || "No slides were generated. Try adding more content to your document."}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-[6px] transition-colors hover:bg-white/10"
            style={{ color: "#A1A1AA", fontSize: "13px", border: "1px solid #27272A" }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[999] flex flex-col select-none"
      style={{ background: "#0F0F14" }}
      tabIndex={0}
    >
      {/* ─── Top bar ─── */}
      <div className="flex items-center justify-between h-12 px-4 shrink-0"
        style={{ background: "rgba(15, 15, 20, 0.95)" }}
      >
        <div className="flex items-center gap-3">
          <Sparkle className="w-4 h-4" style={{ color: accent }} weight="fill" />
          <span style={{ color: "#A1A1AA", fontSize: "13px", fontWeight: 500 }}>
            {docTitle}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Slide counter */}
          <span style={{ color: "#52525B", fontSize: "12px", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
            {currentSlide + 1} / {slides.length}
          </span>

          {/* Notes toggle */}
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="p-1.5 rounded-[5px] transition-colors hover:bg-white/10"
            style={{ color: showNotes ? accent : "#71717A" }}
            title="Toggle speaker notes (N)"
          >
            {showNotes ? (
              <SpeakerHigh className="w-4 h-4" />
            ) : (
              <SpeakerSlash className="w-4 h-4" />
            )}
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-[5px] transition-colors hover:bg-white/10"
            style={{ color: "#71717A" }}
            title="Exit (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ─── Progress bar ─── */}
      <div className="h-0.5 w-full shrink-0" style={{ background: "#1C1C22" }}>
        <motion.div
          className="h-full rounded-r-full"
          style={{ background: accent }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* ─── Main slide area ─── */}
      <div className="flex-1 flex min-h-0">
        {/* Slide content */}
        <div
          className="flex-1 flex items-center justify-center p-6 md:p-12 relative cursor-pointer"
          onClick={(e) => {
            const rect = (e.target as HTMLElement).getBoundingClientRect();
            const x = e.clientX - rect.left;
            if (x > rect.width / 2) goNext();
            else goPrev();
          }}
        >
          {/* Nav arrows — hover revealed */}
          <button
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-opacity opacity-0 hover:opacity-100"
            style={{ background: "rgba(255,255,255,0.08)", color: "#A1A1AA" }}
            disabled={currentSlide === 0}
          >
            <CaretLeft className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-opacity opacity-0 hover:opacity-100"
            style={{ background: "rgba(255,255,255,0.08)", color: "#A1A1AA" }}
            disabled={currentSlide === slides.length - 1}
          >
            <CaretRight className="w-5 h-5" />
          </button>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              className="w-full max-w-3xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
            >
              {slide && <SlideContent slide={slide} accent={accent} slideIndex={currentSlide} totalSlides={slides.length} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Speaker notes panel */}
        <AnimatePresence>
          {showNotes && slide?.notes && (
            <motion.div
              className="w-72 shrink-0 border-l overflow-y-auto p-4"
              style={{ borderColor: "#27272A", background: "#18181B" }}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 288, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <SpeakerHigh className="w-3.5 h-3.5" style={{ color: "#52525B" }} />
                <span style={{ color: "#71717A", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Speaker Notes
                </span>
              </div>
              <p style={{ color: "#A1A1AA", fontSize: "13px", lineHeight: 1.7 }}>
                {slide.notes}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Slide thumbnails strip ─── */}
      <div
        className="h-16 shrink-0 border-t flex items-center gap-2 px-4 overflow-x-auto"
        style={{ borderColor: "#27272A", background: "#18181B" }}
      >
        {slides.map((s, i) => (
          <button
            key={i}
            onClick={() => setCurrentSlide(i)}
            className="shrink-0 w-20 h-11 rounded-[4px] flex items-center justify-center transition-all"
            style={{
              background: i === currentSlide ? `${SLIDE_ACCENTS[i % SLIDE_ACCENTS.length]}20` : "#27272A",
              border: i === currentSlide ? `2px solid ${SLIDE_ACCENTS[i % SLIDE_ACCENTS.length]}` : "2px solid transparent",
            }}
          >
            <span style={{
              color: i === currentSlide ? "#FAFAFA" : "#52525B",
              fontSize: "10px",
              fontWeight: 600,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "60px",
            }}>
              {s.title || `Slide ${i + 1}`}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Individual Slide Renderer ─── */

function SlideContent({
  slide,
  accent,
  slideIndex,
  totalSlides,
}: {
  slide: Slide;
  accent: string;
  slideIndex: number;
  totalSlides: number;
}) {
  const isTitle = slide.layout === "title";
  const isClosing = slide.layout === "closing";
  const isQuote = slide.layout === "quote";

  if (isTitle) {
    return (
      <div className="text-center space-y-6">
        <div className="w-12 h-1 rounded-full mx-auto" style={{ background: accent }} />
        <h1 style={{ color: "#FAFAFA", fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.02em" }}>
          {slide.title}
        </h1>
        {slide.bullets.length > 0 && (
          <p style={{ color: "#71717A", fontSize: "clamp(14px, 2vw, 18px)", maxWidth: "480px", margin: "0 auto", lineHeight: 1.6 }}>
            {slide.bullets[0]}
          </p>
        )}
        <div className="w-12 h-1 rounded-full mx-auto" style={{ background: accent, opacity: 0.4 }} />
      </div>
    );
  }

  if (isQuote) {
    const quoteText = slide.bullets[0] || slide.title;
    const attribution = slide.bullets[1] || "";
    return (
      <div className="text-center space-y-6 px-4">
        <Quotes className="w-10 h-10 mx-auto" style={{ color: accent, opacity: 0.5 }} weight="fill" />
        <blockquote style={{
          color: "#E4E4E7",
          fontSize: "clamp(18px, 3vw, 28px)",
          lineHeight: 1.5,
          fontStyle: "italic",
          maxWidth: "600px",
          margin: "0 auto",
        }}>
          "{quoteText}"
        </blockquote>
        {attribution && (
          <p style={{ color: "#52525B", fontSize: "14px", fontWeight: 500 }}>
            — {attribution}
          </p>
        )}
      </div>
    );
  }

  if (isClosing) {
    return (
      <div className="text-center space-y-6">
        <h2 style={{ color: "#FAFAFA", fontSize: "clamp(24px, 4vw, 40px)", fontWeight: 700, lineHeight: 1.2 }}>
          {slide.title}
        </h2>
        {slide.bullets.map((b, i) => (
          <p key={i} style={{ color: "#A1A1AA", fontSize: "clamp(14px, 2vw, 18px)", maxWidth: "480px", margin: "0 auto", lineHeight: 1.6 }}>
            {b}
          </p>
        ))}
        <div className="flex items-center justify-center gap-2 mt-8">
          <Sparkle className="w-4 h-4" style={{ color: accent }} weight="fill" />
          <span style={{ color: "#52525B", fontSize: "12px", fontWeight: 500 }}>Canto Presentation</span>
        </div>
      </div>
    );
  }

  // Default: content/bullets layout
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="w-8 h-1 rounded-full" style={{ background: accent }} />
        <h2 style={{ color: "#FAFAFA", fontSize: "clamp(22px, 3.5vw, 36px)", fontWeight: 700, lineHeight: 1.2 }}>
          {slide.title}
        </h2>
      </div>

      <div className="space-y-4">
        {slide.bullets.map((bullet, i) => (
          <motion.div
            key={i}
            className="flex items-start gap-3"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div
              className="w-2 h-2 rounded-full mt-2.5 shrink-0"
              style={{ background: accent, opacity: 0.7 }}
            />
            <p style={{ color: "#D4D4D8", fontSize: "clamp(14px, 2vw, 20px)", lineHeight: 1.6 }}>
              {bullet}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Slide number */}
      <div style={{ color: "#3F3F46", fontSize: "12px", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
        {slideIndex + 1}
      </div>
    </div>
  );
}

export default PresentationView;