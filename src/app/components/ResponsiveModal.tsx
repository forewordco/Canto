/* ===================================================================
   RESPONSIVE MODAL — Bottom sheet on mobile, dialog/panel on desktop.
   
   Uses vaul's Drawer component on mobile (< 768px) and a motion-based
   overlay panel on desktop. Provides a consistent API for both.
   
   Phase 11 mobile optimization (P11-5: modals-as-bottom-sheets).
   =================================================================== */

import { useCallback, useEffect } from "react";
import { Drawer as VaulDrawer } from "vaul";
import { motion, AnimatePresence } from "motion/react";
import { X } from "@phosphor-icons/react";
import { useIsMobile } from "./ui/use-mobile";

/* ─── Types ─── */

interface ResponsiveModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Title shown in the header */
  title?: string;
  /** Optional subtitle / description */
  description?: string;
  /** Max width on desktop (default: 480px) */
  desktopMaxWidth?: string;
  /** Snap points for vaul drawer. Default: ["85vh"] */
  snapPoints?: (string | number)[];
  /** Whether the modal is full-screen on mobile (no snap). Default: false */
  fullScreen?: boolean;
  /** Hide the close X button */
  hideClose?: boolean;
}

/* ─── MOBILE DRAWER (vaul) ─── */

function MobileDrawer({
  open,
  onClose,
  children,
  title,
  description,
  snapPoints,
  fullScreen,
  hideClose,
}: ResponsiveModalProps) {
  return (
    <VaulDrawer.Root
      open={open}
      onOpenChange={(v) => !v && onClose()}
      snapPoints={fullScreen ? undefined : snapPoints || ["85vh"]}
    >
      <VaulDrawer.Portal>
        <VaulDrawer.Overlay
          className="fixed inset-0 z-50 bg-black/40"
          style={{ backdropFilter: "blur(2px)" }}
        />
        <VaulDrawer.Content
          className="fixed z-50 inset-x-0 bottom-0 flex flex-col rounded-t-[16px] overflow-hidden"
          style={{
            background: "var(--surface-bg)",
            maxHeight: fullScreen ? "95vh" : "85vh",
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
          }}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div
              className="w-10 h-1 rounded-full"
              style={{ background: "var(--neutral-300)" }}
            />
          </div>

          {/* Header */}
          {(title || !hideClose) && (
            <div className="flex items-center justify-between px-4 pb-3">
              <div className="flex-1 min-w-0">
                {title && (
                  <VaulDrawer.Title
                    className="font-semibold truncate"
                    style={{
                      color: "var(--text-primary)",
                      fontSize: "16px",
                    }}
                  >
                    {title}
                  </VaulDrawer.Title>
                )}
                {description && (
                  <VaulDrawer.Description
                    className="mt-0.5 truncate"
                    style={{
                      color: "var(--text-tertiary)",
                      fontSize: "13px",
                    }}
                  >
                    {description}
                  </VaulDrawer.Description>
                )}
              </div>
              {!hideClose && (
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-[6px] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors shrink-0"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">{children}</div>
        </VaulDrawer.Content>
      </VaulDrawer.Portal>
    </VaulDrawer.Root>
  );
}

/* ─── DESKTOP DIALOG (motion) ─── */

function DesktopDialog({
  open,
  onClose,
  children,
  title,
  description,
  desktopMaxWidth = "480px",
  hideClose,
}: ResponsiveModalProps) {
  // Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="fixed z-50 inset-0 flex items-center justify-center p-6 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="pointer-events-auto w-full flex flex-col rounded-[12px] overflow-hidden shadow-2xl"
              style={{
                maxWidth: desktopMaxWidth,
                maxHeight: "80vh",
              }}
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              transition={{ type: "spring", damping: 28, stiffness: 350 }}
            >
              {/* Wrapper div for oklch-safe CSS variable styles */}
              <div className="flex flex-col overflow-hidden rounded-[12px]" style={{ background: "var(--surface-bg)", border: "1px solid var(--border-default)" }}>
                {/* Header */}
                {(title || !hideClose) && (
                  <div
                    className="flex items-center justify-between px-5 py-3.5 border-b shrink-0"
                    style={{ borderColor: "var(--border-default)" }}
                  >
                    <div className="flex-1 min-w-0">
                      {title && (
                        <h2
                          className="font-semibold truncate"
                          style={{
                            color: "var(--text-primary)",
                            fontSize: "15px",
                          }}
                        >
                          {title}
                        </h2>
                      )}
                      {description && (
                        <p
                          className="mt-0.5 truncate"
                          style={{
                            color: "var(--text-tertiary)",
                            fontSize: "13px",
                          }}
                        >
                          {description}
                        </p>
                      )}
                    </div>
                    {!hideClose && (
                      <button
                        onClick={onClose}
                        className="p-1.5 rounded-[6px] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors shrink-0"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-5 py-4">
                  {children}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─── RESPONSIVE MODAL (exported) ─── */

export function ResponsiveModal(props: ResponsiveModalProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileDrawer {...props} />;
  }

  return <DesktopDialog {...props} />;
}

/* ─── RESPONSIVE FILTER DRAWER ─── */

/**
 * A filter panel that renders inline on desktop but as a bottom sheet on mobile.
 * Use this for search/filter UIs in list views.
 */
interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export function FilterDrawer({ open, onClose, children, title = "Filters" }: FilterDrawerProps) {
  const isMobile = useIsMobile();

  // On desktop, render inline (caller handles visibility)
  if (!isMobile) {
    return <>{open ? children : null}</>;
  }

  // On mobile, render as a bottom sheet
  return (
    <VaulDrawer.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <VaulDrawer.Portal>
        <VaulDrawer.Overlay
          className="fixed inset-0 z-50 bg-black/40"
          style={{ backdropFilter: "blur(2px)" }}
        />
        <VaulDrawer.Content
          className="fixed z-50 inset-x-0 bottom-0 flex flex-col rounded-t-[16px] overflow-hidden"
          style={{
            background: "var(--surface-bg)",
            maxHeight: "70vh",
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
          }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full" style={{ background: "var(--neutral-300)" }} />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 pb-2">
            <VaulDrawer.Title
              className="font-semibold"
              style={{ color: "var(--text-primary)", fontSize: "15px" }}
            >
              {title}
            </VaulDrawer.Title>
            <button
              onClick={onClose}
              className="p-1.5 rounded-[6px] hover:bg-black/[0.04] transition-colors"
              style={{ color: "var(--text-tertiary)" }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="px-4 pb-4 overflow-y-auto">{children}</div>
        </VaulDrawer.Content>
      </VaulDrawer.Portal>
    </VaulDrawer.Root>
  );
}