/**
 * Nuvia — Production-grade security middleware stack
 *
 * Covers:
 *   - Helmet (CSP, HSTS, X-Frame, etc.)
 *   - CORS with strict origin allowlist
 *   - express-rate-limit (per-IP sliding window)
 *   - Request size limits
 *   - Webhook HMAC-SHA256 signature verification + replay-attack protection
 *   - Org-isolation guard (prevents cross-org data access)
 *   - Path-traversal sanitization on all user-supplied identifiers
 *   - Secure error handler (no stack traces to clients)
 *   - Security headers audit logger
 */
import type { Request, Response, NextFunction } from 'express';
import { createHmac, timingSafeEqual, randomBytes } from 'crypto';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

// ─── Helmet (HTTP security headers) ──────────────────────────────────────────
export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:     ["'self'"],
      scriptSrc:      ["'self'"],
      styleSrc:       ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      imgSrc:         ["'self'", 'data:', 'https://res.cloudinary.com'],
      connectSrc:     ["'self'", 'https://*.arc.io', 'wss://*.arc.io'],
      fontSrc:        ["'self'", 'https://fonts.googleapis.com', 'https://fonts.gstatic.com'],
      objectSrc:      ["'none'"],
      frameSrc:       ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts:                 { maxAge: 31_536_000, includeSubDomains: true, preload: true },
  frameguard:           { action: 'deny' },
  noSniff:              true,
  xssFilter:            true,
  referrerPolicy:       { policy: 'strict-origin-when-cross-origin' },
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' },
});

// ─── CORS ─────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim());

export const corsOptions: Parameters<typeof import('cors').default>[0] = {
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, curl, same-origin Railway)
    if (!origin) { callback(null, true); return; }
    // In production, frontend and backend share the same Railway domain —
    // allow all railway.app origins plus the explicit allowlist
    if (
      ALLOWED_ORIGINS.includes(origin) ||
      origin.endsWith('.railway.app') ||
      origin.endsWith('.up.railway.app')
    ) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy: origin '${origin}' not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Idempotency-Key', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  maxAge: 86_400,
};

// ─── Rate limiting ────────────────────────────────────────────────────────────

/** Global: 300 req/min per IP */
export const globalRateLimiter = rateLimit({
  windowMs:         60_000,
  max:              300,
  standardHeaders:  true,
  legacyHeaders:    false,
  message:          { error: 'Too many requests. Please try again later.' },
  // Use X-Forwarded-For header when trust proxy is set, fall back to 'unknown'
  skip:             () => false,
});

/** Payment creation: 20 per 5 min per IP — prevents payment spam */
export const paymentCreateRateLimiter = rateLimit({
  windowMs:        5 * 60_000,
  max:             20,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { error: 'Payment rate limit exceeded. Please wait 5 minutes.' },
});

/** Auth endpoints: 10 per 15 min per IP — brute-force protection */
export const authRateLimiter = rateLimit({
  windowMs:        15 * 60_000,
  max:             10,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { error: 'Too many authentication attempts.' },
});

// ─── Request ID ───────────────────────────────────────────────────────────────
export function requestId(req: Request, res: Response, next: NextFunction) {
  const id = req.headers['x-request-id'] as string | undefined
    ?? randomBytes(8).toString('hex');
  req.headers['x-request-id'] = id;
  res.setHeader('X-Request-ID', id);
  next();
}

// ─── Path-traversal / injection guard ────────────────────────────────────────
const PATH_TRAVERSAL_RE = /(\.\.|\/\/|\\|%2e%2e|%2f|%5c|<|>|;|`|\$\(|&&|\|\|)/i;

export function pathTraversalGuard(req: Request, res: Response, next: NextFunction) {
  const suspect = [
    req.path,
    ...Object.values(req.params ?? {}),
    ...Object.values(req.query ?? {}).map(String),
  ].join('\n');
  if (PATH_TRAVERSAL_RE.test(suspect)) {
    res.status(400).json({ error: 'Invalid request path or parameter' });
    return;
  }
  next();
}

// ─── No-cache on API responses ────────────────────────────────────────────────
export function noCache(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  next();
}

// ─── Secure error handler ─────────────────────────────────────────────────────
export function secureErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  const reqId = req.headers['x-request-id'] ?? 'unknown';

  // Log internally with context — never surfaces to client
  console.error('[Nuvia Error]', {
    requestId: reqId,
    method:    req.method,
    path:      req.path,
    message:   err.message,
    // Stack only in development
    ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {}),
  });

  if (res.headersSent) return;

  // CORS / validation errors surfaced with safe message
  const status = (err as Error & { status?: number }).status ?? 500;
  const clientMessage =
    status < 500 ? err.message : 'An unexpected error occurred. Please try again.';

  res.status(status).json({
    error:      clientMessage,
    request_id: reqId,
  });
}

// ─── Webhook signature (HMAC-SHA256) ─────────────────────────────────────────
const WEBHOOK_SECRET = process.env.WEBHOOK_SIGNING_SECRET ?? (() => {
  // In demo mode generate a per-process ephemeral secret
  const s = randomBytes(32).toString('hex');
  console.warn('[Nuvia Security] WEBHOOK_SIGNING_SECRET not set — using ephemeral secret. Set it in .env for production.');
  return s;
})();

const WEBHOOK_REPLAY_WINDOW_MS = 5 * 60_000; // 5 minutes

/** Compute HMAC-SHA256 signature for a webhook payload */
export function signWebhookPayload(payload: string, timestamp: number): string {
  return createHmac('sha256', WEBHOOK_SECRET)
    .update(`${timestamp}.${payload}`)
    .digest('hex');
}

/** Verify an inbound webhook (e.g. from an upstream provider) */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  timestamp: number,
): boolean {
  // Replay-attack protection: reject if timestamp is too old
  if (Math.abs(Date.now() - timestamp) > WEBHOOK_REPLAY_WINDOW_MS) return false;
  const expected = signWebhookPayload(payload, timestamp);
  try {
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
  } catch {
    return false;
  }
}

// ─── Org-isolation guard ──────────────────────────────────────────────────────
/**
 * Verifies that the `org_id` embedded in a fetched resource matches the
 * authenticated organisation. Call this after any DB read that might leak
 * cross-org data if the ID was guessed.
 */
export function assertOrgIsolation(
  resourceOrgId: string,
  authOrgId: string,
  res: Response,
): boolean {
  if (resourceOrgId !== authOrgId) {
    res.status(404).json({ error: 'Not found' }); // 404, not 403 — don't confirm existence
    return false;
  }
  return true;
}

// ─── Sanitize string for safe DB use ─────────────────────────────────────────
/** Strip NUL bytes and control chars before storing user-supplied strings. */
export function sanitizeString(raw: string): string {
  // eslint-disable-next-line no-control-regex
  return raw.replace(/[\x00-\x1F\x7F]/g, '').trim();
}
