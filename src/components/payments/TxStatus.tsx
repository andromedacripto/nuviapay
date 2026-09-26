/**
 * TxStatus — real-time onchain transaction tracker.
 * Polls the Arc RPC for receipt and shows live confirmation count.
 */
import { useEffect, useState } from 'react';
import { usePublicClient } from 'wagmi';
import { CheckCircle2, Clock, XCircle, Loader2, ExternalLink } from 'lucide-react';
import { arcTestnet } from '@/config';

interface Props {
  txHash: `0x${string}`;
  onConfirmed?: () => void;
}

type Status = 'pending' | 'confirmed' | 'failed';

export function TxStatus({ txHash, onConfirmed }: Props) {
  const client = usePublicClient({ chainId: arcTestnet.id });
  const [status,        setStatus]        = useState<Status>('pending');
  const [confirmations, setConfirmations] = useState(0);
  const [blockNumber,   setBlockNumber]   = useState<bigint | null>(null);

  useEffect(() => {
    if (!client || !txHash) return;
    let cancelled = false;

    async function poll() {
      try {
        const receipt = await client!.waitForTransactionReceipt({ hash: txHash, confirmations: 1 });
        if (cancelled) return;

        if (receipt.status === 'success') {
          setStatus('confirmed');
          setBlockNumber(receipt.blockNumber);
          setConfirmations(1);
          onConfirmed?.();

          // Poll for a few more confirmations
          for (let i = 2; i <= 3; i++) {
            if (cancelled) return;
            try {
              await client!.waitForTransactionReceipt({ hash: txHash, confirmations: i });
              if (!cancelled) setConfirmations(i);
            } catch { break; }
          }
        } else {
          setStatus('failed');
        }
      } catch {
        if (!cancelled) setStatus('failed');
      }
    }

    void poll();
    return () => { cancelled = true; };
  }, [client, txHash, onConfirmed]);

  const explorerUrl = `https://explorer.arc.io/tx/${txHash}`;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 space-y-3">
      <div className="flex items-center gap-3">
        {status === 'pending'   && <Loader2 size={18} className="text-[var(--blue)] animate-spin shrink-0" />}
        {status === 'confirmed' && <CheckCircle2 size={18} className="text-[var(--success)] shrink-0" />}
        {status === 'failed'    && <XCircle size={18} className="text-[var(--danger)] shrink-0" />}

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--ink)]">
            {status === 'pending'   && 'Waiting for confirmation…'}
            {status === 'confirmed' && `Confirmed${confirmations > 1 ? ` · ${confirmations} blocks` : ''}`}
            {status === 'failed'    && 'Transaction failed'}
          </p>
          {blockNumber !== null && (
            <p className="text-xs text-[var(--subtle)] mt-0.5">Block #{blockNumber.toString()}</p>
          )}
        </div>

        {status === 'pending' && (
          <Clock size={13} className="text-[var(--subtle)] shrink-0" />
        )}
      </div>

      {/* Tx hash + explorer link */}
      <div className="flex items-center gap-2">
        <p className="mono text-xs text-[var(--subtle)] truncate flex-1">
          {txHash.slice(0, 18)}…{txHash.slice(-6)}
        </p>
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-[var(--accent)] hover:opacity-75 transition-opacity shrink-0"
        >
          Explorer <ExternalLink size={11} />
        </a>
      </div>
    </div>
  );
}
