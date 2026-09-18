/** Nuvia — Transaction service */
import { v4 as uuid } from 'uuid';
import db from '../db.js';
import type { AuthContext } from '../middleware.js';
import type { Transaction } from '../types.js';

export function createTransaction(
  auth: AuthContext,
  paymentId: string,
  data: { tx_hash: string; from_address: string; to_address: string; amount: string },
): Transaction {
  const id = `tx_${uuid().replace(/-/g,'').slice(0,12)}`;
  db.prepare(`
    INSERT INTO transactions(id,payment_id,org_id,tx_hash,from_address,to_address,amount,status,confirmations)
    VALUES(?,?,?,?,?,?,?,'submitted',0)
  `).run(id, paymentId, auth.orgId, data.tx_hash, data.from_address, data.to_address, data.amount);
  return db.prepare('SELECT * FROM transactions WHERE id = ?').get(id) as Transaction;
}

export function confirmTransaction(id: string): void {
  const now = new Date().toISOString();
  db.prepare(`UPDATE transactions SET status='confirmed', confirmations=1, confirmed_at=? WHERE id=?`)
    .run(now, id);
}

export function getTransactionByPaymentId(paymentId: string): Transaction | undefined {
  return db.prepare('SELECT * FROM transactions WHERE payment_id = ? ORDER BY created_at DESC LIMIT 1')
    .get(paymentId) as Transaction | undefined;
}

export function listTransactions(orgId: string, limit = 50): Transaction[] {
  return db.prepare('SELECT * FROM transactions WHERE org_id = ? ORDER BY created_at DESC LIMIT ?')
    .all(orgId, limit) as Transaction[];
}
