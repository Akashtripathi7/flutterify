// Parses the roadmap + question-bank + solution-architect markdown into one
// structured curriculum JSON.  Run:  npm run parse
//
// The source markdown now lives inside the repo at content/curriculum/ so the
// build is reproducible after cloning. Override the folder with
// CURRICULUM_SRC=/path/to/folder if you keep the sources elsewhere.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = process.env.CURRICULUM_SRC || join(__dirname, "..", "content", "curriculum");
const OUT = join(__dirname, "..", "src", "data", "curriculum.json");

const FENCE_RE = /^```/;
// Numbered list item: "1. text", "1. [ ] text", or a bare "1." before a code
// block. The "(?:\s+...)?" guard avoids matching decimals like "3.14".
const ITEM_RE = /^(\d+)\.(?:\s+(.*))?$/;

function cleanTitle(raw) {
  return raw
    .replace(/^\[\s?[xX ]?\]\s*/, "")
    .replace(/[*`_]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Given the raw lines of one numbered item, produce a human title.
function titleFromLines(lines, fallback) {
  let title = "";
  let firstCode = "";
  for (const l of lines) {
    const raw = l.trim();
    if (raw.startsWith("```") || raw === "") continue;
    const t = cleanTitle(l.replace(/^\d+\.\s*/, ""));
    if (!t) continue;
    if (!firstCode && /[;{}()]/.test(t) && !/[a-z] [a-z]/i.test(t)) {
      firstCode = t;
      continue;
    }
    title = t;
    break;
  }
  if (!title) title = firstCode || fallback;
  if (title.length > 120) title = title.slice(0, 117) + "…";
  return title;
}

// ---- shared track builder -------------------------------------------------

function newTrack(meta) {
  return { id: meta.id, title: meta.title, subtitle: meta.subtitle, category: meta.category, days: [], _cur: null };
}

function pushQuestion(track, phase, dayTitle, q) {
  let day = track._cur;
  if (!day || day._phase !== phase || day._title !== dayTitle) {
    const n = track.days.length + 1;
    day = {
      id: `${track.id}-d${n}`,
      number: n,
      title: dayTitle,
      phase: phase || null,
      intro: "",
      questions: [],
      _phase: phase,
      _title: dayTitle,
    };
    track.days.push(day);
    track._cur = day;
  }
  const i = day.questions.length + 1;
  day.questions.push({
    id: `${day.id}-q${i}`,
    number: i,
    label: q.label || null,
    title: q.title,
    markdown: q.markdown,
  });
}

function finalize(track) {
  delete track._cur;
  for (const d of track.days) {
    delete d._phase;
    delete d._title;
  }
  return track;
}

// ---- Parser A: day-by-day roadmaps (Track 1 & 2) --------------------------

const DAY_RE = /^###\s+Day\s+(\d+)\s*[—\-:]\s*(.+?)\s*$/;
const PHASE_RE = /^##\s+(PHASE\b.*?)\s*$/i;
const SECTION_RE = /^\*\*([^*]+?)\*\*/;

function parseDayBody(lines, trackId, dayNumber) {
  const questions = [];
  const intro = [];
  let section = null;
  let inFence = false;
  let current = null;
  let seenItem = false;

  const flush = () => {
    if (!current) return;
    const md = current.lines.join("\n").trim();
    const title = titleFromLines(current.lines, current.section ? `${current.section} — exercise` : "Exercise");
    questions.push({
      id: `${trackId}-d${dayNumber}-q${questions.length + 1}`,
      number: questions.length + 1,
      label: current.section || null,
      title,
      markdown: md,
    });
    current = null;
  };

  for (const line of lines) {
    if (FENCE_RE.test(line)) {
      inFence = !inFence;
      if (current) current.lines.push(line);
      else intro.push(line);
      continue;
    }
    if (!inFence) {
      const sec = line.match(SECTION_RE);
      if (sec && !ITEM_RE.test(line)) {
        flush();
        section = cleanTitle(sec[1]);
        continue;
      }
      const item = line.match(ITEM_RE);
      if (item) {
        flush();
        seenItem = true;
        current = { number: Number(item[1]), section, lines: [line] };
        continue;
      }
    }
    if (current) current.lines.push(line);
    else if (!seenItem) intro.push(line);
  }
  flush();
  return { questions, intro: intro.join("\n").trim() };
}

function parseRoadmap(meta) {
  const lines = readFileSync(join(SRC, meta.file), "utf8").split("\n");
  const days = [];
  let phase = null;
  let i = 0;
  while (i < lines.length) {
    const phaseMatch = lines[i].match(PHASE_RE);
    if (phaseMatch) {
      phase = phaseMatch[1].trim();
      i++;
      continue;
    }
    const dayMatch = lines[i].match(DAY_RE);
    if (dayMatch) {
      const number = Number(dayMatch[1]);
      const title = `Day ${number} — ${dayMatch[2].trim()}`;
      const body = [];
      i++;
      while (i < lines.length && !DAY_RE.test(lines[i]) && !PHASE_RE.test(lines[i])) {
        body.push(lines[i]);
        i++;
      }
      const { questions, intro } = parseDayBody(body, meta.id, number);
      days.push({ id: `${meta.id}-d${number}`, number, title, phase, intro, questions });
      continue;
    }
    i++;
  }
  return { id: meta.id, title: meta.title, subtitle: meta.subtitle, category: meta.category, days };
}

// ---- Parser B: Question Banks ---------------------------------------------

function parseQuestionBanks(meta) {
  const lines = readFileSync(join(SRC, meta.file), "utf8").split("\n");
  const track = newTrack(meta);
  let bank = null;
  let group = null;
  let inFence = false;
  let cur = null;

  const flush = () => {
    if (!cur) return;
    const md = cur.lines.join("\n").trim();
    const title = titleFromLines(cur.lines, "Exercise");
    pushQuestion(track, bank, group || bank || "Questions", { title, markdown: md, label: group });
    cur = null;
  };

  for (const line of lines) {
    if (FENCE_RE.test(line)) {
      inFence = !inFence;
      if (cur) cur.lines.push(line);
      continue;
    }
    if (!inFence) {
      const heading = line.match(/^(#{1,3})\s+(.*)$/);
      if (heading) {
        const text = heading[2].trim();
        if (/^BANK\s+\d+/i.test(text)) {
          flush();
          bank = text.replace(/\s+/g, " ");
          group = null;
          continue;
        }
        if (heading[1].length >= 2 && !/QUESTION BANKS/i.test(text)) {
          flush();
          group = text;
          continue;
        }
        // umbrella headings ("# QUESTION BANKS", "# INTERVIEW QUESTION BANKS")
        flush();
        continue;
      }
      const bold = line.match(/^\*\*([^*]+?)\*\*\s*$/);
      if (bold) {
        flush();
        group = cleanTitle(bold[1]);
        continue;
      }
      const item = line.match(ITEM_RE);
      if (item) {
        flush();
        cur = { lines: [line] };
        continue;
      }
    }
    if (cur) cur.lines.push(line);
  }
  flush();
  return finalize(track);
}

// ---- Parser C: Solution Architect -----------------------------------------

function parseSolutionArchitect(meta) {
  const lines = readFileSync(join(SRC, meta.file), "utf8").split("\n");
  const track = newTrack(meta);
  let phase = null;
  let day = null;
  let inFence = false;

  for (const line of lines) {
    if (FENCE_RE.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const q = line.match(/^###\s+Q:\s*(.*)$/);
    if (q) {
      const text = q[1].trim();
      const title = cleanTitle(text);
      pushQuestion(track, phase || "Solutions Architect", day || phase || "General", {
        title: title.length > 120 ? title.slice(0, 117) + "…" : title,
        markdown: `**Q:** ${text}`,
      });
      continue;
    }
    const h2 = line.match(/^##\s+(.*)$/);
    if (h2) {
      day = h2[1].trim();
      continue;
    }
    const h1 = line.match(/^#\s+(.*)$/);
    if (h1) {
      const t = h1[1].trim();
      if (/^Solutions Architect/i.test(t)) continue; // skip doc title
      phase = t;
      day = null;
      continue;
    }
  }
  return finalize(track);
}

// ---- config ---------------------------------------------------------------

const SPECS = [
  {
    parse: parseRoadmap,
    file: "Track1_Coding_Logic_45Days.md",
    id: "track1",
    title: "Track 1 — Coding Logic & Data Manipulation",
    subtitle: "45 days · think like a programmer, build strong logic",
    category: "Coding Logic",
  },
  {
    parse: parseRoadmap,
    file: "Track2_Dart_Flutter_DeepDive_78Days.md",
    id: "track2",
    title: "Track 2 — Dart + Flutter Deep Dive",
    subtitle: "78 days · Dart, Flutter internals, Web, payments, system design, domain scenarios",
    category: "Dart & Flutter",
  },
  {
    parse: parseSolutionArchitect,
    file: "Solution Architect.md",
    id: "soln",
    title: "Track 3 — Solutions Architect (Mobile)",
    subtitle: "Interview Q&A · Flutter, Android, iOS, React Native, architecture, payments, system design",
    category: "Architecture",
  },
  {
    parse: parseQuestionBanks,
    file: "Question_Banks.md",
    id: "banks",
    title: "Track 4 — Question Banks",
    subtitle: "Drills by difficulty · loops, data, debugging, output prediction, business + 10 interview banks",
    category: "Question Bank",
  },
];

const tracks = [];
for (const spec of SPECS) {
  const path = join(SRC, spec.file);
  if (!existsSync(path)) {
    console.warn(`! Missing source: ${path} — skipping ${spec.id}`);
    continue;
  }
  tracks.push(spec.parse(spec));
}

// ---- blend the tracks into a day-wise plan -------------------------------
// Each day mixes three sections, all pedagogically ordered so difficulty rises
// together. Question IDs are reused verbatim, so existing progress + cached
// answers carry over.

const byId = Object.fromEntries(tracks.map((t) => [t.id, t]));
const flat = (track) => (track ? track.days.flatMap((d) => d.questions) : []);

function chunkEven(arr, n) {
  const out = Array.from({ length: n }, () => []);
  if (arr.length === 0) return out;
  const base = Math.floor(arr.length / n);
  let extra = arr.length % n;
  let i = 0;
  for (let b = 0; b < n; b++) {
    const size = base + (extra > 0 ? 1 : 0);
    if (extra > 0) extra--;
    out[b] = arr.slice(i, i + size);
    i += size;
  }
  return out;
}

const theorySpine = byId.track2?.days ?? [];
const D = theorySpine.length || 60;
const logicBuckets = chunkEven(flat(byId.track1), D);
const archBuckets = chunkEven(flat(byId.soln), D);

const stripDay = (title) => title.replace(/^Day\s+\d+\s*[—\-:]\s*/, "").trim();

// Turn a section's questions into a few short, readable topic phrases for the
// dashboard card preview. Skips code-snippet-like titles, trims to the first
// clause, and de-duplicates.
function sectionTopics(questions, max = 3) {
  const out = [];
  const seen = new Set();
  for (const q of questions) {
    let t = (q.title || "").trim();
    // Drop things that look like raw code rather than a topic.
    if (/[;{}]|=>|\bvar \w+ =|\bfor \(|\bprint\(/.test(t)) continue;
    // Take the first sentence/clause; strip leading list numbers and quotes.
    t = t
      .replace(/^[0-9]+\.\s*/, "")
      .replace(/^["'`]+/, "")
      .split(/[?.]/)[0]
      .split(/\s+[—-]\s+/)[0]
      .replace(/\s+/g, " ")
      .trim();
    if (t.length < 4 || t.length > 60) {
      if (t.length > 60) t = t.slice(0, 57) + "…";
      else continue;
    }
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
    if (out.length >= max) break;
  }
  return out;
}

const days = [];
for (let i = 0; i < D; i++) {
  const theoryDay = theorySpine[i];
  const sections = [];
  if (theoryDay && theoryDay.questions.length) {
    sections.push({
      key: "theory",
      title: "Theory — Dart & Flutter",
      mode: "full",
      topics: sectionTopics(theoryDay.questions),
      questions: theoryDay.questions,
    });
  }
  if (logicBuckets[i]?.length) {
    sections.push({
      key: "logic",
      title: "Logic Building",
      mode: "guided",
      topics: sectionTopics(logicBuckets[i]),
      questions: logicBuckets[i],
    });
  }
  if (archBuckets[i]?.length) {
    sections.push({
      key: "system",
      title: "System & Architecture",
      mode: "full",
      topics: sectionTopics(archBuckets[i]),
      questions: archBuckets[i],
    });
  }
  days.push({
    id: `day-${i + 1}`,
    number: i + 1,
    theme: theoryDay ? stripDay(theoryDay.title) : `Day ${i + 1}`,
    phase: theoryDay?.phase ?? null,
    sections,
  });
}

// Question Banks stay available as optional practice drills (not forced into days).
const drills = (byId.banks?.days ?? []).map((d) => ({
  id: d.id,
  number: d.number,
  title: d.title,
  phase: d.phase,
  mode: /BANK [1-5]\b/.test(d.phase ?? "") ? "guided" : "full",
  questions: d.questions,
}));

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({ days, drills }, null, 2));

const dayQ = days.reduce((s, d) => s + d.sections.reduce((a, sec) => a + sec.questions.length, 0), 0);
const drillQ = drills.reduce((s, d) => s + d.questions.length, 0);
console.log(`✓ Wrote ${OUT}`);
console.log(`  Plan: ${days.length} blended days · ${dayQ} questions`);
console.log(`  Drills: ${drills.length} bank sections · ${drillQ} questions`);
console.log(`  Total questions: ${dayQ + drillQ}`);
