/**
 * Single source of truth for company/legal facts referenced across the
 * legal and institutional pages (/securite, /confidentialite, /conditions,
 * /a-propos...). Update here once instead of hunting down every page that
 * mentions the company name, support contact, or last-revision date.
 *
 * Deliberately conservative: only facts that are actually true of the
 * current implementation belong here. A privacy policy that claims a data
 * behavior (e.g. an automatic deletion delay) which no code actually
 * enforces is a legal liability, not a nicety — see README/CLAUDE notes
 * before adding a new claim here.
 */
export const COMPANY_INFO = {
  productName: "Asexcel",
  supportPath: "/outils/support",
  /**
   * Inbox that receives support form submissions, sent via Resend (see /api/support).
   * While using Resend's sandbox sender below, this MUST be the email address of the
   * Resend account itself — sandbox mode refuses to deliver to any other recipient.
   */
  supportInboxEmail: "nightnova2007@gmail.com",
  /**
   * Resend's shared sandbox sender — works with no DNS setup, but Resend restricts
   * delivery to the account owner's own address (see supportInboxEmail above).
   * Once a real domain is verified at https://resend.com/domains, switch this to
   * something like "Asexcel <support@yourdomain.com>" for unrestricted delivery.
   */
  emailFromAddress: "Asexcel <onboarding@resend.dev>",
  /** ISO date, each legal page formats it for display. Bump this whenever a legal page's content changes. */
  legalLastUpdated: "2026-08-01",
} as const;
