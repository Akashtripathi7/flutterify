import Link from "next/link";
import { Check, Flag, Sparkles, Code2, Lock, ChevronRight } from "lucide-react";

export interface Row {
  id: string;
  number: number;
  label: string | null;
  title: string;
}

type Status = "done" | "flagged" | null;

export function DayList({
  rows,
  initialStatus,
  ready,
  guidedIds = [],
}: {
  rows: Row[];
  initialStatus: Record<string, Status>;
  ready: string[];
  guidedIds?: string[];
}) {
  const readySet = new Set(ready);
  const guidedSet = new Set(guidedIds);

  return (
    <ul className="space-y-2">
      {rows.map((q) => {
        const st = initialStatus[q.id];
        const isGuided = guidedSet.has(q.id);
        const isDone = st === "done";
        const isFlagged = st === "flagged";

        let rowClass: string;
        if (isDone) rowClass = "border-success/40 bg-success/[0.08]";
        else if (isFlagged) rowClass = "border-primary/40 bg-primary/[0.06]";
        else rowClass = "border-border bg-surface hover:border-border-strong hover:bg-elevated";

        return (
          <li key={q.id}>
            <Link
              href={`/question/${q.id}`}
              className={`group flex items-center gap-3 rounded-xl border p-3.5 transition-colors ${rowClass}`}
            >
              {/* status indicator (not a control — just shows state) */}
              <span
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                  isDone ? "bg-success text-white" : "bg-elevated text-faint"
                }`}
              >
                {(() => {
                  if (isDone) return <Check size={16} />;
                  if (isGuided) return <Lock size={13} />;
                  return <ChevronRight size={15} />;
                })()}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {q.label && (
                    <span className="hidden shrink-0 rounded-md bg-elevated px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted sm:inline">
                      {q.label}
                    </span>
                  )}
                  {isGuided && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-purple/30 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sidebar">
                      <Code2 size={11} /> code
                    </span>
                  )}
                  {readySet.has(q.id) && (
                    <Sparkles size={12} className="shrink-0 text-primary" aria-label="Answer ready" />
                  )}
                  {isDone && (
                    <span className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-success/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-success">
                      Done
                    </span>
                  )}
                </div>
                <div className={`truncate text-sm font-semibold ${isDone ? "text-muted" : "text-ink"}`}>
                  <span className="text-faint">{q.number}.</span> {q.title}
                </div>
              </div>

              {isFlagged && <Flag size={14} className="shrink-0 text-primary" />}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
