"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "@/app/landing.module.css";
import AuthModal from "@/components/AuthModal";
import { useLocale } from "@/components/LocaleProvider";
import { useSupabaseUser } from "@/lib/useSupabaseUser";
import { AUTH_DISABLED } from "@/lib/dev-auth";
import { createClient } from "@/lib/supabase/client";

export default function LandingHeader() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { t } = useLocale();
  const router = useRouter();
  const { user, loading } = useSupabaseUser();

  async function handleLogout() {
    if (AUTH_DISABLED) return;
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

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
              <>
                <Link href="/compte" className={styles.linkButton}>
                  {t.nav.monCompte}
                </Link>
                <button type="button" onClick={handleLogout} className={styles.navBtnPrimary}>
                  {t.nav.seDeconnecter}
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className={styles.linkButton}>
                  {t.nav.seConnecter}
                </Link>
                <button type="button" onClick={() => setAuthModalOpen(true)} className={styles.navBtnPrimary}>
                  {t.nav.sInscrire}
                </button>
              </>
            )}
          </div>
        </div>
      </header>
      {/* Reserves the header's height in normal flow now that it's `fixed`
          (and therefore no longer taking up space itself), so page content
          never starts underneath it. */}
      <div className={styles.headerSpacer} aria-hidden="true" />

      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}
