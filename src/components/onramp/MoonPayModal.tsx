import { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';

interface Props {
  walletAddress?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

interface Config {
  apiKey: string;
  env: 'sandbox' | 'production';
}

export function MoonPayModal({ walletAddress, onClose }: Props) {
  const [config, setConfig] = useState<Config | null>(null);
  const [error,  setError]  = useState<string | null>(null);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/v1/onramp/config');
        if (!res.ok) {
          const d = await res.json() as { error?: string };
          setError(d.error ?? 'MoonPay not configured.');
          return;
        }
        const cfg = await res.json() as Config;
        setConfig(cfg);

        const base = cfg.env === 'production'
          ? 'https://buy.moonpay.com'
          : 'https://buy-sandbox.moonpay.com';

        // Build params — wallet address requires URL signing
        const params: Record<string, string> = {
          apiKey:             cfg.apiKey,
          defaultCurrencyCode: 'usdc',
          baseCurrencyCode:   'usd',
          baseCurrencyAmount: '100',
          colorCode:          '#1d4ed8',
          theme:              'light',
        };
        if (walletAddress) {
          params.walletAddress = walletAddress;
          params.currencyCode  = 'usdc';
        }

        // Build URL with properly encoded values for the iframe
        const searchParams = new URLSearchParams(params);
        const query = '?' + searchParams.toString();
        let url = base + query;

        // Sign the URL server-side if walletAddress is present.
        // The backend signs the query string (including '?') and returns
        // the raw base64 signature. We URL-encode it before appending.
        if (walletAddress) {
          const signRes = await fetch('/v1/onramp/sign-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }),
          });
          if (signRes.ok) {
            const { signature } = await signRes.json() as { signature: string };
            url += `&signature=${encodeURIComponent(signature)}`;
          }
        }

        // Open in new tab — avoids iframe domain restrictions during KYB review
        window.open(url, '_blank', 'noopener,noreferrer');
        onClose();
        setIframeUrl(url);
      } catch {
        setError('Failed to load MoonPay configuration.');
      }
    }
    void load();
  }, [walletAddress]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col" style={{ height: '85vh', maxHeight: '680px' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="font-semibold text-gray-900">Buy USDC</p>
            <p className="text-xs text-gray-400">Powered by MoonPay</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 relative">
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <p className="text-red-500 font-semibold mb-2">Not configured</p>
              <p className="text-sm text-gray-500">{error}</p>
            </div>
          )}
          {!error && !iframeUrl && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 size={24} className="animate-spin text-gray-400" />
            </div>
          )}
          {iframeUrl && (
            <iframe
              src={iframeUrl}
              allow="accelerometer; autoplay; camera; gyroscope; payment; microphone"
              className="w-full h-full border-0"
              title="MoonPay"
            />
          )}
        </div>
      </div>
    </div>
  );
}
