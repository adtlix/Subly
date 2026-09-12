/**
 * Subly Date Utilities
 *
 * Subscriptions operate on CALENDAR DAYS, not UTC timestamps.
 * Fragile division by 86,400,000 without UTC normalization leads to
 * off-by-one errors during Daylight Saving Time (DST) changes.
 *
 * This module provides central, reliable, calendar-day arithmetic
 * and strictly validates calendar boundaries (leap years, month days).
 */

/**
 * Returns today's date formatted as YYYY-MM-DD in local time.
 */
export function todayAsDateStr(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Validates whether a string is a valid ISO calendar date (YYYY-MM-DD)
 * that actually exists in the real calendar (e.g. rejects 2026-02-31, 2026-13-01, 2026-00-10).
 */
export function isValidDateStr(dateStr: unknown): dateStr is string {
  if (typeof dateStr !== "string") return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (year < 1900 || year > 2100) return false;
  if (month < 1 || month > 12) return false;

  // Verify that the day is valid for this specific year and month (handles leap years)
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day >= 1 && day <= daysInMonth;
}

/**
 * Parses YYYY-MM-DD into a local Date object at midnight.
 * Throws on invalid calendar dates.
 */
export function parseLocalDate(dateStr: string): Date {
  if (!isValidDateStr(dateStr)) {
    throw new Error(`Ungültiges Kalenderdatum: ${dateStr}`);
  }
  const parts = dateStr.trim().slice(0, 10).split("-").map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

/**
 * Parses YYYY-MM-DD into UTC epoch milliseconds at midnight.
 * Using UTC ensures zero drift across Daylight Saving Time (DST) changes.
 * Throws on invalid calendar dates.
 */
export function dateStrToUtcMidnight(dateStr: string): number {
  if (!isValidDateStr(dateStr)) {
    throw new Error(`Ungültiges Kalenderdatum: ${dateStr}`);
  }
  const parts = dateStr.trim().slice(0, 10).split("-").map(Number);
  return Date.UTC(parts[0], parts[1] - 1, parts[2]);
}

/**
 * Calculates exact calendar days between two YYYY-MM-DD strings.
 * Result is positive if `toStr` is in the future compared to `fromStr`.
 * Throws on invalid calendar dates.
 */
export function daysBetween(fromStr: string, toStr: string): number {
  const t1 = dateStrToUtcMidnight(fromStr);
  const t2 = dateStrToUtcMidnight(toStr);
  return Math.round((t2 - t1) / 86_400_000);
}

/**
 * Adds or subtracts calendar days from a YYYY-MM-DD string.
 * Throws on invalid calendar dates.
 */
export function addDays(dateStr: string, days: number): string {
  if (!isValidDateStr(dateStr)) {
    throw new Error(`Ungültiges Kalenderdatum: ${dateStr}`);
  }
  const [y, m, d] = dateStr.trim().slice(0, 10).split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Calculates the exact cancellation deadline date:
 * deadline = nextRenewal - noticeDays
 * e.g. nextRenewal = "2026-10-20", noticeDays = 30 => "2026-09-20"
 * Throws on invalid calendar dates.
 */
export function calculateNoticeDeadline(nextRenewal: string, noticeDays: number): string {
  if (!isValidDateStr(nextRenewal)) {
    throw new Error(`Ungültiges Erneuerungsdatum: ${nextRenewal}`);
  }
  const safeDays = Math.max(0, Math.floor(noticeDays || 0));
  return addDays(nextRenewal, -safeDays);
}

/**
 * Days remaining until a target date from today.
 */
export function daysUntil(targetDateStr: string): number {
  return daysBetween(todayAsDateStr(), targetDateStr);
}

/**
 * Checks if a date is in the past compared to today.
 */
export function isPast(dateStr: string): boolean {
  return daysUntil(dateStr) < 0;
}

/**
 * Checks if a date is within `days` from today (between today and today + days).
 */
export function isWithinDays(dateStr: string, days: number): boolean {
  try {
    const diff = daysUntil(dateStr);
    return diff >= 0 && diff <= days;
  } catch {
    return false;
  }
}

/**
 * Formats a YYYY-MM-DD string into Swiss German representation (e.g. 20.10.2026).
 */
export function formatDate(dateStr: string, locale = "de-CH"): string {
  try {
    if (!isValidDateStr(dateStr)) return dateStr;
    const [y, m, d] = dateStr.trim().slice(0, 10).split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    return new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC",
    }).format(date);
  } catch {
    return dateStr;
  }
}

/**
 * Formats a YYYY-MM-DD string into compact Swiss German representation (e.g. 20. Okt).
 */
export function formatShortDate(dateStr: string, locale = "de-CH"): string {
  try {
    if (!isValidDateStr(dateStr)) return dateStr;
    const [y, m, d] = dateStr.trim().slice(0, 10).split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    return new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "short",
      timeZone: "UTC",
    }).format(date);
  } catch {
    return dateStr;
  }
}
