import { Flame } from "lucide-react";

/**
 * GitHub-style consistency heatmap. Renders the last `weeks` weeks of activity
 * as a grid of day cells, coloured by how many questions were completed that day.
 * `counts` maps "YYYY-MM-DD" -> number of questions marked done that day.
 */
export function Heatmap({
  counts,
  weeks = 26,
}: {
  counts: Record<string, number>;
  weeks?: number;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Walk back to the most recent Sunday so columns align to weeks.
  const end = new Date(today);
  const startOffset = (weeks - 1) * 7 + today.getDay();
  const start = new Date(today);
  start.setDate(start.getDate() - startOffset);

  const cols: { date: string; count: number; future: boolean }[][] = [];
  const cursor = new Date(start);
  for (let w = 0; w < weeks; w++) {
    const col: { date: string; count: number; future: boolean }[] = [];
    for (let d = 0; d < 7; d++) {
      const iso = cursor.toISOString().slice(0, 10);
      col.push({
        date: iso,
        count: counts[iso] ?? 0,
        future: cursor.getTime() > end.getTime(),
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    cols.push(col);
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const activeDays = Object.values(counts).filter((c) => c > 0).length;

  function level(count: number): string {
    if (count <= 0) return "bg-black/[0.06]";
    if (count < 3) return "bg-primary/30";
    if (count < 6) return "bg-primary/55";
    if (count < 10) return "bg-primary/80";
    return "bg-primary";
  }

  const dayLabels = ["", "M", "", "W", "", "F", ""];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Flame size={15} className="text-primary" /> Consistency
        </h2>
        <span className="text-xs text-muted">
          {activeDays} active {activeDays === 1 ? "day" : "days"} · {total} completed
        </span>
      </div>
      <div className="flex gap-2">
        <div className="flex flex-col gap-[3px] pt-[2px] text-[9px] leading-none text-faint">
          {dayLabels.map((l, i) => (
            <span key={i} className="h-[12px]">
              {l}
            </span>
          ))}
        </div>
        <div className="flex gap-[3px] overflow-x-auto">
          {cols.map((col, ci) => (
            <div key={ci} className="flex flex-col gap-[3px]">
              {col.map((cell) =>
                cell.future ? (
                  <div key={cell.date} className="h-[12px] w-[12px]" />
                ) : (
                  <div
                    key={cell.date}
                    title={`${cell.date}: ${cell.count} completed`}
                    className={`h-[12px] w-[12px] rounded-[3px] ${level(cell.count)}`}
                  />
                ),
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-[10px] text-faint">
        <span>Less</span>
        <div className="h-[10px] w-[10px] rounded-[2px] bg-black/[0.06]" />
        <div className="h-[10px] w-[10px] rounded-[2px] bg-primary/30" />
        <div className="h-[10px] w-[10px] rounded-[2px] bg-primary/55" />
        <div className="h-[10px] w-[10px] rounded-[2px] bg-primary/80" />
        <div className="h-[10px] w-[10px] rounded-[2px] bg-primary" />
        <span>More</span>
      </div>
    </div>
  );
}
