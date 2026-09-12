import { Router, type IRouter } from "express";
import { extractTextFromPdf, parseInvoiceText } from "../lib/document-extractor";
import { requireCloudAuth } from "./auth";

const router: IRouter = Router();

// POST /api/scan
// Supports JSON with { filename: string, contentBase64?: string, text?: string }
router.post("/scan", requireCloudAuth, async (req, res): Promise<void> => {
  try {
    const { filename, contentBase64, text } = req.body || {};
    if (!filename && !contentBase64 && !text) {
      res.status(400).json({ error: "Keine Datei oder Text zum Extrahieren übergeben." });
      return;
    }

    // Sanitize filename to prevent path traversal
    const safeFilename = typeof filename === "string" ? filename.replace(/[/\\?%*:|"<>]/g, "_").slice(0, 100) : "unnamed_document";

    let extractedText = typeof text === "string" ? text.slice(0, 50_000) : "";

    if (contentBase64 && typeof contentBase64 === "string") {
      // Limit base64 input to approx 30MB decoded (42MB base64)
      if (contentBase64.length > 42 * 1024 * 1024) {
        res.status(413).json({ error: "Die Datei überschreitet das Maximum von 30 MB." });
        return;
      }

      const buffer = Buffer.from(contentBase64, "base64");
      if (buffer.length > 30 * 1024 * 1024) {
        res.status(413).json({ error: "Die Datei überschreitet das Maximum von 30 MB." });
        return;
      }

      // Check header magic bytes
      const isPdf = buffer.length > 5 && buffer.subarray(0, 5).toString() === "%PDF-";
      const isPng = buffer.length > 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
      const isJpeg = buffer.length > 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
      const isWebp = buffer.length > 12 && buffer.subarray(8, 12).toString() === "WEBP";

      if (isPdf) {
        const pdfText = extractTextFromPdf(buffer);
        extractedText = `${pdfText}\n${extractedText}`;
      } else if (isPng || isJpeg || isWebp) {
        // Image invoice: scan embedded ASCII / EXIF metadata tokens
        const ascii = buffer.toString("latin1").replace(/[^\x20-\x7E\r\n]/g, " ");
        extractedText = `${ascii}\n${extractedText}`;
      } else {
        // Plain text or unknown format - check if readable
        const readable = buffer.subarray(0, 1000).toString("utf8");
        extractedText = `${readable}\n${extractedText}`;
      }
    }

    const result = parseInvoiceText(extractedText, safeFilename);

    res.json({
      success: true,
      result,
    });
  } catch (err: unknown) {
    const isProd = process.env.NODE_ENV === "production";
    const detail = err instanceof Error && !isProd ? `: ${err.message}` : "";
    res.status(500).json({ error: `Dokumentenanalyse fehlgeschlagen. Bitte Datei überprüfen${detail}` });
  }
});

export default router;
