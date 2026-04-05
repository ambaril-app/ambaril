/**
 * Escape HTML special characters to prevent XSS.
 * Use when interpolating user data into HTML strings (emails, etc.).
 * NOT needed in React JSX (auto-escaping handles it).
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
