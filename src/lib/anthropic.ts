// Deprecated: the app now uses Google Gemini (free). See src/lib/llm.ts.
// Kept as a re-export so any stray import keeps compiling.
export { generateAnswer, MODEL, isConfigured } from "./llm";
export type { GeneratedAnswer, Flashcard } from "./llm";
