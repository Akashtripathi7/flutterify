import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getQuestion } from "@/lib/curriculum";
import { AppShell } from "@/components/AppShell";
import { TopHeader } from "@/components/TopHeader";
import { BackLink } from "@/components/ui";
import { QuestionView } from "@/components/QuestionView";
import type { Flashcard } from "@/components/Flashcards";

export const dynamic = "force-dynamic";

export default async function QuestionPage({
  params,
}: {
  params: Promise<{ questionId: string }>;
}) {
  const { questionId } = await params;
  const found = getQuestion(questionId);
  if (!found) notFound();
  const { question, mode, sectionTitle, container, prevId, nextId } = found;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: answerRow }, { data: progressRow }] = await Promise.all([
    supabase
      .from("question_answers")
      .select("answer_md, flashcards")
      .eq("question_id", questionId)
      .maybeSingle(),
    supabase
      .from("progress")
      .select("status, code")
      .eq("user_id", user.id)
      .eq("question_id", questionId)
      .maybeSingle(),
  ]);

  // The explanation is generated once and stored globally in question_answers,
  // so a return visit loads it straight from the DB (no regeneration).
  const initialAnswer = answerRow?.answer_md ?? null;
  const initialFlashcards = (answerRow?.flashcards as Flashcard[]) ?? [];

  const backHref = container.kind === "day" ? `/day/${container.day.id}` : "/drills";
  const backLabel =
    container.kind === "day" ? `Day ${container.day.number} — ${container.day.theme}` : "Practice drills";

  return (
    <AppShell>
      <TopHeader
        email={user.email}
        name={(user.user_metadata?.full_name as string) ?? (user.user_metadata?.name as string) ?? null}
        lead={<BackLink href={backHref} label={backLabel} />}
      />
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 text-xs font-semibold uppercase tracking-wide text-faint">{sectionTitle}</div>
        <QuestionView
          question={question}
          initialAnswer={initialAnswer}
          initialFlashcards={initialFlashcards}
          initialStatus={(progressRow?.status as "done" | "flagged") ?? null}
          initialCode={(progressRow?.code as string) ?? null}
          hasSavedAnswer={!!initialAnswer}
          mode={mode}
          backHref={backHref}
          prevHref={prevId ? `/question/${prevId}` : null}
          nextHref={nextId ? `/question/${nextId}` : null}
        />
      </div>
    </AppShell>
  );
}
