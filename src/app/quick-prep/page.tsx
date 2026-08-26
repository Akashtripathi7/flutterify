import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { TopHeader } from "@/components/TopHeader";
import { QuickPrepClient } from "@/components/QuickPrepClient";

export const dynamic = "force-dynamic";

export default async function QuickPrepPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const display =
    (user.user_metadata?.full_name as string) ||
    (user.user_metadata?.name as string) ||
    null;

  return (
    <AppShell>
      <TopHeader email={user.email} name={display} />
      <QuickPrepClient />
    </AppShell>
  );
}
