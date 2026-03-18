/* ═══════════════════════════════════════════════════════════
   AI SERVICE — Frontend client for Gemini AI server routes.
   Phase 12-5 of Canto build plan.
   ═══════════════════════════════════════════════════════════ */

import { api } from "./api";

/* ─── Types ─── */

export interface AiTaskSuggestion {
  title: string;
  priority: "high" | "medium" | "low";
  section?: string;
}

export interface AiSubtaskSuggestion {
  title: string;
}

export interface AiProjectSummary {
  summary: string;
  completionPercent: number;
  risksOrBlockers?: string[];
  nextSteps?: string[];
}

export interface AiStatusUpdate {
  title: string;
  content: string;
  sections?: { label: string; content: string }[];
}

export interface AiStatus {
  configured: boolean;
  model: string;
}

export type RewriteStyle = "concise" | "professional" | "friendly" | "detailed";

/* ─── Helpers ─── */

/** Extract a user-friendly error message from API error strings */
function friendlyAiError(error: string): string {
  if (error.includes("rate-limited") || error.includes("429") || error.includes("RESOURCE_EXHAUSTED")) {
    return "AI is temporarily rate-limited. Please wait a moment and try again.";
  }
  if (error.includes("not configured")) {
    return "Gemini API key is not configured on the server.";
  }
  return "AI request failed. Please try again.";
}

/* ─── API Functions ─── */

/** Check if Gemini AI is configured on the server */
export async function getAiStatus(): Promise<AiStatus | null> {
  const { data, error } = await api.get<AiStatus>("/ai/status");
  if (error) {
    console.error("[AI] Status check failed:", error);
    return null;
  }
  return data;
}

/** Generate task suggestions for a project */
export async function generateTasks(params: {
  projectName: string;
  projectDescription?: string;
  existingTasks?: string[];
  count?: number;
}): Promise<{ tasks: AiTaskSuggestion[] } | null> {
  const { data, error } = await api.post<{ tasks: AiTaskSuggestion[] }>(
    "/ai/generate-tasks",
    params,
    { timeout: 90000 }
  );
  if (error) {
    console.error("[AI] Task generation failed:", friendlyAiError(error));
    return null;
  }
  return data;
}

/** Suggest subtasks for a task */
export async function suggestSubtasks(params: {
  taskTitle: string;
  taskDescription?: string;
  projectName?: string;
  count?: number;
}): Promise<{ subtasks: AiSubtaskSuggestion[] } | null> {
  const { data, error } = await api.post<{ subtasks: AiSubtaskSuggestion[] }>(
    "/ai/suggest-subtasks",
    params,
    { timeout: 90000 }
  );
  if (error) {
    console.error("[AI] Subtask suggestion failed:", friendlyAiError(error));
    return null;
  }
  return data;
}

/** Summarize a project's current state */
export async function summarizeProject(params: {
  projectName: string;
  tasks: { title: string; status: string; completed: boolean }[];
  updates?: string[];
}): Promise<AiProjectSummary | null> {
  const { data, error } = await api.post<AiProjectSummary>(
    "/ai/summarize-project",
    params,
    { timeout: 90000 }
  );
  if (error) {
    console.error("[AI] Project summary failed:", friendlyAiError(error));
    return null;
  }
  return data;
}

/** Rewrite text in a given style */
export async function rewriteText(params: {
  text: string;
  style?: RewriteStyle;
}): Promise<{ rewritten: string } | null> {
  const { data, error } = await api.post<{ rewritten: string }>(
    "/ai/rewrite",
    params,
    { timeout: 90000 }
  );
  if (error) {
    console.error("[AI] Rewrite failed:", friendlyAiError(error));
    return null;
  }
  return data;
}

/** Chat with Canto AI */
export async function chatWithAi(params: {
  message: string;
  context?: string;
}): Promise<{ reply: string } | null> {
  const { data, error } = await api.post<{ reply: string }>(
    "/ai/chat",
    params,
    { timeout: 90000 }
  );
  if (error) {
    console.error("[AI] Chat failed:", friendlyAiError(error));
    return null;
  }
  return data;
}

/** Generate a project status update */
export async function generateUpdate(params: {
  projectName: string;
  tasks: { title: string; status: string; completed: boolean }[];
  recentChanges?: string[];
}): Promise<AiStatusUpdate | null> {
  const { data, error } = await api.post<AiStatusUpdate>(
    "/ai/generate-update",
    params,
    { timeout: 90000 }
  );
  if (error) {
    console.error("[AI] Update generation failed:", friendlyAiError(error));
    return null;
  }
  return data;
}