/** Maximum prompt length to prevent token flood attacks */
const MAX_PROMPT_LENGTH = 4000;

/**
 * Sanitizes user-supplied text before inserting into an LLM prompt.
 * Strips known prompt injection patterns and enforces a length cap.
 * Does NOT guarantee complete protection — use alongside structural prompt design.
 */
export function sanitizePrompt(input: string): string {
  if (!input || typeof input !== "string") return "";

  return (
    input
      // Enforce max length first (prevent token flood)
      .slice(0, MAX_PROMPT_LENGTH)
      // Strip XML-style role injection tags
      .replace(/<\/?(?:system|assistant|user|inst|\/s|SYS|INST)[^>]*>/gi, "")
      // Common jailbreak openers (complex patterns are intentional for security)
      /* eslint-disable security/detect-unsafe-regex */
      .replace(
        /ignore\s+(?:all\s+)?(?:previous\s+)?instructions?/gi,
        "[filtered]",
      )
      .replace(
        /disregard\s+(?:all\s+)?(?:previous\s+)?instructions?/gi,
        "[filtered]",
      )
      .replace(
        /you\s+are\s+now\s+(?:a\s+)?(?:dan|jailbreak|evil|unrestricted|uncensored)/gi,
        "[filtered]",
      )
      .replace(
        /act\s+as\s+(?:if\s+you\s+are\s+)?(?:dan|jailbreak|unrestricted)/gi,
        "[filtered]",
      )
      /* eslint-enable security/detect-unsafe-regex */
      // Strip markdown-style role headers that could confuse structured prompts
      .replace(/^#{1,3}\s*(?:system|assistant|user)\s*:/gim, "")
      .trim()
  );
}
