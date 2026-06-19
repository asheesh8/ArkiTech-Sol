export function isAllowedEmail(email: string, allowlist: string[]): boolean {
  const normalized = email.trim().toLowerCase();
  return allowlist.some((allowed) => allowed.trim().toLowerCase() === normalized);
}
