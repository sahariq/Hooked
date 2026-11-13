// Central place for "which payment methods are on" and the bank details shown to customers.
// Everything comes from environment variables, so no account numbers live in the code or the repo.

const isProd = process.env.NODE_ENV === 'production';

const list = (v) => (v || '').split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);

/** Bank transfer is on only when explicitly enabled AND an account is actually configured. */
export function bankTransferEnabled() {
  return (
    process.env.BANK_TRANSFER_ENABLED === 'true' &&
    !!process.env.BANK_ACCOUNT_TITLE &&
    !!(process.env.BANK_IBAN || process.env.BANK_ACCOUNT_NUMBER)
  );
}

/** Optional allow-list, e.g. BANK_TRANSFER_COUNTRIES=PK. Empty means every country the shop ships to. */
export function bankTransferAllowedFor(countryCode) {
  const allowed = list(process.env.BANK_TRANSFER_COUNTRIES);
  return allowed.length === 0 || allowed.includes(String(countryCode).toUpperCase());
}

/** Card payments: always "on" in development (mock checkout); in production only with real Safepay keys. */
export function cardEnabled() {
  return !isProd || !!process.env.SAFEPAY_API_KEY;
}

export const bankDeadlineHours = () => Number(process.env.BANK_PAYMENT_HOURS) || 48;
export const cardHoldMinutes = () => Number(process.env.CARD_HOLD_MINUTES) || 60;

/** What the customer sees on the order page / in the email. */
export function bankDetails() {
  return {
    accountTitle: process.env.BANK_ACCOUNT_TITLE || '',
    bankName: process.env.BANK_NAME || '',
    iban: process.env.BANK_IBAN || '',
    accountNumber: process.env.BANK_ACCOUNT_NUMBER || '',
    swift: process.env.BANK_SWIFT || '',
    notes: process.env.BANK_NOTES || '', // e.g. "Easypaisa / JazzCash: 03xx-xxxxxxx"
  };
}

export const frontendUrl = () =>
  (process.env.FRONTEND_URL || (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',')[0]).trim().replace(/\/$/, '');
