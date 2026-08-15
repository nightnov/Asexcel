import "server-only";
import OpenAI from "openai";
import {
  CHAT_OFF_TOPIC_REFUSAL,
  FORMULA_OFF_TOPIC_REFUSAL,
  FORMULA_INVALID_REFUSAL,
} from "./aiRefusals";

/**
 * Groq exposes an OpenAI-compatible Chat Completions API, so the official
 * `openai` SDK is reused here pointed at Groq's base URL. GROQ_API_KEY is
 * read from the server environment only — never bundle it into client code
 * and never pass it as a NEXT_PUBLIC_* variable.
 */
if (!process.env.GROQ_API_KEY) {
  throw new Error("GROQ_API_KEY is not set. Add it to your server environment (.env.local).");
}

export const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

// llama-3.3-70b-versatile and llama-3.1-8b-instant were both deprecated by
// Groq on 2026-06-17, shut down 2026-08-16 — migrated to Groq's own
// recommended replacements (console.groq.com/docs/deprecations) ahead of
// that cutoff.
export const GROQ_MODELS = {
  /** Best quality/latency tradeoff for step-by-step Excel guidance. */
  primary: "openai/gpt-oss-120b",
  /** Fallback used when the primary model is rate-limited or overloaded. */
  fast: "openai/gpt-oss-20b",
} as const;

export const EXCEL_ASSISTANT_SYSTEM_PROMPT = `Tu es Asecxel, un assistant expert Microsoft Excel et Google Sheets.
Ton rôle : aider l'utilisateur à résoudre des problèmes concrets (formules, macros VBA,
mise en forme, organisation et analyse de données, tableaux croisés dynamiques, etc.).

Cadrage strict du périmètre :
- Si la demande ne concerne pas Excel, Google Sheets, ou l'analyse/organisation de données
  (ex : culture générale, code hors tableur, actualité, conseils personnels, etc.), réponds
  UNIQUEMENT et EXACTEMENT par : "${CHAT_OFF_TOPIC_REFUSAL}"
  Rien d'autre : pas de bonjour, pas d'excuse, pas de justification, pas de suggestion de
  reformulation.
- N'applique ce refus qu'aux demandes réellement hors-sujet ; les questions Excel/Sheets/
  données, même formulées vaguement, restent dans ton périmètre.

Règles de réponse (pour les demandes dans le périmètre) :
- Réponds de façon directe, claire et concise : va droit à la solution, sans préambule,
  sans reformulation de la question, sans pavés de texte.
- Donne une guidance étape par étape, numérotée et actionnable, uniquement quand plusieurs
  étapes sont réellement nécessaires ; une question simple mérite une réponse courte.
- Fournis les formules ou le code VBA exact entre balises de code, prêts à copier-coller.
- Si la demande est ambiguë (version d'Excel, structure des données...), pose une question
  de clarification ciblée avant de te lancer dans une solution complète.
- Si l'utilisateur a joint un fichier, base ta réponse sur les colonnes/feuilles qu'il décrit
  et précise les hypothèses que tu fais si la structure exacte n'est pas connue.`;

/**
 * Calls Groq's chat completions endpoint with streaming enabled, retrying
 * once against the faster/smaller model if the primary model request fails
 * (e.g. transient rate limit on the 120B model).
 */
export async function streamExcelAssistantReply(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]
) {
  const payload = {
    messages: [
      { role: "system" as const, content: EXCEL_ASSISTANT_SYSTEM_PROMPT },
      ...messages,
    ],
    temperature: 0.3,
    max_tokens: 2048,
    stream: true as const,
  };

  try {
    return await groq.chat.completions.create({ ...payload, model: GROQ_MODELS.primary });
  } catch (error) {
    console.error("Groq primary model failed, falling back:", error);
    return await groq.chat.completions.create({ ...payload, model: GROQ_MODELS.fast });
  }
}

// ---------------------------------------------------------------------------
// Formula generator/explainer tool (src/app/api/generate-formula/route.ts)
// ---------------------------------------------------------------------------

export type FormulaToolMode = "create" | "explain";
export type FormulaLanguage = "fr" | "en";

function buildFormulaToolPrompt(mode: FormulaToolMode, language: FormulaLanguage): string {
  const langLabel = language === "fr" ? "en français (SOMME.SI, RECHERCHEV, SI...)" : "en anglais (SUMIF, VLOOKUP, IF...)";

  if (mode === "create") {
    return `Tu es un générateur de formules Excel. L'utilisateur décrit en langage naturel ce qu'il veut
faire dans Excel. Génère la formule Excel correspondante, avec les noms de fonctions ${langLabel}.

Format de réponse strict :
1. La formule SEULE sur la première ligne : texte brut, prêt à copier-coller directement dans
   Excel. Elle doit commencer par "=". N'entoure JAMAIS la formule de guillemets ("..."),
   d'apostrophes ('...') ni de balises de code (pas de \`...\` ni de bloc \`\`\`) — uniquement
   les caractères de la formule elle-même.
2. Une ligne vide.
3. Une explication d'une à deux phrases maximum de ce que fait la formule et, si utile,
   des hypothèses faites sur la structure des données (ex. quelle colonne).

Aucun préambule, aucune politesse, aucune reformulation de la demande.

Si la demande ne décrit pas une tâche Excel réalisable avec une formule (culture générale,
code hors tableur, actualité, conseils personnels...), réponds UNIQUEMENT et EXACTEMENT par :
"${FORMULA_OFF_TOPIC_REFUSAL}"`;
  }

  return `Tu es un explicateur de formules Excel. L'utilisateur colle un texte qui est censé être
une formule Excel (dans n'importe quelle langue : française, anglaise, etc.).

Étape 1 — Vérifie que le texte fourni est bien une formule Excel : il doit commencer par "="
et contenir au moins une référence de cellule, un opérateur ou un nom de fonction reconnaissable.
Si ce n'est PAS le cas (ex. l'utilisateur a écrit une phrase en langage naturel, une question,
ou un texte sans rapport), réponds UNIQUEMENT et EXACTEMENT par :
"${FORMULA_INVALID_REFUSAL}"
Ne fais AUCUNE tentative d'explication dans ce cas, même partielle.

Étape 2 — Si c'est bien une formule, explique-la clairement étape par étape, en français, en
partant de la fonction la plus imbriquée (la plus interne) vers l'extérieur.

Format de réponse strict (uniquement quand c'est une vraie formule) :
- Une liste numérotée, une étape par ligne, courte et concrète.
- Pas de préambule ni de reformulation de la formule fournie.
- Si un nom de fonction n'est pas reconnu, dis-le explicitement plutôt que d'inventer son
  comportement.`;
}

/**
 * Non-streaming Groq call for the formula generator/explainer tool: the
 * output is short (a formula + a couple of sentences, or a short numbered
 * list), so a single response with a loading spinner is a better fit than
 * token-by-token streaming.
 */
export async function generateFormulaToolReply(
  mode: FormulaToolMode,
  input: string,
  language: FormulaLanguage
): Promise<string> {
  const payload = {
    messages: [
      { role: "system" as const, content: buildFormulaToolPrompt(mode, language) },
      { role: "user" as const, content: input },
    ],
    temperature: 0.2,
    max_tokens: 600,
  };

  let completion;
  try {
    completion = await groq.chat.completions.create({ ...payload, model: GROQ_MODELS.primary });
  } catch (error) {
    console.error("Groq primary model failed, falling back:", error);
    completion = await groq.chat.completions.create({ ...payload, model: GROQ_MODELS.fast });
  }

  return completion.choices[0]?.message?.content ?? "";
}
