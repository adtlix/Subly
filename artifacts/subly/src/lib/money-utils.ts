/**
 * Subly Money and Currency Utilities
 *
 * Centralized formatting and calculations to avoid hardcoded 'CHF'
 * and floating-point errors. Includes exchange rate conversion model
 * to prevent invalid cross-currency arithmetic (e.g. CHF 100 - EUR 20).
 */

export type BillingCycle = "monthly" | "quarterly" | "half-yearly" | "yearly";

export const SUPPORTED_CURRENCIES = ["CHF", "EUR", "USD", "GBP"] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

// Reference conversion rates to CHF (baseline exchange rate model for fair comparison)
export const EXCHANGE_RATES_TO_CHF: Record<SupportedCurrency, number> = {
  CHF: 1.0,
  EUR: 0.95, // 1 EUR ≈ 0.95 CHF
  USD: 0.90, // 1 USD ≈ 0.90 CHF
  GBP: 1.12, // 1 GBP ≈ 1.12 CHF
};

export const cycleFactor: Record<BillingCycle, number> = {
  monthly: 12,
  quarterly: 4,
  "half-yearly": 2,
  yearly: 1,
};

export const cycleLabel: Record<BillingCycle, string> = {
  monthly: "/ mo",
  quarterly: "/ qtr",
  "half-yearly": "/ 6 mo",
  yearly: "/ yr",
};

export const cycleLabelDe: Record<BillingCycle, string> = {
  monthly: "/ Mt.",
  quarterly: "/ Qtr.",
  "half-yearly": "/ 6 Mt.",
  yearly: "/ Jr.",
};

export const cycleNameDe: Record<BillingCycle, string> = {
  monthly: "Monatlich",
  quarterly: "Vierteljährlich",
  "half-yearly": "Halbjährlich",
  yearly: "Jährlich",
};

/**
 * Rounds a number to two decimal places, avoiding binary floating point artifacts.
 */
export function roundCents(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Checks if two currency strings are identical (case-insensitive).
 */
export function areCurrenciesEqual(c1?: string, c2?: string): boolean {
  const norm1 = (c1 || "CHF").toUpperCase().trim();
  const norm2 = (c2 || "CHF").toUpperCase().trim();
  return norm1 === norm2;
}

/**
 * Converts an amount from one currency to another using reference rates.
 * Returns null if currency is not supported.
 */
export function convertCurrency(amount: number, fromCurrency = "CHF", toCurrency = "CHF"): number | null {
  if (!Number.isFinite(amount)) return 0;
  const from = (fromCurrency || "CHF").toUpperCase().trim() as SupportedCurrency;
  const to = (toCurrency || "CHF").toUpperCase().trim() as SupportedCurrency;

  if (from === to) return roundCents(amount);

  const rateFrom = EXCHANGE_RATES_TO_CHF[from];
  const rateTo = EXCHANGE_RATES_TO_CHF[to];

  if (!rateFrom || !rateTo) return null;

  // Convert to CHF first, then to target currency
  const inChf = amount * rateFrom;
  const inTarget = inChf / rateTo;
  return roundCents(inTarget);
}

/**
 * Compares two prices across currencies safely.
 * Converts the alternative price into the base currency before calculating savings.
 * Never subtracts disparate currencies directly.
 */
export function calculateComparableSavings(
  baseCost: number,
  baseCurrency = "CHF",
  altCost: number,
  altCurrency = "CHF"
): { savings: number; isCrossCurrency: boolean; convertedAltCost: number } | null {
  if (!Number.isFinite(baseCost) || !Number.isFinite(altCost)) return null;

  if (areCurrenciesEqual(baseCurrency, altCurrency)) {
    const savings = roundCents(Math.max(0, baseCost - altCost));
    return { savings, isCrossCurrency: false, convertedAltCost: altCost };
  }

  const convertedAlt = convertCurrency(altCost, altCurrency, baseCurrency);
  if (convertedAlt === null) return null;

  const savings = roundCents(Math.max(0, baseCost - convertedAlt));
  return { savings, isCrossCurrency: true, convertedAltCost: convertedAlt };
}

/**
 * Formats monetary amounts using Intl.NumberFormat according to Swiss formatting conventions.
 */
export function formatMoney(amount: number, currency = "CHF", locale = "de-CH"): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const safeCurrency = (currency || "CHF").toUpperCase().trim();
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: safeCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safeAmount);
  } catch {
    return `${safeCurrency} ${safeAmount.toFixed(2)}`;
  }
}

/**
 * Calculates the annual cost of a subscription based on amount and billing cycle.
 */
export function calculateAnnual(amount: number, cycle: BillingCycle): number {
  const factor = cycleFactor[cycle] ?? 12;
  return roundCents(amount * factor);
}

/**
 * Calculates normalized monthly equivalent cost of a subscription.
 */
export function calculateMonthlyEquivalent(amount: number, cycle: BillingCycle): number {
  if (cycle === "yearly") return roundCents(amount / 12);
  if (cycle === "half-yearly") return roundCents(amount / 6);
  if (cycle === "quarterly") return roundCents(amount / 4);
  return roundCents(amount);
}
