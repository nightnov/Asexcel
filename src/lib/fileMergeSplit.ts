/**
 * Merge/split Excel & CSV files entirely client-side (SheetJS + JSZip) — no
 * network call, no server, no token cost. Mirrors the local-processing
 * philosophy of the other free tools (formula translator, data cleaner).
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

function sheetToRows(XLSX: Awaited<ReturnType<typeof readWorkbook>>["XLSX"], sheet: unknown) {
  return XLSX.utils.sheet_to_json<unknown[]>(sheet as never, {
    header: 1,
    blankrows: false,
    defval: "",
  });
}

function baseNameOf(fileName: string): string {
  const idx = fileName.lastIndexOf(".");
  return idx === -1 ? fileName : fileName.slice(0, idx);
}

/** Strips characters Excel/most filesystems reject from sheet/file names. */
function sanitizeName(name: string): string {
  return name.replace(/[\\/:*?"<>|[\]]/g, "_").trim() || "feuille";
}

// ---------------------------------------------------------------------------
// Merge
// ---------------------------------------------------------------------------

export interface MergeResult {
  headers: string[];
  rows: string[][];
  fileCount: number;
  totalRows: number;
}

/**
 * Combines the first sheet of every file into one row set. Columns are
 * aligned by header name (not position) across files — the union of every
 * file's headers becomes the merged header row, in first-seen order, so
 * files with slightly different column layouts/orders still merge
 * correctly instead of silently shifting data into the wrong column.
 */
export async function mergeFiles(files: File[]): Promise<MergeResult> {
  const parsedFiles: { headers: string[]; dataRows: unknown[][] }[] = [];
  const headerOrder: string[] = [];
  const seenHeaders = new Set<string>();

  for (const file of files) {
    const { XLSX, workbook } = await readWorkbook(file);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = sheet ? sheetToRows(XLSX, sheet) : [];
    const headers = (rows[0] ?? []).map((h) => String(h ?? "").trim() || "(sans titre)");

    for (const h of headers) {
      if (!seenHeaders.has(h)) {
        seenHeaders.add(h);
        headerOrder.push(h);
      }
    }

    parsedFiles.push({ headers, dataRows: rows.slice(1) });
  }

  const mergedRows: string[][] = [];
  for (const { headers, dataRows } of parsedFiles) {
    const indexByHeader = new Map(headers.map((h, i) => [h, i]));
    for (const row of dataRows) {
      mergedRows.push(
        headerOrder.map((h) => {
          const idx = indexByHeader.get(h);
          return idx === undefined ? "" : String(row[idx] ?? "");
        })
      );
    }
  }

  return { headers: headerOrder, rows: mergedRows, fileCount: files.length, totalRows: mergedRows.length };
}

/** Builds a single-sheet .xlsx Blob from a header row + data rows. */
export async function buildXlsxBlob(
  headers: string[],
  rows: string[][],
  sheetName = "Fusion"
): Promise<Blob> {
  const XLSX = await import("xlsx");
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sanitizeName(sheetName).slice(0, 31));
  const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  return new Blob([buffer], { type: XLSX_MIME });
}

// ---------------------------------------------------------------------------
// Split
// ---------------------------------------------------------------------------

export type SplitMode = "sheet" | "rows";

export interface SplitFile {
  name: string;
  blob: Blob;
}

/** One output file per sheet in the source workbook. */
export async function splitBySheet(file: File): Promise<SplitFile[]> {
  const { XLSX, workbook } = await readWorkbook(file);
  const base = baseNameOf(file.name);

  return workbook.SheetNames.map((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const outWorkbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(outWorkbook, sheet, sanitizeName(sheetName).slice(0, 31));
    const buffer = XLSX.write(outWorkbook, { type: "array", bookType: "xlsx" });
    return { name: `${base}-${sanitizeName(sheetName)}.xlsx`, blob: new Blob([buffer], { type: XLSX_MIME }) };
  });
}

/** Splits the first sheet's data rows into fixed-size chunks, each its own file (header row repeated). */
export async function splitByRowChunks(file: File, chunkSize: number): Promise<SplitFile[]> {
  const { XLSX, workbook } = await readWorkbook(file);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = sheet ? sheetToRows(XLSX, sheet) : [];
  const headers = rows[0] ?? [];
  const dataRows = rows.slice(1);
  const base = baseNameOf(file.name);

  if (dataRows.length === 0) return [];

  const totalChunks = Math.ceil(dataRows.length / chunkSize);
  const results: SplitFile[] = [];

  for (let i = 0; i < totalChunks; i++) {
    const chunkRows = dataRows.slice(i * chunkSize, (i + 1) * chunkSize);
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...chunkRows]);
    const outWorkbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(outWorkbook, worksheet, "Feuille1");
    const buffer = XLSX.write(outWorkbook, { type: "array", bookType: "xlsx" });
    results.push({
      name: `${base}-partie-${i + 1}.xlsx`,
      blob: new Blob([buffer], { type: XLSX_MIME }),
    });
  }

  return results;
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

export async function downloadAsZip(files: SplitFile[], zipFileName: string): Promise<void> {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  for (const f of files) {
    zip.file(f.name, f.blob);
  }
  const blob = await zip.generateAsync({ type: "blob" });
  triggerDownload(blob, zipFileName);
}
