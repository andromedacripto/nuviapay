/**
 * Nuvia — Webhooks routes
 *
 * GET  /v1/webhooks/events  — list stored webhook events (for dashboard)
 * POST /v1/webhooks/verify  — verify an inbound webhook signature
 *
 * Replay-attack protection: verifyWebhookSignature checks timestamp freshness.
 * Idempotency: events are stored with unique IDs; re-delivery of a known ID is a no-op.
 */
import { Router } from 'express';
import { requireAuth } from '../middleware.js';
import { verifyWebhookSignature } from '../security.js';
import { listWebhookEvents } from '../services/webhook.service.js';
import { validate, WebhookVerifySchema } from '../validation.js';

export const webhooksRouter = Router();

// GET /v1/webhooks/events
webhooksRouter.get('/events', requireAuth, (req, res) => {
  const limit = Math.min(parseInt(String(req.query.limit ?? 50)), 200);
  const events = listWebhookEvents(req.auth!.orgId, limit);
  res.json({ data: events });
});

// POST /v1/webhooks/verify — verify HMAC-SHA256 webhook signature
webhooksRouter.post('/verify', requireAuth, (req, res) => {
  const body = validate(WebhookVerifySchema, req.body, res);
  if (!body) return;

  const timestamp = parseInt(String(req.headers['x-webhook-timestamp'] ?? '0'), 10);
  const payload   = JSON.stringify(req.body);

  const valid = verifyWebhookSignature(payload, body.signature, timestamp);
  if (!valid) {
    res.status(401).json({ error: 'Invalid or expired webhook signature' });
    return;
  }
  res.json({ verified: true });
});
