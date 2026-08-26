import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  QUICK_PREP_SYSTEM,
  buildQuickPrepResumePrompt,
  buildQuickPrepJDPrompt,
} from "@/lib/prompts";

export const maxDuration = 60;

const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const API_KEY = process.env.GEMINI_API_KEY || "";

// Resume embedded in source — env var overrides if set.
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

// How many questions to generate per batch (keeps each call under 60s).
const BATCH_SIZE = 5;

async function callGemini(systemPrompt: string, userPrompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 16384 },
    }),
  });

  if (!res.ok) {
    const raw = await res.text();
    let msg = `Gemini error (${res.status})`;
    try { const j = JSON.parse(raw); if (j?.error?.message) msg = j.error.message; } catch { /* */ }
    throw new Error(msg);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts
    ?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
  const tokens = (data?.usageMetadata?.promptTokenCount ?? 0) +
    (data?.usageMetadata?.candidatesTokenCount ?? 0);
  return JSON.stringify({ text, tokens });
}

// Parse "## Q{N}: question" blocks from the markdown.
function parseBlocks(md: string): { question: string; answerMd: string; followupMd: string }[] {
  const lines = md.split("\n");
  const blocks: { question: string; answerMd: string; followupMd: string }[] = [];
  let curQ = "";
  let curBody: string[] = [];

  const flush = () => {
    if (!curQ) return;
    const full = curBody.join("\n").trim();
    const fuIdx = full.search(/###\s+Follow-up questions/i);
    const mainBody = fuIdx === -1 ? full : full.slice(0, fuIdx).trim();
    // Strip the "### Follow-up questions" heading from the followup section
    const followupRaw = fuIdx === -1 ? "" : full.slice(fuIdx);
    const followupMd = followupRaw.replace(/^###\s+Follow-up questions[^\n]*/i, "").trim();
    if (curQ && mainBody) blocks.push({ question: curQ, answerMd: mainBody, followupMd });
  };

  for (const line of lines) {
    // Tolerant: ## Q1: / ## Q1. / ## Question 1: / ## **Q1:** / ### Q1:
    const m = /^#{2,3}\s+\*{0,2}Q(?:uestion)?\s*\d+[.:)]\*{0,2}\s*(.+)/i.exec(line);
    if (m) {
      flush();
      curQ = m[1].replace(/\*{1,2}/g, "").trim();
      curBody = [];
    } else if (curQ) {
      curBody.push(line);
    }
  }
  flush();
  return blocks;
}

// ---- POST /api/quick-prep ------------------------------------------------
// Actions:
//   "init"        — create or find existing session, return session row
//   "generate"    — generate a batch of questions for a session
//   "delete_q"    — delete a single question
//   "delete_session" — delete a whole session
// --------------------------------------------------------------------------
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!API_KEY) return NextResponse.json({ error: "GEMINI_API_KEY not set." }, { status: 500 });

  let body: {
    action?: string;
    type?: string;       // "resume" | "jd"
    jdText?: string;
    sessionId?: string;
    title?: string;
    questionId?: string;
    existingQuestions?: string[]; // question texts already in the session
  };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Bad request." }, { status: 400 }); }

  const { action = "generate" } = body;

  // ---- delete a single question ------------------------------------------
  if (action === "delete_q") {
    if (!body.questionId) return NextResponse.json({ error: "questionId required." }, { status: 400 });
    const { error } = await supabase
      .from("quick_prep_questions")
      .delete()
      .eq("id", body.questionId)
      .eq("user_id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // ---- delete a whole session ---------------------------------------------
  if (action === "delete_session") {
    if (!body.sessionId) return NextResponse.json({ error: "sessionId required." }, { status: 400 });
    const { error } = await supabase
      .from("quick_prep_sessions")
      .delete()
      .eq("id", body.sessionId)
      .eq("user_id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // ---- init: upsert session (resume always same row; jd creates new) ------
  if (action === "init") {
    const type = body.type;
    if (type !== "resume" && type !== "jd")
      return NextResponse.json({ error: "type must be resume or jd." }, { status: 400 });
    if (type === "jd" && !body.jdText?.trim())
      return NextResponse.json({ error: "jdText required for jd type." }, { status: 400 });

    if (type === "resume") {
      // Find or create the single resume session for this user.
      const { data: existing } = await supabase
        .from("quick_prep_sessions")
        .select("*")
        .eq("user_id", user.id)
        .eq("type", "resume")
        .maybeSingle();
      if (existing) return NextResponse.json({ session: existing });

      const { data: created, error } = await supabase
        .from("quick_prep_sessions")
        .insert({ user_id: user.id, type: "resume", title: "My Resume" })
        .select()
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ session: created });
    }

    // JD: extract a title from the JD text (first non-empty line ≤ 60 chars)
    const jdTitle = body.title ||
      (body.jdText!.split("\n").find((l) => l.trim().length > 3 && l.trim().length <= 80)?.trim().slice(0, 60)) ||
      "JD Session";

    const { data: created, error } = await supabase
      .from("quick_prep_sessions")
      .insert({ user_id: user.id, type: "jd", title: jdTitle, jd_text: body.jdText })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ session: created });
  }

  // ---- generate: produce a batch of questions for a session ---------------
  if (action === "generate") {
    if (!body.sessionId) return NextResponse.json({ error: "sessionId required." }, { status: 400 });

    // Verify session belongs to user
    const { data: session } = await supabase
      .from("quick_prep_sessions")
      .select("*")
      .eq("id", body.sessionId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!session) return NextResponse.json({ error: "Session not found." }, { status: 404 });

    // Check daily token budget
    const DAILY_LIMIT = Number(process.env.DAILY_TOKEN_LIMIT || 200000);
    const today = new Date().toISOString().slice(0, 10);
    const { data: usage } = await supabase
      .from("token_usage").select("tokens_used")
      .eq("user_id", user.id).eq("usage_date", today).maybeSingle();
    if ((usage?.tokens_used ?? 0) >= DAILY_LIMIT) {
      return NextResponse.json({ error: "Daily token limit reached. Resets tomorrow.", limitReached: true }, { status: 429 });
    }

    const existingQs = body.existingQuestions ?? [];
    const isResume = session.type === "resume";

    const userPrompt = isResume
      ? buildQuickPrepResumePrompt({ resumeText: RESUME_TEXT, batchSize: BATCH_SIZE, existingQuestions: existingQs })
      : buildQuickPrepJDPrompt({ jdText: session.jd_text!, resumeText: RESUME_TEXT, batchSize: BATCH_SIZE, existingQuestions: existingQs });

    let text = "";
    let tokens = 0;
    try {
      const raw = await callGemini(QUICK_PREP_SYSTEM, userPrompt);
      const parsed = JSON.parse(raw);
      text = parsed.text;
      tokens = parsed.tokens;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "AI error";
      return NextResponse.json({ error: msg }, { status: 502 });
    }

    if (!text.trim()) return NextResponse.json({ error: "AI returned empty response." }, { status: 502 });

    const blocks = parseBlocks(text);
    if (blocks.length === 0) return NextResponse.json({ error: "Could not parse AI response. Try again." }, { status: 502 });

    // Get current max position in this session
    const { data: posRow } = await supabase
      .from("quick_prep_questions")
      .select("position")
      .eq("session_id", body.sessionId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    const startPos = (posRow?.position ?? -1) + 1;

    const rows = blocks.map((b, i) => ({
      session_id: body.sessionId,
      user_id: user.id,
      question: b.question,
      answer_md: b.answerMd,
      followup_md: b.followupMd,
      position: startPos + i,
    }));

    const { data: inserted, error: insertErr } = await supabase
      .from("quick_prep_questions")
      .insert(rows)
      .select();
    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

    // Record token spend (best-effort)
    await supabase.rpc("add_token_usage", { p_tokens: tokens });

    // Bump session updated_at
    await supabase.from("quick_prep_sessions")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", body.sessionId);

    return NextResponse.json({ questions: inserted, tokensUsed: tokens });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}

// ---- GET /api/quick-prep — list sessions + questions for the current user --
export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sessionId");

  if (sessionId) {
    // Return questions for a specific session
    const { data, error } = await supabase
      .from("quick_prep_questions")
      .select("*")
      .eq("session_id", sessionId)
      .eq("user_id", user.id)
      .order("position");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ questions: data });
  }

  // Return all sessions for the user
  const { data, error } = await supabase
    .from("quick_prep_sessions")
    .select("*, quick_prep_questions(count)")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sessions: data });
}
