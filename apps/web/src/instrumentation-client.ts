/**
 * Next.js client instrumentation — runs once on client startup.
 * Registers Core Web Vitals reporting.
 */

import { onCLS, onINP, onLCP, onFCP, onTTFB } from "web-vitals";
import { reportWebVitals } from "@/lib/web-vitals";

onCLS(reportWebVitals);
onINP(reportWebVitals);
onLCP(reportWebVitals);
onFCP(reportWebVitals);
onTTFB(reportWebVitals);
