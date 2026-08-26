"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  FileText, Briefcase, Sparkles, Loader2, ChevronDown, ChevronUp,
  Upload, RotateCcw, AlertCircle, User, Trash2, Plus, ArrowLeft,
  BookOpen,
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
  answer_md: string;
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

// ── PDF text extraction (client-side, text-layer PDFs only) ──────────────
async function extractTextFromFile(file: File): Promise<string> {
  if (file.size > 3 * 1024 * 1024) throw new Error("File is too large (max 3 MB). Please paste the text directly.");

  const name = file.name.toLowerCase();
  if (name.endsWith(".docx") || name.endsWith(".doc")) {
    throw new Error(".doc/.docx files cannot be read directly. Please copy-paste the JD text below.");
  }

  if (name.endsWith(".pdf")) {
    const buf = await file.arrayBuffer();
    const decoder = new TextDecoder("latin1");
    const raw = decoder.decode(new Uint8Array(buf));

    // Try BT/ET text operator extraction (uncompressed streams)
    let text = "";
    const btRe = /BT([\s\S]*?)ET/g;
    const tjRe = /\(([^)]{2,})\)\s*Tj/g;
    let btM;
    while ((btM = btRe.exec(raw)) !== null) {
      let tjM;
      while ((tjM = tjRe.exec(btM[1])) !== null) text += tjM[1] + " ";
    }
    // Also try TJ array form: [(text) -100 (more) ...] TJ
    const tjArrRe = /\[([^\]]+)\]\s*TJ/g;
    const strRe = /\(([^)]{2,})\)/g;
    let arrM;
    while ((arrM = tjArrRe.exec(raw)) !== null) {
      let strM;
      while ((strM = strRe.exec(arrM[1])) !== null) text += strM[1] + " ";
    }

    if (text.trim().length < 80) {
      // Compressed PDF — fall back to long printable ASCII runs
      const runs = raw.match(/[\x20-\x7E]{15,}/g) ?? [];
      text = runs.filter((r) => /[a-zA-Z]{4,}/.test(r) && !/^[\d\s.]+$/.test(r)).join(" ");
    }

    const cleaned = text.replace(/\s+/g, " ").trim().slice(0, 25000);
    if (cleaned.length < 50) {
      throw new Error(
        "This PDF uses compressed/encoded streams and cannot be read in the browser. " +
        "Please paste the JD text directly into the text area below."
      );
    }
    return cleaned;
  }

  // .md / .txt — read as plain text
  return (await file.text()).slice(0, 25000);
}

// ── QACard ─────────────────────────────────────────────────────────────────
function QACard({
  q, index, onDelete,
}: {
  q: Question; index: number; onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(index === 0);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Remove this question?")) return;
    setDeleting(true);
    await api({ action: "delete_q", questionId: q.id });
    onDelete(q.id);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      {/* Header row */}
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
        <button
          onClick={handleDelete}
          disabled={deleting}
          title="Remove this question"
          className="ml-1 mt-0.5 shrink-0 rounded-lg p-1.5 text-faint transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-40"
        >
          {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
        </button>
      </div>

      {/* Body */}
      {open && (
        <div className="border-t border-border">
          <div className="px-5 py-5">
            <MarkdownView variant="answer">{q.answer_md}</MarkdownView>
          </div>
          {q.followup_md && (
            <div className="border-t border-border bg-elevated/60 px-5 py-5">
              <div className="mb-3 inline-flex items-center rounded-full bg-purple px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-sidebar">
                Likely follow-up questions
              </div>
              <MarkdownView variant="answer">{q.followup_md}</MarkdownView>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── SessionCard (on the sessions list) ─────────────────────────────────────
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
      <div
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
          isResume ? "bg-yellow" : "bg-blue"
        }`}
      >
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

  function clearFile() {
    setJdFileName(null);
    setJdText("");
    setFileError(null);
  }

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
          {jdText && (
            <p className="mt-1 text-right text-[11px] text-muted">{jdText.length.toLocaleString()} chars</p>
          )}
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

// ── Session detail view ────────────────────────────────────────────────────
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

  // Auto-generate first batch if session has no questions yet
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
    if (!ok) {
      setGenError(error || "Generation failed.");
      setGenerating(false);
      return;
    }
    const newQs = (data.questions as Question[]) ?? [];
    setQuestions((prev) => [...prev, ...newQs]);
    setJustAdded(newQs.length);
    setGenerating(false);
    // Scroll to newly added questions after a tick
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
      {/* Back nav */}
      <button
        onClick={onBack}
        className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-sm font-bold text-muted transition-colors hover:border-border-strong hover:text-ink"
      >
        <ArrowLeft size={14} /> All sessions
      </button>

      {/* Session header */}
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
            // Anchor for smooth-scroll to newly added questions
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

      {/* Generating skeleton */}
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
            Generating 5 deep questions with model answers + follow-ups…
          </p>
        </div>
      )}

      {/* Error */}
      {genError && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-danger/40 bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">
          <AlertCircle size={15} className="mt-0.5 shrink-0" /> {genError}
          <button onClick={generate} className="ml-auto underline">Retry</button>
        </div>
      )}

      {/* Generate more */}
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
              New questions are added below existing ones — nothing is replaced.
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
    setSessions((prev) => {
      const exists = prev.find((s) => s.id === session.id);
      return exists ? prev : [session, ...prev];
    });
    setActiveSession(session);
    setView("session");
  }

  function openSession(s: Session) {
    setActiveSession(s);
    setView("session");
  }

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

  function handleDeleteFromList(id: string) {
    setSessions((prev) => prev.filter((s) => s.id !== id));
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

  // ── Sessions list ──────────────────────────────────────────────────────
  const resumeSession = sessions.find((s) => s.type === "resume");
  const jdSessions = sessions.filter((s) => s.type === "jd");

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Quick Prepare</h1>
        <p className="mt-1 text-sm text-muted">
          Tailored interview Q&amp;A with model answers and follow-ups — saved by session.
        </p>
      </div>

      {/* Action buttons */}
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

      {/* New JD form */}
      {showNewJD && (
        <div className="mb-6">
          <NewJDForm onCreated={handleJDCreated} />
        </div>
      )}

      {/* Sessions */}
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
          <p className="text-xs text-muted">
            Start a Resume session or create a JD session for your next interview.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Resume session always first if it exists */}
          {resumeSession && (
            <div>
              <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-muted">Resume</p>
              <SessionCard
                session={resumeSession}
                onOpen={openSession}
                onDelete={handleDeleteFromList}
              />
            </div>
          )}
          {jdSessions.length > 0 && (
            <div>
              <p className="mb-2 mt-4 text-xs font-extrabold uppercase tracking-wide text-muted">
                JD sessions ({jdSessions.length})
              </p>
              <div className="space-y-3">
                {jdSessions.map((s) => (
                  <SessionCard key={s.id} session={s} onOpen={openSession} onDelete={handleDeleteFromList} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tips */}
      {sessions.length > 0 && (
        <div className="mt-8 rounded-2xl border border-border bg-elevated/60 px-5 py-4">
          <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-muted">How it works</p>
          <ul className="space-y-1.5 text-xs text-muted">
            <li>· Each session generates 5 deep questions with model answers + follow-ups.</li>
            <li>· Hit <strong className="text-ink">Generate 5 more</strong> inside a session — new questions never repeat old ones.</li>
            <li>· Delete any question you already know well to keep the list focused.</li>
            <li>· JD sessions are stored permanently — open them the morning of your interview.</li>
          </ul>
        </div>
      )}
    </div>
  );
}
