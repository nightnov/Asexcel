/**
 * Supabase auth calls can fail in shapes other than a clean AuthError with a
 * populated .message (a raw network TypeError, a non-Error rejection, an
 * AuthError whose .message is empty) — rendering `error` or `error.message`
 * directly in JSX in those cases showed a literal "{}" instead of readable
 * text. This always returns a non-empty, displayable string.
 */
export function getAuthErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    const candidate = record.message ?? record.error_description ?? record.msg;
    if (typeof candidate === "string" && candidate) return candidate;
  }
  return fallback;
}
