import nodemailer, { type Transporter } from "nodemailer";
import crypto from "node:crypto";
import { logger } from "./logger";

export interface MailOptions {
  to: string;
  code: string;
  name?: string;
}

export async function sendVerificationEmail({ to, code, name }: MailOptions): Promise<{ success: boolean; previewUrl?: string; error?: string }> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const smtpHost = process.env.SMTP_HOST;
  const gmailUser = process.env.GMAIL_USER || process.env.SMTP_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f6f8f7; margin: 0; padding: 40px 16px;">
      <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; background: #182d3b; color: white; font-size: 22px; font-weight: 800; width: 46px; height: 46px; line-height: 46px; border-radius: 12px; margin-bottom: 12px;">S</div>
          <h2 style="margin: 0; color: #182d3b; font-size: 22px; font-weight: 700; letter-spacing: -0.02em;">Subly Sicherheitscode</h2>
          <p style="margin: 4px 0 0; color: #64747d; font-size: 13px;">Zwei-Faktor-Authentifizierung (2FA)</p>
        </div>
        
        <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
          Hallo${name ? " <strong>" + name + "</strong>" : ""},<br/>
          Dein Einmal-Sicherheitscode für die Bestätigung deines Subly-Kontos lautet:
        </p>

        <div style="background: #edf3bd; border: 2px dashed #182d3b; border-radius: 12px; padding: 18px; text-align: center; margin-bottom: 24px;">
          <div style="font-family: 'SF Mono', Monaco, Consolas, monospace; font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #182d3b;">${code}</div>
        </div>

        <p style="color: #64747d; font-size: 13px; line-height: 1.5; margin-bottom: 24px;">
          ⏱️ Dieser Code ist <strong>10 Minuten</strong> gültig. Gib diesen Code niemals an andere Personen weiter. Falls du diese Anfrage nicht gestellt hast, kannst du diese Nachricht ignorieren.
        </p>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        
        <div style="text-align: center; color: #94a3b8; font-size: 12px; line-height: 1.5;">
          Subly – Schweizer Abonnement-Manager<br/>
          Sicher verschlüsselt
        </div>
      </div>
    </body>
    </html>
  `;

  const plainText = `Hallo${name ? " " + name : ""},\n\nDein Subly Login-Code lautet: ${code}\n\nDieser Code ist 10 Minuten gültig.\n\nSubly – Schweizer Abo-Cockpit`;

  // 1. If Resend API Key is set
  if (resendApiKey) {
    try {
      const fromAddress = process.env.MAIL_FROM || "Subly <onboarding@resend.dev>";
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [to],
          subject: `Subly Code: ${code}`,
          html: htmlContent,
          text: plainText,
          headers: {
            "X-Entity-Ref-ID": crypto.randomUUID(),
          },
        }),
      });

      if (res.ok) {
        logger.info({ to }, "Verification email sent successfully via Resend API");
        return { success: true };
      }

      const errText = await res.text();
      logger.error({ err: errText }, "Resend API error");
      return { success: false, error: errText };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error({ err: msg }, "Failed to send via Resend");
      return { success: false, error: msg };
    }
  }

  // 2. If SMTP / Gmail credentials are configured
  if (smtpHost || gmailUser) {
    try {
      let transporter: Transporter;
      if (gmailUser && (!smtpHost || smtpHost.includes("gmail"))) {
        transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: gmailUser,
            pass: gmailPass,
          },
        });
      } else {
        transporter = nodemailer.createTransport({
          host: smtpHost,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: Number(process.env.SMTP_PORT) === 465,
          auth: {
            user: gmailUser || "",
            pass: gmailPass || "",
          },
        });
      }

      await transporter.sendMail({
        from: process.env.MAIL_FROM || `"Subly Security" <${gmailUser || "no-reply@subly.app"}>`,
        to,
        subject: `${code} ist dein Subly-Sicherheitscode`,
        html: htmlContent,
        text: plainText,
      });

      logger.info({ to }, "Verification email sent successfully via SMTP");
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error({ err: msg }, "Failed to send via SMTP transporter");
      return { success: false, error: msg };
    }
  }

  // 3. Fallback in development/test: Fast non-blocking simulation
  if (process.env.NODE_ENV === "test") {
    logger.info({ to }, "Test mode: security verification code processed");
    return { success: true };
  }

  try {
    const testAccount = await Promise.race([
      nodemailer.createTestAccount(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout creating test account")), 2000)),
    ]);

    const testTransporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const info = await testTransporter.sendMail({
      from: '"Subly Security" <security@subly.app>',
      to,
      subject: `${code} ist dein Subly-Sicherheitscode`,
      html: htmlContent,
      text: plainText,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    logger.info({ to, previewUrl }, "Sent verification email via Ethereal test inbox");
    return { success: true, previewUrl: previewUrl || undefined };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn({ to, err: msg }, "Fallback mailer: simulated email delivery (offline/no credentials)");
    return { success: true };
  }
}
