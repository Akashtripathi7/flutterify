"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { FolderClosed, Dumbbell, Settings, LogOut, Zap } from "lucide-react";
import { FlutterLogo } from "./FlutterLogo";

const NAV = [
  { href: "/dashboard", icon: FolderClosed, label: "My learnings", locked: false },
  { href: "/quick-prep", icon: Zap, label: "Quick Prepare", locked: false },
  { href: "/drills", icon: Dumbbell, label: "Drills (coming soon)", locked: true },
  { href: "/settings", icon: Settings, label: "Settings", locked: false },
];

export function Sidebar() {
  const pathname = usePathname();
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
    <aside className="flex w-[68px] shrink-0 flex-col items-center bg-sidebar py-5">
      <Link
        href="/dashboard"
        className="mb-6 grid h-10 w-10 place-items-center rounded-xl bg-white"
        title="Flutterify"
      >
        <FlutterLogo size={22} />
      </Link>

      <nav className="flex flex-1 flex-col items-center gap-2">
        {NAV.map((item) => {
          const Icon = item.icon;

          if (item.locked) {
            return (
              <span
                key={item.label}
                title={item.label}
                className="grid h-11 w-11 cursor-not-allowed place-items-center rounded-xl text-white/25"
              >
                <Icon size={20} strokeWidth={2} />
              </span>
            );
          }

          const active =
            item.href === pathname ||
            (item.href === "/dashboard" && (pathname.startsWith("/day") || pathname.startsWith("/question"))) ||
            (item.href === "/quick-prep" && pathname.startsWith("/quick-prep"));
          return (
            <Link
              key={item.label}
              href={item.href}
              title={item.label}
              className={`grid h-11 w-11 place-items-center rounded-xl transition-colors ${
                active
                  ? "bg-yellow text-sidebar"
                  : "text-on-dark-muted hover:bg-white/10 hover:text-on-dark"
              }`}
            >
              <Icon size={20} strokeWidth={2} />
            </Link>
          );
        })}
      </nav>

      <button
        onClick={signOut}
        disabled={out}
        title="Sign out"
        className="grid h-11 w-11 place-items-center rounded-xl text-on-dark-muted transition-colors hover:bg-white/10 hover:text-on-dark disabled:opacity-50"
      >
        <LogOut size={20} />
      </button>
    </aside>
  );
}
