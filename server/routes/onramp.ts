import { Router } from 'express';
import crypto from 'crypto';

const router = Router();

// POST /v1/onramp/moonpay-url
// Builds and signs a MoonPay buy widget URL and returns it to the frontend.
router.post('/moonpay-url', (req, res) => {
  const publishableKey = process.env.MOONPAY_PUBLISHABLE_KEY;
  const secretKey      = process.env.MOONPAY_SECRET_KEY;
  const env            = process.env.MOONPAY_ENV ?? 'sandbox'; // 'sandbox' | 'production'

  if (!publishableKey || !secretKey) {
    res.status(503).json({
      error: 'MoonPay is not configured. Add MOONPAY_PUBLISHABLE_KEY and MOONPAY_SECRET_KEY to environment variables.',
    });
    return;
  }

  const { walletAddress } = req.body as { walletAddress?: string };

  const baseUrl = env === 'production'
    ? 'https://buy.moonpay.com'
    : 'https://buy-sandbox.moonpay.com';

  // Build query params — all values must be URL-encoded before signing.
  const params: Record<string, string> = {
    apiKey:              publishableKey,
    currencyCode:        'usdc_arc', // USDC on Arc — matches MoonPay's currency code for USDC on Arc network
    defaultCurrencyCode: 'usdc',
    baseCurrencyCode:    'usd',
    baseCurrencyAmount:  '100',
    colorCode:           encodeURIComponent('#1d4ed8'), // Nuvia brand blue
    theme:               'light',
  };

  // Only pre-fill wallet address if provided — requires signing.
  if (walletAddress) {
    params.walletAddress = walletAddress;
  }

  // Build query string with encoded values.
  const query = '?' + Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');

  let url = baseUrl + query;

  // Sign the URL if walletAddress is included (required by MoonPay).
  if (walletAddress) {
    // Sign just the query string (including leading '?'), as per MoonPay docs.
    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(query)
      .digest('base64');

    url += `&signature=${encodeURIComponent(signature)}`;
  }

  res.json({ url });
});

export default router;
