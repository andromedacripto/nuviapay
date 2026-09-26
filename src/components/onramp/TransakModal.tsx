/**
 * Nuvia — Transak Onramp Modal
 * Opens the Transak widget to buy USDC with Pix, card, or bank transfer.
 * The backend generates a secure widgetUrl; the frontend renders it in a modal.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { X, Loader2, ShoppingCart } from 'lucide-react';
import { Transak, type TransakConfig } from '@transak/transak-sdk';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';

interface TransakModalProps {
  walletAddress?: string;
  onClose: () => void;
  onSuccess?: (orderId: string) => void;
}

export function TransakModal({ walletAddress, onClose, onSuccess }: TransakModalProps) {
  const [widgetUrl, setWidgetUrl]   = useState<string | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const transakRef                  = useRef<Transak | null>(null);
  const mountId                     = 'transak-mount';

  const fetchWidgetUrl = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/v1/onramp/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress }),
      });
      if (!res.ok) throw new Error('Failed to create onramp session');
      const json = await res.json() as { data: { widgetUrl: string } };
      setWidgetUrl(json.data.widgetUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start onramp session');
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    void fetchWidgetUrl();
  }, [fetchWidgetUrl]);

  useEffect(() => {
    if (!widgetUrl) return;

    const config: TransakConfig = {
      widgetUrl,
      referrer: window.location.origin,
      containerId: mountId,
      widgetWidth: '100%',
      widgetHeight: '100%',
    };

    const transak = new Transak(config);
    transakRef.current = transak;
    transak.init();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Transak.on(Transak.EVENTS.TRANSAK_ORDER_SUCCESSFUL, (orderData: any) => {
      const id = (orderData as { status?: { id?: string } })?.status?.id ?? 'unknown';
      toast.success('USDC purchase successful!');
      onSuccess?.(id);
      transak.close();
      onClose();
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Transak.on(Transak.EVENTS.TRANSAK_WIDGET_CLOSE, () => {
      onClose();
    });

    return () => {
      transak.cleanup();
      transakRef.current = null;
    };
  }, [widgetUrl, onClose, onSuccess]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md h-[680px] rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center">
              <ShoppingCart size={13} className="text-[var(--accent)]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--ink)]">Buy USDC</p>
              <p className="text-[10px] text-[var(--subtle)]">Pix · Card · Bank transfer</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[var(--surface-muted)] transition-colors text-[var(--subtle)]"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 relative">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <Loader2 size={24} className="text-[var(--accent)] animate-spin" />
              <p className="text-sm text-[var(--muted)]">Opening payment gateway…</p>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
              <p className="text-sm text-[var(--danger)]">{error}</p>
              <Button size="sm" onClick={() => void fetchWidgetUrl()}>Try again</Button>
            </div>
          )}

          {!loading && !error && (
            <div id={mountId} className="w-full h-full" />
          )}
        </div>
      </div>
    </div>
  );
}
