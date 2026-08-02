export interface ParsedTable {
  /** Row 0 is the header; every row has the same number of cells as the header. */
  rows: string[][];
}

const ROW_RE = /^\s*\|(.+)\|\s*$/;
const SEPARATOR_RE = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/;

function splitRow(line: string): string[] {
  const match = line.match(ROW_RE);
  const inner = match ? match[1] : line;
  return inner.split("|").map((cell) => cell.trim());
}

/**
 * Extracts every GitHub-flavored markdown table found in a chat message.
 * Used to offer a "download as .xlsx" button when the assistant's reply
 * contains a table the user would plausibly want in Excel.
 */
export function parseMarkdownTables(content: string): ParsedTable[] {
  const lines = content.split("\n");
  const tables: ParsedTable[] = [];

  for (let i = 0; i < lines.length - 1; i++) {
    const headerLine = lines[i];
    const separatorLine = lines[i + 1];

    if (!ROW_RE.test(headerLine) || !SEPARATOR_RE.test(separatorLine)) continue;

    const header = splitRow(headerLine);
    const rows: string[][] = [header];

    let j = i + 2;
    while (j < lines.length && ROW_RE.test(lines[j])) {
      const cells = splitRow(lines[j]);
      // Pad/truncate so every row lines up with the header for a clean sheet.
      rows.push(Array.from({ length: header.length }, (_, k) => cells[k] ?? ""));
      j++;
    }

    if (rows.length > 1) {
      tables.push({ rows });
    }
    i = j - 1;
  }

  return tables;
}
