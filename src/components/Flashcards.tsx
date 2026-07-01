"use client";

import { useState } from "react";
import { Layers, RefreshCw } from "lucide-react";

export interface Flashcard {
  front: string;
  back: string;
}

// Cycling colourful front faces.
const FACES = [
  "bg-yellow text-sidebar",
  "bg-purple text-sidebar",
  "bg-blue text-sidebar",
  "bg-[#A8E6CF] text-sidebar",
  "bg-[#FBC4AB] text-sidebar",
  "bg-[#F8B5D8] text-sidebar",
];

export function Flashcards({ cards }: { cards: Flashcard[] }) {
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  if (!cards || cards.length === 0) return null;

  const toggle = (i: number) =>
    setFlipped((s) => {
      const n = new Set(s);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });

  return (
    <div className="mt-7">
      <div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-ink">
        <span className="grid h-6 w-6 place-items-center rounded-md bg-primary text-primary-ink">
          <Layers size={13} />
        </span>
        Flashcards
        <span className="text-xs font-semibold text-muted">· tap to flip</span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {cards.map((c, i) => {
          const isFlipped = flipped.has(i);
          const face = FACES[i % FACES.length];
          return (
            <button
              key={c.front + i}
              onClick={() => toggle(i)}
              className="group h-36 [perspective:1200px]"
              aria-label="Flip flashcard"
            >
              <div
                className={`relative h-full w-full rounded-2xl transition-transform duration-500 [transform-style:preserve-3d] ${
                  isFlipped ? "[transform:rotateY(180deg)]" : ""
                }`}
              >
                {/* Front */}
                <div
                  className={`absolute inset-0 flex flex-col rounded-2xl p-4 text-left [backface-visibility:hidden] ${face}`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="rounded-full bg-sidebar/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                      Q{i + 1}
                    </span>
                    <RefreshCw size={13} className="opacity-50 transition-opacity group-hover:opacity-100" />
                  </div>
                  <p className="text-sm font-extrabold leading-snug">{c.front}</p>
                </div>

                {/* Back */}
                <div className="absolute inset-0 flex flex-col rounded-2xl border border-border-strong bg-sidebar p-4 text-left text-on-dark [backface-visibility:hidden] [transform:rotateY(180deg)]">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-ink">
                      Answer
                    </span>
                    <RefreshCw size={13} className="opacity-50" />
                  </div>
                  <p className="overflow-y-auto text-sm font-semibold leading-snug text-on-dark">
                    {c.back}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
