export type QuestionCategory = "logique" | "suite" | "matrice" | "intrus" | "enigme";

/**
 * Structural data only — no user-facing text. Every question's prompt,
 * options and explanation live in the i18n dictionary under
 * tools.testQi.questions[id] (see src/lib/i18n/dictionaries.ts), keyed by
 * `id`, so IqTest.tsx renders them via useLocale() in the visitor's
 * language. Grids use universal digits/glyphs only (no letters or words),
 * so a single grid works unchanged across all 14 locales.
 */
export interface IqQuestion {
  id: string;
  category: QuestionCategory;
  /** Optional monospace grid rendered above the prompt (used for matrix questions). Universal glyphs/digits only. */
  grid?: string[][];
  /** Index into the dictionary's `options` array for this question id. */
  correctIndex: number;
}

/**
 * Full question pool (30 questions, 6 per category). A fresh 9-question quiz
 * is drawn at random from this pool every time a game starts, via getRandomQuestions().
 */
export const IQ_QUESTION_POOL: IqQuestion[] = [
  // --- LOGIQUE ---
  { id: "logique-1", category: "logique", correctIndex: 2 },
  { id: "logique-2", category: "logique", correctIndex: 1 },
  { id: "logique-3", category: "logique", correctIndex: 1 },
  { id: "logique-4", category: "logique", correctIndex: 0 },
  { id: "logique-5", category: "logique", correctIndex: 2 },
  { id: "logique-6", category: "logique", correctIndex: 1 },

  // --- SUITES NUMÉRIQUES ---
  { id: "suite-1", category: "suite", correctIndex: 2 },
  { id: "suite-2", category: "suite", correctIndex: 2 },
  { id: "suite-3", category: "suite", correctIndex: 1 },
  { id: "suite-4", category: "suite", correctIndex: 2 },
  { id: "suite-5", category: "suite", correctIndex: 2 },
  { id: "suite-6", category: "suite", correctIndex: 2 },

  // --- MATRICES VISUELLES (glyphes/chiffres universels, aucun texte) ---
  {
    id: "matrice-1",
    category: "matrice",
    grid: [
      ["●", "● ●", "● ● ●"],
      ["● ●", "● ● ●", "● ● ● ●"],
      ["● ● ●", "● ● ● ●", "?"],
    ],
    correctIndex: 2,
  },
  {
    id: "matrice-2",
    category: "matrice",
    grid: [
      ["△", "□", "○"],
      ["□", "○", "△"],
      ["○", "△", "?"],
    ],
    correctIndex: 1,
  },
  {
    id: "matrice-3",
    category: "matrice",
    grid: [
      ["2", "4", "6"],
      ["8", "10", "12"],
      ["14", "16", "?"],
    ],
    correctIndex: 1,
  },
  {
    id: "matrice-4",
    category: "matrice",
    // Redesigned from a Latin-alphabet (A/B/C) progression to a pure
    // multiplication-table pattern so it holds up identically in every
    // script (Arabic, CJK, Cyrillic...), not just Latin-alphabet languages.
    grid: [
      ["1", "2", "3"],
      ["2", "4", "6"],
      ["3", "6", "?"],
    ],
    correctIndex: 2,
  },
  {
    id: "matrice-5",
    category: "matrice",
    grid: [
      ["1", "2", "4"],
      ["2", "4", "8"],
      ["4", "8", "?"],
    ],
    correctIndex: 2,
  },
  {
    id: "matrice-6",
    category: "matrice",
    grid: [
      ["9", "7", "5"],
      ["8", "6", "4"],
      ["7", "5", "?"],
    ],
    correctIndex: 1,
  },

  // --- INTRUS ---
  { id: "intrus-1", category: "intrus", correctIndex: 3 },
  { id: "intrus-2", category: "intrus", correctIndex: 3 },
  { id: "intrus-3", category: "intrus", correctIndex: 2 },
  { id: "intrus-4", category: "intrus", correctIndex: 2 },
  { id: "intrus-5", category: "intrus", correctIndex: 3 },
  { id: "intrus-6", category: "intrus", correctIndex: 3 },

  // --- ÉNIGMES VISUELLES ---
  { id: "enigme-1", category: "enigme", correctIndex: 1 },
  { id: "enigme-2", category: "enigme", correctIndex: 1 },
  { id: "enigme-3", category: "enigme", correctIndex: 1 },
  { id: "enigme-4", category: "enigme", correctIndex: 1 },
  { id: "enigme-5", category: "enigme", correctIndex: 1 },
  { id: "enigme-6", category: "enigme", correctIndex: 2 },
];

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Draws a fresh, randomized set of `count` questions from the full pool. */
export function getRandomQuestions(count = 9): IqQuestion[] {
  return shuffle(IQ_QUESTION_POOL).slice(0, count);
}

export interface ScoreBand {
  minCorrect: number;
  /** Displayed as "Score : {range} IQ" — e.g. "95-105". */
  range: string;
  /** Ludic gamified title shown as a badge. */
  badgeTitle: string;
  /** Emoji shown next to the badge title. */
  badgeEmoji: string;
  /** "Tu fais partie des X% les plus [...]" — smaller X = more exclusive. */
  topPercent: number;
  /** Tailwind gradient classes used for the result card background. */
  gradient: string;
}

export const SCORE_BANDS: ScoreBand[] = [
  {
    minCorrect: 0,
    range: "85-95",
    badgeTitle: "Recrue en Formation",
    badgeEmoji: "🥚",
    topPercent: 55,
    gradient: "from-slate-500 to-slate-700",
  },
  {
    minCorrect: 3,
    range: "95-105",
    badgeTitle: "Esprit Vif",
    badgeEmoji: "💡",
    topPercent: 40,
    gradient: "from-sky-500 to-blue-700",
  },
  {
    minCorrect: 5,
    range: "105-120",
    badgeTitle: "Stratège Tactique",
    badgeEmoji: "♟️",
    topPercent: 20,
    gradient: "from-brand-500 to-emerald-700",
  },
  {
    minCorrect: 7,
    range: "120-150",
    badgeTitle: "Cerveau Quantique",
    badgeEmoji: "🧠",
    topPercent: 8,
    gradient: "from-violet-500 to-purple-700",
  },
  {
    minCorrect: 9,
    range: "150-180",
    badgeTitle: "Logique de Fer",
    badgeEmoji: "⚡",
    topPercent: 2,
    gradient: "from-amber-500 to-orange-700",
  },
];

export function getScoreBand(correct: number): ScoreBand {
  let band = SCORE_BANDS[0];
  for (const b of SCORE_BANDS) {
    if (correct >= b.minCorrect) band = b;
  }
  return band;
}
