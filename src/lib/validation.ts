export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 Mo

export const ALLOWED_EXTENSIONS = [".xlsx", ".xls", ".csv"] as const;

export const ALLOWED_MIME_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-excel", // .xls
  "text/csv",
  "application/csv",
  "application/vnd.ms-excel.sheet.macroEnabled.12", // .xlsm (still allowed as .xls-family)
] as const;

export interface FileValidationResult {
  ok: boolean;
  error?: string;
}

function getExtension(filename: string): string {
  const idx = filename.lastIndexOf(".");
  return idx === -1 ? "" : filename.slice(idx).toLowerCase();
}

/**
 * Validates an uploaded file against the extension/MIME/size allowlist.
 * MIME type from the browser can be spoofed, so this is a first line of
 * defense, not the only one — treat the file as untrusted downstream too.
 */
export function validateExcelFile(file: File): FileValidationResult {
  const extension = getExtension(file.name);

  if (!ALLOWED_EXTENSIONS.includes(extension as (typeof ALLOWED_EXTENSIONS)[number])) {
    return {
      ok: false,
      error: `Extension non autorisée (${extension || "inconnue"}). Formats acceptés : ${ALLOWED_EXTENSIONS.join(", ")}.`,
    };
  }

  if (file.type && !ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
    return {
      ok: false,
      error: `Type de fichier non autorisé (${file.type}).`,
    };
  }

  if (file.size <= 0) {
    return { ok: false, error: "Le fichier est vide." };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      ok: false,
      error: `Le fichier dépasse la taille maximale autorisée (${MAX_FILE_SIZE_BYTES / (1024 * 1024)} Mo).`,
    };
  }

  return { ok: true };
}

/** Strips path separators and unsafe characters before using a name in a storage path. */
export function sanitizeFilename(filename: string): string {
  return filename
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9.\-_]/g, "_")
    .slice(-150);
}
