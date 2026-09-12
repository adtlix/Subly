/**
 * Centralized Validation Utilities for Subly API Server
 *
 * Enforces strict validation rules across auth, subscriptions, and settings.
 * Ensures invalid client data is never silently defaulted.
 */

export const SUPPORTED_CURRENCIES = ["CHF", "EUR", "USD", "GBP"] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const VALID_BILLING_CYCLES = ["monthly", "quarterly", "half-yearly", "yearly"] as const;
export type BillingCycle = (typeof VALID_BILLING_CYCLES)[number];

export const VALID_STATUSES = ["active", "cancelled", "paused"] as const;
export type SubscriptionStatus = (typeof VALID_STATUSES)[number];

export class ValidationError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "ValidationError";
    this.statusCode = statusCode;
  }
}

export function isValidIsoDate(d: unknown): d is string {
  if (typeof d !== "string") return false;
  const trimmed = d.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) return false;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const day = Number(match[3]);
  if (y < 1900 || y > 2100 || m < 1 || m > 12) return false;
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return day >= 1 && day <= daysInMonth;
}

export function validateEmail(email: unknown): string {
  if (typeof email !== "string" || !email.trim()) {
    throw new ValidationError("E-Mail-Adresse ist erforderlich.");
  }
  const clean = email.trim().toLowerCase();
  // RFC 5322 compatible pragmatic email check
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(clean) || clean.length > 254) {
    throw new ValidationError("Bitte gib eine gültige E-Mail-Adresse ein.");
  }
  return clean;
}

export function validatePassword(password: unknown, minLength = 8): string {
  if (typeof password !== "string") {
    throw new ValidationError("Passwort ist erforderlich.");
  }
  if (password.length < minLength) {
    throw new ValidationError(`Das Passwort muss mindestens ${minLength} Zeichen lang sein.`);
  }
  if (password.length > 128) {
    throw new ValidationError("Das Passwort darf maximal 128 Zeichen lang sein.");
  }
  return password;
}

export function validateIsoDate(d: unknown, fieldName: string, required = true): string {
  if (d === undefined || d === null || d === "") {
    if (!required) return "";
    throw new ValidationError(`${fieldName} ist erforderlich.`);
  }
  if (!isValidIsoDate(d)) {
    throw new ValidationError(`Ungültiges Format für ${fieldName} (gültiges Datum im Format JJJJ-MM-TT erforderlich).`);
  }
  return d.trim();
}

export function validateAmount(amt: unknown, fieldName = "Betrag"): number {
  if (amt === undefined || amt === null || amt === "") {
    throw new ValidationError(`${fieldName} ist erforderlich.`);
  }
  const num = Number(amt);
  if (!Number.isFinite(num) || num < 0 || num > 1_000_000) {
    throw new ValidationError(`${fieldName} muss eine gültige Zahl zwischen 0 und 1'000'000 sein.`);
  }
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export function validateNoticeDays(days: unknown): number {
  if (days === undefined || days === null) {
    return 30; // default only when not provided
  }
  const num = Number(days);
  if (!Number.isInteger(num) || num < 0 || num > 365) {
    throw new ValidationError("Kündigungsfrist muss eine ganze Zahl zwischen 0 und 365 Tagen sein.");
  }
  return num;
}

export function validateCurrency(curr: unknown): SupportedCurrency {
  if (curr === undefined || curr === null || curr === "") {
    return "CHF";
  }
  const str = String(curr).toUpperCase().trim();
  if (!(SUPPORTED_CURRENCIES as readonly string[]).includes(str)) {
    throw new ValidationError(`Währung '${str}' nicht unterstützt. Erlaubt: ${SUPPORTED_CURRENCIES.join(", ")}.`);
  }
  return str as SupportedCurrency;
}

export function validateBillingCycle(cycle: unknown): BillingCycle {
  if (cycle === undefined || cycle === null || cycle === "") {
    return "monthly";
  }
  const str = String(cycle).toLowerCase().trim();
  if (!(VALID_BILLING_CYCLES as readonly string[]).includes(str)) {
    throw new ValidationError(`Ungültiger Abrechnungszyklus '${str}'. Erlaubt: ${VALID_BILLING_CYCLES.join(", ")}.`);
  }
  return str as BillingCycle;
}

export function validateStatus(status: unknown): SubscriptionStatus {
  if (status === undefined || status === null || status === "") {
    return "active";
  }
  const str = String(status).toLowerCase().trim();
  if (!(VALID_STATUSES as readonly string[]).includes(str)) {
    throw new ValidationError(`Ungültiger Status '${str}'. Erlaubt: ${VALID_STATUSES.join(", ")}.`);
  }
  return str as SubscriptionStatus;
}

export function validatePriceChange(pc: unknown): number | null {
  if (pc === undefined || pc === null || pc === "") {
    return null;
  }
  const num = Number(pc);
  if (!Number.isFinite(num)) {
    throw new ValidationError("Preisänderung muss eine gültige Zahl sein.");
  }
  return Math.round((num + Number.EPSILON) * 100) / 100;
}
