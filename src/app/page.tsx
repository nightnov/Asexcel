"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Sparkles, Wrench, ListChecks, LifeBuoy, ArrowRight, type LucideIcon } from "lucide-react";
import styles from "./landing.module.css";
import { poppins, inter } from "@/lib/fonts";
import LandingHeader from "@/components/LandingHeader";
import LandingFooter from "@/components/LandingFooter";
import FaqAccordion from "@/components/FaqAccordion";
import { useLocale } from "@/components/LocaleProvider";
import type { Dictionary } from "@/lib/i18n/dictionaries";

type ToolCat = "clean" | "translate" | "files" | "ia" | "fun" | "support";

/** The 4 dashboard groups the tool grid is organized under (see groupOf below). */
type ToolGroup = "ai" | "files" | "fun" | "support";
const GROUP_ORDER: ToolGroup[] = ["ai", "files", "fun", "support"];
const GROUP_META: Record<ToolGroup, { icon: LucideIcon; iconClass: string }> = {
  ai: { icon: Sparkles, iconClass: "bg-emerald-50 text-emerald-600" },
  files: { icon: Wrench, iconClass: "bg-slate-100 text-slate-600" },
  fun: { icon: ListChecks, iconClass: "bg-slate-100 text-slate-600" },
  support: { icon: LifeBuoy, iconClass: "bg-emerald-50 text-emerald-600" },
};

/** "ia" -> AI-powered tools, "fun" -> tests/games, "support" -> its own trust-building
 * section, everything else (clean/translate/files) -> plain utilities. */
function groupOf(cat: ToolCat): ToolGroup {
  if (cat === "ia") return "ai";
  if (cat === "fun") return "fun";
  if (cat === "support") return "support";
  return "files";
}

interface Tool {
  id: string;
  title: string;
  description: string;
  cat: ToolCat;
  /**
   * Path to a custom icon asset (drop the file in /public/icons, e.g.
   * "/icons/my-tool.png", or reference any file under /public directly).
   * PNG, SVG and JPG all work. Every icon renders inside a fixed 68x68
   * badge with `object-fit: contain` (see .toolIconWrap in
   * landing.module.css), so images of any source resolution or aspect
   * ratio are scaled uniformly and never distort or overflow — but for a
   * crisp result, export a roughly square image (ideally close to 1:1,
   * e.g. 96x96 to 512x512) with the visual content filling most of the
   * frame; a large empty margin around the artwork will make it look
   * small relative to the other icons even though the box size matches.
   * `null` renders the dashed "+" placeholder instead.
   */
  icon: string | null;
  anim: string;
  href: string;
  dashed?: boolean;
  badge?: string;
}

/** Builds the translated tool cards. Icon/anim/href/id/cat stay static —
 * only the title/description are locale-dependent. */
function buildTools(t: Dictionary): Tool[] {
  const ht = t.home.tools;
  return [
    { id: "nettoyage", title: ht.nettoyage.title, description: ht.nettoyage.description, cat: "clean", icon: "/icons/nettoyage.png", anim: "wiggle", href: "/outils/nettoyeur" },
    { id: "traduction", title: ht.traduction.title, description: ht.traduction.description, cat: "translate", icon: "/icons/traduction.png", anim: "pulse", href: "/outils/formules" },
    { id: "conversion", title: ht.conversion.title, description: ht.conversion.description, cat: "files", icon: "/icons/conversion.png", anim: "bounce", href: "/outils/convertisseur" },
    { id: "comparaison", title: ht.comparaison.title, description: ht.comparaison.description, cat: "files", icon: "/icons/comparaison.png", anim: "slide", href: "/outils/comparateur" },
    { id: "fusion", title: ht.fusion.title, description: ht.fusion.description, cat: "files", icon: "/icons/fusion.png", anim: "compress", href: "/outils/fusionneur" },
    { id: "division", title: ht.division.title, description: ht.division.description, cat: "files", icon: "/icons/division.png", anim: "compress", href: "/outils/diviseur" },
    { id: "assistance-ia", title: ht.assistanceIa.title, description: ht.assistanceIa.description, cat: "ia", icon: "/icons/assistance-ia.png", anim: "shimmy", href: "/chat" },
    { id: "generateur-formules", title: ht.generateurFormules.title, description: ht.generateurFormules.description, cat: "ia", icon: "/icons/generateur.png", anim: "shimmy", href: "/outils/generateur-formules" },
    { id: "securite", title: ht.securite.title, description: ht.securite.description, cat: "files", icon: "/icons/securite.png", anim: "wiggle", href: "/outils/securite" },
    { id: "test-qi", title: ht.testQi.title, description: ht.testQi.description, cat: "fun", icon: "/test-qi.png", anim: "pulse", href: "/outils/test-qi", badge: t.home.badgeNouveau },
    { id: "support", title: ht.support.title, description: ht.support.description, cat: "support", icon: "/icons/support.png", anim: "pulse", href: "/outils/support" },
  ];
}

function buildFilters(t: Dictionary): { label: string; value: "tout" | ToolCat }[] {
  const f = t.home.filters;
  return [
    { label: f.tout, value: "tout" },
    { label: f.clean, value: "clean" },
    { label: f.translate, value: "translate" },
    { label: f.files, value: "files" },
    { label: f.ia, value: "ia" },
    { label: f.fun, value: "fun" },
    { label: f.support, value: "support" },
  ];
}

const MOCK_ROWS_DIRTY = [
  { nom: "jean DUPONT", montant: "$1,240.00", clean: false },
  { nom: "marie martin", montant: "$860.00", clean: false },
  { nom: "JEAN dupont", montant: "$1,240.00", clean: false },
];

const MOCK_ROWS_CLEAN = [
  { nom: "Jean Dupont", montant: "$1,240.00", clean: true },
  { nom: "Marie Martin", montant: "$860.00", clean: true },
  { nom: "Jean Dupont", montant: "$1,240.00", clean: true },
];

function MockSheet() {
  const { t } = useLocale();
  const [clean, setClean] = useState(true);
  const [fading, setFading] = useState(false);
  const [flash, setFlash] = useState(false);
  const swapTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Always oscillates, regardless of prefers-reduced-motion: this is the
  // product demo itself (informational), not a decorative flourish - only
  // the hover micro-animations on the tool icons respect reduced motion.
  // Sequence: dim the cells out (250ms) -> swap the text while still dimmed
  // -> fade back in with a soft yellow highlight that lingers briefly.
  useEffect(() => {
    const interval = setInterval(() => {
      setFading(true);
      swapTimeout.current = setTimeout(() => {
        setClean((prev) => !prev);
        setFading(false);
        setFlash(true);
        if (flashTimeout.current) clearTimeout(flashTimeout.current);
        flashTimeout.current = setTimeout(() => setFlash(false), 700);
      }, 250);
    }, 2200);
    return () => {
      clearInterval(interval);
      if (swapTimeout.current) clearTimeout(swapTimeout.current);
      if (flashTimeout.current) clearTimeout(flashTimeout.current);
    };
  }, []);

  const rows = clean ? MOCK_ROWS_CLEAN : MOCK_ROWS_DIRTY;
  const cellClassName = fading ? styles.cellFading : flash ? styles.cellFlash : undefined;

  return (
    <div className={styles.mockWrap}>
      <div className={styles.mockCard}>
        <div className={styles.mockFormulaBar}>
          <span className={styles.mockFx}>fx</span>
          <span className={styles.mockFormula}>=NETTOYER(A1:A3)</span>
        </div>
        <div className={styles.mockTableBox}>
          <table className={styles.mockTable}>
            <colgroup>
              <col className={styles.colNom} />
              <col className={styles.colMontant} />
              <col className={styles.colStatut} />
            </colgroup>
            <thead>
              <tr>
                <th>NOM</th>
                <th>MONTANT</th>
                <th>STATUT</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  <td className={cellClassName}>{row.nom}</td>
                  <td className={cellClassName}>{row.montant}</td>
                  <td className={cellClassName}>{row.clean ? "✓" : "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className={styles.mockStatusLine}>
            <span className={styles.mockStatusDot} />
            {clean ? t.home.mockSheet.clean : t.home.mockSheet.cleaning}
          </div>
        </div>
      </div>
    </div>
  );
}

function SupportHighlightCard({ tool }: { tool: Tool }) {
  const { t } = useLocale();
  return (
    <Link href={tool.href} className={styles.supportCard}>
      <span className={styles.supportIconWrap}>
        <LifeBuoy className="h-6 w-6" strokeWidth={2} aria-hidden="true" />
      </span>
      <span className={styles.supportBody}>
        <span className={styles.supportCardTitle}>{tool.title}</span>
        <span className={styles.supportCardDesc}>{tool.description}</span>
      </span>
      <span className={styles.supportCardCta}>
        {t.home.supportCta}
        <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
      </span>
    </Link>
  );
}

function ToolCard({ tool, index }: { tool: Tool; index: number }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [visible, setVisible] = useState(false);
  // If a custom icon path is wrong or the asset is missing, fall back to the
  // "+" placeholder style instead of showing a broken-image glyph.
  const [iconFailed, setIconFailed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    // Safety net: the fade-in-on-scroll effect below is a nice-to-have, not
    // something core content should ever be permanently hidden behind. If
    // IntersectionObserver never fires for any reason (unsupported, blocked,
    // a ref/timing edge case), force the card visible shortly after mount
    // regardless.
    const fallback = setTimeout(() => setVisible(true), 500);

    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return () => clearTimeout(fallback);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            clearTimeout(fallback);
            setTimeout(() => setVisible(true), index * 40);
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      clearTimeout(fallback);
    };
  }, [index]);

  return (
    <Link
      ref={ref}
      href={tool.href}
      data-cat={tool.cat}
      data-anim={tool.anim || undefined}
      className={`${styles.toolCard} ${visible ? styles.reveal : ""} ${tool.dashed ? styles.toolCardDashed : ""}`}
    >
      {tool.badge && <span className={styles.toolBadge}>{tool.badge}</span>}
      {tool.icon && !iconFailed ? (
        <span className={styles.toolIconWrap}>
          <img src={tool.icon} alt="" onError={() => setIconFailed(true)} />
        </span>
      ) : (
        <span className={styles.toolIconPlus}>+</span>
      )}
      <h3 className={styles.toolTitle}>{tool.title}</h3>
      <p className={styles.toolDesc}>{tool.description}</p>
    </Link>
  );
}

export default function HomePage(): ReactNode {
  const [filter, setFilter] = useState<"tout" | ToolCat>("tout");
  const { t } = useLocale();

  const TOOLS = buildTools(t);
  const FILTERS = buildFilters(t);
  const visibleTools = filter === "tout" ? TOOLS : TOOLS.filter((tool) => tool.cat === filter);

  return (
    <div className={`${styles.page} ${poppins.variable} ${inter.variable}`}>
      <LandingHeader />

      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>
          {t.hero.titleStart}
          <span className={styles.accent}>{t.hero.titleHighlight}</span>
          {t.hero.titleEnd}
        </h1>
        <p className={styles.heroSubtitle}>
          {t.hero.subtitleStart}
          <span className={styles.accent}>{t.hero.subtitleHighlight}</span>
          {t.hero.subtitleEnd}
        </p>

        <MockSheet />

        <div className={styles.filters}>
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              data-filter={f.value}
              className={`${styles.pill} ${filter === f.value ? styles.pillActive : ""}`}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </section>

      <section id="outils" className={styles.section}>
        <div className={styles.wrap}>
          {filter === "tout" ? (
            (() => {
              let runningIndex = 0;
              return GROUP_ORDER.map((group) => {
                const groupTools = visibleTools.filter((tool) => groupOf(tool.cat) === group);
                if (groupTools.length === 0) return null;
                const startIndex = runningIndex;
                runningIndex += groupTools.length;
                const meta = GROUP_META[group];
                const GroupIcon = meta.icon;
                return (
                  <div key={group} className="mb-10 last:mb-0">
                    <div className="mb-4 inline-flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700">
                      <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${meta.iconClass}`}>
                        <GroupIcon className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                      </span>
                      {t.home.toolGroups[group]}
                    </div>
                    {group === "support" ? (
                      <SupportHighlightCard tool={groupTools[0]} />
                    ) : (
                      <div className={styles.toolsGrid}>
                        {groupTools.map((tool, i) => (
                          <ToolCard tool={tool} index={startIndex + i} key={tool.id} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              });
            })()
          ) : (
            <div className={styles.toolsGrid}>
              {visibleTools.map((tool, i) => (
                <ToolCard tool={tool} index={i} key={tool.id} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="comment-ca-marche" className={`${styles.section} ${styles.sectionAlt}`}>
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>{t.howItWorks.title}</h2>
            <p className={styles.sectionSubtitle}>{t.howItWorks.subtitle}</p>
          </div>
          <div className={styles.stepsGrid}>
            {t.home.steps.map((step, i) => (
              <div className={styles.stepCard} key={step.title}>
                <div className={styles.stepNumber}>{i + 1}</div>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDesc}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className={styles.section}>
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>{t.home.faqTitle}</h2>
          </div>
          <FaqAccordion items={t.home.faq} />
        </div>
      </section>

      <div className={styles.banner}>
        <div className={styles.bannerCopy}>
          <h2 className={styles.bannerTitle}>{t.banner.title}</h2>
          <p className={styles.bannerText}>{t.banner.text}</p>
        </div>
        <Link href="/chat" className={styles.btnOnDark}>
          {t.banner.cta}
        </Link>
      </div>

      <LandingFooter />
    </div>
  );
}
