import { daysBetween, todayAsDateStr, formatDate } from "./date-utils";
import { roundCents, formatMoney, cycleFactor, calculateComparableSavings, type BillingCycle } from "./money-utils";

export interface SubscriptionDealInput {
  id: number;
  provider: string;
  plan?: string;
  category?: string;
  amount: number;
  currency?: string;
  billingCycle: BillingCycle;
  nextRenewal?: string;
  noticeDays?: number;
  lastUsed?: string;
  status: string;
}

export type DealType = 
  | "market_alternative" 
  | "overlap" 
  | "zombie" 
  | "billing_switch" 
  | "refund_claim";

export type ActionType = "cancel" | "switch" | "claim" | "toggle_cycle";
export type DataStatus = "verified" | "estimated" | "stale" | "unavailable";

export interface ScoreBreakdownItem {
  factor: string;
  points: number;
  type: "positive" | "negative";
}

export interface MatchedDeal {
  id: string;
  subscriptionId?: number;
  type: DealType;
  category: string;
  title: string;
  badge: string;
  badgeVariant: "danger" | "warning" | "success" | "brand";
  color: string;
  affectedSubName: string;
  currentCostFormatted: string;
  newCostFormatted: string;
  monthlySavings: number;
  yearlySavings: number;
  highlights: string[];
  explanation: string;
  actionText: string;
  actionType: ActionType;
  affiliateUrl?: string;
  confidenceLevel: "verified" | "estimated";
  dataStatus?: DataStatus;
  lastChecked?: string;
  evidence: string[];
  source?: string;
  disclaimer?: string;

  // Backward compatibility fields
  currentProvider?: string;
  currentPlan?: string;
  currentMonthlyCost?: number;
  alternativeProvider?: string;
  offerTitle?: string;
  newMonthlyCost?: number;
}

export interface PortfolioHealth {
  score: number;
  rating: "Ausgezeichnet" | "Gut" | "Optimierungsbedarf" | "Kritisch";
  summary: string;
  color: string;
  totalYearlySavings: number;
  totalMonthlySavings: number;
  dealsCount: number;
  breakdown: ScoreBreakdownItem[];
  stats: {
    zombiesCount: number;
    overlapsCount: number;
    switchDealsCount: number;
    billingDealsCount: number;
    refundsCount: number;
  };
}

export interface SwissMarketAlternative {
  category: string;
  matchKeywords: string[];
  alternativeProvider: string;
  offerTitle: string;
  newMonthlyCost: number;
  currency: string;
  highlights: string[];
  badge: string;
  color: string;
  affiliateUrl: string;
  explanation: string;
  source: string;
  lastChecked: string;
  dataStatus: DataStatus;
}

export const SWISS_MARKET_CATALOG: SwissMarketAlternative[] = [
  // --- Mobilfunk & Telecom (Swisscom-Netz) ---
  {
    category: "Telecom",
    matchKeywords: ["swisscom", "inone", "blue mobile", "natel", "swisscom mobile"],
    alternativeProvider: "Wingo Mobile",
    offerTitle: "Wingo Swiss Pro — Unlimitiert im Swisscom 5G-Netz",
    newMonthlyCost: 24.95,
    currency: "CHF",
    highlights: [
      "Netzabdeckung im Swisscom 5G-Netz (Tochtergesellschaft von Swisscom)",
      "Keine Mindestvertragslaufzeit (jederzeit monatlich kündbar)",
      "Lebenslanger Promotion-Preis ohne automatische Preiserhöhung",
      "Kostenlose Rufnummernmitnahme inklusive",
    ],
    badge: "Alternative im Swisscom-Netz",
    color: "#e6f4f1",
    affiliateUrl: "https://www.wingo.ch/de/mobile",
    explanation: "Wingo ist eine Tochtergesellschaft der Swisscom auf derselben Netzinfrastruktur. Für vergleichbare Telefonie- und Datenflatrates in der Schweiz liegt der Tarif unter der Premium-Hauptmarke.",
    source: "wingo.ch / Öffentlich einsehbare Tarife (Stand 2026)",
    lastChecked: "2026-09",
    dataStatus: "verified",
  },

  // --- Mobilfunk (Sunrise-Netz) ---
  {
    category: "Telecom",
    matchKeywords: ["sunrise", "upc", "yallo", "sunrise up", "we mobile"],
    alternativeProvider: "Galaxus Mobile",
    offerTitle: "Galaxus Mobile CH — Flatrate im Sunrise 5G-Netz",
    newMonthlyCost: 19.00,
    currency: "CHF",
    highlights: [
      "Unlimitierte Daten & Telefonie im Sunrise 5G-Netz",
      "Family + Friends Option ab 2 Personen für CHF 15.–/Monat",
      "Monatlich kündbar oder pausierbar",
      "Keine Aktivierungsgebühr bei Online-Abschluss",
    ],
    badge: "Alternative im Sunrise-Netz",
    color: "#eef2f6",
    affiliateUrl: "https://mobile.galaxus.ch/",
    explanation: "Sunrise verlangt für Standard-Abos oft CHF 59.– bis CHF 79.–/Mt. Galaxus Mobile nutzt dasselbe Sunrise 5G-Netz zum transparenten Monatspreis von CHF 19.–.",
    source: "mobile.galaxus.ch / Tarifkonditionen (Stand 2026)",
    lastChecked: "2026-09",
    dataStatus: "verified",
  },

  // --- Mobilfunk (Salt-Netz) ---
  {
    category: "Telecom",
    matchKeywords: ["salt", "salt mobile", "salt swiss", "salt europe"],
    alternativeProvider: "GoMo / Salt Direct",
    offerTitle: "GoMo — Flatrate auf Salt-Infrastruktur",
    newMonthlyCost: 12.95,
    currency: "CHF",
    highlights: [
      "Unlimitierte 4G/5G Daten & Anrufe in der Schweiz",
      "Keine Mindestvertragsdauer",
      "eSIM-Aktivierung direkt online möglich",
    ],
    badge: "Günstigste Salt-Netz Option",
    color: "#f5eef8",
    affiliateUrl: "https://www.go-mo.ch/",
    explanation: "GoMo ist die Discount-Linie auf der Salt-Mobilfunkinfrastruktur für Preisbewusste ohne Shop-Beratung.",
    source: "go-mo.ch / Preisübersicht (Stand 2026)",
    lastChecked: "2026-09",
    dataStatus: "verified",
  },

  // --- Internet & Glasfaser Zuhause ---
  {
    category: "Internet & TV",
    matchKeywords: ["swisscom internet", "blue internet", "sunrise internet", "upc internet", "quickline", "salt fiber"],
    alternativeProvider: "Wingo Internet / Init7",
    offerTitle: "Wingo Internet Max — Bis zu 10 Gbit/s Glasfaser",
    newMonthlyCost: 49.95,
    currency: "CHF",
    highlights: [
      "Bis zu 10 Gbit/s Up- & Download über bestehende Glasfasersteckdose",
      "Keine versteckte Routermiete",
      "Monatlich kündbar nach der Erstvertragslaufzeit",
      "Spart bis zu CHF 40.–/Monat gegenüber Premium-Grundtarifen",
    ],
    badge: "Glasfaser Sparpotenzial",
    color: "#f0fdf4",
    affiliateUrl: "https://www.wingo.ch/de/internet",
    explanation: "Standard-Internetverträge grosser Anbieter kosten oft CHF 80.– bis 110.–/Mt. Über dasselbe Glasfasernetz gibt es Tarife bei Wingo oder Init7 ab CHF 49.95.",
    source: "wingo.ch / Preisstand 2026",
    lastChecked: "2026-09",
    dataStatus: "verified",
  },

  // --- Fitness & Gym Krankenkassen-Subvention (Qualitop) ---
  {
    category: "Fitness",
    matchKeywords: ["fitness", "gym", "puregym", "fitnesspark", "migros fitness", "basefit", "clever fit", "kieser", "crossfit", "mcfit"],
    alternativeProvider: "Krankenkassen-Präventionsbeitrag (Qualitop)",
    offerTitle: "Möglicher Krankenkassen-Zuschuss für dein Fitness-Abo",
    newMonthlyCost: 0,
    currency: "CHF",
    highlights: [
      "CSS: Bis zu CHF 500.–/Jahr mit entsprechender myFlex Zusatzversicherung",
      "Swica: Bis zu CHF 800.–/Jahr mit Completa Top & Praeventa",
      "Helsana & Concordia: Bis zu CHF 350.–/Jahr für zertifizierte Studios",
      "Abo-Rechnung / Vertrag im Versichertenportal deiner Kasse einreichen",
    ],
    badge: "Möglicher Kassenbeitrag",
    color: "#f0fdf4",
    affiliateUrl: "https://www.qualitop.ch/",
    explanation: "Viele Schweizer Krankenkassen-Zusatzversicherungen bezuschussen Qualitop-zertifizierte Fitnesscenter jährlich. Prüfe deine Police und reiche deine Rechnung ein.",
    source: "qualitop.ch & Kassenübersichten 2026",
    lastChecked: "2026-09",
    dataStatus: "estimated",
  },

  // --- Bankgebühren & Kontoführung ---
  {
    category: "Finance",
    matchKeywords: ["ubs", "credit suisse", "raiffeisen", "postfinance", "kantonalbank", "zkb", "bcv", "bkb", "kontoführung"],
    alternativeProvider: "neon bank / Radicant",
    offerTitle: "neon free — Schweizer Bankkonto ohne Grundgebühr",
    newMonthlyCost: 0.00,
    currency: "CHF",
    highlights: [
      "CHF 0.– Grundgebühr, keine Kontoführungsgebühren",
      "Mastercard ohne Fremdwährungsaufschlag bei Auslandsausgaben",
      "Schweizer Einlagensicherung bis CHF 100'000.– via Hypothekarbank Lenzburg",
      "TWINT und eBill nahtlos unterstützt",
    ],
    badge: "CHF 0.– Grundgebühr",
    color: "#d0f0c0",
    affiliateUrl: "https://www.neon-free.ch/",
    explanation: "Klassische Schweizer Universalbanken verrechnen teils CHF 60.– bis 240.– Jahresgebühr für Privatkonten. Neobanken wie neon bieten die Basiskontoführung kostenfrei.",
    source: "neon-free.ch / Gebührenübersicht (Stand 2026)",
    lastChecked: "2026-09",
    dataStatus: "verified",
  }
];

// List of services with official discounts for annual prepayment
const ANNUAL_DISCOUNT_SERVICES = [
  { keywords: ["disney", "disney+"], discountPct: 16, provider: "Disney+", name: "Disney+ Jahresabo (12 Monate zum Preis von 10)", source: "disneyplus.com Tarifkonditionen" },
  { keywords: ["amazon prime", "prime"], discountPct: 18, provider: "Amazon Prime", name: "Amazon Prime Jahreszahlung", source: "amazon.de/prime Konditionen" },
  { keywords: ["duolingo"], discountPct: 30, provider: "Duolingo", name: "Duolingo Super Jahresabo", source: "duolingo.com Pricing" },
  { keywords: ["nordvpn", "surfshark", "cyberghost", "vpn"], discountPct: 60, provider: "VPN", name: "VPN Mehrjahres- oder Jahrestarif", source: "Offizielle Preisübersichten" },
  { keywords: ["microsoft", "office 365", "m365"], discountPct: 16, provider: "Microsoft 365", name: "Microsoft 365 Single/Family Jahresabrechnung", source: "microsoft.com Store CH" },
  { keywords: ["adobe", "creative cloud"], discountPct: 20, provider: "Adobe", name: "Adobe Creative Cloud Jahresvorauszahlung", source: "adobe.com CH Store" },
  { keywords: ["youtube premium", "youtube"], discountPct: 15, provider: "YouTube", name: "YouTube Premium Jahresabo", source: "youtube.com/premium" },
  { keywords: ["playstation plus", "ps plus"], discountPct: 25, provider: "PlayStation", name: "PlayStation Plus 12-Monats-Mitgliedschaft", source: "playstation.com Store CH" },
  { keywords: ["nintendo switch online"], discountPct: 35, provider: "Nintendo", name: "Nintendo Switch Online Jahres-Mitgliedschaft", source: "nintendo.ch Eshop" },
];

function normalizeMonthly(amount: number, billingCycle: string): number {
  const num = Number(amount) || 0;
  if (billingCycle === "yearly") return roundCents(num / 12);
  if (billingCycle === "half-yearly") return roundCents(num / 6);
  if (billingCycle === "quarterly") return roundCents(num / 4);
  return roundCents(num);
}

export function calculateDealsForSubscriptions(subs: any[]): MatchedDeal[] {
  if (!Array.isArray(subs)) return [];
  const activeSubs = subs.filter(s => s && s.status === "active");
  const deals: MatchedDeal[] = [];
  const handledSubIds = new Set<number>();
  const todayStr = todayAsDateStr();

  // --------------------------------------------------------------------------
  // 1. ZOMBIE / UNGENUTZTE ABOS (Aktivität vor >= 45 Tagen)
  // --------------------------------------------------------------------------
  for (const sub of activeSubs) {
    if (sub.lastUsed) {
      const daysSinceUse = Math.max(0, -daysBetween(todayStr, String(sub.lastUsed).slice(0, 10)));
      if (daysSinceUse >= 45) {
        const monthly = normalizeMonthly(sub.amount, sub.billingCycle);
        const yearly = roundCents(monthly * 12);
        const curr = sub.currency || "CHF";
        const formattedLastUsed = formatDate(String(sub.lastUsed).slice(0, 10));

        deals.push({
          id: `zombie-${sub.id}`,
          subscriptionId: sub.id,
          type: "zombie",
          category: sub.category || "Unused",
          title: `Zombie-Abo erkannt: ${sub.provider}`,
          badge: `Seit ${daysSinceUse} Tagen inaktiv`,
          badgeVariant: "danger",
          color: "#ffebee",
          affectedSubName: `${sub.provider} ${sub.plan ? `(${sub.plan})` : ""}`,
          currentCostFormatted: `${formatMoney(monthly, curr)}/Mt`,
          newCostFormatted: `${formatMoney(0, curr)}/Mt`,
          monthlySavings: monthly,
          yearlySavings: yearly,
          confidenceLevel: "verified",
          dataStatus: "verified",
          evidence: [
            `Schwellenwert für Inaktivität: 45 Tage ohne dokumentierte Nutzung`,
            `Tatsächliche Inaktivitätsdauer: ${daysSinceUse} Tage (zuletzt genutzt am ${formattedLastUsed})`,
            `Laufende Jahreskosten ohne festgestellte Aktivität: ${formatMoney(yearly, curr)}`,
          ],
          highlights: [
            `Zuletzt am ${formattedLastUsed} genutzt (${daysSinceUse} Tage her)`,
            `Schwellenwert von 45 Tagen deutlich überschritten`,
            `Kündigung oder Pausierung spart ${formatMoney(yearly, curr)} pro Jahr`,
          ],
          explanation: `Du bezahlst ${formatMoney(monthly, curr)} pro Monat für ${sub.provider}, hast den Dienst aber seit ${daysSinceUse} Tagen nicht mehr aktiv genutzt. Durch eine vorübergehende Pausierung oder Kündigung sparst du ${formatMoney(yearly, curr)} im Jahr.`,
          actionText: "Abo kündigen / pausieren",
          actionType: "cancel",
          currentProvider: sub.provider,
          currentPlan: sub.plan || "Standard",
          currentMonthlyCost: monthly,
          alternativeProvider: "Kündigung / Pause",
          offerTitle: `Kündigung oder Pausierung von ${sub.provider}`,
          newMonthlyCost: 0,
        });

        handledSubIds.add(sub.id);
      }
    }
  }

  // --------------------------------------------------------------------------
  // 2. ABONNEMENT-ÜBERSCHNEIDUNGEN (Streaming & Musik)
  // --------------------------------------------------------------------------
  // A) Video-Streaming (Mögliche Überschneidung - Rotationsprinzip)
  const videoKeywords = ["netflix", "disney", "apple tv", "sky", "amazon prime", "dazn", "hbo", "paramount", "youtube premium"];
  const videoSubs = activeSubs.filter(s => {
    const combined = `${(s.provider || "").toLowerCase()} ${(s.category || "").toLowerCase()}`;
    return videoKeywords.some(kw => combined.includes(kw));
  });

  if (videoSubs.length >= 2) {
    const totalVideoCostMonthly = roundCents(videoSubs.reduce((acc, s) => acc + normalizeMonthly(s.amount, s.billingCycle), 0));
    const sortedVideo = [...videoSubs].sort((a, b) => normalizeMonthly(a.amount, a.billingCycle) - normalizeMonthly(b.amount, b.billingCycle));
    const cheaperSub = sortedVideo[0];
    const cheaperMonthly = normalizeMonthly(cheaperSub.amount, cheaperSub.billingCycle);
    const yearlySavings = roundCents(cheaperMonthly * 12);
    const curr = cheaperSub.currency || "CHF";

    deals.push({
      id: `overlap-video-streaming`,
      subscriptionId: cheaperSub.id,
      type: "overlap",
      category: "Entertainment",
      title: `Mögliche Überschneidung: ${videoSubs.length} Video-Streaming-Dienste aktiv`,
      badge: "Mögliche Überschneidung (Rotations-Tipp)",
      badgeVariant: "warning",
      color: "#f8ece8",
      affectedSubName: videoSubs.map(s => s.provider).join(" + "),
      currentCostFormatted: `${formatMoney(totalVideoCostMonthly, curr)}/Mt`,
      newCostFormatted: `${formatMoney(totalVideoCostMonthly - cheaperMonthly, curr)}/Mt`,
      monthlySavings: cheaperMonthly,
      yearlySavings,
      confidenceLevel: "estimated",
      dataStatus: "estimated",
      evidence: [
        `${videoSubs.length} Video-Plattformen parallel gebucht: ${videoSubs.map(s => s.provider).join(", ")}`,
        `Einsparung basiert auf dem monatlichen Aussetzen eines Zweitdienstes (${cheaperSub.provider}: ${formatMoney(cheaperMonthly, curr)}/Mt)`,
      ],
      highlights: [
        `${videoSubs.length} Video-Dienste parallel gebucht`,
        `Rotations-Tipp: ${cheaperSub.provider} pausieren und nach Bedarf monatlich reaktivieren`,
        `Mögliche Ersparnis: ${formatMoney(yearlySavings, curr)}/Jahr bei monatlicher Rotation`,
      ],
      explanation: `Du hast mehrere Video-Streaming-Dienste parallel gebucht. Parallele Nutzung im gleichen Haushalt ist selten optimal ausgeschöpft. Durch monatliches Wechseln (Rotations-Prinzip) sparst du bares Geld, ohne auf Serieninhalte verzichten zu müssen.`,
      actionText: `${cheaperSub.provider} pausieren`,
      actionType: "cancel",
      currentProvider: "Mehrere Streaming-Dienste",
      currentPlan: `${videoSubs.length} Video-Abos`,
      currentMonthlyCost: totalVideoCostMonthly,
      alternativeProvider: "Rotations-Modell",
      offerTitle: "Streaming-Rotations-Prinzip",
      newMonthlyCost: roundCents(totalVideoCostMonthly - cheaperMonthly),
    });
  }

  // B) Musik-Streaming Dopplung (Echte Redundanz: Spotify + Apple Music etc.)
  const musicKeywords = ["spotify", "apple music", "tidal", "deezer", "youtube music", "amazon music"];
  const musicSubs = activeSubs.filter(s => {
    const combined = `${(s.provider || "").toLowerCase()} ${(s.category || "").toLowerCase()}`;
    return musicKeywords.some(kw => combined.includes(kw));
  });

  if (musicSubs.length >= 2) {
    const sortedMusic = [...musicSubs].sort((a, b) => normalizeMonthly(a.amount, a.billingCycle) - normalizeMonthly(b.amount, b.billingCycle));
    const cheaperMusicSub = sortedMusic[0];
    const monthly = normalizeMonthly(cheaperMusicSub.amount, cheaperMusicSub.billingCycle);
    const yearly = roundCents(monthly * 12);
    const curr = cheaperMusicSub.currency || "CHF";

    deals.push({
      id: `overlap-music-streaming`,
      subscriptionId: cheaperMusicSub.id,
      type: "overlap",
      category: "Entertainment",
      title: `Parallele Musik-Dienste: ${musicSubs.map(s => s.provider).join(" & ")}`,
      badge: "Redundanz eliminieren",
      badgeVariant: "danger",
      color: "#ffebee",
      affectedSubName: `${cheaperMusicSub.provider} (Doppelung)`,
      currentCostFormatted: `${formatMoney(monthly, curr)}/Mt`,
      newCostFormatted: `${formatMoney(0, curr)}/Mt`,
      monthlySavings: monthly,
      yearlySavings: yearly,
      confidenceLevel: "verified",
      dataStatus: "verified",
      evidence: [
        `Parallele Kataloge: Die Musikkataloge beider Plattformen überschneiden sich zu über 98%`,
        `Kündigung des Zweitdienstes (${cheaperMusicSub.provider}) eliminiert 100% der doppelten Kosten`,
      ],
      highlights: [
        `${musicSubs.length} konkurrierende Musik-Dienste parallel gebucht`,
        `Kündigung von ${cheaperMusicSub.provider} spart sofort ${formatMoney(yearly, curr)}/Jahr`,
      ],
      explanation: `Zwei vollwertige Musik-Streaming-Abos bieten denselben Musikkatalog. Entscheide dich für deinen Favoriten und kündige den zweiten Dienst.`,
      actionText: `${cheaperMusicSub.provider} kündigen`,
      actionType: "cancel",
      currentProvider: cheaperMusicSub.provider,
      currentPlan: cheaperMusicSub.plan || "Standard",
      currentMonthlyCost: monthly,
      alternativeProvider: "Einzelner Dienst",
      offerTitle: `Kündigung von ${cheaperMusicSub.provider}`,
      newMonthlyCost: 0,
    });
  }

  // --------------------------------------------------------------------------
  // 3. SCHWEIZER MARKT-ALTERNATIVEN & BENCHMARKING
  // --------------------------------------------------------------------------
  for (const sub of activeSubs) {
    const pLower = (sub.provider || "").toLowerCase();
    const planLower = (sub.plan || "").toLowerCase();
    const catLower = (sub.category || "").toLowerCase();
    const combined = `${pLower} ${planLower} ${catLower}`;
    const monthlyCost = normalizeMonthly(sub.amount, sub.billingCycle);
    const curr = sub.currency || "CHF";

    for (const alt of SWISS_MARKET_CATALOG) {
      if (pLower.includes(alt.alternativeProvider.toLowerCase())) continue;

      const isMatch = alt.matchKeywords.some(kw => combined.includes(kw));

      if (isMatch) {
        // Special case: Fitness Krankenkassen-Rückerstattung (Qualitop)
        if (alt.category === "Fitness") {
          const yearlyCost = monthlyCost * 12;
          const potentialClaim = Math.min(roundCents(yearlyCost * 0.5), 500);
          const monthlyEquivalent = roundCents(potentialClaim / 12);

          deals.push({
            id: `deal-fitness-claim-${sub.id}`,
            subscriptionId: sub.id,
            type: "refund_claim",
            category: "Fitness",
            title: `Möglicher Krankenkassen-Zuschuss für ${sub.provider}`,
            badge: "Präventionsbeitrag möglich",
            badgeVariant: "success",
            color: alt.color,
            affectedSubName: `${sub.provider} ${sub.plan ? `(${sub.plan})` : ""}`,
            currentCostFormatted: `${formatMoney(monthlyCost, curr)}/Mt`,
            newCostFormatted: `${formatMoney(monthlyCost - monthlyEquivalent, curr)}/Mt netto`,
            monthlySavings: monthlyEquivalent,
            yearlySavings: potentialClaim,
            confidenceLevel: "estimated",
            dataStatus: "estimated",
            lastChecked: alt.lastChecked,
            disclaimer: "Wichtig: Bitte die individuellen Bedingungen deiner Krankenkasse und Police prüfen.",
            evidence: [
              "Voraussetzung: Qualitop-zertifiziertes Studio & entsprechende ambulante Zusatzversicherung",
              "Beispiele: CSS myFlex bis CHF 500.–/J, Swica bis CHF 800.–/J, Helsana bis CHF 350.–/J",
              "Einreichung: Jahresrechnung oder Vertrag direkt bei der Kasse einreichen",
            ],
            source: alt.source,
            highlights: alt.highlights,
            explanation: `Viele Schweizer Zusatzversicherungen bezuschussen zertifizierte Fitnesscenter jährlich. Reiche deine Subly-Abo-Rechnung direkt bei deiner Versicherung ein.`,
            actionText: "Voraussetzungen prüfen",
            actionType: "claim",
            affiliateUrl: alt.affiliateUrl,
            currentProvider: sub.provider,
            currentPlan: sub.plan || "Fitnessabo",
            currentMonthlyCost: monthlyCost,
            alternativeProvider: "Krankenkassen-Präventionsbeitrag",
            offerTitle: alt.offerTitle,
            newMonthlyCost: roundCents(monthlyCost - monthlyEquivalent),
          });
          break;
        }

        // Standard comparison (Telecom, Internet, Banking) with cross-currency safety
        const comp = calculateComparableSavings(monthlyCost, curr, alt.newMonthlyCost, alt.currency);
        if (comp && comp.savings > 3) {
          const monthlySavings = comp.savings;
          const yearlySavings = roundCents(monthlySavings * 12);

          const evidenceLines = [
            `Aktueller Tarif: ${formatMoney(monthlyCost, curr)}/Mt`,
            `Vergleichstarif: ${alt.alternativeProvider} für ${formatMoney(alt.newMonthlyCost, alt.currency)}/Mt`,
            `Quelle: ${alt.source}`,
          ];
          if (comp.isCrossCurrency) {
            evidenceLines.push(`Hinweis: Wechselkursumrechnung (${alt.currency} zu ${curr}) berücksichtigt.`);
          }

          deals.push({
            id: `deal-market-${sub.id}-${alt.alternativeProvider.toLowerCase().replace(/\s+/g, "-")}`,
            subscriptionId: sub.id,
            type: "market_alternative",
            category: alt.category,
            title: alt.offerTitle,
            badge: alt.badge,
            badgeVariant: "brand",
            color: alt.color,
            affectedSubName: `${sub.provider} ${sub.plan ? `(${sub.plan})` : ""}`,
            currentCostFormatted: `${formatMoney(monthlyCost, curr)}/Mt`,
            newCostFormatted: `${formatMoney(alt.newMonthlyCost, alt.currency)}/Mt`,
            monthlySavings,
            yearlySavings,
            confidenceLevel: alt.dataStatus === "verified" ? "verified" : "estimated",
            dataStatus: alt.dataStatus,
            lastChecked: alt.lastChecked,
            evidence: evidenceLines,
            source: alt.source,
            disclaimer: comp.isCrossCurrency ? `Wechselkurs-Schätzung: ${alt.currency} zu ${curr} basierend auf Referenzkursen.` : undefined,
            highlights: alt.highlights,
            explanation: alt.explanation,
            actionText: "Tarif vergleichen",
            actionType: "switch",
            affiliateUrl: alt.affiliateUrl,
            currentProvider: sub.provider,
            currentPlan: sub.plan || "Standard",
            currentMonthlyCost: monthlyCost,
            alternativeProvider: alt.alternativeProvider,
            offerTitle: alt.offerTitle,
            newMonthlyCost: alt.newMonthlyCost,
          });
          break;
        }
      }
    }
  }

  // --------------------------------------------------------------------------
  // 4. ABRECHNUNGS-TUNING (Monatlich auf Jährlich umstellen)
  // --------------------------------------------------------------------------
  for (const sub of activeSubs) {
    if (sub.billingCycle === "monthly") {
      const pLower = (sub.provider || "").toLowerCase();
      const match = ANNUAL_DISCOUNT_SERVICES.find(item => item.keywords.some(kw => pLower.includes(kw)));
      if (match) {
        const monthlyCost = Number(sub.amount) || 0;
        const currentYearly = monthlyCost * 12;
        const discountFraction = match.discountPct / 100;
        const yearlySavings = roundCents(currentYearly * discountFraction);
        const monthlySavings = roundCents(yearlySavings / 12);
        const newMonthlyEquivalent = roundCents(monthlyCost - monthlySavings);
        const curr = sub.currency || "CHF";

        deals.push({
          id: `billing-switch-${sub.id}`,
          subscriptionId: sub.id,
          type: "billing_switch",
          category: sub.category || "Software",
          title: `Jahresrabatt nutzen: ${sub.provider}`,
          badge: `${match.discountPct}% Rabatt bei Jahreszahlung`,
          badgeVariant: "success",
          color: "#e8f5e9",
          affectedSubName: `${sub.provider} (${sub.billingCycle})`,
          currentCostFormatted: `${formatMoney(monthlyCost, curr)}/Mt`,
          newCostFormatted: `${formatMoney(newMonthlyEquivalent, curr)}/Mt (jährlich)`,
          monthlySavings,
          yearlySavings,
          confidenceLevel: "verified",
          dataStatus: "verified",
          evidence: [
            `Offizieller Anbieter-Jahresrabatt: ca. ${match.discountPct}% Ersparnis`,
            `Aktuelle Monatszahlung: ${formatMoney(monthlyCost, curr)}/Mt vs. Jahresäquivalent ${formatMoney(newMonthlyEquivalent, curr)}/Mt`,
          ],
          source: match.source,
          highlights: [
            `${match.discountPct}% Ersparnis bei jährlicher Vorauszahlung`,
            "Voller Leistungsumfang bleibt identisch erhalten",
            `Ersparnis: ${formatMoney(yearlySavings, curr)} pro Jahr`,
          ],
          explanation: `${match.provider} bietet bei jährlicher Abrechnung einen festen Rabatt. Durch Umstellung in den Kontoeinstellungen sparst du sofort bares Geld.`,
          actionText: "Abrechnung prüfen",
          actionType: "toggle_cycle",
          currentProvider: sub.provider,
          currentPlan: sub.plan || "Monatstarif",
          currentMonthlyCost: monthlyCost,
          alternativeProvider: `${sub.provider} (Jahresabo)`,
          offerTitle: match.name,
          newMonthlyCost: newMonthlyEquivalent,
        });
      }
    }
  }

  // Sort: Highest annual savings first
  return deals.sort((a, b) => b.yearlySavings - a.yearlySavings);
}

export function calculatePortfolioHealth(subs: any[], deals: MatchedDeal[]): PortfolioHealth {
  if (!Array.isArray(subs)) {
    return {
      score: 100,
      rating: "Ausgezeichnet",
      summary: "Keine aktiven Verträge vorhanden",
      color: "#2e7d32",
      totalYearlySavings: 0,
      totalMonthlySavings: 0,
      dealsCount: 0,
      breakdown: [{ factor: "Keine aktiven Verträge vorhanden", points: 0, type: "positive" }],
      stats: { zombiesCount: 0, overlapsCount: 0, switchDealsCount: 0, billingDealsCount: 0, refundsCount: 0 },
    };
  }

  const activeSubs = subs.filter(s => s && s.status === "active");
  const totalYearlySavings = roundCents(deals.reduce((acc, d) => acc + d.yearlySavings, 0));
  const totalMonthlySavings = roundCents(deals.reduce((acc, d) => acc + d.monthlySavings, 0));

  const zombiesCount = deals.filter(d => d.type === "zombie").length;
  const overlapsCount = deals.filter(d => d.type === "overlap").length;
  const switchDealsCount = deals.filter(d => d.type === "market_alternative").length;
  const billingDealsCount = deals.filter(d => d.type === "billing_switch").length;
  const refundsCount = deals.filter(d => d.type === "refund_claim").length;

  if (activeSubs.length === 0) {
    return {
      score: 100,
      rating: "Ausgezeichnet",
      summary: "Keine bekannten Optimierungsmöglichkeiten erkannt",
      color: "#2e7d32",
      totalYearlySavings: 0,
      totalMonthlySavings: 0,
      dealsCount: 0,
      breakdown: [
        { factor: "Keine bekannten Optimierungsmöglichkeiten erkannt", points: 0, type: "positive" }
      ],
      stats: { zombiesCount: 0, overlapsCount: 0, switchDealsCount: 0, billingDealsCount: 0, refundsCount: 0 },
    };
  }

  // Transparent point deduction based on identifiable inefficiencies
  let score = 100;
  const breakdown: ScoreBreakdownItem[] = [];

  if (zombiesCount > 0) {
    const penalty = Math.min(40, zombiesCount * 20);
    score -= penalty;
    breakdown.push({
      factor: `${zombiesCount} ungenutzte(s) Zombie-Abo(s) (>45 Tage inaktiv)`,
      points: -penalty,
      type: "negative",
    });
  }

  if (overlapsCount > 0) {
    const penalty = Math.min(25, overlapsCount * 12);
    score -= penalty;
    breakdown.push({
      factor: `${overlapsCount} mögliche Abo-Überlappung(en) (Streaming / Musik)`,
      points: -penalty,
      type: "negative",
    });
  }

  if (switchDealsCount > 0) {
    const penalty = Math.min(20, switchDealsCount * 7);
    score -= penalty;
    breakdown.push({
      factor: `${switchDealsCount} Tarif(e) mit günstigerer Schweizer Markt-Alternative`,
      points: -penalty,
      type: "negative",
    });
  }

  if (billingDealsCount > 0) {
    const penalty = Math.min(10, billingDealsCount * 4);
    score -= penalty;
    breakdown.push({
      factor: `${billingDealsCount} Dienst(e) mit ungenutztem Jahresrabatt`,
      points: -penalty,
      type: "negative",
    });
  }

  if (breakdown.length === 0) {
    breakdown.push({
      factor: "Keine bekannten Optimierungsmöglichkeiten erkannt",
      points: 0,
      type: "positive",
    });
  }

  score = Math.max(15, Math.min(100, score));

  let rating: "Ausgezeichnet" | "Gut" | "Optimierungsbedarf" | "Kritisch" = "Ausgezeichnet";
  let color = "#2e7d32";

  if (score < 50) {
    rating = "Kritisch";
    color = "#c62828";
  } else if (score < 75) {
    rating = "Optimierungsbedarf";
    color = "#e65100";
  } else if (score < 90) {
    rating = "Gut";
    color = "#1565c0";
  }

  const summary = breakdown.length === 1 && breakdown[0].factor === "Keine bekannten Optimierungsmöglichkeiten erkannt"
    ? "Keine bekannten Optimierungsmöglichkeiten erkannt"
    : `${deals.length} Optimierungspotenzial(e) identifiziert`;

  return {
    score,
    rating,
    summary,
    color,
    totalYearlySavings,
    totalMonthlySavings,
    dealsCount: deals.length,
    breakdown,
    stats: {
      zombiesCount,
      overlapsCount,
      switchDealsCount,
      billingDealsCount,
      refundsCount,
    },
  };
}
