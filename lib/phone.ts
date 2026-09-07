/**
 * Indian mobile validation. Every WhatsApp path in this app messages
 * `user_metadata.phone`, so a junk number here means that member is
 * silently unreachable — real junk values like "1231231231" and the
 * 9-digit "123123123" made it into the live database before this
 * existed.
 *
 * Rules: exactly 10 digits, first digit 6-9 (the valid range for Indian
 * mobile numbers). Tolerates the ways people actually type numbers —
 * +91 prefix, 0 prefix, spaces, dashes — and normalizes to bare 10
 * digits for storage, so WhatsApp's own normalization always gets a
 * clean value.
 */

export function normalizeIndianMobile(raw: string): string | null {
  const digits = (raw || "").replace(/\D/g, "");

  // Strip a leading country code or trunk prefix if present.
  let local = digits;
  if (local.length === 12 && local.startsWith("91")) local = local.slice(2);
  else if (local.length === 11 && local.startsWith("0")) local = local.slice(1);

  if (!/^[6-9]\d{9}$/.test(local)) return null;
  return local;
}

export function isValidIndianMobile(raw: string): boolean {
  return normalizeIndianMobile(raw) !== null;
}

export const PHONE_HELP_TEXT = "10-digit Indian mobile number (starting 6, 7, 8, or 9)";
export const PHONE_ERROR_TEXT =
  "Please enter a valid 10-digit Indian mobile number — we use this to send you farm updates on WhatsApp.";
