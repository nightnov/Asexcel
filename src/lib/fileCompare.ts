/**
 * Compares two spreadsheet files cell-by-cell, entirely client-side (SheetJS)
 * — no network call, no server, no token cost. Mirrors the local-processing
 * philosophy of the other free tools (fusionneur, nettoyeur, traducteur).
 */

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

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

/** Converts a 1-based column index to a spreadsheet-style letter (1 -> A, 27 -> AA). */
export function colLetter(n: number): string {
  let result = "";
  let num = n;
  while (num > 0) {
    const remainder = (num - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    num = Math.floor((num - 1) / 26);
  }
  return result;
}

export type DiffStatus = "unchanged" | "modified" | "added" | "removed";

export interface DiffEntry {
  cellRef: string;
  row: number; // 1-based
  col: number; // 1-based
  oldValue: string;
  newValue: string;
  status: DiffStatus;
}

export interface CompareSummary {
  modified: number;
  added: number;
  removed: number;
  unchanged: number;
}

export interface CompareResult {
  sheetNameA: string;
  sheetNameB: string;
  entries: DiffEntry[];
  summary: CompareSummary;
}

async function sheetGrid(file: File, sheetName: string): Promise<string[][]> {
  const { XLSX, workbook } = await readWorkbook(file);
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet as never, {
    header: 1,
    blankrows: false,
    defval: "",
  });
  return rows.map((row) => row.map((cell) => String(cell ?? "")));
}

export async function compareFiles(
  fileA: File,
  sheetNameA: string,
  fileB: File,
  sheetNameB: string
): Promise<CompareResult> {
  const [gridA, gridB] = await Promise.all([sheetGrid(fileA, sheetNameA), sheetGrid(fileB, sheetNameB)]);

  const totalRows = Math.max(gridA.length, gridB.length);
  const entries: DiffEntry[] = [];
  const summary: CompareSummary = { modified: 0, added: 0, removed: 0, unchanged: 0 };

  for (let r = 0; r < totalRows; r++) {
    const rowA = r < gridA.length ? gridA[r] : null;
    const rowB = r < gridB.length ? gridB[r] : null;
    const totalCols = Math.max(rowA?.length ?? 0, rowB?.length ?? 0);

    for (let c = 0; c < totalCols; c++) {
      const cellRef = `${colLetter(c + 1)}${r + 1}`;
      let status: DiffStatus;
      let oldValue: string;
      let newValue: string;

      if (rowA === null) {
        status = "added";
        oldValue = "";
        newValue = rowB?.[c] ?? "";
      } else if (rowB === null) {
        status = "removed";
        oldValue = rowA?.[c] ?? "";
        newValue = "";
      } else if (c >= rowA.length) {
        status = "added";
        oldValue = "";
        newValue = rowB[c] ?? "";
      } else if (c >= rowB.length) {
        status = "removed";
        oldValue = rowA[c] ?? "";
        newValue = "";
      } else {
        oldValue = rowA[c];
        newValue = rowB[c];
        status = oldValue === newValue ? "unchanged" : "modified";
      }

      summary[status]++;
      entries.push({ cellRef, row: r + 1, col: c + 1, oldValue, newValue, status });
    }
  }

  return { sheetNameA, sheetNameB, entries, summary };
}

export async function buildDiffReportBlob(result: CompareResult): Promise<Blob> {
  const XLSX = await import("xlsx");
  const header = ["Feuille", "Cellule", "Ancienne Valeur", "Nouvelle Valeur", "Statut"];
  const statusLabels: Record<DiffStatus, string> = {
    modified: "Modifié",
    added: "Ajouté",
    removed: "Supprimé",
    unchanged: "Inchangé",
  };

  const rows = result.entries
    .filter((entry) => entry.status !== "unchanged")
    .map((entry) => [
      result.sheetNameB || result.sheetNameA,
      entry.cellRef,
      entry.oldValue,
      entry.newValue,
      statusLabels[entry.status],
    ]);

  const worksheet = XLSX.utils.aoa_to_sheet([header, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Différences");
  const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  return new Blob([buffer], { type: XLSX_MIME });
}

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
