"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2, Loader2, Check } from "lucide-react";

export function ClearDataButton() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function clear() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/clear-data", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Could not clear data.");
        return;
      }
      setDone(true);
      setConfirming(false);
      router.refresh();
      setTimeout(() => setDone(false), 3000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success">
        <Check size={15} /> All progress cleared.
      </span>
    );
  }

  if (!confirming) {
    return (
      <div>
        <button
          onClick={() => setConfirming(true)}
          className="inline-flex items-center gap-1.5 rounded-full border border-danger/50 bg-danger-soft px-4 py-2 text-sm font-bold text-danger transition-colors hover:bg-danger/15"
        >
          <Trash2 size={15} /> Clear all progress
        </button>
        {error && <p className="mt-2 text-xs text-danger">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <p className="mb-3 text-sm text-ink">
        This permanently deletes every completed and flagged question (and any submitted code).
        Your streak and heatmap reset. This can&apos;t be undone.
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={clear}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-full bg-danger px-5 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />} Yes, clear everything
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={busy}
          className="rounded-full border border-border bg-surface px-5 py-2 text-sm font-bold text-ink transition-colors hover:border-border-strong disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
}
