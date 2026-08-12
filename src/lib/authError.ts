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

/**
 * Logs the raw error shape to the devtools console for debugging. Errors
 * (including Supabase's AuthError) don't serialize through JSON.stringify by
 * default — `.message` is a non-enumerable own property on native Error
 * instances — so a plain `JSON.stringify(error)` silently prints "{}" and
 * hides the actual message. This logs both the object itself (so devtools'
 * own inspector, which does read non-enumerable props, shows everything)
 * and a JSON dump built from the enumerable + explicitly-named fields most
 * Supabase error shapes use, so nothing is lost either way.
 */
export function logSupabaseError(label: string, error: unknown): void {
  console.error(label, error);
  const record = error && typeof error === "object" ? (error as Record<string, unknown>) : {};
  console.log(
    label,
    JSON.stringify(
      {
        message: (error instanceof Error ? error.message : undefined) ?? record.message,
        name: (error instanceof Error ? error.name : undefined) ?? record.name,
        status: record.status,
        code: record.code,
        error_description: record.error_description,
        raw: error instanceof Error ? undefined : error,
      },
      null,
      2
    )
  );
}
