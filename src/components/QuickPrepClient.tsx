"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  FileText, Briefcase, Loader2, ChevronDown, ChevronUp,
  Upload, AlertCircle, User, Trash2, Plus, ArrowLeft,
  Zap, RefreshCw, MessageSquare, Globe, Languages, CheckCircle2,
  Circle, Sparkles, BookOpen, Target,
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

// ── PDF extraction via pdf.js (handles compressed PDFs) ───────────────────
async function extractTextFromFile(file: File): Promise<string> {
  if (file.size > 5 * 1024 * 1024)
    throw new Error("File is too large (max 5 MB). Please paste the text directly.");
  const name = file.name.toLowerCase();
  if (name.endsWith(".docx") || name.endsWith(".doc"))
    throw new Error(".doc/.docx files cannot be read directly. Please copy-paste the JD text below.");

  if (name.endsWith(".pdf")) {
    // Dynamically load pdf.js from CDN
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let pdfjsLib: any;
    try {
      // @ts-expect-error — dynamic CDN import
      pdfjsLib = await import("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs");
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs";
    } catch {
      throw new Error("Could not load PDF reader. Please paste the JD text directly.");
    }

    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    const parts: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      parts.push(content.items.map((item: any) => item.str).join(" "));
    }
    const text = parts.join("\n").replace(/\s+/g, " ").trim().slice(0, 25000);
    if (text.length < 50)
      throw new Error("Could not extract text from this PDF. Please paste the JD text directly.");
    return text;
  }

  // .md / .txt
  return (await file.text()).slice(0, 25000);
}

// ── Rich answer renderer ───────────────────────────────────────────────────
function RichAnswer({ md, isHinglish = false }: { md: string; isHinglish?: boolean }) {
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

// ── QACard ─────────────────────────────────────────────────────────────────
function QACard({ q: initialQ, index, onDelete }: {
  q: Question; index: number; onDelete: (id: string) => void;
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

  const hasAnswer = Boolean(q.answer_md);
  const hasFollowup = Boolean(q.followup_md);

  async function generateAnswer(regenerate = false) {
    setAnswerLoading(true);
    setAnswerError(null);
    const { ok, data, error } = await api({ action: "generate_answer", questionId: q.id, regenerate });
    setAnswerLoading(false);
    if (!ok) { setAnswerError(error || "Generation failed. Try again."); return; }
    setQ((prev) => ({ ...prev, answer_md: data.answer_md as string, answer_hi_md: data.answer_hi_md as string }));
  }

  async function generateFollowup(regenerate = false) {
    setFollowupLoading(true);
    setFollowupError(null);
    const { ok, data, error } = await api({ action: "generate_followup", questionId: q.id, regenerate });
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

  return (
    <div
      className={`qp-qa-card ${open ? "qp-qa-card--open" : ""} ${hasAnswer ? "qp-qa-card--answered" : ""}`}
    >
      {/* Status stripe */}
      <div className={`qp-qa-stripe ${hasAnswer ? "qp-qa-stripe--done" : ""}`} />

      {/* Header row */}
      <div className="qp-qa-header">
        <button
          onClick={() => setOpen((p) => !p)}
          className="qp-qa-toggle"
          aria-expanded={open}
        >
          {/* Index badge */}
          <span className="qp-qa-num">{String(index + 1).padStart(2, "0")}</span>

          {/* Question text */}
          <span className="qp-qa-question">{q.question}</span>

          {/* Status */}
          <span className="qp-qa-status-icon">
            {hasAnswer
              ? <CheckCircle2 size={16} className="qp-status-done" />
              : <Circle size={16} className="qp-status-todo" />
            }
          </span>

          <span className="qp-qa-chevron">
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </span>
        </button>

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="qp-qa-delete"
          title="Remove question"
        >
          {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
        </button>
      </div>

      {/* Expanded body */}
      {open && (
        <div className="qp-qa-body">
          {/* ── No answer yet ── */}
          {!hasAnswer && !answerLoading && (
            <div className="qp-generate-prompt">
              <div className="qp-generate-icon-wrap">
                <Zap size={22} />
              </div>
              <p className="qp-generate-label">Generate a detailed answer with full explanation</p>
              <p className="qp-generate-sub">
                Includes English + Hinglish versions, key points, and exactly what to say in the interview.
              </p>
              <button onClick={() => generateAnswer(false)} className="qp-btn-generate">
                <Zap size={14} /> Generate answer
              </button>
              {answerError && <p className="qp-error-inline">{answerError}</p>}
            </div>
          )}

          {/* ── Loading skeleton ── */}
          {answerLoading && (
            <div className="qp-loading-answer">
              <div className="qp-loading-label">
                <Loader2 size={13} className="animate-spin" />
                Generating English + Hinglish simultaneously…
              </div>
              <div className="qp-skeleton-lines">
                {[88, 72, 94, 60, 80, 65].map((w, i) => (
                  <div key={i} className="shimmer qp-skeleton-line" style={{ width: `${w}%` }} />
                ))}
              </div>
            </div>
          )}

          {/* ── Answer ── */}
          {hasAnswer && !answerLoading && (
            <div className="qp-answer-section">
              {/* Lang tabs + regen */}
              <div className="qp-answer-toolbar">
                <div className="qp-lang-tabs">
                  <button
                    onClick={() => setLang("en")}
                    className={`qp-lang-tab ${lang === "en" ? "qp-lang-tab--active" : ""}`}
                  >
                    <Globe size={11} /> English
                  </button>
                  <button
                    onClick={() => setLang("hi")}
                    className={`qp-lang-tab ${lang === "hi" ? "qp-lang-tab--active" : ""}`}
                  >
                    <Languages size={11} /> Hinglish
                  </button>
                </div>
                <button
                  onClick={() => generateAnswer(true)}
                  className="qp-btn-regen"
                  title="Regenerate answer"
                >
                  <RefreshCw size={11} /> Regenerate
                </button>
              </div>

              {/* Content */}
              <div className="qp-answer-content animate-fade-in">
                {lang === "en" && q.answer_md && <RichAnswer md={q.answer_md} />}
                {lang === "hi" && (
                  q.answer_hi_md
                    ? <RichAnswer md={q.answer_hi_md} isHinglish />
                    : <p className="qp-missing">Hinglish not available — try regenerating.</p>
                )}
              </div>
              {answerError && <p className="qp-error-inline">{answerError}</p>}
            </div>
          )}

          {/* ── Follow-ups ── */}
          {hasAnswer && (
            <div className="qp-followup-section">
              <div className="qp-followup-header">
                <span className="qp-followup-label">
                  <MessageSquare size={13} /> Follow-up questions
                </span>
                <div className="qp-followup-actions">
                  {hasFollowup ? (
                    <>
                      <button
                        onClick={() => setShowFollowups((p) => !p)}
                        className="qp-btn-ghost"
                      >
                        {showFollowups ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        {showFollowups ? "Hide" : "Show"} ({(q.followup_md?.match(/###\s+F\d+/g) ?? []).length})
                      </button>
                      <button
                        onClick={() => generateFollowup(true)}
                        disabled={followupLoading}
                        className="qp-btn-ghost"
                      >
                        <RefreshCw size={11} className={followupLoading ? "animate-spin" : ""} />
                        Regenerate
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => generateFollowup(false)}
                      disabled={followupLoading}
                      className="qp-btn-followup"
                    >
                      {followupLoading
                        ? <><Loader2 size={12} className="animate-spin" /> Generating…</>
                        : <><Zap size={12} /> Generate follow-ups</>
                      }
                    </button>
                  )}
                </div>
              </div>
              {followupError && <p className="qp-error-inline">{followupError}</p>}
              {hasFollowup && showFollowups && !followupLoading && (
                <div className="qp-followup-content animate-fade-in prose-qp">
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

// ── Session card (list view) ───────────────────────────────────────────────
function SessionCard({ session, onOpen, onDelete }: {
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
    <div onClick={() => onOpen(session)} className={`qp-session-card qp-session-card--${session.type}`}>
      <div className="qp-session-band" />
      <div className={`qp-session-icon ${isResume ? "qp-session-icon--resume" : "qp-session-icon--jd"}`}>
        {isResume ? <User size={18} /> : <Briefcase size={18} />}
      </div>
      <div className="qp-session-info">
        <p className="qp-session-title">{session.title}</p>
        <p className="qp-session-meta">
          {isResume ? "Resume-based" : "JD-based"} · {count} Q{count !== 1 ? "s" : ""}
        </p>
        <p className="qp-session-date">Updated {formatDate(session.updated_at)}</p>
      </div>
      <div className="qp-session-arrow">→</div>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="qp-session-delete"
        title="Delete"
      >
        {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
      </button>
    </div>
  );
}

// ── New JD Form ────────────────────────────────────────────────────────────
function NewJDForm({ onCreated, onCancel }: { onCreated: (s: Session) => void; onCancel: () => void }) {
  const [jdText, setJdText] = useState("");
  const [jdFileName, setJdFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError(null); setJdFileName(file.name);
    try { setJdText(await extractTextFromFile(file)); }
    catch (err) { setFileError(err instanceof Error ? err.message : "Could not read file."); setJdFileName(null); }
    e.target.value = "";
  }

  async function handleCreate() {
    if (!jdText.trim()) { setError("Please upload a file or paste the job description."); return; }
    setLoading(true); setError(null);
    const { ok, data, error: err } = await api({ action: "init", type: "jd", jdText });
    setLoading(false);
    if (!ok) { setError(err || "Could not create session."); return; }
    onCreated(data.session as Session);
  }

  return (
    <div className="qp-jd-form">
      <div className="qp-jd-form-header">
        <Target size={18} className="qp-jd-form-icon" />
        <div>
          <h3 className="qp-jd-form-title">New JD session</h3>
          <p className="qp-jd-form-sub">Upload or paste the job description — we'll generate targeted questions.</p>
        </div>
        <button onClick={onCancel} className="qp-btn-ghost ml-auto">✕</button>
      </div>

      <div className="qp-jd-upload-row">
        <button onClick={() => fileRef.current?.click()} className="qp-btn-upload">
          <Upload size={14} /> Upload file
        </button>
        <span className="qp-jd-hint">PDF, TXT, or MD · max 3 MB</span>
        {jdFileName && (
          <span className="qp-jd-filename">
            <FileText size={12} /> {jdFileName}
            <button onClick={() => { setJdFileName(null); setJdText(""); }} className="qp-jd-clear">×</button>
          </span>
        )}
        <input ref={fileRef} type="file" accept=".pdf,.md,.txt" className="hidden" onChange={handleFile} />
      </div>

      {fileError && (
        <div className="qp-alert qp-alert--danger">
          <AlertCircle size={13} /> {fileError}
        </div>
      )}

      <div className="qp-jd-textarea-wrap">
        <label className="qp-jd-label">Or paste the job description</label>
        <textarea
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
          rows={6}
          placeholder="Paste the full JD here…"
          className="qp-jd-textarea"
        />
        {jdText && <p className="qp-jd-charcount">{jdText.length.toLocaleString()} chars</p>}
      </div>

      {error && (
        <div className="qp-alert qp-alert--danger">
          <AlertCircle size={13} /> {error}
        </div>
      )}

      <button onClick={handleCreate} disabled={loading || !jdText.trim()} className="qp-btn-primary">
        {loading ? <><Loader2 size={15} className="animate-spin" /> Creating session…</> : <><Sparkles size={15} /> Create JD session</>}
      </button>
    </div>
  );
}

// ── Session progress bar ───────────────────────────────────────────────────
function ProgressBar({ questions }: { questions: Question[] }) {
  const total = questions.length;
  const answered = questions.filter((q) => q.answer_md).length;
  const pct = total === 0 ? 0 : Math.round((answered / total) * 100);
  return (
    <div className="qp-progress-wrap">
      <div className="qp-progress-bar">
        <div className="qp-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="qp-progress-label">{answered}/{total} answered</span>
    </div>
  );
}

// ── Session detail ─────────────────────────────────────────────────────────
function SessionDetail({ session, onBack, onDeleted }: {
  session: Session; onBack: () => void; onDeleted: () => void;
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
    setGenerating(true); setGenError(null);
    const existingQs = questions.map((q) => q.question);
    const { ok, data, error } = await api({ action: "generate", sessionId: session.id, existingQuestions: existingQs });
    if (!ok) { setGenError(error || "Generation failed."); setGenerating(false); return; }
    const newQs = (data.questions as Question[]) ?? [];
    setQuestions((prev) => [...prev, ...newQs]);
    setJustAdded(newQs.length);
    setGenerating(false);
    setTimeout(() => {
      document.getElementById("qp-new-anchor")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  async function handleDeleteSession() {
    if (!confirm(`Delete "${session.title}" and all its questions? Cannot be undone.`)) return;
    await api({ action: "delete_session", sessionId: session.id });
    onDeleted();
  }

  const isResume = session.type === "resume";
  const answeredCount = questions.filter((q) => q.answer_md).length;

  return (
    <div className="animate-fade-in">
      {/* Top nav */}
      <div className="qp-detail-nav">
        <button onClick={onBack} className="qp-back-btn">
          <ArrowLeft size={14} /> All sessions
        </button>
        <button onClick={handleDeleteSession} className="qp-delete-session-btn">
          <Trash2 size={13} /> Delete
        </button>
      </div>

      {/* Session header */}
      <div className={`qp-detail-header qp-detail-header--${session.type}`}>
        <div className={`qp-detail-header-icon ${isResume ? "qp-detail-header-icon--resume" : "qp-detail-header-icon--jd"}`}>
          {isResume ? <User size={24} /> : <Briefcase size={24} />}
        </div>
        <div className="qp-detail-header-text">
          <p className="qp-detail-type-label">{isResume ? "Resume session" : "JD session"}</p>
          <h1 className="qp-detail-title">{session.title}</h1>
          <div className="qp-detail-stats">
            <span>{questions.length} questions</span>
            <span className="qp-stat-dot">·</span>
            <span>{answeredCount} answered</span>
            <span className="qp-stat-dot">·</span>
            <span>Updated {formatDate(session.updated_at)}</span>
          </div>
        </div>
        {questions.length > 0 && (
          <div className="qp-detail-header-progress">
            <ProgressBar questions={questions} />
          </div>
        )}
      </div>

      {/* Questions */}
      {loadingQs ? (
        <div className="qp-skeleton-list">
          {[0, 1, 2].map((i) => (
            <div key={i} className="qp-skeleton-qa">
              <div className="shimmer qp-skeleton-num" />
              <div className="qp-skeleton-text">
                <div className="shimmer" style={{ height: 14, width: "70%", borderRadius: 4 }} />
                <div className="shimmer" style={{ height: 12, width: "45%", borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      ) : questions.length === 0 && !generating ? (
        <div className="qp-empty">
          <BookOpen size={32} className="qp-empty-icon" />
          <p className="qp-empty-title">No questions yet</p>
          <p className="qp-empty-sub">Hit Generate to create the first batch.</p>
        </div>
      ) : (
        <div className="qp-qa-list">
          {questions.map((q, i) => {
            const isFirstNew = justAdded > 0 && i === questions.length - justAdded;
            return (
              <div key={q.id} id={isFirstNew ? "qp-new-anchor" : undefined}>
                {isFirstNew && (
                  <div className="qp-new-divider">
                    <div className="qp-new-divider-line" />
                    <span className="qp-new-divider-label">↓ {justAdded} new questions</span>
                    <div className="qp-new-divider-line" />
                  </div>
                )}
                <QACard q={q} index={i} onDelete={(id) => setQuestions((p) => p.filter((x) => x.id !== id))} />
              </div>
            );
          })}
        </div>
      )}

      {/* Generating skeletons */}
      {generating && (
        <div className="qp-generating">
          <div className="qp-skeleton-list">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="qp-skeleton-qa">
                <div className="shimmer qp-skeleton-num" />
                <div className="qp-skeleton-text">
                  <div className="shimmer" style={{ height: 14, width: `${[70, 80, 60, 75, 65][i]}%`, borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
          <p className="qp-generating-label">
            <Loader2 size={12} className="animate-spin inline mr-1" />
            Generating questions — tap any to get its answer instantly
          </p>
        </div>
      )}

      {genError && (
        <div className="qp-alert qp-alert--danger mt-4">
          <AlertCircle size={14} /> {genError}
          <button onClick={generate} className="ml-auto underline text-xs">Retry</button>
        </div>
      )}

      {/* Generate more CTA */}
      {!loadingQs && (
        <div className="qp-generate-more-wrap">
          <button onClick={generate} disabled={generating} className="qp-generate-more-btn">
            {generating
              ? <><Loader2 size={15} className="animate-spin" /> Generating…</>
              : <><Plus size={15} /> Generate 5 more questions</>
            }
          </button>
          {!generating && questions.length > 0 && (
            <p className="qp-generate-more-hint">
              New questions appended — nothing replaced.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────
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

  function handleJDCreated(session: Session) {
    setSessions((prev) => [session, ...prev]);
    setShowNewJD(false);
    setActiveSession(session);
    setView("session");
  }

  if (view === "session" && activeSession) {
    return (
      <SessionDetail
        session={activeSession}
        onBack={() => { setView("list"); setActiveSession(null); loadSessions(); }}
        onDeleted={() => { setSessions((p) => p.filter((s) => s.id !== activeSession.id)); setView("list"); setActiveSession(null); }}
      />
    );
  }

  const resumeSession = sessions.find((s) => s.type === "resume");
  const jdSessions = sessions.filter((s) => s.type === "jd");

  return (
    <div className="animate-fade-in">
      {/* Page header */}
      <div className="qp-page-header">
        <div className="qp-page-header-text">
          <h1 className="qp-page-title">Quick Prepare</h1>
          <p className="qp-page-sub">
            Tap any question to generate its answer — English + Hinglish, with follow-ups.
          </p>
        </div>
        <div className="qp-page-actions">
          <button onClick={openResume} disabled={creatingResume} className="qp-btn-primary">
            {creatingResume ? <Loader2 size={14} className="animate-spin" /> : <User size={14} />}
            {resumeSession ? "Open Resume" : "Resume session"}
          </button>
          <button
            onClick={() => setShowNewJD((p) => !p)}
            className={`qp-btn-secondary ${showNewJD ? "qp-btn-secondary--active" : ""}`}
          >
            <Plus size={14} /> New JD session
          </button>
        </div>
      </div>

      {/* JD form */}
      {showNewJD && (
        <div className="mb-6">
          <NewJDForm onCreated={handleJDCreated} onCancel={() => setShowNewJD(false)} />
        </div>
      )}

      {/* Sessions list */}
      {loadingSessions ? (
        <div className="qp-skeleton-list">
          {[0, 1].map((i) => (
            <div key={i} className="qp-skeleton-qa" style={{ height: 80 }}>
              <div className="shimmer" style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0 }} />
              <div className="qp-skeleton-text">
                <div className="shimmer" style={{ height: 14, width: "35%", borderRadius: 4 }} />
                <div className="shimmer" style={{ height: 11, width: "22%", borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="qp-empty qp-empty--page">
          <div className="qp-empty-glyph">⚡</div>
          <p className="qp-empty-title">Ready when you are</p>
          <p className="qp-empty-sub">Start your Resume session or upload a JD for your next interview.</p>
          <button onClick={openResume} disabled={creatingResume} className="qp-btn-primary">
            {creatingResume ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            Start Resume session
          </button>
        </div>
      ) : (
        <div className="qp-sessions-list">
          {resumeSession && (
            <div>
              <p className="qp-list-label">Resume</p>
              <SessionCard
                session={resumeSession}
                onOpen={(s) => { setActiveSession(s); setView("session"); }}
                onDelete={(id) => setSessions((p) => p.filter((s) => s.id !== id))}
              />
            </div>
          )}
          {jdSessions.length > 0 && (
            <div>
              <p className="qp-list-label" style={{ marginTop: "1.5rem" }}>JD sessions · {jdSessions.length}</p>
              <div className="qp-sessions-grid">
                {jdSessions.map((s) => (
                  <SessionCard
                    key={s.id}
                    session={s}
                    onOpen={(s) => { setActiveSession(s); setView("session"); }}
                    onDelete={(id) => setSessions((p) => p.filter((x) => x.id !== id))}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* How it works — only when sessions exist */}
      {sessions.length > 0 && !showNewJD && (
        <div className="qp-howto">
          <p className="qp-howto-title">How it works</p>
          <div className="qp-howto-items">
            {[
              ["Tap a question", "Expand any card to generate its answer on demand."],
              ["English + Hinglish", "Switch tabs per question — same depth, different language."],
              ["Follow-ups", "After an answer, generate 5 probing follow-up questions."],
              ["Regenerate freely", "Not happy? Regenerate the answer or follow-ups anytime."],
              ["Generate more", "5 more questions per batch — never repeats existing ones."],
            ].map(([h, b]) => (
              <div key={h} className="qp-howto-item">
                <p className="qp-howto-h">{h}</p>
                <p className="qp-howto-b">{b}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
