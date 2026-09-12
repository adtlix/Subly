import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { cloudDb } from "../artifacts/api-server/src/lib/cloud-db";

test("Database & Auth: enforces user isolation and valid subscription data", () => {
  // 1. Create two separate test users
  const testEmail1 = `user1_${Date.now()}@test.ch`;
  const testEmail2 = `user2_${Date.now()}@test.ch`;

  const user1 = cloudDb.createUser(testEmail1, "secret123", "Test User 1");
  const user2 = cloudDb.createUser(testEmail2, "secret456", "Test User 2");

  assert.ok(user1.id);
  assert.ok(user2.id);
  assert.notEqual(user1.id, user2.id);

  // 2. Add subscription for user 1
  const sub1 = cloudDb.createSubscription(user1.id, {
    provider: "Wingo",
    plan: "Swiss Pro",
    category: "Telecom",
    amount: 25.0,
    currency: "CHF",
    billing_cycle: "monthly",
    next_renewal: "2026-10-01",
    notice_days: 30,
    last_used: "2026-09-01",
    status: "active",
    contract_number: "CH-12345",
    color: "#182d3b",
    logo_text: "WI",
    cancellation_address: "wingo.ch",
    hotline: "",
    price_change: null,
  });

  assert.ok(sub1.id);

  // 3. User 2 must NOT be able to list or see user 1's subscription (IDOR prevention)
  const user2Subs = cloudDb.listSubscriptions(user2.id);
  assert.equal(user2Subs.length, 0, "User 2 must not see user 1's subscriptions");

  const directFetch = cloudDb.getSubscription(user2.id, sub1.id);
  assert.equal(directFetch, null, "Direct fetch by wrong user_id must return null");

  // 4. Update attempt by unauthorized user must fail
  const unauthorizedUpdate = cloudDb.updateSubscription(user2.id, sub1.id, { amount: 0 });
  assert.equal(unauthorizedUpdate, null, "Update by wrong user must return null");

  // 5. Delete attempt by unauthorized user must fail
  const unauthorizedDelete = cloudDb.deleteSubscription(user2.id, sub1.id);
  assert.equal(unauthorizedDelete, false, "Delete by wrong user must return false");

  // Clean up
  cloudDb.deleteSubscription(user1.id, sub1.id);
});

test("Database & Auth: 2FA rate limiting and lockout after 5 attempts", () => {
  const testEmail = `2fa_test_${Date.now()}@test.ch`;
  cloudDb.createUser(testEmail, "password123", "2FA Tester");

  const { challengeId, code } = cloudDb.generate2FACode(testEmail);

  // 4 incorrect attempts
  for (let i = 0; i < 4; i++) {
    const res = cloudDb.verify2FACode(challengeId, "999999");
    assert.equal(res.success, false);
    assert.equal(res.reason, "invalid");
  }

  // 5th incorrect attempt -> locks the code
  const fifthAttempt = cloudDb.verify2FACode(challengeId, "999999");
  assert.equal(fifthAttempt.success, false);
  assert.equal(fifthAttempt.reason, "locked");

  // Even the correct code is now rejected because attempts >= 5
  const lockedAttempt = cloudDb.verify2FACode(challengeId, code);
  assert.equal(lockedAttempt.success, false);
  assert.equal(lockedAttempt.reason, "locked");
});

test("Database & Auth: createUser rejects duplicate email without overwriting password", () => {
  const email = `unique_${Date.now()}@subly.ch`;
  const firstUser = cloudDb.createUser(email, "firstPassword123", "First User");
  assert.ok(firstUser.id);

  // Attempting to create user with the same email must throw
  assert.throws(() => {
    cloudDb.createUser(email, "secondPassword456", "Second User");
  }, /bereits registriert|existiert bereits|UNIQUE constraint failed/);

  // Verifying that original password hash matches initial secret
  const fetchedUser = cloudDb.getUserByEmail(email);
  assert.ok(fetchedUser);
  const isValid = cloudDb.verifyPassword("firstPassword123", fetchedUser.password_hash, fetchedUser.salt);
  assert.equal(isValid, true, "Original password must not be overwritten");
});

test("Database & Auth: changePassword verifies old password and revokes all sessions", () => {
  const email = `pw_change_${Date.now()}@subly.ch`;
  const user = cloudDb.createUser(email, "initialSecret123", "Password Changer");

  // Create active session
  const sessionToken = cloudDb.createSession(user.id);
  const validSession = cloudDb.getUserFromSession(sessionToken);
  assert.ok(validSession);
  assert.equal(validSession.user.id, user.id);

  // Wrong old password fails
  assert.throws(() => {
    cloudDb.changePassword(user.id, "wrongOldPassword", "newSecret456");
  }, /Altes Passwort ist nicht korrekt|Das aktuelle Passwort ist nicht korrekt/);

  // Too short new password fails
  assert.throws(() => {
    cloudDb.changePassword(user.id, "initialSecret123", "short");
  }, /mindestens 8 Zeichen/);

  // Correct old password succeeds
  const updated = cloudDb.changePassword(user.id, "initialSecret123", "newSecret456");
  assert.equal(updated.success, true);

  // Existing session MUST be revoked
  const revokedSession = cloudDb.getUserFromSession(sessionToken);
  assert.equal(revokedSession, null, "All prior sessions must be invalidated on password change");

  // Verify new password works
  const updatedUser = cloudDb.getUserById(user.id);
  assert.ok(updatedUser);
  const isNewValid = cloudDb.verifyPassword("newSecret456", updatedUser.password_hash, updatedUser.salt);
  assert.equal(isNewValid, true);
});

test("Database & Auth: 2FA challenge binding prevents replay or challenge hijacking", () => {
  const email = `challenge_test_${Date.now()}@subly.ch`;
  const user = cloudDb.createUser(email, "password123", "Challenge User");

  const challenge1 = cloudDb.createTwoFactorChallenge(user.id, email);
  assert.ok(challenge1.challengeId);
  assert.ok(challenge1.code);

  // Verification with wrong challengeId fails
  const wrongChallengeRes = cloudDb.verify2FACode("otp_invalid_challenge_id", challenge1.code);
  assert.equal(wrongChallengeRes.success, false);

  // Verification with correct challengeId succeeds
  const validRes = cloudDb.verify2FACode(challenge1.challengeId, challenge1.code);
  assert.equal(validRes.success, true);

  // Cannot reuse code for second login
  const reuseRes = cloudDb.verify2FACode(challenge1.challengeId, challenge1.code);
  assert.equal(reuseRes.success, false);
});

test("Database & Auth: 2FA challenge isolation prevents cross-user verification and old challenge invalidation", () => {
  const emailA = `user_a_${Date.now()}@subly.ch`;
  const emailB = `user_b_${Date.now()}@subly.ch`;
  const userA = cloudDb.createUser(emailA, "passwordA123", "User A");
  const userB = cloudDb.createUser(emailB, "passwordB123", "User B");

  const challengeA = cloudDb.createTwoFactorChallenge(userA.id, emailA);
  const challengeB = cloudDb.createTwoFactorChallenge(userB.id, emailB);

  // User B's code with User A's challengeId must fail
  const crossRes = cloudDb.verify2FACode(challengeA.challengeId, challengeB.code);
  assert.equal(crossRes.success, false);

  // Generating a new challenge for User A must invalidate the previous challenge
  const challengeA2 = cloudDb.createTwoFactorChallenge(userA.id, emailA);
  const oldChallengeRes = cloudDb.verify2FACode(challengeA.challengeId, challengeA.code);
  assert.equal(oldChallengeRes.success, false, "Old challenge must be marked used/invalidated when new challenge is requested");

  // New challenge succeeds
  const newChallengeRes = cloudDb.verify2FACode(challengeA2.challengeId, challengeA2.code);
  assert.equal(newChallengeRes.success, true);
  assert.equal(newChallengeRes.user?.id, userA.id);
});

test("Database & Auth: password policy requires at least 8 characters on create and update", () => {
  const shortPwEmail = `short_pw_${Date.now()}@subly.ch`;
  
  // Registration with < 8 characters throws
  assert.throws(() => {
    cloudDb.createUser(shortPwEmail, "1234567", "Short Pw");
  }, /mindestens 8 Zeichen/);

  const user = cloudDb.createUser(shortPwEmail, "validPass123", "Valid Pw");
  assert.ok(user.id);

  // Update with < 8 characters throws
  assert.throws(() => {
    cloudDb.changePassword(user.id, "validPass123", "short");
  }, /mindestens 8 Zeichen/);
});
