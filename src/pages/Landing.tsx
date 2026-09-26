import { useNavigate } from 'react-router-dom';
import { ArrowRight, Zap, Globe, Shield, Code2, BarChart3, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-[var(--bg)] text-[var(--ink)]">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--surface-strong)]/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="https://res.cloudinary.com/dffq1itle/image/upload/f_auto/q_auto/file_000000002df8820ea1d92b781d342f06_hk2pak.png"
              alt="Nuvia"
              className="h-7 w-auto object-contain"
            />
            <span className="display text-sm font-bold text-[var(--ink)] tracking-tight">NUVIA</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button className="hidden sm:inline text-sm text-[var(--muted)] hover:text-[var(--ink)] transition-colors">Docs</button>
            <button className="hidden sm:inline text-sm text-[var(--muted)] hover:text-[var(--ink)] transition-colors">Pricing</button>
            <Button size="sm" onClick={() => { void navigate('/dashboard'); }}>
              Launch app
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-16 sm:pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--muted)] mb-6 sm:mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
          Powered by Arc Network · USDC settlement
        </div>

        <h1 className="display text-4xl sm:text-5xl md:text-6xl font-bold text-[var(--ink)] tracking-tight leading-[1.05] mb-5 sm:mb-6" style={{ letterSpacing: '-0.03em' }}>
          Move money globally.<br />
          <span className="text-[var(--accent-hover)]">Without the complexity.</span>
        </h1>

        <p className="text-base sm:text-lg text-[var(--muted)] max-w-2xl mx-auto text-pretty mb-8 sm:mb-10 leading-relaxed">
          Nuvia gives businesses a simple interface for global payments,
          powered by USDC and the Arc network. Send to any beneficiary.
          Settle in seconds.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            size="lg"
            onClick={() => { void navigate('/dashboard'); }}
            rightIcon={<ArrowRight size={16} />}
          >
            Start building
          </Button>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => { void navigate('/payments'); }}
          >
            Explore payments
          </Button>
        </div>

        {/* Mini stats */}
        <div className="mt-16 grid grid-cols-3 gap-px rounded-2xl border border-[var(--border)] overflow-hidden">
          {[
            { label: 'Settlement time', value: '< 1 second', sub: 'Arc finality' },
            { label: 'Transaction fee', value: '~$0.001', sub: 'USDC on Arc' },
            { label: 'Currencies', value: 'USDC first', sub: 'Fiat rails coming soon' },
          ].map(s => (
            <div key={s.label} className="bg-[var(--surface)] p-5 text-center">
              <p className="display text-2xl font-bold text-[var(--ink)] tabular mb-1">{s.value}</p>
              <p className="text-xs font-semibold text-[var(--subtle)] label-caps mb-0.5">{s.label}</p>
              <p className="text-xs text-[var(--subtle)]">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="display text-2xl sm:text-3xl font-bold text-[var(--ink)] tracking-tight mb-3">
            Built for business finance teams
          </h2>
          <p className="text-sm sm:text-base text-[var(--muted)] text-pretty">
            Everything you need to move money — nothing you don't.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {FEATURES.map(f => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/8 border border-[var(--accent)]/15 flex items-center justify-center mb-4">
                  <Icon size={16} className="text-[var(--accent)]" />
                </div>
                <h3 className="display text-sm font-semibold text-[var(--ink)] mb-1.5">{f.title}</h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed text-pretty">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Payment flow visual */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-8">
          <h2 className="display text-xl sm:text-2xl font-bold text-[var(--ink)] tracking-tight mb-2">
            How payment settlement works
          </h2>
          <p className="text-sm text-[var(--muted)] mb-6 sm:mb-8">
            Nuvia abstracts blockchain complexity. Your team sees payments; we handle the rail.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 items-start">
            {FLOW_STEPS.map((step, i) => (
              <div key={step.label} className="flex flex-col items-center text-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--surface-muted)] border border-[var(--border)] flex items-center justify-center text-sm font-bold display text-[var(--ink-2)]">
                  {i + 1}
                </div>
                <p className="text-xs font-semibold text-[var(--ink)]">{step.label}</p>
                <p className="text-[10px] text-[var(--subtle)] text-pretty leading-snug">{step.desc}</p>
                {i < FLOW_STEPS.length - 1 && (
                  <div className="hidden md:block absolute text-[var(--subtle)]" style={{ marginLeft: '120%' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fiat abstraction notice */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-6 flex flex-col md:flex-row gap-6 items-start">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center shrink-0">
            <Globe size={18} className="text-[var(--accent)]" />
          </div>
          <div>
            <h3 className="display text-sm font-semibold text-[var(--ink)] mb-2">
              Fiat on/off-ramps · Roadmap
            </h3>
            <p className="text-xs text-[var(--muted)] text-pretty leading-relaxed">
              The Nuvia MVP settles natively in USDC on Arc Testnet. Fiat conversion (BRL, EUR, USD
              → USDC → Arc → USDC → fiat) is architected via a <code className="mono px-1 py-0.5 rounded bg-[var(--surface)] text-[var(--ink-2)]">FiatProvider</code> abstraction
              and will be available when fiat rail partners are integrated. No fiat conversion
              exists in the current version.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20 sm:pb-24 text-center">
        <h2 className="display text-3xl font-bold text-[var(--ink)] tracking-tight mb-3">
          Ready to build?
        </h2>
        <p className="text-[var(--muted)] mb-8">
          Launch the demo dashboard. Connect a wallet. Send a payment in seconds.
        </p>
        <Button size="lg" onClick={() => { void navigate('/dashboard'); }} rightIcon={<ArrowRight size={16} />}>
          Open dashboard
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <img
              src="https://res.cloudinary.com/dffq1itle/image/upload/f_auto/q_auto/file_000000002df8820ea1d92b781d342f06_hk2pak.png"
              alt="Nuvia"
              className="h-6 w-auto object-contain"
            />
            <span className="display text-xs font-bold text-[var(--ink)]">NUVIA</span>
            <span className="text-xs text-[var(--subtle)]">— Global payments. One intelligent rail.</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-[var(--subtle)]">
            <CheckCircle2 size={12} className="text-[var(--success)]" />
            <span>© 2026 Nuvia · Powered by USDC on Arc</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

const FEATURES = [
  {
    icon: Globe,
    title: 'Global payments',
    desc: 'Send USDC to any wallet address worldwide. Near-instant settlement on Arc.',
  },
  {
    icon: Zap,
    title: 'Stablecoin settlement',
    desc: 'USDC on Arc settles in under a second. Predictable fees, no gas token needed.',
  },
  {
    icon: Shield,
    title: 'Business-grade controls',
    desc: 'Role-based access, payment approvals, audit logs, and idempotent transactions.',
  },
  {
    icon: Code2,
    title: 'Developer API',
    desc: 'REST API with idempotency keys, webhook events, and OpenAPI-ready endpoints.',
  },
  {
    icon: BarChart3,
    title: 'Real-time tracking',
    desc: 'Full payment lifecycle from draft to confirmed, with on-chain transaction reference.',
  },
  {
    icon: CheckCircle2,
    title: 'Beneficiary management',
    desc: 'Save counterparties, assign labels, validate wallet addresses before sending.',
  },
];

const FLOW_STEPS = [
  { label: 'Create payment', desc: 'Enter amount, beneficiary, and reference' },
  { label: 'Review & approve', desc: 'Finance team reviews; larger payments require approval' },
  { label: 'USDC sent', desc: 'Signed transaction submitted to Arc' },
  { label: 'Confirmed', desc: 'Block confirmation in < 1 second' },
  { label: 'Receipt', desc: 'Transaction hash, amount, and timestamp recorded' },
];
