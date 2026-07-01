"use client";

import { useEffect, useState } from "react";
import { Zap, ChevronDown } from "lucide-react";
import type { Flashcard } from "./Flashcards";

/**
 * Collapsible "Quick revision" card. Closed by default; the open/closed choice
 * is remembered per question in localStorage so it stays the way the user left it.
 */
export function QuickRevision({
  questionId,
  summary,
  cards,
}: {
  questionId: string;
  summary: string | null;
  cards: Flashcard[];
}) {
  const storageKey = `qr-open:${questionId}`;
  const [open, setOpen] = useState(false);

  // Restore the saved open/closed state once mounted (client only).
  useEffect(() => {
    try {
      setOpen(localStorage.getItem(storageKey) === "1");
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  function toggle() {
    setOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(storageKey, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  if (!summary && cards.length === 0) return null;

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-primary/30 bg-primary/[0.05]">
      <button
        onClick={toggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-primary/[0.08]"
      >
        <span className="inline-flex items-center gap-2 text-sm font-extrabold text-primary">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-primary text-primary-ink">
            <Zap size={13} />
          </span>
          Quick revision
          <span className="hidden text-xs font-semibold text-muted sm:inline">
            · {open ? "tap to hide" : "tap to read the gist"}
          </span>
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-primary transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <div
        className={`grid transition-all duration-300 ease-out ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-primary/20 px-4 py-4">
            {summary && (
              <p className="text-sm font-semibold leading-relaxed text-ink">{summary}</p>
            )}
            {cards.length > 0 && (
              <div className="mt-4">
                <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted">
                  Key points to remember
                </div>
                <ul className="space-y-2.5">
                  {cards.slice(0, 6).map((c, i) => (
                    <li key={c.front + i} className="flex gap-2 text-sm leading-relaxed text-ink">
                      <span className="mt-1 shrink-0 text-primary">▸</span>
                      <span>
                        <span className="font-extrabold">{stripTrailingPunct(c.front)}:</span>{" "}
                        <span className="text-muted">{c.back}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** "What is `var`?" -> "What is var" (drop trailing ? and backticks for a label). */
function stripTrailingPunct(s: string): string {
  return s.replace(/`/g, "").replace(/[?:.]+\s*$/, "").trim();
}
