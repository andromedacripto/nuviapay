/**
 * Nuvia — Payments routes (security-hardened)
 *
 * All inputs validated with Zod before reaching service layer.
 * Org-isolation enforced on every read.
 * Payment creation rate-limited separately.
 * Idempotency keys enforced.
 */
import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware.js';
import { paymentCreateRateLimiter } from '../security.js';
import {
  validate, validateParams, validateQuery,
  CreatePaymentSchema, PaymentStatusPatchSchema,
  RecordTransactionSchema, PaginationSchema,
} from '../validation.js';
import {
  listPayments, countPayments, getPayment,
  createPayment, transitionPayment,
} from '../services/payment.service.js';
import {
  createTransaction, confirmTransaction, getTransactionByPaymentId,
} from '../services/transaction.service.js';
import type { PaymentStatus } from '../types.js';

export const paymentsRouter = Router();

// ── GET /v1/payments ─────────────────────────────────────────────────────────
paymentsRouter.get('/', requireAuth, (req, res) => {
  const query = validateQuery(PaginationSchema, req, res);
  if (!query) return;

  const payments = listPayments(req.auth!, query.status, query.limit, query.offset);
  const total    = countPayments(req.auth!, query.status);
  res.json({ payments, total });
});

// ── GET /v1/payments/:id ──────────────────────────────────────────────────────
paymentsRouter.get('/:id', requireAuth, (req, res) => {
  const id = validateParams(req, res, 'id');
  if (!id) return;

  const payment = getPayment(req.auth!, id);
  if (!payment) { res.status(404).json({ error: 'Payment not found' }); return; }

  const transaction = getTransactionByPaymentId(payment.id);
  res.json({ data: { payment, transaction: transaction ?? null } });
});

// ── POST /v1/payments ─────────────────────────────────────────────────────────
paymentsRouter.post(
  '/',
  requireAuth,
  requireRole('owner', 'admin', 'finance'),
  paymentCreateRateLimiter,
  (req, res) => {
    const body = validate(CreatePaymentSchema, req.body, res);
    if (!body) return;

    try {
      const payment = createPayment(req.auth!, body);
      res.status(201).json({ data: payment });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Payment creation failed';
      res.status(400).json({ error: msg });
    }
  },
);

// ── PATCH /v1/payments/:id/status ─────────────────────────────────────────────
paymentsRouter.patch(
  '/:id/status',
  requireAuth,
  requireRole('owner', 'admin', 'finance'),
  (req, res) => {
    const id = validateParams(req, res, 'id');
    if (!id) return;

    const body = validate(PaymentStatusPatchSchema, req.body, res);
    if (!body) return;

    try {
      const payment = transitionPayment(req.auth!, id, body.status as PaymentStatus);
      res.json({ data: payment });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Status transition failed';
      res.status(400).json({ error: msg });
    }
  },
);

// ── POST /v1/payments/:id/transaction ────────────────────────────────────────
paymentsRouter.post(
  '/:id/transaction',
  requireAuth,
  requireRole('owner', 'admin', 'finance'),
  (req, res) => {
    const id = validateParams(req, res, 'id');
    if (!id) return;

    const payment = getPayment(req.auth!, id);
    if (!payment) { res.status(404).json({ error: 'Payment not found' }); return; }

    const body = validate(RecordTransactionSchema, req.body, res);
    if (!body) return;

    try {
      const tx = createTransaction(req.auth!, payment.id, body);
      // Auto-advance to submitted
      try { transitionPayment(req.auth!, payment.id, 'submitted'); } catch (_) { /* already at target */ }
      res.status(201).json({ data: tx });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to record transaction';
      res.status(400).json({ error: msg });
    }
  },
);

// ── POST /v1/payments/:id/confirm ─────────────────────────────────────────────
paymentsRouter.post(
  '/:id/confirm',
  requireAuth,
  requireRole('owner', 'admin', 'finance'),
  (req, res) => {
    const id = validateParams(req, res, 'id');
    if (!id) return;

    const payment = getPayment(req.auth!, id);
    if (!payment) { res.status(404).json({ error: 'Payment not found' }); return; }

    try {
      const tx = getTransactionByPaymentId(payment.id);
      if (tx) confirmTransaction(tx.id);
      const updated = transitionPayment(req.auth!, payment.id, 'confirmed');
      res.json({ data: updated });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Confirmation failed';
      res.status(400).json({ error: msg });
    }
  },
);
