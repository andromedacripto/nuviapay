/**
 * Nuvia — typed API client
 * All requests go through Vite's /api proxy → localhost:3001
 */

export interface Payment {
  id: string;
  org_id: string;
  beneficiary_id: string | null;
  beneficiary_name: string;
  wallet_address: string;
  amount: string;
  currency: string;
  status: string;
  network: string;
  reference: string | null;
  fee_usdc: string;
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

export interface WalletData {
  usdc_balance: string;
  available_balance: string;
  on_chain_balance: string;
  wallet_address: string | null;
  network: string;
  last_synced_at: string | null;
}

export interface PaymentStats {
  totalVolume: number;
  confirmed: number;
  processing: number;
  pending: number;
  failed: number;
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

// In dev, Vite proxies /api → localhost:3001 (strips /api prefix).
// In production (Railway), Express serves frontend + API on the same port — use /v1 directly.
const BASE = import.meta.env.PROD ? '/v1' : '/api/v1';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// Payments API
export const paymentsApi = {
  list: (status?: string) =>
    request<{ payments: Payment[]; total: number }>(`/payments${status ? `?status=${status}` : ''}`),

  get: (id: string) =>
    request<{ data: { payment: Payment; transaction: Transaction | null } }>(`/payments/${id}`),

  create: (body: {
    amount: string;
    currency: string;
    beneficiary_name: string;
    wallet_address: string;
    country?: string;
    reference?: string;
    idempotency_key?: string;
  }) => request<{ data: Payment }>('/payments', { method: 'POST', body: JSON.stringify(body) }),

  transition: (id: string, status: string) =>
    request<{ data: Payment }>(`/payments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  recordTransaction: (paymentId: string, tx: { tx_hash: string; from_address: string; to_address: string; amount: string }) =>
    request<{ data: Transaction }>(`/payments/${paymentId}/transaction`, {
      method: 'POST',
      body: JSON.stringify(tx),
    }),

  stats: async (): Promise<PaymentStats> => {
    const res = await request<{ payments: Payment[]; total: number }>('/payments');
    const payments = res.payments;
    const totalVolume = payments.filter(p => p.status === 'confirmed').reduce((acc, p) => acc + parseFloat(p.amount), 0);
    return {
      totalVolume,
      confirmed: payments.filter(p => p.status === 'confirmed').length,
      processing: payments.filter(p => p.status === 'processing' || p.status === 'submitted').length,
      pending: payments.filter(p => p.status === 'pending_approval' || p.status === 'quoted' || p.status === 'draft').length,
      failed: payments.filter(p => p.status === 'failed' || p.status === 'cancelled').length,
    };
  },
};

// Beneficiaries API
export const beneficiariesApi = {
  list: () =>
    request<{ data: Beneficiary[] }>('/beneficiaries'),

  create: (body: { name: string; wallet_address: string; company?: string; country?: string; label?: string }) =>
    request<{ data: Beneficiary }>('/beneficiaries', { method: 'POST', body: JSON.stringify(body) }),

  update: (id: string, body: Record<string, string>) =>
    request<{ data: Beneficiary }>(`/beneficiaries/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  disable: (id: string) =>
    request<{ data: Beneficiary }>(`/beneficiaries/${id}`, { method: 'DELETE' }),

  payments: (id: string) =>
    request<{ data: Payment[] }>(`/beneficiaries/${id}/payments`),
};

// Wallet API
export const walletApi = {
  balance: () =>
    request<{ data: WalletData }>('/wallet/balance'),

  networkStatus: () =>
    request<{ data: { status: string; latency: number; blockTime: string } }>('/wallet/network-status'),

  syncBalance: (usdcBalance: string) =>
    request<{ success: boolean }>('/wallet/sync-balance', { method: 'POST', body: JSON.stringify({ usdc_balance: usdcBalance }) }),

  syncAddress: (address: string) =>
    request<{ success: boolean }>('/wallet/address', { method: 'PATCH', body: JSON.stringify({ address }) }),
};

// Activity API
export const activityApi = {
  list: () =>
    request<{ data: AuditLog[]; total: number }>('/activity'),

  transactions: () =>
    request<{ data: Transaction[] }>('/activity/transactions'),
};
