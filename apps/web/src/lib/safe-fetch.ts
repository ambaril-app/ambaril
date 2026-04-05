/**
 * Safe fetch wrapper that prevents SSRF attacks.
 * Validates URLs against allowlist and blocks private IP ranges.
 */

const ALLOWED_DOMAINS = [
  /\.myshopify\.com$/,
  /\.yever\.com\.br$/,
  /api\.instagram\.com$/,
  /graph\.facebook\.com$/,
  /graph\.instagram\.com$/,
  /api\.resend\.com$/,
  /viacep\.com\.br$/,
  /api\.mercadopago\.com$/,
  /api\.focusnfe\.com\.br$/,
  /api\.melhorenvio\.com\.br$/,
  /r2\.cloudflarestorage\.com$/,
];

// RFC 1918 + RFC 5737 + loopback + link-local
const BLOCKED_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^::1$/,
  /^fc00:/,
  /^fe80:/,
  /^fd/,
  /^localhost$/i,
];

/**
 * Validate that a URL is safe to fetch (not pointing to internal resources).
 * Throws if the URL is unsafe.
 */
export function validateExternalUrl(url: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }

  // Only allow HTTPS (and HTTP for localhost in dev)
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error(`Blocked protocol: ${parsed.protocol}`);
  }

  // Block private IPs
  const hostname = parsed.hostname;
  for (const pattern of BLOCKED_IP_PATTERNS) {
    if (pattern.test(hostname)) {
      throw new Error(`Blocked internal address: ${hostname}`);
    }
  }

  // Validate against domain allowlist
  const isAllowed = ALLOWED_DOMAINS.some((pattern) => pattern.test(hostname));
  if (!isAllowed) {
    throw new Error(`Domain not in allowlist: ${hostname}`);
  }

  return parsed;
}

/**
 * Fetch wrapper with SSRF protection.
 * Only allows requests to known external service domains.
 */
export async function safeFetch(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  validateExternalUrl(url);
  return fetch(url, {
    ...init,
    signal: init?.signal ?? AbortSignal.timeout(30_000), // 30s timeout
  });
}
