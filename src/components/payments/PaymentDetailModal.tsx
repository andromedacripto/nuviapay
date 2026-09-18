import { useCallback, useEffect, useState } from 'react';
import { ExternalLink, Copy, Check } from 'lucide-react';
import { paymentsApi } from '@/lib/api';
import type { Payment, Transaction } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/EmptyState';
import { formatCurrency, formatAddress, formatDateTime } from '@/lib/utils';
import { buildTxExplorerUrl } from '@/onchain-facts';

interface Props {
  paymentId: string;
  open: boolean;
  onClose: () => void;
  arcChainId: number;
}

export default function PaymentDetailModal({ paymentId, open, onClose, arcChainId }: Props) {
  const [payment, setPayment] = useState<Payment | null>(null);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await paymentsApi.get(paymentId);
      setPayment(res.data.payment);
      setTransaction(res.data.transaction);
    } catch {
      // keep loading=false
    } finally {
      setLoading(false);
    }
  }, [paymentId]);

  useEffect(() => {
    if (open && paymentId) void load();
  }, [open, paymentId, load]);

  async function copy(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <Modal open={open} onClose={onClose} title="Payment details" maxWidth="max-w-lg">
      {loading ? (
        <LoadingSpinner />
      ) : !payment ? (
        <p className="text-sm text-[var(--muted)] text-center py-8">Payment not found</p>
      ) : (
        <div className="space-y-5">
          {/* Hero */}
          <div className="text-center py-2">
            <p className="display text-3xl font-bold text-[var(--ink)] tabular">
              {formatCurrency(payment.amount)}
            </p>
            <p className="text-sm text-[var(--muted)] mt-1">{payment.currency}</p>
            <div className="flex justify-center mt-3">
              <StatusBadge status={payment.status} />
            </div>
          </div>

          {/* Payment details */}
          <div className="rounded-xl border border-[var(--border)] overflow-hidden">
            <p className="px-4 py-2.5 text-xs font-semibold text-[var(--subtle)] label-caps border-b border-[var(--border)] bg-[var(--surface-muted)]">
              Payment details
            </p>
            {[
              ['Payment ID', payment.id],
              ['Beneficiary', payment.beneficiary_name],
              ['Created', formatDateTime(payment.created_at)],
              ['Reference', payment.reference ?? '—'],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] last:border-0">
                <span className="text-xs text-[var(--muted)]">{label}</span>
                <span className="mono text-xs font-medium text-[var(--ink)]">{value}</span>
              </div>
            ))}
          </div>

          {/* Blockchain details — expandable for advanced users */}
          <div className="rounded-xl border border-[var(--border)] overflow-hidden">
            <p className="px-4 py-2.5 text-xs font-semibold text-[var(--subtle)] label-caps border-b border-[var(--border)] bg-[var(--surface-muted)]">
              Network details
            </p>
            {[
              ['Network', payment.network],
              ['From', payment.wallet_address && transaction?.from_address ? formatAddress(transaction.from_address) : '—'],
              ['To', formatAddress(payment.wallet_address)],
              ['Fee', `${payment.fee_usdc} USDC`],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] last:border-0">
                <span className="text-xs text-[var(--muted)]">{label}</span>
                <span className="mono text-xs font-medium text-[var(--ink)]">{value}</span>
              </div>
            ))}
          </div>

          {/* Transaction hash */}
          {transaction?.tx_hash && (
            <div className="rounded-xl border border-[var(--border)] p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-[var(--muted)] label-caps">Transaction hash</p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => void copy(transaction.tx_hash!, 'hash')}
                    className="p-1 rounded hover:bg-[var(--surface-muted)] text-[var(--subtle)] hover:text-[var(--ink)] transition-colors"
                  >
                    {copied === 'hash' ? <Check size={12} className="text-[var(--success)]" /> : <Copy size={12} />}
                  </button>
                  <a
                    href={buildTxExplorerUrl(arcChainId, transaction.tx_hash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded hover:bg-[var(--surface-muted)] text-[var(--subtle)] hover:text-[var(--ink)] transition-colors"
                  >
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
              <p className="mono text-xs text-[var(--ink)] break-all">{transaction.tx_hash}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-[var(--muted)]">Confirmations</span>
                <span className="mono text-xs text-[var(--ink)]">{transaction.confirmations}</span>
              </div>
            </div>
          )}

          {!transaction?.tx_hash && (
            <div className="rounded-xl border border-[var(--border)] p-4">
              <p className="text-xs text-[var(--muted)]">
                This payment was processed in simulated mode. Connect a wallet and retry to execute a real on-chain transfer.
              </p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button variant="secondary" className="flex-1" onClick={onClose}>Close</Button>
            {transaction?.tx_hash && (
              <a
                href={buildTxExplorerUrl(arcChainId, transaction.tx_hash)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button variant="outline" className="w-full" leftIcon={<ExternalLink size={13} />}>
                  View on explorer
                </Button>
              </a>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
