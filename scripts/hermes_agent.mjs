import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const ROOT_DIR = path.resolve(process.cwd());
const LOG_FILE = path.join(ROOT_DIR, "scripts", "hermes_overnight.log");
const STATUS_FILE = path.join(ROOT_DIR, "scripts", "hermes_status.md");

const TARGET_END_TIME = new Date("2026-09-12T11:00:00+02:00").getTime();
const OLLAMA_URL = "http://127.0.0.1:11434/api/chat";
const MODEL_NAME = "hermes3:3b";

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  console.log(line.trim());
  fs.appendFileSync(LOG_FILE, line);
}

function updateStatus(statusText) {
  const content = `# Hermes 3 Overnight Agent Status\n\n**Start:** ${new Date().toISOString()}\n**Target End:** 2026-09-12 11:00:00 (10h Marathon)\n**Current Status:**\n${statusText}\n`;
  fs.writeFileSync(STATUS_FILE, content);
}

const tools = [
  {
    type: "function",
    function: {
      name: "read_file",
      description: "Liest den Inhalt einer Datei aus dem Projekt.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Relativer Pfad zur Datei (z.B. lib/db/src/index.ts)" }
        },
        required: ["path"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "write_file",
      description: "Schreibt oder ersetzt den Inhalt einer Backend-Datei. VERBOTEN: Dateien im Frontend artifacts/subly/.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Dateipfad (nur Backend: artifacts/api-server, lib/db, tests, etc.)" },
          content: { type: "string", description: "Der vollständige Dateiinhalt" }
        },
        required: ["path", "content"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_dir",
      description: "Listet Verzeichnisse und Dateien in einem Ordner auf.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Relativer Pfad zum Ordner (z.B. lib/db)" }
        },
        required: ["path"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "run_command",
      description: "Führt einen Shell-Befehl im Projektordner aus (z.B. pnpm test, git diff, pnpm run typecheck).",
      parameters: {
        type: "object",
        properties: {
          command: { type: "string", description: "Der auszuführende Shell-Befehl" }
        },
        required: ["command"]
      }
    }
  }
];

function executeTool(name, args) {
  log(`[TOOL CALL] ${name} with args: ${JSON.stringify(args).slice(0, 150)}`);
  try {
    if (name === "read_file") {
      const target = path.isAbsolute(args.path) ? args.path : path.resolve(ROOT_DIR, args.path);
      if (!fs.existsSync(target)) return JSON.stringify({ error: `Datei nicht gefunden: ${args.path}` });
      const content = fs.readFileSync(target, "utf8");
      return JSON.stringify({ content: content.slice(0, 20000) });
    }

    if (name === "write_file") {
      const target = path.isAbsolute(args.path) ? args.path : path.resolve(ROOT_DIR, args.path);
      if (target.includes("artifacts/subly") || target.includes("/subly/src")) {
        log(`[BLOCKED] write_file rejected for UI path: ${target}`);
        return JSON.stringify({ error: "SICHERHEITSSPERRE: Dateien in artifacts/subly/ (Frontend UI) dürfen NICHT angefasst werden!" });
      }
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, args.content, "utf8");
      log(`[WRITE] Successfully updated file: ${target}`);
      return JSON.stringify({ success: true, path: args.path });
    }

    if (name === "list_dir") {
      const target = path.isAbsolute(args.path) ? args.path : path.resolve(ROOT_DIR, args.path);
      if (!fs.existsSync(target)) return JSON.stringify({ error: `Ordner nicht gefunden: ${args.path}` });
      const files = fs.readdirSync(target, { withFileTypes: true }).map(f => `${f.isDirectory() ? "[DIR]" : "[FILE]"} ${f.name}`);
      return JSON.stringify({ items: files });
    }

    if (name === "run_command") {
      log(`[EXEC] ${args.command}`);
      const output = execSync(args.command, {
        cwd: ROOT_DIR,
        timeout: 60000,
        encoding: "utf8",
        env: { ...process.env, NODE_ENV: "development" }
      });
      return JSON.stringify({ output: output.slice(0, 8000) });
    }

    return JSON.stringify({ error: `Unbekanntes Tool: ${name}` });
  } catch (err) {
    log(`[TOOL ERROR] ${name}: ${err.message}`);
    return JSON.stringify({ error: err.message, stderr: err.stderr?.toString()?.slice(0, 2000) });
  }
}

const SYSTEM_PROMPT = `Du bist HERMES 3, ein autonomer Senior Backend & Systems Engineer.
Du arbeitest jetzt in einem kontinuierlichen Long-Running Marathon bis 11:00 Uhr vormittags am Subly-Projekt.

⚠️ ABSOLUTE REGEL:
Fasse NIEMALS Dateien in 'artifacts/subly/' (React Frontend, UI, CSS, Komponenten) an! Alle Frontend-Dateien sind für dich tabu!
Dein Arbeitsbereich ist ausschließlich:
- 'artifacts/api-server/**' (Express Backend, Routing, Auth, Scanner, Mailer, Error Handling)
- 'lib/db/**' (Drizzle ORM, SQLite Schemas, Indizes, Migrations, Housekeeping)
- 'tests/**' (Unittests, Integrationstests, Fuzzing, Edge Cases)
- 'scripts/**'

DEINE MISSION:
1. Führe 'pnpm test' aus, um den aktuellen Status zu prüfen.
2. Analysiere und behebe alle Bugs im Backend:
   - SQLite Concurrency & WAL-Modus aktivieren
   - Kaskadierende Foreign Keys & Indizes auf userId/status/expiresAt
   - Bereinigung alter Sessions und abgelaufener 2FA-Codes
   - Timing-Safe-Vergleiche und Rate-Limiting für Auth
   - Zod-Validierung und saubere Statuscodes für Subscriptions
   - Schweizer Rechnungs-Parser abhärten (Swisscom, Sunrise, Salt, SBB, Swica, etc.)
   - ReDoS-Schutz und Fehlerbehandlung
3. Erweitere die Test-Suite in 'tests/' massiv um neue gründliche Tests.
4. Verifiziere jeden Schritt mit 'run_command' ("pnpm run typecheck && pnpm test").
5. Gehe Schritt für Schritt vor und nutze deine Tools aktiv.`;

async function main() {
  log("🚀 Starte Hermes 3 Overnight Autonomous Runner...");
  updateStatus("Initialisiere Marathon-Lauf...");

  let messages = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: "Hermes, starte jetzt sofort mit Phase 1: Überprüfe die aktuellen Tests mit 'run_command' (\"pnpm test\"), analysiere die Datenbank und Schemas in lib/db und behebe alle Schwachstellen. Führe deine Werkzeuge eigenständig aus!"
    }
  ];

  let iteration = 0;

  while (Date.now() < TARGET_END_TIME) {
    iteration++;
    const remainingHours = ((TARGET_END_TIME - Date.now()) / (1000 * 60 * 60)).toFixed(1);
    log(`--- Iteration ${iteration} | Verbleibende Zeit: ${remainingHours} Stunden ---`);

    try {
      const resp = await fetch(OLLAMA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL_NAME,
          messages,
          tools,
          stream: false,
          options: {
            temperature: 0.2,
            top_p: 0.9,
            num_ctx: 4096, num_thread: 4
          }
        })
      });

      if (!resp.ok) {
        const text = await resp.text();
        log(`[OLLAMA HTTP ERROR] ${resp.status}: ${text}`);
        await new Promise(r => setTimeout(r, 10000));
        continue;
      }

      const data = await resp.json();
      const assistantMessage = data.message;
      messages.push(assistantMessage);

      if (assistantMessage.content) {
        log(`[HERMES] ${assistantMessage.content}`);
        updateStatus(`Hermes arbeitet:\n\n${assistantMessage.content.slice(0, 500)}...\n\n*Verbleibende Zeit bis 11:00 Uhr: ${remainingHours}h*`);
      }

      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        for (const call of assistantMessage.tool_calls) {
          const result = executeTool(call.function.name, call.function.arguments);
          messages.push({
            role: "tool",
            content: result
          });
        }
      } else {
        log("[RUNNER] Hermes hat geantwortet. Sende nächste Aufgabenstufe für die Nacht...");
        messages.push({
          role: "user",
          content: "Ausgezeichnet. Arbeite jetzt kontinuierlich weiter am nächsten Backend-Bereich: Schreibe neue Integrationstests, härte den Rechnungs-Scanner oder optimiere die Datenbank-Indizes. Nutze deine Tools und führe 'pnpm test' aus!"
        });
      }

      if (messages.length > 40) {
        log("[RUNNER] Kompaktiere Context Window für Stabilität...");
        const system = messages[0];
        const recent = messages.slice(-20);
        messages = [system, ...recent];
      }

      await new Promise(r => setTimeout(r, 2000));

    } catch (loopErr) {
      log(`[LOOP EXCEPTION] ${loopErr.message}`);
      await new Promise(r => setTimeout(r, 10000));
    }
  }

  log("🏁 11:00 Uhr erreicht! Marathon abgeschlossen.");
  updateStatus("Marathon erfolgreich bis 11:00 Uhr abgeschlossen!");
}

main().catch(err => {
  log(`[FATAL ERROR] ${err.stack}`);
});
