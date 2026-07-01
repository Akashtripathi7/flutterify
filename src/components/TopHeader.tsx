import { Bell } from "lucide-react";
import { FlutterLogo } from "./FlutterLogo";
import { LogoutButton } from "./LogoutButton";

/**
 * Top bar inside the panel: brand/welcome on the left, search + user on the
 * right. `lead` renders the left side (a welcome line or a back link).
 */
export function TopHeader({
  email,
  name,
  lead,
}: {
  email?: string | null;
  name?: string | null;
  lead?: React.ReactNode;
}) {
  const display = (name && name.trim()) || (email ? email.split("@")[0] : "learner");
  const handle = email ? email.split("@")[0] : display;
  const initial = display.charAt(0).toUpperCase();

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div className="min-w-0">
        {lead ?? (
          <div className="flex items-center gap-2.5">
            <FlutterLogo size={26} />
            <p className="text-sm text-muted">
              Welcome to{" "}
              <span className="font-extrabold text-ink">
                Flutter<span className="text-primary">ify</span>
              </span>
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button className="grid h-10 w-10 place-items-center rounded-full border border-border bg-surface text-ink">
          <Bell size={17} />
        </button>

        <div className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-yellow text-sm font-bold text-sidebar">
            {initial}
          </span>
          <div className="hidden leading-tight sm:block">
            <div className="text-sm font-bold capitalize text-ink">{display}</div>
            <div className="text-xs text-muted">@{handle}</div>
          </div>
        </div>

        <LogoutButton />
      </div>
    </div>
  );
}
