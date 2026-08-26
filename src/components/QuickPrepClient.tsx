"use client";

import { useRef, useState } from "react";
import {
  FileText,
  Briefcase,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  Upload,
  RotateCcw,
  AlertCircle,
  User,
} from "lucide-react";
import { MarkdownView } from "./MarkdownView";

type Section = "resume" | "jd";
type GenState = "idle" | "loading" | "done" | "error";

interface QABlock {
  question: string;
  body: string; // everything after the Q line (answer + follow-ups)
}

// ---------------------------------------------------------------------------
// Parse the AI markdown into discrete Q&A blocks.
// Each block starts with "## Q{N}:" and continues until the next "## Q" or EOF.
// ---------------------------------------------------------------------------
function parseBlocks(md: string): QABlock[] {
  const lines = md.split("\n");
  const blocks: QABlock[] = [];
  let currentQ = "";
  let currentBody: string[] = [];

  for (const line of lines) {
    const match = /^##\s+Q\d+:\s*(.+)/.exec(line);
    if (match) {
      if (currentQ) blocks.push({ question: currentQ, body: currentBody.join("\n").trim() });
      currentQ = match[1].trim();
      currentBody = [];
    } else if (currentQ) {
      currentBody.push(line);
    }
  }
  if (currentQ) blocks.push({ question: currentQ, body: currentBody.join("\n").trim() });
  return blocks;
}

// ---------------------------------------------------------------------------
// Render a single Q&A card with collapsible follow-ups
// ---------------------------------------------------------------------------
function QACard({ block, index }: { block: QABlock; index: number }) {
  const [open, setOpen] = useState(index === 0); // first card open by default

  // Split the body into the main answer and follow-up sub-sections.
  // Follow-ups start with "### Follow-up questions"
  const followupIdx = block.body.search(/###\s+Follow-up questions/i);
  const mainBody =
    followupIdx === -1 ? block.body : block.body.slice(0, followupIdx).trim();
  const followupBody =
    followupIdx === -1 ? "" : block.body.slice(followupIdx).trim();

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      {/* Question header — always visible */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-elevated"
      >
        <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary text-xs font-extrabold text-white">
          {index + 1}
        </span>
        <span className="flex-1 text-sm font-bold leading-snug text-ink">{block.question}</span>
        <span className="mt-0.5 shrink-0 text-muted">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {/* Expandable body */}
      {open && (
        <div className="border-t border-border">
          {/* Main answer */}
          <div className="px-5 py-5">
            <MarkdownView variant="answer">{mainBody}</MarkdownView>
          </div>

          {/* Follow-ups */}
          {followupBody && (
            <div className="border-t border-border bg-elevated/60 px-5 py-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-purple px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-sidebar">
                  Likely follow-up questions
                </span>
              </div>
              <MarkdownView variant="answer">{followupBody}</MarkdownView>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// File text extractor — handles .md, .txt, .pdf (text layer), .doc fallback
// ---------------------------------------------------------------------------
async function extractText(file: File): Promise<string> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".pdf")) {
    // For PDF: read as ArrayBuffer and extract text using a simple heuristic
    // (reads UTF strings from the PDF binary). Works for text-layer PDFs.
    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let text = "";
    const decoder = new TextDecoder("latin1");
    const raw = decoder.decode(bytes);
    // Extract strings between BT (begin text) and ET (end text) markers
    const btRe = /BT[\s\S]*?ET/g;
    const tjRe = /\(([^)]{3,})\)\s*Tj/g;
    let btMatch;
    while ((btMatch = btRe.exec(raw)) !== null) {
      let tjMatch;
      while ((tjMatch = tjRe.exec(btMatch[0])) !== null) {
        text += tjMatch[1] + " ";
      }
    }
    // Fallback: also grab anything that looks like readable text (printable ASCII runs)
    if (text.trim().length < 100) {
      const asciiRe = /[\x20-\x7E]{10,}/g;
      const matches = raw.match(asciiRe) ?? [];
      text = matches.filter((m) => /[a-zA-Z]{3,}/.test(m)).join(" ");
    }
    return text.replace(/\s+/g, " ").trim().slice(0, 20000);
  }

  // For .md, .txt, .doc (text-encoded), just read as plain text
  return await file.text();
}

// ---------------------------------------------------------------------------
// Section tab component
// ---------------------------------------------------------------------------
function SectionTab({
  active,
  onClick,
  icon,
  label,
  sublabel,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  sublabel: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 flex-col items-start gap-1 rounded-2xl border-2 px-5 py-4 text-left transition-all ${
        active
          ? "border-primary bg-primary/5 shadow-[0_0_0_4px_rgb(var(--primary)/0.08)]"
          : "border-border bg-surface hover:border-border-strong hover:bg-elevated"
      }`}
    >
      <span
        className={`flex items-center gap-2 text-sm font-extrabold ${
          active ? "text-primary" : "text-ink"
        }`}
      >
        {icon}
        {label}
      </span>
      <span className="text-xs text-muted">{sublabel}</span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main client component
// ---------------------------------------------------------------------------
export function QuickPrepClient() {
  const [section, setSection] = useState<Section>("resume");
  const [questionCount, setQuestionCount] = useState(10);
  const [jdText, setJdText] = useState("");
  const [jdFileName, setJdFileName] = useState<string | null>(null);
  const [genState, setGenState] = useState<GenState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<QABlock[]>([]);
  const [lastType, setLastType] = useState<Section | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setJdFileName(file.name);
    try {
      const text = await extractText(file);
      setJdText(text);
    } catch {
      setError("Could not read the file. Try pasting the JD text directly below.");
    }
    // reset input so same file can be re-selected
    e.target.value = "";
  }

  async function generate() {
    if (section === "jd" && !jdText.trim()) {
      setError("Please upload a JD or paste the job description text.");
      return;
    }
    setGenState("loading");
    setError(null);
    setBlocks([]);

    try {
      const res = await fetch("/api/quick-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: section,
          jdText: section === "jd" ? jdText : undefined,
          questionCount,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not generate. Try again.");
        setGenState("error");
        return;
      }
      const parsed = parseBlocks(data.markdown);
      if (parsed.length === 0) {
        setError("AI returned an unexpected format. Try regenerating.");
        setGenState("error");
        return;
      }
      setBlocks(parsed);
      setLastType(section);
      setGenState("done");
    } catch {
      setError("Network error. Please try again.");
      setGenState("error");
    }
  }

  function reset() {
    setGenState("idle");
    setBlocks([]);
    setError(null);
  }

  const loading = genState === "loading";

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Quick Prepare</h1>
        <p className="mt-1 text-sm text-muted">
          Interview Q&amp;A with model answers and follow-up questions — tailored to your resume or a specific JD.
        </p>
      </div>

      {/* Section selector */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <SectionTab
          active={section === "resume"}
          onClick={() => { setSection("resume"); reset(); }}
          icon={<User size={15} />}
          label="Resume-based"
          sublabel="Questions based on your experience and projects"
        />
        <SectionTab
          active={section === "jd"}
          onClick={() => { setSection("jd"); reset(); }}
          icon={<Briefcase size={15} />}
          label="JD-based"
          sublabel="Questions tailored to a specific job description"
        />
      </div>

      {/* Config card */}
      {genState !== "done" && (
        <div className="mb-6 card p-5 sm:p-6">
          {/* Resume section — show resume summary */}
          {section === "resume" && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-border bg-elevated px-4 py-3">
              <FileText size={18} className="mt-0.5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-bold text-ink">Akash_Tripathi_Resume.pdf</p>
                <p className="mt-0.5 text-xs text-muted">
                  Your resume is pre-loaded. Questions will be drawn from your projects, metrics, and decisions.
                </p>
              </div>
            </div>
          )}

          {/* JD section — upload or paste */}
          {section === "jd" && (
            <div className="mb-5 space-y-3">
              <label className="block text-sm font-extrabold text-ink">
                Job Description
              </label>

              {/* Upload button */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-elevated px-4 py-2.5 text-sm font-bold text-ink transition-colors hover:border-border-strong hover:bg-surface"
                >
                  <Upload size={15} /> Upload file
                </button>
                <span className="text-xs text-muted">PDF, DOC, MD, or TXT</span>
                {jdFileName && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-bold text-success">
                    <FileText size={12} /> {jdFileName}
                  </span>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.md,.txt"
                  className="hidden"
                  onChange={handleFile}
                />
              </div>

              {/* Paste area */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-muted">
                  Or paste the JD text directly
                </label>
                <textarea
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  rows={8}
                  placeholder="Paste the full job description here…"
                  className="w-full resize-y rounded-xl border border-border bg-elevated px-4 py-3 text-sm leading-relaxed text-ink outline-none transition-colors focus:border-primary placeholder:text-muted"
                />
              </div>
            </div>
          )}

          {/* Question count */}
          <div className="mb-5">
            <label className="mb-2 block text-sm font-extrabold text-ink">
              Number of questions
            </label>
            <div className="flex flex-wrap gap-2">
              {[5, 8, 10, 15, 20].map((n) => (
                <button
                  key={n}
                  onClick={() => setQuestionCount(n)}
                  className={`rounded-full border px-4 py-1.5 text-sm font-bold transition-colors ${
                    questionCount === n
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-surface text-ink hover:border-border-strong"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-muted">
              Each question includes a model answer + 3–5 follow-up Q&As. More questions = longer generation time.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-danger/40 bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {/* Generate button */}
          <button
            onClick={generate}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-[#ff8a5c] py-4 text-sm font-bold text-white shadow-[0_12px_30px_-12px_rgb(244_96_58_/_0.6)] transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Generating {questionCount} questions with answers…
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Generate {questionCount} interview Q&amp;As
                {section === "resume" ? " from Resume" : " from JD"}
              </>
            )}
          </button>

          {loading && (
            <p className="mt-3 text-center text-xs text-muted">
              This takes 20–60 seconds. We&apos;re generating complete answers and follow-ups for every question.
            </p>
          )}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
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
      )}

      {/* Results */}
      {genState === "done" && blocks.length > 0 && (
        <>
          {/* Results header */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold">
                {blocks.length} questions — {lastType === "resume" ? "Resume-based" : "JD-based"}
              </h2>
              <p className="mt-0.5 text-xs text-muted">
                Each card has a model answer + follow-up Q&As. Tap to expand.
              </p>
            </div>
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-bold text-ink transition-colors hover:border-border-strong"
            >
              <RotateCcw size={14} /> New session
            </button>
          </div>

          {/* Legend */}
          <div className="mb-4 flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <Sparkles size={11} /> Model answer
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple/30 px-3 py-1 text-xs font-bold text-sidebar">
              Likely follow-up questions
            </span>
          </div>

          {/* Q&A cards */}
          <div className="space-y-3">
            {blocks.map((block, i) => (
              <QACard key={i} block={block} index={i} />
            ))}
          </div>

          {/* Regenerate */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => { reset(); setTimeout(generate, 50); }}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-6 py-3 text-sm font-bold text-ink transition-colors hover:border-border-strong disabled:opacity-50"
            >
              <RotateCcw size={14} /> Regenerate with different questions
            </button>
          </div>
        </>
      )}
    </div>
  );
}
