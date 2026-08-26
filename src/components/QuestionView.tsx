"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MarkdownView } from "./MarkdownView";
import { Flashcards, type Flashcard } from "./Flashcards";
import { QuickRevision } from "./QuickRevision";
import {
  Sparkles,
  Loader2,
  Check,
  Flag,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Brain,
  Code2,
  Lock,
} from "lucide-react";

type Status = "done" | "flagged" | null;

export function QuestionView({
  question,
  initialAnswer,
  initialHinglishMd,
  initialFlashcards,
  initialHinglishFlashcards,
  initialStatus,
  initialCode,
  hasSavedAnswer,
  mode,
  backHref,
  prevHref,
  nextHref,
}: {
  question: { id: string; number: number; label: string | null; title: string; markdown: string };
  initialAnswer: string | null;
  initialHinglishMd: string | null;
  initialFlashcards: Flashcard[];
  initialHinglishFlashcards: Flashcard[];
  initialStatus: Status;
  initialCode: string | null;
  hasSavedAnswer: boolean;
  mode: "full" | "guided";
  backHref: string;
  prevHref: string | null;
  nextHref: string | null;
}) {
  const router = useRouter();
  const [answer, setAnswer] = useState<string | null>(initialAnswer);
  const [hinglishMd, setHinglishMd] = useState<string | null>(initialHinglishMd);
  const [cards, setCards] = useState<Flashcard[]>(initialFlashcards);
  const [hinglishCards, setHinglishCards] = useState<Flashcard[]>(initialHinglishFlashcards);
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>(initialStatus);
  const [meta, setMeta] = useState<string | null>(null);

  const [code, setCode] = useState(initialCode ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [progressErr, setProgressErr] = useState<string | null>(null);

  const guided = mode === "guided";
  // The explanation is stored in the DB the moment it's generated, so any
  // answer on screen is already persisted (it won't be regenerated next visit).
  const saved = !!answer && hasSavedAnswer;

  async function generate(regenerate = false) {
    setLoading(true);
    setError(null);
    setMeta(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: question.id, regenerate }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not generate.");
        return;
      }
      setAnswer(data.markdown);
      setHinglishMd(data.hinglishMd ?? "");
      setCards(data.flashcards ?? []);
      setHinglishCards(data.hinglishFlashcards ?? []);
      if (data.cached) setMeta("Loaded the saved explanation (free).");
      else if (data.saved === false)
        setMeta("Generated, but couldn't be saved — run the latest Supabase migration to cache it.");
      else if (data.tokensUsed) setMeta(`Freshly generated & saved · ${data.tokensUsed.toLocaleString()} tokens.`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleFlag() {
    // Un-flagging returns to "done" if it was already done, else clears.
    let next: Status;
    if (status === "flagged") next = saved ? "done" : null;
    else next = "flagged";
    setStatus(next);
    setProgressErr(null);
    await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        next ? { questionId: question.id, status: next } : { questionId: question.id, clear: true },
      ),
    });
    router.refresh();
  }

  // After marking done, send the learner straight to the next question
  // (or back to the day overview if this was the last one).
  function goNext() {
    if (nextHref) router.push(nextHref);
    else router.push(backHref);
    router.refresh();
  }

  // Theory/system: mark understood. The explanation is already persisted
  // globally in question_answers, so we only record the user's status.
  async function markUnderstood() {
    if (!answer) return;
    setSubmitting(true);
    setProgressErr(null);
    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: question.id, status: "done" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setProgressErr(data.error || "Could not save.");
        return;
      }
      setStatus("done");
      goNext();
    } catch {
      setProgressErr("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function undo() {
    setSubmitting(true);
    await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId: question.id, clear: true }),
    });
    setStatus(null);
    setSubmitting(false);
    router.refresh();
  }

  // Logic: submit code → mark done → go to the next question.
  async function submitCode() {
    if (!code.trim()) {
      setProgressErr("Paste your code (with comments) before submitting.");
      return;
    }
    setSubmitting(true);
    setProgressErr(null);
    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: question.id, status: "done", code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setProgressErr(data.error || "Could not save.");
        return;
      }
      setStatus("done");
      goNext();
    } catch {
      setProgressErr("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // "Update code" should save without navigating away.
  async function updateCode() {
    if (!code.trim()) return;
    setSubmitting(true);
    setProgressErr(null);
    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: question.id, status: "done", code }),
      });
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  const done = status === "done";
  const summary = answer ? extractSummary(answer) : null;

  return (
    <div className="animate-fade-in">
      {/* Question */}
      <div className={`card overflow-hidden ${done ? "ring-2 ring-success/40" : ""}`}>
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-elevated px-6 py-3">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${
              guided ? "bg-purple text-sidebar" : "bg-yellow text-sidebar"
            }`}
          >
            {guided ? <Brain size={12} /> : <BookOpen size={12} />}
            {guided ? "Logic — build it yourself" : "Learn in depth"}
          </span>
          {question.label && <span className="text-xs text-muted">{question.label}</span>}
          <div className="ml-auto flex items-center gap-2">
            {done && (
              <span className="inline-flex items-center gap-1 rounded-full bg-success px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                <Check size={12} /> Done
              </span>
            )}
            <button
              onClick={toggleFlag}
              title="Bookmark this question to revisit later (e.g. before an interview). It shows up flagged on your dashboard."
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold transition-colors ${
                status === "flagged"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-surface text-muted hover:border-border-strong hover:text-ink"
              }`}
            >
              <Flag size={12} /> {status === "flagged" ? "Saved to revisit" : "Revisit later"}
            </button>
          </div>
        </div>
        <div className="p-6">
          <MarkdownView variant="question">{question.markdown}</MarkdownView>
        </div>
      </div>

      {progressErr && <p className="mt-2 text-xs font-semibold text-danger">{progressErr}</p>}

      {/* Answer / guide */}
      <div className="mt-6">
        {!answer && !loading && (
          <button
            onClick={() => generate(false)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-[#ff8a5c] py-4 text-sm font-bold text-white shadow-[0_12px_30px_-12px_rgb(244_96_58_/_0.7)] transition-opacity hover:opacity-90"
          >
            <Sparkles size={18} />
            {guided ? "Guide me through the logic (don't solve it)" : "Explain this in depth"}
          </button>
        )}

        {loading && <AnswerSkeleton guided={guided} />}

        {error && (
          <div className="rounded-2xl border border-danger/40 bg-danger-soft p-4 text-sm font-semibold text-danger">
            {error}{" "}
            <button onClick={() => generate(false)} className="underline">
              retry
            </button>
          </div>
        )}

        {answer && !loading && (
          <div className="card overflow-hidden">
            {/* header strip */}
            <div className="flex items-center justify-between bg-gradient-to-r from-primary to-[#ff8a5c] px-6 py-3">
              <span className="inline-flex items-center gap-1.5 text-sm font-extrabold text-white">
                <Sparkles size={15} /> {guided ? "Guided walkthrough" : "In-depth explanation"}
              </span>
              <div className="flex items-center gap-2">
                {saved && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold text-white">
                    <Lock size={11} /> Saved
                  </span>
                )}
                <button
                  onClick={() => generate(true)}
                  className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold text-white transition-colors hover:bg-white/30"
                  title="Regenerate a fresh answer"
                >
                  <RefreshCw size={11} /> Regenerate
                </button>
              </div>
            </div>

            {/* Language tab bar */}
            <div className="flex border-b border-border bg-elevated">
              <button
                onClick={() => setLang("en")}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-bold transition-colors ${
                  lang === "en"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted hover:text-ink"
                }`}
              >
                🇬🇧 English
              </button>
              <button
                onClick={() => setLang("hi")}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-bold transition-colors ${
                  lang === "hi"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted hover:text-ink"
                }`}
              >
                🇮🇳 Hinglish
              </button>
            </div>

            <div className="p-6">
              {lang === "en" ? (
                <>
                  <MarkdownView variant="answer">{answer}</MarkdownView>
                  <Flashcards cards={cards} />
                  <QuickRevision questionId={question.id} summary={summary} cards={cards} />
                </>
              ) : (
                <>
                  {hinglishMd ? (
                    <>
                      <MarkdownView variant="answer">{hinglishMd}</MarkdownView>
                      <Flashcards cards={hinglishCards.length > 0 ? hinglishCards : cards} />
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-3 py-8 text-center">
                      <span className="text-3xl">🇮🇳</span>
                      <p className="text-sm font-semibold text-ink">Hinglish explanation not generated yet.</p>
                      <p className="text-xs text-muted">Click Regenerate to get both English and Hinglish.</p>
                      <button
                        onClick={() => generate(true)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
                      >
                        <RefreshCw size={14} /> Regenerate now
                      </button>
                    </div>
                  )}
                </>
              )}
              {meta && <p className="mt-4 text-[11px] text-muted">{meta}</p>}
            </div>
          </div>
        )}
      </div>

      {/* Logic-building: code submission */}
      {guided && (
        <div className="mt-6 card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border bg-purple/30 px-6 py-3">
            <Code2 size={16} className="text-sidebar" />
            <h3 className="text-sm font-extrabold text-sidebar">Submit your solution</h3>
          </div>
          <div className="p-6">
            <p className="mb-3 text-xs text-muted">
              Write the code yourself (comments encouraged). This question is marked done
              <span className="font-bold text-ink"> only</span> after you submit your code.
            </p>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={10}
              spellCheck={false}
              placeholder={"// Paste your solution here\nvoid main() {\n  // ...\n}"}
              className="w-full resize-y rounded-xl border border-border bg-sidebar px-4 py-3 font-mono text-[13px] leading-relaxed text-on-dark outline-none focus:border-primary"
            />
          </div>
        </div>
      )}

      {/* End: the single "done" action lives here, at the very bottom. */}
      <div className="mt-6 flex flex-col items-stretch gap-2">
        {guided ? (
          done ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-success/40 bg-success/10 px-5 py-4">
              <span className="inline-flex items-center gap-2 text-sm font-extrabold text-success">
                <Check size={18} /> Solution submitted — marked done
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={updateCode}
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-sm font-bold text-ink transition-colors hover:border-border-strong disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />} Update code
                </button>
                <button
                  onClick={undo}
                  disabled={submitting}
                  className="text-xs font-bold text-muted underline transition-colors hover:text-ink disabled:opacity-50"
                >
                  Unmark
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={submitCode}
              disabled={submitting || !code.trim()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-success py-4 text-sm font-extrabold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Submit &amp; mark done
            </button>
          )
        ) : done ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-success/40 bg-success/10 px-5 py-4">
            <span className="inline-flex items-center gap-2 text-sm font-extrabold text-success">
              <Check size={18} /> Marked as understood &amp; saved
            </span>
            <button
              onClick={undo}
              disabled={submitting}
              className="text-xs font-bold text-muted underline transition-colors hover:text-ink disabled:opacity-50"
            >
              Undo
            </button>
          </div>
        ) : (
          <button
            onClick={markUnderstood}
            disabled={submitting || !answer}
            title={!answer ? "Read the explanation first" : undefined}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-success py-4 text-sm font-extrabold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            I understood this — mark as done
          </button>
        )}
        {!guided && !answer && (
          <p className="text-center text-xs text-muted">Open the explanation above to enable this.</p>
        )}
      </div>

      {/* Prev / next */}
      <div className="mt-8 flex items-center justify-between">
        {prevHref ? (
          <Link
            href={prevHref}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-sm font-bold text-muted transition-colors hover:border-border-strong hover:text-ink"
          >
            <ArrowLeft size={15} /> Previous
          </Link>
        ) : (
          <span />
        )}
        {nextHref && (
          <Link
            href={nextHref}
            className="inline-flex items-center gap-1.5 rounded-full bg-sidebar px-4 py-2 text-sm font-bold text-on-dark transition-opacity hover:opacity-90"
          >
            Next <ArrowRight size={15} />
          </Link>
        )}
      </div>
    </div>
  );
}

/** Smooth shimmer placeholder shown while the tutor's answer is generating. */
function AnswerSkeleton({ guided }: { guided: boolean }) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between bg-gradient-to-r from-primary to-[#ff8a5c] px-6 py-3">
        <span className="inline-flex items-center gap-1.5 text-sm font-extrabold text-white">
          <Sparkles size={15} className="animate-pulse" />
          {guided ? "Building your guided walkthrough…" : "Writing your in-depth explanation…"}
        </span>
      </div>
      <div className="space-y-6 p-6">
        {[0, 1, 2].map((block) => (
          <div key={block} className="space-y-2.5">
            <div className="shimmer h-4 w-1/3 rounded-md" />
            <div className="shimmer h-3 w-full rounded" />
            <div className="shimmer h-3 w-[92%] rounded" />
            <div className="shimmer h-3 w-[80%] rounded" />
          </div>
        ))}
        <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
          <div className="shimmer h-28 rounded-2xl" />
          <div className="shimmer h-28 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

/**
 * Pull a short revision blurb out of the generated markdown — prefer the
 * "In short" section; fall back to the first real paragraph. Strips markdown.
 */
function extractSummary(md: string): string | null {
  const stripped = (s: string) =>
    s
      .replace(/[*_`>#]/g, "")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/\s+/g, " ")
      .trim();

  // Cut to a whole-sentence/word boundary so it never ends mid-word.
  const cap = (text: string, max: number) => {
    if (text.length <= max) return text;
    const slice = text.slice(0, max);
    const lastStop = Math.max(slice.lastIndexOf(". "), slice.lastIndexOf("! "), slice.lastIndexOf("? "));
    if (lastStop > max * 0.5) return slice.slice(0, lastStop + 1);
    const lastSpace = slice.lastIndexOf(" ");
    return (lastSpace > 0 ? slice.slice(0, lastSpace) : slice) + "…";
  };

  // The "In short" section is already a tight gist — show it in full.
  const inShort = /##+\s*In short\s*\n+([\s\S]*?)(?:\n##+\s|\n\n##+\s|$)/i.exec(md);
  if (inShort?.[1]) {
    const text = stripped(inShort[1]);
    if (text) return text;
  }

  for (const para of md.split(/\n{2,}/)) {
    if (para.trim().startsWith("#")) continue;
    const text = stripped(para);
    if (text.length > 40) return cap(text, 600);
  }
  return null;
}
