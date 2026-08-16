"use client";

import { useState } from "react";
import { getRandomQuestions, getScoreBand, type IqQuestion, type QuestionCategory, type ScoreBand } from "@/lib/iqTestQuestions";
import Confetti from "@/components/Confetti";
import { useLocale } from "@/components/LocaleProvider";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { useAdInterstitial } from "@/lib/useAdInterstitial";
import AdInterstitialModal from "@/components/AdInterstitialModal";

type Stage = "intro" | "quiz" | "result";
/** "result" stage sub-phase: score is withheld behind a CTA + a short calculating animation before reveal. */
type ResultPhase = "pending" | "calculating" | "revealed";

const QUESTION_COUNT = 9;
const REVEAL_DELAY_MS = 1800;
const BADGE_INDEX_BY_MIN_CORRECT: Record<number, number> = { 0: 0, 3: 1, 5: 2, 7: 3, 9: 4 };

function buildShareText(tq: Dictionary["tools"]["testQi"], band: ScoreBand, correctCount: number, total: number): string {
  const badgeTitle = tq.badges[BADGE_INDEX_BY_MIN_CORRECT[band.minCorrect] ?? 0];
  return tq.shareTextTemplate
    .replace("{score}", String(correctCount))
    .replace("{total}", String(total))
    .replace("{badge}", `${badgeTitle} ${band.badgeEmoji}`)
    .replace("{percent}", String(band.topPercent));
}

/** "85-95" -> "85 - 95" — purely for display spacing around the dash. */
function formatRange(range: string): string {
  return range.replace("-", " - ");
}

function ShareButton({
  tq,
  band,
  correctCount,
  total,
}: {
  tq: Dictionary["tools"]["testQi"];
  band: ScoreBand;
  correctCount: number;
  total: number;
}) {
  const [toast, setToast] = useState<string | null>(null);
  const adInterstitial = useAdInterstitial();

  async function handleShare() {
    const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/outils/test-qi` : "";
    const shareText = buildShareText(tq, band, correctCount, total);
    const fullText = `${shareText} ${shareUrl}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: tq.shareDialogTitle, text: shareText, url: shareUrl });
        return;
      } catch {
        // User cancelled the native share sheet, or it failed — fall back to clipboard.
      }
    }

    try {
      await navigator.clipboard.writeText(fullText);
      setToast(tq.copiedToast);
      adInterstitial.trigger();
    } catch {
      setToast(tq.copyFailedToast);
    }
    window.setTimeout(() => setToast(null), 2800);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleShare}
        className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-brand-700 shadow-soft transition hover:bg-brand-50 hover:scale-[1.03] active:scale-95"
      >
        📤 {tq.shareCta}
      </button>

      {/* Fixed to the viewport (not the card) so it can never be clipped by an ancestor. */}
      {toast && (
        <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
          <div className="iq-anim-bounce rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-white shadow-soft-lg">
            {toast}
          </div>
        </div>
      )}

      <AdInterstitialModal open={adInterstitial.open} onClose={adInterstitial.close} />
    </>
  );
}

export default function IqTest() {
  const { t } = useLocale();
  const tq = t.tools.testQi;
  const CATEGORY_LABELS: Record<QuestionCategory, string> = {
    logique: tq.categories.logique,
    suite: tq.categories.suite,
    matrice: tq.categories.matrice,
    intrus: tq.categories.intrus,
    enigme: tq.categories.enigme,
  };

  const [stage, setStage] = useState<Stage>("intro");
  const [questions, setQuestions] = useState<IqQuestion[]>(() => getRandomQuestions(QUESTION_COUNT));
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(QUESTION_COUNT).fill(null));
  const [showConfetti, setShowConfetti] = useState(false);
  const [resultPhase, setResultPhase] = useState<ResultPhase>("pending");
  const [showDetails, setShowDetails] = useState(false);

  const total = questions.length;
  const question = questions[step];
  const questionText = question ? tq.questions[question.id as keyof typeof tq.questions] : undefined;
  const selected = answers[step];

  const correctCount = answers.reduce(
    (acc: number, a, i) => acc + (a === questions[i]?.correctIndex ? 1 : 0),
    0
  );

  function selectOption(index: number) {
    setAnswers((prev) => {
      const next = [...prev];
      next[step] = index;
      return next;
    });
  }

  function goNext() {
    if (step < total - 1) {
      setStep((s) => s + 1);
    } else {
      setStage("result");
      setResultPhase("pending");
      setShowDetails(false);
    }
  }

  function goPrev() {
    if (step > 0) setStep((s) => s - 1);
  }

  function startQuiz() {
    setQuestions(getRandomQuestions(QUESTION_COUNT));
    setAnswers(Array(QUESTION_COUNT).fill(null));
    setStep(0);
    setStage("quiz");
  }

  function restart() {
    setQuestions(getRandomQuestions(QUESTION_COUNT));
    setAnswers(Array(QUESTION_COUNT).fill(null));
    setStep(0);
    setStage("intro");
    setShowConfetti(false);
    setResultPhase("pending");
    setShowDetails(false);
  }

  function revealScore() {
    setResultPhase("calculating");
    window.setTimeout(() => {
      setResultPhase("revealed");
      setShowConfetti(true);
    }, REVEAL_DELAY_MS);
  }

  const band = getScoreBand(correctCount);
  const badgeTitle = tq.badges[BADGE_INDEX_BY_MIN_CORRECT[band.minCorrect] ?? 0];

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      {showConfetti && <Confetti />}

      <h1 className="mb-2 text-2xl font-semibold text-ink">{tq.title}</h1>
      <p className="mb-6 text-sm text-slate-500">
        {QUESTION_COUNT} {tq.subtitleSuffix}
      </p>

      {stage === "intro" && (
        <div className="iq-anim-bounce rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-ink">{tq.howItWorksTitle}</h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-600">
            <li>• {QUESTION_COUNT} {tq.bullet1Suffix}</li>
            <li>• {tq.bullet2}</li>
            <li>• {tq.bullet3}</li>
          </ul>
          <div className="mt-4 rounded-xl border border-slate-200 bg-brand-50 p-3.5">
            <p className="text-sm leading-relaxed text-slate-600">
              <strong className="font-medium text-slate-700">{tq.noteLabel}</strong> {tq.note}
            </p>
          </div>
          <button
            type="button"
            onClick={startQuiz}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-soft transition hover:scale-[1.02] hover:bg-brand-700 active:scale-95"
          >
            {tq.startCta}
          </button>
        </div>
      )}

      {stage === "quiz" && question && questionText && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-500">
              <span>
                {tq.questionPrefix} {step + 1} / {total}
              </span>
              <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-brand-700">
                {CATEGORY_LABELS[question.category]}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-500 ease-out"
                style={{ width: `${((step + 1) / total) * 100}%` }}
              />
            </div>
          </div>

          <div key={question.id} className="iq-anim-question">
            <p className="text-base font-medium leading-relaxed text-ink">{questionText.prompt}</p>

            {question.grid && (
              <div className="mt-4 grid w-fit grid-cols-3 gap-2">
                {question.grid.flat().map((cell, i) => (
                  <div
                    key={i}
                    className="flex h-16 w-20 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-lg font-medium text-slate-700"
                  >
                    {cell}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-5 space-y-2">
              {questionText.options.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectOption(i)}
                  className={`block w-full rounded-xl border px-4 py-2.5 text-left text-sm font-medium transition ${
                    selected === i
                      ? "border-brand-500 bg-brand-50 text-brand-700 scale-[1.01]"
                      : "border-slate-200 text-slate-600 hover:border-brand-300 hover:bg-slate-50"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={goPrev}
              disabled={step === 0}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
            >
              {tq.prevCta}
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={selected === null}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:scale-[1.02] hover:bg-brand-700 disabled:opacity-50 disabled:hover:scale-100 active:scale-95"
            >
              {step < total - 1 ? tq.nextCta : tq.seeResultCta}
            </button>
          </div>
        </div>
      )}

      {stage === "result" && resultPhase !== "revealed" && (
        <div className="iq-anim-pop rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-soft">
          {resultPhase === "pending" ? (
            <>
              <p className="text-5xl leading-none">🎯</p>
              <p className="mt-4 text-base font-medium text-slate-600">{tq.quizCompleteLabel}</p>
              <button
                type="button"
                onClick={revealScore}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:scale-[1.02] hover:bg-brand-700 active:scale-95"
              >
                🔮 {tq.seeScoreCta}
              </button>
            </>
          ) : (
            <>
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border-4 border-brand-100 border-t-brand-600 iq-anim-spin" />
              <p className="mt-4 text-base font-medium text-slate-600">{tq.calculatingLabel}</p>
              <div className="mx-auto mt-4 h-2 w-48 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-full origin-left rounded-full bg-gradient-to-r from-brand-400 to-brand-600 iq-anim-progress" />
              </div>
            </>
          )}
        </div>
      )}

      {stage === "result" && resultPhase === "revealed" && (
        <div className="space-y-5">
          <div
            className={`iq-anim-pop rounded-2xl bg-gradient-to-br ${band.gradient} p-6 text-center shadow-soft-lg sm:p-10`}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-white/70">{tq.yourResult}</p>

            <p className="mt-3 text-6xl leading-none">{band.badgeEmoji}</p>

            <p className="mt-4 text-3xl font-black text-white sm:text-4xl">
              {tq.scoreLabel} {formatRange(band.range)} {tq.iqSuffix}
            </p>

            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur">
              {band.badgeEmoji} {badgeTitle}
            </span>

            <p className="mx-auto mt-5 max-w-sm text-base font-semibold text-white">
              {tq.topPercentPrefix} {band.topPercent}{tq.topPercentSuffix}
            </p>

            <div className="mt-7 flex justify-center">
              <ShareButton tq={tq} band={band} correctCount={correctCount} total={total} />
            </div>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowDetails((v) => !v)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              {showDetails ? `▲ ${tq.hideDetailsCta}` : `▼ ${tq.seeDetailsCta}`}
            </button>
          </div>

          {showDetails && (
            <div className="iq-anim-bounce space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
              <h3 className="text-sm font-semibold text-ink">{tq.detailsTitle}</h3>
              {questions.map((q, i) => {
                const qt = tq.questions[q.id as keyof typeof tq.questions];
                const userAnswer = answers[i];
                const isCorrect = userAnswer === q.correctIndex;
                return (
                  <div key={q.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-relaxed text-ink">
                        {i + 1}. {qt.prompt}
                      </p>
                      <span className={`shrink-0 text-base ${isCorrect ? "text-emerald-600" : "text-red-500"}`}>
                        {isCorrect ? "✓" : "✗"}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-slate-500">
                      {tq.yourAnswerLabel} {userAnswer !== null ? qt.options[userAnswer] : "—"}
                    </p>
                    {!isCorrect && (
                      <p className="mt-0.5 text-xs text-emerald-700">
                        {tq.correctAnswerLabel} {qt.options[q.correctIndex]}
                      </p>
                    )}
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{qt.explanation}</p>
                  </div>
                );
              })}
            </div>
          )}

          <div className="text-center">
            <button
              type="button"
              onClick={restart}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-soft transition hover:scale-[1.02] hover:bg-brand-700 active:scale-95"
            >
              🔀 {tq.playAgainCta.replace("{count}", String(QUESTION_COUNT))}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
