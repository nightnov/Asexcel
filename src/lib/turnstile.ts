import "server-only";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export interface TurnstileVerifyResult {
  success: boolean;
  errorCodes?: string[];
}

/**
 * Verifies a Cloudflare Turnstile token server-side. Call this on every
 * state-changing endpoint (chat + upload) before doing any real work, so
 * abusive/automated traffic is rejected before it touches the Groq API or
 * storage quota.
 */
export async function verifyTurnstileToken(
  token: string | null | undefined,
  remoteIp?: string
): Promise<TurnstileVerifyResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  // Not configured — the feature is off, not failing. Checked before the
  // token check on purpose: throwing (or rejecting) here used to 500/403
  // every AI request on a deployment that simply never had the keys set,
  // which is exactly how the whole assistant ended up unusable in
  // production. Logged loudly so an accidentally-unset key in an
  // environment that DOES want protection is still visible.
  if (!secret) {
    console.warn("TURNSTILE_SECRET_KEY is not set — anti-abuse verification is disabled for this request.");
    return { success: true };
  }

  if (!token) {
    return { success: false, errorCodes: ["missing-input-response"] };
  }

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);

  const res = await fetch(VERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = (await res.json()) as { success: boolean; "error-codes"?: string[] };

  return { success: data.success, errorCodes: data["error-codes"] };
}
