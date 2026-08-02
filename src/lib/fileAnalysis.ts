/**
 * Client-side Excel/CSV structure extraction (SheetJS) — no network call,
 * no server upload, no token cost. Produces a compact text summary of the
 * file's shape (headers, row/column counts, a short preview) to hand to
 * the AI as extra context, instead of shipping the raw file to the backend.
 */

const MAX_PREVIEW_ROWS = 5;
const MAX_COLUMNS_IN_SUMMARY = 25;
const MAX_CELL_CHARS = 60;

export interface FileAnalysis {
  fileName: string;
  sheetNames: string[];
  headers: string[];
  rowCount: number;
  columnCount: number;
  /** Formatted block to prepend to the user's question when calling the AI. */
  contextText: string;
}

function truncateCell(value: unknown, max: number): string {
  const text = String(value ?? "").trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function buildMarkdownPreview(headers: string[], previewRows: string[][]): string {
  const headerLine = `| ${headers.join(" | ")} |`;
  const separatorLine = `| ${headers.map(() => "---").join(" | ")} |`;
  const rowLines = previewRows.map((row) => `| ${row.join(" | ")} |`);
  return [headerLine, separatorLine, ...rowLines].join("\n");
}

/**
 * Reads a spreadsheet/CSV file entirely in the browser and extracts its
 * structure. Throws if the file can't be parsed (corrupted, password
 * protected, unsupported binary format) — callers should show a friendly
 * error rather than silently failing.
 */
export async function analyzeSpreadsheetFile(file: File): Promise<FileAnalysis> {
  const XLSX = await import("xlsx");

  const isCsv = file.name.toLowerCase().endsWith(".csv");
  const workbook = isCsv
    ? XLSX.read(await file.text(), { type: "string" })
    : XLSX.read(await file.arrayBuffer(), { type: "array" });

  const sheetNames = workbook.SheetNames;
  const firstSheet = workbook.Sheets[sheetNames[0]];
  if (!firstSheet) {
    throw new Error("Aucune feuille de calcul trouvée dans ce fichier.");
  }

  const rows = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, {
    header: 1,
    blankrows: false,
    defval: "",
  });

  const rawHeaders = (rows[0] ?? []).map((h) => String(h ?? "").trim() || "(sans titre)");
  const headers = rawHeaders.slice(0, MAX_COLUMNS_IN_SUMMARY);
  const dataRows = rows.slice(1);
  const rowCount = dataRows.length;
  const columnCount = rawHeaders.length;

  const previewRows = dataRows
    .slice(0, MAX_PREVIEW_ROWS)
    .map((row) => headers.map((_, i) => truncateCell(row[i], MAX_CELL_CHARS)));

  const truncatedColumnsNote = columnCount > headers.length ? ` (+${columnCount - headers.length} autres)` : "";
  const sheetsNote =
    sheetNames.length > 1 ? ` (parmi ${sheetNames.length} feuilles : ${sheetNames.join(", ")})` : "";

  const contextText = `[Fichier joint : ${file.name}]
Feuille analysée : ${sheetNames[0]}${sheetsNote}
Colonnes (${columnCount})${truncatedColumnsNote} : ${headers.join(", ")}
Lignes de données : ${rowCount}
Aperçu des ${previewRows.length} premières lignes :
${buildMarkdownPreview(headers, previewRows)}`;

  return { fileName: file.name, sheetNames, headers: rawHeaders, rowCount, columnCount, contextText };
}
