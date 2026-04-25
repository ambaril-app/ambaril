/**
 * Core Web Vitals monitoring.
 * Reference: CLAUDE.md P1 (targets: LCP <1.5s, INP <150ms, CLS <0.05)
 *
 * Sends metrics to console in dev, to analytics endpoint in prod.
 * Next.js App Router calls this automatically via instrumentation.
 */

import type { Metric } from "web-vitals";

const VITALS_ENDPOINT = process.env.NEXT_PUBLIC_VITALS_ENDPOINT;

const thresholds: Record<string, { target: number; limit: number }> = {
  LCP: { target: 1500, limit: 2500 },
  INP: { target: 150, limit: 200 },
  CLS: { target: 0.05, limit: 0.1 },
  FCP: { target: 800, limit: 1500 },
  TTFB: { target: 200, limit: 600 },
};

function getRating(
  name: string,
  value: number,
): "good" | "needs-improvement" | "poor" {
  const t = thresholds[name];
  if (!t) return "good";
  if (value <= t.target) return "good";
  if (value <= t.limit) return "needs-improvement";
  return "poor";
}

export function reportWebVitals(metric: Metric) {
  const rating = getRating(metric.name, metric.value);

  if (process.env.NODE_ENV === "development") {
    const color =
      rating === "good"
        ? "green"
        : rating === "needs-improvement"
          ? "orange"
          : "red";
    console.log(
      `%c[CWV] ${metric.name}: ${Math.round(metric.value * 100) / 100} (${rating})`,
      `color: ${color}; font-weight: bold`,
    );
    return;
  }

  // Production: send to analytics endpoint
  if (VITALS_ENDPOINT) {
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating,
      id: metric.id,
      navigationType: metric.navigationType,
      timestamp: Date.now(),
    });

    // Use sendBeacon for reliability (survives page unload)
    if (navigator.sendBeacon) {
      navigator.sendBeacon(VITALS_ENDPOINT, body);
    } else {
      fetch(VITALS_ENDPOINT, {
        method: "POST",
        body,
        keepalive: true,
        headers: { "Content-Type": "application/json" },
      });
    }
  }
}
