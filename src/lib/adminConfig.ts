/**
 * Single hardcoded admin account, not a role stored in the database. There
 * is exactly one admin for this app right now, so a DB-backed roles table
 * would be pure overhead. Revisit if a second admin is ever needed.
 */
export const ADMIN_EMAIL = "blacktrash2007@gmail.com";

export function isAdminEmail(email: string | null | undefined): boolean {
  return email?.toLowerCase() === ADMIN_EMAIL;
}
