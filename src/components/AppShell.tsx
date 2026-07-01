import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

/**
 * Flutterify shell: a grey-blue canvas holding a single rounded panel.
 * The dark icon sidebar sits flush-left inside the panel; page content fills
 * the rest. Use <AppShell> at the top of every authenticated page.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas p-3 sm:p-5">
      <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-[1400px] overflow-hidden rounded-3xl bg-panel shadow-[0_30px_80px_-40px_rgba(0,0,0,0.5)] sm:min-h-[calc(100vh-2.5rem)]">
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-x-hidden px-5 py-6 sm:px-8 sm:py-7">
          {children}
        </main>
      </div>
    </div>
  );
}
