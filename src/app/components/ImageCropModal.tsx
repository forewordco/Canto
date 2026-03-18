/* ═══════════════════════════════════════════════════════════
   IMAGE CROP MODAL — Drag-to-reposition and zoom for avatar
   and banner image uploads. Outputs cropped blob.
   Phase 14 (P14-4) of Canto build plan.
   ═══════════════════════════════════════════════════════════ */

import { useState, useRef, useCallback, useEffect } from "react";
import {
  X,
  MagnifyingGlassPlus,
  MagnifyingGlassMinus,
  ArrowsOut,
  Check,
  Image as ImageIcon,
  ArrowCounterClockwise,
} from "@phosphor-icons/react";
import { motion } from "motion/react";

/* ─── Types ─── */

export type CropShape = "circle" | "rect";
export type CropAspect = "1:1" | "16:9" | "4:3" | "free";

interface ImageCropModalProps {
  /** The image source to crop (data URL or object URL) */
  imageSrc: string;
  /** Crop shape */
  shape?: CropShape;
  /** Aspect ratio for rect mode */
  aspect?: CropAspect;
  /** Output width in pixels */
  outputWidth?: number;
  /** Output height in pixels */
  outputHeight?: number;
  /** Called with the cropped image blob */
  onCrop: (blob: Blob, dataUrl: string) => void;
  /** Called when the modal is dismissed */
  onClose: () => void;
  /** Title shown in the header */
  title?: string;
}

/* ─── Aspect ratio helpers ─── */

const ASPECT_RATIOS: Record<CropAspect, number | null> = {
  "1:1": 1,
  "16:9": 16 / 9,
  "4:3": 4 / 3,
  free: null,
};

/* ─── Component ─── */

export function ImageCropModal({
  imageSrc,
  shape = "rect",
  aspect = "1:1",
  outputWidth = 512,
  outputHeight,
  onCrop,
  onClose,
  title = "Crop Image",
}: ImageCropModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [processing, setProcessing] = useState(false);

  const aspectRatio = ASPECT_RATIOS[aspect];
  const cropSize = 280; // px for the crop viewport
  const cropW = cropSize;
  const cropH = aspectRatio ? cropSize / aspectRatio : cropSize * 0.6;

  const finalOutputW = outputWidth;
  const finalOutputH = outputHeight || (aspectRatio ? Math.round(outputWidth / aspectRatio) : Math.round(outputWidth * 0.6));

  /* ─── Load image ─── */

  useEffect(() => {
    const img = new Image();
    // Only set crossOrigin for non-data URLs to avoid potential canvas tainting issues
    if (!imageSrc.startsWith("data:")) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => {
      imgRef.current = img;
      setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
      setImgLoaded(true);

      // Calculate initial zoom so image fills the crop area
      const scaleX = cropW / img.naturalWidth;
      const scaleY = cropH / img.naturalHeight;
      const initialZoom = Math.max(scaleX, scaleY) * 1.05; // slight overflow
      setZoom(initialZoom);
      setOffset({ x: 0, y: 0 });
    };
    img.onerror = () => {
      console.error("[ImageCrop] Failed to load image");
    };
    img.src = imageSrc;
  }, [imageSrc, cropW, cropH]);

  /* ─── Mouse/touch drag handlers ─── */

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      setDragging(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [offset]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      // Clamp offset to keep image within crop area
      const img = imgRef.current;
      if (!img) return;

      const displayW = img.naturalWidth * zoom;
      const displayH = img.naturalHeight * zoom;
      const maxOffsetX = Math.max(0, (displayW - cropW) / 2);
      const maxOffsetY = Math.max(0, (displayH - cropH) / 2);

      setOffset({
        x: Math.max(-maxOffsetX, Math.min(maxOffsetX, newX)),
        y: Math.max(-maxOffsetY, Math.min(maxOffsetY, newY)),
      });
    },
    [dragging, dragStart, zoom, cropW, cropH]
  );

  const handlePointerUp = useCallback(() => {
    setDragging(false);
  }, []);

  /* ─── Zoom ─── */

  const handleZoom = useCallback(
    (delta: number) => {
      const img = imgRef.current;
      if (!img) return;

      const minZoom = Math.max(cropW / img.naturalWidth, cropH / img.naturalHeight);
      const maxZoom = minZoom * 5;
      const newZoom = Math.max(minZoom, Math.min(maxZoom, zoom + delta));
      setZoom(newZoom);

      // Re-clamp offset
      const displayW = img.naturalWidth * newZoom;
      const displayH = img.naturalHeight * newZoom;
      const maxOffsetX = Math.max(0, (displayW - cropW) / 2);
      const maxOffsetY = Math.max(0, (displayH - cropH) / 2);
      setOffset((prev) => ({
        x: Math.max(-maxOffsetX, Math.min(maxOffsetX, prev.x)),
        y: Math.max(-maxOffsetY, Math.min(maxOffsetY, prev.y)),
      }));
    },
    [zoom, cropW, cropH]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      handleZoom(e.deltaY > 0 ? -0.02 : 0.02);
    },
    [handleZoom]
  );

  /* ─── Reset ─── */

  const handleReset = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    const scaleX = cropW / img.naturalWidth;
    const scaleY = cropH / img.naturalHeight;
    setZoom(Math.max(scaleX, scaleY) * 1.05);
    setOffset({ x: 0, y: 0 });
  }, [cropW, cropH]);

  /* ─── Crop & output ─── */

  const handleCrop = useCallback(async () => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    setProcessing(true);

    // Always output as PNG to preserve any transparency in the source image
    const mimeType = "image/png";

    try {
      canvas.width = finalOutputW;
      canvas.height = finalOutputH;
      const ctx = canvas.getContext("2d")!;

      // Clear canvas to fully transparent (critical for PNG transparency)
      ctx.clearRect(0, 0, finalOutputW, finalOutputH);

      // Calculate source rectangle
      const displayW = img.naturalWidth * zoom;
      const displayH = img.naturalHeight * zoom;

      // The visible crop area center relative to the full displayed image
      const cropCenterX = displayW / 2 - offset.x;
      const cropCenterY = displayH / 2 - offset.y;

      // Convert to source coordinates
      const srcCenterX = cropCenterX / zoom;
      const srcCenterY = cropCenterY / zoom;
      const srcW = cropW / zoom;
      const srcH = cropH / zoom;

      const srcX = srcCenterX - srcW / 2;
      const srcY = srcCenterY - srcH / 2;

      // Apply clip for circle shape
      if (shape === "circle") {
        ctx.beginPath();
        ctx.arc(finalOutputW / 2, finalOutputH / 2, finalOutputW / 2, 0, Math.PI * 2);
        ctx.clip();
      }

      ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, finalOutputW, finalOutputH);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const dataUrl = canvas.toDataURL(mimeType);
            onCrop(blob, dataUrl);
          }
          setProcessing(false);
        },
        mimeType
      );
    } catch (err) {
      console.error("[ImageCrop] Crop failed:", err);
      setProcessing(false);
    }
  }, [zoom, offset, cropW, cropH, finalOutputW, finalOutputH, shape, onCrop]);

  /* ─── Slider min/max ─── */

  const img = imgRef.current;
  const minZoom = img ? Math.max(cropW / img.naturalWidth, cropH / img.naturalHeight) : 0.1;
  const maxZoom = minZoom * 5;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0"
        style={{ background: "oklch(0.15 0.01 260 / 0.5)", backdropFilter: "blur(6px)" }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="relative rounded-[12px] shadow-2xl overflow-hidden"
        style={{
          background: "var(--surface-bg)",
          border: "1px solid var(--border-default)",
          width: "420px",
          maxWidth: "95vw",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3 border-b"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <div className="flex items-center gap-2">
            <ImageIcon size={16} style={{ color: "var(--text-tertiary)" }} />
            <h2 className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-[6px] flex items-center justify-center transition-colors hover:bg-black/[0.04]"
            style={{ color: "var(--text-quaternary)" }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Crop Area */}
        <div
          className="relative flex items-center justify-center overflow-hidden"
          style={{
            background: "oklch(0.12 0.01 260)",
            height: `${cropH + 80}px`,
          }}
        >
          {/* Dark overlay with cutout */}
          <div
            ref={containerRef}
            className="relative cursor-grab active:cursor-grabbing"
            style={{ width: `${cropW}px`, height: `${cropH}px` }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleWheel}
          >
            {/* Image */}
            {imgLoaded && imgRef.current && (
              <div
                className="absolute"
                style={{
                  width: `${imgRef.current.naturalWidth * zoom}px`,
                  height: `${imgRef.current.naturalHeight * zoom}px`,
                  left: `${cropW / 2 - (imgRef.current.naturalWidth * zoom) / 2 + offset.x}px`,
                  top: `${cropH / 2 - (imgRef.current.naturalHeight * zoom) / 2 + offset.y}px`,
                }}
              >
                <img
                  src={imageSrc}
                  alt=""
                  className="w-full h-full select-none pointer-events-none"
                  draggable={false}
                />
              </div>
            )}

            {/* Crop frame overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                borderRadius: shape === "circle" ? "50%" : "6px",
                boxShadow: `0 0 0 2000px oklch(0.12 0.01 260 / 0.6)`,
                border: "2px solid oklch(1 0 0 / 0.5)",
              }}
            />

            {/* Grid lines */}
            <div className="absolute inset-0 pointer-events-none" style={{ borderRadius: shape === "circle" ? "50%" : "6px" }}>
              <div className="absolute left-1/3 top-0 bottom-0 w-px" style={{ background: "oklch(1 0 0 / 0.15)" }} />
              <div className="absolute left-2/3 top-0 bottom-0 w-px" style={{ background: "oklch(1 0 0 / 0.15)" }} />
              <div className="absolute top-1/3 left-0 right-0 h-px" style={{ background: "oklch(1 0 0 / 0.15)" }} />
              <div className="absolute top-2/3 left-0 right-0 h-px" style={{ background: "oklch(1 0 0 / 0.15)" }} />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="px-5 py-3 space-y-3">
          {/* Zoom slider */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleZoom(-0.05)}
              className="w-7 h-7 rounded-[6px] flex items-center justify-center shrink-0 transition-colors hover:bg-black/[0.04]"
              style={{ color: "var(--text-tertiary)" }}
            >
              <MagnifyingGlassMinus size={16} />
            </button>
            <input
              type="range"
              min={minZoom}
              max={maxZoom}
              step={0.001}
              value={zoom}
              onChange={(e) => handleZoom(parseFloat(e.target.value) - zoom)}
              className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, var(--accent-primary) 0%, var(--accent-primary) ${((zoom - minZoom) / (maxZoom - minZoom)) * 100}%, var(--neutral-200) ${((zoom - minZoom) / (maxZoom - minZoom)) * 100}%, var(--neutral-200) 100%)`,
              }}
            />
            <button
              onClick={() => handleZoom(0.05)}
              className="w-7 h-7 rounded-[6px] flex items-center justify-center shrink-0 transition-colors hover:bg-black/[0.04]"
              style={{ color: "var(--text-tertiary)" }}
            >
              <MagnifyingGlassPlus size={16} />
            </button>
            <button
              onClick={handleReset}
              className="w-7 h-7 rounded-[6px] flex items-center justify-center shrink-0 transition-colors hover:bg-black/[0.04]"
              style={{ color: "var(--text-quaternary)" }}
              title="Reset"
            >
              <ArrowCounterClockwise size={14} />
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-[6px] text-[13px] font-medium transition-colors hover:bg-black/[0.04]"
              style={{ color: "var(--text-secondary)" }}
            >
              Cancel
            </button>
            <button
              onClick={handleCrop}
              disabled={processing || !imgLoaded}
              className="px-4 py-2 rounded-[6px] text-[13px] font-medium text-white flex items-center gap-1.5 disabled:opacity-50 transition-colors"
              style={{ background: "var(--accent-primary)" }}
            >
              {processing ? (
                <>
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check size={14} weight="bold" />
                  Apply
                </>
              )}
            </button>
          </div>
        </div>

        {/* Hidden canvas for output */}
        <canvas ref={canvasRef} className="hidden" />
      </motion.div>
    </div>
  );
}