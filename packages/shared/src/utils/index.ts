import type { ApiResponse, ApiError, ApiMeta, RoleCode } from "../types/index";

export { escapeHtml } from "./escape-html";
export { hasPermission } from "./permissions";

// Build a successful API response
export function ok<T>(data: T, meta?: ApiMeta): ApiResponse<T> {
  return { data, ...(meta && { meta }) };
}

// Build an error API response
export function err<T = null>(errors: ApiError[], data?: T): ApiResponse<T> {
  return { data: data as T, errors };
}

// Build a single error
export function apiError(
  code: string,
  message: string,
  field?: string,
): ApiError {
  return { code, message, ...(field && { field }) };
}

// Check if a user has one of the required roles
export function hasRole(
  userRole: RoleCode,
  requiredRoles: RoleCode[],
): boolean {
  return requiredRoles.includes(userRole);
}

// Generate UUID v7 (time-ordered)
export function generateId(): string {
  // UUID v7: timestamp (48 bits) + random (74 bits)
  const now = Date.now();
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  // Set timestamp in first 6 bytes
  bytes[0] = (now / 2 ** 40) & 0xff;
  bytes[1] = (now / 2 ** 32) & 0xff;
  bytes[2] = (now / 2 ** 24) & 0xff;
  bytes[3] = (now / 2 ** 16) & 0xff;
  bytes[4] = (now / 2 ** 8) & 0xff;
  bytes[5] = now & 0xff;

  // Set version (7) and variant (2)
  bytes[6] = (bytes[6]! & 0x0f) | 0x70; // version 7
  bytes[8] = (bytes[8]! & 0x3f) | 0x80; // variant 2

  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// Format currency as BRL
export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}
