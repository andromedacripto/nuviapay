/** Nuvia — Wallet / balance service */
import db from '../db.js';
import type { WalletRow, BalanceRow } from '../types.js';

export function getOrgWallet(orgId: string): (WalletRow & { usdc_balance: string; last_synced_at: string | null }) | undefined {
  return db.prepare(`
    SELECT w.*, b.usdc_balance, b.last_synced_at
    FROM wallets w
    LEFT JOIN balances b ON b.wallet_id = w.id
    WHERE w.org_id = ? AND w.is_primary = 1
    ORDER BY w.created_at DESC LIMIT 1
  `).get(orgId) as (WalletRow & { usdc_balance: string; last_synced_at: string | null }) | undefined;
}

export function syncBalance(orgId: string, usdcBalance: string): void {
  const wallet = db.prepare('SELECT id FROM wallets WHERE org_id = ? AND is_primary = 1').get(orgId) as { id: string } | undefined;
  if (!wallet) return;
  db.prepare('UPDATE balances SET usdc_balance = ?, last_synced_at = datetime(\'now\') WHERE wallet_id = ?')
    .run(usdcBalance, wallet.id);
}

export function updateWalletAddress(orgId: string, address: string): void {
  db.prepare('UPDATE wallets SET address = ? WHERE org_id = ? AND is_primary = 1').run(address, orgId);
}
