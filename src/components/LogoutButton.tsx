"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LogOut, Loader2 } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  const [out, setOut] = useState(false);

  async function signOut() {
    setOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      onClick={signOut}
      disabled={out}
      title="Sign out"
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-2 text-sm font-bold text-ink transition-colors hover:border-border-strong disabled:opacity-50"
    >
      {out ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
      <span className="hidden sm:inline">Logout</span>
    </button>
  );
}
