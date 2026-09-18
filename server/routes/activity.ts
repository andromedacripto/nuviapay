/**
 * Nuvia — Activity routes
 */
import { Router } from 'express';
import { requireAuth } from '../middleware.js';
import { listAuditLogs } from '../services/audit.service.js';
import { listTransactions } from '../services/transaction.service.js';

export const activityRouter = Router();

// GET /v1/activity
activityRouter.get('/', requireAuth, (req, res) => {
  const limit = Math.min(parseInt(String(req.query.limit ?? 50)), 200);
  const logs = listAuditLogs(req.auth!.orgId, limit);
  res.json({ data: logs, total: logs.length });
});

// GET /v1/activity/transactions
activityRouter.get('/transactions', requireAuth, (req, res) => {
  const limit = Math.min(parseInt(String(req.query.limit ?? 50)), 200);
  const txs = listTransactions(req.auth!.orgId, limit);
  res.json({ data: txs });
});
