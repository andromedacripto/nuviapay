import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, ArrowUpDown, Clock, CheckCircle2,
  AlertCircle, Plus, ArrowRight, Wifi,
} from 'lucide-react';
import { Button } from '@/components/ui/Button.tsx';
import { StatusBadge } from '@/components/ui/StatusBadge.tsx';
import { paymentsApi, walletApi } from '@/lib/api.ts';
import type { Payment, PaymentStats, WalletData } from '@/lib/api.ts';
import { formatCurrency, formatAddress, timeAgo } from '@/lib/utils.ts';
import CreatePaymentModal from '@/components/payments/CreatePaymentModal.tsx';

export default function Overview() {
  const navigate = useNavigate();
  const [stats,    setStats]   = useState<PaymentStats | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [wallet,   setWallet]   = useState<WalletData | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, p, w] = await Promise.all([
        paymentsApi.stats(),
        paymentsApi.list(),
        walletApi.balance(),
      ]);
      setStats(s);
      setPayments(p.payments.slice(0, 5));
      setWallet(w.data);
    } catch { /* handled silently in demo */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const kpis = [
    {
      label:   'Total volume',
      value:   stats ? formatCurrency(stats.totalVolume) : '—',
      sub:     'All time (USDC)',
      icon:    TrendingUp,
      color:   'text-[var(--accent)]',
      bg:      'bg-[var(--accent)]/8',
    },
    {
      label:   'Confirmed',
      value:   stats ? String(stats.confirmed) : '—',
      sub:     'Settled payments',
      icon:    CheckCircle2,
      color:   'text-[var(--success)]',
      bg:      'bg-[var(--success-bg)]',
    },
    {
      label:   'Processing',
      value:   stats ? String(stats.processing) : '—',
      sub:     'In-flight',
      icon:    ArrowUpDown,
      color:   'text-[var(--blue)]',
      bg:      'bg-[var(--blue-bg)]',
    },
    {
      label:   'Pending',
      value:   stats ? String(stats.pending) : '—',
      sub:     'Awaiting approval',
      icon:    Clock,
      color:   'text-[var(--warning)]',
      bg:      'bg-[var(--warning-bg)]',
    },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="display text-lg sm:text-xl font-semibold text-[var(--ink)] tracking-tight">Overview</h2>
          <p className="text-xs sm:text-sm text-[var(--muted)] mt-0.5">Welcome back. Here's what's happening.</p>
        </div>
        <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setShowCreate(true)}>
          <span className="hidden sm:inline">New payment</span>
          <span className="sm:hidden">New</span>
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {kpis.map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl ${k.bg} flex items-center justify-center`}>
                  <Icon size={16} className={k.color} />
                </div>
              </div>
              <p className="display text-2xl font-bold text-[var(--ink)] tabular leading-none mb-1">
                {loading ? <span className="inline-block w-16 h-7 rounded bg-[var(--surface-muted)] animate-pulse" /> : k.value}
              </p>
              <p className="text-xs font-medium text-[var(--subtle)] label-caps">{k.label}</p>
              <p className="text-xs text-[var(--subtle)] mt-0.5">{k.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-[1fr_320px] gap-4 sm:gap-6">
        {/* Recent payments */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
            <p className="text-sm font-semibold text-[var(--ink)]">Recent payments</p>
            <button
              onClick={() => { void navigate('/payments'); }}
              className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1"
            >
              View all <ArrowRight size={11} />
            </button>
          </div>
          {loading ? (
            <div className="divide-y divide-[var(--border)]">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-9 h-9 rounded-xl bg-[var(--surface-muted)] animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/3 bg-[var(--surface-muted)] rounded animate-pulse" />
                    <div className="h-2.5 w-1/4 bg-[var(--surface-muted)] rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ArrowUpDown size={28} className="text-[var(--subtle)] mb-3" />
              <p className="text-sm text-[var(--muted)]">No payments yet</p>
              <p className="text-xs text-[var(--subtle)] mt-1">Create your first payment to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {payments.map(p => (
                <div
                  key={p.id}
                  onClick={() => { void navigate(`/payments?id=${p.id}`); }}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-[var(--surface-muted)] cursor-pointer transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/8 flex items-center justify-center shrink-0">
                    <span className="display text-xs font-bold text-[var(--accent)]">
                      {p.beneficiary_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--ink)] truncate">{p.beneficiary_name}</p>
                    <p className="text-xs text-[var(--subtle)]">{timeAgo(p.created_at)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-[var(--ink)] tabular">{formatCurrency(p.amount)}</p>
                    <StatusBadge status={p.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Wallet card + network status */}
        <div className="space-y-4">
          {/* Wallet */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-[var(--ink)]">Wallet</p>
              <button onClick={() => { void navigate('/wallet'); }} className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1">
                View <ArrowRight size={11} />
              </button>
            </div>
            <div className="mb-1">
              <p className="text-xs text-[var(--subtle)] label-caps mb-1">Available balance</p>
              <p className="display text-2xl font-bold text-[var(--ink)] tabular">
                {loading
                  ? <span className="inline-block w-24 h-8 rounded bg-[var(--surface-muted)] animate-pulse" />
                  : `${wallet?.usdc_balance ?? '0'} USDC`
                }
              </p>
            </div>
            {wallet?.wallet_address && (
              <p className="mono text-[11px] text-[var(--subtle)] mt-2">
                {formatAddress(wallet.wallet_address)}
              </p>
            )}
            {!wallet?.wallet_address && (
              <p className="text-xs text-[var(--subtle)] mt-2">
                Connect wallet in the top bar to see live balance
              </p>
            )}
          </div>

          {/* Network status */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <p className="text-sm font-semibold text-[var(--ink)] mb-3">Network status</p>
            <div className="space-y-2.5">
              {[
                { label: 'Arc Testnet',   value: 'Operational', ok: true },
                { label: 'Settlement',     value: '< 1 second',   ok: true },
                { label: 'USDC contract',  value: 'Verified',     ok: true },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wifi size={12} className={row.ok ? 'text-[var(--success)]' : 'text-[var(--danger)]'} />
                    <span className="text-xs text-[var(--muted)]">{row.label}</span>
                  </div>
                  <span className={`text-xs font-medium ${row.ok ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Failed indicator */}
          {stats && stats.failed > 0 && (
            <div className="rounded-2xl border border-[var(--danger)]/20 bg-[var(--danger-bg)] p-4 flex items-start gap-3">
              <AlertCircle size={15} className="text-[var(--danger)] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-[var(--danger)]">{stats.failed} failed payment{stats.failed > 1 ? 's' : ''}</p>
                <button onClick={() => { void navigate('/payments?status=failed'); }} className="text-xs text-[var(--danger)] underline mt-0.5">
                  Review now
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <CreatePaymentModal open={showCreate} onClose={() => setShowCreate(false)} onSuccess={() => { void load(); }} />
    </div>
  );
}
