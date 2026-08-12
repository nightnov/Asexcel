import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { AUTH_DISABLED } from "@/lib/dev-auth";
import { LOCALE_COOKIE, isLocale, negotiateLocale } from "@/lib/i18n/config";

// /chat, /api/chat, /outils/generateur-formules, /api/generate-formula and
// /api/quota are deliberately NOT listed here: guests get a limited free
// daily allowance (tracked client-side, see src/lib/useDailyQuota.ts), so
// those routes must stay reachable without a session. The route handlers
// themselves branch on whether a real user is present.
// /api/tebex/webhook is also deliberately excluded — it's called by Tebex
// itself (no user session), and is secured by signature verification
// instead (see its route handler).
const PROTECTED_PREFIXES = ["/api/upload", "/compte", "/checkout"];

/** Sets the locale cookie from `Accept-Language` on first visit only — an
 * existing cookie (set automatically here, or manually via the footer
 * language switcher) always wins, so a manual choice is never overridden. */
function ensureLocaleCookie(request: NextRequest, response: NextResponse) {
  const existing = request.cookies.get(LOCALE_COOKIE)?.value;
  if (isLocale(existing)) return;
  const detected = negotiateLocale(request.headers.get("accept-language"));
  response.cookies.set(LOCALE_COOKIE, detected, { path: "/", maxAge: 31536000, sameSite: "lax" });
}

export async function middleware(request: NextRequest) {
  if (AUTH_DISABLED) {
    const response = NextResponse.next();
    ensureLocaleCookie(request, response);
    return response;
  }

  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: request.headers } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    request.nextUrl.pathname.startsWith(prefix)
  );

  if (isProtected && !user) {
    if (request.nextUrl.pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("next", request.nextUrl.pathname);
    const redirectResponse = NextResponse.redirect(redirectUrl);
    ensureLocaleCookie(request, redirectResponse);
    return redirectResponse;
  }

  ensureLocaleCookie(request, response);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
