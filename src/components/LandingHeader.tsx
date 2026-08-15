"use client";

import Link from "next/link";
import styles from "@/app/landing.module.css";
import UserMenu from "@/components/UserMenu";
import { useLocale } from "@/components/LocaleProvider";
import { useSupabaseUser } from "@/lib/useSupabaseUser";

export default function LandingHeader() {
  const { t } = useLocale();
  const { user, loading } = useSupabaseUser();

  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.logoLink}>
            <span className={styles.logoBadge}>
              <img src="/logo-transparent.png" alt="Asexcel" />
            </span>
            <span className={`${styles.brandText} ${styles.brandName}`}>Asexcel</span>
          </Link>

          <nav className={styles.nav}>
            <Link href="/#outils">{t.nav.outils}</Link>
            <Link href="/#comment-ca-marche">{t.nav.commentCaMarche}</Link>
            <Link href="/tarifs">{t.nav.tarifs}</Link>
            <Link href="/#faq">{t.nav.faq}</Link>
          </nav>

          <div className={styles.headerActions}>
            {loading ? null : user ? (
              <UserMenu user={user} />
            ) : (
              <>
                <Link href="/login" className={styles.linkButton}>
                  {t.nav.seConnecter}
                </Link>
                <Link href="/inscription" className={styles.navBtnPrimary}>
                  {t.nav.sInscrire}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      {/* Reserves the header's height in normal flow now that it's `fixed`
          (and therefore no longer taking up space itself), so page content
          never starts underneath it. */}
      <div className={styles.headerSpacer} aria-hidden="true" />
    </>
  );
}
