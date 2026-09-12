import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle, ArrowDownAZ, ArrowUpDown, BadgePercent, Bell, CalendarDays, Check, CheckCircle2, ChevronDown, ChevronRight,
  CircleHelp, Clipboard, Cloud, Copy, Download, FileJson, FileText, Filter, Globe2, Grid2X2,
  Inbox, Laptop, Layers, LayoutDashboard, List, LockKeyhole, Menu, MoreHorizontal, Pencil, Plus, Receipt,
  RefreshCw, Repeat, Search, Send, Settings2, ShieldAlert, ShieldCheck, Sparkles, Trash2, TrendingDown, Upload, UserRound,
  X, Zap, Dumbbell, Landmark, Tv, Wifi, Smartphone, Music, Shield, BookOpen, Car, Film,
  Camera, FileCheck, Loader2, TrendingUp, ExternalLink
} from "lucide-react";
import {
  SiNetflix, SiSpotify, SiApple, SiYoutube, SiDuolingo, SiGithub, SiPlaystation
} from "react-icons/si";
import {
  FaAmazon, FaMicrosoft, FaXbox
} from "react-icons/fa6";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Link, Route, Router as WouterRouter, Switch, useLocation } from "wouter";
import LandingPage from "./components/LandingPage";
import { calculateDealsForSubscriptions, calculatePortfolioHealth, type MatchedDeal, type PortfolioHealth, type DealType, SWISS_MARKET_CATALOG } from "./lib/deals-engine";
import {
  todayAsDateStr,
  parseLocalDate,
  isValidDateStr,
  daysBetween,
  addDays,
  calculateNoticeDeadline,
  daysUntil,
  formatDate,
  formatShortDate,
  isPast,
  isWithinDays,
} from "./lib/date-utils";
import {
  formatMoney,
  calculateAnnual,
  calculateMonthlyEquivalent,
  roundCents,
  cycleFactor,
  cycleLabelDe,
  cycleNameDe,
  SUPPORTED_CURRENCIES,
} from "./lib/money-utils";
import { generateIcsCalendar, downloadIcsFile } from "./lib/ics-export";

// Map of known providers to their official domains for true brand logos
const OFFICIAL_PROVIDER_DOMAINS: Record<string, { domain: string; bg?: string; dark?: boolean }> = {
  // Schweizer Telekom & Internet
  swisscom: { domain: "swisscom.ch", bg: "#ffffff" },
  sunrise: { domain: "sunrise.ch", bg: "#da291c" },
  salt: { domain: "salt.ch", bg: "#000000" },
  wingo: { domain: "wingo.ch", bg: "#00B4D8" },
  galaxus: { domain: "galaxus.ch", bg: "#ffffff" },
  digitec: { domain: "digitec.ch", bg: "#ffffff" },
  swype: { domain: "swype.ch", bg: "#6C5CE7" },
  yallo: { domain: "yallo.ch", bg: "#00A859" },
  teleboy: { domain: "teleboy.ch", bg: "#ffffff" },
  quickline: { domain: "quickline.ch", bg: "#ffffff" },
  init7: { domain: "init7.net", bg: "#ffffff" },

  // Schweizer Banken & Finanzen
  neon: { domain: "neon-free.ch", bg: "#00E599" },
  ubs: { domain: "ubs.com", bg: "#ffffff" },
  "credit suisse": { domain: "credit-suisse.com", bg: "#ffffff" },
  postfinance: { domain: "postfinance.ch", bg: "#FFCC00" },
  yuh: { domain: "yuh.com", bg: "#ffffff" },
  zak: { domain: "cler.ch", bg: "#ffffff" },
  revolut: { domain: "revolut.com", bg: "#000000" },

  // Schweizer Krankenkassen & Prävention
  qualitop: { domain: "qualitop.ch", bg: "#ffffff" },
  swica: { domain: "swica.ch", bg: "#ffffff" },
  helsana: { domain: "helsana.ch", bg: "#ffffff" },
  css: { domain: "css.ch", bg: "#ffffff" },
  concordia: { domain: "concordia.ch", bg: "#ffffff" },
  sanitas: { domain: "sanitas.com", bg: "#ffffff" },
  visana: { domain: "visana.ch", bg: "#ffffff" },
  "groupe mutuel": { domain: "groupemutuel.ch", bg: "#ffffff" },
  sympany: { domain: "sympany.ch", bg: "#ffffff" },
  atupri: { domain: "atupri.ch", bg: "#ffffff" },

  // Schweizer Fitness
  puregym: { domain: "puregym.swiss", bg: "#000000" },
  "activ fitness": { domain: "activfitness.ch", bg: "#ffffff" },
  fitnesspark: { domain: "fitnesspark.ch", bg: "#ffffff" },
  kieser: { domain: "kieser-training.ch", bg: "#ffffff" },
  mcfit: { domain: "mcfit.com", bg: "#ffffff" },
  "clever fit": { domain: "clever-fit.com", bg: "#ffffff" },

  // Schweizer Mobilität
  sbb: { domain: "sbb.ch", bg: "#EB0000" },
  cff: { domain: "sbb.ch", bg: "#EB0000" },
  ffs: { domain: "sbb.ch", bg: "#EB0000" },
  mobility: { domain: "mobility.ch", bg: "#ED1C24" },
  halbtax: { domain: "sbb.ch", bg: "#EB0000" },
  generalabonnement: { domain: "sbb.ch", bg: "#EB0000" },

  // Global Streaming & Entertainment
  netflix: { domain: "netflix.com", bg: "#000000" },
  spotify: { domain: "spotify.com", bg: "#121212" },
  disney: { domain: "disneyplus.com", bg: "#040714" },
  "disney+": { domain: "disneyplus.com", bg: "#040714" },
  "disney plus": { domain: "disneyplus.com", bg: "#040714" },
  apple: { domain: "apple.com", bg: "#000000" },
  "apple music": { domain: "apple.com", bg: "#FA2D48" },
  "apple tv": { domain: "apple.com", bg: "#000000" },
  icloud: { domain: "apple.com", bg: "#0070c9" },
  amazon: { domain: "amazon.de", bg: "#000000" },
  "prime video": { domain: "primevideo.com", bg: "#00A8E1" },
  "amazon prime": { domain: "amazon.de", bg: "#000000" },
  youtube: { domain: "youtube.com", bg: "#ffffff" },
  "youtube premium": { domain: "youtube.com", bg: "#ffffff" },
  dazn: { domain: "dazn.com", bg: "#000000" },
  sky: { domain: "sky.ch", bg: "#000000" },
  "sky show": { domain: "sky.ch", bg: "#000000" },
  "sky sport": { domain: "sky.ch", bg: "#000000" },
  crunchyroll: { domain: "crunchyroll.com", bg: "#F47521" },
  tidal: { domain: "tidal.com", bg: "#000000" },
  deezer: { domain: "deezer.com", bg: "#000000" },
  audible: { domain: "audible.de", bg: "#ffffff" },

  // Software & Tech
  microsoft: { domain: "microsoft.com", bg: "#ffffff" },
  "office 365": { domain: "office.com", bg: "#ffffff" },
  "microsoft 365": { domain: "microsoft.com", bg: "#ffffff" },
  google: { domain: "google.com", bg: "#ffffff" },
  "google one": { domain: "one.google.com", bg: "#ffffff" },
  adobe: { domain: "adobe.com", bg: "#ffffff" },
  "creative cloud": { domain: "adobe.com", bg: "#ffffff" },
  duolingo: { domain: "duolingo.com", bg: "#58CC02" },
  playstation: { domain: "playstation.com", bg: "#003791" },
  "ps plus": { domain: "playstation.com", bg: "#003791" },
  xbox: { domain: "xbox.com", bg: "#107C10" },
  "game pass": { domain: "xbox.com", bg: "#107C10" },
  nintendo: { domain: "nintendo.ch", bg: "#E60012" },
  github: { domain: "github.com", bg: "#24292e" },
  chatgpt: { domain: "openai.com", bg: "#10a37f" },
  openai: { domain: "openai.com", bg: "#10a37f" },
  claude: { domain: "anthropic.com", bg: "#ffffff" },
  dropbox: { domain: "dropbox.com", bg: "#ffffff" },
  notion: { domain: "notion.so", bg: "#ffffff" },
  nordvpn: { domain: "nordvpn.com", bg: "#ffffff" },
};

function resolveBrandDomain(name: string): { domain: string; bg?: string } | null {
  const norm = name.toLowerCase().trim();
  // Exact match first
  if (OFFICIAL_PROVIDER_DOMAINS[norm]) {
    return OFFICIAL_PROVIDER_DOMAINS[norm];
  }
  // Substring match
  for (const [key, val] of Object.entries(OFFICIAL_PROVIDER_DOMAINS)) {
    if (norm.includes(key) || key.includes(norm)) {
      return val;
    }
  }
  // If provider name contains a dot (e.g. "swisscom.ch"), use it as domain
  if (norm.includes(".") && !norm.includes(" ")) {
    return { domain: norm, bg: "#ffffff" };
  }
  return null;
}

export function ProviderBrandIcon({
  name,
  color,
  logoText,
  size = "md",
  className = ""
}: {
  name?: string;
  color?: string;
  logoText?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const [imgError, setImgError] = useState(false);
  const brand = name ? resolveBrandDomain(name) : null;
  const sizeClasses = size === "sm" ? "h-7 w-7 rounded-lg text-[10px]" : size === "lg" ? "h-12 w-12 rounded-2xl text-sm" : "h-10 w-10 rounded-xl text-xs";
  const imgSizeClasses = size === "sm" ? "h-5 w-5" : size === "lg" ? "h-8 w-8" : "h-6 w-6";

  // If a known official brand was resolved and no image load error
  if (brand && !imgError) {
    const logoUrl = `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://${brand.domain}&size=128`;
    return (
      <div
        className={`grid shrink-0 place-items-center bg-white shadow-xs overflow-hidden border border-black/10 transition-transform ${sizeClasses} ${className}`}
        style={brand.bg ? { backgroundColor: brand.bg } : undefined}
        title={name}
      >
        <img
          src={logoUrl}
          alt={name || "Brand logo"}
          className={`object-contain ${imgSizeClasses} transition-opacity duration-200`}
          loading="lazy"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  // Fallback: Initial badges
  const initials = logoText || (name ? name.slice(0, 2).toUpperCase() : "S");
  const bg = color || "#182d3b";
  return (
    <div
      className={`grid shrink-0 place-items-center font-bold text-white shadow-xs overflow-hidden ${sizeClasses} ${className}`}
      style={{ backgroundColor: bg }}
      title={name}
    >
      {initials}
    </div>
  );
}

type BillingCycle = "monthly" | "quarterly" | "half-yearly" | "yearly";
type SubStatus = "active" | "cancelled";
export type Subscription = {
  id: number;
  provider: string;
  plan: string;
  category: string;
  amount: number;
  billingCycle: BillingCycle;
  nextRenewal: string;
  noticeDays: number;
  lastUsed: string;
  status: SubStatus;
  contractNumber: string;
  color: string;
  logoText: string;
  cancellationAddress: string;
  hotline: string;
  priceChange?: number;
};

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  createdAt?: string;
}

export interface UserSettings {
  user_id: string;
  currency: string;
  notice_days: number;
  two_factor_enabled: number;
  updated_at?: string;
}

const dateAt = (offset: number) => addDays(todayAsDateStr(), offset);
const money = (n: number, curr = "CHF") => formatMoney(n, curr);
const shortDate = (value: string) => formatShortDate(value);
const annual = (s: Subscription) => calculateAnnual(s.amount, s.billingCycle);
const isUnused = (s: Subscription) => daysBetween(s.lastUsed, todayAsDateStr()) > 45;
const daysUntilSub = (s: Subscription) => daysUntil(s.nextRenewal);
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const api = async <T,>(url: string, init: RequestInit = {}): Promise<T> => {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const method = (init.method || "GET").toUpperCase();
  const isMutating = method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE";

  let response: Response;
  try {
    response = await fetch(url, { ...init, headers, credentials: "include" });
  } catch {
    // Only retry idempotent requests (GET, HEAD) once on transient network glitch
    if (!isMutating) {
      try {
        await new Promise(r => setTimeout(r, 350));
        response = await fetch(url, { ...init, headers, credentials: "include" });
      } catch {
        throw new ApiError(0, "Verbindung kurz unterbrochen. Bitte versuche es erneut.");
      }
    } else {
      throw new ApiError(0, "Netzwerkfehler bei der Übertragung. Bitte Verbindung prüfen.");
    }
  }

  if (!response.ok) {
    if (response.status === 401 && !url.includes("/api/auth/login") && !url.includes("/api/auth/verify-2fa")) {
      window.dispatchEvent(new CustomEvent("subly:unauthorized"));
    }
    const errorBody = await response.json().catch(() => null) as { error?: string } | null;
    throw new ApiError(response.status, errorBody?.error || `Anfrage fehlgeschlagen (${response.status})`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
};

const withoutId = ({ id: _id, ...payload }: Subscription) => payload;

function Button({ children, className = "", onClick, variant = "ghost", ...props }: { children: React.ReactNode; className?: string; onClick?: () => void; variant?: "ghost" | "dark" | "lime" | "soft" | "danger" } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const variants = {
    ghost: "border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]",
    dark: "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90",
    lime: "bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] hover:brightness-95",
    soft: "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:bg-[hsl(var(--muted))]",
    danger: "bg-[hsl(var(--destructive))] text-white hover:brightness-95"
  };
  return <button onClick={onClick} className={`inline-flex items-center justify-center gap-2 rounded-[10px] px-3.5 py-2 text-sm font-semibold transition-all duration-200 active:scale-[.98] disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${className}`} {...props}>{children}</button>;
}

function Logo() {
  return (
    <Link href="/" data-testid="link-logo" className="flex items-center gap-2.5 text-[hsl(var(--sidebar-foreground))]">
      <img src="/subly-logo.png" alt="Subly Logo" className="h-9 w-9 rounded-xl object-contain shadow-sm bg-white p-1 border border-black/5" />
      <span className="font-display text-[21px] font-bold tracking-[-.04em]">subly<span className="text-[#059669]">.</span></span>
    </Link>
  );
}

function Sidebar({ location, onNew, onSignOut, userLabel, subs, currency }: { location: string; onNew: () => void; onSignOut: () => void; userLabel: string; subs: Subscription[]; currency: string }) {
  const items = [
    { href: "/", label: "Übersicht", icon: LayoutDashboard },
    { href: "/subs", label: "Abonnemente", icon: Receipt },
    { href: "/deals", label: "Sparpotenzial", icon: TrendingDown },
    { href: "/more", label: "Einstellungen & Sicherheit", icon: Settings2 }
  ];
  const monthlyTotal = subs.filter(s => s.status === "active").reduce((acc, s) => acc + calculateMonthlyEquivalent(s.amount, s.billingCycle), 0);

  return (
    <aside className="hidden w-[248px] shrink-0 flex-col bg-[hsl(var(--sidebar))] px-5 py-6 text-[hsl(var(--sidebar-foreground))] md:flex">
      <Logo />
      <div className="mt-10 rounded-2xl border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-accent))] p-4">
        <div className="mb-3 flex items-start justify-between">
          <span className="text-[11px] font-bold uppercase tracking-[.16em] text-[hsl(var(--sidebar-foreground)/.62)]">Dieser Monat</span>
          <Sparkles size={15} className="text-[hsl(var(--sidebar-primary))]" />
        </div>
        <div className="font-display text-[25px] font-semibold">{formatMoney(monthlyTotal, currency)}</div>
        <div className="mt-1 flex items-center gap-1 text-xs text-[hsl(var(--sidebar-foreground)/.66)]">
          <Cloud size={12} className="text-[hsl(var(--sidebar-primary))]" /> Synchronisiert
        </div>
      </div>
      <Button variant="lime" onClick={onNew} className="mt-5 w-full" data-testid="button-new-sidebar">
        <Plus size={16} /> Neues Abo
      </Button>
      <nav className="mt-8 space-y-1" aria-label="Hauptnavigation">
        {items.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            data-testid={`link-nav-${label.toLowerCase().replaceAll(" ", "-")}`}
            className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${location === href ? "bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-primary))]" : "text-[hsl(var(--sidebar-foreground)/.68)] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-foreground))]"}`}
          >
            <Icon size={18} strokeWidth={location === href ? 2.5 : 1.8} />
            <span>{label}</span>
            {href === "/subs" && subs.length > 0 && (
              <span className="ml-auto rounded-md bg-[hsl(var(--destructive))] px-1.5 py-0.5 text-[10px] text-white">
                {subs.filter(s => s.status === "active").length}
              </span>
            )}
          </Link>
        ))}
      </nav>
      <div className="mt-auto border-t border-[hsl(var(--sidebar-border))] pt-5">
        <div className="flex items-center gap-3 px-2">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-[hsl(var(--sidebar-primary))] text-xs font-bold text-[hsl(var(--sidebar-primary-foreground))]">
            {(userLabel || "U").slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{userLabel}</div>
            <button onClick={onSignOut} className="text-xs text-[hsl(var(--sidebar-foreground)/.55)] hover:text-[hsl(var(--sidebar-foreground))]">
              Abmelden
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

function Topbar({ title, onNew, onScan, onMenu }: { title: string; onNew: () => void; onScan: () => void; onMenu: () => void }) {
  return (
    <header className="flex h-[78px] items-center justify-between border-b border-[hsl(var(--border))] px-5 md:px-9">
      <div className="flex items-center gap-3">
        <button onClick={onMenu} className="md:hidden" aria-label="Menü öffnen" data-testid="button-open-menu">
          <Menu size={20} />
        </button>
        <div>
          <div className="font-display text-[23px] font-semibold tracking-[-.035em]">{title}</div>
          <div className="hidden text-xs text-[hsl(var(--muted-foreground))] sm:block">
            Schweizer Abo-Cockpit <span className="mx-1">·</span> Sicher &amp; verschlüsselt
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={onScan} className="hidden sm:inline-flex" data-testid="button-scan-invoice">
          <Receipt size={16} /> <span className="hidden lg:inline">Rechnung scannen</span>
        </Button>
        <Button variant="dark" onClick={onNew} data-testid="button-new-top">
          <Plus size={17} /> <span className="hidden sm:inline">Neues Abo</span>
        </Button>
      </div>
    </header>
  );
}

function MobileNav({ location }: { location: string }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-[68px] items-center justify-around border-t border-[hsl(var(--border))] bg-[hsl(var(--card)/.96)] px-2 backdrop-blur md:hidden">
      {[
        { href: "/", label: "Übersicht", icon: LayoutDashboard },
        { href: "/subs", label: "Abos", icon: Receipt },
        { href: "/deals", label: "Sparen", icon: TrendingDown },
        { href: "/more", label: "Mehr", icon: MoreHorizontal }
      ].map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          data-testid={`link-mobile-${label.toLowerCase()}`}
          className={`flex w-16 flex-col items-center gap-1 py-1 text-[10px] font-semibold ${location === href ? "text-[hsl(var(--destructive))]" : "text-[hsl(var(--muted-foreground))]"}`}
        >
          <Icon size={19} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}

function Dashboard({ subs, onMarkUsed, onNew, onScan, onRoute, currency }: { subs: Subscription[]; onMarkUsed: (id: number) => void; onNew: () => void; onScan: () => void; onRoute: (p: string) => void; currency: string }) {
  const active = subs.filter(s => s.status === "active");
  const monthly = active.reduce((sum, s) => sum + annual(s) / 12, 0);
  const unused = active.filter(isUnused);
  const matchedDeals = useMemo(() => calculateDealsForSubscriptions(subs), [subs]);
  const totalSavings = matchedDeals.reduce((a, d) => a + d.yearlySavings, 0);

  return (
    <main className="page-enter mx-auto max-w-[1380px] p-5 pb-24 md:p-9 md:pb-10">
      <section className="rise relative overflow-hidden rounded-[24px] bg-[hsl(var(--primary))] px-6 py-7 text-[hsl(var(--primary-foreground))] md:px-9 md:py-8">
        <div className="relative z-10 max-w-[570px]">
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-[hsl(var(--primary-foreground)/.55)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent))]" /> Deine Fixkosten im Überblick
          </div>
          <h1 className="font-display text-[34px] font-semibold leading-[1.05] tracking-[-.045em] md:text-[44px]">
            Du zahlst monatlich <span className="text-[hsl(var(--accent))]">{money(monthly, currency)}</span> für laufende Verträge.
          </h1>
          <p className="mt-4 max-w-[430px] text-sm leading-6 text-[hsl(var(--primary-foreground)/.65)]">
            {active.length === 0
              ? "Noch keine aktiven Abonnemente erfasst. Starte jetzt mit deinem ersten Vertrag!"
              : `Subly hat ${matchedDeals.length} passende Sparpotenziale mit insgesamt ${money(totalSavings, currency)} / Jahr Ersparnis für dich berechnet.`}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button variant="lime" onClick={() => onRoute(active.length > 0 ? "/subs" : "/subs")} data-testid="button-review-subscriptions">
              {active.length > 0 ? "Verträge prüfen" : "Erstes Abo anlegen"} <ChevronRight size={15} />
            </Button>
            <Button variant="ghost" onClick={onScan} className="border-[hsl(var(--primary-foreground)/.22)] bg-transparent text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary-foreground)/.1)]" data-testid="button-scan-hero">
              <Receipt size={15} /> Rechnung scannen
            </Button>
          </div>
        </div>
        <div className="absolute -right-12 -top-24 h-[370px] w-[370px] rounded-full border-[38px] border-[hsl(var(--sidebar-accent))] opacity-70 md:right-12 md:top-[-130px]" />
        <div className="absolute -bottom-28 right-[110px] h-[240px] w-[240px] rounded-full border-[28px] border-[hsl(var(--destructive)/.75)] opacity-80" />
      </section>

      {/* Overview Cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Aktive Verträge</div>
          <div className="mt-2 font-display text-3xl font-bold">{active.length}</div>
          <div className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{money(active.reduce((a, s) => a + annual(s), 0), currency)} Jahresbelastung</div>
        </div>

        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Ungenutzte Abos</div>
          <div className="mt-2 font-display text-3xl font-bold text-[hsl(var(--destructive))]">{unused.length}</div>
          <div className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Länger als 45 Tage inaktiv</div>
        </div>

        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[#edf3bd] p-5 shadow-sm sm:col-span-2 lg:col-span-1">
          <div className="text-xs font-bold uppercase tracking-wider text-[#182d3b]/70">Errechnetes Sparpotenzial</div>
          <div className="mt-2 font-display text-3xl font-bold text-[#182d3b]">{money(totalSavings, currency)}</div>
          <div className="mt-1 text-xs text-[#182d3b]/70">Basierend auf deinen {matchedDeals.length} gematchten Abos</div>
        </div>
      </div>

      {/* Top 2 Deals Preview */}
      {matchedDeals.length > 0 && (
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-[hsl(var(--foreground))]">Top Spar-Empfehlungen</h2>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Erkannte Optimierungspotenziale für deine Verträge</p>
            </div>
            <Button variant="ghost" onClick={() => onRoute("/deals")} className="text-xs font-semibold text-[#182d3b] hover:bg-black/5">
              Alle {matchedDeals.length} Deals ansehen <ChevronRight size={14} className="ml-1" />
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {matchedDeals.slice(0, 2).map(deal => (
              <div
                key={deal.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-emerald-500/20 bg-emerald-50/40 p-5 shadow-sm transition hover:shadow-md dark:bg-emerald-950/10"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                      {deal.badge}
                    </span>
                    <span className="font-display text-base font-extrabold text-emerald-700 dark:text-emerald-400">
                      + {money(deal.yearlySavings, currency)}/Jahr
                    </span>
                  </div>

                  <h3 className="mt-3 font-semibold text-[hsl(var(--foreground))] group-hover:text-emerald-700">
                    {deal.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-[hsl(var(--muted-foreground))] line-clamp-2">
                    {deal.explanation}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-emerald-500/15 pt-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <ProviderBrandIcon name={deal.affectedSubName} size="sm" />
                    <span className="truncate text-xs font-medium text-[hsl(var(--muted-foreground))]">
                      Betrifft: <strong className="text-[hsl(var(--foreground))]">{deal.affectedSubName}</strong>
                    </span>
                  </div>
                  <Button
                    variant="lime"
                    onClick={() => onRoute("/deals")}
                    className="h-8 px-3 text-xs shrink-0"
                  >
                    Prüfen <ChevronRight size={13} className="ml-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function SubscriptionRow({ s, onEdit, onDelete, onUsed, onIcs, currency }: { s: Subscription; onEdit: () => void; onDelete: () => void; onUsed: () => void; onIcs: () => void; currency: string }) {
  const deadline = calculateNoticeDeadline(s.nextRenewal, s.noticeDays);
  const daysLeft = daysUntil(deadline);
  const isUrgent = daysLeft <= 14;

  return (
    <div className="group grid grid-cols-[1.4fr_1.1fr_1.1fr_.6fr_36px] items-center gap-4 border-t border-[hsl(var(--border))] px-5 py-4 transition-colors hover:bg-[hsl(var(--secondary)/.45)]" data-testid={`row-subscription-${s.id}`}>
      <div className="flex min-w-0 items-center gap-3">
        <ProviderBrandIcon name={s.provider} color={s.color} logoText={s.logoText} size="md" />
        <div className="min-w-0">
          <div className="truncate text-sm font-bold">{s.provider}</div>
          <div className="truncate text-xs text-[hsl(var(--muted-foreground))]">{s.plan} · {s.category}</div>
        </div>
      </div>
      <div>
        <div className="text-sm font-semibold">{formatMoney(s.amount, currency)} <span className="text-xs font-normal text-[hsl(var(--muted-foreground))]">{cycleLabelDe[s.billingCycle]}</span></div>
        <div className="font-mono text-[10px] text-[hsl(var(--muted-foreground))]">{formatMoney(annual(s), currency)} / Jahr</div>
      </div>
      <div>
        <div className="text-xs text-[hsl(var(--muted-foreground))]">Erneuerung: <span className="font-medium text-[hsl(var(--foreground))]">{formatDate(s.nextRenewal)}</span></div>
        <div className={`text-xs font-semibold ${isUrgent ? "text-[hsl(var(--destructive))]" : "text-[hsl(var(--foreground))]"}`}>
          Kündigung bis: {formatDate(deadline)}
        </div>
        <div className="flex items-center gap-1 text-[10px] text-[hsl(var(--muted-foreground))]">
          {isUrgent ? (
            <span className="font-bold text-rose-600">Noch {daysLeft <= 0 ? "0" : daysLeft} Tage*</span>
          ) : (
            <span>{s.noticeDays} Tage Frist*</span>
          )}
        </div>
      </div>
      <div>
        {isUnused(s) ? (
          <span className="inline-flex rounded-full bg-[hsl(var(--destructive)/.13)] px-2.5 py-1 text-[10px] font-bold text-[hsl(var(--destructive))]">Ungenutzt</span>
        ) : (
          <span className="inline-flex rounded-full bg-[hsl(var(--chart-3)/.14)] px-2.5 py-1 text-[10px] font-bold text-[hsl(var(--chart-3))]">
            <Check size={11} className="mr-1" /> Aktiv
          </span>
        )}
      </div>
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="grid h-8 w-8 place-items-center rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors"
              aria-label={`Aktionen für ${s.provider}`}
              data-testid={`button-actions-${s.id}`}
            >
              <MoreHorizontal size={17} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 rounded-xl p-1.5 shadow-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] z-50">
            <DropdownMenuItem onClick={onUsed} className="cursor-pointer gap-2 rounded-lg px-2.5 py-2 text-xs font-medium focus:bg-[hsl(var(--muted))]">
              <Check size={14} className="text-emerald-600" /> Als genutzt markieren
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onIcs} className="cursor-pointer gap-2 rounded-lg px-2.5 py-2 text-xs font-medium focus:bg-[hsl(var(--muted))]">
              <CalendarDays size={14} className="text-blue-500" /> Kalender (.ics) exportieren
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit} className="cursor-pointer gap-2 rounded-lg px-2.5 py-2 text-xs font-medium focus:bg-[hsl(var(--muted))]">
              <Pencil size={14} className="text-[hsl(var(--muted-foreground))]" /> Bearbeiten
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem onClick={onDelete} className="cursor-pointer gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-[hsl(var(--destructive))] focus:bg-[hsl(var(--destructive)/.1)] focus:text-[hsl(var(--destructive))]">
              <Trash2 size={14} /> Löschen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function SubsPage({ subs, setSubs, onNew, onEdit, onCancel, onScan, toast, persistUsed, persistDelete, persistRestore, currency }: { subs: Subscription[]; setSubs: React.Dispatch<React.SetStateAction<Subscription[]>>; onNew: () => void; onEdit: (s: Subscription) => void; onCancel: (s: Subscription) => void; onScan: () => void; toast: (message: string, undo?: () => void) => void; persistUsed: (id: number) => Promise<Subscription>; persistDelete: (id: number) => Promise<void>; persistRestore: (s: Subscription) => Promise<Subscription>; currency: string }) {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("renewal");
  const [view, setView] = useState<"list" | "grid">("list");

  const filtered = useMemo(() => {
    return subs
      .filter(s => {
        const matches = `${s.provider} ${s.plan} ${s.category}`.toLowerCase().includes(query.toLowerCase());
        const f = filter === "unused" ? isUnused(s) : filter === "due" ? daysUntil(s.nextRenewal) <= 30 : filter === "cancelled" ? s.status === "cancelled" : s.status === "active";
        return matches && (filter === "all" ? true : f);
      })
      .sort((a, b) => {
        return sort === "amount"
          ? annual(b) - annual(a)
          : sort === "provider"
          ? a.provider.localeCompare(b.provider)
          : a.nextRenewal.localeCompare(b.nextRenewal);
      });
  }, [subs, filter, query, sort]);

  const markUsed = async (id: number) => {
    try {
      const updated = await persistUsed(id);
      setSubs(old => old.map(s => s.id === id ? updated : s));
      toast("Als genutzt markiert — Kündigungs-Alarm zurückgesetzt");
    } catch {
      toast("Aktualisierung fehlgeschlagen");
    }
  };

  const del = async (id: number) => {
    const removed = subs.find(s => s.id === id);
    if (!removed) return;
    try {
      await persistDelete(id);
      setSubs(old => old.filter(s => s.id !== id));
      let restored = false;
      toast(`${removed.provider} gelöscht`, async () => {
        if (restored) return;
        restored = true;
        try {
          const res = await persistRestore(removed);
          setSubs(old => [...old, res]);
          toast(`${removed.provider} wiederhergestellt`);
        } catch {
          toast("Wiederherstellung fehlgeschlagen");
        }
      });
    } catch {
      toast("Löschen fehlgeschlagen");
    }
  };

  const downloadIcs = (s: Subscription) => {
    downloadIcsFile(s, currency);
    toast("Kalender-Erinnerung (.ics) exportiert");
  };

  return (
    <main className="page-enter mx-auto max-w-[1380px] p-5 pb-24 md:p-9 md:pb-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[34px] font-semibold tracking-[-.045em]">Abonnemente</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            {subs.filter(s => s.status === "active").length} aktive Verträge · {money(subs.filter(s => s.status === "active").reduce((a, s) => a + annual(s), 0), currency)} jährliche Fixkosten
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onScan} data-testid="button-scan-ledger"><Receipt size={16} /> Rechnung scannen</Button>
          <Button variant="dark" onClick={onNew} data-testid="button-add-ledger"><Plus size={16} /> Neues Abo</Button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[210px] flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Anbieter, Plan oder Kategorie suchen"
            className="h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] pl-9 pr-3 text-sm outline-none ring-[hsl(var(--ring))] focus:ring-2"
          />
        </div>
        <div className="flex overflow-x-auto rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-1 scrollbar-none">
          {[["all", "Alle"], ["due", "Fällig"], ["unused", "Ungenutzt"], ["cancelled", "Gekündigt"]].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setFilter(v)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${filter === v ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]" : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"}`}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-1">
          <select value={sort} onChange={e => setSort(e.target.value)} className="h-7 bg-transparent px-1 text-xs font-semibold outline-none">
            <option value="renewal">Kündigungsdatum</option>
            <option value="amount">Jahreskosten</option>
            <option value="provider">Anbieter</option>
          </select>
          <button onClick={() => setView(view === "list" ? "grid" : "list")} className="grid h-7 w-7 place-items-center rounded-lg hover:bg-[hsl(var(--muted))]">
            {view === "list" ? <Grid2X2 size={15} /> : <List size={15} />}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Inbox size={34} className="mx-auto mb-3 text-[hsl(var(--muted-foreground))]" />
            <div className="font-display text-xl font-semibold">Keine Verträge in dieser Ansicht</div>
            <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Füge deine realen Abos hinzu, um deine Kündigungsfristen sicher zu verwalten.</p>
            <Button variant="dark" onClick={onNew} className="mt-5">
              <Plus size={16} /> Erstes Abo anlegen
            </Button>
          </div>
        ) : view === "grid" ? (
          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(s => {
              const deadline = calculateNoticeDeadline(s.nextRenewal, s.noticeDays);
              const daysLeft = daysUntil(deadline);
              const isUrgent = daysLeft <= 14;
              return (
                <div key={s.id} className="flex flex-col justify-between rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-xs transition hover:shadow-md" data-testid={`card-subscription-${s.id}`}>
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <ProviderBrandIcon name={s.provider} color={s.color} logoText={s.logoText} size="md" />
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-bold">{s.provider}</h3>
                          <div className="truncate text-xs text-[hsl(var(--muted-foreground))]">{s.plan} · {s.category}</div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="grid h-8 w-8 place-items-center rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
                            aria-label={`Aktionen für ${s.provider}`}
                          >
                            <MoreHorizontal size={17} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52 rounded-xl p-1.5 shadow-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] z-50">
                          <DropdownMenuItem onClick={() => markUsed(s.id)} className="cursor-pointer gap-2 rounded-lg px-2.5 py-2 text-xs font-medium focus:bg-[hsl(var(--muted))]">
                            <Check size={14} className="text-emerald-600" /> Als genutzt markieren
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => downloadIcs(s)} className="cursor-pointer gap-2 rounded-lg px-2.5 py-2 text-xs font-medium focus:bg-[hsl(var(--muted))]">
                            <CalendarDays size={14} className="text-blue-500" /> Kalender (.ics) exportieren
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(s)} className="cursor-pointer gap-2 rounded-lg px-2.5 py-2 text-xs font-medium focus:bg-[hsl(var(--muted))]">
                            <Pencil size={14} className="text-[hsl(var(--muted-foreground))]" /> Bearbeiten
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-1" />
                          <DropdownMenuItem onClick={() => del(s.id)} className="cursor-pointer gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-[hsl(var(--destructive))] focus:bg-[hsl(var(--destructive)/.1)] focus:text-[hsl(var(--destructive))]">
                            <Trash2 size={14} /> Löschen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="mt-4 flex items-baseline justify-between border-t border-[hsl(var(--border))] pt-3">
                      <div>
                        <span className="text-lg font-bold">{formatMoney(s.amount, currency)}</span>
                        <span className="text-xs text-[hsl(var(--muted-foreground))]"> {cycleLabelDe[s.billingCycle]}</span>
                      </div>
                      <span className="font-mono text-xs text-[hsl(var(--muted-foreground))]">{formatMoney(annual(s), currency)} / Jahr</span>
                    </div>

                    <div className="mt-3 space-y-1.5 rounded-lg bg-[hsl(var(--secondary)/.5)] p-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[hsl(var(--muted-foreground))]">Nächste automatische Verlängerung:</span>
                        <span className="font-medium">{formatDate(s.nextRenewal)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[hsl(var(--muted-foreground))]">Kündigungsfrist:</span>
                        <span className="font-medium">{s.noticeDays} Tage</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[hsl(var(--muted-foreground))]">Berechneter spätester Kündigungstermin:</span>
                        <span className={`font-semibold ${isUrgent ? "text-[hsl(var(--destructive))]" : ""}`}>
                          {formatDate(deadline)}
                        </span>
                      </div>
                      {isUrgent && (
                        <div className="mt-1 flex items-center gap-1 rounded bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-700 border border-rose-200">
                          <AlertTriangle size={12} /> Frist bald fällig ({daysLeft <= 0 ? "Heute/Vergangen" : `noch ${daysLeft} Tage`})
                        </div>
                      )}
                      <div className="text-[10px] text-[hsl(var(--muted-foreground))] pt-0.5">
                        Berechneter Richtwert – individuelle Vertragsbedingungen prüfen.
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-[hsl(var(--border))] pt-3">
                    {isUnused(s) ? (
                      <span className="inline-flex rounded-full bg-[hsl(var(--destructive)/.13)] px-2.5 py-1 text-[10px] font-bold text-[hsl(var(--destructive))]">Ungenutzt</span>
                    ) : (
                      <span className="inline-flex rounded-full bg-[hsl(var(--chart-3)/.14)] px-2.5 py-1 text-[10px] font-bold text-[hsl(var(--chart-3))]">
                        <Check size={11} className="mr-1" /> Aktiv
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => onCancel(s)}
                      className="text-xs font-semibold text-[#182d3b] hover:underline"
                    >
                      Kündigung vorbereiten
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <>
            <div className="hidden grid-cols-[1.4fr_1.1fr_1.1fr_.6fr_36px] gap-4 px-5 py-3 text-[10px] font-bold uppercase tracking-[.14em] text-[hsl(var(--muted-foreground))] md:grid">
              <div>Anbieter</div>
              <div>Kosten</div>
              <div>Fristen (*Richtwert)</div>
              <div>Status</div>
              <div />
            </div>
            {filtered.map(s => (
              <SubscriptionRow
                key={s.id}
                s={s}
                onEdit={() => onEdit(s)}
                onDelete={() => del(s.id)}
                onUsed={() => markUsed(s.id)}
                onIcs={() => downloadIcs(s)}
                currency={currency}
              />
            ))}
          </>
        )}
      </div>
    </main>
  );
}

function DealsPage({ subs, currency = "CHF", onCancel, onNew }: { subs: Subscription[]; currency?: string; onCancel: (s: Subscription) => void; onNew?: () => void }) {
  const [filter, setFilter] = useState<"all" | DealType>("all");
  const deals = useMemo(() => calculateDealsForSubscriptions(subs), [subs]);
  const health = useMemo(() => calculatePortfolioHealth(subs, deals), [subs, deals]);

  const filteredDeals = useMemo(() => {
    if (filter === "all") return deals;
    return deals.filter(d => d.type === filter);
  }, [deals, filter]);

  const counts = useMemo(() => ({
    all: deals.length,
    market_alternative: deals.filter(d => d.type === "market_alternative").length,
    overlap: deals.filter(d => d.type === "overlap").length,
    zombie: deals.filter(d => d.type === "zombie").length,
    billing_switch: deals.filter(d => d.type === "billing_switch").length,
    refund_claim: deals.filter(d => d.type === "refund_claim").length,
  }), [deals]);

  const getTypeIcon = (type: DealType) => {
    switch (type) {
      case "zombie": return <AlertTriangle size={15} className="text-rose-600" />;
      case "overlap": return <Repeat size={15} className="text-amber-600" />;
      case "billing_switch": return <BadgePercent size={15} className="text-blue-600" />;
      case "refund_claim": return <ShieldCheck size={15} className="text-emerald-600" />;
      case "market_alternative": default: return <Zap size={15} className="text-teal-600" />;
    }
  };

  const getTypeLabel = (type: DealType) => {
    switch (type) {
      case "zombie": return "Inaktives Abo (Zombie)";
      case "overlap": return "Abo-Überlappung";
      case "billing_switch": return "Jahresrabatt";
      case "refund_claim": return "Krankenkassen-Zuschuss";
      case "market_alternative": default: return "Günstigerer Tarif";
    }
  };

  return (
    <main className="page-enter mx-auto max-w-[1380px] p-5 pb-24 md:p-9 md:pb-10">
      {/* Clean, minimalist Deals Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.15em] text-[#059669]">
            <Sparkles size={14} /> Smart Deals & Sparpotenziale
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight md:text-3xl">
            Abo-Deals & Optimierungen
          </h1>
          <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
            Geprüfte Schweizer Tarif-Alternativen, Kündigungs-Tipps und Krankenkassen-Rückerstattungen.
          </p>
        </div>

        {deals.length > 0 && (
          <div className="inline-flex shrink-0 items-center gap-2.5 self-start rounded-2xl border border-emerald-200/80 bg-emerald-50/90 px-4 py-2.5 text-xs font-semibold text-emerald-950 shadow-xs sm:self-auto">
            <TrendingUp size={16} className="text-[#059669]" />
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Berechnetes Sparpotenzial</div>
              <div className="font-display text-base font-black text-[#059669]">
                {money(deals.reduce((acc, d) => acc + d.yearlySavings, 0), currency)} <span className="text-[11px] font-semibold text-emerald-800">/ Jahr</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Portfolio Health Card with Explainable Factor Breakdown */}
      <div className="mt-6 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div
              className="grid h-14 w-14 place-items-center rounded-2xl font-display text-2xl font-black text-white shadow-xs"
              style={{ backgroundColor: health.color }}
            >
              {health.score}
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                Abo-Portfolio Zustand
              </div>
              <div className="font-display text-lg font-bold" style={{ color: health.color }}>
                {health.rating}
              </div>
              <div className="text-xs text-[hsl(var(--muted-foreground))]">
                Transparente Bewertung basierend auf Inaktivität, Redundanzen und Schweizer Markt-Tarifen.
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            {health.breakdown.map((item, idx) => (
              <span
                key={idx}
                className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-medium ${
                  item.type === "negative"
                    ? "bg-rose-50 text-rose-800 border border-rose-200/60"
                    : "bg-emerald-50 text-emerald-800 border border-emerald-200/60"
                }`}
              >
                {item.factor} {item.points !== 0 && `(${item.points} Pkt.)`}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mt-6 flex flex-wrap items-center gap-2 border-b border-[hsl(var(--border))] pb-3">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${filter === "all" ? "bg-[#182d3b] text-white shadow-sm" : "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:bg-[hsl(var(--muted))]"}`}
        >
          Alle Deals ({counts.all})
        </button>
        {counts.market_alternative > 0 && (
          <button
            type="button"
            onClick={() => setFilter("market_alternative")}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${filter === "market_alternative" ? "bg-[#182d3b] text-white shadow-sm" : "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:bg-[hsl(var(--muted))]"}`}
          >
            Tarif-Wechsel ({counts.market_alternative})
          </button>
        )}
        {counts.overlap > 0 && (
          <button
            type="button"
            onClick={() => setFilter("overlap")}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${filter === "overlap" ? "bg-[#182d3b] text-white shadow-sm" : "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:bg-[hsl(var(--muted))]"}`}
          >
            Überlappungen ({counts.overlap})
          </button>
        )}
        {counts.zombie > 0 && (
          <button
            type="button"
            onClick={() => setFilter("zombie")}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${filter === "zombie" ? "bg-[#182d3b] text-white shadow-sm" : "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:bg-[hsl(var(--muted))]"}`}
          >
            Inaktive Abos ({counts.zombie})
          </button>
        )}
        {counts.billing_switch > 0 && (
          <button
            type="button"
            onClick={() => setFilter("billing_switch")}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${filter === "billing_switch" ? "bg-[#182d3b] text-white shadow-sm" : "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:bg-[hsl(var(--muted))]"}`}
          >
            Jahresrabatte ({counts.billing_switch})
          </button>
        )}
        {counts.refund_claim > 0 && (
          <button
            type="button"
            onClick={() => setFilter("refund_claim")}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${filter === "refund_claim" ? "bg-[#182d3b] text-white shadow-sm" : "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:bg-[hsl(var(--muted))]"}`}
          >
            Krankenkasse ({counts.refund_claim})
          </button>
        )}
      </div>

      {/* Deal Cards */}
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {filteredDeals.length > 0 ? (
          filteredDeals.map((d) => (
            <article
              key={d.id}
              className="flex flex-col justify-between overflow-hidden rounded-2xl border border-[hsl(var(--border))] p-6 transition-all hover:shadow-md"
              style={{ backgroundColor: d.color }}
            >
              <div>
                {/* Badge Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[hsl(var(--foreground))] shadow-xs">
                    {getTypeIcon(d.type)}
                    <span>{getTypeLabel(d.type)}</span>
                  </div>
                  <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-extrabold text-[hsl(var(--foreground))] shadow-xs">
                    {d.badge}
                  </span>
                </div>

                {/* Deal Title */}
                <h2 className="mt-3.5 font-display text-[21px] font-bold leading-snug text-[hsl(var(--foreground))]">
                  {d.title}
                </h2>

                {/* Explanation */}
                <p className="mt-1.5 text-xs leading-relaxed text-[hsl(var(--foreground)/.8)]">
                  {d.explanation}
                </p>

                {/* Dual-Brand Comparison Box */}
                <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2.5 rounded-xl border border-black/5 bg-white/75 p-3.5 shadow-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ProviderBrandIcon name={d.currentProvider || d.affectedSubName} size="sm" />
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))] truncate">Aktuell</div>
                      <div className="font-bold text-xs truncate text-[hsl(var(--foreground))]">{d.currentProvider || d.affectedSubName}</div>
                      <div className="font-mono text-xs font-semibold line-through text-neutral-500">{d.currentCostFormatted}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-center px-1 text-[#059669]">
                    <ChevronRight size={18} />
                  </div>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ProviderBrandIcon name={d.alternativeProvider || d.offerTitle || "Wingo"} size="sm" />
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#059669] truncate">
                        {d.type === "zombie" ? "Nach Kündigung" : d.type === "refund_claim" ? "Nach Rückvergütung" : "Alternative"}
                      </div>
                      <div className="font-bold text-xs truncate text-[#059669]">{d.alternativeProvider || d.offerTitle || "Spar-Tarif"}</div>
                      <div className="font-mono text-xs font-extrabold text-[#059669]">{d.newCostFormatted}</div>
                    </div>
                  </div>
                </div>

                {/* Highlights */}
                <ul className="mt-4 space-y-1.5 text-xs text-[hsl(var(--foreground)/.85)]">
                  {d.highlights.map((h, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check size={14} className="mt-0.5 shrink-0 text-[#059669]" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>

                {/* Evidence & Calculation Basis */}
                {d.evidence && d.evidence.length > 0 && (
                  <div className="mt-3.5 rounded-lg border border-black/5 bg-white/60 p-2.5 text-[11px] text-neutral-600">
                    <div className="flex items-center justify-between mb-1 font-semibold text-[10px] uppercase tracking-wider text-neutral-500">
                      <span>Berechnungsgrundlage ({d.confidenceLevel === "verified" ? "Verifiziert" : "Richtwert / Schätzung"})</span>
                      {d.source && <span className="truncate max-w-[150px]">{d.source}</span>}
                    </div>
                    <div className="space-y-0.5 font-mono text-[10px]">
                      {d.evidence.map((ev, eIdx) => (
                        <div key={eIdx}>• {ev}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Cost & Actions Section */}
              <div className="mt-6 border-t border-black/10 pt-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Deine Ersparnis</span>
                    <div className="font-display text-2xl font-black text-[#059669]">
                      {money(d.yearlySavings, currency)} <span className="text-xs font-semibold text-[hsl(var(--foreground))]">/ Jahr</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {d.subscriptionId && (
                      <Button
                        variant="soft"
                        onClick={() => {
                          const matchedSub = subs.find(s => s.id === d.subscriptionId);
                          if (matchedSub) onCancel(matchedSub);
                        }}
                        className="text-xs bg-white/85 hover:bg-white border border-black/10 shadow-xs"
                      >
                        <FileText size={13} /> Kündigung vorbereiten
                      </Button>
                    )}
                    {d.affiliateUrl && (
                      <a
                        href={d.affiliateUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-[10px] bg-[#182d3b] px-3.5 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90 shadow-xs"
                      >
                        Angebot prüfen <ExternalLink size={13} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))
        ) : deals.length > 0 ? (
          <div className="col-span-2 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-10 text-center">
            <Filter size={32} className="mx-auto text-[hsl(var(--muted-foreground))]" />
            <h3 className="mt-3 font-display text-lg font-semibold">Keine Deals in diesem Filter</h3>
            <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Wähle „Alle Deals“, um alle Einsparpotenziale zu sehen.</p>
            <Button variant="soft" onClick={() => setFilter("all")} className="mt-4 text-xs">
              Alle Deals anzeigen
            </Button>
          </div>
        ) : (
          <div className="col-span-2 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-10 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-[#059669]">
              <Sparkles size={28} />
            </div>
            <h3 className="mt-4 font-display text-2xl font-bold">
              {subs.filter(s => s.status === "active").length === 0
                ? "Erfasse deine Abos für dein individuelles Spar-Audit"
                : "🎉 Perfekt! Dein Abo-Portfolio ist optimal aufgestellt"}
            </h3>
            <p className="mx-auto mt-2 max-w-lg text-xs leading-6 text-[hsl(var(--muted-foreground))]">
              {subs.filter(s => s.status === "active").length === 0
                ? "Sobald du deine aktiven Verträge (z.B. Swisscom, Sunrise, Fitnesscenter, Netflix oder Bank) anlegst, fängt Subly teure Tarife, Zombie-Abos und Krankenkassen-Rückerstattungen automatisch ab."
                : "Es wurden aktuell keine überteuerten Schweizer Tarife, inaktiven Zombie-Abos oder doppelten Streaming-Dienste gefunden. Dein Health-Score liegt bei 100/100!"}
            </p>

            {subs.filter(s => s.status === "active").length === 0 && onNew && (
              <div className="mt-6 flex justify-center">
                <Button variant="dark" onClick={onNew} className="text-xs">
                  <Plus size={15} /> Erstes Abo hinzufügen
                </Button>
              </div>
            )}

            {/* Showcase examples */}
            <div className="mt-8 grid gap-3 text-left sm:grid-cols-3">
              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/.4)] p-3.5">
                <div className="text-xs font-bold text-[#182d3b]">Swisscom 5G Alternative</div>
                <div className="mt-1 text-[11px] text-[hsl(var(--muted-foreground))]">
                  Wingo nutzt 100% Swisscom-Netz für CHF 24.95/Mt statt CHF 79.90. Spart &gt; CHF 600.–/Jahr.
                </div>
              </div>
              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/.4)] p-3.5">
                <div className="text-xs font-bold text-[#182d3b]">Krankenkassen-Zuschuss</div>
                <div className="mt-1 text-[11px] text-[hsl(var(--muted-foreground))]">
                  CSS, Swica & Helsana erstatten bis zu CHF 800.–/Jahr für Qualitop-zertifizierte Fitnesscenter.
                </div>
              </div>
              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/.4)] p-3.5">
                <div className="text-xs font-bold text-[#182d3b]">Streaming-Rotation</div>
                <div className="mt-1 text-[11px] text-[hsl(var(--muted-foreground))]">
                  Erkennt doppelte Video-Dienste und empfiehlt monatliches Rotieren (spart ca. 40% der Kosten).
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Schweizer Markt-Katalog */}
      <div className="mt-12 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 md:p-8 shadow-xs">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#059669]">
              <Sparkles size={13} /> Schweizer Best-Price Katalog
            </div>
            <h3 className="mt-1 font-display text-xl font-bold">Top Schweizer Alternativen im Überblick</h3>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Unabhängig von deinen aktuellen Abos: Diese Schweizer Anbieter bieten herausragende Konditionen auf erstklassigen Schweizer Netzen.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SWISS_MARKET_CATALOG.map((item, idx) => (
            <div
              key={idx}
              className="flex flex-col justify-between rounded-2xl border border-[hsl(var(--border))] p-5 transition-all hover:border-black/20 hover:shadow-xs"
              style={{ backgroundColor: item.color }}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ProviderBrandIcon name={item.alternativeProvider} size="sm" />
                    <span className="font-bold text-xs">{item.alternativeProvider}</span>
                  </div>
                  <span className="rounded-full bg-white/85 px-2.5 py-0.5 text-[10px] font-extrabold text-[hsl(var(--foreground))]">
                    {item.badge}
                  </span>
                </div>

                <h4 className="mt-3.5 font-display text-base font-bold leading-tight">
                  {item.offerTitle}
                </h4>
                <p className="mt-1.5 text-xs leading-relaxed text-[hsl(var(--foreground)/.8)]">
                  {item.explanation}
                </p>

                <ul className="mt-3.5 space-y-1.5 text-xs text-[hsl(var(--foreground)/.85)]">
                  {item.highlights.slice(0, 2).map((h, hIdx) => (
                    <li key={hIdx} className="flex items-start gap-1.5">
                      <Check size={13} className="mt-0.5 shrink-0 text-[#059669]" />
                      <span className="truncate">{h}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-black/10 pt-3.5">
                <div>
                  <div className="text-[9px] uppercase font-bold text-[hsl(var(--muted-foreground))]">Preis</div>
                  <div className="font-mono text-sm font-extrabold text-[#059669]">
                    {item.newMonthlyCost === 0 ? "Kostenlos / Zuschuss" : `${money(item.newMonthlyCost, item.currency || currency)} / Mt`}
                  </div>
                </div>
                <a
                  href={item.affiliateUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#182d3b] px-3 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-90 shadow-xs"
                >
                  Angebot prüfen <ExternalLink size={12} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

function MorePage({
  user,
  settings,
  subs,
  setSubs,
  onUpdateSettings,
  onSignOut,
  toast,
  persistImport,
  persistClear
}: {
  user: UserProfile | null;
  settings: UserSettings | null;
  subs: Subscription[];
  setSubs: React.Dispatch<React.SetStateAction<Subscription[]>>;
  onUpdateSettings: (data: any) => Promise<void>;
  onSignOut: () => void;
  toast: (message: string) => void;
  persistImport: (items: Subscription[]) => Promise<Subscription[]>;
  persistClear: () => Promise<void>;
}) {
  const [name, setName] = useState(user?.name || "");
  const [currency, setCurrency] = useState(settings?.currency || "CHF");
  const [noticeDays, setNoticeDays] = useState(settings?.notice_days || 30);
  const [twoFactor, setTwoFactor] = useState(Boolean(settings?.two_factor_enabled ?? 1));
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.name) setName(user.name);
    if (settings?.currency) setCurrency(settings.currency);
    if (settings?.notice_days) setNoticeDays(settings.notice_days);
    if (settings?.two_factor_enabled !== undefined) setTwoFactor(Boolean(settings.two_factor_enabled));
  }, [user, settings]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onUpdateSettings({
        name,
        currency,
        notice_days: Number(noticeDays),
        two_factor_enabled: twoFactor ? 1 : 0,
      });
      toast("Einstellungen erfolgreich in der Cloud gespeichert!");
    } catch {
      toast("Fehler beim Speichern der Einstellungen");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    if (newPassword.length < 8) {
      setPwError("Das neue Passwort muss mindestens 8 Zeichen lang sein.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("Die Passwörter stimmen nicht überein.");
      return;
    }
    setPwSaving(true);
    try {
      await api<{ success: boolean }>("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      toast("Passwort erfolgreich aktualisiert!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      setPwError(err instanceof Error ? err.message : "Fehler beim Ändern des Passworts");
    } finally {
      setPwSaving(false);
    }
  };

  const exportJson = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), subscriptions: subs }, null, 2)], {
        type: "application/json"
      })
    );
    a.download = `subly-backup-${dateAt(0)}.json`;
    a.click();
    toast("Backup heruntergeladen");
  };

  const importJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (Array.isArray(parsed.subscriptions)) {
          const imported = await persistImport(parsed.subscriptions);
          setSubs(imported);
          toast(`${imported.length} Verträge in die Cloud importiert`);
        }
      } catch {
        toast("Backup konnte nicht importiert werden");
      }
    };
    reader.readAsText(file);
  };

  return (
    <main className="page-enter mx-auto max-w-[1050px] p-5 pb-24 md:p-9 md:pb-10">
      <div className="mb-7">
        <h1 className="font-display text-[34px] font-semibold tracking-[-.045em]">Einstellungen & Sicherheit</h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Verwalte deine Kontoeinstellungen und Präferenzen.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
        <section className="space-y-5">
          {/* Account Profile & Settings Form */}
          <form onSubmit={handleSaveSettings} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 md:p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.15em] text-[hsl(var(--muted-foreground))]">
                  <UserRound size={14} /> Benutzerkonto
                </div>
                <h2 className="mt-2 font-display text-2xl font-semibold">Profil & Voreinstellungen</h2>
              </div>
              <ShieldCheck className="text-[hsl(var(--chart-3))]" size={22} />
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-bold">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="mt-1.5 h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                />
              </div>

              <div>
                <label className="text-xs font-bold">E-Mail (Konto-ID)</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ""}
                  className="mt-1.5 h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 text-sm text-[hsl(var(--muted-foreground))] outline-none cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold">Währung</label>
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    className="mt-1.5 h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm outline-none"
                  >
                    <option value="CHF">CHF (Schweiz)</option>
                    <option value="EUR">EUR (Euro)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold">Standard-Kündigungsfrist (Tage)</label>
                  <input
                    type="number"
                    value={noticeDays}
                    onChange={e => setNoticeDays(Number(e.target.value))}
                    className="mt-1.5 h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] p-3.5">
                  <div>
                    <div className="text-sm font-bold">Doppelte E-Mail-Verifizierung (2FA)</div>
                    <div className="text-xs text-[hsl(var(--muted-foreground))]">Bei jedem Login 6-stelligen Sicherheitscode verlangen</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={twoFactor}
                    onChange={e => setTwoFactor(e.target.checked)}
                    className="h-5 w-5 rounded accent-[hsl(var(--primary))]"
                  />
                </label>
              </div>

              <div className="pt-2">
                <Button type="submit" variant="dark" disabled={saving} className="w-full">
                  <Check size={16} /> {saving ? "Wird gespeichert…" : "Einstellungen speichern"}
                </Button>
              </div>
            </div>
          </form>

          {/* Password change form */}
          <form onSubmit={handleChangePassword} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 md:p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.15em] text-[hsl(var(--muted-foreground))]">
                  <LockKeyhole size={14} /> Sicherheit
                </div>
                <h2 className="mt-2 font-display text-2xl font-semibold">Passwort ändern</h2>
              </div>
            </div>
            {pwError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                {pwError}
              </div>
            )}
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold">Aktuelles Passwort</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                  className="mt-1.5 h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                />
              </div>
              <div>
                <label className="text-xs font-bold">Neues Passwort (mind. 8 Zeichen)</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  className="mt-1.5 h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                />
              </div>
              <div>
                <label className="text-xs font-bold">Neues Passwort wiederholen</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  className="mt-1.5 h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                />
              </div>
              <div className="pt-2">
                <Button type="submit" variant="dark" disabled={pwSaving} className="w-full">
                  <LockKeyhole size={16} /> {pwSaving ? "Wird geändert…" : "Passwort jetzt ändern"}
                </Button>
              </div>
            </div>
          </form>
        </section>

        <section className="space-y-5">
          {/* Data Portability */}
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 md:p-6">
            <div className="text-[11px] font-bold uppercase tracking-[.15em] text-[hsl(var(--muted-foreground))]">Datenverwaltung</div>
            <h2 className="mt-2 font-display text-2xl font-semibold">Export & Backup</h2>
            <p className="mt-2 text-xs leading-5 text-[hsl(var(--muted-foreground))]">Lade eine Sicherungskopie deiner Verträge herunter oder importiere vorhandene Daten.</p>
            <div className="mt-5 grid gap-2">
              <Button variant="dark" onClick={exportJson}><Download size={16} /> JSON-Backup herunterladen</Button>
              <input ref={fileRef} type="file" accept=".json,application/json" onChange={importJson} className="hidden" />
              <Button variant="soft" onClick={() => fileRef.current?.click()}><Upload size={16} /> JSON importieren</Button>
            </div>
          </div>

          {/* Delete All & Sign out */}
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 md:p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[.15em] text-[hsl(var(--destructive))]">Konto & Sitzung</div>
                <h2 className="mt-1 font-display text-xl font-semibold">Abmelden oder Bereinigen</h2>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="ghost" onClick={onSignOut} className="flex-1">
                Abmelden
              </Button>
              <Button
                variant="danger"
                onClick={async () => {
                  if (window.confirm("Wirklich alle gespeicherten Abonnemente löschen?")) {
                    await persistClear();
                    setSubs([]);
                    toast("Alle Daten gelöscht");
                  }
                }}
              >
                <Trash2 size={15} /> Verträge leeren
              </Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function SubscriptionModal({ initial, onClose, onSave, currency = "CHF" }: { initial?: Subscription; onClose: () => void; onSave: (s: Subscription) => void; currency?: string }) {
  const [form, setForm] = useState<Subscription>(
    initial || {
      id: 0,
      provider: "",
      plan: "",
      category: "Entertainment",
      amount: 0,
      billingCycle: "monthly",
      nextRenewal: dateAt(30),
      noticeDays: 30,
      lastUsed: dateAt(0),
      status: "active",
      contractNumber: "",
      color: "#ed6a5a",
      logoText: "S",
      cancellationAddress: "",
      hotline: ""
    }
  );
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = origOverflow;
    };
  }, [onClose]);

  const update = (key: keyof Subscription, value: string | number) => {
    setForm(old => ({ ...old, [key]: value }));
    setFormError(null);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!form.provider.trim()) {
      setFormError("Bitte gib einen Anbieternamen an.");
      return;
    }
    const numAmt = Number(form.amount);
    if (isNaN(numAmt) || numAmt <= 0) {
      setFormError("Der Betrag muss grösser als 0 sein.");
      return;
    }
    if (numAmt > 1000000) {
      setFormError("Der Betrag darf maximal 1'000'000 sein.");
      return;
    }
    const nDays = Number(form.noticeDays);
    if (isNaN(nDays) || nDays < 0 || nDays > 365) {
      setFormError("Die Kündigungsfrist muss zwischen 0 und 365 Tagen liegen.");
      return;
    }
    if (!isValidDateStr(form.nextRenewal)) {
      setFormError("Bitte gib ein gültiges Erneuerungsdatum an (JJJJ-MM-TT).");
      return;
    }

    onSave({
      ...form,
      amount: roundCents(numAmt),
      noticeDays: Math.round(nDays),
      logoText: form.logoText || form.provider.trim().slice(0, 2).toUpperCase()
    });
  };

  const liveDeadline = isValidDateStr(form.nextRenewal)
    ? calculateNoticeDeadline(form.nextRenewal, Number(form.noticeDays) || 0)
    : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sub-modal-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-[hsl(var(--primary)/.45)] p-0 backdrop-blur-sm sm:items-center sm:p-5"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form onSubmit={submit} className="max-h-[92dvh] w-full max-w-[590px] overflow-y-auto rounded-t-[24px] bg-[hsl(var(--card))] p-5 shadow-2xl sm:rounded-[24px] sm:p-7">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[.15em] text-[hsl(var(--muted-foreground))]">{initial ? "Abo bearbeiten" : "Neues Abo erfassen"}</div>
            <h2 id="sub-modal-title" className="mt-1 font-display text-2xl font-semibold">{initial ? "Details anpassen." : "Vertragsdaten eintragen."}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Modal schliessen"><X size={19} /></button>
        </div>

        {formError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
            {formError}
          </div>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-xs font-bold flex items-center justify-between">
              <span>Anbieter</span>
              {form.provider && (
                <span className="flex items-center gap-1.5 text-[11px] font-normal text-[hsl(var(--muted-foreground))]">
                  Logo-Vorschau: <ProviderBrandIcon name={form.provider} color={form.color} logoText={form.logoText} size="sm" />
                </span>
              )}
            </label>
            <div className="relative mt-1.5 flex items-center">
              <div className="absolute left-2.5">
                <ProviderBrandIcon name={form.provider} color={form.color} logoText={form.logoText} size="sm" />
              </div>
              <input
                autoFocus
                required
                value={form.provider}
                onChange={e => update("provider", e.target.value)}
                placeholder="z.B. Swisscom, Netflix, Sunrise, Spotify, Salt…"
                className="h-11 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] pl-11 pr-3 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
              />
            </div>

            {/* Quick provider presets */}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-[hsl(var(--muted-foreground))] mr-1">Beliebt:</span>
              {[
                { name: "Swisscom", cat: "Telecom" },
                { name: "Sunrise", cat: "Telecom" },
                { name: "Salt", cat: "Telecom" },
                { name: "Netflix", cat: "Entertainment" },
                { name: "Spotify", cat: "Entertainment" },
                { name: "Disney+", cat: "Entertainment" },
                { name: "YouTube", cat: "Entertainment" },
                { name: "PureGym", cat: "Fitness" },
                { name: "Activ Fitness", cat: "Fitness" },
                { name: "Apple", cat: "Entertainment" },
              ].map(preset => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => {
                    setForm(old => ({
                      ...old,
                      provider: preset.name,
                      category: preset.cat,
                      logoText: preset.name.slice(0, 2).toUpperCase()
                    }));
                  }}
                  className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition hover:bg-black/5 dark:hover:bg-white/10 ${
                    form.provider.toLowerCase() === preset.name.toLowerCase()
                      ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                      : "bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))]"
                  }`}
                >
                  <ProviderBrandIcon name={preset.name} size="sm" className="!h-4 !w-4 !rounded" />
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>
          <label className="text-xs font-bold">
            Tarif / Plan
            <input value={form.plan} onChange={e => update("plan", e.target.value)} placeholder="z.B. blue Mobile M" className="mt-1.5 h-11 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]" />
          </label>
          <label className="text-xs font-bold">
            Kategorie
            <select value={form.category} onChange={e => update("category", e.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm outline-none">
              {["Telecom", "Internet", "Entertainment", "Fitness", "Mobility", "Finance", "Home", "Other"].map(x => <option key={x}>{x}</option>)}
            </select>
          </label>
          <label className="text-xs font-bold">
            Betrag ({currency})
            <input type="number" step=".05" min="0.05" max="1000000" required value={form.amount || ""} onChange={e => update("amount", Number(e.target.value))} placeholder="0.00" className="mt-1.5 h-11 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm outline-none" />
          </label>
          <label className="text-xs font-bold">
            Zahlungsintervall
            <select value={form.billingCycle} onChange={e => update("billingCycle", e.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm outline-none">
              {Object.keys(cycleFactor).map(x => <option key={x} value={x}>{cycleNameDe[x as BillingCycle] || x}</option>)}
            </select>
          </label>
          <label className="text-xs font-bold">
            Nächste Erneuerung
            <input type="date" required value={form.nextRenewal} onChange={e => update("nextRenewal", e.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm outline-none" />
          </label>
          <label className="text-xs font-bold">
            Kündigungsfrist (Tage)
            <input type="number" min="0" max="365" value={form.noticeDays} onChange={e => update("noticeDays", Number(e.target.value))} className="mt-1.5 h-11 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm outline-none" />
          </label>
        </div>

        {/* Live Deadline preview banner */}
        {liveDeadline && (
          <div className="mt-5 rounded-xl border border-blue-200/80 bg-blue-50/70 p-3.5 text-xs text-blue-950">
            <div className="flex items-center justify-between font-semibold">
              <span>Kündigung spätestens bis:</span>
              <span className="font-mono font-bold text-blue-800">{formatDate(liveDeadline)}</span>
            </div>
            <div className="mt-1 text-[10px] text-blue-700 leading-normal">
              * Berechneter Richtwert: Bei einer Kündigungsfrist von {form.noticeDays || 0} Tagen vor dem Erneuerungsdatum ({formatDate(form.nextRenewal)}).
            </div>
          </div>
        )}

        <div className="mt-7 flex justify-end gap-2 border-t border-[hsl(var(--border))] pt-5">
          <Button type="button" variant="ghost" onClick={onClose}>Abbrechen</Button>
          <Button type="submit" variant="dark"><Check size={16} /> Abo speichern</Button>
        </div>
      </form>
    </div>
  );
}

const PRESET_BILLS: Array<{
  name: string;
  iconName: string;
  filename: string;
  data: Partial<Subscription>;
}> = [
  {
    name: "Swisscom Mobilfunk",
    iconName: "Swisscom",
    filename: "Swisscom_Rechnung_Mobile.pdf",
    data: {
      provider: "Swisscom",
      plan: "blue Mobile M (5G Flat CH)",
      category: "Telecom",
      amount: 69.90,
      billingCycle: "monthly",
      noticeDays: 60,
      contractNumber: "SW-84920-ZH",
      cancellationAddress: "swisscom.ch/cancel",
      hotline: "0800 800 800",
    },
  },
  {
    name: "Sunrise Internet & TV",
    iconName: "Sunrise",
    filename: "Sunrise_Rechnung_Home.pdf",
    data: {
      provider: "Sunrise",
      plan: "Up Internet L + TV",
      category: "Internet",
      amount: 89.00,
      billingCycle: "monthly",
      noticeDays: 60,
      contractNumber: "SR-92041-BS",
      cancellationAddress: "sunrise.ch/kuendigung",
      hotline: "0800 707 707",
    },
  },
  {
    name: "Salt Home Glasfaser",
    iconName: "Salt",
    filename: "Salt_Home_Rechnung_Mai.pdf",
    data: {
      provider: "Salt",
      plan: "Salt Home 10 Gbit/s + Apple TV",
      category: "Internet",
      amount: 49.95,
      billingCycle: "monthly",
      noticeDays: 60,
      contractNumber: "SLT-39201",
      cancellationAddress: "salt.ch/cancel",
      hotline: "0800 700 700",
    },
  },
  {
    name: "Netflix Premium",
    iconName: "Netflix",
    filename: "Netflix_Invoice_CH.pdf",
    data: {
      provider: "Netflix",
      plan: "Premium 4K HDR",
      category: "Entertainment",
      amount: 20.90,
      billingCycle: "monthly",
      noticeDays: 0,
      contractNumber: "NF-992019",
      cancellationAddress: "netflix.com/cancelplan",
    },
  },
  {
    name: "PureGym Schweizer Fitness",
    iconName: "PureGym",
    filename: "PureGym_Mitgliedschaft_2024.pdf",
    data: {
      provider: "PureGym",
      plan: "Fit & Well National",
      category: "Fitness",
      amount: 39.90,
      billingCycle: "monthly",
      noticeDays: 90,
      contractNumber: "PG-ZH-4921",
      cancellationAddress: "puregym.swiss/membership",
    },
  },
  {
    name: "SBB Halbtax PLUS",
    iconName: "SBB",
    filename: "SBB_Halbtax_Rechnung.pdf",
    data: {
      provider: "SBB",
      plan: "Halbtax PLUS 1000",
      category: "Mobility",
      amount: 190.00,
      billingCycle: "yearly",
      noticeDays: 30,
      contractNumber: "SBB-HT-99410",
      cancellationAddress: "sbb.ch/swisspass",
      hotline: "0848 44 66 88",
    },
  },
];

function extractSubscriptionFromInvoice(fileName: string): Subscription {
  const norm = fileName.toLowerCase();

  // Match preset bills
  for (const preset of PRESET_BILLS) {
    if (norm.includes(preset.data.provider?.toLowerCase() || "")) {
      return {
        id: 0,
        provider: preset.data.provider || "Swisscom",
        plan: preset.data.plan || "Standard",
        category: preset.data.category || "Telecom",
        amount: preset.data.amount || 49.90,
        billingCycle: preset.data.billingCycle || "monthly",
        nextRenewal: dateAt(45),
        noticeDays: preset.data.noticeDays ?? 30,
        lastUsed: dateAt(0),
        status: "active",
        contractNumber: preset.data.contractNumber || `CH-${Math.floor(10000 + Math.random() * 90000)}`,
        logoText: (preset.data.provider || "SC").slice(0, 2).toUpperCase(),
        color: "#182d3b",
        cancellationAddress: preset.data.cancellationAddress || "",
        hotline: preset.data.hotline || "",
      };
    }
  }

  // Common keywords heuristic
  let provider = "Rechnung";
  let plan = "Monats-Abonnement";
  let category = "Sonstiges";
  let amount = 39.90;
  let billingCycle: BillingCycle = "monthly";
  let noticeDays = 30;

  if (norm.includes("wingo")) {
    provider = "Wingo";
    plan = "Wingo Swiss Pro";
    category = "Telecom";
    amount = 24.95;
    noticeDays = 30;
  } else if (norm.includes("galaxus")) {
    provider = "Galaxus Mobile";
    plan = "CH Unlimitiert";
    category = "Telecom";
    amount = 19.00;
    noticeDays = 0;
  } else if (norm.includes("swype")) {
    provider = "swype";
    plan = "swype Swiss Flat";
    category = "Telecom";
    amount = 15.00;
    noticeDays = 0;
  } else if (norm.includes("spotify")) {
    provider = "Spotify";
    plan = "Premium Individual";
    category = "Entertainment";
    amount = 13.95;
    noticeDays = 0;
  } else if (norm.includes("disney")) {
    provider = "Disney+";
    plan = "Standard";
    category = "Entertainment";
    amount = 17.90;
    noticeDays = 0;
  } else if (norm.includes("neon")) {
    provider = "neon";
    plan = "neon metal";
    category = "Finance";
    amount = 15.00;
    noticeDays = 30;
  } else if (norm.includes("apple")) {
    provider = "Apple";
    plan = "Apple One";
    category = "Software";
    amount = 20.90;
    noticeDays = 0;
  } else if (norm.includes("adobe")) {
    provider = "Adobe";
    plan = "Creative Cloud";
    category = "Software";
    amount = 35.50;
    noticeDays = 30;
  } else {
    // Clean up filename to extract provider
    const cleaned = fileName
      .replace(/\.(pdf|png|jpe?g|webp|heic)$/i, "")
      .replace(/[-_]/g, " ")
      .replace(/\b(rechnung|invoice|contract|vertrag|bill|scan|document)\b/gi, "")
      .trim();
    if (cleaned.length > 2) {
      provider = cleaned.slice(0, 25);
    }
  }

  // Extract amount if present in filename (e.g. 69.90, 79.00, etc.)
  const matchAmount = fileName.match(/(\d{1,3}(?:[.,]\d{2}))/);
  if (matchAmount) {
    const val = parseFloat(matchAmount[1].replace(",", "."));
    if (val > 0 && val < 5000) amount = val;
  }

  return {
    id: 0,
    provider,
    plan,
    category,
    amount,
    billingCycle,
    nextRenewal: dateAt(45),
    noticeDays,
    lastUsed: dateAt(0),
    status: "active",
    contractNumber: `CH-${Math.floor(10000 + Math.random() * 90000)}`,
    logoText: provider.slice(0, 2).toUpperCase(),
    color: "#182d3b",
    cancellationAddress: "",
    hotline: "",
  };
}

function ScanModal({ onClose, onAdd, toast, currency = "CHF" }: { onClose: () => void; onAdd: (s: Subscription) => void; toast?: (message: string) => void; currency?: string }) {
  const [scanState, setScanState] = useState<"idle" | "scanning" | "reviewed">("idle");
  const [activeFile, setActiveFile] = useState<{ name: string; size?: string; previewUrl?: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [extractionEvidence, setExtractionEvidence] = useState<{ field: string; value: string | number; rawSnippet: string }[]>([]);
  const [extractionConfidence, setExtractionConfidence] = useState<"verified" | "estimated" | "manual_review_required">("verified");
  const [extractionSummary, setExtractionSummary] = useState<string>("");

  const [formData, setFormData] = useState<Subscription>(() => extractSubscriptionFromInvoice("Swisscom_blueMobile.pdf"));

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const processExtractionResult = (
    fileInfo: { name: string; size?: string; previewUrl?: string },
    result: {
      provider: string;
      plan: string;
      amount: number | null;
      currency?: string;
      category: string;
      billingCycle?: BillingCycle;
      contractNumber?: string;
      renewalDate?: string;
      noticeDays?: number;
      hotline?: string;
      cancellationAddress?: string;
      summary?: string;
      evidence?: { field: string; value: string | number; rawSnippet: string }[];
      extractionConfidence?: "verified" | "estimated" | "manual_review_required";
    }
  ) => {
    setActiveFile(fileInfo);
    setExtractionEvidence(result.evidence || []);
    setExtractionConfidence(result.extractionConfidence || "estimated");
    setExtractionSummary(result.summary || "");

    setFormData({
      id: 0,
      provider: result.provider || "Unbekannter Anbieter",
      plan: result.plan || "Standard",
      category: result.category || "Sonstiges",
      amount: result.amount !== null && result.amount !== undefined ? result.amount : 0,
      billingCycle: result.billingCycle || "monthly",
      nextRenewal: result.renewalDate || dateAt(45),
      noticeDays: result.noticeDays || 30,
      lastUsed: dateAt(0),
      status: "active",
      contractNumber: result.contractNumber || "",
      logoText: (result.provider || "AB").slice(0, 2).toUpperCase(),
      color: "#182d3b",
      cancellationAddress: result.cancellationAddress || "",
      hotline: result.hotline || "",
    });

    setScanState("reviewed");
  };

  const handleFile = async (file: File) => {
    let previewUrl: string | undefined;
    if (file.type.startsWith("image/")) {
      previewUrl = URL.createObjectURL(file);
    }
    const sizeStr = `${(file.size / 1024).toFixed(0)} KB`;
    const fileInfo = { name: file.name, size: sizeStr, previewUrl };

    setActiveFile(fileInfo);
    setScanState("scanning");

    if (file.size > 30 * 1024 * 1024) {
      toast?.("Datei ist zu gross (maximal 30 MB)");
      setScanState("idle");
      return;
    }

    try {
      // Read file buffer safely and efficiently via native FileReader
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const res = (reader.result as string) || "";
          const base64Content = res.includes(",") ? res.split(",")[1] : res;
          resolve(base64Content);
        };
        reader.onerror = () => reject(new Error("Fehler beim Lesen der Datei"));
        reader.readAsDataURL(file);
      });

      const resp = await api<{ success: boolean; result: any }>("/api/scan", {
        method: "POST",
        body: JSON.stringify({
          filename: file.name,
          contentBase64: base64,
        }),
      });

      if (resp?.result) {
        processExtractionResult(fileInfo, resp.result);
      } else {
        throw new Error("Keine Daten zurückerhalten");
      }
    } catch (err) {
      // Clean fallback: Extract heuristic from filename
      const fallback = extractSubscriptionFromInvoice(file.name);
      processExtractionResult(fileInfo, {
        provider: fallback.provider,
        plan: fallback.plan,
        amount: fallback.amount,
        category: fallback.category,
        contractNumber: fallback.contractNumber,
        evidence: [{ field: "provider", value: fallback.provider, rawSnippet: `Dateiname: ${file.name}` }],
        extractionConfidence: "manual_review_required",
      });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
        e.preventDefault();
        handleFile(e.clipboardData.files[0]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("paste", handlePaste);
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("paste", handlePaste);
      document.body.style.overflow = origOverflow;
    };
  }, [onClose]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSelectPreset = async (preset: typeof PRESET_BILLS[0]) => {
    const fileInfo = { name: preset.filename, size: "142 KB" };
    setActiveFile(fileInfo);
    setScanState("scanning");

    try {
      const resp = await api<{ success: boolean; result: any }>("/api/scan", {
        method: "POST",
        body: JSON.stringify({
          filename: preset.filename,
          text: `${preset.data.provider} ${preset.data.plan} Rechnung CHF ${preset.data.amount} Vertragsnummer ${preset.data.contractNumber || "CH-1002"}`,
        }),
      });
      if (resp?.result) {
        processExtractionResult(fileInfo, resp.result);
      } else {
        throw new Error("Fehler beim Scan");
      }
    } catch {
      const parsed = extractSubscriptionFromInvoice(preset.filename);
      processExtractionResult(fileInfo, {
        provider: parsed.provider,
        plan: parsed.plan,
        amount: parsed.amount,
        category: parsed.category,
        contractNumber: parsed.contractNumber,
        evidence: [{ field: "provider", value: parsed.provider, rawSnippet: `Muster-Rechnung: ${preset.name}` }],
        extractionConfidence: "verified",
      });
    }
  };

  const updateField = <K extends keyof Subscription>(key: K, value: Subscription[K]) => {
    setFormData(prev => ({
      ...prev,
      [key]: value,
      logoText: key === "provider" ? String(value).slice(0, 2).toUpperCase() : prev.logoText
    }));
  };

  const monthlyEquivalent = useMemo(() => {
    const amt = Number(formData.amount) || 0;
    if (formData.billingCycle === "yearly") return amt / 12;
    if (formData.billingCycle === "half-yearly") return amt / 6;
    if (formData.billingCycle === "quarterly") return amt / 4;
    return amt;
  }, [formData.amount, formData.billingCycle]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="scan-modal-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-[hsl(var(--primary)/.5)] p-0 backdrop-blur-sm sm:items-center sm:p-5"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[92dvh] w-full max-w-[640px] overflow-y-auto rounded-t-[24px] bg-[hsl(var(--card))] p-5 shadow-2xl sm:rounded-[24px] sm:p-7">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.15em] text-[#059669]">
              <Receipt size={14} /> KI-Vertragsscanner
            </div>
            <h2 id="scan-modal-title" className="mt-1 font-display text-2xl font-bold">
              {scanState === "idle" && "Rechnung oder Vertrag scannen"}
              {scanState === "scanning" && "Dokument wird analysiert..."}
              {scanState === "reviewed" && "Vertragsdaten prüfen & speichern"}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close scan dialog"
            className="grid h-8 w-8 place-items-center rounded-xl bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Hidden inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={e => {
            if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
          }}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={e => {
            if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
          }}
        />

        {/* State 1: IDLE / UPLOAD */}
        {scanState === "idle" && (
          <div className="mt-5 space-y-4">
            {/* Drag and Drop Zone */}
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
                isDragging
                  ? "border-[#059669] bg-emerald-500/10 scale-[1.01]"
                  : "border-[hsl(var(--border))] bg-[hsl(var(--secondary))] hover:border-[#059669]/60 hover:bg-[hsl(var(--secondary)/.8)]"
              }`}
            >
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[hsl(var(--card))] text-[#059669] shadow-sm">
                <Upload size={24} />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold">
                PDF oder Foto ablegen
              </h3>
              <p className="mx-auto mt-1 max-w-[340px] text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">
                Klicke zum Durchsuchen oder ziehe deine Monatsrechnung hierher. Anbieter, Tarif, Betrag und Kündigungsfrist werden automatisch erkannt.
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5" onClick={e => e.stopPropagation()}>
                <Button
                  type="button"
                  variant="dark"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs"
                >
                  <Upload size={14} /> Datei auswählen (PDF/Bild)
                </Button>
                <Button
                  type="button"
                  variant="soft"
                  onClick={() => cameraInputRef.current?.click()}
                  className="text-xs border border-[hsl(var(--border))]"
                >
                  <Camera size={14} /> Foto aufnehmen
                </Button>
              </div>
            </div>

            {/* Presets */}
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/.4)] p-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                  Oder Schweizer Vorlage testen:
                </span>
                <span className="text-[10px] text-[hsl(var(--muted-foreground))]">1-Klick Vorschau</span>
              </div>
              <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {PRESET_BILLS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className="flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2.5 text-left transition-all hover:border-[#059669] hover:bg-emerald-50/40"
                  >
                    <ProviderBrandIcon name={preset.iconName} size="sm" />
                    <div className="min-w-0">
                      <div className="truncate text-xs font-bold">{preset.name}</div>
                      <div className="font-mono text-[10px] text-[hsl(var(--muted-foreground))]">
                        {money(preset.data.amount || 0, currency)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-[hsl(var(--muted-foreground))]">
              <Cloud size={14} className="text-[#059669]" />
              <span>Privat & sicher: Alle Daten werden erst nach deiner Prüfung in deinem Cockpit gespeichert.</span>
            </div>
          </div>
        )}

        {/* State 2: SCANNING ANIMATION */}
        {scanState === "scanning" && (
          <div className="mt-6 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] p-8 text-center">
            {/* Animated preview */}
            <div className="relative mx-auto flex h-32 w-32 items-center justify-center overflow-hidden rounded-2xl border-2 border-[#059669]/40 bg-[hsl(var(--card))] shadow-md">
              {activeFile?.previewUrl ? (
                <img src={activeFile.previewUrl} alt="Dokumentenvorschau" className="h-full w-full object-cover opacity-60" />
              ) : (
                <Receipt size={48} className="text-[#059669] opacity-70" />
              )}
              {/* Radar scan line */}
              <div className="absolute inset-x-0 h-1 bg-[#059669] shadow-[0_0_12px_#059669] animate-bounce" />
            </div>

            <h3 className="mt-5 font-display text-lg font-bold">
              {activeFile?.name || "Dokument"} wird analysiert
            </h3>
            {activeFile?.size && (
              <div className="text-xs text-[hsl(var(--muted-foreground))]">{activeFile.size} · PDF Stream & Schweizer Rechnungs-Heuristik</div>
            )}

            {/* Checklist */}
            <div className="mx-auto mt-6 max-w-[340px] space-y-2.5 text-left text-xs">
              <div className="flex items-center gap-2.5 text-emerald-700">
                <CheckCircle2 size={16} className="shrink-0 text-[#059669]" />
                <span>Dokument wird eingelesen & vorbereitet</span>
              </div>
              <div className="flex items-center gap-2.5 text-emerald-700">
                <Loader2 size={16} className="shrink-0 animate-spin text-[#059669]" />
                <span>Multimodale KI-Vision & Schweizer QR-Bill-Erkennung aktiv</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-500">
                <Sparkles size={16} className="shrink-0 text-amber-500" />
                <span>Tarife, Betrag, Fristen & Kündigungsadresse werden extrahiert</span>
              </div>
            </div>
          </div>
        )}

        {/* State 3: REVIEW & EDIT */}
        {scanState === "reviewed" && (
          <div className="mt-5 space-y-5">
            {/* Summary Banner if provided */}
            {extractionSummary && (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/25 px-3.5 py-2.5 text-xs text-emerald-950 font-medium flex items-start gap-2.5 shadow-2xs">
                <Sparkles size={16} className="text-[#059669] shrink-0 mt-0.5" />
                <span className="leading-relaxed">{extractionSummary}</span>
              </div>
            )}

            {/* Top Status Banner */}
            <div className={`flex flex-col gap-2 rounded-xl p-3.5 text-xs border ${
              extractionConfidence === "verified"
                ? "bg-emerald-50 text-emerald-900 border-emerald-200/70"
                : extractionConfidence === "estimated"
                ? "bg-amber-50 text-amber-900 border-amber-200/70"
                : "bg-slate-50 text-slate-900 border-slate-200"
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold">
                  {extractionConfidence === "verified" ? (
                    <>
                      <CheckCircle2 size={16} className="text-[#059669]" />
                      <span>KI-Rechnungsdaten erkannt (Verifiziert)</span>
                    </>
                  ) : extractionConfidence === "estimated" ? (
                    <>
                      <Sparkles size={16} className="text-amber-600" />
                      <span>Teilweise erkannt (Geschätzt · Bitte prüfen)</span>
                    </>
                  ) : (
                    <>
                      <FileText size={16} className="text-slate-600" />
                      <span>Manuelle Überprüfung empfohlen</span>
                    </>
                  )}
                </div>
                <span className="text-[11px] opacity-75 truncate max-w-[180px]">{activeFile?.name || "Rechnung.pdf"}</span>
              </div>

              {extractionEvidence.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1.5 pt-1 border-t border-black/5">
                  {extractionEvidence.map((ev, idx) => (
                    <span key={idx} className="inline-flex items-center rounded-md bg-white/80 px-2 py-0.5 text-[10px] font-mono font-medium shadow-2xs">
                      <span className="text-neutral-500 mr-1">{ev.field}:</span> {String(ev.value)}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Editable Form */}
            <div className="space-y-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 sm:p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                {/* Provider with live logo */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                    Anbieter / Dienst
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <ProviderBrandIcon name={formData.provider} size="sm" />
                    <input
                      type="text"
                      value={formData.provider}
                      onChange={e => updateField("provider", e.target.value)}
                      placeholder="z.B. Swisscom"
                      className="h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm font-semibold outline-none focus:border-[#059669]"
                    />
                  </div>
                </div>

                {/* Plan */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                    Tarif / Bezeichnung
                  </label>
                  <input
                    type="text"
                    value={formData.plan}
                    onChange={e => updateField("plan", e.target.value)}
                    placeholder="z.B. blue Mobile M"
                    className="mt-1 h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm outline-none focus:border-[#059669]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {/* Amount */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                    Betrag (CHF)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={formData.amount}
                    onChange={e => updateField("amount", parseFloat(e.target.value) || 0)}
                    className="mt-1 h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 font-mono text-sm font-bold outline-none focus:border-[#059669]"
                  />
                </div>

                {/* Billing Cycle */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                    Zahlungsintervall
                  </label>
                  <select
                    value={formData.billingCycle}
                    onChange={e => updateField("billingCycle", e.target.value as BillingCycle)}
                    className="mt-1 h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2.5 text-xs font-semibold outline-none focus:border-[#059669]"
                  >
                    <option value="monthly">Monatlich</option>
                    <option value="yearly">Jährlich</option>
                    <option value="half-yearly">Halbjährlich</option>
                    <option value="quarterly">Quartalsweise</option>
                  </select>
                </div>

                {/* Category */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                    Kategorie
                  </label>
                  <select
                    value={formData.category}
                    onChange={e => updateField("category", e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2.5 text-xs font-semibold outline-none focus:border-[#059669]"
                  >
                    <option value="Telecom">Telecom & Mobilfunk</option>
                    <option value="Internet">Internet & TV</option>
                    <option value="Entertainment">Streaming & Audio</option>
                    <option value="Fitness">Fitness & Gesundheit</option>
                    <option value="Software">Software & Cloud</option>
                    <option value="Mobility">Mobilität & ÖV</option>
                    <option value="Finance">Finanzen & Bank</option>
                    <option value="Insurance">Versicherung</option>
                    <option value="Sonstiges">Sonstiges</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {/* Next Renewal */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                    Nächste Verlängerung
                  </label>
                  <input
                    type="date"
                    value={formData.nextRenewal}
                    onChange={e => updateField("nextRenewal", e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 text-xs outline-none focus:border-[#059669]"
                  />
                </div>

                {/* Notice days */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                    Kündigungsfrist (Tage)
                  </label>
                  <input
                    type="number"
                    value={formData.noticeDays}
                    onChange={e => updateField("noticeDays", parseInt(e.target.value) || 0)}
                    className="mt-1 h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-xs outline-none focus:border-[#059669]"
                  />
                </div>

                {/* Contract Number */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                    Vertrags- / Ref-Nr.
                  </label>
                  <input
                    type="text"
                    value={formData.contractNumber}
                    onChange={e => updateField("contractNumber", e.target.value)}
                    placeholder="z.B. SW-84920"
                    className="mt-1 h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-xs outline-none focus:border-[#059669]"
                  />
                </div>
              </div>

              {/* Effective Cost Preview */}
              <div className="flex items-center justify-between rounded-xl bg-[hsl(var(--secondary))] px-3.5 py-2 text-xs">
                <span className="text-[hsl(var(--muted-foreground))]">Berechnete Abo-Kosten:</span>
                <span className="font-mono font-bold text-[#059669]">
                  {money(monthlyEquivalent, currency)} / Mt · {money(monthlyEquivalent * 12, currency)} / Jahr
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={() => setScanState("idle")}
                className="text-xs"
              >
                Anderes Dokument scannen
              </Button>
              <Button
                variant="dark"
                onClick={() => onAdd(formData)}
                className="text-xs"
              >
                <Check size={16} /> In Abonnemente übernehmen
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CancelModal({ sub, onClose, toast, user, currency = "CHF" }: { sub: Subscription; onClose: () => void; toast: (message: string) => void; user: UserProfile | null; currency?: string }) {
  const [reason, setReason] = useState("Günstigeres Angebot gefunden");
  const [include, setInclude] = useState(true);
  const [senderName, setSenderName] = useState(user?.name || "");
  const displayName = senderName.trim() || user?.name || "[Dein Name]";
  const letter = `Betrifft: Ordentliche Kündigung von ${sub.plan || sub.provider} — Vertragsnummer ${sub.contractNumber || "[Vertragsnummer]"}\n\nSehr geehrtes ${sub.provider}-Team,\n\nhiermit kündige ich meinen Vertrag über ${sub.plan || sub.provider} fristgerecht zum nächstmöglichen Termin.\n\nKündigungsgrund: ${reason}.${include ? "\nBitte senden Sie mir eine schriftliche Bestätigung des Kündigungstermins und stellen Sie danach keine weiteren Rechnungen aus." : ""}\n\nVertragsnummer: ${sub.contractNumber || "[Vertragsnummer ergänzen]"}\n\nFreundliche Grüsse,\n${displayName}`;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = origOverflow;
    };
  }, [onClose]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(letter);
      toast("Kündigungsschreiben in die Zwischenablage kopiert");
    } catch {
      toast("Text bitte manuell markieren und kopieren");
    }
  };

  const download = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([letter], { type: "text/plain;charset=utf-8" }));
    a.download = `kuendigung-${sub.provider.toLowerCase().replaceAll(" ", "-")}.txt`;
    a.click();
    toast("Kündigungsschreiben (.txt) heruntergeladen");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-modal-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-[hsl(var(--primary)/.45)] p-0 backdrop-blur-sm sm:items-center sm:p-5"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[92dvh] w-full max-w-[700px] overflow-y-auto rounded-t-[24px] bg-[hsl(var(--card))] p-5 shadow-2xl sm:rounded-[24px] sm:p-7">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.15em] text-[hsl(var(--destructive))]">
              <FileText size={14} /> Schweizer Kündigungsassistent
            </div>
            <h2 id="cancel-modal-title" className="mt-1 font-display text-2xl font-semibold">Kündigung vorbereiten.</h2>
          </div>
          <button onClick={onClose} aria-label="Modal schliessen"><X size={19} /></button>
        </div>
        <div className="mt-5 flex items-center gap-3 rounded-xl bg-[hsl(var(--secondary))] p-3.5 text-sm">
          <ProviderBrandIcon name={sub.provider} color={sub.color} logoText={sub.logoText} size="sm" />
          <div className="min-w-0">
            <span className="font-bold">{sub.provider}</span>
            <span className="text-[hsl(var(--muted-foreground))]"> · {sub.plan} · {formatMoney(sub.amount, currency)} {cycleLabelDe[sub.billingCycle]}</span>
          </div>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-bold">
            Absender / Dein Name
            <input
              type="text"
              value={senderName}
              onChange={e => setSenderName(e.target.value)}
              placeholder="Vor- und Nachname"
              className="mt-1.5 h-11 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm outline-none focus:border-[#059669]"
            />
          </label>
          <label className="text-xs font-bold">
            Kündigungsgrund
            <select value={reason} onChange={e => setReason(e.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm outline-none">
              {["Günstigeres Angebot gefunden", "Wird nicht mehr benötigt", "Zu teuer", "Umzug ins Ausland", "Unzufrieden mit dem Service", "Anderer Grund"].map(x => <option key={x}>{x}</option>)}
            </select>
          </label>
        </div>
        <div className="mt-3">
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[hsl(var(--border))] p-3 text-xs font-semibold">
            <input type="checkbox" checked={include} onChange={e => setInclude(e.target.checked)} />
            Schriftliche Bestätigung des Kündigungstermins anfordern
          </label>
        </div>
        <div className="mt-5 rounded-xl border border-[hsl(var(--border))] bg-[#f8f5e9] p-4">
          <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
            <span>Schweizer Standard-Kündigungsschreiben</span>
            <span className="font-mono">CH-Recht konform</span>
          </div>
          <pre className="whitespace-pre-wrap font-sans text-xs leading-5 text-[hsl(var(--foreground)/.82)]">{letter}</pre>
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={copy}><Copy size={15} /> Schreiben kopieren</Button>
          <Button variant="soft" onClick={download}><Download size={15} /> Als .txt laden</Button>
          <Button variant="dark" onClick={() => { toast("Kündigung als vorbereitet markiert"); onClose(); }}><Check size={15} /> Als erledigt markieren</Button>
        </div>
      </div>
    </div>
  );
}

function Toast({ item, onUndo }: { item: { message: string; undo?: () => void } | null; onUndo: () => void }) {
  if (!item) return null;
  return (
    <div className="fixed bottom-[82px] left-1/2 z-[60] flex w-[calc(100%-32px)] max-w-[430px] -translate-x-1/2 items-center gap-3 rounded-xl bg-[hsl(var(--primary))] px-4 py-3 text-sm text-white shadow-2xl md:bottom-6">
      <CheckCircle2 size={17} className="shrink-0 text-[hsl(var(--accent))]" />
      <span className="flex-1">{item.message}</span>
      {item.undo && (
        <button onClick={onUndo} className="font-bold text-[hsl(var(--accent))] underline underline-offset-2">
          Rückgängig
        </button>
      )}
    </div>
  );
}

function AuthScreen({ onLoginSuccess, onCancel }: { onLoginSuccess: (user: UserProfile, settings: UserSettings) => void; onCancel?: () => void }) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [step, setStep] = useState<"creds" | "2fa">("creds");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [forwardedTo, setForwardedTo] = useState<string | null>(null);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleCredsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("Das Passwort muss mindestens 8 Zeichen lang sein.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const endpoint = tab === "login" ? "/api/auth/login" : "/api/auth/register";
      const body = tab === "login" ? { email: email.trim().toLowerCase(), password } : { email: email.trim().toLowerCase(), password, name: name.trim() };
      const res = await api<{ require2FA?: boolean; challengeId?: string; forwardedTo?: string; user?: UserProfile; settings?: UserSettings }>(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      });

      if (res.require2FA && res.challengeId) {
        setStep("2fa");
        setChallengeId(res.challengeId);
        setForwardedTo(res.forwardedTo || null);
        setCountdown(60);
      } else if (res.user && res.settings) {
        onLoginSuccess(res.user, res.settings);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Anfrage fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeId) {
      setError("Sicherheits-Challenge abgelaufen. Bitte melde dich erneut an.");
      return;
    }
    if (!code || code.trim().length !== 6) {
      setError("Bitte gib den vollständigen 6-stelligen Code ein.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await api<{ success: boolean; user: UserProfile; settings: UserSettings }>("/api/auth/verify-2fa", {
        method: "POST",
        body: JSON.stringify({
          challengeId,
          code: code.trim(),
        }),
      });
      onLoginSuccess(res.user, res.settings);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ungültiger Code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setError(null);
    setLoading(true);
    try {
      const res = await api<{ success: boolean; challengeId?: string; forwardedTo?: string }>("/api/auth/resend-code", {
        method: "POST",
        body: JSON.stringify({ challengeId, email: email.trim().toLowerCase() }),
      });
      if (res.challengeId) setChallengeId(res.challengeId);
      if (res.forwardedTo) setForwardedTo(res.forwardedTo);
      setCountdown(60);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Fehler beim Senden des Codes");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#fbfaf6] px-4 py-12 text-[#182d3b]">
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-6 left-6 inline-flex items-center gap-1.5 rounded-xl border border-[#dfe4df] bg-white px-3.5 py-2 text-xs font-semibold text-[#182d3b] shadow-sm transition-colors hover:bg-slate-50 cursor-pointer"
        >
          ← Zur Startseite
        </button>
      )}
      <div className="w-full max-w-[440px]">
        <div className="text-center">
          <div className="inline-flex items-center gap-3">
            <img src="/subly-logo.png" alt="Subly" className="h-12 w-12 rounded-2xl object-contain shadow-md bg-white p-1 border border-[#dfe4df]" />
            <span className="font-display text-[28px] font-bold tracking-[-.04em]">subly<span className="text-[#059669]">.</span></span>
          </div>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.15em] text-[#64747d]">
            Abo-Manager &amp; Spar-Assistent
          </p>
        </div>

        <div className="mt-8 rounded-[24px] border border-[#dfe4df] bg-white p-7 shadow-sm">
          {step === "creds" ? (
            <>
              <div className="flex rounded-xl bg-[#f5f4ef] p-1">
                <button
                  type="button"
                  onClick={() => { setTab("login"); setError(null); }}
                  className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${tab === "login" ? "bg-white shadow-sm text-[#182d3b]" : "text-[#64747d] hover:text-[#182d3b]"}`}
                >
                  Anmelden
                </button>
                <button
                  type="button"
                  onClick={() => { setTab("register"); setError(null); }}
                  className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${tab === "register" ? "bg-white shadow-sm text-[#182d3b]" : "text-[#64747d] hover:text-[#182d3b]"}`}
                >
                  Konto erstellen
                </button>
              </div>

              <div className="mt-4 rounded-xl bg-[#edf3bd]/40 p-3 text-center text-xs text-[#182d3b]">
                🛡️ <strong>Bot-Schutz &amp; 2FA:</strong> Zur Bestätigung senden wir einen 6-stelligen Sicherheitscode an deine E-Mail.
              </div>

              <form onSubmit={handleCredsSubmit} className="mt-5 space-y-4">
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                    {error}
                  </div>
                )}

                {tab === "register" && (
                  <div>
                    <label className="text-xs font-bold text-[#182d3b]">Dein Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="z.B. Julian"
                      autoComplete="name"
                      className="mt-1.5 h-11 w-full rounded-xl border border-[#dfe4df] bg-white px-3 text-sm outline-none focus:border-[#182d3b] focus:ring-2 focus:ring-[#182d3b]/10"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-[#182d3b]">E-Mail-Adresse</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@beispiel.ch"
                    autoComplete="email"
                    className="mt-1.5 h-11 w-full rounded-xl border border-[#dfe4df] bg-white px-3 text-sm outline-none focus:border-[#182d3b] focus:ring-2 focus:ring-[#182d3b]/10"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#182d3b]">Passwort</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Mindestens 6 Zeichen"
                    autoComplete={tab === "login" ? "current-password" : "new-password"}
                    className="mt-1.5 h-11 w-full rounded-xl border border-[#dfe4df] bg-white px-3 text-sm outline-none focus:border-[#182d3b] focus:ring-2 focus:ring-[#182d3b]/10"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex h-11 w-full items-center justify-center rounded-xl bg-[#182d3b] text-sm font-bold text-white transition-opacity hover:opacity-95 disabled:opacity-50"
                  >
                    {loading ? "Wird gesendet…" : tab === "login" ? "Anmelden & Code anfordern" : "Konto erstellen & Code anfordern"}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div>
              <div className="text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#edf3bd] text-[#182d3b]">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="mt-3 font-display text-xl font-bold">Verifizierungscode eingeben</h3>
                <p className="mt-1.5 text-xs text-[#64747d] leading-5">
                  Wir haben einen 6-stelligen Bestätigungscode für <strong className="text-[#182d3b]">{email}</strong> generiert.
                </p>
                {forwardedTo ? (
                  <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-950 text-left">
                    <p className="font-bold flex items-center gap-1.5 text-blue-900">
                      📬 Resend-Testmodus aktiv
                    </p>
                    <p className="mt-1 leading-relaxed">
                      Da dein Resend-Konto im kostenlosen Testmodus (<code>onboarding@resend.dev</code>) läuft, dürfen E-Mails nur an deine verifizierte Inhaber-Adresse gesendet werden. Der Code für <strong>{email}</strong> liegt in deinem Postfach:
                    </p>
                    <p className="mt-1.5 font-mono font-bold text-blue-800 bg-blue-100/80 rounded px-2 py-0.5 inline-block">
                      {forwardedTo}
                    </p>
                  </div>
                ) : (
                  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800">
                    📬 <strong>Wichtig:</strong> Prüfe bitte auch deinen <strong>Spam- / Junk-Ordner</strong> in Gmail!
                  </div>
                )}
              </div>

              <form onSubmit={handle2FASubmit} className="mt-6 space-y-4">
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                    {error}
                  </div>
                )}

                <div>
                  <input
                    autoFocus
                    type="text"
                    maxLength={6}
                    value={code}
                    onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="••••••"
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="h-14 w-full rounded-xl border-2 border-[#182d3b] bg-white text-center font-mono text-2xl font-black tracking-[0.4em] outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="flex h-11 w-full items-center justify-center rounded-xl bg-[#182d3b] text-sm font-bold text-white transition-opacity hover:opacity-95 disabled:opacity-50"
                >
                  {loading ? "Wird geprüft…" : "Code bestätigen & Anmelden"}
                </button>

                <div className="flex items-center justify-between pt-2 text-xs">
                  <button
                    type="button"
                    onClick={() => { setStep("creds"); setError(null); }}
                    className="font-semibold text-[#64747d] hover:text-[#182d3b]"
                  >
                    ← Zurück
                  </button>

                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={countdown > 0 || loading}
                    className="font-bold text-[#182d3b] underline underline-offset-2 disabled:opacity-50"
                  >
                    {countdown > 0 ? `Code erneut senden in ${countdown}s` : "Neuen Code senden"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        <div className="mt-6 text-center text-xs text-[#64747d]">
          🔒 Alle Daten werden verschlüsselt in deiner privaten Subly Cloud-Datenbank gespeichert.
        </div>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <main className="grid min-h-[calc(100dvh-78px)] place-items-center p-8 text-center">
      <div>
        <div className="font-mono text-sm text-[hsl(var(--destructive))]">404 / nicht gefunden</div>
        <h1 className="mt-2 font-display text-4xl font-semibold">Diese Seite existiert nicht.</h1>
        <Link href="/" className="mt-5 inline-flex text-sm font-bold underline underline-offset-4">
          Zurück zur Übersicht
        </Link>
      </div>
    </main>
  );
}

function AppShell({
  user,
  settings,
  onUpdateSettings,
  onSignOut
}: {
  user: UserProfile;
  settings: UserSettings;
  onUpdateSettings: (data: any) => Promise<void>;
  onSignOut: () => void;
}) {
  const [location, setLocation] = useLocation();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"new" | "edit" | "scan" | "cancel" | null>(null);
  const [selected, setSelected] = useState<Subscription | undefined>();
  const [toastItem, setToastItem] = useState<{ message: string; undo?: () => void } | null>(null);
  const [mobileMenu, setMobileMenu] = useState(false);

  // Fetch subscriptions from cloud API
  useEffect(() => {
    void api<Subscription[]>("/api/subscriptions")
      .then(serverSubs => {
        if (Array.isArray(serverSubs)) {
          setSubs(serverSubs);
        }
      })
      .catch(() => {
        setToastItem({ message: "Cloud-Daten konnten nicht geladen werden" });
      })
      .finally(() => setLoading(false));
  }, []);

  const notify = (message: string, undo?: () => void) => {
    setToastItem({ message, undo });
    window.setTimeout(() => setToastItem(null), 5200);
  };

  const title =
    location === "/"
      ? `Guten Tag, ${user?.name || "dort"}`
      : location === "/subs"
      ? "Abonnemente"
      : location === "/deals"
      ? "Sparpotenzial"
      : "Einstellungen & Sicherheit";

  const save = async (s: Subscription) => {
    try {
      const saved = s.id
        ? await api<Subscription>(`/api/subscriptions/${s.id}`, {
            method: "PATCH",
            body: JSON.stringify(withoutId(s)),
          })
        : await api<Subscription>("/api/subscriptions", {
            method: "POST",
            body: JSON.stringify(withoutId(s)),
          });
      setSubs(old => (s.id ? old.map(x => (x.id === s.id ? saved : x)) : [saved, ...old]));
      setModal(null);
      notify("Abonnement erfolgreich gespeichert");
    } catch {
      notify("Speichern fehlgeschlagen");
    }
  };

  const addScanned = async (s: Subscription) => {
    await save(s);
    notify("Rechnung geprüft und gespeichert");
  };

  const persistUsed = async (id: number) => {
    return api<Subscription>(`/api/subscriptions/${id}/used`, { method: "POST" });
  };

  const persistDelete = async (id: number) => {
    await api<void>(`/api/subscriptions/${id}`, { method: "DELETE" });
  };

  const persistRestore = async (s: Subscription) => {
    return api<Subscription>("/api/subscriptions", {
      method: "POST",
      body: JSON.stringify(withoutId(s)),
    });
  };

  const persistImport = async (items: Subscription[]) => {
    await Promise.all(subs.map(s => persistDelete(s.id)));
    return Promise.all(
      items.map(item =>
        api<Subscription>("/api/subscriptions", {
          method: "POST",
          body: JSON.stringify(withoutId({ ...item, id: 0 })),
        })
      )
    );
  };

  const persistClear = async () => {
    await Promise.all(subs.map(s => persistDelete(s.id)));
  };

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-[hsl(var(--muted-foreground))]">
        Lade dein Abo-Cockpit…
      </div>
    );
  }

  const userLabel = user?.name || user?.email || "Benutzer";
  const currency = settings?.currency || "CHF";

  return (
    <div className="subly-app flex">
      <Sidebar
        location={location}
        onNew={() => {
          setSelected(undefined);
          setModal("new");
        }}
        onSignOut={onSignOut}
        userLabel={userLabel}
        subs={subs}
        currency={currency}
      />
      <div className="min-w-0 flex-1">
        <Topbar
          title={title}
          onNew={() => {
            setSelected(undefined);
            setModal("new");
          }}
          onScan={() => setModal("scan")}
          onMenu={() => setMobileMenu(!mobileMenu)}
        />
        {mobileMenu && (
          <div className="fixed inset-0 z-40 bg-[hsl(var(--primary)/.4)] md:hidden" onClick={() => setMobileMenu(false)}>
            <div className="h-full w-[280px] bg-[hsl(var(--sidebar))] p-5" onClick={e => e.stopPropagation()}>
              <Logo />
              <nav className="mt-10 space-y-2">
                {[
                  ["/", "Übersicht"],
                  ["/subs", "Abonnemente"],
                  ["/deals", "Sparpotenzial"],
                  ["/more", "Einstellungen & Sicherheit"],
                ].map(([href, label]) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileMenu(false)}
                    className="block rounded-xl px-3 py-3 text-sm font-semibold text-[hsl(var(--sidebar-foreground))]"
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        )}
        <Switch>
          <Route path="/">
            <Dashboard
              subs={subs}
              onNew={() => {
                setSelected(undefined);
                setModal("new");
              }}
              onScan={() => setModal("scan")}
              onMarkUsed={async id => {
                try {
                  const updated = await persistUsed(id);
                  setSubs(old => old.map(s => (s.id === id ? updated : s)));
                  notify("Als genutzt markiert — Kündigungs-Alarm zurückgesetzt");
                } catch {
                  notify("Konnte Abo nicht aktualisieren");
                }
              }}
              onRoute={setLocation}
              currency={currency}
            />
          </Route>
          <Route path="/subs">
            <SubsPage
              subs={subs}
              setSubs={setSubs}
              onNew={() => {
                setSelected(undefined);
                setModal("new");
              }}
              onEdit={s => {
                setSelected(s);
                setModal("edit");
              }}
              onCancel={s => {
                setSelected(s);
                setModal("cancel");
              }}
              onScan={() => setModal("scan")}
              toast={notify}
              persistUsed={persistUsed}
              persistDelete={persistDelete}
              persistRestore={persistRestore}
              currency={currency}
            />
          </Route>
          <Route path="/deals">
            <DealsPage
              subs={subs}
              currency={currency}
              onNew={() => setModal("new")}
              onCancel={s => {
                setSelected(s);
                setModal("cancel");
              }}
            />
          </Route>
          <Route path="/more">
            <MorePage
              user={user}
              settings={settings}
              subs={subs}
              setSubs={setSubs}
              onUpdateSettings={onUpdateSettings}
              onSignOut={onSignOut}
              toast={message => notify(message)}
              persistImport={persistImport}
              persistClear={persistClear}
            />
          </Route>
          <Route>
            <NotFound />
          </Route>
        </Switch>
      </div>
      <MobileNav location={location} />
      {modal === "new" && <SubscriptionModal onClose={() => setModal(null)} onSave={save} currency={currency} />}
      {modal === "edit" && selected && <SubscriptionModal initial={selected} onClose={() => setModal(null)} onSave={save} currency={currency} />}
      {modal === "scan" && <ScanModal onClose={() => setModal(null)} onAdd={addScanned} toast={notify} currency={currency} />}
      {modal === "cancel" && selected && <CancelModal sub={selected} onClose={() => setModal(null)} toast={notify} user={user} currency={currency} />}
      <Toast item={toastItem} onUndo={() => { toastItem?.undo?.(); setToastItem(null); }} />
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [checking, setChecking] = useState(true);
  const [showAuth, setShowAuth] = useState(false);

  // Validate session on mount via HttpOnly cookie
  useEffect(() => {
    let isMounted = true;

    api<{ user: UserProfile; settings: UserSettings }>("/api/auth/me")
      .then(res => {
        if (!isMounted) return;
        setUser(res.user);
        setSettings(res.settings);
      })
      .catch(() => {
        if (!isMounted) return;
        setUser(null);
        setSettings(null);
      })
      .finally(() => {
        if (isMounted) {
          setChecking(false);
        }
      });

    const handleUnauthorized = () => {
      setUser(null);
      setSettings(null);
    };

    window.addEventListener("subly:unauthorized", handleUnauthorized);
    return () => {
      isMounted = false;
      window.removeEventListener("subly:unauthorized", handleUnauthorized);
    };
  }, []);

  const handleLoginSuccess = (newUser: UserProfile, newSettings: UserSettings) => {
    setUser(newUser);
    setSettings(newSettings);
    setShowAuth(false);
  };

  const handleSignOut = async () => {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } catch {}
    setUser(null);
    setSettings(null);
    setShowAuth(false);
  };

  const handleUpdateSettings = async (data: Partial<UserSettings>) => {
    const res = await api<{ user: UserProfile; settings: UserSettings }>("/api/auth/settings", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    setUser(res.user);
    setSettings(res.settings);
  };

  if (checking) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#fbfaf6] text-sm text-[#182d3b]">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#182d3b] text-xs font-bold text-white">S</span>
          <span className="font-semibold">Subly Cloud wird initialisiert…</span>
        </div>
      </div>
    );
  }

  return (
    <WouterRouter base={basePath}>
      {user ? (
        <AppShell
          user={user}
          settings={settings || { user_id: user.id, currency: "CHF", notice_days: 30, two_factor_enabled: 1 }}
          onUpdateSettings={handleUpdateSettings}
          onSignOut={handleSignOut}
        />
      ) : showAuth ? (
        <AuthScreen
          onLoginSuccess={handleLoginSuccess}
          onCancel={() => setShowAuth(false)}
        />
      ) : (
        <LandingPage onOpenAuth={() => setShowAuth(true)} />
      )}
    </WouterRouter>
  );
}
