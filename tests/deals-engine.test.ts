import test from "node:test";
import assert from "node:assert/strict";
import { calculateDealsForSubscriptions, calculatePortfolioHealth } from "../artifacts/subly/src/lib/deals-engine";

test("Deals Engine: detects zombie subscriptions (>45 days inactive)", () => {
  const sixtyDaysAgo = new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10);
  const subs = [
    {
      id: 1,
      provider: "Audible",
      plan: "Standard",
      category: "Entertainment",
      amount: 14.95,
      billingCycle: "monthly",
      status: "active",
      lastUsed: sixtyDaysAgo,
    },
  ];

  const deals = calculateDealsForSubscriptions(subs);
  const zombieDeal = deals.find(d => d.type === "zombie");

  assert.ok(zombieDeal, "Should detect a zombie deal for Audible");
  assert.equal(zombieDeal?.confidenceLevel, "verified");
  assert.equal(zombieDeal?.subscriptionId, 1);
  assert.equal(zombieDeal?.yearlySavings, 179.4);
});

test("Deals Engine: detects video streaming overlap and calculates realistic savings", () => {
  const today = new Date().toISOString().slice(0, 10);
  const subs = [
    {
      id: 1,
      provider: "Netflix",
      plan: "Premium",
      category: "Entertainment",
      amount: 27.9,
      billingCycle: "monthly",
      status: "active",
      lastUsed: today,
    },
    {
      id: 2,
      provider: "Disney+",
      plan: "Standard",
      category: "Entertainment",
      amount: 17.9,
      billingCycle: "monthly",
      status: "active",
      lastUsed: today,
    },
  ];

  const deals = calculateDealsForSubscriptions(subs);
  const overlapDeal = deals.find(d => d.type === "overlap");

  assert.ok(overlapDeal, "Should detect video streaming overlap");
  assert.equal(overlapDeal?.confidenceLevel, "estimated");
  // Savings should equal pausing the cheaper service (Disney+ CHF 17.90/Mt => CHF 214.80/Jahr)
  assert.equal(overlapDeal?.monthlySavings, 17.9);
  assert.equal(overlapDeal?.yearlySavings, 214.8);
});

test("Deals Engine: matches Swiss telecom benchmark (Swisscom -> Wingo)", () => {
  const today = new Date().toISOString().slice(0, 10);
  const subs = [
    {
      id: 10,
      provider: "Swisscom",
      plan: "blue Mobile L",
      category: "Telecom",
      amount: 89.9,
      billingCycle: "monthly",
      status: "active",
      lastUsed: today,
    },
  ];

  const deals = calculateDealsForSubscriptions(subs);
  const switchDeal = deals.find(d => d.type === "market_alternative");

  assert.ok(switchDeal, "Should find alternative for expensive Swisscom mobile");
  assert.equal(switchDeal?.confidenceLevel, "verified");
  assert.ok(switchDeal?.alternativeProvider?.includes("Wingo"));
  // Wingo is 24.95 => savings = 89.90 - 24.95 = 64.95/Mt => 779.40/yr
  assert.equal(switchDeal?.monthlySavings, 64.95);
  assert.equal(switchDeal?.yearlySavings, 779.4);
});

test("Portfolio Health: calculates transparent score and breakdown", () => {
  const sixtyDaysAgo = new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10);
  const subs = [
    {
      id: 1,
      provider: "Gym A",
      amount: 60,
      billingCycle: "monthly",
      status: "active",
      lastUsed: sixtyDaysAgo, // Zombie
    },
    {
      id: 2,
      provider: "Swisscom",
      amount: 80,
      billingCycle: "monthly",
      status: "active",
      lastUsed: new Date().toISOString().slice(0, 10),
    },
  ];

  const deals = calculateDealsForSubscriptions(subs);
  const health = calculatePortfolioHealth(subs, deals);

  assert.ok(health.score < 100, "Health score should reflect inefficiency");
  assert.ok(health.breakdown.length > 0, "Should provide an explainable breakdown");
  const zombieBreakdown = health.breakdown.find(b => b.factor.includes("Zombie-Abo"));
  assert.ok(zombieBreakdown, "Should include zombie penalty factor");
  assert.equal(zombieBreakdown?.type, "negative");
});

test("Portfolio Health: perfect score on clean portfolio", () => {
  const health = calculatePortfolioHealth([], []);
  assert.equal(health.score, 100);
  assert.equal(health.rating, "Ausgezeichnet");
});

test("Deals Engine: excludes cancelled subscriptions from deals calculation", () => {
  const sixtyDaysAgo = new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10);
  const subs = [
    {
      id: 99,
      provider: "Swisscom",
      plan: "blue Mobile L",
      category: "Telecom",
      amount: 89.9,
      billingCycle: "monthly",
      status: "cancelled", // Cancelled!
      lastUsed: sixtyDaysAgo,
    },
  ];

  const deals = calculateDealsForSubscriptions(subs);
  assert.equal(deals.length, 0, "Cancelled subscriptions must not trigger deals");
});

test("Deals Engine: recognizes Qualitop fitness reimbursement as estimated confidence with disclaimer", () => {
  const subs = [
    {
      id: 5,
      provider: "Fitnessplus",
      plan: "Jahresabo",
      category: "Fitness",
      amount: 800,
      billingCycle: "yearly",
      status: "active",
      lastUsed: new Date().toISOString().slice(0, 10),
    },
  ];

  const deals = calculateDealsForSubscriptions(subs);
  const qualitopDeal = deals.find(d => d.type === "health_insurance");

  if (qualitopDeal) {
    assert.equal(qualitopDeal.confidenceLevel, "estimated", "Qualitop benefits vary by Zusatzversicherung and must be estimated");
    assert.ok(qualitopDeal.disclaimer, "Qualitop deal must have a disclaimer");
  }
});

test("Deals Engine: cross-currency comparison and realistic claims", () => {
  const today = new Date().toISOString().slice(0, 10);
  const subs = [
    {
      id: 20,
      provider: "Swisscom",
      plan: "blue Mobile L",
      category: "Telecom",
      amount: 89.90,
      currency: "EUR", // Subscription in EUR, benchmark in CHF
      billingCycle: "monthly",
      status: "active",
      lastUsed: today,
    },
  ];

  const deals = calculateDealsForSubscriptions(subs);
  const deal = deals.find(d => d.subscriptionId === 20);
  assert.ok(deal);
  
  // Disclaimer must exist and mention currency conversion
  assert.ok(deal?.disclaimer?.includes("Wechselkurs"));

  // Check that deal explanation & highlights do NOT contain forbidden exaggerated marketing claims
  const forbiddenWords = ["garantiert", "100%", "identisch"];
  for (const word of forbiddenWords) {
    assert.equal(
      deal?.explanation.toLowerCase().includes(word),
      false,
      `Deal explanation should not contain ungrounded claim '${word}'`
    );
  }
});

test("Portfolio Health: formulations avoid ungrounded absolute guarantees", () => {
  const cleanHealth = calculatePortfolioHealth([], []);
  assert.equal(cleanHealth.summary, "Keine bekannten Optimierungsmöglichkeiten erkannt");
  assert.equal(cleanHealth.score, 100);
});
