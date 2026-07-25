import { Skeleton } from "@/components/ui/skeleton";

/**
 * Route-level fallback. Mirrors the real page's shape — header, three stat
 * cards, filter pills, table — so navigating in doesn't flash a differently
 * proportioned layout before the client component takes over.
 */
export default function Loading() {
  return (
    <div className="container mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
      <div className="space-y-2 pb-8">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="grid gap-4 md:grid-cols-3 md:gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-md" />
        ))}
      </div>

      <Skeleton className="h-[520px] w-full rounded-xl" />
    </div>
  );
}
