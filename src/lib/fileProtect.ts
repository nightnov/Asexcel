/**
 * Password-protects an .xlsx file by wrapping it in an encrypted .zip
 * archive (AES-256, via @zip.js/zip.js) — entirely client-side, no network
 * call, no token cost. Using the browser's native compression streams
 * (the "-native" build) avoids bundling a WASM codec.
 *
 * This replaces the earlier approach of editing OOXML `<sheetProtection>`
 * XML in place: that only ever restricted editing inside Excel and turned
 * out to be fragile across Excel versions/round-trips. A password-encrypted
 * ZIP is simpler, well-understood, and the password is required to read the
 * file at all (not just to edit it).
 */
const ZIP_MIME = "application/zip";
const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const AES_256 = 3;

export class UnsupportedFileError extends Error {}
export class InvalidPasswordError extends Error {}

let configured = false;

/** Lazily loads zip.js (native-codec build, no WASM asset) — keeps it out of the initial page bundle. */
async function loadZipJs() {
  const mod = await import("@zip.js/zip.js/lib/zip-native.js");
  if (!configured) {
    mod.configure({ useWebWorkers: false });
    configured = true;
  }
  return mod;
}

/** Wraps the file in a password-encrypted .zip archive (AES-256). */
export async function createProtectedZip(file: File, password: string): Promise<Blob> {
  const { ZipWriter, BlobReader, BlobWriter } = await loadZipJs();
  const zipWriter = new ZipWriter(new BlobWriter(ZIP_MIME), {
    password,
    encryptionStrength: AES_256,
  });

  try {
    await zipWriter.add(file.name, new BlobReader(file));
    return await zipWriter.close();
  } catch {
    throw new UnsupportedFileError("La création de l'archive protégée a échoué.");
  }
}

export interface ExtractResult {
  blob: Blob;
  fileName: string;
}

/** Opens a password-protected .zip archive and extracts its first file. */
export async function extractProtectedZip(file: File, password: string): Promise<ExtractResult> {
  const { ZipReader, BlobReader, BlobWriter } = await loadZipJs();
  const zipReader = new ZipReader(new BlobReader(file), { password });

  let entries;
  try {
    entries = await zipReader.getEntries();
  } catch {
    await zipReader.close().catch(() => {});
    throw new UnsupportedFileError("Ce fichier n'est pas une archive .zip valide.");
  }

  const entry = entries.find((e) => !e.directory);
  if (!entry) {
    await zipReader.close().catch(() => {});
    throw new UnsupportedFileError("Cette archive ne contient aucun fichier.");
  }

  try {
    const blob = await entry.getData!(new BlobWriter(XLSX_MIME), { password });
    await zipReader.close();
    return { blob, fileName: entry.filename };
  } catch (err) {
    await zipReader.close().catch(() => {});
    if (err instanceof Error && err.message === "Invalid password") {
      throw new InvalidPasswordError("Mot de passe incorrect.");
    }
    throw new UnsupportedFileError("Impossible d'extraire le fichier de cette archive.");
  }
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

export function outputZipName(sourceFileName: string): string {
  const idx = sourceFileName.lastIndexOf(".");
  const base = idx === -1 ? sourceFileName : sourceFileName.slice(0, idx);
  return `${base}-protege.zip`;
}

export function isUnsupportedFileError(error: unknown): error is UnsupportedFileError {
  return error instanceof UnsupportedFileError;
}

export function isInvalidPasswordError(error: unknown): error is InvalidPasswordError {
  return error instanceof InvalidPasswordError;
}
