/**
 * Nuvia — Auth & authorization middleware
 *
 * DEMO MODE: every request is pre-authenticated as the demo org owner.
 * PRODUCTION: replace requireAuth with JWT/session verification and
 * look up the org from the verified token — never trust client-supplied org IDs.
 *
 * RBAC matrix:
 *   owner   — full access (all operations)
 *   admin   — all except billing/org deletion
 *   finance — create/read payments, manage beneficiaries
 *   viewer  — read-only on all resources
 */
import type { Request, Response, NextFunction } from 'express';

export interface AuthContext {
  orgId:  string;
  userId: string;
  role:   'owner' | 'admin' | 'finance' | 'viewer';
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

/**
 * In demo mode every request is pre-authenticated as the demo org owner.
 * In production: verify Bearer JWT, load user from DB, set req.auth.
 * NEVER trust the client to supply orgId — always derive it from the token.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  // Demo: hardcoded demo org + owner role.
  // Production: parse req.headers.authorization, verify JWT, fetch from DB.
  req.auth = { orgId: 'org_demo', userId: 'mem_01', role: 'owner' };
  next();
}

/**
 * Require the authenticated user to hold one of the given roles.
 * Returns 401 if not authenticated, 403 if role is insufficient.
 */
export function requireRole(...roles: Array<AuthContext['role']>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    if (!roles.includes(req.auth.role)) {
      res.status(403).json({ error: 'Insufficient permissions for this action' });
      return;
    }
    next();
  };
}

/**
 * Read-only guard: viewers and above may read; finance, admin, owner may write.
 * Use requireRole('owner','admin','finance') on mutating endpoints explicitly.
 */
export function requireReadAccess(req: Request, res: Response, next: NextFunction): void {
  if (!req.auth) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  // All defined roles have read access
  const defined: Array<AuthContext['role']> = ['owner', 'admin', 'finance', 'viewer'];
  if (!defined.includes(req.auth.role)) {
    res.status(403).json({ error: 'Unknown role' });
    return;
  }
  next();
}
