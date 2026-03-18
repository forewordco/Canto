/* ═══════════════════════════════════════════════════════════
   PWA PUSH NOTIFICATIONS — Service worker registration,
   push subscription management, and notification display.

   Phase 9 P9-4 of Canto build plan.

   Service worker handles:
   - Push event listener for background notifications
   - Notification click handler for navigation
   - Cache strategies for offline support

   NOTE: Full service worker file (/sw.js) is a prerequisite
   from Phase 11 P11-1. This module provides the client-side
   subscription management and SW registration utilities.
   ═══════════════════════════════════════════════════════════ */

import { useState, useEffect, useCallback } from "react";
import { api } from "./api";

/* ─── Constants ─── */

/**
 * VAPID public key — fetched dynamically from the server.
 * The server generates and stores VAPID keys in KV on first request.
 * Cached in-memory after first successful fetch.
 */
let cachedVapidPublicKey: string | null = null;

/**
 * Fetch the VAPID public key from the server (cached after first call).
 */
async function getVapidPublicKey(): Promise<string | null> {
  if (cachedVapidPublicKey) return cachedVapidPublicKey;

  try {
    const { data, error } = await api.get<{ publicKey: string }>("/push/vapid-public-key");
    if (error || !data?.publicKey) {
      console.warn("[Push] Failed to fetch VAPID public key:", error);
      return null;
    }
    cachedVapidPublicKey = data.publicKey;
    console.log("[Push] VAPID public key fetched successfully");
    return cachedVapidPublicKey;
  } catch (err) {
    console.warn("[Push] Error fetching VAPID public key:", err);
    return null;
  }
}

/* ─── Service Worker Registration ─── */

/**
 * Register the service worker if available.
 * Returns the ServiceWorkerRegistration or null.
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) {
    console.log("[Push] Service workers not supported");
    return null;
  }

  // Skip SW registration in environments where sw.js won't be served correctly
  // (e.g., Figma preview iframes that return HTML for missing assets)
  try {
    const swUrl = new URL("/sw.js", window.location.origin);
    const probe = await fetch(swUrl.href, { method: "HEAD" });
    const ct = probe.headers.get("content-type") || "";
    if (!ct.includes("javascript") && !ct.includes("ecmascript")) {
      console.log("[Push] Skipping SW registration — /sw.js not served as JavaScript (content-type:", ct, ")");
      return null;
    }
  } catch {
    console.log("[Push] Skipping SW registration — could not probe /sw.js");
    return null;
  }

  try {
    // Check if already registered
    const existing = await navigator.serviceWorker.getRegistration("/");
    if (existing) {
      console.log("[Push] Service worker already registered:", existing.scope);
      // Check for updates
      existing.update().catch(() => {});
      await navigator.serviceWorker.ready;
      return existing;
    }

    // Register the service worker
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });

    console.log("[Push] Service worker registered:", registration.scope);

    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready;
    console.log("[Push] Service worker ready");

    return registration;
  } catch (err) {
    console.warn("[Push] Service worker registration failed:", err);
    return null;
  }
}

/* ─── Push Subscription Management ─── */

/**
 * Check if push notifications are supported and available.
 */
export function isPushSupported(): boolean {
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/**
 * Get the current push subscription from the service worker.
 */
export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator)) return null;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription;
  } catch {
    return null;
  }
}

/**
 * Subscribe to push notifications.
 * Requests notification permission, creates a push subscription,
 * and sends it to the server for storage.
 */
export async function subscribeToPush(): Promise<{
  success: boolean;
  error?: string;
  subscription?: PushSubscription;
}> {
  if (!isPushSupported()) {
    return { success: false, error: "Push notifications are not supported in this browser" };
  }

  try {
    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { success: false, error: "Notification permission denied" };
    }

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Create new subscription
      const vapidPublicKey = await getVapidPublicKey();
      if (!vapidPublicKey) {
        // Without VAPID key, we can only use the Notification API directly
        // Store a placeholder subscription on the server
        const { error } = await api.post("/push/subscribe", {
          subscription: {
            endpoint: `notification-api-${Date.now()}`,
            type: "notification-api",
            userAgent: navigator.userAgent,
          },
        });

        if (error) {
          return { success: false, error: `Server subscription failed: ${error}` };
        }

        return { success: true };
      }

      // Convert VAPID key to Uint8Array
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
    }

    // Send subscription to server
    const { error } = await api.post("/push/subscribe", {
      subscription: subscription.toJSON(),
    });

    if (error) {
      return { success: false, error: `Server subscription storage failed: ${error}` };
    }

    console.log("[Push] Successfully subscribed to push notifications");
    return { success: true, subscription };
  } catch (err) {
    console.error("[Push] Subscription error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Push subscription failed",
    };
  }
}

/**
 * Unsubscribe from push notifications.
 */
export async function unsubscribeFromPush(): Promise<{ success: boolean; error?: string }> {
  try {
    const subscription = await getCurrentSubscription();
    if (subscription) {
      // Unsubscribe from push manager
      await subscription.unsubscribe();

      // Remove from server
      const { error } = await api.post("/push/unsubscribe", {
        endpoint: subscription.endpoint,
      });

      if (error) {
        console.warn("[Push] Server unsubscribe failed:", error);
      }
    }

    console.log("[Push] Successfully unsubscribed from push notifications");
    return { success: true };
  } catch (err) {
    console.error("[Push] Unsubscribe error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unsubscribe failed",
    };
  }
}

/* ─── Push Status Hook ─── */

export interface PushStatus {
  supported: boolean;
  permission: NotificationPermission;
  subscribed: boolean;
  loading: boolean;
  error: string | null;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
  refreshStatus: () => Promise<void>;
}

export function usePushNotifications(): PushStatus {
  const [supported] = useState(() => isPushSupported());
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    if (!supported) return;

    try {
      // Check local subscription
      const sub = await getCurrentSubscription();
      if (sub) {
        setSubscribed(true);
        return;
      }

      // Check server
      const { data } = await api.get<{ subscribed: boolean }>("/push/status");
      setSubscribed(data?.subscribed || false);
    } catch {
      // Silently fail
    }
  }, [supported]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  // Update permission when it changes
  useEffect(() => {
    if (typeof Notification !== "undefined") {
      setPermission(Notification.permission);
    }
  }, []);

  const subscribe = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await subscribeToPush();
      if (result.success) {
        setSubscribed(true);
        setPermission(Notification.permission);
      } else {
        setError(result.error || "Subscription failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Subscription failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await unsubscribeFromPush();
      if (result.success) {
        setSubscribed(false);
      } else {
        setError(result.error || "Unsubscribe failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unsubscribe failed");
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    supported,
    permission,
    subscribed,
    loading,
    error,
    subscribe,
    unsubscribe,
    refreshStatus,
  };
}

/* ─── Utility ─── */

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}