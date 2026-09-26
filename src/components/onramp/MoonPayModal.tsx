import { useEffect, useState } from 'react';
import { X, CreditCard } from 'lucide-react';

interface MoonPayModalProps {
  walletAddress?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function MoonPayModal({ walletAddress, onClose, onSuccess }: MoonPayModalProps) {
  const [widgetUrl, setWidgetUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const build = async () => {
      try {
        const res = await fetch('/v1/onramp/moonpay-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error((data as { error?: string }).error ?? `Status ${res.status}`);
        }
        const data = await res.json() as { url: string };
        setWidgetUrl(data.url);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load widget');
      } finally {
        setLoading(false);
      }
    };
    void build();
  }, [walletAddress]);

  // Listen for MoonPay postMessage events
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      // MoonPay sends events from buy.moonpay.com or buy-sandbox.moonpay.com
      if (typeof e.data !== 'object' || !e.data) return;
      const ev = e.data as { type?: string };
      if (ev.type === 'moonpay_transaction_completed' || ev.type === 'moonpay_buy_completed') {
        onSuccess?.();
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onSuccess]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[var(--surface)] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl flex flex-col overflow-hidden"
           style={{ height: '90vh', maxHeight: 720 }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[var(--brand)]/10 flex items-center justify-center">
              <CreditCard size={14} className="text-[var(--brand)]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--ink)]">Buy USDC</p>
              <p className="text-xs text-[var(--muted)]">Powered by MoonPay</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full hover:bg-[var(--surface-muted)] flex items-center justify-center transition-colors">
            <X size={14} className="text-[var(--muted)]" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 relative">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-[var(--brand)] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-[var(--muted)]">Loading payment widget…</p>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[var(--error-bg)] flex items-center justify-center">
                <CreditCard size={20} className="text-[var(--error)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--ink)] mb-1">Widget unavailable</p>
                <p className="text-xs text-[var(--muted)]">{error}</p>
              </div>
              <p className="text-xs text-[var(--subtle)]">
                Add <code className="bg-[var(--surface-muted)] px-1 rounded text-[10px]">MOONPAY_PUBLISHABLE_KEY</code> and{' '}
                <code className="bg-[var(--surface-muted)] px-1 rounded text-[10px]">MOONPAY_SECRET_KEY</code> to your environment variables.
              </p>
            </div>
          )}

          {widgetUrl && !loading && !error && (
            <iframe
              src={widgetUrl}
              title="MoonPay — Buy USDC"
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; camera; gyroscope; payment; microphone"
            />
          )}
        </div>
      </div>
    </div>
  );
}
