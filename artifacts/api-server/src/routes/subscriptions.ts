import { Router, type IRouter, type Request, type Response } from "express";
import { requireCloudAuth } from "./auth";
import { cloudDb, type CloudSubscription } from "../lib/cloud-db";
import {
  validateAmount,
  validateBillingCycle,
  validateCurrency,
  validateIsoDate,
  validateNoticeDays,
  validatePriceChange,
  validateStatus,
  ValidationError,
  SUPPORTED_CURRENCIES,
  type SupportedCurrency,
  type BillingCycle,
  type SubscriptionStatus,
} from "../lib/validation";

const router: IRouter = Router();

router.use("/subscriptions", requireCloudAuth);

export interface FormattedSubscription {
  id: number;
  provider: string;
  plan: string;
  category: string;
  amount: number;
  currency: string;
  billingCycle: string;
  nextRenewal: string;
  noticeDays: number;
  lastUsed: string;
  status: string;
  contractNumber: string;
  color: string;
  logoText: string;
  cancellationAddress: string;
  hotline: string;
  priceChange?: number | null;
}

function formatSubscriptionResponse(sub: CloudSubscription): FormattedSubscription {
  return {
    id: sub.id,
    provider: sub.provider,
    plan: sub.plan,
    category: sub.category,
    amount: sub.amount,
    currency: sub.currency || "CHF",
    billingCycle: sub.billing_cycle,
    nextRenewal: sub.next_renewal,
    noticeDays: sub.notice_days,
    lastUsed: sub.last_used,
    status: sub.status,
    contractNumber: sub.contract_number,
    color: sub.color,
    logoText: sub.logo_text,
    cancellationAddress: sub.cancellation_address,
    hotline: sub.hotline,
    priceChange: sub.price_change,
  };
}

// GET /subscriptions
router.get("/subscriptions", (req: Request, res: Response): void => {
  const userId = req.userId!;
  const rows = cloudDb.listSubscriptions(userId);
  res.json(rows.map(formatSubscriptionResponse));
});

// POST /subscriptions
router.post("/subscriptions", (req: Request, res: Response): void => {
  const userId = req.userId!;
  const body = req.body || {};

  try {
    const rawProvider = typeof body.provider === "string" ? body.provider.trim() : "";
    if (!rawProvider) {
      throw new ValidationError("Gültiger Anbieter ist erforderlich.");
    }

    const amount = validateAmount(body.amount, "Betrag");
    const currency = validateCurrency(body.currency);
    const billingCycle = validateBillingCycle(body.billingCycle);
    const status = validateStatus(body.status);
    const nextRenewal = validateIsoDate(body.nextRenewal, "Erneuerungsdatum", true);

    const nowIso = new Date().toISOString().slice(0, 10);
    const lastUsed = body.lastUsed ? validateIsoDate(body.lastUsed, "Datum der letzten Nutzung", false) : nowIso;
    const noticeDays = validateNoticeDays(body.noticeDays);
    const priceChange = validatePriceChange(body.priceChange);

    const created = cloudDb.createSubscription(userId, {
      provider: rawProvider.slice(0, 100),
      plan: typeof body.plan === "string" ? body.plan.slice(0, 100) : "",
      category: typeof body.category === "string" ? body.category.slice(0, 50) : "Other",
      amount,
      currency,
      billing_cycle: billingCycle,
      next_renewal: nextRenewal,
      notice_days: noticeDays,
      last_used: lastUsed || nowIso,
      status,
      contract_number: typeof body.contractNumber === "string" ? body.contractNumber.slice(0, 80) : "",
      color: typeof body.color === "string" ? body.color.slice(0, 25) : "#182d3b",
      logo_text: typeof body.logoText === "string" ? body.logoText.slice(0, 10) : rawProvider.slice(0, 2).toUpperCase(),
      cancellation_address: typeof body.cancellationAddress === "string" ? body.cancellationAddress.slice(0, 250) : "",
      hotline: typeof body.hotline === "string" ? body.hotline.slice(0, 50) : "",
      price_change: priceChange,
    });

    res.status(201).json(formatSubscriptionResponse(created));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Abonnement konnte nicht erstellt werden.";
    const status = err instanceof ValidationError ? err.statusCode : 400;
    res.status(status).json({ error: message });
  }
});

// POST /subscriptions/restore
router.post("/subscriptions/restore", (req: Request, res: Response): void => {
  const userId = req.userId!;
  const body = req.body || {};

  try {
    const rawProvider = typeof body.provider === "string" ? body.provider.trim() : "";
    if (!rawProvider) {
      throw new ValidationError("Gültiger Anbieter ist erforderlich.");
    }

    const amount = validateAmount(body.amount, "Betrag");
    const currency = validateCurrency(body.currency);
    const billingCycle = validateBillingCycle(body.billingCycle);
    const status = validateStatus(body.status);
    const nextRenewal = validateIsoDate(body.nextRenewal, "Erneuerungsdatum", true);

    const nowIso = new Date().toISOString().slice(0, 10);
    const lastUsed = body.lastUsed ? validateIsoDate(body.lastUsed, "Datum der letzten Nutzung", false) : nowIso;
    const noticeDays = validateNoticeDays(body.noticeDays);
    const priceChange = validatePriceChange(body.priceChange);

    const created = cloudDb.createSubscription(userId, {
      provider: rawProvider.slice(0, 100),
      plan: typeof body.plan === "string" ? body.plan.slice(0, 100) : "",
      category: typeof body.category === "string" ? body.category.slice(0, 50) : "Other",
      amount,
      currency,
      billing_cycle: billingCycle,
      next_renewal: nextRenewal,
      notice_days: noticeDays,
      last_used: lastUsed || nowIso,
      status,
      contract_number: typeof body.contractNumber === "string" ? body.contractNumber.slice(0, 80) : "",
      color: typeof body.color === "string" ? body.color.slice(0, 25) : "#182d3b",
      logo_text: typeof body.logoText === "string" ? body.logoText.slice(0, 10) : rawProvider.slice(0, 2).toUpperCase(),
      cancellation_address: typeof body.cancellationAddress === "string" ? body.cancellationAddress.slice(0, 250) : "",
      hotline: typeof body.hotline === "string" ? body.hotline.slice(0, 50) : "",
      price_change: priceChange,
    });

    res.status(201).json(formatSubscriptionResponse(created));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Wiederherstellung fehlgeschlagen.";
    const status = err instanceof ValidationError ? err.statusCode : 400;
    res.status(status).json({ error: message });
  }
});

// GET /subscriptions/:id
router.get("/subscriptions/:id", (req: Request, res: Response): void => {
  const userId = req.userId!;
  const rawId = Number(req.params.id);
  if (!Number.isInteger(rawId) || rawId <= 0) {
    res.status(400).json({ error: "Ungültige Abonnement-ID." });
    return;
  }

  const sub = cloudDb.getSubscription(userId, rawId);
  if (!sub) {
    const anySub = cloudDb.getSubscriptionByIdAnyUser(rawId);
    if (anySub && anySub.user_id !== userId) {
      res.status(403).json({ error: "Keine Berechtigung für dieses Abonnement." });
      return;
    }
    res.status(404).json({ error: "Abonnement nicht gefunden." });
    return;
  }

  res.json(formatSubscriptionResponse(sub));
});

// Handler for both PATCH and PUT /subscriptions/:id
const updateSubscriptionHandler = (req: Request, res: Response): void => {
  const userId = req.userId!;
  const rawId = Number(req.params.id);
  if (!Number.isInteger(rawId) || rawId <= 0) {
    res.status(400).json({ error: "Ungültige Abonnement-ID." });
    return;
  }

  const existing = cloudDb.getSubscription(userId, rawId);
  if (!existing) {
    const anySub = cloudDb.getSubscriptionByIdAnyUser(rawId);
    if (anySub && anySub.user_id !== userId) {
      res.status(403).json({ error: "Keine Berechtigung für dieses Abonnement." });
      return;
    }
    res.status(404).json({ error: "Abonnement nicht gefunden." });
    return;
  }

  const body = req.body || {};
  const updateData: Partial<Omit<CloudSubscription, "id" | "user_id" | "created_at">> = {};

  try {
    if (body.provider !== undefined) {
      const p = String(body.provider).trim();
      if (!p) {
        throw new ValidationError("Anbieter darf nicht leer sein.");
      }
      updateData.provider = p.slice(0, 100);
    }

    if (body.plan !== undefined) updateData.plan = String(body.plan).slice(0, 100);
    if (body.category !== undefined) updateData.category = String(body.category).slice(0, 50);

    if (body.amount !== undefined) {
      updateData.amount = validateAmount(body.amount, "Betrag");
    }

    if (body.currency !== undefined) {
      updateData.currency = validateCurrency(body.currency);
    }

    if (body.billingCycle !== undefined) {
      updateData.billing_cycle = validateBillingCycle(body.billingCycle);
    }

    if (body.nextRenewal !== undefined) {
      updateData.next_renewal = validateIsoDate(body.nextRenewal, "Erneuerungsdatum", true);
    }

    if (body.noticeDays !== undefined) {
      updateData.notice_days = validateNoticeDays(body.noticeDays);
    }

    if (body.lastUsed !== undefined) {
      updateData.last_used = validateIsoDate(body.lastUsed, "Datum der letzten Nutzung", true);
    }

    if (body.status !== undefined) {
      updateData.status = validateStatus(body.status);
    }

    if (body.contractNumber !== undefined) updateData.contract_number = String(body.contractNumber).slice(0, 80);
    if (body.color !== undefined) updateData.color = String(body.color).slice(0, 25);
    if (body.logoText !== undefined) updateData.logo_text = String(body.logoText).slice(0, 10);
    if (body.cancellationAddress !== undefined) updateData.cancellation_address = String(body.cancellationAddress).slice(0, 250);
    if (body.hotline !== undefined) updateData.hotline = String(body.hotline).slice(0, 50);
    if (body.priceChange !== undefined) {
      updateData.price_change = validatePriceChange(body.priceChange);
    }

    const updated = cloudDb.updateSubscription(userId, rawId, updateData);
    if (!updated) {
      res.status(404).json({ error: "Abonnement nicht gefunden." });
      return;
    }
    res.json(formatSubscriptionResponse(updated));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Abonnement konnte nicht aktualisiert werden.";
    const status = err instanceof ValidationError ? err.statusCode : 400;
    res.status(status).json({ error: message });
  }
};

router.patch("/subscriptions/:id", updateSubscriptionHandler);
router.put("/subscriptions/:id", updateSubscriptionHandler);

// DELETE /subscriptions/:id
router.delete("/subscriptions/:id", (req: Request, res: Response): void => {
  const userId = req.userId!;
  const rawId = Number(req.params.id);
  if (!Number.isInteger(rawId) || rawId <= 0) {
    res.status(400).json({ error: "Ungültige Abonnement-ID." });
    return;
  }

  const existing = cloudDb.getSubscription(userId, rawId);
  if (!existing) {
    const anySub = cloudDb.getSubscriptionByIdAnyUser(rawId);
    if (anySub && anySub.user_id !== userId) {
      res.status(403).json({ error: "Keine Berechtigung für dieses Abonnement." });
      return;
    }
    res.status(404).json({ error: "Abonnement nicht gefunden." });
    return;
  }

  const ok = cloudDb.deleteSubscription(userId, rawId);
  if (!ok) {
    res.status(404).json({ error: "Abonnement nicht gefunden." });
    return;
  }
  res.sendStatus(204);
});

// POST /subscriptions/:id/used
router.post("/subscriptions/:id/used", (req: Request, res: Response): void => {
  const userId = req.userId!;
  const rawId = Number(req.params.id);
  if (!Number.isInteger(rawId) || rawId <= 0) {
    res.status(400).json({ error: "Ungültige Abonnement-ID." });
    return;
  }

  const existing = cloudDb.getSubscription(userId, rawId);
  if (!existing) {
    const anySub = cloudDb.getSubscriptionByIdAnyUser(rawId);
    if (anySub && anySub.user_id !== userId) {
      res.status(403).json({ error: "Keine Berechtigung für dieses Abonnement." });
      return;
    }
    res.status(404).json({ error: "Abonnement nicht gefunden." });
    return;
  }

  const todayIso = new Date().toISOString().slice(0, 10);
  const updated = cloudDb.updateSubscription(userId, rawId, {
    last_used: todayIso,
  });

  if (!updated) {
    res.status(500).json({ error: "Aktualisierung fehlgeschlagen." });
    return;
  }

  res.json(formatSubscriptionResponse(updated));
});

export default router;
