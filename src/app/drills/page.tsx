import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { TopHeader } from "@/components/TopHeader";
import { BackLink } from "@/components/ui";
import { Lock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DrillsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <AppShell>
      <TopHeader
        email={user.email}
        name={(user.user_metadata?.full_name as string) ?? (user.user_metadata?.name as string) ?? null}
        lead={<BackLink href="/dashboard" label="My learnings" />}
      />

      <div className="mx-auto mt-8 max-w-lg">
        <div className="card flex flex-col items-center p-10 text-center">
          <span className="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-elevated text-faint">
            <Lock size={28} />
          </span>
          <h1 className="text-2xl font-extrabold">Drills are locked</h1>
          <p className="mt-2 max-w-sm text-sm text-muted">
            The practice drill banks aren&apos;t available yet. Focus on your daily plan for now —
            drills will unlock in a future update.
          </p>
          <a
            href="/dashboard"
            className="mt-6 inline-flex items-center rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-ink transition-opacity hover:opacity-90"
          >
            Back to my learnings
          </a>
        </div>
      </div>
    </AppShell>
  );
}
