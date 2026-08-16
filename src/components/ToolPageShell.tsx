import Link from "next/link";
import type { ReactNode } from "react";
import styles from "@/app/landing.module.css";
import { poppins, inter } from "@/lib/fonts";
import LandingHeader from "@/components/LandingHeader";
import LandingFooter from "@/components/LandingFooter";
import AdBanner from "@/components/AdBanner";
import ProUpsellNote from "@/components/ProUpsellNote";
import SidebarAdColumns from "@/components/SidebarAdColumns";
import Breadcrumb from "@/components/Breadcrumb";

export default function ToolPageShell({ children }: { children: ReactNode }) {
  return (
    <div className={`${styles.page} ${poppins.variable} ${inter.variable}`}>
      <LandingHeader />

      <section className={styles.section} style={{ paddingTop: 32 }}>
        <div className={styles.wrap}>
          <Breadcrumb />
          <Link
            href="/"
            className={styles.linkButton}
            style={{ display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 24 }}
          >
            ← Retour à l&apos;accueil
          </Link>

          <div
            style={{
              background: "var(--white)",
              border: "1px solid var(--line)",
              borderRadius: 20,
              padding: "40px 32px",
              boxShadow: "0 16px 32px -18px rgba(32, 41, 31, 0.16)",
            }}
          >
            {children}
          </div>

          <AdBanner slot="tool-result" className="mx-auto mt-6" />
          <ProUpsellNote />
        </div>
      </section>

      <LandingFooter />
      <SidebarAdColumns />
    </div>
  );
}
