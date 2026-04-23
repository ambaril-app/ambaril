import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://cdn.jsdelivr.net https://*.myshopify.com",
      "font-src 'self' https://cdn.jsdelivr.net",
      "connect-src 'self' https://*.neon.tech wss://*.neon.tech https://api.resend.com https://*.ingest.us.sentry.io https://*.ingest.sentry.io",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  transpilePackages: [
    "@ambaril/ui",
    "@ambaril/shared",
    "@ambaril/db",
    "@ambaril/email",
  ],
  serverExternalPackages: ["ws", "@neondatabase/serverless", "@node-rs/argon2"],
  turbopack: {
    root: "../../",
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  productionBrowserSourceMaps: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  sourcemaps: {
    disable: true, // No auth token on VPS — skip source map upload
  },
  silent: !process.env.CI,
  autoInstrumentServerFunctions: true,
  autoInstrumentMiddleware: true,
});
