/* ===================================================================
   VALIDATION & SANITIZATION — Input validation for all user-facing
   forms. XSS prevention, max-length enforcement, file size limits.

   Phase 16 of Canto build plan (P16-5).
   =================================================================== */

/* ── Constants ── */

/** Maximum lengths for various fields */
export const MAX_LENGTHS = {
  taskTitle: 200,
  taskDescription: 10000,
  projectName: 100,
  projectDescription: 2000,
  sectionLabel: 100,
  commentText: 5000,
  tagName: 50,
  docTitle: 200,
  docContent: 100000,
  displayName: 80,
  email: 254,
  clientName: 100,
  clientNotes: 5000,
  searchQuery: 200,
} as const;

/** File upload limits */
export const FILE_LIMITS = {
  maxSizeMB: 25,
  maxSizeBytes: 25 * 1024 * 1024, // 25MB
  maxFileCount: 10,
  allowedImageTypes: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ],
  allowedDocTypes: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "text/csv",
    "text/markdown",
  ],
} as const;

/* ��─ Sanitization ── */

/**
 * Strips potentially dangerous HTML/script content from a string.
 * Replaces < and > with entities to prevent XSS.
 */
export function sanitizeText(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, ""); // Strip inline event handlers
}

/**
 * Sanitizes text but preserves basic whitespace formatting.
 * For description and comment fields.
 */
export function sanitizeRichText(input: string): string {
  return sanitizeText(input);
}

/**
 * Truncates a string to a maximum length, appending "..." if truncated.
 */
export function truncate(input: string, maxLength: number): string {
  if (input.length <= maxLength) return input;
  return input.slice(0, maxLength - 3) + "...";
}

/**
 * Enforces max length on a string, silently clipping.
 * Use this for form inputs.
 */
export function enforceMaxLength(input: string, maxLength: number): string {
  return input.slice(0, maxLength);
}

/* ── Validation ── */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate a task title.
 */
export function validateTaskTitle(title: string): ValidationResult {
  const trimmed = title.trim();
  if (!trimmed) return { valid: false, error: "Task title is required" };
  if (trimmed.length > MAX_LENGTHS.taskTitle)
    return { valid: false, error: `Title must be under ${MAX_LENGTHS.taskTitle} characters` };
  return { valid: true };
}

/**
 * Validate a project name.
 */
export function validateProjectName(name: string): ValidationResult {
  const trimmed = name.trim();
  if (!trimmed) return { valid: false, error: "Project name is required" };
  if (trimmed.length > MAX_LENGTHS.projectName)
    return { valid: false, error: `Name must be under ${MAX_LENGTHS.projectName} characters` };
  return { valid: true };
}

/**
 * Validate a comment.
 */
export function validateComment(text: string): ValidationResult {
  const trimmed = text.trim();
  if (!trimmed) return { valid: false, error: "Comment cannot be empty" };
  if (trimmed.length > MAX_LENGTHS.commentText)
    return { valid: false, error: `Comment must be under ${MAX_LENGTHS.commentText} characters` };
  return { valid: true };
}

/**
 * Validate an email address.
 */
export function validateEmail(email: string): ValidationResult {
  const trimmed = email.trim();
  if (!trimmed) return { valid: false, error: "Email is required" };
  if (trimmed.length > MAX_LENGTHS.email)
    return { valid: false, error: "Email is too long" };
  // Simple email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) return { valid: false, error: "Invalid email format" };
  return { valid: true };
}

/**
 * Validate a display name.
 */
export function validateDisplayName(name: string): ValidationResult {
  const trimmed = name.trim();
  if (!trimmed) return { valid: false, error: "Name is required" };
  if (trimmed.length > MAX_LENGTHS.displayName)
    return { valid: false, error: `Name must be under ${MAX_LENGTHS.displayName} characters` };
  if (trimmed.length < 2)
    return { valid: false, error: "Name must be at least 2 characters" };
  return { valid: true };
}

/**
 * Validate a file for upload.
 */
export function validateFile(file: File): ValidationResult {
  if (file.size > FILE_LIMITS.maxSizeBytes) {
    return {
      valid: false,
      error: `File "${file.name}" exceeds ${FILE_LIMITS.maxSizeMB}MB limit (${(file.size / 1024 / 1024).toFixed(1)}MB)`,
    };
  }
  return { valid: true };
}

/**
 * Validate a batch of files for upload.
 */
export function validateFiles(files: File[]): ValidationResult {
  if (files.length > FILE_LIMITS.maxFileCount) {
    return {
      valid: false,
      error: `Maximum ${FILE_LIMITS.maxFileCount} files per upload`,
    };
  }
  for (const file of files) {
    const result = validateFile(file);
    if (!result.valid) return result;
  }
  return { valid: true };
}

/**
 * Validate a URL string.
 */
export function validateUrl(url: string): ValidationResult {
  const trimmed = url.trim();
  if (!trimmed) return { valid: false, error: "URL is required" };
  try {
    new URL(trimmed);
    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }
}

/**
 * Validate a date string (ISO format).
 */
export function validateDate(dateStr: string): ValidationResult {
  if (!dateStr) return { valid: true }; // Dates are often optional
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return { valid: false, error: "Invalid date format" };
  return { valid: true };
}

/**
 * Validate a password.
 */
export function validatePassword(password: string): ValidationResult {
  if (!password) return { valid: false, error: "Password is required" };
  if (password.length < 6) return { valid: false, error: "Password must be at least 6 characters" };
  if (password.length > 128) return { valid: false, error: "Password is too long" };
  return { valid: true };
}

export default {
  MAX_LENGTHS,
  FILE_LIMITS,
  sanitizeText,
  sanitizeRichText,
  truncate,
  enforceMaxLength,
  validateTaskTitle,
  validateProjectName,
  validateComment,
  validateEmail,
  validateDisplayName,
  validateFile,
  validateFiles,
  validateUrl,
  validateDate,
  validatePassword,
};