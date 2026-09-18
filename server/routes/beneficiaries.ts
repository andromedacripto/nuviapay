/**
 * Nuvia — Beneficiaries routes (security-hardened)
 */
import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware.js';
import {
  validate, validateParams,
  CreateBeneficiarySchema, UpdateBeneficiarySchema,
} from '../validation.js';
import {
  listBeneficiaries, getBeneficiary, createBeneficiary,
  updateBeneficiary, disableBeneficiary, getBeneficiaryPayments,
} from '../services/beneficiary.service.js';

export const beneficiariesRouter = Router();

// GET /v1/beneficiaries
beneficiariesRouter.get('/', requireAuth, (req, res) => {
  const withInactive = req.query.include_inactive === 'true';
  const items = listBeneficiaries(req.auth!, withInactive);
  res.json({ data: items });
});

// GET /v1/beneficiaries/:id
beneficiariesRouter.get('/:id', requireAuth, (req, res) => {
  const id = validateParams(req, res, 'id');
  if (!id) return;

  const ben = getBeneficiary(req.auth!, id);
  if (!ben) { res.status(404).json({ error: 'Beneficiary not found' }); return; }
  res.json({ data: ben });
});

// POST /v1/beneficiaries
beneficiariesRouter.post(
  '/',
  requireAuth,
  requireRole('owner', 'admin', 'finance'),
  (req, res) => {
    const body = validate(CreateBeneficiarySchema, req.body, res);
    if (!body) return;

    try {
      const ben = createBeneficiary(req.auth!, body);
      res.status(201).json({ data: ben });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to create beneficiary';
      res.status(400).json({ error: msg });
    }
  },
);

// PATCH /v1/beneficiaries/:id
beneficiariesRouter.patch(
  '/:id',
  requireAuth,
  requireRole('owner', 'admin', 'finance'),
  (req, res) => {
    const id = validateParams(req, res, 'id');
    if (!id) return;

    const body = validate(UpdateBeneficiarySchema, req.body, res);
    if (!body) return;

    try {
      const ben = updateBeneficiary(req.auth!, id, body as Record<string, string>);
      res.json({ data: ben });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Update failed';
      res.status(400).json({ error: msg });
    }
  },
);

// DELETE /v1/beneficiaries/:id
beneficiariesRouter.delete(
  '/:id',
  requireAuth,
  requireRole('owner', 'admin'),
  (req, res) => {
    const id = validateParams(req, res, 'id');
    if (!id) return;

    try {
      const ben = disableBeneficiary(req.auth!, id);
      res.json({ data: ben });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Operation failed';
      res.status(400).json({ error: msg });
    }
  },
);

// GET /v1/beneficiaries/:id/payments
beneficiariesRouter.get('/:id/payments', requireAuth, (req, res) => {
  const id = validateParams(req, res, 'id');
  if (!id) return;

  // Confirm beneficiary belongs to org before listing payments
  const ben = getBeneficiary(req.auth!, id);
  if (!ben) { res.status(404).json({ error: 'Beneficiary not found' }); return; }

  const payments = getBeneficiaryPayments(req.auth!, id);
  res.json({ data: payments });
});
