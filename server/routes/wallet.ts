/**
 * Nuvia — Wallet routes (security-hardened)
 */
import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware.js';
import { validate, SyncBalanceSchema, SyncAddressSchema } from '../validation.js';
import { getOrgWallet, syncBalance, updateWalletAddress } from '../services/wallet.service.js';

export const walletRouter = Router();

// GET /v1/wallet/balance
walletRouter.get('/balance', requireAuth, (req, res) => {
  const wallet = getOrgWallet(req.auth!.orgId);
  if (!wallet) {
    res.json({
      data: {
        usdc_balance:      '0',
        available_balance: '0',
        on_chain_balance:  '0',
        wallet_address:    null,
        network:           'arc',
        last_synced_at:    null,
      },
    });
    return;
  }

  const balance = wallet.usdc_balance ?? '0';
  res.json({
    data: {
      usdc_balance:      balance,
      available_balance: balance,
      on_chain_balance:  balance,
      wallet_address:    wallet.address ?? null,
      network:           wallet.network,
      last_synced_at:    wallet.last_synced_at ?? null,
    },
  });
});

// POST /v1/wallet/sync-balance — update on-chain balance after wallet read
walletRouter.post(
  '/sync-balance',
  requireAuth,
  requireRole('owner', 'admin'),
  (req, res) => {
    const body = validate(SyncBalanceSchema, req.body, res);
    if (!body) return;

    syncBalance(req.auth!.orgId, body.usdc_balance);
    res.json({ success: true });
  },
);

// PATCH /v1/wallet/address — record connected wallet address
walletRouter.patch(
  '/address',
  requireAuth,
  requireRole('owner', 'admin'),
  (req, res) => {
    const body = validate(SyncAddressSchema, req.body, res);
    if (!body) return;

    updateWalletAddress(req.auth!.orgId, body.address.toLowerCase());
    res.json({ success: true });
  },
);

// GET /v1/wallet/network-status
walletRouter.get('/network-status', requireAuth, (_req, res) => {
  res.json({
    data: {
      status:    'operational',
      network:   'arc',
      latency:   42,
      blockTime: '< 1 second',
    },
  });
});
