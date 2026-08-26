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

const RESUME_TEXT = process.env.RESUME_TEXT || `Akash Tripathi — Senior Flutter Developer (4 years)
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
