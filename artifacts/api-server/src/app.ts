import path from "node:path";
import fs from "node:fs";
import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import router from "./routes/index";
import { logger } from "./lib/logger";
import { CLERK_PROXY_PATH, clerkProxyMiddleware, getClerkProxyHost } from "./middlewares/clerkProxyMiddleware";

function loadEnvFile() {
  const envPaths = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(__dirname, "../../.env"),
    path.resolve(__dirname, "../../../.env"),
  ];
  for (const p of envPaths) {
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eq = trimmed.indexOf("=");
        if (eq > 0) {
          const key = trimmed.slice(0, eq).trim();
          let val = trimmed.slice(eq + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          process.env[key] = val;
        }
      }
      break;
    }
  }
}
loadEnvFile();

const app: Express = express();

const isProduction = process.env.NODE_ENV === "production";

// Security Headers Middleware with real, strict Content Security Policy (CSP)
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (isProduction) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  // Real, strict Content Security Policy (CSP)
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' https://*.clerk.accounts.dev https://*.clerk.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];
  res.setHeader("Content-Security-Policy", cspDirectives.join("; "));
  next();
});

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

// CORS configuration with explicit origin allowlist
const defaultProdOrigins = ["https://subly.ch", "https://www.subly.ch"];
const configuredOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

const allowedOrigins = isProduction
  ? (configuredOrigins.length > 0 ? configuredOrigins : defaultProdOrigins)
  : [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:3000",
      ...configuredOrigins,
    ];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, same-origin)
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // In development only, allow any localhost/127.0.0.1 port
      if (!isProduction) {
        const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
        if (isLocal) {
          return callback(null, true);
        }
      }
      return callback(new Error("CORS-Origin nicht erlaubt."), false);
    },
    credentials: true,
  }),
);

app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

if (process.env.CLERK_PUBLISHABLE_KEY) {
  app.use(
    clerkMiddleware((req) => ({
      publishableKey: publishableKeyFromHost(
        getClerkProxyHost(req) ?? "",
        process.env.CLERK_PUBLISHABLE_KEY,
      ),
    })),
  );
}

app.use("/api", router);

// Catch-all for unhandled /api routes
app.use("/api", (req, res) => {
  res.status(404).json({ error: `API-Endpunkt ${req.method} ${req.path} wurde nicht gefunden.` });
});

// Error handling middleware for oversized requests, JSON parse errors, CORS, and uncaught exceptions
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const errorObj = typeof err === "object" && err !== null ? (err as Record<string, unknown>) : {};

  if (errorObj.type === "entity.too.large" || errorObj.status === 413) {
    res.status(413).json({
      error: "Die Datei oder Anfrage ist zu gross (maximal 50 MB erlaubt).",
    });
    return;
  }
  if (errorObj.status === 400 || errorObj.statusCode === 400) {
    res.status(400).json({
      error: "Ungültige Anfrage oder fehlerhaftes JSON-Format.",
    });
    return;
  }
  if (err instanceof Error && err.message.includes("CORS")) {
    res.status(403).json({ error: "CORS-Anfrage von dieser Origin nicht erlaubt." });
    return;
  }

  const statusCode = typeof errorObj.status === "number" ? errorObj.status : 500;
  const isProd = process.env.NODE_ENV === "production";
  const safeMessage = isProd
    ? "Ein interner Serverfehler ist aufgetreten."
    : (err instanceof Error ? err.message : "Ein interner Serverfehler ist aufgetreten.");

  res.status(statusCode).json({ error: safeMessage });
});

// Background housekeeping: clean up expired sessions and verification codes
try {
  const { cloudDb } = await import("./lib/cloud-db");
  cloudDb.cleanupExpired();
  const cleanupTimer = setInterval(() => {
    try {
      cloudDb.cleanupExpired();
    } catch (_) {}
  }, 60 * 60 * 1000);
  cleanupTimer.unref();
} catch (_) {}

// In production (standalone backend deployment), serve the built static frontend files.
// In development, Vite serves the frontend and handles routing itself.
if (process.env.NODE_ENV === "production") {
  const candidateStaticDirs = [
    path.resolve(__dirname, "../../subly/dist/public"),
    path.resolve(process.cwd(), "artifacts/subly/dist/public"),
    path.resolve(process.cwd(), "dist/public"),
  ];

  for (const staticDir of candidateStaticDirs) {
    if (fs.existsSync(staticDir)) {
      app.use(express.static(staticDir));
      app.use((req, res, next) => {
        if (req.path.startsWith("/api") || (req.path.includes(".") && !req.path.endsWith(".html"))) {
          return next();
        }
        const indexPath = path.join(staticDir, "index.html");
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath, (err) => {
            if (err) next();
          });
        } else {
          next();
        }
      });
      break;
    }
  }
}

export default app;
