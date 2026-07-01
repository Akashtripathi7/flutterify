"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownView({
  children,
  variant = "answer",
}: {
  children: string;
  variant?: "answer" | "question";
}) {
  return (
    <div className={variant === "answer" ? "prose-answer" : "prose-question"}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
