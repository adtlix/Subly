import { useState } from 'react';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BellRing,
  Check,
  ChevronDown,
  CircleCheck,
  Clock3,
  FilePenLine,
  Fingerprint,
  Gauge,
  KeyRound,
  LockKeyhole,
  Menu,
  Minus,
  MoreHorizontal,
  MoveUpRight,
  PiggyBank,
  ScanLine,
  ShieldCheck,
  Sparkles,
  X,
  XCircle,
  Zap,
} from 'lucide-react';

type LandingPageProps = { onOpenAuth: () => void };

const subscriptions = [
  {
    id: 'netflix',
    name: 'Netflix',
    type: 'Entertainment',
    amount: '19,99 €',
    initials: 'N',
    color: 'bg-[#dc7466]',
    status: 'Aktiv',
    statusClass: 'text-[#4c876a] bg-[#e0f1e6]',
    detail: 'Premium · monatlich',
  },
  {
    id: 'vodafone',
    name: 'Vodafone Allnet',
    type: 'Mobilfunk',
    amount: '39,99 €',
    initials: 'V',
    color: 'bg-[#df9a55]',
    status: 'Frist endet in 12 Tagen',
    statusClass: 'text-[#b86641] bg-[#fae5d6]',
    detail: 'Vertrag · 24 Monate',
  },
  {
    id: 'fitness',
    name: 'Fitnessstudio',
    type: 'Sport & Gesundheit',
    amount: '34,90 €',
    initials: 'F',
    color: 'bg-[#8b85c6]',
    status: 'Zombie-Abo erkannt',
    statusClass: 'text-[#7269a9] bg-[#e9e7f7]',
    detail: 'Letzte Nutzung vor 143 Tagen',
  },
];

const faqs = [
  {
    question: 'Muss ich meine Bankdaten hinterlegen?',
    answer:
      'Nein. Subly funktioniert ohne Bankzugriff und ohne Kontoverbindung. Du lädst Verträge einfach als PDF, Foto oder E-Mail weiter. So behältst du jederzeit die Kontrolle über deine Daten.',
  },
  {
    question: 'Kann Subly für mich kündigen?',
    answer:
      'Subly erstellt eine rechtssichere Kündigung mit den richtigen Vertragsdaten, Fristen und Formulierungen. Du entscheidest, wie sie versendet wird – per E-Mail, Brief oder direkt über den Anbieter.',
  },
  {
    question: 'Für welche Verträge funktioniert der Scanner?',
    answer:
      'Für praktisch alle wiederkehrenden Verträge im DACH-Raum: Mobilfunk, Internet, Streaming, Fitness, Versicherungen, Zeitungen und mehr. Subly liest die wichtigen Stellen auch aus schwer lesbaren Scans.',
  },
  {
    question: 'Was kostet Subly?',
    answer:
      'Der Einstieg ist kostenlos. Du kannst deine Verträge scannen, Fristen sehen und dein Sparpotenzial berechnen. Faire Plus-Tarife für Automatisierung stellen wir dir nach dem Start transparent vor.',
  },
];

function LogoMark() {
  return (
    <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#d5f36c] text-[#182b3c] shadow-[inset_0_-2px_0_rgba(24,43,60,.13)]">
      <span className="absolute h-3.5 w-3.5 rounded-[5px] border-[2px] border-[#182b3c] border-l-transparent" />
      <span className="absolute right-[7px] top-[8px] h-1.5 w-1.5 rounded-full bg-[#182b3c]" />
    </span>
  );
}

function SectionEyebrow({ children, dark = false }: { children: string; dark?: boolean }) {
  return (
    <div className={`mb-5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] ${dark ? 'text-[#b9cf88]' : 'text-[#68816e]'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dark ? 'bg-[#d5f36c]' : 'bg-[#4d9d78]'}`} />
      {children}
    </div>
  );
}

function Cockpit({ onOpenAuth }: LandingPageProps) {
  const [selected, setSelected] = useState('vodafone');
  const active = subscriptions.find((subscription) => subscription.id === selected) ?? subscriptions[1];

  return (
    <div className="relative mx-auto w-full max-w-[650px] animate-subly-float lg:ml-auto">
      <div className="absolute -right-5 -top-8 hidden h-24 w-24 rounded-full border border-[#8a9f69]/30 lg:block" />
      <div className="absolute -bottom-6 -left-5 h-16 w-16 rounded-full bg-[#d5f36c]/30 blur-2xl" />
      <div className="relative overflow-hidden rounded-[23px] border border-[#42566a] bg-[#1d3142] p-2 shadow-[0_28px_80px_rgba(26,48,63,.26)]">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <LogoMark />
            <span className="font-display text-sm font-bold tracking-[-0.03em] text-[#f5f1e9]">subly</span>
            <span className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] font-semibold text-[#a8b7bc]">DEMO</span>
          </div>
          <div className="flex items-center gap-3 text-[#93a7af]">
            <BellRing className="h-3.5 w-3.5" />
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#d5f36c] text-[9px] font-bold text-[#1d3142]">LS</div>
          </div>
        </div>
        <div className="grid grid-cols-[104px_1fr]">
          <div className="hidden border-r border-white/10 p-3 sm:block">
            <div className="mb-5 text-[9px] font-bold uppercase tracking-[.15em] text-[#718891]">Übersicht</div>
            <div className="space-y-2 text-[10px]">
              <div className="flex items-center gap-2 rounded-lg bg-white/10 px-2 py-2 font-semibold text-[#d5f36c]"><Gauge className="h-3.5 w-3.5" /> Dashboard</div>
              <div className="flex items-center gap-2 px-2 py-2 text-[#8da0a7]"><FilePenLine className="h-3.5 w-3.5" /> Verträge</div>
              <div className="flex items-center gap-2 px-2 py-2 text-[#8da0a7]"><PiggyBank className="h-3.5 w-3.5" /> Sparen</div>
            </div>
            <div className="mt-12 rounded-xl border border-[#d5f36c]/20 bg-[#d5f36c]/10 p-2.5">
              <Sparkles className="mb-2 h-3.5 w-3.5 text-[#d5f36c]" />
              <div className="text-[9px] font-semibold leading-tight text-[#d5f36c]">3 Chancen gefunden</div>
              <div className="mt-1 text-[8px] leading-tight text-[#9bad9b]">Zeit für einen Check?</div>
            </div>
          </div>
          <div className="min-w-0 p-3 sm:p-5">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <div className="text-[10px] text-[#8fa3aa]">Guten Morgen, Lea</div>
                <div className="mt-1 font-display text-[19px] font-semibold tracking-[-.04em] text-[#f6f1e6]">Dein Überblick</div>
              </div>
              <button type="button" onClick={onOpenAuth} data-testid="button-cockpit-add" className="rounded-lg bg-[#d5f36c] px-2.5 py-2 text-[9px] font-bold text-[#1d3142] transition-transform hover:-translate-y-0.5">+ Vertrag</button>
            </div>
            <div className="mb-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-[#284355] p-3">
                <div className="text-[9px] text-[#9aadb0]">Monatlich gesamt</div>
                <div data-testid="text-cockpit-total" className="mt-1 font-amount text-[20px] text-[#f6f1e6]">94,88 €</div>
                <div className="mt-1 flex items-center gap-1 text-[9px] text-[#8fd0a1]"><ArrowDownRight className="h-3 w-3" /> 8,40 € vs. letzter Monat</div>
              </div>
              <div className="rounded-xl bg-[#d5f36c] p-3 text-[#1d3142]">
                <div className="text-[9px] font-medium opacity-70">Sparpotenzial entdeckt</div>
                <div data-testid="text-cockpit-savings" className="mt-1 font-amount text-[20px]">−25,00 €</div>
                <div className="mt-1 text-[9px] font-semibold opacity-75">pro Monat möglich</div>
              </div>
            </div>
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[11px] font-semibold text-[#dce3df]">Deine Verträge <span className="ml-1 text-[#8298a0]">3</span></div>
              <div className="text-[9px] text-[#96a8ac]">Alle anzeigen <ArrowRight className="ml-1 inline h-3 w-3" /></div>
            </div>
            <div className="space-y-1.5">
              {subscriptions.map((subscription) => (
                <button
                  type="button"
                  key={subscription.id}
                  onClick={() => setSelected(subscription.id)}
                  data-testid={`button-subscription-${subscription.id}`}
                  className={`group flex w-full items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left transition-all ${selected === subscription.id ? 'border-[#779b71]/70 bg-[#294556]' : 'border-transparent bg-[#243d4e] hover:border-white/10'}`}
                >
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white ${subscription.color}`}>{subscription.initials}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[10px] font-semibold text-[#e9ede6]">{subscription.name}</span>
                    <span className="block truncate text-[8px] text-[#8da0a7]">{subscription.detail}</span>
                  </span>
                  <span className={`hidden rounded-full px-1.5 py-1 text-[8px] font-semibold sm:block ${subscription.statusClass}`}>{subscription.status}</span>
                  <span className="font-amount text-[11px] text-[#dce3df]">{subscription.amount}</span>
                  <MoreHorizontal className="h-3.5 w-3.5 text-[#758b93]" />
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between rounded-xl border border-[#c28663]/30 bg-[#6c493e]/25 px-3 py-2">
              <div className="flex min-w-0 items-center gap-2">
                <Clock3 className="h-3.5 w-3.5 shrink-0 text-[#efb18d]" />
                <span className="truncate text-[9px] text-[#efc8b1]"><strong>Frist im Blick:</strong> Vodafone Allnet in 12 Tagen</span>
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-[#efb18d]" />
            </div>
          </div>
        </div>
        <div className="absolute bottom-8 right-8 hidden w-[142px] rounded-xl border border-[#4e6a76] bg-[#263f50] p-2.5 shadow-xl transition-all sm:block">
          <div className="mb-1.5 flex items-center gap-1.5 text-[8px] font-semibold text-[#cddbd5]"><span className="h-1.5 w-1.5 rounded-full bg-[#d5f36c]" /> Health-Score</div>
          <div className="flex items-end justify-between"><span className="font-display text-[22px] font-semibold text-[#f6f1e6]">84<span className="text-[11px] text-[#9badad]">/100</span></span><span className="text-[9px] text-[#8fd0a1]">sehr gut</span></div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[84%] rounded-full bg-[#d5f36c]" /></div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-medium text-[#59706f]"><ShieldCheck className="h-3.5 w-3.5 text-[#4d9d78]" /> Deine Daten bleiben bei dir · ohne Bankzugriff</div>
      <span className="sr-only">Ausgewählt: {active.name}</span>
    </div>
  );
}

function FeatureVisual({ type }: { type: 'scan' | 'deadline' | 'cancel' | 'benchmark' }) {
  if (type === 'scan') {
    return (
      <div className="relative mt-7 h-44 overflow-hidden rounded-[18px] bg-[#e7e4d7] p-4">
        <div className="absolute right-5 top-4 rounded-full bg-[#d5f36c] px-2 py-1 text-[9px] font-bold text-[#233649]"><ScanLine className="mr-1 inline h-3 w-3" /> Scan läuft</div>
        <div className="absolute left-8 top-9 h-32 w-[205px] rotate-[-5deg] rounded-lg bg-[#fbf8ef] p-4 shadow-[0_12px_20px_rgba(46,57,55,.12)]">
          <div className="mb-3 h-1.5 w-16 rounded-full bg-[#8a9790]" />
          <div className="space-y-2"><div className="h-1 w-full rounded-full bg-[#d6d9d0]" /><div className="h-1 w-4/5 rounded-full bg-[#d6d9d0]" /><div className="h-1 w-full rounded-full bg-[#d6d9d0]" /></div>
          <div className="mt-5 flex items-center gap-1.5 text-[8px] font-bold text-[#4d9d78]"><CircleCheck className="h-3 w-3" /> Kündigungsfrist erkannt</div>
        </div>
        <div className="absolute bottom-3 right-6 rounded-lg bg-[#21384a] px-3 py-2 text-[9px] text-[#dce5de] shadow-lg"><span className="block text-[#91a6a8]">Vertrag erkannt</span><strong className="font-display text-[11px]">Vodafone Allnet</strong></div>
      </div>
    );
  }
  if (type === 'deadline') {
    return (
      <div className="relative mt-7 h-44 overflow-hidden rounded-[18px] bg-[#dce9df] p-4">
        <div className="absolute left-5 top-6 w-[175px] rounded-xl border border-[#c0d8c7] bg-[#f7f7ed] p-3 shadow-sm">
          <div className="mb-3 flex items-center justify-between"><span className="text-[9px] font-bold text-[#526760]">Juni 2025</span><span className="h-5 w-5 rounded-full bg-[#d5f36c] text-center text-[10px] leading-5 text-[#233649]">‹</span></div>
          <div className="grid grid-cols-7 gap-1 text-center text-[7px] text-[#8ea095]">{['M','D','M','D','F','S','S'].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div>
          <div className="mt-2 grid grid-cols-7 gap-y-2 text-center text-[8px] text-[#586d68]">{Array.from({ length: 21 }, (_, index) => <span key={index} className={index === 16 ? 'mx-auto flex h-4 w-4 items-center justify-center rounded-full bg-[#d5f36c] font-bold text-[#24384b]' : ''}>{index + 1}</span>)}</div>
        </div>
        <div className="absolute bottom-6 right-4 w-[150px] rounded-xl border border-[#dba98d] bg-[#fff5eb] p-3"><div className="flex items-center gap-1.5 text-[9px] font-bold text-[#b46742]"><BellRing className="h-3 w-3" /> Erinnerung</div><div className="mt-2 text-[10px] font-semibold text-[#364958]">Vodafone läuft aus</div><div className="mt-1 text-[8px] text-[#8e8279]">in 12 Tagen · handeln lohnt sich</div></div>
      </div>
    );
  }
  if (type === 'cancel') {
    return (
      <div className="relative mt-7 h-44 overflow-hidden rounded-[18px] bg-[#e8e1d5] p-4">
        <div className="absolute left-8 top-5 w-[235px] rotate-[2deg] rounded-lg bg-[#faf7ee] p-4 shadow-[0_15px_28px_rgba(56,55,42,.16)]"><div className="mb-3 flex justify-between text-[8px] text-[#768279]"><span>SUBLY · KÜNDIGUNG</span><span>12.06.25</span></div><div className="mb-3 h-1.5 w-28 rounded-full bg-[#273b4b]" /><div className="space-y-2"><div className="h-1 w-full rounded-full bg-[#d9ddd2]" /><div className="h-1 w-11/12 rounded-full bg-[#d9ddd2]" /><div className="h-1 w-4/5 rounded-full bg-[#d9ddd2]" /></div><div className="mt-5 flex items-center justify-between"><span className="text-[8px] font-semibold text-[#4d9d78]">rechtssicher formuliert</span><div className="h-7 w-7 rounded-full border-2 border-[#4d9d78] text-center text-[7px] font-bold leading-6 text-[#4d9d78]">OK</div></div></div>
        <div className="absolute bottom-5 right-5 rounded-xl bg-[#d5f36c] px-3 py-2 text-[9px] font-bold text-[#233649] shadow-sm"><Check className="mr-1 inline h-3 w-3" /> Bereit zum Senden</div>
      </div>
    );
  }
  return (
    <div className="relative mt-7 h-44 overflow-hidden rounded-[18px] bg-[#d9e6de] p-5">
      <div className="mb-4 flex items-center justify-between"><span className="text-[10px] font-bold text-[#37574c]">Vodafone Allnet · 39,99 €</span><span className="rounded-full bg-[#c7e8d0] px-2 py-1 text-[8px] font-bold text-[#3d7f5a]">-25% möglich</span></div>
      <div className="flex h-20 items-end gap-2 border-b border-[#aec8b8] px-3">{[45, 58, 40, 73, 62, 88, 55, 69].map((height, index) => <div key={index} className={`w-full rounded-t-md ${index === 5 ? 'bg-[#4d9d78]' : 'bg-[#b2cdb9]'}`} style={{ height: `${height}%` }} />)}</div>
      <div className="mt-2 flex justify-between px-2 text-[8px] text-[#6e8879]"><span>aktuell</span><span>ähnliche Tarife</span><span className="font-bold text-[#3e785a]">besserer Deal</span></div>
      <div className="absolute bottom-[57px] right-9 rounded-md bg-[#233649] px-2 py-1 text-[8px] font-bold text-[#d5f36c]">24,99 €</div>
    </div>
  );
}

export default function LandingPage({ onOpenAuth }: LandingPageProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [subscriptionCount, setSubscriptionCount] = useState(7);
  const [monthlyCost, setMonthlyCost] = useState(210);
  const [openFaq, setOpenFaq] = useState(0);
  const monthlySavings = Math.round(monthlyCost * (0.09 + subscriptionCount * 0.007));
  const yearlySavings = monthlySavings * 12;

  const handleNavClick = () => setMenuOpen(false);

  return (
    <main className="grain min-h-[100dvh] overflow-hidden bg-[#f5f1e8] text-[#203447]">
      <nav className="fixed inset-x-0 top-0 z-40 border-b border-[#c6c6b8]/70 bg-[#f5f1e8]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-[74px] max-w-[1240px] items-center justify-between px-5 sm:px-8">
          <a href="#top" onClick={handleNavClick} data-testid="link-logo" className="flex items-center gap-2.5">
            <LogoMark />
            <span className="font-display text-[21px] font-bold tracking-[-.06em]">subly<span className="text-[#4d9d78]">.</span></span>
          </a>
          <div className="hidden items-center gap-8 text-[13px] font-semibold text-[#52656a] md:flex">
            <a href="#so-funktionierts" data-testid="link-how-it-works" className="transition-colors hover:text-[#203447]">So funktioniert&apos;s</a>
            <a href="#vorteile" data-testid="link-benefits" className="transition-colors hover:text-[#203447]">Vorteile</a>
            <a href="#sicherheit" data-testid="link-security" className="transition-colors hover:text-[#203447]">Sicherheit</a>
            <a href="#faq" data-testid="link-faq" className="transition-colors hover:text-[#203447]">FAQ</a>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <button type="button" onClick={onOpenAuth} data-testid="button-login" className="px-3 py-2 text-[13px] font-bold text-[#4c6266] transition-colors hover:text-[#203447]">Anmelden</button>
            <button type="button" onClick={onOpenAuth} data-testid="button-nav-start" className="rounded-full bg-[#203447] px-5 py-3 text-[12px] font-bold text-[#f5f1e8] transition-all hover:-translate-y-0.5 hover:bg-[#2e4b5e]">Kostenlos starten <ArrowUpRight className="ml-1 inline h-3.5 w-3.5" /></button>
          </div>
          <button type="button" aria-expanded={menuOpen} aria-label={menuOpen ? 'Menü schließen' : 'Menü öffnen'} onClick={() => setMenuOpen(!menuOpen)} data-testid="button-mobile-menu" className="rounded-lg p-2 md:hidden">
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {menuOpen && (
          <div className="border-t border-[#c6c6b8]/70 bg-[#f5f1e8] px-5 py-5 md:hidden">
            <div className="flex flex-col gap-4 text-sm font-semibold text-[#52656a]">
              <a href="#so-funktionierts" onClick={handleNavClick} data-testid="mobile-link-how-it-works">So funktioniert&apos;s</a>
              <a href="#vorteile" onClick={handleNavClick} data-testid="mobile-link-benefits">Vorteile</a>
              <a href="#sicherheit" onClick={handleNavClick} data-testid="mobile-link-security">Sicherheit</a>
              <a href="#faq" onClick={handleNavClick} data-testid="mobile-link-faq">FAQ</a>
              <button type="button" onClick={onOpenAuth} data-testid="button-mobile-start" className="w-full rounded-full bg-[#203447] py-3 font-bold text-[#f5f1e8]">Kostenlos starten <ArrowUpRight className="ml-1 inline h-4 w-4" /></button>
            </div>
          </div>
        )}
      </nav>

      <section id="top" className="relative mx-auto max-w-[1240px] px-5 pb-20 pt-36 sm:px-8 sm:pb-28 sm:pt-44 lg:pb-32">
        <div className="pointer-events-none absolute -right-24 top-40 h-[370px] w-[370px] rounded-full bg-[#d5f36c]/25 blur-3xl" />
        <div className="grid items-center gap-14 lg:grid-cols-[.88fr_1.12fr] lg:gap-8">
          <div className="relative z-10 max-w-[590px]">
            <div className="animate-subly-rise inline-flex items-center gap-2 rounded-full border border-[#bfc6b5] bg-[#f8f5ec] px-3 py-2 text-[11px] font-bold text-[#557065] shadow-sm">
              <span className="animate-subly-pulse h-1.5 w-1.5 rounded-full bg-[#4d9d78]" /> Für mehr Überblick im Alltag
            </div>
            <h1 className="animate-subly-rise delay-100 mt-7 max-w-[670px] font-display text-[clamp(3.2rem,7vw,6.3rem)] font-semibold leading-[.93] tracking-[-.075em] text-[#203447]">
              Schluss mit<br /><span className="relative inline-block">Abo-Chaos<span className="absolute -bottom-1 left-1/4 right-0 h-2 -rotate-1 rounded-full bg-[#d5f36c] sm:h-3" /></span>
            </h1>
            <p className="animate-subly-rise delay-200 mt-8 max-w-[480px] text-[17px] leading-[1.55] text-[#607175] sm:text-[19px]">
              Subly bringt deine Verträge unter Kontrolle. Wir finden unnötige Kosten, behalten Fristen im Blick und zeigen dir, wo du besser wegkommst.
            </p>
            <div className="animate-subly-rise delay-300 mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <button type="button" onClick={onOpenAuth} data-testid="button-hero-start" className="group rounded-full bg-[#203447] px-6 py-4 text-[13px] font-bold text-[#f5f1e8] shadow-[0_8px_0_#d5f36c] transition-all hover:-translate-y-1 hover:shadow-[0_10px_0_#d5f36c]">Kostenlos starten <ArrowRight className="ml-4 inline h-4 w-4 transition-transform group-hover:translate-x-1" /></button>
              <a href="#rechner" data-testid="link-hero-calculator" className="group px-2 py-3 text-[13px] font-bold text-[#466967]">Sparpotenzial ansehen <ArrowDownRight className="ml-1 inline h-4 w-4 transition-transform group-hover:translate-y-1" /></a>
            </div>
            <div className="animate-subly-rise delay-400 mt-11 flex flex-wrap items-center gap-x-5 gap-y-3 text-[11px] font-semibold text-[#72807c]">
              <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#4d9d78]" /> Ohne Bankzugriff</span>
              <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#4d9d78]" /> DSGVO-konform</span>
              <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#4d9d78]" /> In 2 Min. startklar</span>
            </div>
          </div>
          <Cockpit onOpenAuth={onOpenAuth} />
        </div>
      </section>

      <div className="border-y border-[#c8c8ba] bg-[#ece8dc]">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <p className="text-[11px] font-bold uppercase tracking-[.15em] text-[#6f7f7b]">Verträge im Griff, bevor sie dich überraschen</p>
          <div className="flex flex-wrap items-center gap-5 text-[12px] font-semibold text-[#61736f] sm:gap-8"><span className="flex items-center gap-2"><ScanLine className="h-4 w-4 text-[#4d9d78]" /> 4.820 Verträge geprüft</span><span className="flex items-center gap-2"><PiggyBank className="h-4 w-4 text-[#4d9d78]" /> 184.300 € gefunden</span><span className="hidden items-center gap-2 sm:flex"><ShieldCheck className="h-4 w-4 text-[#4d9d78]" /> Made for DACH</span></div>
        </div>
      </div>

      <section id="so-funktionierts" className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
        <div className="grid gap-12 lg:grid-cols-[.72fr_1.28fr] lg:gap-20">
          <div>
            <SectionEyebrow>So funktioniert&apos;s</SectionEyebrow>
            <h2 className="max-w-[430px] font-display text-[clamp(2.45rem,5vw,4.4rem)] font-semibold leading-[.98] tracking-[-.065em] text-[#203447]">Weniger suchen.<br /><span className="text-[#4d9d78]">Mehr behalten.</span></h2>
            <p className="mt-6 max-w-[380px] text-[16px] leading-7 text-[#637275]">Einmal sammeln, dann Klarheit haben. Subly macht aus Kleingedrucktem konkrete nächste Schritte.</p>
            <a href="#vorteile" data-testid="link-process-features" className="mt-8 inline-flex items-center gap-2 border-b border-[#4d9d78] pb-1 text-[13px] font-bold text-[#395c5a]">Was Subly alles findet <ArrowUpRight className="h-4 w-4" /></a>
          </div>
          <div className="relative">
            <div className="absolute left-[27px] top-8 h-[calc(100%-64px)] w-px bg-[#c9d3c7] sm:left-[39px]" />
            <div className="space-y-10 sm:space-y-12">
              {[
                { number: '01', icon: ScanLine, title: 'Verträge reinschieben', copy: 'PDF, Foto oder E-Mail – Subly liest die wichtigen Stellen automatisch.' },
                { number: '02', icon: Gauge, title: 'Überblick bekommen', copy: 'Kosten, Laufzeiten und Fristen landen übersichtlich an einem Ort.' },
                { number: '03', icon: MoveUpRight, title: 'Besser entscheiden', copy: 'Kündige rechtzeitig oder wechsle zu einem Deal, der wirklich passt.' },
              ].map(({ number, icon: Icon, title, copy }) => (
                <div key={number} className="relative flex gap-5 sm:gap-8">
                  <div className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#b9c8b9] bg-[#f5f1e8] text-[#4d9d78] sm:h-20 sm:w-20"><Icon className="h-6 w-6 sm:h-7 sm:w-7" /><span className="absolute -right-1 -top-2 font-amount text-[10px] text-[#7d8a82]">{number}</span></div>
                  <div className="pt-1 sm:pt-3"><h3 className="font-display text-[22px] font-semibold tracking-[-.04em] text-[#203447]">{title}</h3><p className="mt-2 max-w-[390px] text-[14px] leading-6 text-[#6c7b7b]">{copy}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="vorteile" className="border-y border-[#c7c8bb] bg-[#ece8dd] px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-[1240px]">
          <div className="flex flex-col justify-between gap-7 sm:flex-row sm:items-end">
            <div><SectionEyebrow>Dein unfairer Vorteil</SectionEyebrow><h2 className="max-w-[580px] font-display text-[clamp(2.5rem,5vw,4.5rem)] font-semibold leading-[.95] tracking-[-.07em] text-[#203447]">Kleingedrucktes.<br /><span className="text-[#4d9d78]">Groß rausgeholt.</span></h2></div>
            <p className="max-w-[270px] text-[14px] leading-6 text-[#6a7976]">Vier ruhige Helfer, die im Hintergrund auf deine laufenden Kosten aufpassen.</p>
          </div>
          <div className="mt-14 grid gap-4 lg:grid-cols-12">
            <article className="rounded-[22px] border border-[#c6c9bb] bg-[#f6f3e9] p-5 transition-transform hover:-translate-y-1 sm:p-7 lg:col-span-7">
              <div className="flex items-start justify-between"><div><div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#d5f36c] text-[#233649]"><ScanLine className="h-4 w-4" /></div><h3 className="font-display text-[26px] font-semibold tracking-[-.05em]">Der Scanner, der mitliest</h3><p className="mt-2 max-w-[360px] text-[14px] leading-6 text-[#6b7976]">Laufzeit, Preis, Kündigungsfrist – in Sekunden statt in Seiten gefunden.</p></div><span className="font-amount text-[12px] text-[#81908a]">01</span></div>
              <FeatureVisual type="scan" />
            </article>
            <article className="rounded-[22px] border border-[#c6c9bb] bg-[#dce9df] p-5 transition-transform hover:-translate-y-1 sm:p-7 lg:col-span-5">
              <div className="flex items-start justify-between"><div><div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#203447] text-[#d5f36c]"><Clock3 className="h-4 w-4" /></div><h3 className="font-display text-[25px] font-semibold tracking-[-.05em]">Fristen? Im Blick.</h3><p className="mt-2 max-w-[280px] text-[14px] leading-6 text-[#61756f]">Erinnerungen, bevor aus „später“ „zu spät“ wird.</p></div><span className="font-amount text-[12px] text-[#6c8980]">02</span></div>
              <FeatureVisual type="deadline" />
            </article>
            <article className="rounded-[22px] border border-[#c6c9bb] bg-[#dfe9e1] p-5 transition-transform hover:-translate-y-1 sm:p-7 lg:col-span-5">
              <div className="flex items-start justify-between"><div><div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#203447] text-[#d5f36c]"><FilePenLine className="h-4 w-4" /></div><h3 className="font-display text-[25px] font-semibold tracking-[-.05em]">Kündigen ohne Kopfweh</h3><p className="mt-2 max-w-[280px] text-[14px] leading-6 text-[#61756f]">Sauber formuliert, mit deinen Daten, zum richtigen Zeitpunkt.</p></div><span className="font-amount text-[12px] text-[#6c8980]">03</span></div>
              <FeatureVisual type="cancel" />
            </article>
            <article className="rounded-[22px] border border-[#c6c9bb] bg-[#f6f3e9] p-5 transition-transform hover:-translate-y-1 sm:p-7 lg:col-span-7">
              <div className="flex items-start justify-between"><div><div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#d5f36c] text-[#233649]"><ArrowUpRight className="h-4 w-4" /></div><h3 className="font-display text-[26px] font-semibold tracking-[-.05em]">Deals, die zu dir passen</h3><p className="mt-2 max-w-[380px] text-[14px] leading-6 text-[#6b7976]">Wir vergleichen nicht nur Preise. Wir schauen auf Leistung, Bedingungen und deinen echten Bedarf.</p></div><span className="font-amount text-[12px] text-[#81908a]">04</span></div>
              <FeatureVisual type="benchmark" />
            </article>
          </div>
        </div>
      </section>

      <section id="rechner" className="relative bg-[#203447] px-5 py-24 text-[#f5f1e8] sm:px-8 sm:py-32">
        <div className="absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(circle_at_70%_35%,rgba(213,243,108,.14),transparent_53%)]" />
        <div className="relative mx-auto max-w-[1050px]">
          <div className="text-center"><SectionEyebrow dark>Dein Sparmoment</SectionEyebrow><h2 className="mx-auto max-w-[710px] font-display text-[clamp(2.7rem,6vw,5.3rem)] font-semibold leading-[.92] tracking-[-.075em]">Was könnte bei dir<br /><span className="text-[#d5f36c]">übrig bleiben?</span></h2><p className="mx-auto mt-6 max-w-[500px] text-[15px] leading-6 text-[#a9b7b5]">Ein kurzer Check, eine ziemlich gute Zahl. Schieb die Regler so, wie dein Alltag aussieht.</p></div>
          <div className="mt-14 grid overflow-hidden rounded-[24px] border border-[#405568] bg-[#263d4e] lg:grid-cols-[1fr_.85fr]">
            <div className="p-6 sm:p-10">
              <div className="mb-10 flex items-center justify-between"><span className="text-[11px] font-bold uppercase tracking-[.14em] text-[#aab9b2]">Deine Abos heute</span><span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold text-[#b9c7c0]">live berechnet</span></div>
              <label htmlFor="subscription-count" className="block text-[14px] font-semibold text-[#f5f1e8]">Wie viele Abos laufen bei dir?</label>
              <div className="mt-4 flex items-center gap-4"><input id="subscription-count" data-testid="input-subscription-count" type="range" min="2" max="20" value={subscriptionCount} onChange={(event) => setSubscriptionCount(Number(event.target.value))} className="h-1.5 w-full cursor-pointer accent-[#d5f36c]" /><span data-testid="text-subscription-count" className="font-amount min-w-[54px] text-right text-[20px] text-[#d5f36c]">{subscriptionCount}{subscriptionCount === 20 ? '+' : ''}</span></div>
              <div className="mt-2 flex justify-between text-[10px] text-[#81969c]"><span>2 Abos</span><span>20+ Abos</span></div>
              <label htmlFor="monthly-cost" className="mt-10 block text-[14px] font-semibold text-[#f5f1e8]">Was zahlst du monatlich dafür?</label>
              <div className="mt-4 flex items-center gap-4"><input id="monthly-cost" data-testid="input-monthly-cost" type="range" min="30" max="500" step="5" value={monthlyCost} onChange={(event) => setMonthlyCost(Number(event.target.value))} className="h-1.5 w-full cursor-pointer accent-[#d5f36c]" /><span data-testid="text-monthly-cost" className="font-amount min-w-[80px] text-right text-[20px] text-[#d5f36c]">{monthlyCost},– €</span></div>
              <div className="mt-2 flex justify-between text-[10px] text-[#81969c]"><span>30 €</span><span>500 €</span></div>
              <div className="mt-10 border-t border-white/10 pt-5 text-[11px] leading-5 text-[#9caeae]"><ShieldCheck className="mr-1.5 inline h-3.5 w-3.5 text-[#8ed19e]" /> Keine Kontodaten nötig. Nur eine ehrliche Schätzung auf Basis typischer Einsparungen.</div>
            </div>
            <div className="flex flex-col justify-between bg-[#d5f36c] p-6 text-[#203447] sm:p-10">
              <div><span className="text-[11px] font-bold uppercase tracking-[.14em] text-[#59724b]">Dein mögliches Sparpotenzial</span><div data-testid="text-calculator-monthly-savings" className="mt-5 font-amount text-[clamp(3.2rem,7vw,5.5rem)] leading-none tracking-[-.08em]">−{monthlySavings},– €</div><div className="mt-2 text-[15px] font-semibold text-[#506749]">pro Monat</div><div className="mt-9 flex items-center justify-between border-t border-[#7c9a58]/30 pt-5"><span className="text-[13px] font-semibold text-[#506749]">Das sind im Jahr</span><span data-testid="text-calculator-yearly-savings" className="font-amount text-[19px] font-semibold">−{yearlySavings.toLocaleString('de-DE')},– €</span></div></div>
              <button type="button" onClick={onOpenAuth} data-testid="button-calculator-start" className="mt-12 flex items-center justify-between rounded-full bg-[#203447] px-5 py-4 text-left text-[13px] font-bold text-[#f5f1e8] transition-transform hover:-translate-y-1">Jetzt Sparpotenzial berechnen <ArrowUpRight className="h-4 w-4 text-[#d5f36c]" /></button>
            </div>
          </div>
        </div>
      </section>

      <section id="sicherheit" className="bg-[#f5f1e8] px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto grid max-w-[1240px] gap-14 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
          <div><SectionEyebrow>Vertrauen, nicht Versprechen</SectionEyebrow><h2 className="max-w-[560px] font-display text-[clamp(2.65rem,5vw,4.8rem)] font-semibold leading-[.94] tracking-[-.07em]">Dein Konto bleibt<br /><span className="text-[#4d9d78]">dein Konto.</span></h2><p className="mt-7 max-w-[470px] text-[16px] leading-7 text-[#657474]">Subly ist kein Finanzdienstleister. Wir brauchen keinen Zugang zu deinem Bankkonto, um dir beim Sparen zu helfen. Das ist nicht nur sicherer – es ist auch die bessere Idee.</p><button type="button" onClick={onOpenAuth} data-testid="button-security-start" className="mt-8 inline-flex items-center gap-3 rounded-full border border-[#aebeb2] px-5 py-3 text-[13px] font-bold text-[#37595a] transition-all hover:border-[#4d9d78] hover:bg-[#e4eee2]">Sicher loslegen <ArrowUpRight className="h-4 w-4" /></button></div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: LockKeyhole, title: 'Kein Bankzugriff', copy: 'Keine Kontodaten, keine Transaktionen, keine Überraschungen.' },
              { icon: ShieldCheck, title: 'DSGVO-konform', copy: 'Deine Daten werden in der EU verarbeitet und bleiben geschützt.' },
              { icon: KeyRound, title: '2FA inklusive', copy: 'Eine zusätzliche Sicherheitsebene für deinen persönlichen Überblick.' },
              { icon: Fingerprint, title: 'Du entscheidest', copy: 'Löschen, exportieren, behalten – deine Verträge gehören dir.' },
            ].map(({ icon: Icon, title, copy }, index) => (
              <div key={title} className={`rounded-[20px] border border-[#c8c9bb] p-5 sm:p-6 ${index === 0 ? 'bg-[#e6f0e6]' : index === 3 ? 'bg-[#ece8dd]' : 'bg-[#f9f6ed]'}`}>
                <div className="mb-10 flex h-10 w-10 items-center justify-center rounded-xl bg-[#203447] text-[#d5f36c]"><Icon className="h-5 w-5" /></div><h3 className="font-display text-[19px] font-semibold tracking-[-.04em]">{title}</h3><p className="mt-2 text-[13px] leading-5 text-[#71807d]">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="border-t border-[#c7c8bb] bg-[#ece8dd] px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto grid max-w-[1080px] gap-12 lg:grid-cols-[.8fr_1.2fr]">
          <div><SectionEyebrow>Gut zu wissen</SectionEyebrow><h2 className="font-display text-[clamp(2.8rem,5vw,4.5rem)] font-semibold leading-[.94] tracking-[-.07em]">Fragen,<br /><span className="text-[#4d9d78]">klare Antworten.</span></h2><p className="mt-6 max-w-[280px] text-[14px] leading-6 text-[#6d7a77]">Noch etwas unklar? Schreib uns – echte Menschen antworten.</p><a href="mailto:hallo@subly.de" data-testid="link-contact" className="mt-6 inline-flex items-center gap-2 text-[13px] font-bold text-[#3f6460]">hallo@subly.de <ArrowUpRight className="h-4 w-4" /></a></div>
          <div className="border-t border-[#bfc3b5]">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return <div key={faq.question} className="border-b border-[#bfc3b5]"><button type="button" aria-expanded={isOpen} onClick={() => setOpenFaq(isOpen ? -1 : index)} data-testid={`button-faq-${index + 1}`} className="flex w-full items-center justify-between gap-5 py-6 text-left"><span className="font-display text-[17px] font-semibold tracking-[-.03em] text-[#203447] sm:text-[19px]">{faq.question}</span><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#aebbb0] transition-transform ${isOpen ? 'rotate-180 bg-[#d5f36c]' : ''}`}><ChevronDown className="h-4 w-4" /></span></button>{isOpen && <div data-testid={`text-faq-answer-${index + 1}`} className="max-w-[600px] pb-6 pr-8 text-[14px] leading-6 text-[#687874]">{faq.answer}</div>}</div>;
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#d5f36c] px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-[900px] text-center">
          <div className="mx-auto mb-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#203447] text-[#d5f36c]"><Zap className="h-5 w-5" /></div>
          <h2 className="font-display text-[clamp(3rem,8vw,7rem)] font-semibold leading-[.86] tracking-[-.08em] text-[#203447]">Mehr behalten.<br />Heute anfangen.</h2>
          <p className="mx-auto mt-7 max-w-[440px] text-[16px] leading-6 text-[#526a51]">Deine Verträge laufen sowieso. Jetzt weißt du wenigstens, was sie dir bringen.</p>
          <button type="button" onClick={onOpenAuth} data-testid="button-final-start" className="mt-9 rounded-full bg-[#203447] px-7 py-4 text-[13px] font-bold text-[#f5f1e8] shadow-[0_7px_0_rgba(32,52,71,.18)] transition-all hover:-translate-y-1 hover:shadow-[0_10px_0_rgba(32,52,71,.18)]">Kostenlos starten <ArrowUpRight className="ml-2 inline h-4 w-4 text-[#d5f36c]" /></button>
        </div>
      </section>

      <footer className="bg-[#203447] px-5 py-12 text-[#f5f1e8] sm:px-8">
        <div className="mx-auto max-w-[1240px]">
          <div className="flex flex-col justify-between gap-10 border-b border-white/10 pb-10 sm:flex-row sm:items-start">
            <div><a href="#top" data-testid="link-footer-logo" className="flex items-center gap-2.5"><LogoMark /><span className="font-display text-[21px] font-bold tracking-[-.06em]">subly<span className="text-[#d5f36c]">.</span></span></a><p className="mt-4 max-w-[240px] text-[13px] leading-5 text-[#9aacad]">Weniger Abo-Chaos. Mehr von deinem Geld.</p></div>
            <div className="flex flex-wrap gap-x-8 gap-y-3 text-[12px] font-semibold text-[#aab8b7]"><a href="#vorteile" data-testid="link-footer-features" className="hover:text-[#d5f36c]">Vorteile</a><a href="#sicherheit" data-testid="link-footer-security" className="hover:text-[#d5f36c]">Sicherheit</a><a href="#faq" data-testid="link-footer-faq" className="hover:text-[#d5f36c]">FAQ</a><button type="button" onClick={onOpenAuth} data-testid="button-footer-login" className="hover:text-[#d5f36c]">Anmelden</button></div>
          </div>
          <div className="flex flex-col justify-between gap-3 pt-6 text-[10px] text-[#809598] sm:flex-row"><span>© 2025 Subly Technologies GmbH</span><span>Made with care in Berlin · Deutschland & Österreich</span></div>
        </div>
      </footer>
    </main>
  );
}