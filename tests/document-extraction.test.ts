import test from "node:test";
import assert from "node:assert/strict";
import { parseInvoiceText, extractTextFromPdf } from "../artifacts/api-server/src/lib/document-extractor";

test("Document Extractor: parses Swisscom bill text correctly", () => {
  const invoiceSample = `
    Swisscom (Schweiz) AG
    Alte Tiefenaustrasse 6, 3050 Bern
    CHE-101.567.890 MWST

    Rechnung Nr: RE-2026-84920
    Datum: 15.02.2026
    Abrechnungsperiode: 01.02.2026 - 28.02.2026
    blue Mobile M: 69.90 CHF
    Zu zahlen bis 28.02.2026: CHF 69.90

    QR-IBAN: CH44 0848 0000 0101 5678 9
  `;

  const result = parseInvoiceText(invoiceSample, "Rechnung_Swisscom.pdf");

  assert.equal(result.provider, "Swisscom");
  assert.equal(result.category, "Telecom");
  assert.equal(result.amount, 69.9);
  assert.equal(result.currency, "CHF");
  assert.equal(result.extractionConfidence, "verified");
  assert.ok(result.evidence.some(e => e.field === "amount" && e.value === 69.9));
  assert.ok(result.evidence.some(e => e.field === "uid" && typeof e.value === "string" && e.value.includes("CHE-101.567.890")));
});

test("Document Extractor: handles uncompressed PDF streams", () => {
  const mockPdf = Buffer.from(`%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 65 >>
stream
BT
/F1 12 Tf
70 700 Td
(Wingo Swiss Internet Rechnung CHF 49.95) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
trailer
<< /Size 5 /Root 1 0 R >>
startxref
400
%%EOF`);

  const extracted = extractTextFromPdf(mockPdf);
  assert.ok(extracted.includes("Wingo Swiss Internet Rechnung CHF 49.95"));

  const parsed = parseInvoiceText(extracted, "wingo.pdf");
  assert.equal(parsed.provider, "Wingo");
  assert.equal(parsed.amount, 49.95);
  assert.equal(parsed.extractionConfidence, "verified");
});

test("Document Extractor: graceful fallback when amount is ambiguous", () => {
  const sparseText = "Hallo, vielen Dank für Ihre Registrierung bei Adobe Creative Cloud.";
  const result = parseInvoiceText(sparseText, "Adobe_Welcome.pdf");

  assert.equal(result.provider, "Adobe");
  assert.equal(result.amount, null);
  assert.equal(result.extractionConfidence, "estimated");
});

test("Document Extractor: safe filename sanitization prevents path traversal", () => {
  const badFilename = "../../../etc/passwd";
  const result = parseInvoiceText("Swisscom blue Mobile CHF 79.00", badFilename);
  assert.equal(result.provider, "Swisscom");
  assert.equal(result.amount, 79.0);
  assert.equal(result.currency, "CHF");
});
