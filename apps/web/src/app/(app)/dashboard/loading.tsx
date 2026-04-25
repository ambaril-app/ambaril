import { Skeleton } from "@/components/ui/skeleton";

/**
 * Dashboard loading skeleton — dimension-matched to prevent CLS.
 * Pattern: every route with async data MUST have a loading.tsx.
 * Reference: CLAUDE.md P7, DS.md Section 5.2 (KPI Card recipe)
 */
export default function DashboardLoading() {
  return (
    <div className="space-y-6 p-6">
      {/* KPI Cards — 4 cards, L1 energy */}
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-border-subtle bg-bg-surface p-5"
            style={{ minHeight: "120px" }}
          >
            <Skeleton className="mb-3 h-3 w-20" /> {/* Label */}
            <Skeleton className="mb-2 h-8 w-28" /> {/* Value */}
            <Skeleton className="h-3 w-16" /> {/* Delta */}
          </div>
        ))}
      </div>

      {/* Charts row — 2 charts side by side, asymmetric */}
      <div className="grid grid-cols-[2fr_1fr] gap-4">
        <div
          className="rounded-lg border border-border-subtle bg-bg-surface p-5"
          style={{ minHeight: "320px" }}
        >
          <Skeleton className="mb-4 h-4 w-32" /> {/* Chart title */}
          <Skeleton className="h-[260px] w-full rounded-md" />{" "}
          {/* Chart area */}
        </div>
        <div
          className="rounded-lg border border-border-subtle bg-bg-surface p-5"
          style={{ minHeight: "320px" }}
        >
          <Skeleton className="mb-4 h-4 w-24" />
          <Skeleton className="h-[260px] w-full rounded-md" />
        </div>
      </div>

      {/* Recent orders table */}
      <div
        className="rounded-lg border border-border-subtle bg-bg-surface"
        style={{ minHeight: "400px" }}
      >
        <div className="border-b border-border-subtle px-4 py-3">
          <Skeleton className="h-4 w-28" /> {/* Table title */}
        </div>
        <div className="px-4 py-2">
          <div className="flex gap-4 border-b border-border-subtle py-2">
            {/* Table header */}
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 border-b border-border-subtle py-3"
              style={{ height: "40px" }}
            >
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
