import { AppShell } from "./AppShell";

/**
 * Full-page shimmer placeholder shown by Next.js route `loading.tsx` files
 * while a server page is fetching — so navigation feels instant and smooth
 * instead of flashing a blank/rendering state.
 */
export function PageSkeleton({ variant = "grid" }: { variant?: "grid" | "list" | "question" }) {
  return (
    <AppShell>
      {/* header row */}
      <div className="mb-6 flex items-center justify-between">
        <div className="shimmer h-9 w-48 rounded-lg" />
        <div className="flex gap-2">
          <div className="shimmer h-9 w-24 rounded-full" />
          <div className="shimmer h-9 w-20 rounded-full" />
        </div>
      </div>

      {variant === "question" ? (
        <div className="mx-auto max-w-3xl space-y-5">
          <div className="shimmer h-40 w-full rounded-2xl" />
          <div className="shimmer h-12 w-full rounded-2xl" />
          <div className="shimmer h-64 w-full rounded-2xl" />
        </div>
      ) : (
        <>
          <div className="shimmer mb-6 h-28 w-full rounded-2xl" />
          {variant === "grid" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="shimmer h-44 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="space-y-2.5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="shimmer h-16 w-full rounded-xl" />
              ))}
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}
