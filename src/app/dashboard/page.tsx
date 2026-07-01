import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { days, dayQuestionIds, type Day, type SectionKey } from "@/lib/curriculum";
import { AppShell } from "@/components/AppShell";
import { TopHeader } from "@/components/TopHeader";
import { ProgressBar, Pill } from "@/components/ui";
import { Heatmap } from "@/components/Heatmap";
import { ArrowRight, Check, BookOpen, Code2, Network, ChevronRight, Lock as LockIcon } from "lucide-react";

export const dynamic = "force-dynamic";

// A richer pastel rotation for the day grid — each theme pairs a card
// background with a matching chip + progress tint.
const CARD_THEMES = [
  { bg: "bg-yellow", chip: "bg-sidebar text-on-dark" },
  { bg: "bg-purple", chip: "bg-sidebar text-on-dark" },
  { bg: "bg-blue", chip: "bg-sidebar text-on-dark" },
  { bg: "bg-[#FBC4AB]", chip: "bg-sidebar text-on-dark" }, // peach
  { bg: "bg-[#A8E6CF]", chip: "bg-sidebar text-on-dark" }, // mint
  { bg: "bg-[#F8B5D8]", chip: "bg-sidebar text-on-dark" }, // pink
];

// Per-section accent for the "My next lessons" list.
const SECTION_STYLE: Record<SectionKey, { icon: typeof BookOpen; chip: string }> = {
  theory: { icon: BookOpen, chip: "bg-yellow text-sidebar" },
  logic: { icon: Code2, chip: "bg-purple text-sidebar" },
  system: { icon: Network, chip: "bg-blue text-sidebar" },
};

// Generic, learner-facing labels for each track shown on the day cards.
const TRACK_LABEL: Record<SectionKey, { icon: string; label: string }> = {
  theory: { icon: "📘", label: "Theory" },
  logic: { icon: "💻", label: "Logic building" },
  system: { icon: "🏗", label: "System & Architecture" },
};

function firstName(user: { email?: string | null; user_metadata?: Record<string, unknown> }): string {
  const meta = user.user_metadata ?? {};
  const full =
    (meta.full_name as string) || (meta.name as string) || (meta.given_name as string) || "";
  if (full.trim()) return full.trim().split(" ")[0];
  return user.email ? user.email.split("@")[0] : "there";
}

export default async function Dashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: progress } = await supabase
    .from("progress")
    .select("question_id, status, updated_at");

  const done = new Set<string>();
  const dateCounts: Record<string, number> = {};
  for (const p of progress ?? []) {
    if (p.status === "done") {
      done.add(p.question_id);
      if (p.updated_at) {
        const d = p.updated_at.slice(0, 10);
        dateCounts[d] = (dateCounts[d] ?? 0) + 1;
      }
    }
  }

  const dayStats = days.map((d) => {
    const ids = dayQuestionIds(d);
    const dn = ids.filter((id) => done.has(id)).length;
    return { day: d, total: ids.length, done: dn, complete: ids.length > 0 && dn === ids.length };
  });

  const featured = dayStats.find((s) => !s.complete) ?? dayStats[0];

  type Lesson = { id: string; title: string; sectionKey: SectionKey; section: string; dayNo: number };
  const lessons: Lesson[] = [];
  for (const { day } of dayStats.filter((s) => !s.complete)) {
    for (const section of day.sections) {
      const q = section.questions.find((x) => !done.has(x.id));
      if (q) {
        lessons.push({
          id: q.id,
          title: q.title,
          sectionKey: section.key,
          section: section.title,
          dayNo: day.number,
        });
        break;
      }
    }
    if (lessons.length >= 5) break;
  }

  const name = firstName(user);
  const display = (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || null;

  return (
    <AppShell>
      <TopHeader email={user.email} name={display} />

      {/* Greeting */}
      <div className="mb-6">
        <p className="text-sm text-muted">{greeting()},</p>
        <h1 className="text-3xl font-extrabold capitalize tracking-tight sm:text-4xl">
          {name} 👋
        </h1>
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-extrabold tracking-tight">My learnings</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Pill href="/dashboard" active>
            All days
          </Pill>
          <span
            title="Coming soon"
            className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-full border border-border bg-elevated px-4 py-2 text-sm font-semibold text-faint"
          >
            <LockIcon size={13} /> Drills
          </span>
          <Pill href="/settings">Settings</Pill>
        </div>
      </div>

      {/* Featured "continue" card */}
      {featured && (
        <Link href={`/day/${featured.day.id}`} className="mb-6 block">
          <div className="flex flex-col gap-5 rounded-2xl bg-yellow p-6 text-sidebar card-hover sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <span className="inline-flex items-center rounded-full bg-sidebar px-3 py-1 text-xs font-bold text-on-dark">
                {featured.done > 0 ? "Continue learning" : "Start here"}
              </span>
              <h2 className="mt-3 text-2xl font-extrabold leading-tight sm:text-3xl">
                Day {featured.day.number}
              </h2>
              <p className="mt-1 max-w-xl text-sm font-semibold text-sidebar/70">
                {featured.day.theme}
              </p>
              <div className="mt-4 grid gap-2.5 sm:max-w-md">
                {featured.day.sections.map((s) => (
                  <div key={s.key} className="flex items-start gap-2">
                    <span aria-hidden className="mt-0.5 text-sm">
                      {TRACK_LABEL[s.key].icon}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[11px] font-extrabold uppercase tracking-wide text-sidebar/70">
                        {TRACK_LABEL[s.key].label} · {s.questions.length}
                      </div>
                      <div className="truncate text-xs font-semibold text-sidebar/90">
                        {s.topics && s.topics.length > 0 ? s.topics.join(" · ") : TRACK_LABEL[s.key].label}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 max-w-md">
                <div className="mb-1.5 flex items-center justify-between text-sm font-bold">
                  <span>Progress</span>
                  <span>
                    {featured.done}/{featured.total} lessons
                  </span>
                </div>
                <ProgressBar value={featured.done} total={featured.total} />
              </div>
            </div>
            <span className="inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-ink sm:self-center">
              {featured.done > 0 ? "Continue" : "Start"} <ArrowRight size={16} />
            </span>
          </div>
        </Link>
      )}

      {/* Consistency */}
      <div className="mb-6 card p-5 sm:p-6">
        <Heatmap counts={dateCounts} />
      </div>

      {/* My next lessons */}
      <div className="mb-6 card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-xl font-extrabold">My next lessons</h2>
            <p className="text-xs text-muted">Pick up right where you left off</p>
          </div>
          {featured && (
            <Link
              href={`/day/${featured.day.id}`}
              className="hidden text-sm font-bold text-primary hover:underline sm:block"
            >
              View all
            </Link>
          )}
        </div>

        {lessons.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">
            You&apos;ve completed everything available. 🎉
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {lessons.map((l, i) => {
              const s = SECTION_STYLE[l.sectionKey];
              const Icon = s.icon;
              return (
                <li key={l.id}>
                  <Link
                    href={`/question/${l.id}`}
                    className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-elevated sm:px-6"
                  >
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${s.chip}`}>
                      <Icon size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold text-ink">
                        <span className="text-faint">{String(i + 1).padStart(2, "0")}.</span> {l.title}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                        <span>Day {l.dayNo}</span>
                        <span className="text-border-strong">•</span>
                        <span>{l.section}</span>
                      </div>
                    </div>
                    <ChevronRight
                      size={18}
                      className="shrink-0 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-ink"
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* All days */}
      <h2 className="mb-3 text-xl font-extrabold">All days</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {dayStats.map((s, i) => (
          <DayCard key={s.day.id} stat={s} theme={CARD_THEMES[i % CARD_THEMES.length]} />
        ))}
      </div>
    </AppShell>
  );
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function DayCard({
  stat,
  theme,
}: {
  stat: { day: Day; total: number; done: number; complete: boolean };
  theme: { bg: string; chip: string };
}) {
  const { day, total, done, complete } = stat;
  const started = done > 0;
  let statusLabel: string;
  if (complete) statusLabel = "Completed";
  else if (started) statusLabel = "In progress";
  else statusLabel = "Not started";
  return (
    <Link href={`/day/${day.id}`} className="block">
      <div
        className={`flex h-full flex-col rounded-2xl p-5 text-sidebar card-hover ${theme.bg} ${
          complete ? "ring-2 ring-success ring-offset-2 ring-offset-panel" : ""
        }`}
      >
        <div className="mb-3 flex items-center justify-between">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${theme.chip}`}>
            Day {day.number}
          </span>
          {complete ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-success px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
              <Check size={12} /> Done
            </span>
          ) : (
            started && (
              <span className="rounded-full bg-sidebar/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide">
                {Math.round((done / total) * 100)}%
              </span>
            )
          )}
        </div>
        <p className="mb-4 line-clamp-2 min-h-[2.5rem] text-lg font-extrabold leading-snug">
          {day.theme}
        </p>

        {/* What you'll learn today — each track with its real topics */}
        <div className="mb-4 space-y-3">
          {day.sections.map((s) => (
            <div key={s.key}>
              <div className="mb-1 flex items-center gap-1.5">
                <span aria-hidden className="text-[13px]">
                  {TRACK_LABEL[s.key].icon}
                </span>
                <span className="text-[11px] font-extrabold uppercase tracking-wide text-sidebar/70">
                  {TRACK_LABEL[s.key].label}
                </span>
                <span className="rounded-full bg-sidebar/10 px-1.5 py-0.5 text-[9px] font-bold text-sidebar/70">
                  {s.questions.length}
                </span>
              </div>
              <p className="line-clamp-2 pl-[22px] text-xs font-semibold leading-relaxed text-sidebar/90">
                {s.topics && s.topics.length > 0 ? s.topics.join(" · ") : TRACK_LABEL[s.key].label}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-auto border-t border-sidebar/10 pt-3">
          <div className="mb-1.5 flex items-center justify-between text-xs font-bold">
            <span>{statusLabel}</span>
            <span>
              {done}/{total}
            </span>
          </div>
          <ProgressBar value={done} total={total} />
        </div>
      </div>
    </Link>
  );
}
