import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  QUICK_PREP_SYSTEM,
  buildQuickPrepResumePrompt,
  buildQuickPrepJDPrompt,
} from "@/lib/prompts";

export const maxDuration = 120;

const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const API_KEY = process.env.GEMINI_API_KEY || "";

// Resume text comes exclusively from the RESUME_TEXT environment variable.
// Set it in Vercel dashboard (or .env.local) — never hardcode it in source.
// See .env.local.example for the key name.
const RESUME_TEXT = process.env.RESUME_TEXT ?? "";

async function callGemini(systemPrompt: string, userPrompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
  const body = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 40000,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    let msg = `Gemini API error (${res.status}).`;
    try {
      const j = JSON.parse(text);
      if (j?.error?.message) msg = `Gemini: ${j.error.message}`;
    } catch { /* keep default */ }
    throw new Error(msg);
  }

  const data = await res.json();
  return (
    data?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text ?? "")
      .join("") ?? ""
  );
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  if (!API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY is not set." }, { status: 500 });
  }
  if (!RESUME_TEXT.trim()) {
    return NextResponse.json(
      { error: "Resume data is not configured. Set the RESUME_TEXT environment variable in your Vercel dashboard or .env.local." },
      { status: 500 },
    );
  }

  let body: { type?: string; jdText?: string; questionCount?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const type = body.type; // "resume" | "jd"
  if (type !== "resume" && type !== "jd") {
    return NextResponse.json({ error: "type must be 'resume' or 'jd'." }, { status: 400 });
  }
  if (type === "jd" && !body.jdText?.trim()) {
    return NextResponse.json({ error: "jdText is required for JD mode." }, { status: 400 });
  }

  const questionCount = Math.min(Math.max(body.questionCount ?? 10, 5), 20);

  const userPrompt =
    type === "resume"
      ? buildQuickPrepResumePrompt({ resumeText: RESUME_TEXT, questionCount })
      : buildQuickPrepJDPrompt({
          jdText: body.jdText!,
          resumeText: RESUME_TEXT,
          questionCount,
        });

  try {
    const markdown = await callGemini(QUICK_PREP_SYSTEM, userPrompt);
    if (!markdown.trim()) {
      return NextResponse.json({ error: "AI returned an empty response." }, { status: 502 });
    }
    return NextResponse.json({ markdown, type, questionCount });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "AI could not be reached.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
