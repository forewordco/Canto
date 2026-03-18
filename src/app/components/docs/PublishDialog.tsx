/* ===================================================================
   PUBLISH DIALOG — Modal for publishing/unpublishing documents.
   
   Shows publish/update/unpublish buttons, published URL with copy,
   published status indicator, and last published timestamp.
   =================================================================== */

import { useState } from "react";
import {
  Globe,
  LinkSimple,
  X,
  ClipboardText,
  CheckCircle,
  CircleNotch,
  ArrowSquareOut,
} from "@phosphor-icons/react";
import { motion } from "motion/react";
import { toast } from "sonner";

interface PublishDialogProps {
  docTitle: string;
  publishSlug: string | null;
  isPublishing: boolean;
  onPublish: () => Promise<void>;
  onUnpublish: () => Promise<void>;
  onClose: () => void;
}

export function PublishDialog({
  docTitle,
  publishSlug,
  isPublishing,
  onPublish,
  onUnpublish,
  onClose,
}: PublishDialogProps) {
  const [copied, setCopied] = useState(false);
  const isPublished = !!publishSlug;
  const publishedUrl = publishSlug
    ? `${window.location.origin}/#/published/${publishSlug}`
    : null;

  const handleCopy = () => {
    if (!publishedUrl) return;
    navigator.clipboard?.writeText(publishedUrl).then(() => {
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="fixed inset-0 bg-black/40" />
      <motion.div
        className="relative w-full max-w-md rounded-[12px] shadow-2xl border overflow-hidden"
        style={{ background: "var(--surface-bg)", borderColor: "var(--border-default)" }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-[6px] flex items-center justify-center"
              style={{
                background: isPublished ? "oklch(0.85 0.15 155 / 0.15)" : "var(--neutral-100)",
              }}
            >
              <Globe
                className="w-4.5 h-4.5"
                style={{ color: isPublished ? "oklch(0.47 0.12 155)" : "var(--text-quaternary)" }}
                weight={isPublished ? "fill" : "regular"}
              />
            </div>
            <div>
              <h3
                style={{
                  color: "var(--text-primary)",
                  fontSize: "15px",
                  fontWeight: 600,
                }}
              >
                Publish to Web
              </h3>
              <p style={{ color: "var(--text-quaternary)", fontSize: "12px" }}>
                {isPublished ? "This document is live" : "Share publicly with a link"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[5px] transition-colors hover:bg-black/[0.05]"
            style={{ color: "var(--text-quaternary)" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Document name */}
        <div className="px-5 pb-3">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-[6px]"
            style={{ background: "var(--neutral-50)", border: "1px solid var(--border-default)" }}
          >
            <ClipboardText className="w-4 h-4 shrink-0" style={{ color: "var(--text-quaternary)" }} />
            <span
              className="truncate"
              style={{ color: "var(--text-primary)", fontSize: "13px", fontWeight: 500 }}
            >
              {docTitle || "Untitled"}
            </span>
          </div>
        </div>

        {/* Published URL */}
        {isPublished && publishedUrl && (
          <div className="px-5 pb-3">
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-[6px]"
              style={{ background: "oklch(0.85 0.15 155 / 0.08)", border: "1px solid oklch(0.85 0.15 155 / 0.2)" }}
            >
              <LinkSimple className="w-3.5 h-3.5 shrink-0" style={{ color: "oklch(0.47 0.12 155)" }} />
              <span
                className="truncate flex-1"
                style={{ color: "oklch(0.47 0.12 155)", fontSize: "12px", fontWeight: 500 }}
              >
                {publishedUrl}
              </span>
              <button
                onClick={handleCopy}
                className="shrink-0 p-1 rounded-[4px] transition-colors hover:bg-black/[0.05]"
                style={{ color: "oklch(0.47 0.12 155)" }}
                title="Copy link"
              >
                {copied ? (
                  <CheckCircle className="w-3.5 h-3.5" weight="fill" />
                ) : (
                  <ClipboardText className="w-3.5 h-3.5" />
                )}
              </button>
              <a
                href={publishedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 p-1 rounded-[4px] transition-colors hover:bg-black/[0.05]"
                style={{ color: "oklch(0.47 0.12 155)" }}
                title="Open in new tab"
              >
                <ArrowSquareOut className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        {/* Status indicator */}
        {isPublished && (
          <div className="px-5 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: "#22C55E" }} />
              <span style={{ color: "var(--text-tertiary)", fontSize: "12px" }}>
                Published and visible to anyone with the link
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div
          className="flex items-center gap-2 px-5 py-4 border-t"
          style={{ borderColor: "var(--border-default)" }}
        >
          {isPublished ? (
            <>
              <button
                onClick={async () => { await onPublish(); }}
                disabled={isPublishing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-[6px] text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: "oklch(0.47 0.12 155)", fontSize: "13px", fontWeight: 500 }}
              >
                {isPublishing ? (
                  <CircleNotch className="w-4 h-4 animate-spin" />
                ) : (
                  <Globe className="w-4 h-4" />
                )}
                Update Published
              </button>
              <button
                onClick={async () => { await onUnpublish(); }}
                disabled={isPublishing}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-[6px] transition-colors hover:bg-black/[0.04] disabled:opacity-50"
                style={{
                  border: "1px solid var(--border-default)",
                  color: "var(--text-tertiary)",
                  fontSize: "13px",
                  fontWeight: 500,
                }}
              >
                Unpublish
              </button>
            </>
          ) : (
            <button
              onClick={async () => { await onPublish(); }}
              disabled={isPublishing}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-[6px] text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: "oklch(0.47 0.12 155)", fontSize: "13px", fontWeight: 500 }}
            >
              {isPublishing ? (
                <CircleNotch className="w-4 h-4 animate-spin" />
              ) : (
                <Globe className="w-4 h-4" />
              )}
              Publish to Web
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
