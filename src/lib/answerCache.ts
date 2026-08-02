import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/** Below this trigram similarity, two questions are treated as different. */
const SIMILARITY_THRESHOLD = 0.55;

/**
 * Normalizes a question before storing/matching it: lowercase, accents
 * stripped, punctuation removed, whitespace collapsed. This keeps trigram
 * similarity focused on wording rather than casing/formatting noise.
 */
export function normalizeQuestion(question: string): string {
  return question
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export interface CachedAnswer {
  id: string;
  answer: string;
  model: string;
  questionOriginal: string;
  similarity: number;
}

/**
 * Looks up the closest previously-answered question via Postgres trigram
 * similarity (see match_cached_answer() in supabase/schema.sql). Returns
 * null on a miss or if the cache itself is unreachable — a cache failure
 * should never block answering the user's question.
 */
export async function findSimilarCachedAnswer(
  supabase: SupabaseClient<Database>,
  question: string,
  namespace = "chat"
): Promise<CachedAnswer | null> {
  const normalized = normalizeQuestion(question);
  if (!normalized) return null;

  const { data, error } = await supabase.rpc("match_cached_answer", {
    query_text: normalized,
    min_similarity: SIMILARITY_THRESHOLD,
    p_namespace: namespace,
  });

  if (error) {
    console.error("Cache lookup failed:", error);
    return null;
  }

  const match = data?.[0];
  if (!match) return null;

  return {
    id: match.id,
    answer: match.answer,
    model: match.model,
    questionOriginal: match.question_original,
    similarity: match.similarity,
  };
}

/** Marks a cache entry as reused (best-effort — never blocks the response). */
export async function markCacheHit(supabase: SupabaseClient<Database>, cacheId: string) {
  const { error } = await supabase.rpc("increment_cache_hit", { cache_id: cacheId });
  if (error) console.error("Failed to record cache hit:", error);
}

/**
 * Stores a fresh Groq answer for reuse by future users asking a similar
 * question. Best-effort: a write failure shouldn't surface to the client
 * since the user already has their answer.
 */
export async function saveAnswerToCache(
  supabase: SupabaseClient<Database>,
  question: string,
  answer: string,
  model: string,
  namespace = "chat"
): Promise<void> {
  const normalized = normalizeQuestion(question);
  if (!normalized || !answer.trim()) return;

  const { error } = await supabase.from("answer_cache").insert({
    question_normalized: normalized,
    question_original: question,
    answer,
    model,
    namespace,
  });

  if (error) console.error("Failed to save answer to cache:", error);
}
