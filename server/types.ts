/** Nuvia — shared server types */

export type PaymentStatus =
  | 'draft'
  | 'quoted'
  | 'pending_approval'
  | 'processing'
  | 'submitted'
  | 'confirmed'
  | 'failed'
  | 'cancelled';

export interface Organization {
  id: string;
  name: string;
  plan: string;
  created_at: string;
}

export interface User {
  id: string;
  org_id: string;
  email: string;
  role: string;
  created_at: string;
}

export interface Beneficiary {
  id: string;
  org_id: string;
  name: string;
  company: string | null;
  wallet_address: string;
  country: string;
  label: string | null;
  is_active: number;
  created_at: string;
}

export interface Payment {
  id: string;
  org_id: string;
  beneficiary_id: string | null;
  beneficiary_name: string;
  wallet_address: string;
  amount: string;
  currency: string;
  status: PaymentStatus;
  network: string;
  reference: string | null;
  fee_usdc: string;
  idempotency_key: string | null;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  payment_id: string;
  org_id: string;
  tx_hash: string | null;
  from_address: string | null;
  to_address: string | null;
  amount: string;
  fee_usdc: string | null;
  status: string;
  confirmations: number;
  confirmed_at: string | null;
  created_at: string;
}

export interface WalletRow {
  id: string;
  org_id: string;
  address: string | null;
  network: string;
  is_primary: number;
  created_at: string;
}

export interface BalanceRow {
  id: string;
  wallet_id: string;
  usdc_balance: string;
  last_synced_at: string | null;
}

export interface AuditLog {
  id: string;
  org_id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata: string | null;
  created_at: string;
}

export interface WebhookEvent {
  id: string;
  org_id: string;
  event_type: string;
  payload: string;
  delivered: number;
  created_at: string;
}
