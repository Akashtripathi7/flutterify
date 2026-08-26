import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  QUICK_PREP_QUESTIONS_SYSTEM,
  QUICK_PREP_ANSWER_SYSTEM,
  QUICK_PREP_ANSWER_HINGLISH_SYSTEM,
  QUICK_PREP_FOLLOWUP_SYSTEM,
  buildQuickPrepResumePrompt,
  buildQuickPrepJDPrompt,
  buildQuickPrepAnswerPrompt,
  buildQuickPrepFollowupPrompt,
} from "@/lib/prompts";

export const maxDuration = 60;

const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const API_KEY = process.env.GEMINI_API_KEY || "";
const DAILY_LIMIT = Number(process.env.DAILY_TOKEN_LIMIT || 200000);

export const RESUME_TEXT = process.env.RESUME_TEXT || `Akash Tripathi — Senior Flutter Developer (4 years)
Mumbai, India | github.com/Akashtripathi7

EXPERIENCE

Nupipay — Senior Software Developer (Feb 2025 – Present), Mumbai
- Architected and migrated codebase to Riverpod + MVC, improving maintainability and scalability
- Mentored junior developers through daily code reviews, architectural guidance, and Flutter best practices
- Reduced app size by 78% (150MB → 33MB), resulting in faster load times and better UX
- Implemented QR-based deep linking
- Rebuilt WebView e-commerce flows into native Flutter with custom animations, improving conversion rates
- Integrated Firebase Crashlytics and resolved priority crashes; crash-free sessions improved past 95%
- Built OCR-based invoice scanning feature
- Implemented dynamic app icon switching using native Android and iOS code (no app update required)
- Implemented Flutter flavors for environment-specific configuration (dev/staging/prod)
- Live apps: Wonder WallCare, HomeSure Samriddhi, Nupi App, Diamond Club

Handpickd — SDE-1 (Aug 2023 – Feb 2025), Gurgaon, Haryana (Hybrid)
- Developed 9 mobile and 4 web apps including POS, WMS, FOS, and consumer delivery platforms
- Integrated Bluetooth connectivity with weighing machines; real-time weight data auto-populates text fields
- Integrated Mixpanel, Percept Insight, and Firebase Analytics for data-informed product improvements
- Built background services that improved delivery operations efficiency by 25%
- Led delivery of mission-critical apps: PPD, WMS, Delivery app

Corpusvision — Flutter Developer (Jul 2022 – Aug 2023), Mumbai
- Led frontend development for Coro Suite apps, improving UI consistency and performance
- Independently developed and delivered Trient MedCare app end-to-end to production
- Implemented MVC architecture for modular, reusable code

SOV Technologies — Flutter Developer (Feb 2022 – Jun 2022), Mumbai
- Developed admin panel for managing teachers, students, and schools with role-based access control
- Built FishEye suite with real-time tracking, Firebase authentication, and image/location-based chat

SKILLS
Flutter/Dart, State Management (Riverpod, BLoC, GetX), Architecture (MVC, MVVM),
REST APIs, FastAPI, Firebase Suite (Crashlytics, Analytics, Auth, Firestore),
CI/CD (GitHub Actions), Analytics (Mixpanel, CleverTap, Firebase Analytics),
App Performance Optimization, App Size Reduction, Flutter Flavors, OCR, Bluetooth BLE,
Platform Channels (Android/iOS native), Team Leadership, Agile, Code Review

EDUCATION
Bachelor of Engineering — Viva Institute of Technology, Mumbai (2018–2022), CGPA: 7.8

ACHIEVEMENTS
- Eyantra Finalist (IIT Bombay): Built deep learning-powered water plastic cleanup bot
- Anveshana 2020: Led Smart City IoT project; mentored students; consolation prize
- Covid-19 Bioinformatics Hackathon Finalist: Developed Android safety-feature app`;

// ── Gemini helper ──────────────────────────────────────────────────────────
async function callGemini(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 8192,
): Promise<{ text: string; tokens: number }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: maxTokens },
    }),
  });
  if (!res.ok) {
    const raw = await res.text();
    let msg = `Gemini error (${res.status})`;
    try { const j = JSON.parse(raw); if (j?.error?.message) msg = j.error.message; } catch { /**/ }
    throw new Error(msg);
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts
    ?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
  const tokens =
    (data?.usageMetadata?.promptTokenCount ?? 0) +
    (data?.usageMetadata?.candidatesTokenCount ?? 0);
  return { text, tokens };
}

// ── Parse "Q1: text" question list ────────────────────────────────────────
function parseQuestionList(raw: string): string[] {
  return raw
    .split("\n")
    .map((l) => l.replace(/^Q\d+[.:)]\s*/i, "").trim())
    .filter((l) => l.length > 10);
}

// ── Daily token budget check ───────────────────────────────────────────────
async function checkBudget(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("token_usage").select("tokens_used")
    .eq("user_id", userId).eq("usage_date", today).maybeSingle();
  return (data?.tokens_used ?? 0) >= DAILY_LIMIT;
}

// ── POST /api/quick-prep ───────────────────────────────────────────────────
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!API_KEY) return NextResponse.json({ error: "GEMINI_API_KEY not set." }, { status: 500 });

  let body: {
    action?: string;
    type?: string;
    jdText?: string;
    sessionId?: string;
    title?: string;
    questionId?: string;
    existingQuestions?: string[];
    regenerate?: boolean;
  };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Bad request." }, { status: 400 }); }

  const { action = "generate" } = body;

  // ── delete_q ──────────────────────────────────────────────────────────────
  if (action === "delete_q") {
    if (!body.questionId) return NextResponse.json({ error: "questionId required." }, { status: 400 });
    const { error } = await supabase.from("quick_prep_questions")
      .delete().eq("id", body.questionId).eq("user_id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // ── delete_session ────────────────────────────────────────────────────────
  if (action === "delete_session") {
    if (!body.sessionId) return NextResponse.json({ error: "sessionId required." }, { status: 400 });
    const { error } = await supabase.from("quick_prep_sessions")
      .delete().eq("id", body.sessionId).eq("user_id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // ── init session ──────────────────────────────────────────────────────────
  if (action === "init") {
    const type = body.type;
    if (type !== "resume" && type !== "jd")
      return NextResponse.json({ error: "type must be resume or jd." }, { status: 400 });
    if (type === "jd" && !body.jdText?.trim())
      return NextResponse.json({ error: "jdText required." }, { status: 400 });

    if (type === "resume") {
      const { data: existing } = await supabase.from("quick_prep_sessions")
        .select("*").eq("user_id", user.id).eq("type", "resume").maybeSingle();
      if (existing) return NextResponse.json({ session: existing });
      const { data: created, error } = await supabase.from("quick_prep_sessions")
        .insert({ user_id: user.id, type: "resume", title: "My Resume" })
        .select().single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ session: created });
    }

    const jdTitle =
      body.title ||
      body.jdText!.split("\n").find((l) => l.trim().length > 3 && l.trim().length <= 80)?.trim().slice(0, 60) ||
      "JD Session";
    const { data: created, error } = await supabase.from("quick_prep_sessions")
      .insert({ user_id: user.id, type: "jd", title: jdTitle, jd_text: body.jdText })
      .select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ session: created });
  }

  // ── generate questions batch (titles only, no answers) ───────────────────
  if (action === "generate") {
    if (!body.sessionId) return NextResponse.json({ error: "sessionId required." }, { status: 400 });

    const { data: session } = await supabase.from("quick_prep_sessions")
      .select("*").eq("id", body.sessionId).eq("user_id", user.id).maybeSingle();
    if (!session) return NextResponse.json({ error: "Session not found." }, { status: 404 });

    if (await checkBudget(supabase, user.id))
      return NextResponse.json({ error: "Daily token limit reached. Resets tomorrow.", limitReached: true }, { status: 429 });

    const existingQs = body.existingQuestions ?? [];
    const BATCH = 5;

    const userPrompt = session.type === "resume"
      ? buildQuickPrepResumePrompt({ resumeText: RESUME_TEXT, batchSize: BATCH, existingQuestions: existingQs })
      : buildQuickPrepJDPrompt({ jdText: session.jd_text!, resumeText: RESUME_TEXT, batchSize: BATCH, existingQuestions: existingQs });

    const { text, tokens } = await callGemini(QUICK_PREP_QUESTIONS_SYSTEM, userPrompt, 1024).catch((e) =>
      NextResponse.json({ error: e.message }, { status: 502 }) as never,
    );

    const questions = parseQuestionList(text);
    if (questions.length === 0)
      return NextResponse.json({ error: "Could not parse questions. Try again." }, { status: 502 });

    const { data: posRow } = await supabase.from("quick_prep_questions")
      .select("position").eq("session_id", body.sessionId)
      .order("position", { ascending: false }).limit(1).maybeSingle();
    const startPos = (posRow?.position ?? -1) + 1;

    const rows = questions.map((q, i) => ({
      session_id: body.sessionId,
      user_id: user.id,
      question: q,
      answer_md: null,
      answer_hi_md: null,
      followup_md: null,
      position: startPos + i,
    }));

    const { data: inserted, error: insertErr } = await supabase
      .from("quick_prep_questions").insert(rows).select();
    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

    await supabase.rpc("add_token_usage", { p_tokens: tokens });
    await supabase.from("quick_prep_sessions")
      .update({ updated_at: new Date().toISOString() }).eq("id", body.sessionId);

    return NextResponse.json({ questions: inserted, tokensUsed: tokens });
  }

  // ── generate_answer — deep EN + Hinglish in parallel ────────────────────
  if (action === "generate_answer") {
    if (!body.questionId) return NextResponse.json({ error: "questionId required." }, { status: 400 });

    const { data: qRow } = await supabase.from("quick_prep_questions")
      .select("*, quick_prep_sessions(type, title, jd_text)")
      .eq("id", body.questionId).eq("user_id", user.id).maybeSingle();
    if (!qRow) return NextResponse.json({ error: "Question not found." }, { status: 404 });

    // Serve from cache unless regenerate=true
    if (!body.regenerate && qRow.answer_md) {
      return NextResponse.json({ answer_md: qRow.answer_md, answer_hi_md: qRow.answer_hi_md, cached: true });
    }

    if (await checkBudget(supabase, user.id))
      return NextResponse.json({ error: "Daily token limit reached.", limitReached: true }, { status: 429 });

    const session = qRow.quick_prep_sessions as { type: string; title: string; jd_text: string | null };
    const context = session.type === "resume" ? "Resume-based preparation" : `JD: ${session.title}`;

    const userPrompt = buildQuickPrepAnswerPrompt({
      question: qRow.question,
      resumeText: RESUME_TEXT,
      context,
    });

    // Fire EN + Hinglish in parallel
    const [enResult, hiResult] = await Promise.all([
      callGemini(QUICK_PREP_ANSWER_SYSTEM, userPrompt, 8192),
      callGemini(QUICK_PREP_ANSWER_HINGLISH_SYSTEM, userPrompt, 6144),
    ]).catch((e) => { throw new Error(e.message); });

    const totalTokens = enResult.tokens + hiResult.tokens;

    const { error: updateErr } = await supabase.from("quick_prep_questions")
      .update({ answer_md: enResult.text, answer_hi_md: hiResult.text })
      .eq("id", body.questionId);
    if (updateErr) console.error("answer update failed:", updateErr);

    await supabase.rpc("add_token_usage", { p_tokens: totalTokens });

    return NextResponse.json({
      answer_md: enResult.text,
      answer_hi_md: hiResult.text,
      cached: false,
      tokensUsed: totalTokens,
    });
  }

  // ── generate_followup ────────────────────────────────────────────────────
  if (action === "generate_followup") {
    if (!body.questionId) return NextResponse.json({ error: "questionId required." }, { status: 400 });

    const { data: qRow } = await supabase.from("quick_prep_questions")
      .select("question, answer_md, followup_md, user_id")
      .eq("id", body.questionId).eq("user_id", user.id).maybeSingle();
    if (!qRow) return NextResponse.json({ error: "Question not found." }, { status: 404 });
    if (!qRow.answer_md) return NextResponse.json({ error: "Generate the answer first." }, { status: 400 });

    if (!body.regenerate && qRow.followup_md)
      return NextResponse.json({ followup_md: qRow.followup_md, cached: true });

    if (await checkBudget(supabase, user.id))
      return NextResponse.json({ error: "Daily token limit reached.", limitReached: true }, { status: 429 });

    const userPrompt = buildQuickPrepFollowupPrompt({
      question: qRow.question,
      answerMd: qRow.answer_md,
      resumeText: RESUME_TEXT,
    });

    const { text, tokens } = await callGemini(QUICK_PREP_FOLLOWUP_SYSTEM, userPrompt, 6144).catch((e) => {
      throw new Error(e.message);
    });

    await supabase.from("quick_prep_questions")
      .update({ followup_md: text }).eq("id", body.questionId);
    await supabase.rpc("add_token_usage", { p_tokens: tokens });

    return NextResponse.json({ followup_md: text, cached: false, tokensUsed: tokens });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}

// ── GET /api/quick-prep ────────────────────────────────────────────────────
export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sessionId");

  if (sessionId) {
    const { data, error } = await supabase.from("quick_prep_questions")
      .select("*").eq("session_id", sessionId).eq("user_id", user.id).order("position");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ questions: data });
  }

  const { data, error } = await supabase.from("quick_prep_sessions")
    .select("*, quick_prep_questions(count)")
    .eq("user_id", user.id).order("updated_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sessions: data });
}
