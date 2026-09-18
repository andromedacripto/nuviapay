/** Nuvia — Webhook event service (idempotent store-and-forward) */
import { v4 as uuid } from 'uuid';
import db from '../db.js';
import type { WebhookEvent } from '../types.js';

const VALID_EVENTS = new Set([
  'payment.created', 'payment.processing', 'payment.submitted',
  'payment.confirmed', 'payment.failed', 'payment.cancelled',
  'beneficiary.created', 'beneficiary.updated', 'beneficiary.disabled',
]);

export function emitWebhook(orgId: string, eventType: string, payload: unknown): void {
  if (!VALID_EVENTS.has(eventType)) return;
  const id = `wh_${uuid().replace(/-/g,'').slice(0,16)}`;
  db.prepare(`INSERT INTO webhook_events(id,org_id,event_type,payload) VALUES(?,?,?,?)`)
    .run(id, orgId, eventType, JSON.stringify(payload));
}

export function listWebhookEvents(orgId: string, limit = 50): WebhookEvent[] {
  return db.prepare('SELECT * FROM webhook_events WHERE org_id = ? ORDER BY created_at DESC LIMIT ?')
    .all(orgId, limit) as WebhookEvent[];
}

export function markDelivered(id: string): void {
  db.prepare('UPDATE webhook_events SET delivered = 1 WHERE id = ?').run(id);
}
