/**
 * Data cleanup/formatting helpers, entirely local/offline — no Groq call,
 * no network round-trip, no token cost. Operates on data pasted from
 * Excel/CSV (tab-separated cells, newline-separated rows), transforming
 * cell-by-cell so tab structure is preserved.
 */

export type CaseMode = "none" | "upper" | "lower" | "proper";
export type DecimalMode = "none" | "dot-to-comma" | "comma-to-dot";

export interface CleanOptions {
  trim: boolean;
  caseMode: CaseMode;
  decimalMode: DecimalMode;
  dedupe: boolean;
}

export const DEFAULT_CLEAN_OPTIONS: CleanOptions = {
  trim: false,
  caseMode: "none",
  decimalMode: "none",
  dedupe: false,
};

export interface CleanResult {
  output: string;
  lineCount: number;
  duplicatesRemoved: number;
}

function splitLines(text: string): string[] {
  return text.split(/\r\n|\r|\n/);
}

/** Collapses runs of whitespace to a single space and trims the ends. */
function trimCell(cell: string): string {
  return cell.trim().replace(/\s+/g, " ");
}

/** "jean-pierre DUPONT" -> "Jean-Pierre Dupont" — capitalizes after spaces, hyphens and apostrophes. */
function toProperCase(cell: string): string {
  return cell.toLowerCase().replace(/(^|[\s'-])(\p{L})/gu, (_, sep, letter) => sep + letter.toUpperCase());
}

function applyCase(cell: string, mode: CaseMode): string {
  switch (mode) {
    case "upper":
      return cell.toUpperCase();
    case "lower":
      return cell.toLowerCase();
    case "proper":
      return toProperCase(cell);
    default:
      return cell;
  }
}

/**
 * Swaps the decimal separator inside number-shaped tokens only (a digit
 * immediately on both sides of the `.`/`,`), so free text containing
 * sentences or comma-separated lists isn't touched. Does not attempt to
 * distinguish thousands separators from decimal ones.
 */
function applyDecimalMode(cell: string, mode: DecimalMode): string {
  if (mode === "dot-to-comma") return cell.replace(/(\d)\.(\d)/g, "$1,$2");
  if (mode === "comma-to-dot") return cell.replace(/(\d),(\d)/g, "$1.$2");
  return cell;
}

function processCell(cell: string, options: CleanOptions): string {
  let result = cell;
  if (options.trim) result = trimCell(result);
  result = applyCase(result, options.caseMode);
  result = applyDecimalMode(result, options.decimalMode);
  return result;
}

/**
 * Applies the selected transformations to pasted spreadsheet data, cell by
 * cell (splitting on tabs) so multi-column pastes keep their structure,
 * then optionally removes duplicate lines (exact match, first occurrence
 * kept, order preserved).
 */
export function cleanData(input: string, options: CleanOptions): CleanResult {
  if (!input) return { output: "", lineCount: 0, duplicatesRemoved: 0 };

  let lines = splitLines(input).map((line) => line.split("\t").map((cell) => processCell(cell, options)).join("\t"));

  let duplicatesRemoved = 0;
  if (options.dedupe) {
    const seen = new Set<string>();
    const deduped: string[] = [];
    for (const line of lines) {
      if (seen.has(line)) {
        duplicatesRemoved++;
        continue;
      }
      seen.add(line);
      deduped.push(line);
    }
    lines = deduped;
  }

  return { output: lines.join("\n"), lineCount: lines.length, duplicatesRemoved };
}
