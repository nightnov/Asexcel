"use client";

import { useState } from "react";
import type { ParsedTable } from "@/lib/parseMarkdownTable";
import { useAdInterstitial } from "@/lib/useAdInterstitial";
import AdInterstitialModal from "@/components/AdInterstitialModal";

interface ExportXlsxButtonProps {
  table: ParsedTable;
  index: number;
}

export default function ExportXlsxButton({ table, index }: ExportXlsxButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const adInterstitial = useAdInterstitial();

  async function handleExport() {
    setIsExporting(true);
    try {
      // Loaded on demand: xlsx is only needed when a table is actually
      // downloaded, no reason to ship it in the initial chat bundle.
      const XLSX = await import("xlsx");
      const worksheet = XLSX.utils.aoa_to_sheet(table.rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Feuille1");
      XLSX.writeFile(workbook, `asecxel-tableau-${index + 1}.xlsx`);
      adInterstitial.trigger();
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleExport}
        disabled={isExporting}
        className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 transition hover:bg-brand-100 disabled:opacity-60"
      >
        {isExporting ? "Génération..." : "📥 Télécharger en .xlsx"}
      </button>
      <AdInterstitialModal open={adInterstitial.open} onClose={adInterstitial.close} />
    </>
  );
}
