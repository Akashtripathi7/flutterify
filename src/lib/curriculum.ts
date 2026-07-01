import data from "@/data/curriculum.json";

export type Mode = "full" | "guided";
export type SectionKey = "theory" | "logic" | "system";

export interface Question {
  id: string;
  number: number;
  label: string | null;
  title: string;
  markdown: string;
}

export interface Section {
  key: SectionKey;
  title: string;
  mode: Mode;
  topics?: string[];
  questions: Question[];
}

export interface Day {
  id: string;
  number: number;
  theme: string;
  phase: string | null;
  sections: Section[];
}

export interface Drill {
  id: string;
  number: number;
  title: string;
  phase: string | null;
  mode: Mode;
  questions: Question[];
}

const curriculum = data as { days: Day[]; drills: Drill[] };

export const days: Day[] = curriculum.days;
export const drills: Drill[] = curriculum.drills;

export const SECTION_META: Record<SectionKey, { icon: string; tone: string; blurb: string }> = {
  theory: { icon: "📘", tone: "primary", blurb: "Understand it in plain English" },
  logic: { icon: "💻", tone: "warn", blurb: "Build the logic yourself — submit code to complete" },
  system: { icon: "🏗", tone: "success", blurb: "Design & architect like a senior" },
};

export function getDay(dayId: string): Day | undefined {
  return days.find((d) => d.id === dayId);
}

export function getDrill(drillId: string): Drill | undefined {
  return drills.find((d) => d.id === drillId);
}

export function dayQuestionIds(day: Day): string[] {
  return day.sections.flatMap((s) => s.questions.map((q) => q.id));
}

export function totalPlanQuestions(): number {
  return days.reduce((s, d) => s + dayQuestionIds(d).length, 0);
}

// Flat, ordered list of plan questions for prev/next navigation.
const planFlat: { id: string; dayId: string }[] = [];
for (const d of days) for (const id of dayQuestionIds(d)) planFlat.push({ id, dayId: d.id });

export interface QuestionLocation {
  question: Question;
  mode: Mode;
  sectionTitle: string;
  sectionKey: SectionKey | null;
  container: { kind: "day"; day: Day } | { kind: "drill"; drill: Drill };
  prevId: string | null;
  nextId: string | null;
}

export function getQuestion(id: string): QuestionLocation | undefined {
  for (const day of days) {
    for (const section of day.sections) {
      const q = section.questions.find((x) => x.id === id);
      if (q) {
        const idx = planFlat.findIndex((p) => p.id === id);
        return {
          question: q,
          mode: section.mode,
          sectionTitle: section.title,
          sectionKey: section.key,
          container: { kind: "day", day },
          prevId: idx > 0 ? planFlat[idx - 1].id : null,
          nextId: idx >= 0 && idx < planFlat.length - 1 ? planFlat[idx + 1].id : null,
        };
      }
    }
  }
  for (const drill of drills) {
    const i = drill.questions.findIndex((x) => x.id === id);
    if (i >= 0) {
      return {
        question: drill.questions[i],
        mode: drill.mode,
        sectionTitle: drill.title,
        sectionKey: null,
        container: { kind: "drill", drill },
        prevId: i > 0 ? drill.questions[i - 1].id : null,
        nextId: i < drill.questions.length - 1 ? drill.questions[i + 1].id : null,
      };
    }
  }
  return undefined;
}

// Group drills by their bank (phase) for the practice page.
export function drillsByBank(): { bank: string; drills: Drill[] }[] {
  const out: { bank: string; drills: Drill[] }[] = [];
  for (const d of drills) {
    const bank = d.phase || "Drills";
    let g = out.find((x) => x.bank === bank);
    if (!g) {
      g = { bank, drills: [] };
      out.push(g);
    }
    g.drills.push(d);
  }
  return out;
}
