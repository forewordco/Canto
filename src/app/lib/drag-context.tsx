/* ═══════════════════════════════════════════════════════════
   DRAG CONTEXT — Cross-component drag-and-drop state
   Enables dragging tasks/resources to right sidebar panels
   (notepad, chat, calendar) via HTML5 Drag & Drop API.
   ═══════════════════════════════════════════════════════════ */

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type DragItemType = "task" | "resource";

export interface DragPayload {
  type: DragItemType;
  id: string;
  title: string;
  projectName?: string;
  /** For tasks */
  taskDate?: string;
  taskStatus?: string;
  /** For resources */
  resourceType?: string;
  resourceUrl?: string;
}

interface DragContextValue {
  /** Currently dragged item (null when not dragging) */
  dragging: DragPayload | null;
  setDragging: (payload: DragPayload | null) => void;
  /** Pending drop — set when item is dropped on a panel target */
  pendingDrop: { target: string; payload: DragPayload } | null;
  consumeDrop: () => { target: string; payload: DragPayload } | null;
  enqueueDrop: (target: string, payload: DragPayload) => void;
}

const DragCtx = createContext<DragContextValue>({
  dragging: null,
  setDragging: () => {},
  pendingDrop: null,
  consumeDrop: () => null,
  enqueueDrop: () => {},
});

export function DragProvider({ children }: { children: ReactNode }) {
  const [dragging, setDragging] = useState<DragPayload | null>(null);
  const [pendingDrop, setPendingDrop] = useState<{ target: string; payload: DragPayload } | null>(null);

  const enqueueDrop = useCallback((target: string, payload: DragPayload) => {
    setPendingDrop({ target, payload });
  }, []);

  const consumeDrop = useCallback(() => {
    const current = pendingDrop;
    if (current) setPendingDrop(null);
    return current ?? null;
  }, [pendingDrop]);

  return (
    <DragCtx.Provider value={{ dragging, setDragging, pendingDrop, consumeDrop, enqueueDrop }}>
      {children}
    </DragCtx.Provider>
  );
}

export function useDrag() {
  return useContext(DragCtx);
}

/* ─── Helper: Build drag data for HTML5 DnD ─── */

export function setDragData(e: React.DragEvent, payload: DragPayload) {
  e.dataTransfer.setData("application/canto-drag", JSON.stringify(payload));
  e.dataTransfer.effectAllowed = "copy";
}

export function getDragData(e: React.DragEvent): DragPayload | null {
  try {
    const raw = e.dataTransfer.getData("application/canto-drag");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function hasDragData(e: React.DragEvent): boolean {
  return e.dataTransfer.types.includes("application/canto-drag");
}

/** Format a mention string for inserting into text */
export function formatMention(payload: DragPayload): string {
  const prefix = payload.type === "task" ? "Task" : "Resource";
  const project = payload.projectName ? ` (${payload.projectName})` : "";
  return `[${prefix}: ${payload.title}${project}]`;
}
