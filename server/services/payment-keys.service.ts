/** Nuvia — Payment Keys service (Pix-like key resolution) */
import db from '../db.js';
import { v4 as uuid } from 'uuid';
import { logAudit } from './audit.service.js';
import type { AuthContext } from '../types.js';

export interface PaymentKey {
  id: string;
  org_id: string;
  key_type: 'email' | 'cnpj' | 'cpf' | 'phone' | 'custom';
  key_value: string;
  label: string | null;
  wallet_address: string;
  is_active: number;
  created_at: string;
}

export function listPaymentKeys(orgId: string): PaymentKey[] {
  return db.prepare(
    'SELECT * FROM payment_keys WHERE org_id = ? ORDER BY created_at DESC'
  ).all(orgId) as PaymentKey[];
}

export function getPaymentKey(id: string, orgId: string): PaymentKey | undefined {
  return db.prepare(
    'SELECT * FROM payment_keys WHERE id = ? AND org_id = ?'
  ).get(id, orgId) as PaymentKey | undefined;
}

/** Resolve any key value (email, CNPJ, etc.) to a wallet address — cross-org */
export function resolveKey(keyValue: string): PaymentKey | undefined {
  const normalized = normalizeKey(keyValue);
  return db.prepare(
    'SELECT * FROM payment_keys WHERE key_value = ? AND is_active = 1'
  ).get(normalized) as PaymentKey | undefined;
}

export function createPaymentKey(
  auth: AuthContext,
  data: {
    key_type: PaymentKey['key_type'];
    key_value: string;
    wallet_address: string;
    label?: string;
  }
): PaymentKey {
  const normalized = normalizeKey(data.key_value);
  const existing = db.prepare(
    'SELECT id FROM payment_keys WHERE key_value = ? AND is_active = 1'
  ).get(normalized);
  if (existing) throw new Error('KEY_ALREADY_REGISTERED');

  const id = `key_${uuid().replace(/-/g, '').slice(0, 12)}`;
  db.prepare(`
    INSERT INTO payment_keys (id, org_id, key_type, key_value, label, wallet_address, is_active)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `).run(id, auth.orgId, data.key_type, normalized, data.label ?? null, data.wallet_address);

  logAudit(auth, 'payment_key.created', 'payment_key', id, { key_type: data.key_type });
  return getPaymentKey(id, auth.orgId)!;
}

export function deletePaymentKey(auth: AuthContext, id: string): void {
  const key = getPaymentKey(id, auth.orgId);
  if (!key) throw new Error('NOT_FOUND');
  db.prepare('UPDATE payment_keys SET is_active = 0 WHERE id = ? AND org_id = ?')
    .run(id, auth.orgId);
  logAudit(auth, 'payment_key.deleted', 'payment_key', id, {});
}

// ── Normalization ─────────────────────────────────────────────────────────────

export function normalizeKey(raw: string): string {
  const s = raw.trim().toLowerCase();
  // CNPJ: strip formatting
  if (/^\d{2}[\.\-\/]?\d{3}[\.\-\/]?\d{3}[\.\-\/]?\d{4}[\.\-\/]?\d{2}$/.test(s.replace(/\D/g, ''))) {
    return s.replace(/\D/g, '');
  }
  return s;
}

export function detectKeyType(value: string): PaymentKey['key_type'] {
  const s = value.trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return 'email';
  const digits = s.replace(/\D/g, '');
  if (digits.length === 14) return 'cnpj';
  if (digits.length === 11 && !s.includes('@')) return 'cpf';
  if (digits.length >= 10 && digits.length <= 13) return 'phone';
  return 'custom';
}
