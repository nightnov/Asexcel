import "server-only";

const GREEN = "#1E8E5A";
const INK = "#20291F";
const INK_SOFT = "#5B6B5C";
const FOOTER_BG = "#FAFBFA";
// Falls back to the real production domain (not localhost) — these links go
// out in real e-mails, so this must never resolve to something unreachable
// for the recipient even if NEXT_PUBLIC_SITE_URL isn't set on the host.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://asexcel.com";

interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

/**
 * Table-based, inline-styled shell shared by every transactional e-mail —
 * this is the pattern that survives Outlook/Gmail's CSS stripping, not a
 * <div>-based layout. Kept intentionally plain (no external assets, no
 * webfonts) so it renders identically with images/CSS blocked by default.
 */
function shell(bodyHtml: string, cta?: { label: string; href: string }): string {
  const ctaHtml = cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:28px;">
                  <tr>
                    <td style="border-radius:10px;background:${GREEN};">
                      <a href="${cta.href}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#FFFFFF;text-decoration:none;">${cta.label}</a>
                    </td>
                  </tr>
                </table>`
    : "";

  return `<!doctype html>
<html lang="fr">
  <body style="margin:0;padding:0;background:#F4F6F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F6F5;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(32,41,31,0.06);">
            <tr>
              <td style="height:4px;background:linear-gradient(90deg,${GREEN},#34D399);line-height:4px;font-size:0;">&nbsp;</td>
            </tr>
            <tr>
              <td style="background:${GREEN};padding:22px 28px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-right:10px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" style="width:28px;height:28px;background:#FFFFFF;border-radius:8px;">
                        <tr>
                          <td align="center" valign="middle" style="width:28px;height:28px;font-size:15px;font-weight:800;color:${GREEN};">A</td>
                        </tr>
                      </table>
                    </td>
                    <td style="font-size:18px;font-weight:700;color:#FFFFFF;letter-spacing:-0.01em;">Asexcel</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 28px 8px;color:${INK};font-size:15px;line-height:1.6;">
                ${bodyHtml}
                ${ctaHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px;">
                <div style="height:1px;background:#EEF1EF;margin-top:28px;"></div>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px 24px;background:${FOOTER_BG};color:${INK_SOFT};font-size:12px;line-height:1.6;">
                <strong style="color:${INK};">Asexcel</strong> — la boîte à outils pour tous les utilisateurs d'Excel.<br />
                Une question ? Écrivez-nous depuis <a href="${SITE_URL}/outils/support" style="color:${GREEN};font-weight:600;">notre page support</a>.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

const PLAN_LABEL: Record<"monthly" | "annual", string> = { monthly: "mensuel", annual: "annuel" };

export function buildProConfirmationEmail(planType: "monthly" | "annual"): EmailContent {
  const subject = "Ton abonnement Asexcel Pro est actif ! ✨";
  const planLabel = PLAN_LABEL[planType];

  const html = shell(
    `
      <p style="margin:0 0 16px;font-size:18px;font-weight:600;">Ton abonnement Pro est actif ! ✨</p>
      <p style="margin:0 0 16px;">Merci de ta confiance — ton abonnement Pro (${planLabel}) est confirmé et déjà actif sur ton compte.</p>
      <p style="margin:0 0 8px;font-weight:600;">Ce que ça débloque dès maintenant :</p>
      <ul style="margin:0 0 16px;padding-left:20px;">
        <li style="margin-bottom:4px;">Assistant IA 100&nbsp;% illimité</li>
        <li style="margin-bottom:4px;">Fichiers volumineux jusqu'à 100&nbsp;Mo</li>
        <li>Traitement prioritaire</li>
      </ul>
      <p style="margin:0;color:${INK_SOFT};font-size:13px;">Tu peux gérer ton abonnement (facturation, annulation) à tout moment depuis ton compte.</p>
    `,
    { label: "Accéder à mon compte", href: `${SITE_URL}/compte` }
  );

  const text = `Ton abonnement Pro est actif !

Merci de ta confiance — ton abonnement Pro (${planLabel}) est confirmé et déjà actif sur ton compte.

Ce que ça débloque dès maintenant :
- Assistant IA 100% illimité
- Fichiers volumineux jusqu'à 100 Mo
- Traitement prioritaire

Tu peux gérer ton abonnement (facturation, annulation) à tout moment depuis ton compte : ${SITE_URL}/compte

— Asexcel`;

  return { subject, html, text };
}

export function buildOtpCodeEmail(code: string): EmailContent {
  const subject = `${code} — ton code de connexion Asexcel`;

  const html = shell(`
      <p style="margin:0 0 16px;font-size:18px;font-weight:600;">Ton code de connexion</p>
      <p style="margin:0 0 20px;">Saisis ce code à 6 chiffres pour te connecter à Asexcel :</p>
      <table role="presentation" cellpadding="0" cellspacing="0">
        <tr>
          <td style="border-radius:10px;background:${FOOTER_BG};padding:16px 28px;">
            <span style="font-size:28px;font-weight:700;letter-spacing:0.3em;color:${INK};">${code}</span>
          </td>
        </tr>
      </table>
      <p style="margin:20px 0 0;color:${INK_SOFT};font-size:13px;">Ce code expire dans quelques minutes. Si tu n'es pas à l'origine de cette demande, ignore simplement cet e-mail.</p>
    `);

  const text = `Ton code de connexion Asexcel : ${code}

Saisis ce code à 6 chiffres pour te connecter. Il expire dans quelques minutes.

Si tu n'es pas à l'origine de cette demande, ignore simplement cet e-mail.

— Asexcel`;

  return { subject, html, text };
}

export function buildWelcomeEmail(): EmailContent {
  const subject = "Bienvenue sur Asexcel !";

  const html = shell(
    `
      <p style="margin:0 0 16px;font-size:18px;font-weight:600;">Bienvenue sur Asexcel !</p>
      <p style="margin:0 0 16px;">Ton compte est prêt. Tu as maintenant accès à l'ensemble de la suite d'outils Excel — nettoyage, conversion, traduction de formules, et à l'assistant IA.</p>
      <p style="margin:0;color:${INK_SOFT};font-size:13px;">Une question en cours de route ? Notre équipe support répond rapidement.</p>
    `,
    { label: "Découvrir les outils", href: `${SITE_URL}/` }
  );

  const text = `Bienvenue sur Asexcel !

Ton compte est prêt. Tu as maintenant accès à l'ensemble de la suite d'outils Excel — nettoyage, conversion, traduction de formules, et à l'assistant IA.

Découvrir les outils : ${SITE_URL}/

Une question en cours de route ? Notre équipe support répond rapidement : ${SITE_URL}/outils/support

— Asexcel`;

  return { subject, html, text };
}

export const SUPPORT_CATEGORY_LABEL = {
  question: "Question",
  request: "Requête",
  problem: "Problème",
  other: "Autre",
} as const;
export type SupportCategory = keyof typeof SUPPORT_CATEGORY_LABEL;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildSupportNotificationEmail(params: {
  category: SupportCategory;
  contactEmail: string | null;
  message: string;
}): EmailContent {
  const { category, contactEmail, message } = params;
  const categoryLabel = SUPPORT_CATEGORY_LABEL[category];
  const subject = `[Support Asexcel] ${categoryLabel}`;

  const html = shell(`
      <p style="margin:0 0 4px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;color:${INK_SOFT};">Nouvelle demande</p>
      <p style="margin:0 0 20px;font-size:18px;font-weight:600;">${escapeHtml(categoryLabel)}</p>
      <p style="margin:0 0 4px;color:${INK_SOFT};font-size:13px;">E-mail de contact</p>
      <p style="margin:0 0 20px;">${contactEmail ? escapeHtml(contactEmail) : "non renseigné"}</p>
      <p style="margin:0 0 4px;color:${INK_SOFT};font-size:13px;">Message</p>
      <p style="margin:0;white-space:pre-wrap;background:${FOOTER_BG};border-radius:10px;padding:14px 16px;">${escapeHtml(message)}</p>
    `);

  const text = `Nouvelle demande — ${categoryLabel}

E-mail de contact : ${contactEmail ?? "non renseigné"}

Message :
${message}`;

  return { subject, html, text };
}
