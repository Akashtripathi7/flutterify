import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDay, dayQuestionIds, SECTION_META, type SectionKey } from "@/lib/curriculum";
import { AppShell } from "@/components/AppShell";
import { TopHeader } from "@/components/TopHeader";
import { BackLink, ProgressBar } from "@/components/ui";
import { DayList, type Row } from "@/components/DayList";

export const dynamic = "force-dynamic";

const TONE: Record<SectionKey, string> = {
  theory: "bg-yellow text-sidebar",
  logic: "bg-purple text-sidebar",
  system: "bg-blue text-sidebar",
};

export default async function DayPage({
  params,
}: {
  params: Promise<{ dayId: string }>;
}) {
  const { dayId } = await params;
  const day = getDay(dayId);
  if (!day) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const qIds = dayQuestionIds(day);
  const [{ data: progress }, { data: answers }] = await Promise.all([
    supabase.from("progress").select("question_id, status").in("question_id", qIds),
    supabase.from("question_answers").select("question_id").in("question_id", qIds),
  ]);

  const initialStatus: Record<string, "done" | "flagged" | null> = {};
  for (const p of progress ?? []) initialStatus[p.question_id] = p.status as "done" | "flagged";
  const ready = (answers ?? []).map((a) => a.question_id);
  const doneCount = (progress ?? []).filter((p) => p.status === "done").length;

  return (
    <AppShell>
      <TopHeader
        email={user.email}
        name={(user.user_metadata?.full_name as string) ?? (user.user_metadata?.name as string) ?? null}
        lead={<BackLink href="/dashboard" label="My learnings" />}
      />

      <div className="card p-6 sm:p-7">
        <h1 className="text-2xl font-extrabold sm:text-3xl">Day {day.number}</h1>
        <p className="mt-1 text-lg text-muted">{day.theme}</p>

        <div className="mt-4 flex items-center justify-between text-sm font-semibold">
          <span className="text-muted">Today&apos;s progress</span>
          <span>
            {doneCount}/{qIds.length} done
          </span>
        </div>
        <ProgressBar value={doneCount} total={qIds.length} className="mt-2" tone="primary" />

        <div className="mt-8 space-y-8">
          {day.sections.map((section) => {
            const meta = SECTION_META[section.key];
            const rows: Row[] = section.questions.map((q) => ({
              id: q.id,
              number: q.number,
              label: q.label,
              title: q.title,
            }));
            const guidedIds = section.mode === "guided" ? section.questions.map((q) => q.id) : [];
            return (
              <section key={section.key}>
                <div className={`mb-2 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold ${TONE[section.key]}`}>
                  <span>{meta.icon}</span> {section.title}
                </div>
                <p className="mb-3 text-xs text-muted">
                  {section.mode === "guided"
                    ? "You write the code — the tutor guides your thinking. Submit code to complete."
                    : meta.blurb}
                </p>
                <DayList rows={rows} initialStatus={initialStatus} ready={ready} guidedIds={guidedIds} />
              </section>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
