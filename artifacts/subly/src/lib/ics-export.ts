import { calculateNoticeDeadline, formatDate, addDays } from "./date-utils";
import { formatMoney, cycleNameDe, type BillingCycle } from "./money-utils";

export interface IcsSubscriptionInput {
  id: number;
  provider: string;
  plan?: string;
  amount: number;
  currency?: string;
  billingCycle: BillingCycle;
  nextRenewal: string;
  noticeDays: number;
  contractNumber?: string;
  cancellationAddress?: string;
  hotline?: string;
}

/**
 * Escapes special characters according to RFC 5545 specifications.
 */
export function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/**
 * Generates an RFC 5545 compliant iCalendar string for the cancellation deadline.
 */
export function generateIcsCalendar(sub: IcsSubscriptionInput, fallbackCurrency = "CHF"): string {
  const currency = sub.currency || fallbackCurrency;
  const deadlineDateStr = calculateNoticeDeadline(sub.nextRenewal, sub.noticeDays);
  const nextDayDateStr = addDays(deadlineDateStr, 1);

  // Format dates for iCalendar VALUE=DATE (YYYYMMDD)
  const dtStart = deadlineDateStr.replace(/-/g, "");
  const dtEnd = nextDayDateStr.replace(/-/g, "");

  // Timestamp in UTC (YYYYMMDDTHHMMSSZ)
  const now = new Date();
  const dtStamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  const safeProvider = sub.provider.trim() || "Abonnement";
  const planInfo = sub.plan?.trim() ? ` (${sub.plan.trim()})` : "";
  const uid = `subly-${sub.id}-${dtStart}@subly.ch`;

  const deadlineFormatted = formatDate(deadlineDateStr);
  const renewalFormatted = formatDate(sub.nextRenewal);
  const formattedCost = formatMoney(sub.amount, currency);
  const cycleText = cycleNameDe[sub.billingCycle] || sub.billingCycle;

  const summary = escapeIcsText(`Kündigungsfrist beachten: ${safeProvider}${planInfo}`);

  const descLines: string[] = [
    `Spätester Kündigungstermin: ${deadlineFormatted} (Berechneter Richtwert)`,
    `Nächste automatische Erneuerung: ${renewalFormatted}`,
    `Kündigungsfrist: ${sub.noticeDays} Tage`,
    `Kosten: ${formattedCost} (${cycleText})`,
  ];

  if (sub.contractNumber?.trim()) {
    descLines.push(`Vertragsnummer: ${sub.contractNumber.trim()}`);
  }
  if (sub.cancellationAddress?.trim()) {
    descLines.push(`Kündigungskontakt / Adresse: ${sub.cancellationAddress.trim()}`);
  }
  if (sub.hotline?.trim()) {
    descLines.push(`Hotline: ${sub.hotline.trim()}`);
  }

  descLines.push("");
  descLines.push("Hinweis: Berechneter Richtwert via Subly. Bitte individuelle Vertragsbedingungen des Anbieters prüfen.");

  const description = escapeIcsText(descLines.join("\n"));

  // RFC 5545 requires CRLF line endings (\r\n)
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Subly//Schweizer Abo-Manager//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART;VALUE=DATE:${dtStart}`,
    `DTEND;VALUE=DATE:${dtEnd}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    "STATUS:CONFIRMED",
    "TRANSP:TRANSPARENT",
    "BEGIN:VALARM",
    "TRIGGER:-P3D",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeIcsText(`In 3 Tagen endet die Kündigungsfrist für ${safeProvider}`)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.join("\r\n") + "\r\n";
}

/**
 * Initiates browser download of the .ics file.
 */
export function downloadIcsFile(sub: IcsSubscriptionInput, fallbackCurrency = "CHF"): void {
  const icsContent = generateIcsCalendar(sub, fallbackCurrency);
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const cleanName = sub.provider
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

  const fileName = `subly_${cleanName || "abo"}_kuendigungsfrist.ics`;

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
