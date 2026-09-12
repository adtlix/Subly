import test from "node:test";
import assert from "node:assert/strict";
import {
  parseLocalDate,
  formatDate,
  formatShortDate,
  daysBetween,
  addDays,
  calculateNoticeDeadline,
  daysUntil,
  isPast,
  isWithinDays,
  isValidDateStr,
} from "../artifacts/subly/src/lib/date-utils";
import {
  formatMoney,
  calculateAnnual,
  calculateMonthlyEquivalent,
  roundCents,
  cycleFactor,
  cycleLabelDe,
  cycleNameDe,
  convertCurrency,
  areCurrenciesEqual,
  calculateComparableSavings,
} from "../artifacts/subly/src/lib/money-utils";
import { generateIcsCalendar, escapeIcsText } from "../artifacts/subly/src/lib/ics-export";

test("Date Utils: robust calendar-day arithmetic across DST boundary (no drift)", () => {
  // Spring DST change in Europe/Zurich: March 29, 2026 (23 hours)
  const march28 = "2026-03-28";
  const march30 = "2026-03-30";
  assert.equal(daysBetween(march28, march30), 2);
  assert.equal(addDays(march28, 2), march30);

  // Autumn DST change in Europe/Zurich: October 25, 2026 (25 hours)
  const oct24 = "2026-10-24";
  const oct26 = "2026-10-26";
  assert.equal(daysBetween(oct24, oct26), 2);
  assert.equal(addDays(oct24, 2), oct26);
});

test("Date Utils: calculateNoticeDeadline handles leap year and boundary conditions", () => {
  // Leap year 2028: Feb 29 - 30 days => Jan 30, 2028
  const leapRenewal = "2028-02-29";
  const deadlineLeap = calculateNoticeDeadline(leapRenewal, 30);
  assert.equal(deadlineLeap, "2028-01-30");

  // Zero notice days returns same day
  assert.equal(calculateNoticeDeadline("2026-05-15", 0), "2026-05-15");

  // Format validations
  assert.equal(isValidDateStr("2026-09-12"), true);
  assert.equal(isValidDateStr("invalid-date"), false);
  assert.equal(isValidDateStr("2026-02-31"), false);
});

test("Date Utils: formatting and comparison helpers", () => {
  assert.equal(formatDate("2026-09-12"), "12.09.2026");
  assert.ok(formatShortDate("2026-09-12").includes("12."));

  // Date parsing
  const d = parseLocalDate("2026-09-12");
  assert.equal(d.getFullYear(), 2026);
  assert.equal(d.getMonth(), 8); // 0-indexed September
  assert.equal(d.getDate(), 12);

  // Past & future checks
  assert.equal(isPast("2000-01-01"), true);
  assert.equal(isPast("2099-01-01"), false);
});

test("Money Utils: Swiss formatting (de-CH) with CHF and EUR", () => {
  const formattedChf = formatMoney(79.9);
  assert.ok(formattedChf.includes("CHF"));
  assert.ok(formattedChf.includes("79.90"));

  const formattedEur = formatMoney(14.95, "EUR");
  assert.ok(formattedEur.includes("EUR"));
  assert.ok(formattedEur.includes("14.95"));

  // Rounding cents
  assert.equal(roundCents(19.999), 20);
  assert.equal(roundCents(19.991), 19.99);

  // Annual calculation
  assert.equal(calculateAnnual(25, "monthly"), 300);
  assert.equal(calculateAnnual(300, "yearly"), 300);
  assert.equal(calculateAnnual(30, "quarterly"), 120);

  // Monthly equivalent
  assert.equal(calculateMonthlyEquivalent(120, "yearly"), 10);
  assert.equal(calculateMonthlyEquivalent(60, "quarterly"), 15);
  assert.equal(calculateMonthlyEquivalent(25, "monthly"), 25);

  // Labels
  assert.equal(cycleLabelDe["monthly"], "/ Mt.");
  assert.equal(cycleLabelDe["yearly"], "/ Jr.");
  assert.equal(cycleNameDe["monthly"], "Monatlich");
  assert.equal(cycleNameDe["yearly"], "Jährlich");
});

test("ICS Export: generates RFC 5545 compliant calendar file with CRLF and VALARM", () => {
  const ics = generateIcsCalendar({
    id: 42,
    provider: "Swisscom",
    plan: "blue Mobile M",
    amount: 79.9,
    currency: "CHF",
    billingCycle: "monthly",
    nextRenewal: "2026-10-01",
    noticeDays: 30,
    contractNumber: "SC-9921",
    cancellationAddress: "Swisscom AG, 3050 Bern",
    hotline: "0800 800 800",
  });

  // Must use CRLF (\r\n) line breaks
  assert.ok(ics.includes("\r\n"), "ICS must contain CRLF line endings");

  // VCALENDAR and VEVENT boundaries
  assert.ok(ics.includes("BEGIN:VCALENDAR"));
  assert.ok(ics.includes("END:VCALENDAR"));
  assert.ok(ics.includes("BEGIN:VEVENT"));
  assert.ok(ics.includes("END:VEVENT"));

  // Notice deadline: 2026-10-01 minus 30 days = 2026-09-01
  assert.ok(ics.includes("DTSTART;VALUE=DATE:20260901"));
  assert.ok(ics.includes("DTEND;VALUE=DATE:20260902"));

  // Summary and details
  assert.ok(ics.includes("SUMMARY:Kündigungsfrist beachten: Swisscom (blue Mobile M)"));
  assert.ok(ics.includes("Vertragsnummer: SC-9921"));

  // Reminder alarm
  assert.ok(ics.includes("BEGIN:VALARM"));
  assert.ok(ics.includes("TRIGGER:-P3D"));
  assert.ok(ics.includes("END:VALARM"));
});

test("Date Utils: strictly rejects invalid calendar days (Feb 31, Month 13, Day 00)", () => {
  assert.equal(isValidDateStr("2026-02-31"), false);
  assert.equal(isValidDateStr("2026-13-01"), false);
  assert.equal(isValidDateStr("2026-00-10"), false);
  assert.equal(isValidDateStr("2026-04-31"), false); // April has 30 days
  assert.equal(isValidDateStr("2027-02-29"), false); // 2027 is not leap year
  assert.equal(isValidDateStr("2028-02-29"), true);  // 2028 is leap year

  // Helper functions throw on invalid date string
  assert.throws(() => addDays("2026-02-31", 5), /Ungültiges Kalenderdatum|Ungültiges Datumsformat/);
  assert.throws(() => daysBetween("2026-02-31", "2026-03-05"), /Ungültiges Kalenderdatum|Ungültiges Datumsformat/);
  assert.throws(() => calculateNoticeDeadline("2026-13-01", 30), /Ungültiges Erneuerungsdatum|Ungültiges Kalenderdatum|Ungültiges Datumsformat/);
});

test("Money Utils: currency conversion and cross-currency comparison", () => {
  // Same currency
  assert.equal(areCurrenciesEqual("CHF", "CHF"), true);
  assert.equal(areCurrenciesEqual("CHF", "chf"), true);
  assert.equal(areCurrenciesEqual("CHF", "EUR"), false);

  // Direct conversion
  const convertedChfToEur = convertCurrency(100, "CHF", "EUR");
  assert.ok(convertedChfToEur !== null && convertedChfToEur > 0);
  assert.equal(convertCurrency(100, "EUR", "EUR"), 100);

  // Comparable savings across currencies
  const res = calculateComparableSavings(89.90, "CHF", 24.95, "CHF");
  assert.ok(res);
  assert.equal(res.savings, 64.95);
  assert.equal(res.isCrossCurrency, false);

  // Cross-currency savings (e.g. 50 USD subscription compared with 40 CHF alternative)
  const crossRes = calculateComparableSavings(50, "USD", 40, "CHF");
  assert.ok(crossRes);
  assert.equal(crossRes.isCrossCurrency, true);
  assert.equal(typeof crossRes.savings, "number");
  assert.ok(crossRes.convertedAltCost > 0);
});

test("ICS Export: character escaping for RFC 5545 (commas, semicolons, backslashes, newlines)", () => {
  const rawText = "Vertrag: Mobilfunk, Internet; Option \\ Spezial\nZweite Zeile";
  const escaped = escapeIcsText(rawText);

  assert.ok(escaped.includes("\\,"));
  assert.ok(escaped.includes("\\;"));
  assert.ok(escaped.includes("\\\\"));
  assert.ok(escaped.includes("\\n"));
});
