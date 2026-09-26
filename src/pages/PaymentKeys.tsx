import { useState, useCallback, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Key, Plus, Trash2, Copy, CheckCircle2, Mail, Building2, Phone, Hash } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { toast } from 'sonner';

interface PaymentKey {
  id: string;
  key_type: 'email' | 'cnpj' | 'cpf' | 'phone' | 'custom';
  key_value: string;
  label: string | null;
  wallet_address: string;
  is_active: number;
  created_at: string;
}

const KEY_ICONS = {
  email: Mail,
  cnpj: Building2,
  cpf: Hash,
  phone: Phone,
  custom: Key,
};

const KEY_LABELS = {
  email: 'E-mail',
  cnpj: 'CNPJ',
  cpf: 'CPF',
  phone: 'Phone',
  custom: 'Custom',
};

function detectType(value: string): PaymentKey['key_type'] {
  const s = value.trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return 'email';
  const d = s.replace(/\D/g, '');
  if (d.length === 14) return 'cnpj';
  if (d.length === 11 && !s.includes('@')) return 'cpf';
  if (d.length >= 10 && d.length <= 13) return 'phone';
  return 'custom';
}

export default function PaymentKeys() {
  const { address } = useAccount();
  const [keys, setKeys] = useState<PaymentKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [form, setForm] = useState({ key_value: '', label: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/v1/keys', { headers: { 'x-org-id': 'org_demo', 'x-user-id': 'mem_01', 'x-role': 'owner' } });
      const j = await r.json() as { data: PaymentKey[] };
      setKeys(j.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleAdd = async () => {
    if (!form.key_value.trim()) { toast.error('Enter a key value'); return; }
    if (!address) { toast.error('Connect your wallet first'); return; }
    setSaving(true);
    try {
      const r = await fetch('/v1/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-org-id': 'org_demo', 'x-user-id': 'mem_01', 'x-role': 'owner',
        },
        body: JSON.stringify({
          key_value: form.key_value.trim(),
          key_type: detectType(form.key_value),
          wallet_address: address,
          label: form.label.trim() || undefined,
        }),
      });
      const j = await r.json() as { data?: PaymentKey; error?: string };
      if (!r.ok) {
        toast.error(j.error === 'KEY_ALREADY_REGISTERED' ? 'This key is already registered' : (j.error ?? 'Failed'));
        return;
      }
      toast.success('Key registered successfully');
      setShowAdd(false);
      setForm({ key_value: '', label: '' });
      void load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, keyValue: string) => {
    if (!confirm(`Remove key "${keyValue}"?`)) return;
    await fetch(`/v1/keys/${id}`, {
      method: 'DELETE',
      headers: { 'x-org-id': 'org_demo', 'x-user-id': 'mem_01', 'x-role': 'owner' },
    });
    toast.success('Key removed');
    void load();
  };

  const copyKey = (value: string) => {
    void navigator.clipboard.writeText(value);
    setCopied(value);
    setTimeout(() => setCopied(null), 2000);
  };

  const activeKeys = keys.filter(k => k.is_active);

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="display text-xl sm:text-2xl font-bold text-[var(--ink)]">Payment Keys</h1>
          <p className="text-sm text-[var(--muted)] mt-0.5">Register email, CNPJ or phone as your payment address</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus size={14} className="mr-1.5" /> Add key
        </Button>
      </div>

      {/* How it works */}
      <div className="rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent)]/5 p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-[var(--accent)]/15 flex items-center justify-center shrink-0 mt-0.5">
            <Key size={14} className="text-[var(--accent)]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--ink)] mb-1">How Payment Keys work</p>
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              Register your email or CNPJ as a payment key. Anyone can send you USDC using just your key — no wallet address needed. Think of it as your business's Pix key, but global.
            </p>
          </div>
        </div>
      </div>

      {/* Keys list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="h-20 rounded-2xl bg-[var(--surface-muted)] animate-pulse" />
          ))}
        </div>
      ) : activeKeys.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[var(--surface-muted)] flex items-center justify-center mx-auto mb-3">
            <Key size={20} className="text-[var(--muted)]" />
          </div>
          <p className="text-sm font-medium text-[var(--ink)] mb-1">No keys yet</p>
          <p className="text-xs text-[var(--muted)] mb-4">Add your first payment key to start receiving USDC</p>
          <Button size="sm" variant="secondary" onClick={() => setShowAdd(true)}>
            <Plus size={14} className="mr-1.5" /> Register a key
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {activeKeys.map(k => {
            const Icon = KEY_ICONS[k.key_type] ?? Key;
            return (
              <div key={k.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--surface-muted)] flex items-center justify-center shrink-0">
                  <Icon size={16} className="text-[var(--accent)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[var(--ink)] truncate">{k.key_value}</p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[var(--surface-muted)] text-[var(--muted)] font-medium label-caps shrink-0">
                      {KEY_LABELS[k.key_type]}
                    </span>
                  </div>
                  {k.label && <p className="text-xs text-[var(--muted)] mt-0.5">{k.label}</p>}
                  <p className="text-xs text-[var(--subtle)] mt-0.5 font-mono truncate">{k.wallet_address}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => copyKey(k.key_value)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[var(--surface-muted)] transition-colors text-[var(--muted)]"
                    title="Copy key"
                  >
                    {copied === k.key_value ? <CheckCircle2 size={14} className="text-[var(--success)]" /> : <Copy size={14} />}
                  </button>
                  <button
                    onClick={() => void handleDelete(k.id, k.key_value)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-red-50 hover:text-red-500 transition-colors text-[var(--muted)]"
                    title="Remove key"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Key Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Register Payment Key" maxWidth="sm">
        <div className="space-y-4">
          <div className="rounded-xl bg-[var(--surface-muted)] p-3 text-xs text-[var(--muted)]">
            Your wallet <span className="font-mono text-[var(--ink)]">{address ? `${address.slice(0,6)}...${address.slice(-4)}` : 'not connected'}</span> will be linked to this key.
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5">Key value *</label>
            <input
              type="text"
              value={form.key_value}
              onChange={e => setForm(f => ({ ...f, key_value: e.target.value }))}
              placeholder="email@company.com or 00.000.000/0001-00"
              className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--ink)] placeholder:text-[var(--subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]"
            />
            {form.key_value && (
              <p className="text-xs text-[var(--muted)] mt-1">
                Detected type: <span className="font-semibold text-[var(--ink)]">{KEY_LABELS[detectType(form.key_value)]}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5">Label (optional)</label>
            <input
              type="text"
              value={form.label}
              onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
              placeholder="e.g. Main company key"
              className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--ink)] placeholder:text-[var(--subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]"
            />
          </div>

          {!address && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded-xl px-3 py-2.5">
              Connect your wallet in the top bar before registering a key.
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <Button variant="secondary" className="flex-1" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button className="flex-1" onClick={() => void handleAdd()} disabled={saving || !address}>
              {saving ? 'Registering…' : 'Register key'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
