/**
 * Exact refusal strings the AI is instructed to return verbatim when a
 * request is out of scope or invalid (see system prompts in src/lib/groq.ts).
 * Deliberately has no "server-only" guard — both API routes (to decide
 * whether to bill quota) and client components (to decide whether to bump
 * the local/demo quota counter in AUTH_DISABLED mode) need this list, and
 * it contains no secrets.
 */
export const CHAT_OFF_TOPIC_REFUSAL = "Je suis un assistant dédié exclusivement à Excel.";
export const FORMULA_OFF_TOPIC_REFUSAL =
  "Je suis un générateur de formules Excel, décrivez une tâche Excel.";
export const FORMULA_INVALID_REFUSAL =
  'Veuillez coller une formule Excel valide (ex: =SI(A1>10; "Oui"; "Non")).';

const ALL_REFUSALS = [CHAT_OFF_TOPIC_REFUSAL, FORMULA_OFF_TOPIC_REFUSAL, FORMULA_INVALID_REFUSAL];

/**
 * True when the AI's reply IS one of the fixed refusal messages (exact
 * match, trimmed) rather than a real answer. Used to gate quota billing:
 * a rejected/out-of-scope request must never cost the user a credit.
 */
export function isAiRefusal(text: string): boolean {
  const trimmed = text.trim();
  return ALL_REFUSALS.some((refusal) => trimmed === refusal);
}
