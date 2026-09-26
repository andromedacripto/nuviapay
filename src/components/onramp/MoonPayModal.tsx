import { useEffect, useState } from 'react';
import { MoonPayBuyWidget }    from '@moonpay/moonpay-react';
import { Modal }               from '@/components/ui/Modal.tsx';
import { X }                   from 'lucide-react';

interface Props {
  walletAddress?: string;
  onClose:        () => void;
  onSuccess?:     () => void;
}

export function MoonPayModal({ walletAddress, onClose, onSuccess }: Props) {
  const [apiKey, setApiKey] = useState<string>('');
  const [env,    setEnv]    = useState<'sandbox' | 'production'>('sandbox');
  const [ready,  setReady]  = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  // Fetch the publishable key + env from the backend on mount.
  useEffect(() => {
    const load = async () => {
      try {
        const res  = await fetch('/api/v1/onramp/config');
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json() as { apiKey: string; env: 'sandbox' | 'production' };
        setApiKey(data.apiKey);
        setEnv(data.env);
        setReady(true);
      } catch {
        setError('MoonPay is not configured. Add MOONPAY_PUBLISHABLE_KEY and MOONPAY_SECRET_KEY to Railway environment variables.');
      }
    };
    void load();
  }, []);

  // Called by the SDK whenever the URL needs signing.
  const handleSignUrl = async (url: string): Promise<string> => {
    const res = await fetch('/api/v1/onramp/sign-url', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ url }),
    });
    if (!res.ok) throw new Error('Failed to sign MoonPay URL');
    const data = await res.json() as { signature: string };
    return data.signature;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div className="relative z-10 w-full max-w-sm mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div>
            <p className="text-sm font-semibold text-gray-900">Buy USDC</p>
            <p className="text-xs text-gray-400">Powered by MoonPay</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="h-[560px] flex items-center justify-center">
          {error ? (
            <div className="p-6 text-center">
              <p className="text-sm text-red-600 font-medium mb-1">Not configured</p>
              <p className="text-xs text-gray-500">{error}</p>
            </div>
          ) : !ready ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-gray-400">Loading...</p>
            </div>
          ) : (
            <MoonPayBuyWidget
              variant="embedded"
              baseCurrencyCode="usd"
              baseCurrencyAmount="100"
              defaultCurrencyCode="usdc"
              walletAddress={walletAddress}
              colorCode="#1d4ed8"
              onUrlSignatureRequested={walletAddress ? handleSignUrl : undefined}
              onTransactionCompleted={async () => { onSuccess?.(); }}
              visible
            />
          )}
        </div>
      </div>
    </div>
  );
}
