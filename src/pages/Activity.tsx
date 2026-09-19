import { useCallback, useEffect, useState } from 'react';
import { Activity as ActivityIcon, ArrowUpDown, Zap, Users, ExternalLink } from 'lucide-react';
import { activityApi } from '@/lib/api.ts';
import type { AuditLog, Transaction } from '@/lib/api.ts';
import { formatDateTime, formatAddress } from '@/lib/utils.ts';
import { cn } from '@/lib/utils.ts';

const ACTION_ICONS: Record<string, React.ReactNode> = {
  'payment.created':   <ArrowUpDown size={13} className="text-[var(--blue)]" />,
  'payment.confirmed': <Zap size={13} className="text-[var(--success)]" />,
  'payment.processing':<ArrowUpDown size={13} className="text-[var(--blue)]" />,
  'payment.failed':    <ActivityIcon size={13} className="text-[var(--danger)]" />,
  'beneficiary.created': <Users size={13} className="text-[var(--accent)]" />,
  'beneficiary.updated': <Users size={13} className="text-[var(--accent)]" />,
  'beneficiary.disabled': <Users size={13} className="text-[var(--muted)]" />,
};

const ACTION_COLORS: Record<string, string> = {
  'payment.created':    'bg-[var(--blue-bg)]',
  'payment.confirmed':  'bg-[var(--success-bg)]',
  'payment.processing': 'bg-[var(--blue-bg)]',
  'payment.failed':     'bg-[var(--danger-bg)]',
  'beneficiary.created': 'bg-[var(--accent)]/8',
  'beneficiary.updated': 'bg-[var(--accent)]/8',
  'beneficiary.disabled': 'bg-[var(--surface-muted)]',
};

const TABS = ['Audit log', 'Transactions'] as const;
type Tab = typeof TABS[number];

export default function Activity() {
  const [tab, setTab]         = useState<Tab>('Audit log');
  const [logs, setLogs]       = useState<AuditLog[]>([]);
  const [txs, setTxs]         = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'Audit log') {
        const res = await activityApi.list();
        setLogs(res.data);
      } else {
        const res = await activityApi.transactions();
        setTxs(res.data);
      }
    } finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-4 sm:space-y-5">
      <div>
        <h2 className="display text-lg sm:text-xl font-semibold text-[var(--ink)] tracking-tight">Activity</h2>
        <p className="text-xs sm:text-sm text-[var(--muted)] mt-0.5">Audit trail and transaction history</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] w-fit">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-1.5 rounded-lg text-xs font-medium transition-all',
              tab === t
                ? 'bg-[var(--accent)] text-white shadow-sm'
                : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-muted)]'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Audit log */}
      {tab === 'Audit log' && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <div className="hidden sm:grid grid-cols-[160px_1fr_180px_200px] gap-4 px-5 py-3 border-b border-[var(--border)] bg-[var(--surface-muted)]">
            {['Action', 'Entity', 'User', 'Timestamp'].map(h => (
              <p key={h} className="text-[10px] font-semibold text-[var(--subtle)] label-caps">{h}</p>
            ))}
          </div>
          {loading ? (
            <div className="divide-y divide-[var(--border)]">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-8 h-8 rounded-xl bg-[var(--surface-muted)] animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/3 bg-[var(--surface-muted)] rounded animate-pulse" />
                    <div className="h-2 w-1/4 bg-[var(--surface-muted)] rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center">
              <ActivityIcon size={28} className="text-[var(--subtle)] mx-auto mb-3" />
              <p className="text-sm text-[var(--muted)]">No activity yet</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {logs.map(log => (
                <div key={log.id} className="hidden sm:grid grid-cols-[160px_1fr_180px_200px] gap-4 px-5 py-3.5 items-center hover:bg-[var(--surface-muted)] transition-colors">
                  <div className="flex items-center gap-2">
                    <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', ACTION_COLORS[log.action] ?? 'bg-[var(--surface-muted)]')}>
                      {ACTION_ICONS[log.action] ?? <ActivityIcon size={13} className="text-[var(--muted)]" />}
                    </div>
                    <span className="mono text-[10px] text-[var(--ink)] truncate">{log.action}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-[var(--ink)] truncate">{log.entity_type}</p>
                    <p className="mono text-[10px] text-[var(--subtle)] truncate">{log.entity_id}</p>
                  </div>
                  <p className="mono text-[10px] text-[var(--subtle)] truncate">{log.user_id}</p>
                  <p className="text-xs text-[var(--muted)]">{formatDateTime(log.created_at)}</p>
                </div>
              ))}

              {/* Mobile */}
              {logs.map(log => (
                <div key={`m-${log.id}`} className="sm:hidden flex items-start gap-3 px-4 py-3">
                  <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', ACTION_COLORS[log.action] ?? 'bg-[var(--surface-muted)]')}>
                    {ACTION_ICONS[log.action] ?? <ActivityIcon size={13} className="text-[var(--muted)]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="mono text-xs text-[var(--ink)]">{log.action}</p>
                    <p className="mono text-[10px] text-[var(--subtle)] truncate">{log.entity_id}</p>
                    <p className="text-[10px] text-[var(--subtle)]">{formatDateTime(log.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Transactions */}
      {tab === 'Transactions' && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <div className="hidden sm:grid grid-cols-[1fr_160px_120px_120px_120px] gap-4 px-5 py-3 border-b border-[var(--border)] bg-[var(--surface-muted)]">
            {['Tx Hash', 'Amount', 'Status', 'Confirmations', 'Timestamp'].map(h => (
              <p key={h} className="text-[10px] font-semibold text-[var(--subtle)] label-caps">{h}</p>
            ))}
          </div>
          {loading ? (
            <div className="py-12 text-center">
              <div className="space-y-2 max-w-xs mx-auto">
                {[1,2,3].map(i => <div key={i} className="h-8 bg-[var(--surface-muted)] rounded animate-pulse" />)}
              </div>
            </div>
          ) : txs.length === 0 ? (
            <div className="py-12 text-center">
              <Zap size={28} className="text-[var(--subtle)] mx-auto mb-3" />
              <p className="text-sm text-[var(--muted)]">No on-chain transactions yet</p>
              <p className="text-xs text-[var(--subtle)] mt-1">Transactions appear here after payments are submitted to Arc</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {txs.map(tx => (
                <div key={tx.id} className="hidden sm:grid grid-cols-[1fr_160px_120px_120px_120px] gap-4 px-5 py-3.5 items-center hover:bg-[var(--surface-muted)] transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="mono text-xs text-[var(--ink)] truncate">{formatAddress(tx.tx_hash ?? '—', 8)}</span>
                    {tx.tx_hash && (
                      <a href={`https://explorer.testnet.arc.io/tx/${tx.tx_hash}`} target="_blank" rel="noreferrer"
                        className="text-[var(--subtle)] hover:text-[var(--accent)] transition-colors shrink-0">
                        <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-[var(--ink)] tabular">{tx.amount} USDC</p>
                  <span className={cn(
                    'text-[11px] font-semibold px-2 py-0.5 rounded-full w-fit',
                    tx.status === 'confirmed' ? 'bg-[var(--success-bg)] text-[var(--success)]' : 'bg-[var(--blue-bg)] text-[var(--blue)]'
                  )}>
                    {tx.status}
                  </span>
                  <p className="text-xs text-[var(--muted)]">{tx.confirmations}</p>
                  <p className="text-xs text-[var(--muted)]">{formatDateTime(tx.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
