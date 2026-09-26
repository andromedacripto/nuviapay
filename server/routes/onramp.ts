/**
 * Nuvia — Onramp routes
 * POST /v1/onramp/session  — creates a Transak widgetUrl via their API
 */
import { Router } from 'express';
import type { Request, Response } from 'express';

const router = Router();

const TRANSAK_API_KEY     = process.env.TRANSAK_API_KEY ?? '';
const TRANSAK_ACCESS_TOKEN = process.env.TRANSAK_ACCESS_TOKEN ?? '';
const TRANSAK_ENV         = process.env.TRANSAK_ENV ?? 'STAGING'; // STAGING | PRODUCTION
const REFERRER_DOMAIN     = process.env.NUVIA_DOMAIN ?? 'nuviapay-production.up.railway.app';

const TRANSAK_API_BASE = TRANSAK_ENV === 'PRODUCTION'
  ? 'https://api-gateway.transak.com'
  : 'https://api-gateway-stg.transak.com';

router.post('/session', async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.body as { walletAddress?: string };

    if (!TRANSAK_API_KEY) {
      // No API key configured — return a sandbox stub so the UI doesn't break
      return res.status(503).json({
        error: 'Transak API key not configured',
        message: 'Add TRANSAK_API_KEY and TRANSAK_ACCESS_TOKEN to your environment variables.',
      });
    }

    const widgetParams: Record<string, unknown> = {
      apiKey:              TRANSAK_API_KEY,
      referrerDomain:      REFERRER_DOMAIN,
      productsAvailed:     'BUY',
      cryptoCurrencyCode:  'USDC',
      network:             'arc',          // Arc mainnet
      fiatCurrency:        'BRL',          // Default to BRL for Brazil
      defaultFiatAmount:   100,
      themeColor:          '1d4ed8',       // Nuvia accent blue
      ...(walletAddress && {
        walletAddress,
        disableWalletAddressForm: true,
      }),
    };

    const response = await fetch(`${TRANSAK_API_BASE}/api/v2/auth/session`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'accept':        'application/json',
        'access-token':  TRANSAK_ACCESS_TOKEN,
      },
      body: JSON.stringify({ widgetParams }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('[Transak] session error:', response.status, text);
      return res.status(502).json({ error: 'Transak session creation failed', detail: text });
    }

    const json = await response.json() as { data: { widgetUrl: string } };
    return res.json({ data: { widgetUrl: json.data.widgetUrl } });
  } catch (err) {
    console.error('[Transak] unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
