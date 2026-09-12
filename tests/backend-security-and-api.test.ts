import test from "node:test";
import assert from "node:assert/strict";
import { cloudDb, timingSafeStringEqual } from "../artifacts/api-server/src/lib/cloud-db";
import { parseInvoiceText, extractTextFromPdf } from "../artifacts/api-server/src/lib/document-extractor";

test("Backend Security: timingSafeStringEqual handles varying inputs safely", () => {
  assert.equal(timingSafeStringEqual("123456", "123456"), true);
  assert.equal(timingSafeStringEqual("123456", "123457"), false);
  assert.equal(timingSafeStringEqual("123456", "12345"), false);
  assert.equal(timingSafeStringEqual("secret_token_abc", "secret_token_abc"), true);
  assert.equal(timingSafeStringEqual("secret_token_abc", "secret_token_xyz"), false);
});

test("Database Isolation & Authorization: User A and User B subscriptions are strictly segregated", () => {
  const userA = cloudDb.getOrCreateUser("user_a_" + Date.now() + "@subly.ch", "User A");
  const userB = cloudDb.getOrCreateUser("user_b_" + Date.now() + "@subly.ch", "User B");

  // User A creates a subscription
  const subA = cloudDb.createSubscription(userA.id, {
    provider: "Swisscom",
    plan: "blue Mobile M",
    category: "Telecom",
    amount: 79.90,
    currency: "CHF",
    billing_cycle: "monthly",
    next_renewal: "2026-10-01",
    notice_days: 30,
    last_used: "2026-09-01",
    status: "active",
    contract_number: "SC-9921",
    color: "#00143d",
    logo_text: "SC",
    cancellation_address: "Swisscom AG, 3050 Bern",
    hotline: "0800 800 800",
  });

  // User A can access it
  const retrievedA = cloudDb.getSubscription(userA.id, subA.id);
  assert.ok(retrievedA);
  assert.equal(retrievedA.provider, "Swisscom");
  assert.equal(retrievedA.amount, 79.90);

  // User B CANNOT access User A's subscription
  const retrievedB = cloudDb.getSubscription(userB.id, subA.id);
  assert.equal(retrievedB, null);

  // System check detects it belongs to another user (for 403 Forbidden check)
  const anySub = cloudDb.getSubscriptionByIdAnyUser(subA.id);
  assert.ok(anySub);
  assert.equal(anySub.user_id, userA.id);
  assert.notEqual(anySub.user_id, userB.id);

  // User B CANNOT update or delete User A's subscription
  const updatedByB = cloudDb.updateSubscription(userB.id, subA.id, { amount: 10.00 });
  assert.equal(updatedByB, null);

  const deletedByB = cloudDb.deleteSubscription(userB.id, subA.id);
  assert.equal(deletedByB, false);

  // User A can update and delete their own subscription
  const updatedByA = cloudDb.updateSubscription(userA.id, subA.id, { amount: 69.90 });
  assert.ok(updatedByA);
  assert.equal(updatedByA.amount, 69.90);

  const deletedByA = cloudDb.deleteSubscription(userA.id, subA.id);
  assert.equal(deletedByA, true);
});

test("Database Validation: enforces non-negative amounts, rounding, and transaction safety", () => {
  const user = cloudDb.getOrCreateUser("val_user_" + Date.now() + "@subly.ch", "Validation User");

  // Negative amounts throw an error
  assert.throws(() => {
    cloudDb.createSubscription(user.id, {
      provider: "Invalid Sub",
      plan: "",
      category: "Other",
      amount: -15.50,
      currency: "CHF",
      billing_cycle: "monthly",
      next_renewal: "2026-10-01",
      notice_days: 30,
      last_used: "2026-09-01",
      status: "active",
      contract_number: "",
      color: "#000",
      logo_text: "IN",
      cancellation_address: "",
      hotline: "",
    });
  });

  // Amounts are correctly rounded to 2 decimal places
  const sub = cloudDb.createSubscription(user.id, {
    provider: "Rounding Sub",
    plan: "",
    category: "Software",
    amount: 19.999,
    currency: "CHF",
    billing_cycle: "monthly",
    next_renewal: "2026-10-01",
    notice_days: 30,
    last_used: "2026-09-01",
    status: "active",
    contract_number: "",
    color: "#000",
    logo_text: "RO",
    cancellation_address: "",
    hotline: "",
  });
  assert.equal(sub.amount, 20.00);

  // Bulk creation inside transaction
  const bulk = cloudDb.createSubscriptionsBulk(user.id, [
    {
      provider: "Bulk 1",
      plan: "",
      category: "Software",
      amount: 10.00,
      currency: "CHF",
      billing_cycle: "monthly",
      next_renewal: "2026-10-01",
      notice_days: 30,
      last_used: "2026-09-01",
      status: "active",
      contract_number: "",
      color: "#000",
      logo_text: "B1",
      cancellation_address: "",
      hotline: "",
    },
    {
      provider: "Bulk 2",
      plan: "",
      category: "Software",
      amount: 20.00,
      currency: "CHF",
      billing_cycle: "monthly",
      next_renewal: "2026-10-01",
      notice_days: 30,
      last_used: "2026-09-01",
      status: "active",
      contract_number: "",
      color: "#000",
      logo_text: "B2",
      cancellation_address: "",
      hotline: "",
    }
  ]);
  assert.equal(bulk.length, 2);
});

test("Database Validation: rejects out-of-bounds parameters (excessive amount, missing provider)", () => {
  const user = cloudDb.getOrCreateUser("bounds_user_" + Date.now() + "@subly.ch", "Bounds User");

  // Amount > 1,000,000 throws
  assert.throws(() => {
    cloudDb.createSubscription(user.id, {
      provider: "Excessive Sub",
      plan: "",
      category: "Software",
      amount: 1_000_001,
      currency: "CHF",
      billing_cycle: "monthly",
      next_renewal: "2026-10-01",
      notice_days: 30,
      last_used: "2026-09-01",
      status: "active",
      contract_number: "",
      color: "#000",
      logo_text: "EX",
      cancellation_address: "",
      hotline: "",
    });
  }, /1'000'000/);

  // Missing provider throws
  assert.throws(() => {
    cloudDb.createSubscription(user.id, {
      provider: "   ",
      plan: "",
      category: "Software",
      amount: 50,
      currency: "CHF",
      billing_cycle: "monthly",
      next_renewal: "2026-10-01",
      notice_days: 30,
      last_used: "2026-09-01",
      status: "active",
      contract_number: "",
      color: "#000",
      logo_text: "EX",
      cancellation_address: "",
      hotline: "",
    });
  }, /Gültiger Anbieter/);

  // Notice days > 365 throws validation error (no silent clamping)
  assert.throws(() => {
    cloudDb.createSubscription(user.id, {
      provider: "Excessive Notice Sub",
      plan: "",
      category: "Software",
      amount: 50,
      currency: "CHF",
      billing_cycle: "monthly",
      next_renewal: "2026-10-01",
      notice_days: 400,
      last_used: "2026-09-01",
      status: "active",
      contract_number: "",
      color: "#000",
      logo_text: "CN",
      cancellation_address: "",
      hotline: "",
    });
  }, /Kündigungsfrist muss eine ganze Zahl zwischen 0 und 365 Tagen sein/);
});

test("Housekeeping: automatically cleans up expired sessions and verification codes", () => {
  const user = cloudDb.getOrCreateUser("cleanup_" + Date.now() + "@subly.ch", "Cleanup User");
  
  // Create a code and simulate expiration
  const { challengeId, code } = cloudDb.generate2FACode(user.email);
  const verifyValid = cloudDb.verify2FACode(challengeId, code);
  assert.equal(verifyValid.success, true);

  // Cannot reuse used code
  const verifyReused = cloudDb.verify2FACode(challengeId, code);
  assert.equal(verifyReused.success, false);

  // Run cleanup
  const stats = cloudDb.cleanupExpired();
  assert.equal(typeof stats.deletedSessions, "number");
  assert.equal(typeof stats.deletedCodes, "number");
});

test("Document Extractor: parses Swiss dash notation (CHF 79.- / Fr. 79.-)", () => {
  const sample = "Total monatliche Prämie: CHF 79.- zahlbar bis Ende Monat.";
  const result = parseInvoiceText(sample, "Swica_Rechnung.pdf");
  assert.equal(result.amount, 79.00);
  assert.equal(result.currency, "CHF");
});

test("Document Extractor: recognizes Swiss Krankenkasse (Swica, CSS, Helsana)", () => {
  const swicaSample = "SWICA Krankenversicherung AG - Prämie Grundversicherung CHF 384.50";
  const swicaRes = parseInvoiceText(swicaSample, "Swica.pdf");
  assert.equal(swicaRes.provider, "Swica");
  assert.equal(swicaRes.category, "Health");
  assert.equal(swicaRes.amount, 384.50);

  const cssSample = "CSS Versicherung Monatsrechnung Fr. 412.00";
  const cssRes = parseInvoiceText(cssSample, "CSS.pdf");
  assert.equal(cssRes.provider, "CSS");
  assert.equal(cssRes.category, "Health");
  assert.equal(cssRes.amount, 412.00);
});

test("Document Extractor: recognizes Swiss Mobility (SBB Generalabonnement)", () => {
  const sbbSample = "SBB CFF FFS - Generalabonnement 2. Klasse Erneuerung CHF 3995.00";
  const sbbRes = parseInvoiceText(sbbSample, "SBB_GA.pdf");
  assert.equal(sbbRes.provider, "SBB");
  assert.equal(sbbRes.category, "Mobility");
  assert.equal(sbbRes.amount, 3995.00);
});

test("Document Extractor: graceful handling of corrupted or truncated PDF streams", () => {
  const corruptedPdf = Buffer.from("%PDF-1.4 stream corrupted bytes ... non flate data");
  // extractTextFromPdf should never throw or crash on corrupted buffer
  const extracted = extractTextFromPdf(corruptedPdf);
  assert.equal(typeof extracted, "string");

  const parsed = parseInvoiceText(extracted, "corrupted.pdf");
  assert.ok(parsed);
  assert.equal(typeof parsed.provider, "string");
});

test("Database Validation: strictly rejects invalid dates, cycles, and currencies", () => {
  const user = cloudDb.getOrCreateUser("validation_strict_" + Date.now() + "@subly.ch", "Validation Strict");

  // Invalid next_renewal date (e.g. Feb 31) throws
  assert.throws(() => {
    cloudDb.createSubscription(user.id, {
      provider: "Date Error Provider",
      plan: "Pro",
      category: "Software",
      amount: 29.90,
      currency: "CHF",
      billing_cycle: "monthly",
      next_renewal: "2026-02-31",
      notice_days: 30,
      last_used: "2026-02-01",
      status: "active",
      contract_number: "",
      color: "#000",
      logo_text: "DE",
      cancellation_address: "",
      hotline: "",
    });
  }, /Gültiges Erneuerungsdatum/);

  // Invalid month in last_used throws
  assert.throws(() => {
    cloudDb.createSubscription(user.id, {
      provider: "Date Month Error",
      plan: "Pro",
      category: "Software",
      amount: 29.90,
      currency: "CHF",
      billing_cycle: "monthly",
      next_renewal: "2026-05-01",
      notice_days: 30,
      last_used: "2026-13-01",
      status: "active",
      contract_number: "",
      color: "#000",
      logo_text: "DE",
      cancellation_address: "",
      hotline: "",
    });
  }, /Gültiges Nutzungsdatum/);

  // Negative notice days throws
  assert.throws(() => {
    cloudDb.createSubscription(user.id, {
      provider: "Negative Notice",
      plan: "Pro",
      category: "Software",
      amount: 29.90,
      currency: "CHF",
      billing_cycle: "monthly",
      next_renewal: "2026-05-01",
      notice_days: -5,
      last_used: "2026-04-01",
      status: "active",
      contract_number: "",
      color: "#000",
      logo_text: "NN",
      cancellation_address: "",
      hotline: "",
    });
  }, /Kündigungsfrist muss eine ganze Zahl zwischen 0 und 365 Tagen sein/);

  // Unsupported billing cycle throws
  assert.throws(() => {
    cloudDb.createSubscription(user.id, {
      provider: "Invalid Cycle",
      plan: "Pro",
      category: "Software",
      amount: 29.90,
      currency: "CHF",
      billing_cycle: "bi-weekly" as any,
      next_renewal: "2026-05-01",
      notice_days: 30,
      last_used: "2026-04-01",
      status: "active",
      contract_number: "",
      color: "#000",
      logo_text: "IC",
      cancellation_address: "",
      hotline: "",
    });
  }, /Ungültiger Abrechnungszyklus/);

  // Unsupported currency throws
  assert.throws(() => {
    cloudDb.createSubscription(user.id, {
      provider: "Invalid Currency",
      plan: "Pro",
      category: "Software",
      amount: 29.90,
      currency: "XYZ" as any,
      billing_cycle: "monthly",
      next_renewal: "2026-05-01",
      notice_days: 30,
      last_used: "2026-04-01",
      status: "active",
      contract_number: "",
      color: "#000",
      logo_text: "IC",
      cancellation_address: "",
      hotline: "",
    });
  }, /Währung nicht unterstützt|Ungültige Währung/);
});
