"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import localforage from "localforage";
import { OfflineReportPayload, OFFLINE_REPORT_PREFIX } from "@/lib/offline-types";

// ---------------------------------------------------------------------------
// useBackgroundSync — Silently flushes offline report queue on reconnection
// ---------------------------------------------------------------------------

interface BackgroundSyncResult {
  /** True while the sync engine is actively flushing the queue */
  isSyncing: boolean;
  /** Number of reports still waiting in IndexedDB */
  pendingCount: number;
  /** Manually trigger a flush (e.g., from a retry button) */
  flushQueue: () => Promise<void>;
  /** Manually discard all stuck offline reports */
  clearQueue: () => Promise<void>;
}

/**
 * Custom hook that listens for the browser `online` event and flushes
 * any pending offline reports from IndexedDB to the `/api/report` endpoint.
 *
 * @param onReportSynced - Callback to inject the new report into React state
 * @param onToast - Callback to show a toast notification
 */
export function useBackgroundSync(
  onReportSynced: (updater: (prev: unknown[]) => unknown[]) => void,
  onToast: (toast: { message: string; type: "success" | "error" | "info" }) => void
): BackgroundSyncResult {
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const isFlushing = useRef(false);

  // Count pending items on mount
  const refreshPendingCount = useCallback(async () => {
    try {
      const keys = await localforage.keys();
      const pending = keys.filter((k) => k.startsWith(OFFLINE_REPORT_PREFIX));
      setPendingCount(pending.length);
    } catch {
      // localforage not available (SSR guard)
    }
  }, []);

  const clearQueue = useCallback(async () => {
    try {
      const keys = await localforage.keys();
      const reportKeys = keys.filter((k) => k.startsWith(OFFLINE_REPORT_PREFIX));
      for (const k of reportKeys) {
        await localforage.removeItem(k);
      }
      setPendingCount(0);
      setIsSyncing(false);
      onToast({ message: "Cleared stuck offline reports.", type: "info" });
    } catch (e) {
      console.error("[BackgroundSync] Error clearing queue:", e);
    }
  }, [onToast]);

  const flushQueue = useCallback(async () => {
    // Prevent concurrent flushes
    if (isFlushing.current) return;
    if (!navigator.onLine) {
      console.log("[BackgroundSync] Device is still offline, cannot flush.");
      return;
    }

    isFlushing.current = true;
    setIsSyncing(true);

    try {
      const keys = await localforage.keys();
      const reportKeys = keys.filter((k) => k.startsWith(OFFLINE_REPORT_PREFIX));

      if (reportKeys.length === 0) {
        setIsSyncing(false);
        isFlushing.current = false;
        setPendingCount(0);
        return;
      }

      console.log(`[BackgroundSync] Found ${reportKeys.length} pending report(s) in IndexedDB. Flushing...`);
      let syncedCount = 0;

      for (const key of reportKeys) {
        const payload = await localforage.getItem<OfflineReportPayload>(key);
        if (!payload) {
          await localforage.removeItem(key);
          continue;
        }

        try {
          // Reconstruct a File from the Base64 data
          const byteString = atob(payload.imageBase64);
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const blob = new Blob([ab], { type: payload.imageMimeType });
          const file = new File([blob], payload.imageFileName, {
            type: payload.imageMimeType,
          });

          // 1. Get pre-signed URL
          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              filename: file.name,
              contentType: file.type,
            }),
          });

          if (!uploadRes.ok) {
            const errData = await uploadRes.json().catch(() => ({}));
            console.error(`[BackgroundSync] Failed to get upload URL:`, errData);
            onToast({
              message: errData.error || "Could not connect to S3 storage to sync offline report.",
              type: "error",
            });
            break;
          }

          const { uploadUrl, finalImageUrl, key: imageKey } = await uploadRes.json();

          // 2. Upload directly to S3
          const s3Res = await fetch(uploadUrl, {
            method: "PUT",
            headers: {
              "Content-Type": file.type,
            },
            body: file,
          });

          if (!s3Res.ok) {
            console.error(`[BackgroundSync] Failed to upload image to S3 for ${key}`);
            onToast({
              message: "Failed to upload offline photo to cloud storage. Retrying shortly.",
              type: "error",
            });
            break;
          }

          // 3. Submit report to backend API
          const formData = new FormData();
          formData.append("imageUrl", finalImageUrl);
          formData.append("imageKey", imageKey);
          formData.append("latitude", String(payload.latitude));
          formData.append("longitude", String(payload.longitude));

          const res = await fetch("/api/report", {
            method: "POST",
            body: formData,
          });

          if (res.ok) {
            // Success — remove from IndexedDB and inject into UI state
            const { report } = await res.json();
            await localforage.removeItem(key);
            syncedCount++;
            onReportSynced((prev) => [report, ...prev]);
            console.log(`[BackgroundSync] Successfully synced report ${key}`);
          } else if (res.status === 401) {
            // Not authenticated — don't delete report, but pause queue so user can sign in
            console.warn("[BackgroundSync] User is not authenticated. Pausing offline queue.");
            onToast({
              message: "Please sign in to sync your offline report.",
              type: "error",
            });
            break;
          } else if (res.status === 400) {
            // AI rejection or validation error (invalid image, fraudulent, etc.)
            // Must be removed from IndexedDB so it doesn't spin in a 30-minute retry loop!
            const errData = await res.json().catch(() => ({}));
            const reason = errData.error || "Image was rejected by AI triage.";
            await localforage.removeItem(key);
            console.warn(`[BackgroundSync] Report rejected by AI (${reason}). Removed from queue.`);
            onToast({
              message: `Offline report rejected: ${reason}`,
              type: "error",
            });
          } else {
            // Server error (5xx, etc.) — leave in IndexedDB and increment retry
            payload.retryCount = (payload.retryCount || 0) + 1;
            if (payload.retryCount > 5) {
              console.warn(`[BackgroundSync] Max retries reached for ${key}. Discarding.`);
              await localforage.removeItem(key);
              onToast({
                message: "Could not sync offline report after multiple attempts.",
                type: "error",
              });
            } else {
              await localforage.setItem(key, payload);
            }
            break;
          }
        } catch (networkErr) {
          // Network failed mid-flush — pause and retry when back online
          console.warn("[BackgroundSync] Network error during flush:", networkErr);
          break;
        }
      }

      if (syncedCount > 0) {
        onToast({
          message: `✅ Synced ${syncedCount} offline report${syncedCount > 1 ? "s" : ""} successfully!`,
          type: "success",
        });
        window.dispatchEvent(new CustomEvent("civicPointsUpdate"));
      }
    } catch (err) {
      console.error("[BackgroundSync] Flush error:", err);
    } finally {
      setIsSyncing(false);
      isFlushing.current = false;
      await refreshPendingCount();
    }
  }, [onReportSynced, onToast, refreshPendingCount]);

  useEffect(() => {
    // Count pending on mount
    refreshPendingCount();

    // If online, try flushing on mount
    if (typeof navigator !== "undefined" && navigator.onLine) {
      flushQueue();
    }

    // Listen for reconnection
    const handleOnline = () => {
      console.log("[BackgroundSync] Online event detected! Triggering flush.");
      flushQueue();
    };

    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [flushQueue, refreshPendingCount]);

  return { isSyncing, pendingCount, flushQueue, clearQueue };
}
