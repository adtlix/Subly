import { Router, type IRouter, type RequestHandler, type Response } from "express";
import { cloudDb, type User, type UserSettings } from "../lib/cloud-db";
import { sendVerificationEmail } from "../lib/mailer";
import { validateEmail, validatePassword } from "../lib/validation";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: User;
      userSettings?: UserSettings;
    }
  }
}

const router: IRouter = Router();

// In-memory sliding rate limiter per IP / identifier to prevent brute-force attacks
const attemptTracker = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, maxAttempts = 5, windowMs = 60_000): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = attemptTracker.get(key);
  if (!entry || entry.resetAt <= now) {
    attemptTracker.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }
  if (entry.count >= maxAttempts) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count += 1;
  return { allowed: true };
}

function setSessionCookie(res: Response, token: string): void {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("subly_token", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: "/",
  });
}

function clearSessionCookie(res: Response): void {
  const isProd = process.env.NODE_ENV === "production";
  res.clearCookie("subly_token", {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
  });
}

/**
 * Cloud authentication middleware.
 * Primary method for browser clients: secure HttpOnly cookie `subly_token`.
 * Secondary method for automated testing / programmatic clients: `Authorization: Bearer <token>`.
 */
export const requireCloudAuth: RequestHandler = (req, res, next) => {
  const cookieToken = req.cookies?.subly_token;
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

  const token = cookieToken || bearerToken;

  if (!token || typeof token !== "string") {
    res.status(401).json({ error: "Authentifizierung erforderlich. Bitte melde dich an." });
    return;
  }

  const session = cloudDb.getUserFromSession(token);
  if (!session) {
    clearSessionCookie(res);
    res.status(401).json({ error: "Sitzung abgelaufen oder ungültig." });
    return;
  }

  req.userId = session.user.id;
  req.user = session.user;
  req.userSettings = session.settings;
  next();
};

// POST /api/auth/register
router.post("/auth/register", async (req, res): Promise<void> => {
  const { email, password, name } = req.body || {};

  let cleanEmail: string;
  let cleanPassword: string;
  try {
    cleanEmail = validateEmail(email);
    cleanPassword = validatePassword(password, 8);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ungültige Registrierungsdaten.";
    res.status(400).json({ error: message });
    return;
  }

  const ip = req.ip || "ip";
  const rl = checkRateLimit(`reg:${ip}`, 5, 60_000);
  if (!rl.allowed) {
    res.status(429).json({ error: `Zu viele Versuche. Bitte warte ${rl.retryAfter} Sekunden.` });
    return;
  }

  // Prevent account takeover: existing email must not overwrite credentials
  const existingUser = cloudDb.getUserByEmail(cleanEmail);
  if (existingUser) {
    res.status(409).json({ error: "Ein Konto mit dieser E-Mail-Adresse existiert bereits. Bitte melde dich an." });
    return;
  }

  try {
    const user = cloudDb.createUser(cleanEmail, cleanPassword, typeof name === "string" ? name.trim() : "");
    const { challengeId, code, expiresAt } = cloudDb.createTwoFactorChallenge(user.id, user.email);
    await sendVerificationEmail({ to: user.email, code, name: user.name });

    res.status(201).json({
      success: true,
      message: "Wir haben einen 6-stelligen Bestätigungscode an deine E-Mail gesendet.",
      require2FA: true,
      challengeId,
      email: user.email,
      expiresAt,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Registrierung fehlgeschlagen.";
    res.status(400).json({ error: message });
  }
});

// POST /api/auth/login
router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body || {};

  let cleanEmail: string;
  let cleanPassword: string;
  try {
    cleanEmail = validateEmail(email);
    cleanPassword = validatePassword(password, 8);
  } catch {
    res.status(400).json({ error: "E-Mail und Passwort erforderlich (mindestens 8 Zeichen)." });
    return;
  }

  const ip = req.ip || "ip";
  const rl = checkRateLimit(`login:${ip}:${cleanEmail}`, 5, 60_000);
  if (!rl.allowed) {
    res.status(429).json({ error: `Zu viele Anmeldeversuche. Bitte warte ${rl.retryAfter} Sekunden.` });
    return;
  }

  const user = cloudDb.getUserByEmail(cleanEmail);

  // Timing attack & account enumeration defense: perform dummy computation if user does not exist
  if (!user) {
    const dummySalt = "0123456789abcdef0123456789abcdef";
    cloudDb.verifyPassword(cleanPassword, "0".repeat(128), dummySalt);
    res.status(401).json({ error: "Ungültige E-Mail-Adresse oder falsches Passwort." });
    return;
  }

  const valid = cloudDb.verifyPassword(cleanPassword, user.password_hash, user.salt);
  if (!valid) {
    res.status(401).json({ error: "Ungültige E-Mail-Adresse oder falsches Passwort." });
    return;
  }

  try {
    const { challengeId, code, expiresAt } = cloudDb.createTwoFactorChallenge(user.id, user.email);
    await sendVerificationEmail({ to: user.email, code, name: user.name });

    res.json({
      success: true,
      require2FA: true,
      challengeId,
      email: user.email,
      message: "Ein 6-stelliger Bestätigungscode wurde an deine E-Mail gesendet.",
      expiresAt,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Anmeldung fehlgeschlagen.";
    res.status(400).json({ error: message });
  }
});

// POST /api/auth/verify-2fa
router.post("/auth/verify-2fa", async (req, res): Promise<void> => {
  const { challengeId, code } = req.body || {};

  if (!challengeId || typeof challengeId !== "string" || !challengeId.trim()) {
    res.status(400).json({ error: "Sicherheits-Challenge-ID ist erforderlich." });
    return;
  }
  const cleanChallengeId = challengeId.trim();

  if (!code || typeof code !== "string" || code.trim().length !== 6) {
    res.status(400).json({ error: "Ein 6-stelliger Sicherheitscode ist erforderlich." });
    return;
  }

  const ip = req.ip || "ip";
  // Rate limit per IP + challengeId
  const rl = checkRateLimit(`verify2fa:${ip}:${cleanChallengeId}`, 5, 60_000);
  if (!rl.allowed) {
    res.status(429).json({ error: `Zu viele Versuche. Bitte warte ${rl.retryAfter} Sekunden.` });
    return;
  }

  const result = cloudDb.verify2FACode(cleanChallengeId, code.trim());
  if (!result.success) {
    if (result.reason === "locked") {
      res.status(429).json({ error: "Zu viele Fehlversuche. Diese Sicherheits-Challenge wurde gesperrt. Bitte fordere einen neuen Code an." });
      return;
    }
    if (result.reason === "expired") {
      res.status(400).json({ error: "Der Sicherheitscode ist abgelaufen oder wurde bereits verwendet. Bitte fordere einen neuen an." });
      return;
    }
    res.status(400).json({ error: "Ungültiger Bestätigungscode." });
    return;
  }

  const user = result.user;
  if (!user) {
    res.status(401).json({ error: "Benutzerkonto nicht gefunden." });
    return;
  }

  const token = cloudDb.createSession(user.id);
  const settings = cloudDb.getUserSettings(user.id);

  // Set secure HttpOnly cookie
  setSessionCookie(res, token);

  // In accordance with zero-trust principles, session token is NOT returned in JSON response
  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    settings,
  });
});

// POST /api/auth/resend-code
router.post("/auth/resend-code", async (req, res): Promise<void> => {
  const { challengeId, email } = req.body || {};
  const ip = req.ip || "ip";

  const identifier = typeof challengeId === "string" && challengeId.trim()
    ? challengeId.trim()
    : typeof email === "string" ? email.trim().toLowerCase() : "";

  if (!identifier) {
    res.status(400).json({ error: "Challenge-ID oder E-Mail erforderlich." });
    return;
  }

  // Minimum 60s cooldown (1 request per 60 seconds)
  const rl = checkRateLimit(`resend:${ip}:${identifier}`, 1, 60_000);
  if (!rl.allowed) {
    res.status(429).json({ error: `Bitte warte ${rl.retryAfter} Sekunden, bevor du einen neuen Code anforderst.` });
    return;
  }

  let targetUser: User | null = null;
  if (identifier.startsWith("otp_")) {
    const codeRow = (cloudDb as unknown as { db?: { prepare: (q: string) => { get: (id: string) => { user_id?: string; email: string } | undefined } } })
      .db?.prepare("SELECT * FROM verification_codes WHERE id = ?").get(identifier);
    if (codeRow) {
      targetUser = codeRow.user_id ? cloudDb.getUserById(codeRow.user_id) : cloudDb.getUserByEmail(codeRow.email);
    }
  }

  if (!targetUser && typeof email === "string" && email.trim()) {
    targetUser = cloudDb.getUserByEmail(email.trim().toLowerCase());
  }

  // Account enumeration defense: respond with generic success message even if account is not found
  if (!targetUser) {
    res.json({
      success: true,
      message: "Falls ein Konto existiert, wurde ein neuer Bestätigungscode versendet.",
      expiresAt: Date.now() + 10 * 60 * 1000,
    });
    return;
  }

  // createTwoFactorChallenge invalidates existing unused codes, creating a fresh challenge
  const { challengeId: newChallengeId, code, expiresAt } = cloudDb.createTwoFactorChallenge(targetUser.id, targetUser.email);
  await sendVerificationEmail({ to: targetUser.email, code, name: targetUser.name });

  res.json({
    success: true,
    challengeId: newChallengeId,
    message: "Neuer 6-stelliger Sicherheitscode an deine E-Mail gesendet.",
    expiresAt,
  });
});

// POST /api/auth/change-password
router.post("/auth/change-password", requireCloudAuth, (req, res): void => {
  const userId = req.userId!;
  const { currentPassword, newPassword } = req.body || {};

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "Aktuelles und neues Passwort sind erforderlich." });
    return;
  }

  try {
    validatePassword(newPassword, 8);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Neues Passwort ungültig.";
    res.status(400).json({ error: message });
    return;
  }

  try {
    cloudDb.changePassword(userId, currentPassword, newPassword);

    // Issue a fresh session for the current user and set new cookie
    const newToken = cloudDb.createSession(userId);
    setSessionCookie(res, newToken);

    // In accordance with zero-trust principles, session token is NOT returned in JSON response
    res.json({
      success: true,
      message: "Passwort erfolgreich geändert. Alle anderen Sitzungen wurden abgemeldet.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Passwortänderung fehlgeschlagen.";
    res.status(400).json({ error: message });
  }
});

// GET /api/auth/me
router.get("/auth/me", requireCloudAuth, (req, res): void => {
  const user = req.user!;
  const settings = req.userSettings!;
  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.created_at,
    },
    settings,
  });
});

// PATCH /api/auth/settings
router.patch("/auth/settings", requireCloudAuth, (req, res): void => {
  const userId = req.userId!;
  const { name, currency, notice_days, two_factor_enabled } = req.body || {};

  const updated = cloudDb.updateUserSettings(userId, {
    name: typeof name === "string" ? name.trim() : undefined,
    currency: typeof currency === "string" ? currency.trim().toUpperCase() : undefined,
    notice_days: notice_days !== undefined ? Number(notice_days) : undefined,
    two_factor_enabled: two_factor_enabled !== undefined ? (two_factor_enabled ? 1 : 0) : undefined,
  });

  res.json({
    success: true,
    user: {
      id: updated.user.id,
      email: updated.user.email,
      name: updated.user.name,
    },
    settings: updated.settings,
  });
});

// POST /api/auth/logout
router.post("/auth/logout", (req, res): void => {
  const cookieToken = req.cookies?.subly_token;
  const authHeader = req.headers.authorization;
  const token = cookieToken || (authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null);

  if (token && typeof token === "string") {
    cloudDb.deleteSession(token);
  }

  clearSessionCookie(res);
  res.json({ success: true, message: "Erfolgreich abgemeldet." });
});

export default router;
