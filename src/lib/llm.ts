import type { Mode } from "./curriculum";
import { systemPromptFor, buildUserPrompt, HINGLISH_SYSTEM, buildHinglishPrompt } from "./prompts";

// Free LLM provider. Default = Google Gemini (generous free tier from
// https://aistudio.google.com/apikey). Uses the raw REST API so there's no SDK
// to keep in sync. Swap models with GEMINI_MODEL.
export const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const API_KEY = process.env.GEMINI_API_KEY || "";

export interface Flashcard {
  front: string;
  back: string;
}

export interface GeneratedAnswer {
  markdown: string;
  hinglishMd: string;
  flashcards: Flashcard[];
  hinglishFlashcards: Flashcard[];
  inputTokens: number;
  outputTokens: number;
  model: string;
}

export function isConfigured(): boolean {
  return API_KEY.length > 0;
}

interface RawResult {
  text: string;
  finishReason: string;
  inputTokens: number;
  outputTokens: number;
}

async function callGemini(opts: {
  mode: Mode;
  contextLabel: string;
  questionMarkdown: string;
  maxOutputTokens: number;
  systemPrompt?: string;
  userPrompt?: string;
}): Promise<RawResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
  const body = {
    systemInstruction: { parts: [{ text: opts.systemPrompt ?? systemPromptFor(opts.mode) }] },
    contents: [{ role: "user", parts: [{ text: opts.userPrompt ?? buildUserPrompt(opts) }] }],
    // Plain markdown (NOT JSON mode): far more resilient to length — a long
    // answer still renders even if it runs close to the limit, whereas a
    // truncated JSON blob is unparseable and shows as broken text.
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: opts.maxOutputTokens,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 429) {
      const err = new Error("rate-limited") as Error & {
        is429: true;
        perDay: boolean;
        retryAfterMs: number;
      };
      err.is429 = true;
      // Inspect the violation to tell "out for the day" from "going too fast".
      let perDay = false;
      let retryAfterMs = 20000;
      try {
        const j = JSON.parse(text);
        for (const det of j?.error?.details ?? []) {
          for (const v of det.violations ?? []) {
            if (/PerDay/i.test(v.quotaId || "")) perDay = true;
          }
          if (typeof det.retryDelay === "string") {
            const s = Number.parseFloat(det.retryDelay);
            if (!Number.isNaN(s)) retryAfterMs = Math.ceil(s * 1000);
          }
        }
      } catch {
        /* ignore */
      }
      err.perDay = perDay;
      err.retryAfterMs = retryAfterMs;
      throw err;
    }
    let msg = `Gemini API error (${res.status}).`;
    try {
      const j = JSON.parse(text);
      if (j?.error?.message) msg = `Gemini: ${j.error.message}`;
    } catch {
      /* keep default */
    }
    throw new Error(msg);
  }

  const data = await res.json();
  const candidate = data?.candidates?.[0];
  const text = candidate?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
  const finishReason = candidate?.finishReason || data?.promptFeedback?.blockReason || "UNKNOWN";
  const usage = data?.usageMetadata ?? {};
  return {
    text,
    finishReason,
    inputTokens: usage.promptTokenCount ?? 0,
    outputTokens: usage.candidatesTokenCount ?? 0,
  };
}

async function callWithRetry(opts: Parameters<typeof callGemini>[0]): Promise<RawResult> {
  let result;
  try {
    result = await callGemini({ ...opts, maxOutputTokens: 24576 });
  } catch (e) {
    result = await handle429(e, () => callGemini({ ...opts, maxOutputTokens: 24576 }));
  }
  if (result.finishReason === "MAX_TOKENS") {
    result = await callGemini({ ...opts, maxOutputTokens: 40000 });
  }
  return result;
}

export async function generateAnswer(opts: {
  contextLabel: string;
  questionMarkdown: string;
  mode: Mode;
}): Promise<GeneratedAnswer> {
  if (!API_KEY) {
    throw new Error("GEMINI_API_KEY is not set. Add a free key from https://aistudio.google.com/apikey to .env.local.");
  }

  // Fire English and Hinglish calls in parallel to save time.
  const [result, hinglishResult] = await Promise.all([
    callWithRetry({ ...opts, maxOutputTokens: 24576 }),
    callWithRetry({
      ...opts,
      maxOutputTokens: 24576,
      systemPrompt: HINGLISH_SYSTEM,
      userPrompt: buildHinglishPrompt(opts),
    }),
  ]);

  if (!result.text.trim()) {
    const why = result.finishReason === "SAFETY" ? "the safety filter blocked it" : `reason: ${result.finishReason}`;
    throw new Error(`The AI returned an empty answer (${why}). Please try again.`);
  }

  const { markdown, flashcards } = splitAnswerAndCards(result.text);
  const { markdown: hinglishMd, flashcards: hinglishFlashcards } = splitAnswerAndCards(hinglishResult.text);

  return {
    markdown,
    hinglishMd,
    flashcards,
    hinglishFlashcards,
    inputTokens: result.inputTokens + hinglishResult.inputTokens,
    outputTokens: result.outputTokens + hinglishResult.outputTokens,
    model: MODEL,
  };
}

type Err429 = Error & { is429?: true; perDay?: boolean; retryAfterMs?: number };

// On a 429: a per-DAY limit is a hard wall (clear message); a per-MINUTE limit
// is transient, so wait the suggested delay and retry once.
async function handle429(e: unknown, retry: () => Promise<RawResult>): Promise<RawResult> {
  const err = e as Err429;
  if (!err?.is429) throw e;
  if (err.perDay) {
    throw new Error(
      "Today's free AI quota for this key is used up (Gemini free tier resets daily). " +
        "Create a fresh key at aistudio.google.com/apikey (it should start with 'AIza') and put it in .env.local, or try again tomorrow.",
    );
  }
  const wait = Math.min(err.retryAfterMs ?? 20000, 30000);
  await new Promise((r) => setTimeout(r, wait));
  try {
    return await retry();
  } catch (again) {
    const a = again as Err429;
    if (a?.is429) {
      throw new Error(
        "The AI is rate-limited (too many requests in a short time on the free tier). Wait a minute and try again.",
      );
    }
    throw again;
  }
}

// The prompt asks the model to end with a fenced ```flashcards block of
// "Q :: A" lines. Parse those out; everything before it is the answer.
function splitAnswerAndCards(text: string): { markdown: string; flashcards: Flashcard[] } {
  const fenceRe = /```flashcards\s*([\s\S]*?)```/i;
  const m = fenceRe.exec(text);
  const flashcards: Flashcard[] = [];

  if (!m) {
    // No fenced block (or it got cut off). Strip a trailing, possibly-partial
    // "Flashcards" heading so we never show a dangling, empty section.
    const markdown = text.replace(/\n#{1,6}\s*flashcards[\s\S]*$/i, "").trim();
    return { markdown, flashcards };
  }

  const markdown = text.slice(0, m.index).trim();
  for (const line of m[1].split("\n")) {
    const sep = line.indexOf("::");
    if (sep === -1) continue;
    const front = line.slice(0, sep).replace(/^[-*\d.\s]+/, "").trim();
    const back = line.slice(sep + 2).trim();
    if (front && back) flashcards.push({ front, back });
  }

  return { markdown, flashcards: flashcards.slice(0, 8) };
}
