import zlib from "node:zlib";

export interface ExtractedEvidence {
  field: "provider" | "amount" | "currency" | "date" | "contractNumber" | "qrIban" | "uid";
  value: string | number;
  rawSnippet: string;
}

export interface ExtractionResult {
  provider: string;
  plan: string;
  amount: number | null;
  currency: string;
  category: string;
  contractNumber?: string;
  renewalDate?: string;
  evidence: ExtractedEvidence[];
  textSnippet: string;
  extractionConfidence: "verified" | "estimated" | "manual_review_required";
}

// Known Swiss providers & categories mapping
const KNOWN_PROVIDERS: { name: string; aliases: string[]; category: string; defaultPlan?: string }[] = [
  // Swiss Telecom & Internet
  { name: "Swisscom", aliases: ["swisscom", "swisscom ag", "blue mobile", "blue internet", "inone"], category: "Telecom", defaultPlan: "blue Mobile" },
  { name: "Sunrise", aliases: ["sunrise", "sunrise gmbh", "upc", "yallo", "sunrise up", "swype"], category: "Telecom", defaultPlan: "Sunrise Up" },
  { name: "Salt", aliases: ["salt", "salt mobile sa", "salt fiber", "salt home"], category: "Telecom", defaultPlan: "Salt Mobile" },
  { name: "Wingo", aliases: ["wingo", "wingo mobile", "wingo internet"], category: "Telecom", defaultPlan: "Wingo Swiss" },
  { name: "Galaxus Mobile", aliases: ["galaxus mobile", "galaxus", "digitec galaxus"], category: "Telecom", defaultPlan: "CH Flatrate" },
  { name: "Quickline", aliases: ["quickline", "quickline ag"], category: "Internet & TV", defaultPlan: "Internet Start" },
  { name: "Init7", aliases: ["init7", "init7 ag", "fiber7"], category: "Internet & TV", defaultPlan: "Fiber7" },
  
  // Swiss Public Transport & Mobility
  { name: "SBB", aliases: ["sbb cff ffs", "sbb ag", "schweizerische bundesbahnen", "generalabonnement", "halbtax", "swisspass"], category: "Mobility", defaultPlan: "Halbtax / GA" },
  { name: "Fairtiq", aliases: ["fairtiq", "fairtiq ag"], category: "Mobility", defaultPlan: "EasyRide" },

  // Swiss Health & Krankenkasse
  { name: "CSS", aliases: ["css versicherung", "css kranken-versicherung ag", "css ag"], category: "Health", defaultPlan: "Grundversicherung" },
  { name: "Helsana", aliases: ["helsana", "helsana versicherungen ag", "progrès"], category: "Health", defaultPlan: "Grundversicherung" },
  { name: "Swica", aliases: ["swica", "swica gesundheitsorganisation"], category: "Health", defaultPlan: "FAVORIT Medpharm" },
  { name: "Sanitas", aliases: ["sanitas", "sanitas grundversicherungen ag"], category: "Health", defaultPlan: "Basic" },
  { name: "Visana", aliases: ["visana", "visana services ag"], category: "Health", defaultPlan: "Grundversicherung" },
  { name: "Concordia", aliases: ["concordia", "concordia schweizerische kranken- und unfallversicherung ag"], category: "Health", defaultPlan: "Grundversicherung" },
  { name: "Groupe Mutuel", aliases: ["groupe mutuel", "mutuel assurance"], category: "Health", defaultPlan: "Assurance de base" },

  // Swiss Insurance
  { name: "Die Mobiliar", aliases: ["mobiliar", "die mobiliar", "schweizerische mobiliar"], category: "Insurance", defaultPlan: "Haushalt / Haftpflicht" },
  { name: "AXA", aliases: ["axa versicherungen ag", "axa winterthur"], category: "Insurance", defaultPlan: "Versicherung" },
  { name: "Zurich", aliases: ["zurich versicherungs-gesellschaft", "zurich connect"], category: "Insurance", defaultPlan: "Versicherung" },

  // Streaming, Media & Fitness
  { name: "Netflix", aliases: ["netflix", "netflix international"], category: "Entertainment", defaultPlan: "Standard" },
  { name: "Spotify", aliases: ["spotify", "spotify ab"], category: "Entertainment", defaultPlan: "Premium Individual" },
  { name: "Disney+", aliases: ["disney+", "disney plus", "the walt disney"], category: "Entertainment", defaultPlan: "Standard" },
  { name: "YouTube Premium", aliases: ["youtube premium", "google youtube"], category: "Entertainment", defaultPlan: "Individual" },
  { name: "Apple", aliases: ["apple.com/bill", "apple distribution", "icloud", "apple one", "apple music"], category: "Software", defaultPlan: "iCloud+ / One" },
  { name: "Adobe", aliases: ["adobe systems", "adobe creative cloud", "adobe inc"], category: "Software", defaultPlan: "Creative Cloud" },
  { name: "Microsoft", aliases: ["microsoft 365", "microsoft ireland", "msft *"], category: "Software", defaultPlan: "Microsoft 365 Family" },
  { name: "Amazon Prime", aliases: ["amazon prime", "prime video"], category: "Entertainment", defaultPlan: "Prime Video" },
  { name: "Gym / Fitness", aliases: ["fitnesspark", "migros fitness", "puregym", "basefit", "nonstop gym", "kieser training", "clever fit"], category: "Fitness", defaultPlan: "Jahresabo" },
];

/**
 * Extracts raw ASCII & decompressed text streams from a PDF buffer.
 */
export function extractTextFromPdf(buffer: Buffer): string {
  const chunks: string[] = [];

  // Search for stream ... endstream blocks
  const latin = buffer.toString("latin1");
  const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
  let match: RegExpExecArray | null;

  while ((match = streamRegex.exec(latin)) !== null) {
    const rawStream = Buffer.from(match[1], "latin1");
    let textToParse = "";

    // 1. Try FlateDecode (zlib inflate)
    try {
      const inflated = zlib.inflateSync(rawStream);
      textToParse = inflated.toString("utf8");
    } catch (_) {
      try {
        const rawInflate = zlib.inflateRawSync(rawStream);
        textToParse = rawInflate.toString("utf8");
      } catch (__) {
        textToParse = rawStream.toString("utf8");
      }
    }

    // Extract text in parentheses (e.g. (Swisscom) Tj or [(Swisscom) 12 (Mobile)] TJ)
    const tjRegex = /\(([^)]+)\)\s*(?:Tj|'|")/g;
    let tjMatch: RegExpExecArray | null;
    while ((tjMatch = tjRegex.exec(textToParse)) !== null) {
      chunks.push(tjMatch[1]);
    }

    const tjArrayRegex = /\[(.*?)\]\s*TJ/g;
    let arrMatch: RegExpExecArray | null;
    while ((arrMatch = tjArrayRegex.exec(textToParse)) !== null) {
      const inner = arrMatch[1];
      const partRegex = /\(([^)]+)\)/g;
      let partMatch: RegExpExecArray | null;
      const textParts: string[] = [];
      while ((partMatch = partRegex.exec(inner)) !== null) {
        textParts.push(partMatch[1]);
      }
      if (textParts.length > 0) {
        chunks.push(textParts.join(" "));
      }
    }
  }

  // Also scan ASCII readable lines in the PDF
  const asciiMatches = latin.match(/[A-Za-z0-9äöüÄÖÜéàè\s.,:;–—\-_/()#@]{4,}/g) || [];
  for (const str of asciiMatches.slice(0, 100)) {
    if (!str.includes("obj") && !str.includes("xref") && !str.includes("trailer")) {
      chunks.push(str.trim());
    }
  }

  return chunks.join("\n");
}

/**
 * Extracts structured subscription information from text (or filename fallback).
 */
export function parseInvoiceText(rawText: string, fileName?: string): ExtractionResult {
  const combinedText = `${rawText}\n${fileName || ""}`;
  const lowerText = combinedText.toLowerCase();
  const evidence: ExtractedEvidence[] = [];

  // 1. Identify Provider
  let provider = "";
  let category = "Other";
  let plan = "";

  for (const kp of KNOWN_PROVIDERS) {
    for (const alias of kp.aliases) {
      if (lowerText.includes(alias)) {
        provider = kp.name;
        category = kp.category;
        plan = kp.defaultPlan || "";
        evidence.push({
          field: "provider",
          value: kp.name,
          rawSnippet: `Gefundenes Signal: "${alias}"`,
        });
        break;
      }
    }
    if (provider) break;
  }

  // If unknown, extract reasonable clean name from filename
  if (!provider && fileName) {
    const cleaned = fileName
      .replace(/\.(pdf|png|jpe?g|webp|heic)$/i, "")
      .replace(/[-_]/g, " ")
      .replace(/\b(rechnung|invoice|contract|vertrag|bill|scan|document)\b/gi, "")
      .trim();
    if (cleaned.length >= 2) {
      provider = cleaned.slice(0, 30);
    }
  }

  // 2. Extract Amount & Currency (Swiss notation: CHF 69.90, Fr. 69.90, 69.90 CHF)
  let amount: number | null = null;
  let currency = "CHF";

  const amountPatterns = [
    // Total / Betrag / Zu zahlen / Endbetrag / Prämie CHF 69.90 or CHF 79.-
    /(?:total|gesamttotal|rechnungsbetrag|endbetrag|fälliger betrag|zu zahlen|betrag|prämie|monatlich)[\s:]*(?:chf|fr\.?|eur|€)?\s*([0-9]{1,4}(?:[.,][0-9]{2}|(?:\.-)))/i,
    // CHF 69.90 or Fr. 69.90 or CHF 79.-
    /(?:chf|fr\.)\s*([0-9]{1,4}(?:[.,][0-9]{2}|(?:\.-)))/i,
    // 69.90 CHF or 79.- CHF
    /([0-9]{1,4}(?:[.,][0-9]{2}|(?:\.-)))\s*(?:chf|fr\.)/i,
    // EUR notation
    /(?:eur|€)\s*([0-9]{1,4}(?:[.,][0-9]{2}))/i,
  ];

  for (const pat of amountPatterns) {
    const match = pat.exec(combinedText);
    if (match && match[1]) {
      const normalized = match[1].replace(".-", ".00").replace(",", ".");
      const parsed = parseFloat(normalized);
      if (parsed > 0 && parsed < 10000) {
        amount = Math.round(parsed * 100) / 100;
        if (match[0].toLowerCase().includes("eur") || match[0].includes("€")) {
          currency = "EUR";
        }
        evidence.push({
          field: "amount",
          value: amount,
          rawSnippet: match[0].trim(),
        });
        evidence.push({
          field: "currency",
          value: currency,
          rawSnippet: currency,
        });
        break;
      }
    }
  }

  // 3. Swiss UID / Enterprise identification (e.g. CHE-101.567.890)
  const uidMatch = /che[- ]?[0-9]{3}[. ]?[0-9]{3}[. ]?[0-9]{3}/i.exec(combinedText);
  if (uidMatch) {
    evidence.push({
      field: "uid",
      value: uidMatch[0].toUpperCase(),
      rawSnippet: uidMatch[0],
    });
  }

  // 4. QR-IBAN or IBAN detection
  const ibanMatch = /CH[0-9]{2}\s?[0-9]{4}\s?[0-9]{4}\s?[0-9]{4}\s?[0-9]{4}\s?[0-9]?/i.exec(combinedText);
  if (ibanMatch) {
    evidence.push({
      field: "qrIban",
      value: ibanMatch[0].replace(/\s+/g, ""),
      rawSnippet: ibanMatch[0],
    });
  }

  // 5. Contract / Reference Number
  const contractMatch = /(?:vertrags-?nr|kundennummer|rechnungs-?nr|vertrag|abo-id)[\s.:#]*([a-z0-9\-_]{5,20})/i.exec(combinedText);
  let contractNumber: string | undefined;
  if (contractMatch && contractMatch[1]) {
    contractNumber = contractMatch[1].trim();
    evidence.push({
      field: "contractNumber",
      value: contractNumber,
      rawSnippet: contractMatch[0],
    });
  }

  // 6. Dates (e.g. 31.12.2026 or 2026-12-31)
  const dateMatch = /\b([0-3]?[0-9][./-][0-1]?[0-9][./-](?:20)?[2-3][0-9])\b/.exec(combinedText);
  let renewalDate: string | undefined;
  if (dateMatch && dateMatch[1]) {
    const raw = dateMatch[1];
    const parts = raw.split(/[./-]/);
    if (parts.length === 3) {
      let day = parts[0];
      let month = parts[1];
      let year = parts[2];
      if (year.length === 2) year = `20${year}`;
      if (day.length === 1) day = `0${day}`;
      if (month.length === 1) month = `0${month}`;
      renewalDate = `${year}-${month}-${day}`;
      evidence.push({
        field: "date",
        value: renewalDate,
        rawSnippet: raw,
      });
    }
  }

  const confidence: "verified" | "estimated" | "manual_review_required" =
    provider && amount !== null ? "verified" : provider || amount !== null ? "estimated" : "manual_review_required";

  return {
    provider: provider || "Unbekannter Anbieter",
    plan: plan || "Standard",
    amount,
    currency,
    category,
    contractNumber,
    renewalDate,
    evidence,
    textSnippet: rawText.slice(0, 300).trim(),
    extractionConfidence: confidence,
  };
}
