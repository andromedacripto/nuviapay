/**
 * Nuvia — Beneficiary service
 *
 * All DB queries use parameterized statements.
 * Org-isolation enforced at the query level (every statement filters by org_id).
 * Wallet addresses are stored lowercase-normalized.
 */
import { v4 as uuid } from 'uuid';
import db from '../db.js';
import type { AuthContext } from '../middleware.js';
import type { Beneficiary } from '../types.js';
import { addAuditLog } from './audit.service.js';
import { sanitizeString } from '../security.js';

export function listBeneficiaries(auth: AuthContext, includeInactive = false): Beneficiary[] {
  if (includeInactive) {
    return db
      .prepare('SELECT * FROM beneficiaries WHERE org_id = ? ORDER BY name ASC')
      .all(auth.orgId) as Beneficiary[];
  }
  return db
    .prepare('SELECT * FROM beneficiaries WHERE org_id = ? AND is_active = 1 ORDER BY name ASC')
    .all(auth.orgId) as Beneficiary[];
}

export function getBeneficiary(auth: AuthContext, id: string): Beneficiary | undefined {
  // org_id filter prevents cross-org enumeration
  return db
    .prepare('SELECT * FROM beneficiaries WHERE id = ? AND org_id = ?')
    .get(id, auth.orgId) as Beneficiary | undefined;
}

export function createBeneficiary(
  auth: AuthContext,
  body: {
    name: string;
    wallet_address: string;
    company?: string;
    country?: string;
    label?: string;
  },
): Beneficiary {
  const id = `ben_${uuid().replace(/-/g, '').slice(0, 12)}`;

  db.prepare(`
    INSERT INTO beneficiaries(id, org_id, name, company, wallet_address, country, label)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    auth.orgId,
    sanitizeString(body.name),
    body.company ? sanitizeString(body.company) : null,
    body.wallet_address.toLowerCase(),
    body.country ?? 'US',
    body.label ? sanitizeString(body.label) : null,
  );

  addAuditLog(auth, 'beneficiary.created', 'beneficiary', id);
  return db.prepare('SELECT * FROM beneficiaries WHERE id = ?').get(id) as Beneficiary;
}

export function updateBeneficiary(
  auth: AuthContext,
  id: string,
  body: Record<string, string>,
): Beneficiary {
  const ben = getBeneficiary(auth, id);
  if (!ben) throw new Error('Beneficiary not found');

  // Only update fields that were provided; all via parameterized queries
  db.prepare(`
    UPDATE beneficiaries
    SET
      name           = COALESCE(?, name),
      company        = COALESCE(?, company),
      wallet_address = COALESCE(?, wallet_address),
      country        = COALESCE(?, country),
      label          = COALESCE(?, label)
    WHERE id = ? AND org_id = ?
  `).run(
    body.name           ? sanitizeString(body.name)           : null,
    body.company        ? sanitizeString(body.company)        : null,
    body.wallet_address ? body.wallet_address.toLowerCase()   : null,
    body.country        ?? null,
    body.label          ? sanitizeString(body.label)          : null,
    id,
    auth.orgId,
  );

  addAuditLog(auth, 'beneficiary.updated', 'beneficiary', id);
  return db.prepare('SELECT * FROM beneficiaries WHERE id = ?').get(id) as Beneficiary;
}

export function disableBeneficiary(auth: AuthContext, id: string): Beneficiary {
  const ben = getBeneficiary(auth, id);
  if (!ben) throw new Error('Beneficiary not found');

  db.prepare('UPDATE beneficiaries SET is_active = 0 WHERE id = ? AND org_id = ?')
    .run(id, auth.orgId);

  addAuditLog(auth, 'beneficiary.disabled', 'beneficiary', id);
  return db.prepare('SELECT * FROM beneficiaries WHERE id = ?').get(id) as Beneficiary;
}

export function getBeneficiaryPayments(auth: AuthContext, beneficiaryId: string): object[] {
  return db
    .prepare('SELECT * FROM payments WHERE org_id = ? AND beneficiary_id = ? ORDER BY created_at DESC LIMIT 20')
    .all(auth.orgId, beneficiaryId) as object[];
}
