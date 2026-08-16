"use client";

import { useState, type FormEvent } from "react";
import styles from "@/app/landing.module.css";
import FaqAccordion from "@/components/FaqAccordion";
import { useLocale } from "@/components/LocaleProvider";
import { trackEvent } from "@/lib/analytics";

type Category = "question" | "request" | "problem" | "other";
type SendState = "idle" | "sending" | "sent" | "error";

export default function SupportPage() {
  const { t } = useLocale();
  const ts = t.tools.support;

  const CATEGORIES: { value: Category; label: string; placeholder: string }[] = [
    { value: "question", label: ts.categoryQuestion, placeholder: ts.placeholderQuestion },
    { value: "request", label: ts.categoryRequest, placeholder: ts.placeholderRequest },
    { value: "problem", label: ts.categoryProblem, placeholder: ts.placeholderProblem },
    { value: "other", label: ts.categoryOther, placeholder: ts.placeholderOther },
  ];

  const [category, setCategory] = useState<Category>("question");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<SendState>("idle");
  const [error, setError] = useState<string | null>(null);

  const activePlaceholder = CATEGORIES.find((c) => c.value === category)?.placeholder ?? "";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!message.trim() || state === "sending") return;

    setState("sending");
    setError(null);

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim(), email: email.trim() || undefined, category }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? ts.sendFailedDefault);
        setState("error");
        return;
      }

      trackEvent("contact_form_submit", { category });
      setState("sent");
      setMessage("");
      setEmail("");
    } catch {
      setError(ts.sendFailedNetwork);
      setState("error");
    }
  }

  return (
    <>
      <h1 className={styles.sectionTitle} style={{ fontSize: 30, textAlign: "left" }}>
        {ts.pageTitle}
      </h1>
      <p className={styles.heroSubtitle} style={{ textAlign: "left", margin: "10px 0 0", maxWidth: 560 }}>
        {ts.pageSubtitle}
      </p>

      <section className={styles.supportSection} style={{ marginTop: 40 }}>
        <h2 className={styles.supportSectionTitle}>{ts.faqTitle}</h2>
        <p className={styles.supportSectionSubtitle}>{ts.faqSubtitle}</p>
        <FaqAccordion items={ts.faq} defaultOpenIndex={null} />
      </section>

      <section className={styles.supportSection}>
        <h2 className={styles.supportSectionTitle}>{ts.formTitle}</h2>
        <p className={styles.supportSectionSubtitle}>{ts.formSubtitle}</p>

        {state === "sent" ? (
          <div className={styles.modalConfirm}>
            ✅ {ts.sentConfirm}
            <div style={{ marginTop: 14 }}>
              <button type="button" className={styles.btnSecondary} onClick={() => setState("idle")}>
                {ts.sendAnother}
              </button>
            </div>
          </div>
        ) : (
          <form className={styles.modalForm} onSubmit={handleSubmit} style={{ maxWidth: 576 }}>
            <div>
              <label className={styles.fieldLabel}>{ts.categoryLabel}</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCategory(c.value)}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                      category === c.value
                        ? "border-brand-500 bg-brand-50 text-brand-700"
                        : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={styles.fieldLabel} htmlFor="support-message">
                {ts.messageLabel}
              </label>
              <textarea
                id="support-message"
                className={styles.textarea}
                placeholder={activePlaceholder}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                maxLength={4000}
              />
            </div>

            <div>
              <label className={styles.fieldLabel} htmlFor="support-email">
                {ts.emailLabel}
              </label>
              <input
                id="support-email"
                type="email"
                className={styles.modalInput}
                placeholder={ts.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {error && <p style={{ color: "#DC2626", fontSize: 13.5 }}>{error}</p>}

            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={!message.trim() || state === "sending"}
              style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              {state === "sending" && (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              )}
              {state === "sending" ? ts.sending : ts.sendCta}
            </button>
          </form>
        )}
      </section>
    </>
  );
}
