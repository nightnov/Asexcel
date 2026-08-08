import "server-only";

const GREEN = "#1E8E5A";
const INK = "#20291F";
const INK_SOFT = "#5B6B5C";
const LINE = "#E5E7EB";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

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
function shell(bodyHtml: string, ctaLabel: string, ctaHref: string): string {
  return `<!doctype html>
<html lang="fr">
  <body style="margin:0;padding:0;background:#F4F6F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F6F5;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid ${LINE};">
            <tr>
              <td style="background:${GREEN};padding:20px 28px;">
                <span style="font-size:17px;font-weight:700;color:#FFFFFF;">Asexcel</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 28px;color:${INK};font-size:15px;line-height:1.6;">
                ${bodyHtml}
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:28px;">
                  <tr>
                    <td style="border-radius:10px;background:${GREEN};">
                      <a href="${ctaHref}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#FFFFFF;text-decoration:none;">${ctaLabel}</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px;border-top:1px solid ${LINE};color:${INK_SOFT};font-size:12px;line-height:1.5;">
                Asexcel — la boîte à outils pour tous les utilisateurs d'Excel.<br />
                Une question ? Écrivez-nous depuis <a href="${SITE_URL}/outils/support" style="color:${GREEN};">notre page support</a>.
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
    "Accéder à mon compte",
    `${SITE_URL}/compte`
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

export function buildWelcomeEmail(): EmailContent {
  const subject = "Bienvenue sur Asexcel !";

  const html = shell(
    `
      <p style="margin:0 0 16px;font-size:18px;font-weight:600;">Bienvenue sur Asexcel !</p>
      <p style="margin:0 0 16px;">Ton compte est prêt. Tu as maintenant accès à l'ensemble de la suite d'outils Excel — nettoyage, conversion, traduction de formules, et à l'assistant IA.</p>
      <p style="margin:0;color:${INK_SOFT};font-size:13px;">Une question en cours de route ? Notre équipe support répond rapidement.</p>
    `,
    "Découvrir les outils",
    `${SITE_URL}/`
  );

  const text = `Bienvenue sur Asexcel !

Ton compte est prêt. Tu as maintenant accès à l'ensemble de la suite d'outils Excel — nettoyage, conversion, traduction de formules, et à l'assistant IA.

Découvrir les outils : ${SITE_URL}/

Une question en cours de route ? Notre équipe support répond rapidement : ${SITE_URL}/outils/support

— Asexcel`;

  return { subject, html, text };
}
