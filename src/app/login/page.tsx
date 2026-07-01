"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, BookOpen, Code2, Network, Flame } from "lucide-react";
import { FlutterLogo } from "@/components/FlutterLogo";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001 6.19 5.238 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    typeof window !== "undefined" && new URLSearchParams(window.location.search).get("error")
      ? "Sign-in failed. Please try again."
      : null,
  );

  async function signInWithGoogle() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
    // On success the browser redirects to Google — no further code runs here.
  }

  return (
    <main className="grid min-h-screen place-items-center bg-canvas p-4 sm:p-6">
      <div className="grid w-full max-w-4xl animate-fade-in overflow-hidden rounded-3xl bg-panel shadow-[0_30px_80px_-40px_rgba(0,0,0,0.5)] md:grid-cols-2">
        {/* Left — brand + product gist */}
        <div className="flex flex-col justify-between bg-sidebar p-8 text-on-dark sm:p-10">
          <div>
            <div className="mb-8 flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white">
                <FlutterLogo size={22} />
              </span>
              <span className="text-lg font-extrabold">
                Flutter<span className="text-primary">ify</span>
              </span>
            </div>

            <h1 className="text-3xl font-extrabold leading-tight">
              Master Flutter interviews, one day at a time.
            </h1>
            <p className="mt-3 text-sm text-on-dark-muted">
              A guided 60-day plan that blends Dart &amp; Flutter theory, hands-on coding logic, and
              real system-design — with an AI mentor that explains everything in plain English.
            </p>

            <ul className="mt-8 space-y-4">
              <Feature icon={<BookOpen size={16} />} title="Learn in depth" desc="Theory taught simply, with analogies and flashcards." />
              <Feature icon={<Code2 size={16} />} title="Build real logic" desc="Code-gated drills — you write it, the mentor guides." />
              <Feature icon={<Network size={16} />} title="System design" desc="Architect apps & answer like a senior engineer." />
              <Feature icon={<Flame size={16} />} title="Stay consistent" desc="Streaks & a heatmap keep you showing up daily." />
            </ul>
          </div>

          <p className="mt-10 hidden text-xs text-on-dark-muted md:block">
            1,300+ questions · 60-day plan · 15 practice banks
          </p>
        </div>

        {/* Right — sign in */}
        <div className="flex flex-col justify-center p-8 sm:p-10">
          <h2 className="text-2xl font-extrabold">Welcome 👋</h2>
          <p className="mt-1 text-sm text-muted">
            Sign in to sync your progress across all your devices.
          </p>

          {error && (
            <p className="mt-5 rounded-lg bg-danger-soft px-3 py-2 text-center text-xs font-semibold text-danger">
              {error}
            </p>
          )}

          <button
            onClick={signInWithGoogle}
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-full border border-border bg-white py-3.5 text-sm font-bold text-[#1f1f1f] transition-colors hover:border-border-strong disabled:opacity-60"
          >
            {loading ? <Loader2 size={18} className="animate-spin text-[#1f1f1f]" /> : <GoogleIcon />}
            Continue with Google
          </button>

          <p className="mt-4 text-center text-xs text-muted">
            One tap — no password to remember. Use the same Google account on your phone.
          </p>
        </div>
      </div>
    </main>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-ink">
        {icon}
      </span>
      <div>
        <div className="text-sm font-bold">{title}</div>
        <div className="text-xs text-on-dark-muted">{desc}</div>
      </div>
    </li>
  );
}
