import Link from "next/link";
import { ReactNode } from "react";

export function ProgressBar({
  value,
  total,
  className = "",
  tone = "ink",
}: {
  value: number;
  total: number;
  className?: string;
  tone?: "ink" | "primary";
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const fill = tone === "primary" ? "bg-primary" : "bg-ink";
  return (
    <div className={className}>
      <div className="h-2 w-full overflow-hidden rounded-full bg-black/10">
        <div className={`h-full rounded-full ${fill} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function Ring({
  value,
  total,
  size = 64,
}: {
  value: number;
  total: number;
  size?: number;
}) {
  const pct = total > 0 ? value / total : 0;
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(0 0 0 / 0.08)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgb(var(--primary))"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
      />
    </svg>
  );
}

export function Card({
  children,
  className = "",
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return <div className={`card ${hover ? "card-hover" : ""} ${className}`}>{children}</div>;
}

/** Black pill = active, white outline = inactive (the reference tab style). */
export function Pill({
  href,
  active = false,
  children,
}: {
  href: string;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
        active
          ? "bg-sidebar text-on-dark"
          : "border border-border bg-surface text-ink hover:border-border-strong"
      }`}
    >
      {children}
    </Link>
  );
}

export function Badge({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "primary" | "yellow" | "purple" | "blue" | "dark";
}) {
  const tones: Record<string, string> = {
    muted: "bg-elevated text-muted",
    primary: "bg-primary text-primary-ink",
    yellow: "bg-yellow text-sidebar",
    purple: "bg-purple text-sidebar",
    blue: "bg-blue text-sidebar",
    dark: "bg-sidebar text-on-dark",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-ink">
      <span aria-hidden>←</span> {label}
    </Link>
  );
}
