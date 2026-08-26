"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  FileText, Briefcase, Sparkles, Loader2, ChevronDown, ChevronUp,
  Upload, AlertCircle, User, Trash2, Plus, ArrowLeft, BookOpen,
  Zap, RefreshCw, MessageSquare, Globe, Languages,
} from "lucide-react";
import { MarkdownView } from "./MarkdownView";

// ── types ──────────────────────────────────────────────────────────────────
interface Session {
  id: string;
  type: "resume" | "jd";
  title: string;
  jd_text: string | null;
  created_at: string;
  updated_at: string;
  quick_prep_questions?: [{ count: number }];
}

interface Question {
  id: string;
  session_id: string;
  question: string;
  answer_md: string | null;
  answer_hi_md: string | null;
  followup_md: string | null;
  position: number;
}

// ── helpers ────────────────────────────────────────────────────────────────
async function api(body: object): Promise<{ ok: boolean; data: Record<string, unknown>; error?: string }> {
  const res = await fetch("/api/quick-prep", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { ok: res.ok, data, error: res.ok ? undefined : (data.error || "Unknown error") };
}

async function get(params: Record<string, string> = {}): Promise<Record<string, unknown>> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`/api/quick-prep${qs ? `?${qs}` : ""}`);
  return res.json();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// ── PDF text extraction ────────────────────────────────────────────────────
async function extractTextFromFile(file: File): Promise<string> {
  if (file.size > 3 * 1024 * 1024)
    throw new Error("File is too large (max 3 MB). Please paste the text directly.");
  const name = file.name.toLowerCase();
  if (name.endsWith(".docx") || name.endsWith(".doc"))
    throw new Error(".doc/.docx files cannot be read directly. Please copy-paste the JD text below.");
  if (name.endsWith(".pdf")) {
    const buf = await file.arrayBuffer();
    const decoder = new TextDecoder("latin1");
    const raw = decoder.decode(new Uint8Array(buf));
    let text = "";
    const btRe = /BT([\s\S]*?)ET/g;
    const tjRe = /\(([^)]{2,})\)\s*Tj/g;
    let btM;
    while ((btM = btRe.exec(raw)) !== null) {
      let tjM;
      while ((tjM = tjRe.exec(btM[1])) !== null) text += tjM[1] + " ";
    }
    const tjArrRe = /\[([^\]]+)\]\s*TJ/g;
    const strRe = /\(([^)]{2,})\)/g;
    let arrM;
    while ((arrM = tjArrRe.exec(raw)) !== null) {
      let strM;
      while ((strM = strRe.exec(arrM[1])) !== null) text += strM[1] + " ";
    }
    if (text.trim().length < 80) {
      const runs = raw.match(/[\x20-\x7E]{15,}/g) ?? [];
      text = runs.filter((r) => /[a-zA-Z]{4,}/.test(r) && !/^[\d\s.]+$/.test(r)).join(" ");
    }
    const cleaned = text.replace(/\s+/g, " ").trim().slice(0, 25000);
    if (cleaned.length < 50)
      throw new Error(
        "This PDF uses compressed/encoded streams and cannot be read in the browser. " +
        "Please paste the JD text directly into the text area below."
      );
    return cleaned;
  }
  return (await file.text()).slice(0, 25000);
}

// ── Markdown renderer for rich prose-qp answers ───────────────────────────
function RichAnswer({ md, isHinglish = false }: { md: string; isHinglish?: boolean }) {
  // Split out the "## ✅" interview section to give it a special green box
  const interviewMarker = /^##\s+✅/m;
  const matchPos = md.search(interviewMarker);

  if (matchPos !== -1) {
    const before = md.slice(0, matchPos);
    const after = md.slice(matchPos).replace(/^##\s+✅[^\n]*\n?/, "");

    return (
      <div className={`prose-qp ${isHinglish ? "prose-qp-hi" : ""}`}>
        <MarkdownView variant="answer">{before}</MarkdownView>
        <div className="interview-box">
          <div className="interview-box-label">✅ What to say in the interview</div>
          <MarkdownView variant="answer">{after}</MarkdownView>
        </div>
      </div>
    );
  }

  return (
    <div className={`prose-qp ${isHinglish ? "prose-qp-hi" : ""}`}>
      <MarkdownView variant="answer">{md}</MarkdownView>
    </div>
  );
}

// ── QACard: lazy-loading per-question ────────────────────────────────────
function QACard({
  q: initialQ,
  index,
  onDelete,
}: {
  q: Question;
  index: number;
  onDelete: (id: string) => void;
}) {
  const [q, setQ] = useState(initialQ);
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [answerLoading, setAnswerLoading] = useState(false);
  const [followupLoading, setFollowupLoading] = useState(false);
  const [answerError, setAnswerError] = useState<string | null>(null);
  const [followupError, setFollowupError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showFollowups, setShowFollowups] = useState(false);

  async function generateAnswer(regenerate = false) {
    setAnswerLoading(true);
    setAnswerError(null);
    const { ok, data, error } = await api({
      action: "generate_answer",
      questionId: q.id,
      regenerate,
    });
    setAnswerLoading(false);
    if (!ok) { setAnswerError(error || "Generation failed. Try again."); return; }
    setQ((prev) => ({
      ...prev,
      answer_md: data.answer_md as string,
      answer_hi_md: data.answer_hi_md as string,
    }));
  }

  async function generateFollowup(regenerate = false) {
    setFollowupLoading(true);
    setFollowupError(null);
    const { ok, data, error } = await api({
      action: "generate_followup",
      questionId: q.id,
      regenerate,
    });
    setFollowupLoading(false);
    if (!ok) { setFollowupError(error || "Generation failed. Try again."); return; }
    setQ((prev) => ({ ...prev, followup_md: data.followup_md as string }));
    setShowFollowups(true);
  }

  async function handleDelete() {
    if (!confirm("Remove this question?")) return;
    setDeleting(true);
    await api({ action: "delete_q", questionId: q.id });
    onDelete(q.id);
  }

  const hasAnswer = Boolean(q.answer_md);
  const hasFollowup = Boolean(q.followup_md);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      {/* Header */}
      <div className="flex items-start gap-3 px-5 py-4">
        <button
          onClick={() => setOpen((p) => !p)}
          className="flex flex-1 items-start gap-3 text-left"
        >
          <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary text-xs font-extrabold text-white">
            {index + 1}
          </span>
          <span className="flex-1 text-sm font-bold leading-snug text-ink">{q.question}</span>
          <span className="mt-0.5 shrink-0 text-muted">
            {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </span>
        </button>

        {/* Status badge */}
        {hasAnswer && !open && (
          <span className="mt-1 shrink-0 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success">
            Answered
          </span>
        )}

        <button
          onClick={handleDelete}
          disabled={deleting}
          title="Remove this question"
          className="ml-1 mt-0.5 shrink-0 rounded-lg p-1.5 text-faint transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-40"
        >
          {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
        </button>
      </div>

      {/* Body — expands on click */}
      {open && (
        <div className="border-t border-border">
          {/* ── Answer section ── */}
          <div className="px-5 py-5">
            {!hasAnswer && !answerLoading && (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <Zap size={24} className="text-primary/60" />
                <p className="text-xs text-muted">Tap to generate a detailed answer with full explanation</p>
                <button
                  onClick={() => generateAnswer(false)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-[#ff8a5c] px-6 py-2.5 text-sm font-bold text-white shadow-[0_6px_18px_-6px_rgb(244_96_58_/_0.5)] transition-opacity hover:opacity-90"
                >
                  <Zap size={15} /> Generate answer
                </button>
                {answerError && (
                  <p className="text-xs font-semibold text-danger">{answerError}</p>
                )}
              </div>
            )}

            {answerLoading && (
              <div className="space-y-3 py-4">
                <div className="flex items-center gap-2 text-xs text-muted">
                  <Loader2 size={14} className="animate-spin text-primary" />
                  Generating detailed answer in English + Hinglish simultaneously…
                </div>
                {[80, 65, 90, 55, 75].map((w, i) => (
                  <div key={i} className="shimmer h-3 rounded" style={{ width: `${w}%` }} />
                ))}
              </div>
            )}

            {hasAnswer && !answerLoading && (
              <>
                {/* Language tabs */}
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex rounded-xl border border-border bg-elevated p-0.5">
                    <button
                      onClick={() => setLang("en")}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                        lang === "en"
                          ? "bg-surface text-ink shadow-sm"
                          : "text-muted hover:text-ink"
                      }`}
                    >
                      <Globe size={12} /> English
                    </button>
                    <button
                      onClick={() => setLang("hi")}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                        lang === "hi"
                          ? "bg-surface text-ink shadow-sm"
                          : "text-muted hover:text-ink"
                      }`}
                    >
                      <Languages size={12} /> Hinglish
                    </button>
                  </div>
                  <button
                    onClick={() => generateAnswer(true)}
                    title="Regenerate answer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-bold text-muted transition-colors hover:border-border-strong hover:text-ink"
                  >
                    <RefreshCw size={11} /> Regenerate
                  </button>
                </div>

                {/* Answer content */}
                <div className="animate-fade-in">
                  {lang === "en" && q.answer_md && (
                    <RichAnswer md={q.answer_md} isHinglish={false} />
                  )}
                  {lang === "hi" && (
                    q.answer_hi_md
                      ? <RichAnswer md={q.answer_hi_md} isHinglish={true} />
                      : <p className="py-4 text-center text-sm text-muted">Hinglish version not available. Try regenerating.</p>
                  )}
                </div>

                {answerError && (
                  <p className="mt-3 text-xs font-semibold text-danger">{answerError}</p>
                )}
              </>
            )}
          </div>

          {/* ── Follow-up section ── */}
          {hasAnswer && (
            <div className="border-t border-border bg-elevated/40 px-5 py-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <MessageSquare size={14} className="text-primary" />
                  <span className="text-xs font-extrabold uppercase tracking-wide text-muted">
                    Follow-up questions
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {hasFollowup && (
                    <button
                      onClick={() => setShowFollowups((p) => !p)}
                      className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-bold text-muted transition-colors hover:border-border-strong hover:text-ink"
                    >
                      {showFollowups ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      {showFollowups ? "Hide" : "Show"}
                    </button>
                  )}
                  {hasFollowup && (
                    <button
                      onClick={() => generateFollowup(true)}
                      disabled={followupLoading}
                      title="Regenerate follow-ups"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-bold text-muted transition-colors hover:border-border-strong hover:text-ink disabled:opacity-50"
                    >
                      <RefreshCw size={11} className={followupLoading ? "animate-spin" : ""} />
                      Regenerate
                    </button>
                  )}
                  {!hasFollowup && !followupLoading && (
                    <button
                      onClick={() => generateFollowup(false)}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/20"
                    >
                      <Zap size={12} /> Generate follow-ups
                    </button>
                  )}
                  {followupLoading && (
                    <span className="flex items-center gap-1.5 text-xs text-muted">
                      <Loader2 size={12} className="animate-spin" /> Generating…
                    </span>
                  )}
                </div>
              </div>

              {followupError && (
                <p className="mt-2 text-xs font-semibold text-danger">{followupError}</p>
              )}

              {hasFollowup && showFollowups && !followupLoading && (
                <div className="mt-4 animate-fade-in prose-qp">
                  <MarkdownView variant="answer">
                    {(q.followup_md ?? "").replace(/^##\s+Follow-up questions\n?/im, "")}
                  </MarkdownView>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── SessionCard ────────────────────────────────────────────────────────────
function SessionCard({
  session, onOpen, onDelete,
}: {
  session: Session; onOpen: (s: Session) => void; onDelete: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const count = session.quick_prep_questions?.[0]?.count ?? 0;
  const isResume = session.type === "resume";

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`Delete "${session.title}" and all its questions?`)) return;
    setDeleting(true);
    await api({ action: "delete_session", sessionId: session.id });
    onDelete(session.id);
  }

  return (
    <div
      onClick={() => onOpen(session)}
      className="card card-hover flex cursor-pointer items-start gap-4 p-5"
    >
      <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${isResume ? "bg-yellow" : "bg-blue"}`}>
        {isResume ? <User size={20} className="text-sidebar" /> : <Briefcase size={20} className="text-sidebar" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-extrabold text-ink">{session.title}</p>
        <p className="mt-0.5 text-xs text-muted">
          {isResume ? "Resume-based" : "JD-based"} · {count} question{count !== 1 ? "s" : ""}
        </p>
        <p className="mt-1 text-[11px] text-faint">Updated {formatDate(session.updated_at)}</p>
      </div>
      <button
        onClick={handleDelete}
        disabled={deleting}
        title="Delete session"
        className="mt-0.5 shrink-0 rounded-lg p-1.5 text-faint transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-40"
      >
        {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
      </button>
    </div>
  );
}

// ── New JD form ────────────────────────────────────────────────────────────
function NewJDForm({ onCreated }: { onCreated: (session: Session) => void }) {
  const [jdText, setJdText] = useState("");
  const [jdFileName, setJdFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError(null);
    setJdFileName(file.name);
    try {
      const text = await extractTextFromFile(file);
      setJdText(text);
    } catch (err) {
      setFileError(err instanceof Error ? err.message : "Could not read file.");
      setJdFileName(null);
    }
    e.target.value = "";
  }

  function clearFile() { setJdFileName(null); setJdText(""); setFileError(null); }

  async function handleCreate() {
    if (!jdText.trim()) { setError("Please upload a JD file or paste the job description."); return; }
    setLoading(true);
    setError(null);
    const { ok, data, error: err } = await api({ action: "init", type: "jd", jdText });
    setLoading(false);
    if (!ok) { setError(err || "Could not create session."); return; }
    onCreated(data.session as Session);
  }

  return (
    <div className="card p-5 sm:p-6">
      <h3 className="mb-4 font-extrabold text-ink">New JD session</h3>
      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-elevated px-4 py-2.5 text-sm font-bold text-ink transition-colors hover:border-border-strong"
          >
            <Upload size={15} /> Upload file
          </button>
          <span className="text-xs text-muted">PDF or TXT/MD (max 3 MB) — not .docx</span>
          {jdFileName && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-bold text-success">
              <FileText size={12} /> {jdFileName}
              <button onClick={clearFile} className="ml-1 text-success/60 hover:text-danger">×</button>
            </span>
          )}
          <input ref={fileRef} type="file" accept=".pdf,.md,.txt" className="hidden" onChange={handleFile} />
        </div>

        {fileError && (
          <div className="flex items-start gap-2 rounded-xl border border-danger/40 bg-danger-soft px-4 py-3 text-xs font-semibold text-danger">
            <AlertCircle size={14} className="mt-0.5 shrink-0" /> {fileError}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted">Or paste the JD text</label>
          <textarea
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            rows={7}
            placeholder="Paste the full job description here…"
            className="w-full resize-y rounded-xl border border-border bg-elevated px-4 py-3 text-sm leading-relaxed text-ink outline-none transition-colors focus:border-primary placeholder:text-muted"
          />
          {jdText && <p className="mt-1 text-right text-[11px] text-muted">{jdText.length.toLocaleString()} chars</p>}
        </div>
      </div>

      {error && (
        <div className="mb-3 flex items-start gap-2 rounded-xl border border-danger/40 bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">
          <AlertCircle size={15} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}

      <button
        onClick={handleCreate}
        disabled={loading || !jdText.trim()}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-[#ff8a5c] py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
        Create JD session
      </button>
    </div>
  );
}

// ── Session detail ─────────────────────────────────────────────────────────
function SessionDetail({
  session, onBack, onDeleted,
}: {
  session: Session;
  onBack: () => void;
  onDeleted: () => void;
}) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQs, setLoadingQs] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState(0);

  const fetchQuestions = useCallback(async () => {
    setLoadingQs(true);
    const data = await get({ sessionId: session.id });
    setQuestions((data.questions as Question[]) ?? []);
    setLoadingQs(false);
  }, [session.id]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  useEffect(() => {
    if (!loadingQs && questions.length === 0) generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingQs]);

  async function generate() {
    setGenerating(true);
    setGenError(null);
    const existingQs = questions.map((q) => q.question);
    const { ok, data, error } = await api({
      action: "generate",
      sessionId: session.id,
      existingQuestions: existingQs,
    });
    if (!ok) { setGenError(error || "Generation failed."); setGenerating(false); return; }
    const newQs = (data.questions as Question[]) ?? [];
    setQuestions((prev) => [...prev, ...newQs]);
    setJustAdded(newQs.length);
    setGenerating(false);
    setTimeout(() => {
      document.getElementById("new-questions-anchor")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  function handleDeleteQ(id: string) {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  }

  async function handleDeleteSession() {
    if (!confirm(`Delete "${session.title}" and all its questions? This cannot be undone.`)) return;
    await api({ action: "delete_session", sessionId: session.id });
    onDeleted();
  }

  const isResume = session.type === "resume";

  return (
    <div className="animate-fade-in">
      <button
        onClick={onBack}
        className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-sm font-bold text-muted transition-colors hover:border-border-strong hover:text-ink"
      >
        <ArrowLeft size={14} /> All sessions
      </button>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${isResume ? "bg-yellow" : "bg-blue"}`}>
            {isResume ? <User size={20} className="text-sidebar" /> : <Briefcase size={20} className="text-sidebar" />}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-ink">{session.title}</h1>
            <p className="text-xs text-muted">
              {isResume ? "Resume-based" : "JD-based"} · {questions.length} question{questions.length !== 1 ? "s" : ""}
              {" · "}Updated {formatDate(session.updated_at)}
            </p>
          </div>
        </div>
        <button
          onClick={handleDeleteSession}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-2 text-xs font-bold text-danger transition-colors hover:bg-danger/10"
        >
          <Trash2 size={13} /> Delete session
        </button>
      </div>

      {/* Questions list */}
      {loadingQs ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-border bg-surface">
              <div className="flex items-start gap-4 px-5 py-4">
                <div className="shimmer h-7 w-7 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="shimmer h-4 w-3/4 rounded" />
                  <div className="shimmer h-3 w-1/2 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : questions.length === 0 && !generating ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <BookOpen size={32} className="text-faint" />
          <p className="text-sm font-bold text-ink">No questions yet</p>
          <p className="text-xs text-muted">Hit Generate to create the first batch.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q, i) => {
            const isFirstNew = justAdded > 0 && i === questions.length - justAdded;
            return (
              <div key={q.id} id={isFirstNew ? "new-questions-anchor" : undefined}>
                {isFirstNew && justAdded > 0 && (
                  <div className="mb-3 flex items-center gap-2">
                    <div className="h-px flex-1 bg-primary/20" />
                    <span className="text-xs font-bold text-primary">↓ {justAdded} new questions added</span>
                    <div className="h-px flex-1 bg-primary/20" />
                  </div>
                )}
                <QACard q={q} index={i} onDelete={handleDeleteQ} />
              </div>
            );
          })}
        </div>
      )}

      {/* Generating skeletons */}
      {generating && (
        <div className="mt-3 space-y-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-border bg-surface">
              <div className="flex items-start gap-4 px-5 py-4">
                <div className="shimmer h-7 w-7 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="shimmer h-4 w-3/4 rounded" />
                  <div className="shimmer h-3 w-1/2 rounded" />
                </div>
              </div>
            </div>
          ))}
          <p className="py-2 text-center text-xs text-muted">
            Generating 5 interview questions… tap any question to generate its answer on demand.
          </p>
        </div>
      )}

      {genError && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-danger/40 bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">
          <AlertCircle size={15} className="mt-0.5 shrink-0" /> {genError}
          <button onClick={generate} className="ml-auto underline">Retry</button>
        </div>
      )}

      {!loadingQs && (
        <div className="mt-6">
          <button
            onClick={generate}
            disabled={generating}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/40 py-4 text-sm font-bold text-primary transition-colors hover:border-primary hover:bg-primary/5 disabled:opacity-50"
          >
            {generating ? (
              <><Loader2 size={16} className="animate-spin" /> Generating more questions…</>
            ) : (
              <><Plus size={16} /> Generate 5 more questions</>
            )}
          </button>
          {!generating && questions.length > 0 && (
            <p className="mt-2 text-center text-xs text-muted">
              Tap any question to generate its answer on demand. New questions are added below — nothing is replaced.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Root component ─────────────────────────────────────────────────────────
export function QuickPrepClient() {
  const [view, setView] = useState<"list" | "session">("list");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [showNewJD, setShowNewJD] = useState(false);
  const [creatingResume, setCreatingResume] = useState(false);

  const loadSessions = useCallback(async () => {
    setLoadingSessions(true);
    const data = await get();
    setSessions((data.sessions as Session[]) ?? []);
    setLoadingSessions(false);
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  async function openResume() {
    setCreatingResume(true);
    const { ok, data } = await api({ action: "init", type: "resume" });
    setCreatingResume(false);
    if (!ok) return;
    const session = data.session as Session;
    setSessions((prev) => prev.find((s) => s.id === session.id) ? prev : [session, ...prev]);
    setActiveSession(session);
    setView("session");
  }

  function openSession(s: Session) { setActiveSession(s); setView("session"); }

  function handleJDCreated(session: Session) {
    setSessions((prev) => [session, ...prev]);
    setShowNewJD(false);
    setActiveSession(session);
    setView("session");
  }

  function handleSessionDeleted(id: string) {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    setView("list");
    setActiveSession(null);
  }

  if (view === "session" && activeSession) {
    return (
      <SessionDetail
        session={activeSession}
        onBack={() => { setView("list"); setActiveSession(null); loadSessions(); }}
        onDeleted={() => handleSessionDeleted(activeSession.id)}
      />
    );
  }

  const resumeSession = sessions.find((s) => s.type === "resume");
  const jdSessions = sessions.filter((s) => s.type === "jd");

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Quick Prepare</h1>
        <p className="mt-1 text-sm text-muted">
          Tap a question to generate its answer on demand — English + Hinglish, with follow-ups.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={openResume}
          disabled={creatingResume}
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-[#ff8a5c] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_20px_-8px_rgb(244_96_58_/_0.5)] transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {creatingResume ? <Loader2 size={15} className="animate-spin" /> : <User size={15} />}
          {resumeSession ? "Open Resume session" : "Start Resume session"}
        </button>
        <button
          onClick={() => setShowNewJD((p) => !p)}
          className="inline-flex items-center gap-2 rounded-2xl border-2 border-primary/30 bg-surface px-5 py-3 text-sm font-bold text-primary transition-colors hover:border-primary hover:bg-primary/5"
        >
          <Plus size={15} /> New JD session
        </button>
      </div>

      {showNewJD && (
        <div className="mb-6">
          <NewJDForm onCreated={handleJDCreated} />
        </div>
      )}

      {loadingSessions ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="card p-5">
              <div className="flex items-center gap-4">
                <div className="shimmer h-11 w-11 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="shimmer h-4 w-1/3 rounded" />
                  <div className="shimmer h-3 w-1/4 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <Sparkles size={36} className="text-faint" />
          <p className="text-sm font-bold text-ink">No sessions yet</p>
          <p className="text-xs text-muted">Start a Resume session or create a JD session for your next interview.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {resumeSession && (
            <div>
              <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-muted">Resume</p>
              <SessionCard session={resumeSession} onOpen={openSession} onDelete={(id) => setSessions((p) => p.filter((s) => s.id !== id))} />
            </div>
          )}
          {jdSessions.length > 0 && (
            <div>
              <p className="mb-2 mt-4 text-xs font-extrabold uppercase tracking-wide text-muted">
                JD sessions ({jdSessions.length})
              </p>
              <div className="space-y-3">
                {jdSessions.map((s) => (
                  <SessionCard key={s.id} session={s} onOpen={openSession} onDelete={(id) => setSessions((p) => p.filter((x) => x.id !== id))} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {sessions.length > 0 && (
        <div className="mt-8 rounded-2xl border border-border bg-elevated/60 px-5 py-4">
          <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-muted">How it works</p>
          <ul className="space-y-1.5 text-xs text-muted">
            <li>· Questions are generated in batches of 5 — tap any question to generate its answer.</li>
            <li>· Each answer includes English + Hinglish versions — switch with the tab at the top.</li>
            <li>· After reading an answer, generate follow-up questions separately.</li>
            <li>· Regenerate any answer or follow-up if you want a different take.</li>
            <li>· Hit <strong className="text-ink">Generate 5 more</strong> for deeper coverage — never repeats old questions.</li>
          </ul>
        </div>
      )}
    </div>
  );
}
