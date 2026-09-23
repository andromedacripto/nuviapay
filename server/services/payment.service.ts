/**
 * Nuvia — Payment service
 *
 * All inputs arrive pre-validated by Zod in the route layer.
 * The service re-sanitizes critical fields as defense-in-depth.
 * All DB queries use parameterized statements (bun:sqlite prepared statements).
 * Idempotency: duplicate idempotency_key returns the existing payment.
 * Status transitions are validated against a strict allowlist.
 */
import { v4 as uuid } from 'uuid';
import db from '../db.js';
import type { AuthContext } from '../middleware.js';
import type { Payment, PaymentStatus } from '../types.js';
import { emitWebhook } from './webhook.service.js';
import { addAuditLog } from './audit.service.js';
import { sanitizeString } from '../security.js';

// ─── State machine ────────────────────────────────────────────────────────────
const VALID_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  draft:            ['quoted', 'cancelled'],
  quoted:           ['pending_approval', 'cancelled'],
  pending_approval: ['processing', 'cancelled'],
  processing:       ['submitted', 'failed'],
  submitted:        ['confirmed', 'failed'],
  confirmed:        [],
  failed:           [],
  cancelled:        [],
};

// ─── Read helpers ─────────────────────────────────────────────────────────────
export function listPayments(
  auth: AuthContext,
  status?: string,
  limit = 100,
  offset = 0,
): Payment[] {
  if (status) {
    return db
      .prepare('SELECT * FROM payments WHERE org_id = ? AND status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .all(auth.orgId, status, limit, offset) as Payment[];
  }
  return db
    .prepare('SELECT * FROM payments WHERE org_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?')
    .all(auth.orgId, limit, offset) as Payment[];
}

export function countPayments(auth: AuthContext, status?: string): number {
  if (status) {
    return (db
      .prepare('SELECT COUNT(*) as count FROM payments WHERE org_id = ? AND status = ?')
      .get(auth.orgId, status) as { count: number }).count;
  }
  return (db
    .prepare('SELECT COUNT(*) as count FROM payments WHERE org_id = ?')
    .get(auth.orgId) as { count: number }).count;
}

export function getPayment(auth: AuthContext, id: string): Payment | undefined {
  // Always filter by org_id — org-isolation at the query level
  return db
    .prepare('SELECT * FROM payments WHERE id = ? AND org_id = ?')
    .get(id, auth.orgId) as Payment | undefined;
}

// ─── Create ───────────────────────────────────────────────────────────────────
export function createPayment(
  auth: AuthContext,
  body: {
    amount: string;
    currency?: string;
    beneficiary_name: string;
    wallet_address: string;
    country?: string;
    reference?: string;
    idempotency_key?: string;
  },
): Payment {
  // Idempotency check — parameterized query, org-scoped
  if (body.idempotency_key) {
    const existing = db
      .prepare('SELECT * FROM payments WHERE idempotency_key = ? AND org_id = ?')
      .get(body.idempotency_key, auth.orgId) as Payment | undefined;
    if (existing) return existing;
  }

  const id  = `pay_${uuid().replace(/-/g, '').slice(0, 12)}`;
  const now = new Date().toISOString();

  // Defense-in-depth sanitization (inputs already Zod-validated by route layer)
  const safeName    = sanitizeString(body.beneficiary_name);
  const safeRef     = body.reference ? sanitizeString(body.reference) : null;
  const safeAddress = body.wallet_address.toLowerCase();

  db.prepare(`
    INSERT INTO payments(
      id, org_id, beneficiary_name, wallet_address, amount, currency,
      status, network, reference, fee_usdc, idempotency_key, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, auth.orgId, safeName, safeAddress,
    body.amount, body.currency ?? 'USDC',
    'processing', 'arc',
    safeRef, '0.001',
    body.idempotency_key ?? null,
    now, now,
  );

  const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(id) as Payment;
  addAuditLog(auth, 'payment.created', 'payment', id, { amount: body.amount });
  emitWebhook(auth.orgId, 'payment.created', payment);
  return payment;
}

// ─── Status transition ────────────────────────────────────────────────────────
export function transitionPayment(
  auth: AuthContext,
  id: string,
  to: PaymentStatus,
): Payment {
  const payment = getPayment(auth, id); // org-isolated read
  if (!payment) throw new Error('Payment not found');

  const allowed = VALID_TRANSITIONS[payment.status] ?? [];
  if (!allowed.includes(to)) {
    throw new Error(
      `Invalid transition: ${payment.status} → ${to}. ` +
      `Allowed: [${allowed.join(', ')}]`,
    );
  }

  const now = new Date().toISOString();
  db.prepare('UPDATE payments SET status = ?, updated_at = ? WHERE id = ? AND org_id = ?')
    .run(to, now, id, auth.orgId);

  const updated = db.prepare('SELECT * FROM payments WHERE id = ?').get(id) as Payment;
  addAuditLog(auth, `payment.${to}`, 'payment', id);
  emitWebhook(auth.orgId, `payment.${to}`, updated);
  return updated;
}
