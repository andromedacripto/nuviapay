import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, Filter, Copy, Check, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/Button.tsx';
import { StatusBadge } from '@/components/ui/StatusBadge.tsx';
import { Input } from '@/components/ui/Input.tsx';
import { paymentsApi } from '@/lib/api.ts';
import type { Payment, Transaction } from '@/lib/api.ts';
import { formatCurrency, formatDateTime, formatAddress } from '@/lib/utils.ts';
import CreatePaymentModal from '@/components/payments/CreatePaymentModal.tsx';
import { cn } from '@/lib/utils.ts';

const FILTERS = [
  { key: '',            label: 'All' },
  { key: 'pending_approval', label: 'Pending' },
  { key: 'processing',  label: 'Processing' },
  { key: 'confirmed',   label: 'Confirmed' },
  { key: 'failed',      label: 'Failed' },
];

export default function Payments() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [payments,   setPayments]   = useState<Payment[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [search,     setSearch]     = useState('');
  const [expanded,   setExpanded]   = useState<string | null>(null);
  const [detail,     setDetail]     = useState<{ payment: Payment; transaction: Transaction | null } | null>(null);
  const [copied,     setCopied]     = useState<string | null>(null);

  const activeFilter = searchParams.get('status') ?? '';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await paymentsApi.list(activeFilter || undefined);
      setPayments(res.payments);
    } finally { setLoading(false); }
  }, [activeFilter]);

  useEffect(() => { void load(); }, [load]);

  async function expand(p: Payment) {
    if (expanded === p.id) { setExpanded(null); setDetail(null); return; }
    setExpanded(p.id);
    const res = await paymentsApi.get(p.id);
    setDetail(res.data);
  }

  async function copyText(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  const filtered = payments.filter(p =>
    p.beneficiary_name.toLowerCase().includes(search.toLowerCase()) ||
    p.id.toLowerCase().includes(search.toLowerCase()) ||
    (p.reference ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="display text-lg sm:text-xl font-semibold text-[var(--ink)] tracking-tight">Payments</h2>
          <p className="text-xs sm:text-sm text-[var(--muted)] mt-0.5">{payments.length} payment{payments.length !== 1 ? 's' : ''}</p>
        </div>
        <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setShowCreate(true)}>
          <span className="hidden sm:inline">New payment</span>
          <span className="sm:hidden">New</span>
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Status filters — scrollable on mobile */}
        <div className="flex items-center gap-1 p-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-x-auto max-w-full scrollbar-none">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setSearchParams(f.key ? { status: f.key } : {})}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                activeFilter === f.key
                  ? 'bg-[var(--accent)] text-white shadow-sm'
                  : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-muted)]'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex-1 max-w-xs">
          <Input
            placeholder="Search payments…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            leftAddon={<Search size={13} />}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        {/* Table head */}
        <div className="hidden sm:grid grid-cols-[1fr_130px_110px_100px_120px_40px] gap-4 px-5 py-3 border-b border-[var(--border)] bg-[var(--surface-muted)]">
          {['Beneficiary / Reference', 'Date', 'Amount', 'Currency', 'Status', ''].map(h => (
            <p key={h} className="text-[10px] font-semibold text-[var(--subtle)] label-caps">{h}</p>
          ))}
        </div>

        {loading ? (
          <div className="divide-y divide-[var(--border)]">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/3 bg-[var(--surface-muted)] rounded animate-pulse" />
                  <div className="h-2.5 w-1/4 bg-[var(--surface-muted)] rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Filter size={28} className="text-[var(--subtle)] mb-3" />
            <p className="text-sm text-[var(--muted)]">No payments found</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {filtered.map(p => (
              <div key={p.id}>
                <div
                  className="hidden sm:grid grid-cols-[1fr_130px_110px_100px_120px_40px] gap-4 px-5 py-4 hover:bg-[var(--surface-muted)] cursor-pointer transition-colors items-center"
                  onClick={() => void expand(p)}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--ink)] truncate">{p.beneficiary_name}</p>
                    <p className="mono text-[10px] text-[var(--subtle)]">{p.id}</p>
                  </div>
                  <p className="text-xs text-[var(--muted)]">{formatDateTime(p.created_at)}</p>
                  <p className="text-sm font-semibold text-[var(--ink)] tabular">{formatCurrency(p.amount)}</p>
                  <p className="text-xs font-medium text-[var(--muted)]">{p.currency}</p>
                  <StatusBadge status={p.status} dot />
                  <button className="p-1 rounded hover:bg-[var(--surface-muted)] transition-colors">
                    {expanded === p.id ? <ChevronUp size={14} className="text-[var(--subtle)]" /> : <ChevronDown size={14} className="text-[var(--subtle)]" />}
                  </button>
                </div>

                {/* Mobile row */}
                <div
                  className="sm:hidden flex items-center gap-3 px-4 py-3 cursor-pointer"
                  onClick={() => void expand(p)}
                >
                  <div className="w-8 h-8 rounded-xl bg-[var(--accent)]/8 flex items-center justify-center shrink-0">
                    <span className="display text-xs font-bold text-[var(--accent)]">{p.beneficiary_name.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--ink)] truncate">{p.beneficiary_name}</p>
                    <StatusBadge status={p.status} />
                  </div>
                  <p className="text-sm font-semibold text-[var(--ink)] tabular shrink-0">{formatCurrency(p.amount)}</p>
                </div>

                {/* Expanded detail */}
                {expanded === p.id && detail && detail.payment.id === p.id && (
                  <div className="border-t border-[var(--border)] bg-[var(--surface-muted)] px-5 py-5">
                    <div className="grid sm:grid-cols-3 gap-6">
                      <div className="space-y-3">
                        <p className="text-[10px] font-semibold text-[var(--subtle)] label-caps">Payment details</p>
                        <Row label="Payment ID"    value={detail.payment.id} mono copy onCopy={() => void copyText(detail.payment.id, 'id')} copied={copied === 'id'} />
                        <Row label="Beneficiary"   value={detail.payment.beneficiary_name} />
                        <Row label="Wallet"        value={formatAddress(detail.payment.wallet_address)} mono copy onCopy={() => void copyText(detail.payment.wallet_address, 'addr')} copied={copied === 'addr'} />
                        <Row label="Reference"     value={detail.payment.reference ?? '—'} />
                        <Row label="Network fee"   value={`${detail.payment.fee_usdc} USDC`} />
                      </div>
                      <div className="space-y-3">
                        <p className="text-[10px] font-semibold text-[var(--subtle)] label-caps">Settlement</p>
                        <Row label="Network"    value="Arc Testnet" />
                        <Row label="Status"     value={<StatusBadge status={detail.payment.status} dot />} />
                        <Row label="Created"    value={formatDateTime(detail.payment.created_at)} />
                        <Row label="Updated"    value={formatDateTime(detail.payment.updated_at)} />
                      </div>
                      {detail.transaction && (
                        <div className="space-y-3">
                          <p className="text-[10px] font-semibold text-[var(--subtle)] label-caps">On-chain</p>
                          <Row
                            label="Transaction hash"
                            value={formatAddress(detail.transaction.tx_hash ?? '', 8)}
                            mono
                            copy
                            onCopy={() => void copyText(detail.transaction!.tx_hash ?? '', 'txhash')}
                            copied={copied === 'txhash'}
                          />
                          <Row label="Confirmations" value={String(detail.transaction.confirmations)} />
                          {detail.transaction.confirmed_at && (
                            <Row label="Confirmed at" value={formatDateTime(detail.transaction.confirmed_at)} />
                          )}
                          {detail.transaction.tx_hash && (
                            <a
                              href={`https://explorer.arc.io/tx/${detail.transaction.tx_hash}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:underline"
                            >
                              View on explorer <ExternalLink size={11} />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <CreatePaymentModal open={showCreate} onClose={() => setShowCreate(false)} onSuccess={() => { void load(); }} />
    </div>
  );
}

function Row({
  label, value, mono, copy, onCopy, copied,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  copy?: boolean;
  onCopy?: () => void;
  copied?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs text-[var(--subtle)] shrink-0">{label}</span>
      <div className="flex items-center gap-1 min-w-0">
        <span className={cn('text-xs font-medium text-[var(--ink)] truncate', mono && 'mono')}>
          {value}
        </span>
        {copy && onCopy && (
          <button onClick={onCopy} className="p-0.5 shrink-0 text-[var(--subtle)] hover:text-[var(--ink)] transition-colors">
            {copied ? <Check size={11} className="text-[var(--success)]" /> : <Copy size={11} />}
          </button>
        )}
      </div>
    </div>
  );
}
