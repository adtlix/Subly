import { DatabaseSync } from "node:sqlite";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export interface User {
  id: string;
  email: string;
  password_hash: string;
  salt: string;
  name: string;
  created_at: string;
}

export interface UserSettings {
  user_id: string;
  currency: string;
  notice_days: number;
  two_factor_enabled: number;
  updated_at: string;
}

export interface CloudSubscription {
  id: number;
  user_id: string;
  provider: string;
  plan: string;
  category: string;
  amount: number;
  currency: string;
  billing_cycle: string;
  next_renewal: string;
  notice_days: number;
  last_used: string;
  status: string;
  contract_number: string;
  color: string;
  logo_text: string;
  cancellation_address: string;
  hotline: string;
  price_change?: number | null;
  created_at: string;
  updated_at: string;
}

export interface VerificationCode {
  id: string;
  user_id?: string | null;
  email: string;
  code: string;
  salt?: string;
  expires_at: number;
  used: number;
  attempts: number;
  created_at: number;
}

export function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

import { isValidIsoDate, SUPPORTED_CURRENCIES, type SupportedCurrency } from "./validation";

export { isValidIsoDate, SUPPORTED_CURRENCIES, type SupportedCurrency };

export interface ISublyRepository {
  createUser(email: string, password: string, name?: string): User;
  getOrCreateUser(email: string, name?: string): User;
  getUserByEmail(email: string): User | null;
  getUserById(id: string): User | null;
  deleteUser(userId: string): boolean;
  changePassword(userId: string, currentPassword: string, newPassword: string): { success: boolean };
  getUserSettings(userId: string): UserSettings;
  updateUserSettings(userId: string, data: { name?: string; currency?: string; notice_days?: number; two_factor_enabled?: number }): { user: User; settings: UserSettings };
  generate2FACode(email: string): { code: string; expiresAt: number; challengeId: string };
  createTwoFactorChallenge(userId: string, email: string): { challengeId: string; code: string; expiresAt: number };
  verify2FACode(challengeId: string, code: string): { success: boolean; reason?: "invalid" | "expired" | "locked"; user?: User };
  createSession(userId: string): string;
  getUserFromSession(token: string): { user: User; settings: UserSettings } | null;
  deleteSession(token: string): void;
  deleteAllUserSessions(userId: string): number;
  listSubscriptions(userId: string): CloudSubscription[];
  createSubscription(userId: string, data: Omit<CloudSubscription, "id" | "user_id" | "created_at" | "updated_at">): CloudSubscription;
  createSubscriptionsBulk(userId: string, items: Omit<CloudSubscription, "id" | "user_id" | "created_at" | "updated_at">[]): CloudSubscription[];
  getSubscription(userId: string, id: number): CloudSubscription | null;
  getSubscriptionByIdAnyUser(id: number): { id: number; user_id: string } | null;
  updateSubscription(userId: string, id: number, data: Partial<Omit<CloudSubscription, "id" | "user_id" | "created_at">>): CloudSubscription | null;
  deleteSubscription(userId: string, id: number): boolean;
  clearUserSubscriptions(userId: string): number;
  cleanupExpired(): { deletedSessions: number; deletedCodes: number };
  ping(): boolean;
  close(): void;
}

class CloudDb implements ISublyRepository {
  private db: DatabaseSync;

  constructor() {
    let current = process.cwd();
    let rootDir = current;
    while (current && current !== path.dirname(current)) {
      if (fs.existsSync(path.join(current, "pnpm-workspace.yaml"))) {
        rootDir = current;
        break;
      }
      current = path.dirname(current);
    }
    const dataDir = path.resolve(rootDir, "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const dbPath = process.env.DATABASE_PATH
      ? path.resolve(rootDir, process.env.DATABASE_PATH)
      : path.resolve(dataDir, "subly.db");
    this.db = new DatabaseSync(dbPath);
    this.initPragmas();
    this.initTables();
  }

  private initPragmas() {
    // Enable WAL mode, normal synchronous, busy timeout and foreign keys
    try {
      this.db.exec("PRAGMA journal_mode = WAL;");
      this.db.exec("PRAGMA synchronous = NORMAL;");
      this.db.exec("PRAGMA busy_timeout = 5000;");
      this.db.exec("PRAGMA foreign_keys = ON;");
    } catch (_) {}
  }

  private initTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS user_settings (
        user_id TEXT PRIMARY KEY,
        currency TEXT NOT NULL DEFAULT 'CHF',
        notice_days INTEGER NOT NULL DEFAULT 30,
        two_factor_enabled INTEGER NOT NULL DEFAULT 1,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS verification_codes (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        email TEXT NOT NULL,
        code TEXT NOT NULL,
        salt TEXT NOT NULL DEFAULT '',
        expires_at INTEGER NOT NULL,
        used INTEGER NOT NULL DEFAULT 0,
        attempts INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        provider TEXT NOT NULL,
        plan TEXT NOT NULL DEFAULT '',
        category TEXT NOT NULL,
        amount REAL NOT NULL CHECK (amount >= 0),
        currency TEXT NOT NULL DEFAULT 'CHF',
        billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'quarterly', 'half-yearly', 'yearly')),
        next_renewal TEXT NOT NULL,
        notice_days INTEGER NOT NULL DEFAULT 30 CHECK (notice_days >= 0),
        last_used TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'paused')),
        contract_number TEXT NOT NULL DEFAULT '',
        color TEXT NOT NULL DEFAULT '#ed6a5a',
        logo_text TEXT NOT NULL DEFAULT 'S',
        cancellation_address TEXT NOT NULL DEFAULT '',
        hotline TEXT NOT NULL DEFAULT '',
        price_change REAL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      -- Subscription indices
      CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
      CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
      CREATE INDEX IF NOT EXISTS idx_subscriptions_next_renewal ON subscriptions(next_renewal);
      CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON subscriptions(user_id, status);
      CREATE INDEX IF NOT EXISTS idx_subscriptions_user_renewal ON subscriptions(user_id, next_renewal);

      -- Session indices
      CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

      -- Verification code indices
      CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON verification_codes(email);
      CREATE INDEX IF NOT EXISTS idx_verification_codes_code ON verification_codes(code);
      CREATE INDEX IF NOT EXISTS idx_verification_codes_expires_at ON verification_codes(expires_at);
      CREATE INDEX IF NOT EXISTS idx_verification_codes_email_created ON verification_codes(email, created_at);
    `);

    // Schema Migrations for existing databases
    try {
      this.db.exec("ALTER TABLE subscriptions ADD COLUMN currency TEXT NOT NULL DEFAULT 'CHF';");
    } catch (_) {}

    try {
      this.db.exec("ALTER TABLE verification_codes ADD COLUMN attempts INTEGER NOT NULL DEFAULT 0;");
    } catch (_) {}

    try {
      this.db.exec("ALTER TABLE verification_codes ADD COLUMN salt TEXT NOT NULL DEFAULT '';");
    } catch (_) {}

    try {
      this.db.exec("ALTER TABLE verification_codes ADD COLUMN user_id TEXT;");
    } catch (_) {}
  }

  // --- Password Hashing ---
  hashPassword(password: string, salt?: string): { hash: string; salt: string } {
    const s = salt || crypto.randomBytes(16).toString("hex");
    const hash = crypto.scryptSync(password, s, 64, { N: 16384, r: 8, p: 1 }).toString("hex");
    return { hash, salt: s };
  }

  verifyPassword(password: string, hash: string, salt: string): boolean {
    try {
      const calculated = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }).toString("hex");
      return timingSafeStringEqual(hash, calculated);
    } catch {
      return false;
    }
  }

  // --- User Operations ---
  createUser(email: string, password: string, name = ""): User {
    const cleanEmail = email.trim().toLowerCase();
    const existing = this.getUserByEmail(cleanEmail);
    if (existing) {
      throw new Error("Ein Benutzer mit dieser E-Mail-Adresse existiert bereits.");
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      throw new Error("Das Passwort muss mindestens 8 Zeichen lang sein.");
    }

    const { hash, salt } = this.hashPassword(password);
    const now = new Date().toISOString();
    const id = "usr_" + crypto.randomUUID().replace(/-/g, "").slice(0, 16);

    try {
      const insertUser = this.db.prepare(
        "INSERT INTO users (id, email, password_hash, salt, name, created_at) VALUES (?, ?, ?, ?, ?, ?)"
      );
      insertUser.run(id, cleanEmail, hash, salt, name.trim() || cleanEmail.split("@")[0], now);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("UNIQUE") || (typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "SQLITE_CONSTRAINT")) {
        throw new Error("Ein Benutzer mit dieser E-Mail-Adresse existiert bereits.");
      }
      throw err;
    }

    const insertSettings = this.db.prepare(
      "INSERT INTO user_settings (user_id, currency, notice_days, two_factor_enabled, updated_at) VALUES (?, 'CHF', 30, 1, ?)"
    );
    insertSettings.run(id, now);

    return { id, email: cleanEmail, password_hash: hash, salt, name: name.trim() || cleanEmail.split("@")[0], created_at: now };
  }

  getOrCreateUser(email: string, name?: string): User {
    const cleanEmail = email.trim().toLowerCase();
    const existing = this.getUserByEmail(cleanEmail);
    if (existing) {
      if (name && name.trim()) {
        this.db.prepare("UPDATE users SET name = ? WHERE id = ?").run(name.trim(), existing.id);
        existing.name = name.trim();
      }
      return existing;
    }
    const tempPass = "sec_pwd_" + crypto.randomBytes(16).toString("hex");
    return this.createUser(cleanEmail, tempPass, name || "");
  }

  getUserByEmail(email: string): User | null {
    const stmt = this.db.prepare("SELECT * FROM users WHERE email = ?");
    const row = stmt.get(email.trim().toLowerCase()) as User | undefined;
    return row || null;
  }

  getUserById(id: string): User | null {
    const stmt = this.db.prepare("SELECT * FROM users WHERE id = ?");
    const row = stmt.get(id) as User | undefined;
    return row || null;
  }

  changePassword(userId: string, currentPassword: string, newPassword: string): { success: boolean } {
    const user = this.getUserById(userId);
    if (!user) {
      throw new Error("Benutzer nicht gefunden.");
    }

    const isValidCurrent = this.verifyPassword(currentPassword, user.password_hash, user.salt);
    if (!isValidCurrent) {
      throw new Error("Das aktuelle Passwort ist nicht korrekt.");
    }

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
      throw new Error("Das neue Passwort muss mindestens 8 Zeichen lang sein.");
    }

    const { hash, salt } = this.hashPassword(newPassword);
    this.db.prepare("UPDATE users SET password_hash = ?, salt = ? WHERE id = ?").run(hash, salt, userId);

    // Invalidate all active sessions for this user across all devices upon password change
    this.deleteAllUserSessions(userId);

    return { success: true };
  }

  deleteUser(userId: string): boolean {
    const res = this.db.prepare("DELETE FROM users WHERE id = ?").run(userId);
    return res.changes > 0;
  }

  // --- Settings ---
  getUserSettings(userId: string): UserSettings {
    const stmt = this.db.prepare("SELECT * FROM user_settings WHERE user_id = ?");
    let row = stmt.get(userId) as UserSettings | undefined;
    if (!row) {
      const now = new Date().toISOString();
      this.db.prepare(
        "INSERT INTO user_settings (user_id, currency, notice_days, two_factor_enabled, updated_at) VALUES (?, 'CHF', 30, 1, ?)"
      ).run(userId, now);
      row = { user_id: userId, currency: "CHF", notice_days: 30, two_factor_enabled: 1, updated_at: now };
    }
    return row;
  }

  updateUserSettings(userId: string, data: { name?: string; currency?: string; notice_days?: number; two_factor_enabled?: number }): { user: User; settings: UserSettings } {
    const now = new Date().toISOString();
    if (data.name !== undefined) {
      this.db.prepare("UPDATE users SET name = ? WHERE id = ?").run(data.name.trim(), userId);
    }
    const current = this.getUserSettings(userId);
    let updatedCurrency = current.currency;
    if (data.currency) {
      const c = data.currency.toUpperCase().trim();
      if ((SUPPORTED_CURRENCIES as readonly string[]).includes(c)) {
        updatedCurrency = c;
      }
    }
    const updatedNotice = data.notice_days !== undefined ? Math.min(365, Math.max(0, Math.floor(data.notice_days))) : current.notice_days;
    const updated2FA = data.two_factor_enabled !== undefined ? (data.two_factor_enabled ? 1 : 0) : current.two_factor_enabled;

    this.db.prepare(
      "UPDATE user_settings SET currency = ?, notice_days = ?, two_factor_enabled = ?, updated_at = ? WHERE user_id = ?"
    ).run(updatedCurrency, updatedNotice, updated2FA, now, userId);

    return {
      user: this.getUserById(userId)!,
      settings: this.getUserSettings(userId),
    };
  }

  // --- 2FA Verification Codes & Challenges ---
  private hashOtpCode(code: string, salt: string): string {
    return crypto.createHash("sha256").update(`${code.trim()}:${salt}`).digest("hex");
  }

  createTwoFactorChallenge(userId: string, email: string): { challengeId: string; code: string; expiresAt: number } {
    const cleanEmail = email.trim().toLowerCase();
    const code = crypto.randomInt(100000, 1000000).toString();
    const challengeId = "otp_" + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
    const salt = crypto.randomBytes(16).toString("hex");
    const codeHash = this.hashOtpCode(code, salt);
    const now = Date.now();
    const expiresAt = now + 10 * 60 * 1000; // 10 minutes

    // Invalidate any existing unused codes for this user / email
    this.db.prepare("UPDATE verification_codes SET used = 1 WHERE (email = ? OR (user_id IS NOT NULL AND user_id = ?)) AND used = 0").run(cleanEmail, userId);

    this.db.prepare(
      "INSERT INTO verification_codes (id, user_id, email, code, salt, expires_at, used, attempts, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?)"
    ).run(challengeId, userId, cleanEmail, codeHash, salt, expiresAt, now);

    return { challengeId, code, expiresAt };
  }

  generate2FACode(email: string): { code: string; expiresAt: number; challengeId: string } {
    const cleanEmail = email.trim().toLowerCase();
    const user = this.getUserByEmail(cleanEmail);
    const userId = user?.id || "";
    return this.createTwoFactorChallenge(userId, cleanEmail);
  }

  verify2FACode(challengeId: string, code: string): { success: boolean; reason?: "invalid" | "expired" | "locked"; user?: User } {
    if (!challengeId || typeof challengeId !== "string" || !challengeId.trim()) {
      return { success: false, reason: "invalid" };
    }
    const cleanId = challengeId.trim();
    const cleanCode = typeof code === "string" ? code.trim() : "";
    if (!cleanCode) {
      return { success: false, reason: "invalid" };
    }
    const now = Date.now();

    const stmt = this.db.prepare("SELECT * FROM verification_codes WHERE id = ?");
    const row = stmt.get(cleanId) as VerificationCode | undefined;

    if (!row) {
      return { success: false, reason: "invalid" };
    }

    // Check if code was locked due to max attempts (>= 5)
    if (row.attempts >= 5) {
      return { success: false, reason: "locked" };
    }

    // Check if already used or expired
    if (row.used || row.expires_at <= now) {
      return { success: false, reason: "expired" };
    }

    // Compare code: hashed comparison if salt is present, fallback to plaintext comparison for legacy rows
    let isMatch = false;
    if (row.salt) {
      const expectedHash = row.code;
      const candidateHash = this.hashOtpCode(cleanCode, row.salt);
      isMatch = timingSafeStringEqual(expectedHash, candidateHash);
    } else {
      isMatch = timingSafeStringEqual(row.code, cleanCode);
    }

    if (!isMatch) {
      const newAttempts = row.attempts + 1;
      this.db.prepare("UPDATE verification_codes SET attempts = ? WHERE id = ?").run(newAttempts, row.id);
      if (newAttempts >= 5) {
        return { success: false, reason: "locked" };
      }
      return { success: false, reason: "invalid" };
    }

    // Success: mark code as used immediately to prevent re-use
    this.db.prepare("UPDATE verification_codes SET used = 1 WHERE id = ?").run(row.id);

    // Retrieve user object if available
    const user = row.user_id ? this.getUserById(row.user_id) : this.getUserByEmail(row.email);
    return { success: true, user: user || undefined };
  }

  // --- Sessions ---
  createSession(userId: string): string {
    const token = "subly_sec_" + crypto.randomBytes(32).toString("hex");
    const now = Date.now();
    const expiresAt = now + 30 * 24 * 60 * 60 * 1000; // 30 days

    this.db.prepare(
      "INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)"
    ).run(token, userId, now, expiresAt);

    return token;
  }

  getUserFromSession(token: string): { user: User; settings: UserSettings } | null {
    if (!token || typeof token !== "string") return null;
    const now = Date.now();
    const stmt = this.db.prepare("SELECT * FROM sessions WHERE token = ? AND expires_at > ?");
    const session = stmt.get(token.trim(), now) as { user_id: string } | undefined;
    if (!session) return null;

    const user = this.getUserById(session.user_id);
    if (!user) return null;

    const settings = this.getUserSettings(user.id);
    return { user, settings };
  }

  deleteSession(token: string): void {
    if (!token || typeof token !== "string") return;
    this.db.prepare("DELETE FROM sessions WHERE token = ?").run(token.trim());
  }

  deleteAllUserSessions(userId: string): number {
    if (!userId) return 0;
    const res = this.db.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
    return Number(res.changes);
  }

  // --- Subscriptions ---
  listSubscriptions(userId: string): CloudSubscription[] {
    const stmt = this.db.prepare("SELECT * FROM subscriptions WHERE user_id = ? ORDER BY next_renewal ASC");
    const rows = stmt.all(userId) as unknown as CloudSubscription[];
    return rows.map(r => ({
      ...r,
      amount: Number(r.amount),
      currency: r.currency || "CHF",
      notice_days: Number(r.notice_days),
      price_change: r.price_change !== null && r.price_change !== undefined ? Number(r.price_change) : undefined,
    }));
  }

  createSubscription(userId: string, data: Omit<CloudSubscription, "id" | "user_id" | "created_at" | "updated_at">): CloudSubscription {
    const rawAmt = Number(data.amount);
    if (!Number.isFinite(rawAmt) || rawAmt < 0 || rawAmt > 1_000_000) {
      throw new Error("Abo-Betrag muss eine gültige Zahl zwischen 0 und 1'000'000 sein.");
    }
    const amountNum = Math.round((rawAmt + Number.EPSILON) * 100) / 100;

    const rawProvider = data.provider ? String(data.provider).trim() : "";
    if (!rawProvider) {
      throw new Error("Gültiger Anbieter ist erforderlich.");
    }
    const provider = rawProvider.slice(0, 100);

    const validCycles = ["monthly", "quarterly", "half-yearly", "yearly"];
    if (!data.billing_cycle || !validCycles.includes(data.billing_cycle)) {
      throw new Error("Ungültiger Abrechnungszyklus. Erlaubt: monthly, quarterly, half-yearly, yearly.");
    }
    const cycle = data.billing_cycle;

    const validStatuses = ["active", "cancelled", "paused"];
    if (!data.status || !validStatuses.includes(data.status)) {
      throw new Error("Ungültiger Status. Erlaubt: active, cancelled, paused.");
    }
    const status = data.status;

    let currency = "CHF";
    if (data.currency) {
      const c = String(data.currency).toUpperCase().trim();
      if (!(SUPPORTED_CURRENCIES as readonly string[]).includes(c)) {
        throw new Error(`Währung nicht unterstützt. Erlaubt: ${SUPPORTED_CURRENCIES.join(", ")}.`);
      }
      currency = c;
    }

    if (!isValidIsoDate(data.next_renewal)) {
      throw new Error("Gültiges Erneuerungsdatum (Format JJJJ-MM-TT) ist erforderlich.");
    }
    const nextRenewal = data.next_renewal.trim();

    const now = new Date().toISOString();
    let lastUsed = now.slice(0, 10);
    if (data.last_used !== undefined && data.last_used !== null && data.last_used !== "") {
      if (!isValidIsoDate(data.last_used)) {
        throw new Error("Gültiges Nutzungsdatum (Format JJJJ-MM-TT) ist erforderlich.");
      }
      lastUsed = data.last_used.trim();
    }

    if (data.notice_days !== undefined && data.notice_days !== null) {
      const nd = Number(data.notice_days);
      if (!Number.isInteger(nd) || nd < 0 || nd > 365) {
        throw new Error("Kündigungsfrist muss eine ganze Zahl zwischen 0 und 365 Tagen sein.");
      }
    }
    const noticeDays = Number(data.notice_days ?? 30);

    let priceChange: number | null = null;
    if (data.price_change !== null && data.price_change !== undefined) {
      const pc = Number(data.price_change);
      if (!Number.isFinite(pc)) {
        throw new Error("Preisänderung muss eine gültige Zahl sein.");
      }
      priceChange = Math.round((pc + Number.EPSILON) * 100) / 100;
    }

    const stmt = this.db.prepare(`
      INSERT INTO subscriptions (
        user_id, provider, plan, category, amount, currency, billing_cycle,
        next_renewal, notice_days, last_used, status, contract_number,
        color, logo_text, cancellation_address, hotline, price_change,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const res = stmt.run(
      userId,
      provider,
      String(data.plan || "").slice(0, 100),
      String(data.category || "Other").slice(0, 50),
      amountNum,
      currency,
      cycle,
      nextRenewal,
      noticeDays,
      lastUsed,
      status,
      String(data.contract_number || "").slice(0, 80),
      String(data.color || "#182d3b").slice(0, 25),
      String(data.logo_text || provider.slice(0, 2).toUpperCase()).slice(0, 10),
      String(data.cancellation_address || "").slice(0, 250),
      String(data.hotline || "").slice(0, 50),
      priceChange,
      now,
      now
    );

    const newId = Number(res.lastInsertRowid);
    return this.getSubscription(userId, newId)!;
  }

  createSubscriptionsBulk(userId: string, items: Omit<CloudSubscription, "id" | "user_id" | "created_at" | "updated_at">[]): CloudSubscription[] {
    this.db.exec("BEGIN TRANSACTION;");
    try {
      const created: CloudSubscription[] = [];
      for (const item of items) {
        created.push(this.createSubscription(userId, item));
      }
      this.db.exec("COMMIT;");
      return created;
    } catch (err) {
      try {
        this.db.exec("ROLLBACK;");
      } catch (_) {}
      throw err;
    }
  }

  getSubscription(userId: string, id: number): CloudSubscription | null {
    const stmt = this.db.prepare("SELECT * FROM subscriptions WHERE id = ? AND user_id = ?");
    const row = stmt.get(id, userId) as unknown as CloudSubscription | undefined;
    if (!row) return null;
    return {
      ...row,
      amount: Number(row.amount),
      currency: row.currency || "CHF",
      notice_days: Number(row.notice_days),
      price_change: row.price_change !== null && row.price_change !== undefined ? Number(row.price_change) : undefined,
    };
  }

  getSubscriptionByIdAnyUser(id: number): { id: number; user_id: string } | null {
    const stmt = this.db.prepare("SELECT id, user_id FROM subscriptions WHERE id = ?");
    const row = stmt.get(id) as { id: number; user_id: string } | undefined;
    return row || null;
  }

  updateSubscription(userId: string, id: number, data: Partial<Omit<CloudSubscription, "id" | "user_id" | "created_at">>): CloudSubscription | null {
    const existing = this.getSubscription(userId, id);
    if (!existing) return null;

    let updatedAmount = existing.amount;
    if (data.amount !== undefined) {
      const amt = Number(data.amount);
      if (!Number.isFinite(amt) || amt < 0 || amt > 1_000_000) {
        throw new Error("Abo-Betrag muss eine Zahl zwischen 0 und 1'000'000 sein.");
      }
      updatedAmount = Math.round((amt + Number.EPSILON) * 100) / 100;
    }

    let updatedProvider = existing.provider;
    if (data.provider !== undefined) {
      const p = String(data.provider).trim();
      if (!p) throw new Error("Anbieter darf nicht leer sein.");
      updatedProvider = p.slice(0, 100);
    }

    const validCycles = ["monthly", "quarterly", "half-yearly", "yearly"];
    let cycle = existing.billing_cycle;
    if (data.billing_cycle !== undefined) {
      if (!validCycles.includes(data.billing_cycle)) {
        throw new Error("Ungültiger Abrechnungszyklus. Erlaubt: monthly, quarterly, half-yearly, yearly.");
      }
      cycle = data.billing_cycle;
    }

    const validStatuses = ["active", "cancelled", "paused"];
    let status = existing.status;
    if (data.status !== undefined) {
      if (!validStatuses.includes(data.status)) {
        throw new Error("Ungültiger Status. Erlaubt: active, cancelled, paused.");
      }
      status = data.status;
    }

    let currency = existing.currency;
    if (data.currency !== undefined) {
      const c = String(data.currency).toUpperCase().trim();
      if (!(SUPPORTED_CURRENCIES as readonly string[]).includes(c)) {
        throw new Error(`Währung nicht unterstützt. Erlaubt: ${SUPPORTED_CURRENCIES.join(", ")}.`);
      }
      currency = c;
    }

    let nextRenewal = existing.next_renewal;
    if (data.next_renewal !== undefined) {
      if (!isValidIsoDate(data.next_renewal)) {
        throw new Error("Ungültiges Verlängerungsdatum (JJJJ-MM-TT).");
      }
      nextRenewal = data.next_renewal.trim();
    }

    let lastUsed = existing.last_used;
    if (data.last_used !== undefined) {
      if (!isValidIsoDate(data.last_used)) {
        throw new Error("Ungültiges Nutzungsdatum (JJJJ-MM-TT).");
      }
      lastUsed = data.last_used.trim();
    }

    let noticeDays = existing.notice_days;
    if (data.notice_days !== undefined) {
      const nd = Number(data.notice_days);
      if (!Number.isInteger(nd) || nd < 0 || nd > 365) {
        throw new Error("Kündigungsfrist muss eine ganze Zahl zwischen 0 und 365 Tagen sein.");
      }
      noticeDays = nd;
    }

    let priceChange: number | null | undefined = existing.price_change;
    if (data.price_change !== undefined) {
      if (data.price_change === null) {
        priceChange = null;
      } else {
        const pc = Number(data.price_change);
        if (!Number.isFinite(pc)) {
          throw new Error("Preisänderung muss eine gültige Zahl sein.");
        }
        priceChange = Math.round((pc + Number.EPSILON) * 100) / 100;
      }
    }

    const now = new Date().toISOString();
    const updated = {
      ...existing,
      ...data,
      provider: updatedProvider,
      plan: data.plan !== undefined ? String(data.plan).slice(0, 100) : existing.plan,
      category: data.category !== undefined ? String(data.category).slice(0, 50) : existing.category,
      amount: updatedAmount,
      billing_cycle: cycle,
      status,
      currency,
      next_renewal: nextRenewal,
      notice_days: noticeDays,
      last_used: lastUsed,
      contract_number: data.contract_number !== undefined ? String(data.contract_number).slice(0, 80) : existing.contract_number,
      color: data.color !== undefined ? String(data.color).slice(0, 25) : existing.color,
      logo_text: data.logo_text !== undefined ? String(data.logo_text).slice(0, 10) : existing.logo_text,
      cancellation_address: data.cancellation_address !== undefined ? String(data.cancellation_address).slice(0, 250) : existing.cancellation_address,
      hotline: data.hotline !== undefined ? String(data.hotline).slice(0, 50) : existing.hotline,
      price_change: priceChange,
      updated_at: now,
    };

    this.db.prepare(`
      UPDATE subscriptions SET
        provider = ?, plan = ?, category = ?, amount = ?, currency = ?, billing_cycle = ?,
        next_renewal = ?, notice_days = ?, last_used = ?, status = ?,
        contract_number = ?, color = ?, logo_text = ?, cancellation_address = ?,
        hotline = ?, price_change = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `).run(
      updated.provider,
      updated.plan,
      updated.category,
      Number(updated.amount),
      updated.currency,
      updated.billing_cycle,
      updated.next_renewal,
      updated.notice_days,
      updated.last_used,
      updated.status,
      updated.contract_number,
      updated.color,
      updated.logo_text,
      updated.cancellation_address,
      updated.hotline,
      updated.price_change !== null && updated.price_change !== undefined ? Number(updated.price_change) : null,
      now,
      id,
      userId
    );

    return this.getSubscription(userId, id);
  }

  deleteSubscription(userId: string, id: number): boolean {
    const res = this.db.prepare("DELETE FROM subscriptions WHERE id = ? AND user_id = ?").run(id, userId);
    return res.changes > 0;
  }

  clearUserSubscriptions(userId: string): number {
    const res = this.db.prepare("DELETE FROM subscriptions WHERE user_id = ?").run(userId);
    return Number(res.changes);
  }

  cleanupExpired(): { deletedSessions: number; deletedCodes: number } {
    const now = Date.now();
    const sessRes = this.db.prepare("DELETE FROM sessions WHERE expires_at < ?").run(now);
    const codeRes = this.db.prepare("DELETE FROM verification_codes WHERE expires_at < ? OR used = 1").run(now);
    return {
      deletedSessions: Number(sessRes.changes),
      deletedCodes: Number(codeRes.changes),
    };
  }

  ping(): boolean {
    try {
      const row = this.db.prepare("SELECT 1 as alive").get() as { alive: number } | undefined;
      return row?.alive === 1;
    } catch {
      return false;
    }
  }

  close(): void {
    try {
      this.db.close();
    } catch (_) {}
  }
}

export const cloudDb = new CloudDb();
