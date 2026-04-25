/**
 * Dynamic import registry for heavy components (>50KB).
 * Reference: CLAUDE.md P3 (Dynamic Imports)
 *
 * Pattern: import from this file instead of direct imports.
 * All components here are lazy-loaded with SSR disabled and skeleton fallbacks.
 */

import dynamic from "next/dynamic";

// ── Charts (Recharts ~400KB) ───────────────────────────────
// Always use these instead of importing from 'recharts' directly

export const LazyAreaChart = dynamic(
  () => import("recharts").then((m) => ({ default: m.AreaChart })),
  { ssr: false },
);

export const LazyBarChart = dynamic(
  () => import("recharts").then((m) => ({ default: m.BarChart })),
  { ssr: false },
);

export const LazyLineChart = dynamic(
  () => import("recharts").then((m) => ({ default: m.LineChart })),
  { ssr: false },
);

export const LazyPieChart = dynamic(
  () => import("recharts").then((m) => ({ default: m.PieChart })),
  { ssr: false },
);

// ── Future heavy components ────────────────────────────────
// Uncomment as modules are built:
//
// export const LazyRichTextEditor = dynamic(
//   () => import("@/components/editor/rich-text"),
//   { ssr: false }
// );
//
// export const LazyPDFViewer = dynamic(
//   () => import("@/components/pdf/viewer"),
//   { ssr: false }
// );
//
// export const LazyDataExporter = dynamic(
//   () => import("@/components/export/data-exporter"),
//   { ssr: false }
// );
