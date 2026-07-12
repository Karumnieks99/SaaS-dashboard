"use client";

import { useCallback, useEffect, useState } from "react";

export interface UseApiResult<T> {
  /** Last successful payload. Kept while a refetch is in flight so tables can
   *  show stale rows under a refresh indicator instead of collapsing. */
  data: T | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

interface Settled<T> {
  key: string;
  data: T | null;
  error: string | null;
}

// The one data-fetching primitive of the app. Every client region calls this
// against a route handler, so the loading / error / retry story is identical
// everywhere the simulated network misbehaves.
//
// `loading` is derived, not stored: a request is in flight whenever the last
// settled result doesn't match the current url+attempt key. That keeps all
// setState calls inside async callbacks (no sync setState in the effect body).
export function useApi<T>(url: string): UseApiResult<T> {
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState<Settled<T> | null>(null);

  const key = `${url}#${attempt}`;

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    const requestKey = `${url}#${attempt}`;

    fetch(url, { signal: controller.signal })
      .then(async (res) => {
        const body = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(
            (body as { error?: string } | null)?.error ??
              `Request failed with status ${res.status}`
          );
        }
        return body as T;
      })
      .then((body) => {
        if (cancelled) return;
        setSettled({ key: requestKey, data: body, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled || (err instanceof DOMException && err.name === "AbortError")) {
          return;
        }
        const message =
          err instanceof Error ? err.message : "Something went wrong.";
        // Carry the previous data forward so a failed refetch doesn't wipe
        // what's already on screen.
        setSettled((prev) => ({
          key: requestKey,
          data: prev?.data ?? null,
          error: message,
        }));
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [url, attempt]);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);

  const loading = settled?.key !== key;

  return {
    data: settled?.data ?? null,
    loading,
    error: loading ? null : (settled?.error ?? null),
    retry,
  };
}
