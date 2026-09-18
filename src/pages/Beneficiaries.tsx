import { useCallback, useEffect, useState } from 'react';
import { Plus, Search, UserPlus, CheckCircle2, XCircle, Edit3, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/Button.tsx';
import { Input } from '@/components/ui/Input.tsx';
import { Modal } from '@/components/ui/Modal.tsx';
import { beneficiariesApi } from '@/lib/api.ts';
import type { Beneficiary } from '@/lib/api.ts';
import { formatAddress, formatDate } from '@/lib/utils.ts';
import { toast } from 'sonner';
import { cn } from '@/lib/utils.ts';

const COUNTRIES: Record<string, string> = {
  US: 'United States', EU: 'European Union', SG: 'Singapore',
  GB: 'United Kingdom', JP: 'Japan', BR: 'Brazil',
};

export default function Beneficiaries() {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [showAdd,  setShowAdd]  = useState(false);
  const [editing,  setEditing]  = useState<Beneficiary | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({ name: '', company: '', wallet_address: '', country: 'US', label: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await beneficiariesApi.list();
      setBeneficiaries(res.data);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  function resetForm() {
    setForm({ name: '', company: '', wallet_address: '', country: 'US', label: '' });
    setErrors({});
  }

  function openEdit(b: Beneficiary) {
    setEditing(b);
    setForm({ name: b.name, company: b.company ?? '', wallet_address: b.wallet_address, country: b.country, label: b.label ?? '' });
    setErrors({});
    setOpenMenu(null);
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.wallet_address.trim()) e.wallet_address = 'Wallet address is required';
    else if (!/^0x[0-9a-fA-F]{40}$/.test(form.wallet_address)) e.wallet_address = 'Invalid wallet address (must be 0x…)';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editing) {
        await beneficiariesApi.update(editing.id, form);
        toast.success('Beneficiary updated');
      } else {
        await beneficiariesApi.create(form);
        toast.success('Beneficiary added');
      }
      await load();
      setShowAdd(false);
      setEditing(null);
      resetForm();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDisable(b: Beneficiary) {
    setOpenMenu(null);
    try {
      await beneficiariesApi.disable(b.id);
      toast.success('Beneficiary disabled');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    }
  }

  const filtered = beneficiaries.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    (b.company ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="display text-xl font-semibold text-[var(--ink)] tracking-tight">Beneficiaries</h2>
          <p className="text-sm text-[var(--muted)] mt-0.5">{beneficiaries.length} saved</p>
        </div>
        <Button leftIcon={<Plus size={14} />} onClick={() => { resetForm(); setShowAdd(true); }}>
          Add beneficiary
        </Button>
      </div>

      <div className="max-w-xs">
        <Input
          placeholder="Search…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          leftAddon={<Search size={13} />}
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 animate-pulse">
              <div className="h-4 w-1/2 bg-[var(--surface-muted)] rounded mb-3" />
              <div className="h-3 w-3/4 bg-[var(--surface-muted)] rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-center">
          <UserPlus size={32} className="text-[var(--subtle)] mb-3" />
          <p className="text-sm text-[var(--muted)]">No beneficiaries found</p>
          <Button size="sm" className="mt-4" leftIcon={<Plus size={12} />} onClick={() => { resetForm(); setShowAdd(true); }}>
            Add first beneficiary
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(b => (
            <div key={b.id} className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 hover:border-[var(--accent)]/30 transition-colors relative">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/8 flex items-center justify-center shrink-0">
                    <span className="display text-sm font-bold text-[var(--accent)]">{b.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--ink)]">{b.name}</p>
                    {b.company && <p className="text-xs text-[var(--subtle)]">{b.company}</p>}
                  </div>
                </div>

                <div className="relative">
                  <button
                    onClick={() => setOpenMenu(openMenu === b.id ? null : b.id)}
                    className="p-1.5 rounded-lg text-[var(--subtle)] hover:bg-[var(--surface-muted)] opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <MoreHorizontal size={14} />
                  </button>
                  {openMenu === b.id && (
                    <div className="absolute right-0 top-8 w-40 rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] shadow-lg z-10 overflow-hidden">
                      <button onClick={() => openEdit(b)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[var(--ink)] hover:bg-[var(--surface-muted)] transition-colors">
                        <Edit3 size={12} /> Edit
                      </button>
                      <button onClick={() => void handleDisable(b)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[var(--danger)] hover:bg-[var(--danger-bg)] transition-colors">
                        <XCircle size={12} /> Disable
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[var(--subtle)]">Wallet</span>
                  <span className="mono text-[10px] text-[var(--ink)]">{formatAddress(b.wallet_address)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[var(--subtle)]">Country</span>
                  <span className="text-[10px] text-[var(--ink)]">{COUNTRIES[b.country] ?? b.country}</span>
                </div>
                {b.label && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[var(--subtle)]">Label</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--surface-muted)] border border-[var(--border)] text-[var(--muted)]">{b.label}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[var(--subtle)]">Added</span>
                  <span className="text-[10px] text-[var(--muted)]">{formatDate(b.created_at)}</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center gap-1.5">
                {b.is_active ? (
                  <><CheckCircle2 size={11} className="text-[var(--success)]" /><span className="text-[10px] text-[var(--success)]">Active</span></>
                ) : (
                  <><XCircle size={11} className="text-[var(--danger)]" /><span className="text-[10px] text-[var(--danger)]">Disabled</span></>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit modal */}
      <Modal
        open={showAdd || !!editing}
        onClose={() => { setShowAdd(false); setEditing(null); resetForm(); }}
        title={editing ? 'Edit beneficiary' : 'Add beneficiary'}
      >
        <div className="p-6 space-y-4">
          <Input
            label="Full name *"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            error={errors.name}
          />
          <Input
            label="Company (optional)"
            value={form.company}
            onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
          />
          <Input
            label="Wallet address *"
            placeholder="0x…"
            value={form.wallet_address}
            onChange={e => setForm(f => ({ ...f, wallet_address: e.target.value }))}
            error={errors.wallet_address}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--ink-2)]">Country</label>
            <select
              value={form.country}
              onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
              className="w-full h-10 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)]"
            >
              {Object.entries(COUNTRIES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <Input
            label="Label (optional)"
            placeholder="Supplier, Partner…"
            value={form.label}
            onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
          />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => { setShowAdd(false); setEditing(null); resetForm(); }}>
              Cancel
            </Button>
            <Button className="flex-1" loading={saving} onClick={() => void handleSave()}>
              {editing ? 'Save changes' : 'Add beneficiary'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Close menus on outside click */}
      {openMenu && (
        <div className="fixed inset-0 z-0" onClick={() => setOpenMenu(null)} />
      )}
    </div>
  );
}
