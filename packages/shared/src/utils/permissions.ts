/**
 * Check if a session has a specific permission.
 * Admin wildcard ("*") grants all permissions.
 */
export function hasPermission(
  effectivePermissions: string[],
  required: string,
): boolean {
  if (effectivePermissions.includes("*")) return true;
  return effectivePermissions.includes(required);
}
