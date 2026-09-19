/**
 * Nuvia — API Server (production-hardened)
 * Bun + Express on port 3001
 * Vite dev server proxies /api → http://localhost:3001
 *
 * Security stack: Helmet CSP/HSTS, strict CORS, express-rate-limit,
 * request-size limits, Zod validation on all routes, HMAC webhook sig,
 * org-isolation, path-traversal guard, secure error handler.
 */
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { existsSync } from 'node:fs';
import './db.js'; // initialise + seed on import

import {
  helmetMiddleware,
  corsOptions,
  globalRateLimiter,
  requestId,
  pathTraversalGuard,
  noCache,
  secureErrorHandler,
} from './security.js';
import { paymentsRouter }      from './routes/payments.js';
import { beneficiariesRouter } from './routes/beneficiaries.js';
import { walletRouter }        from './routes/wallet.js';
import { activityRouter }      from './routes/activity.js';
import { webhooksRouter }      from './routes/webhooks.js';

const app  = express();
const PORT = parseInt(process.env.PORT ?? '3001', 10);

// ── Trust proxy (for accurate IP behind reverse proxy) ──────────────────────
app.set('trust proxy', 1);

// ── Security middleware ──────────────────────────────────────────────────────
app.use(requestId);
app.use(helmetMiddleware);
app.use(cors(corsOptions));
// CORS middleware handles OPTIONS preflight automatically

// ── Body parsing with strict size limits ────────────────────────────────────
// JSON: 100 KB max — prevents JSON bomb / large payload DoS
app.use(express.json({ limit: '100kb' }));
// URL-encoded: 16 KB max
app.use(express.urlencoded({ extended: false, limit: '16kb' }));

// ── Rate limiting ────────────────────────────────────────────────────────────
app.use(globalRateLimiter);

// ── Path traversal + injection guard ─────────────────────────────────────────
app.use(pathTraversalGuard);

// ── No-cache on all API responses ────────────────────────────────────────────
app.use(noCache);

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/v1/payments',      paymentsRouter);
app.use('/v1/beneficiaries', beneficiariesRouter);
app.use('/v1/wallet',        walletRouter);
app.use('/v1/activity',      activityRouter);
app.use('/v1/webhooks',      webhooksRouter);

// ── Health (unauthenticated, no sensitive info) ──────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status:  'ok',
    env:     process.env.NUVIA_ENV ?? 'arc-testnet',
    version: '1.0.0',
  });
});

// ── Serve built frontend (production / Railway) ──────────────────────────────
const distPath = path.resolve(process.cwd(), 'dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  // SPA fallback — serve index.html for all non-API routes
  app.use((_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // Dev: no dist folder — return 404 for unknown routes
  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });
}

// ── Secure error handler (no stack traces to clients) ────────────────────────
app.use(secureErrorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Nuvia API] Listening on http://0.0.0.0:${PORT}`);
  console.log(`[Nuvia API] Environment: ${process.env.NUVIA_ENV ?? 'arc-testnet'} (demo mode)`);
  console.log(`[Nuvia API] CORS origins: ${(process.env.CORS_ORIGINS ?? 'http://localhost:5173')}`);
});
