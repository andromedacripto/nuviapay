import { Router } from 'express';
import crypto    from 'crypto';

const router = Router();

/**
 * GET /v1/onramp/config
 * Returns the MoonPay publishable key and environment to the frontend.
 * The secret key is never sent to the client.
 */
router.get('/config', (_req, res) => {
  const publishableKey = process.env.MOONPAY_PUBLISHABLE_KEY;
  const env            = (process.env.MOONPAY_ENV ?? 'sandbox') as 'sandbox' | 'production';

  if (!publishableKey) {
    res.status(503).json({ error: 'MoonPay is not configured.' });
    return;
  }

  res.json({ apiKey: publishableKey, env });
});

/**
 * POST /v1/onramp/sign-url
 * Receives the unsigned widget URL from the frontend SDK,
 * signs it with the MoonPay secret key, and returns the signature.
 * The frontend SDK calls updateSignature(sig) and shows the widget.
 */
router.post('/sign-url', (req, res) => {
  const secretKey = process.env.MOONPAY_SECRET_KEY;

  if (!secretKey) {
    res.status(503).json({ error: 'MoonPay secret key not configured.' });
    return;
  }

  const { url } = req.body as { url?: string };
  if (!url) {
    res.status(400).json({ error: 'url is required' });
    return;
  }

  // MoonPay requires signing the query string (including leading '?')
  // with HMAC-SHA256 and returning the base64 signature (NOT URL-encoded —
  // the SDK handles encoding before appending to the URL).
  const queryString = new URL(url).search; // includes leading '?'
  const signature   = crypto
    .createHmac('sha256', secretKey)
    .update(queryString)
    .digest('base64');

  res.json({ signature });
});

export default router;
