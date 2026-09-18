import { useState } from 'react';
import { Code2, Copy, Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const ENDPOINTS = [
  {
    method: 'POST',
    path: '/v1/payments',
    description: 'Create a new payment',
    request: `{
  "amount": "10000.00",
  "currency": "USDC",
  "beneficiary_name": "Jane Smith",
  "wallet_address": "0x...",
  "reference": "INV-2026-001",
  "idempotency_key": "idk_unique_key"
}`,
    response: `{
  "data": {
    "id": "pay_abc123",
    "status": "processing",
    "amount": "10000.00",
    "currency": "USDC",
    "network": "arc-testnet",
    "beneficiary_name": "Jane Smith",
    "created_at": "2026-09-18T10:00:00Z"
  }
}`,
  },
  {
    method: 'GET',
    path: '/v1/payments/:id',
    description: 'Retrieve a payment by ID',
    request: null,
    response: `{
  "data": {
    "payment": { "id": "pay_abc123", "status": "confirmed", ... },
    "transaction": { "tx_hash": "0x...", "confirmations": 1 }
  }
}`,
  },
  {
    method: 'GET',
    path: '/v1/payments',
    description: 'List all payments',
    request: null,
    response: `{
  "payments": [...],
  "total": 42
}`,
  },
  {
    method: 'POST',
    path: '/v1/beneficiaries',
    description: 'Create a beneficiary',
    request: `{
  "name": "Jane Smith",
  "company": "Acme Corp",
  "wallet_address": "0x...",
  "country": "US"
}`,
    response: `{
  "data": {
    "id": "ben_xyz789",
    "name": "Jane Smith",
    "is_active": 1
  }
}`,
  },
  {
    method: 'GET',
    path: '/v1/beneficiaries',
    description: 'List beneficiaries',
    request: null,
    response: `{
  "data": [{ "id": "ben_xyz789", "name": "Jane Smith", ... }]
}`,
  },
  {
    method: 'GET',
    path: '/v1/wallet/balance',
    description: 'Get USDC balance',
    request: null,
    response: `{
  "data": {
    "usdc_balance": "1250.000000",
    "available_balance": "1250.000000",
    "wallet_address": "0x...",
    "network": "arc-testnet"
  }
}`,
  },
  {
    method: 'GET',
    path: '/v1/webhooks/events',
    description: 'List webhook events',
    request: null,
    response: `{
  "data": [{
    "id": "wh_abc",
    "event_type": "payment.confirmed",
    "payload": { ... }
  }]
}`,
  },
];

const WEBHOOK_EVENTS = [
  'payment.created',
  'payment.processing',
  'payment.submitted',
  'payment.confirmed',
  'payment.failed',
];

const METHOD_COLORS: Record<string, string> = {
  GET:    'bg-[var(--success-bg)] text-[var(--success)]',
  POST:   'bg-[var(--blue-bg)] text-[var(--blue)]',
  PATCH:  'bg-[var(--warning-bg)] text-[var(--warning)]',
  DELETE: 'bg-[var(--danger-bg)] text-[var(--danger)]',
};

export default function ApiDocsPage() {
  const [selected, setSelected] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  const ep = ENDPOINTS[selected];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="display text-xl font-semibold text-[var(--ink)] tracking-tight">API Reference</h2>
        <p className="text-sm text-[var(--muted)] mt-0.5">REST API for B2B integrations</p>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--surface-muted)]">
            <p className="text-xs font-semibold text-[var(--subtle)] label-caps">Endpoints</p>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {ENDPOINTS.map((e, i) => (
              <button
                key={e.path}
                onClick={() => setSelected(i)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                  selected === i ? 'bg-[var(--surface-muted)]' : 'hover:bg-[var(--surface-muted)]'
                )}
              >
                <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0', METHOD_COLORS[e.method])}>
                  {e.method}
                </span>
                <span className="mono text-xs text-[var(--ink)] truncate">{e.path}</span>
                {selected === i && <ChevronRight size={12} className="text-[var(--subtle)] ml-auto shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {/* Detail */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className={cn('text-xs font-bold px-2 py-1 rounded', METHOD_COLORS[ep.method])}>
                {ep.method}
              </span>
              <code className="mono text-sm text-[var(--ink)]">{ep.path}</code>
            </div>
            <p className="text-sm text-[var(--muted)]">{ep.description}</p>
          </div>

          {ep.request && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface-muted)]">
                <span className="text-xs font-semibold text-[var(--subtle)] label-caps">Request body</span>
                <button onClick={() => void copy(ep.request, 'req')} className="p-1 rounded text-[var(--subtle)] hover:text-[var(--ink)] transition-colors">
                  {copied === 'req' ? <Check size={12} className="text-[var(--success)]" /> : <Copy size={12} />}
                </button>
              </div>
              <pre className="mono text-xs text-[var(--ink)] p-4 overflow-x-auto leading-relaxed">{ep.request}</pre>
            </div>
          )}

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface-muted)]">
              <span className="text-xs font-semibold text-[var(--subtle)] label-caps">Response</span>
              <button onClick={() => void copy(ep.response, 'res')} className="p-1 rounded text-[var(--subtle)] hover:text-[var(--ink)] transition-colors">
                {copied === 'res' ? <Check size={12} className="text-[var(--success)]" /> : <Copy size={12} />}
              </button>
            </div>
            <pre className="mono text-xs text-[var(--ink)] p-4 overflow-x-auto leading-relaxed">{ep.response}</pre>
          </div>

          {/* Webhook events */}
          {ep.path.includes('webhooks') && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <p className="text-sm font-semibold text-[var(--ink)] mb-3">Webhook events</p>
              <div className="space-y-2">
                {WEBHOOK_EVENTS.map(e => (
                  <div key={e} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)]">
                    <div className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                    <span className="mono text-xs text-[var(--ink)]">{e}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-[var(--muted)] mt-3">All webhook events are idempotent. Use the event ID to deduplicate.</p>
            </div>
          )}
        </div>
      </div>

      {/* Auth note */}
      <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <div className="flex items-start gap-3">
          <Code2 size={16} className="text-[var(--accent)] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-[var(--ink)] mb-1">Authentication</p>
            <p className="text-sm text-[var(--muted)] text-pretty">
              In production, all API endpoints require a Bearer token in the Authorization header.
              In this demo, all requests are pre-authorized as the demo organization (owner role).
              Roles supported: <code className="mono bg-[var(--surface-muted)] px-1 py-0.5 rounded text-xs">owner</code>,{' '}
              <code className="mono bg-[var(--surface-muted)] px-1 py-0.5 rounded text-xs">admin</code>,{' '}
              <code className="mono bg-[var(--surface-muted)] px-1 py-0.5 rounded text-xs">finance</code>,{' '}
              <code className="mono bg-[var(--surface-muted)] px-1 py-0.5 rounded text-xs">viewer</code>.
            </p>
            <div className="mt-3 p-3 bg-[var(--surface-muted)] rounded-lg">
              <code className="mono text-xs text-[var(--ink)]">
                Authorization: Bearer &lt;api_key&gt;
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
