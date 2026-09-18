/** Nuvia — Audit log service */
import { v4 as uuid } from 'uuid';
import db from '../db.js';
import type { AuthContext } from '../middleware.js';
import type { AuditLog } from '../types.js';

export function addAuditLog(
  auth: AuthContext,
  action: string,
  entityType: string,
  entityId: string,
  metadata?: Record<string, unknown>,
): void {
  db.prepare(`
    INSERT INTO audit_logs(id,org_id,user_id,action,entity_type,entity_id,metadata)
    VALUES(?,?,?,?,?,?,?)
  `).run(
    `al_${uuid().replace(/-/g,'').slice(0,12)}`,
    auth.orgId,
    auth.userId,
    action,
    entityType,
    entityId,
    metadata ? JSON.stringify(metadata) : null,
  );
}

export function listAuditLogs(orgId: string, limit = 50): AuditLog[] {
  return db.prepare('SELECT * FROM audit_logs WHERE org_id = ? ORDER BY created_at DESC LIMIT ?')
    .all(orgId, limit) as AuditLog[];
}
