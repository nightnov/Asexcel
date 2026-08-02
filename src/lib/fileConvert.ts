/**
 * Converts a spreadsheet sheet to PDF / CSV / JSON entirely client-side
 * (SheetJS + jsPDF) — no network call, no server, no token cost. Mirrors the
 * local-processing philosophy of the other free tools.
 */

async function readWorkbook(file: File) {
  const XLSX = await import("xlsx");
  const isCsv = file.name.toLowerCase().endsWith(".csv");
  const workbook = isCsv
    ? XLSX.read(await file.text(), { type: "string" })
    : XLSX.read(await file.arrayBuffer(), { type: "array" });
  return { XLSX, workbook };
}

export async function getSheetNames(file: File): Promise<string[]> {
  const { workbook } = await readWorkbook(file);
  return workbook.SheetNames;
}

export interface SheetData {
  headers: string[];
  rows: string[][];
}

export async function extractSheetData(file: File, sheetName: string): Promise<SheetData> {
  const { XLSX, workbook } = await readWorkbook(file);
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return { headers: [], rows: [] };

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet as never, {
    header: 1,
    blankrows: false,
    defval: "",
  });

  const headers = (rows[0] ?? []).map((h) => String(h ?? "").trim() || "(sans titre)");
  const dataRows = rows.slice(1).map((row) => headers.map((_, i) => String(row[i] ?? "")));

  return { headers, rows: dataRows };
}

function baseNameOf(fileName: string): string {
  const idx = fileName.lastIndexOf(".");
  return idx === -1 ? fileName : fileName.slice(0, idx);
}

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------

export type CsvSeparator = "," | ";";

function csvEscape(value: string, separator: CsvSeparator): string {
  if (value.includes(separator) || value.includes('"') || value.includes("\n") || value.includes("\r")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildCsvText(data: SheetData, separator: CsvSeparator): string {
  const lines = [data.headers, ...data.rows].map((row) =>
    row.map((cell) => csvEscape(cell, separator)).join(separator)
  );
  return lines.join("\r\n");
}

export function buildCsvBlob(data: SheetData, separator: CsvSeparator): Blob {
  return new Blob([buildCsvText(data, separator)], { type: "text/csv;charset=utf-8;" });
}

// ---------------------------------------------------------------------------
// JSON
// ---------------------------------------------------------------------------

export function buildJsonObjects(data: SheetData): Record<string, string>[] {
  return data.rows.map((row) => {
    const obj: Record<string, string> = {};
    data.headers.forEach((header, i) => {
      obj[header] = row[i] ?? "";
    });
    return obj;
  });
}

export function buildJsonText(data: SheetData): string {
  return JSON.stringify(buildJsonObjects(data), null, 2);
}

export function buildJsonBlob(data: SheetData): Blob {
  return new Blob([buildJsonText(data)], { type: "application/json;charset=utf-8;" });
}

// ---------------------------------------------------------------------------
// PDF
// ---------------------------------------------------------------------------

export async function buildPdfBlob(data: SheetData, title: string): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ orientation: data.headers.length > 6 ? "landscape" : "portrait" });

  doc.setFontSize(14);
  doc.text(title, 14, 15);

  autoTable(doc, {
    head: [data.headers],
    body: data.rows,
    startY: 20,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [79, 129, 189] },
  });

  return doc.output("blob");
}

// ---------------------------------------------------------------------------
// Downloads
// ---------------------------------------------------------------------------

export function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function outputFileName(sourceFileName: string, extension: "pdf" | "csv" | "json"): string {
  return `${baseNameOf(sourceFileName)}.${extension}`;
}
