/** Nuvia — Payment Keys routes */
import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware.js';
import {
  listPaymentKeys, createPaymentKey, deletePaymentKey, resolveKey, detectKeyType,
} from '../services/payment-keys.service.js';

export const paymentKeysRouter = Router();

// GET /v1/keys — list my org's keys
paymentKeysRouter.get('/', requireAuth, (req, res) => {
  res.json({ data: listPaymentKeys(req.auth!.orgId) });
});

// POST /v1/keys/resolve — resolve any key to wallet address (no auth needed for paying)
paymentKeysRouter.post('/resolve', (req, res) => {
  const { key } = req.body as { key?: string };
  if (!key || typeof key !== 'string') {
    res.status(400).json({ error: 'key is required' });
    return;
  }
  const result = resolveKey(key);
  if (!result) {
    res.status(404).json({ error: 'KEY_NOT_FOUND', message: 'No wallet found for this key' });
    return;
  }
  res.json({
    data: {
      key_value: result.key_value,
      key_type: result.key_type,
      wallet_address: result.wallet_address,
      label: result.label,
    },
  });
});

// POST /v1/keys — register a new key
paymentKeysRouter.post('/', requireAuth, requireRole('owner', 'admin', 'finance'), (req, res) => {
  const body = req.body as {
    key_value?: string;
    key_type?: string;
    wallet_address?: string;
    label?: string;
  };
  if (!body.key_value || !body.wallet_address) {
    res.status(400).json({ error: 'key_value and wallet_address are required' });
    return;
  }
  const key_type = (body.key_type as 'email' | 'cnpj' | 'cpf' | 'phone' | 'custom')
    ?? detectKeyType(body.key_value);

  try {
    const key = createPaymentKey(req.auth!, {
      key_type,
      key_value: body.key_value,
      wallet_address: body.wallet_address,
      label: body.label,
    });
    res.status(201).json({ data: key });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to create key';
    res.status(409).json({ error: msg });
  }
});

// DELETE /v1/keys/:id — deactivate a key
paymentKeysRouter.delete('/:id', requireAuth, requireRole('owner', 'admin'), (req, res) => {
  try {
    deletePaymentKey(req.auth!, req.params.id);
    res.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to delete key';
    res.status(404).json({ error: msg });
  }
});
