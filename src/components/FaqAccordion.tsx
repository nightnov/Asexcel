"use client";

import { useState } from "react";
import styles from "@/app/landing.module.css";

export interface FaqItem {
  q: string;
  a: string;
}

export default function FaqAccordion({ items, defaultOpenIndex = 0 }: { items: FaqItem[]; defaultOpenIndex?: number | null }) {
  const [openIndex, setOpenIndex] = useState<number | null>(defaultOpenIndex);

  return (
    <div className={styles.faqList}>
      {items.map((item, i) => {
        const open = openIndex === i;
        return (
          <div className={styles.faqItem} key={item.q}>
            <button
              type="button"
              className={styles.faqQuestion}
              onClick={() => setOpenIndex(open ? null : i)}
              aria-expanded={open}
            >
              {item.q}
              <span className={`${styles.faqIcon} ${open ? styles.faqIconOpen : ""}`}>+</span>
            </button>
            <div className={`${styles.faqAnswer} ${open ? styles.faqAnswerOpen : ""}`}>
              <div className={styles.faqAnswerInner}>{item.a}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
