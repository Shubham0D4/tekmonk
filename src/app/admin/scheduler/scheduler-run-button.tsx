"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";

/**
 * Client component that triggers the scheduled-post publisher endpoint and
 * displays the result inline.
 */
export function SchedulerRunButton() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{
    published: number;
    postIds: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setRunning(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/publish-scheduled");
      const data = (await res.json()) as {
        published?: number;
        postIds?: string[];
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Request failed.");
      } else {
        setResult({
          published: data.published ?? 0,
          postIds: data.postIds ?? [],
        });
        // Refresh the page so the table reflects the newly-published posts
        if ((data.published ?? 0) > 0) window.location.reload();
      }
    } catch {
      setError("Network error — check the console.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        className="button"
        onClick={() => void run()}
        disabled={running}
        type="button"
      >
        <RefreshCw size={16} className={running ? "animate-spin" : ""} />
        {running ? "Running…" : "Run publisher now"}
      </button>

      {result && (
        <p className="text-sm text-emerald-700">
          ✓ Published {result.published} post
          {result.published !== 1 ? "s" : ""}.
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
