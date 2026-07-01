import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { drills, totalPlanQuestions } from "@/lib/curriculum";
import { AppShell } from "@/components/AppShell";
import { TopHeader } from "@/components/TopHeader";
import { Card, ProgressBar, BackLink } from "@/components/ui";
import { ClearDataButton } from "@/components/ClearDataButton";

export const dynamic = "force-dynamic";

const DAILY_LIMIT = Number(process.env.DAILY_TOKEN_LIMIT || 200000);
const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = new Date().toISOString().slice(0, 10);
  const [{ data: usageRow }, { count: doneCount }] = await Promise.all([
    supabase
      .from("token_usage")
      .select("tokens_used")
      .eq("user_id", user.id)
      .eq("usage_date", today)
      .maybeSingle(),
    supabase.from("progress").select("*", { count: "exact", head: true }).eq("status", "done"),
  ]);

  const tokensUsed = usageRow?.tokens_used ?? 0;
  const grandTotal = totalPlanQuestions() + drills.reduce((s, d) => s + d.questions.length, 0);

  return (
    <AppShell>
      <TopHeader
        email={user.email}
        name={(user.user_metadata?.full_name as string) ?? (user.user_metadata?.name as string) ?? null}
        lead={<BackLink href="/dashboard" label="My learnings" />}
      />

      <div className="mx-auto max-w-2xl">
        <h1 className="mb-5 text-3xl font-extrabold tracking-tight">Settings</h1>

        <Card className="mb-4 p-6">
          <h2 className="mb-1 text-sm font-extrabold">Account</h2>
          <Row label="Email" value={user.email ?? "—"} />
          <Row label="Questions completed" value={`${doneCount ?? 0} / ${grandTotal}`} />
        </Card>

        <Card className="mb-4 p-6">
          <h2 className="mb-3 text-sm font-extrabold">AI mentor</h2>
          <Row label="Model" value={MODEL} />
          <Row label="Daily token cap" value={DAILY_LIMIT.toLocaleString()} />
          <div className="pt-3">
            <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-muted">
              <span>Used today</span>
              <span>
                {tokensUsed.toLocaleString()} / {DAILY_LIMIT.toLocaleString()}
              </span>
            </div>
            <ProgressBar value={tokensUsed} total={DAILY_LIMIT} tone="primary" />
          </div>
          <p className="mt-3 text-xs text-muted">
            Answers are generated once and cached, so opening the same question again costs zero
            tokens. The cap resets at midnight (UTC).
          </p>
        </Card>

        <Card className="mb-4 p-6">
          <h2 className="mb-2 text-sm font-extrabold">How this works</h2>
          <ul className="space-y-2 text-sm text-muted">
            <li>
              • <strong className="text-ink">Theory &amp; system design:</strong> read the question,
              predict the answer, then open the explanation and mark it done.
            </li>
            <li>
              • <strong className="text-ink">Logic building is code-gated:</strong> the mentor only
              guides your thinking — a question is marked done once you submit your own code.
            </li>
            <li>
              • <strong className="text-ink">Stay consistent:</strong> the heatmap and streak track
              every day you complete questions.
            </li>
          </ul>
        </Card>

        <Card className="border-danger/30 p-6">
          <h2 className="mb-1 text-sm font-extrabold text-danger">Danger zone</h2>
          <p className="mb-4 text-xs text-muted">Reset everything and start the challenge fresh.</p>
          <ClearDataButton />
        </Card>
      </div>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-3 last:border-0">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm font-bold">{value}</span>
    </div>
  );
}
