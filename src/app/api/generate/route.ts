import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getQuestion } from "@/lib/curriculum";
import { generateAnswer, MODEL } from "@/lib/llm";

export const maxDuration = 60;

const DAILY_LIMIT = Number(process.env.DAILY_TOKEN_LIMIT || 200000);

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  let body: { questionId?: string; regenerate?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const questionId = body.questionId;
  if (!questionId) return NextResponse.json({ error: "Missing questionId." }, { status: 400 });

  const found = getQuestion(questionId);
  if (!found) return NextResponse.json({ error: "Unknown question." }, { status: 404 });
  const { question, mode, sectionTitle, container } = found;

  // 1. Serve from the shared cache when possible (consistent + free).
  if (!body.regenerate) {
    const { data: cached } = await supabase
      .from("question_answers")
      .select("answer_md, flashcards")
      .eq("question_id", questionId)
      .maybeSingle();
    if (cached?.answer_md) {
      return NextResponse.json({
        markdown: cached.answer_md,
        flashcards: cached.flashcards ?? [],
        cached: true,
      });
    }
  }

  // 2. Enforce the per-user daily token cap.
  const today = new Date().toISOString().slice(0, 10);
  const { data: usage } = await supabase
    .from("token_usage")
    .select("tokens_used")
    .eq("user_id", user.id)
    .eq("usage_date", today)
    .maybeSingle();
  const used = usage?.tokens_used ?? 0;
  if (used >= DAILY_LIMIT) {
    return NextResponse.json(
      {
        error: `Daily limit reached (${used.toLocaleString()}/${DAILY_LIMIT.toLocaleString()} tokens). Resets tomorrow.`,
        limitReached: true,
      },
      { status: 429 },
    );
  }

  // 3. Generate.
  const contextLabel =
    container.kind === "day"
      ? `Day ${container.day.number} (${container.day.theme}) · ${sectionTitle}`
      : `Practice drill · ${sectionTitle}`;
  let answer;
  try {
    answer = await generateAnswer({
      contextLabel,
      questionMarkdown: question.markdown,
      mode,
    });
  } catch (err) {
    console.error("generateAnswer failed:", err);
    const msg = err instanceof Error ? err.message : "The AI could not be reached.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const spent = answer.inputTokens + answer.outputTokens;

  // 4. Cache the answer globally so it's never regenerated.
  const containerId = container.kind === "day" ? container.day.id : container.drill.id;
  const fullRow = {
    question_id: questionId,
    track_id: containerId,
    day_id: containerId,
    answer_md: answer.markdown,
    flashcards: answer.flashcards,
    model: MODEL,
    input_tokens: answer.inputTokens,
    output_tokens: answer.outputTokens,
    generated_by: user.id,
  };

  let { error: cacheError } = await supabase
    .from("question_answers")
    .upsert(fullRow, { onConflict: "question_id" });

  // Resilience: if the optional `flashcards` column isn't migrated yet, still
  // persist the answer (the important part) so it isn't regenerated next time.
  if (cacheError && /flashcards/.test(cacheError.message)) {
    const withoutCards: Record<string, unknown> = { ...fullRow };
    delete withoutCards.flashcards;
    ({ error: cacheError } = await supabase
      .from("question_answers")
      .upsert(withoutCards, { onConflict: "question_id" }));
  }

  if (cacheError) console.error("question_answers upsert failed:", cacheError);

  // 5. Record token spend (best-effort).
  await supabase.rpc("add_token_usage", { p_tokens: spent });

  return NextResponse.json({
    markdown: answer.markdown,
    flashcards: answer.flashcards,
    cached: false,
    tokensUsed: spent,
    saved: !cacheError,
  });
}
