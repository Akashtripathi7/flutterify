import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getQuestion } from "@/lib/curriculum";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    questionId?: string;
    status?: "done" | "flagged";
    code?: string;
    clear?: boolean;
  };
  const { questionId, status, code, clear } = body;
  if (!questionId) return NextResponse.json({ error: "Missing questionId." }, { status: 400 });

  const found = getQuestion(questionId);
  if (!found) return NextResponse.json({ error: "Unknown question." }, { status: 404 });

  if (clear) {
    const { error } = await supabase
      .from("progress")
      .delete()
      .eq("user_id", user.id)
      .eq("question_id", questionId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, status: null });
  }

  const containerId =
    found.container.kind === "day" ? found.container.day.id : found.container.drill.id;
  const newStatus = status === "flagged" ? "flagged" : "done";

  // Logic-building questions can only be marked done once code is submitted.
  if (found.mode === "guided" && newStatus === "done" && !(code && code.trim())) {
    return NextResponse.json(
      { error: "Submit your code to mark this logic question done." },
      { status: 400 },
    );
  }

  // The explanation itself is persisted globally in `question_answers` by the
  // generate route, so progress only needs the user's status + any code.
  const base = {
    user_id: user.id,
    question_id: questionId,
    day_id: containerId,
    track_id: containerId,
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  let { error } = await supabase
    .from("progress")
    .upsert(
      { ...base, code: found.mode === "guided" && code ? code : null },
      { onConflict: "user_id,question_id" },
    );

  // Resilience: if the optional `code` column hasn't been migrated yet, the
  // status still matters — retry without it so "mark done" never fails.
  if (error && /code/.test(error.message)) {
    ({ error } = await supabase
      .from("progress")
      .upsert(base, { onConflict: "user_id,question_id" }));
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, status: newStatus });
}
