import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateExcelFile, sanitizeFilename } from "@/lib/validation";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { AUTH_DISABLED, MOCK_USER_ID } from "@/lib/dev-auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const supabase = createClient();

  let userId = MOCK_USER_ID;
  if (!AUTH_DISABLED) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }
    userId = user.id;
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const turnstileToken = formData.get("turnstileToken");

  if (!AUTH_DISABLED) {
    const verification = await verifyTurnstileToken(
      typeof turnstileToken === "string" ? turnstileToken : null,
      request.headers.get("x-forwarded-for") ?? undefined
    );
    if (!verification.success) {
      return NextResponse.json(
        { error: "Vérification anti-abus échouée. Rechargez la page et réessayez." },
        { status: 403 }
      );
    }
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
  }

  const validation = validateExcelFile(file);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 422 });
  }

  const safeName = sanitizeFilename(file.name);
  const storagePath = `${userId}/${crypto.randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("excel-files")
    .upload(storagePath, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    console.error("Supabase storage upload failed:", uploadError);
    return NextResponse.json(
      { error: "Échec de l'envoi du fichier vers le stockage." },
      { status: 502 }
    );
  }

  const { data: fileRow, error: dbError } = await supabase
    .from("files")
    .insert({
      user_id: userId,
      storage_path: storagePath,
      original_name: file.name,
      mime_type: file.type || "application/octet-stream",
      size_bytes: file.size,
      status: "uploaded",
    })
    .select()
    .single();

  if (dbError || !fileRow) {
    console.error("Failed to persist file metadata:", dbError);
    // Best-effort cleanup so we don't leak an orphaned object in storage.
    await supabase.storage.from("excel-files").remove([storagePath]);
    return NextResponse.json(
      { error: "Échec de l'enregistrement du fichier." },
      { status: 500 }
    );
  }

  // Short-lived signed URL so the client can preview/confirm without the
  // bucket ever needing to be public.
  const { data: signedUrlData } = await supabase.storage
    .from("excel-files")
    .createSignedUrl(storagePath, 60 * 5);

  return NextResponse.json({
    file: fileRow,
    signedUrl: signedUrlData?.signedUrl ?? null,
  });
}
