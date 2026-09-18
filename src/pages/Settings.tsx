import { useState } from 'react';
import { Building2, Users, Key, Bell, Shield, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const SECTIONS = [
  { key: 'organization', label: 'Organization', icon: Building2 },
  { key: 'team',         label: 'Team',         icon: Users },
  { key: 'api',          label: 'API keys',     icon: Key },
  { key: 'notifications',label: 'Notifications',icon: Bell },
  { key: 'security',     label: 'Security',     icon: Shield },
];

const MEMBERS = [
  { name: 'Alex Chen',     email: 'alex@nuvia.io',   role: 'Owner',   avatar: 'AC' },
  { name: 'Sarah Park',    email: 'sarah@nuvia.io',  role: 'Admin',   avatar: 'SP' },
  { name: 'Marcus Oliveira',email: 'marcus@nuvia.io', role: 'Finance', avatar: 'MO' },
];

export default function Settings() {
  const [section, setSection] = useState('organization');
  const [orgName, setOrgName] = useState('NUVIA Demo Org');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    toast.success('Settings saved');
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="display text-xl font-semibold text-[var(--ink)] tracking-tight">Settings</h2>
        <p className="text-sm text-[var(--muted)] mt-0.5">Manage your organization and preferences</p>
      </div>

      <div className="grid lg:grid-cols-[220px_1fr] gap-6">
        {/* Nav */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden h-fit">
          {SECTIONS.map(s => {
            const Icon = s.icon;
            return (
              <button
                key={s.key}
                onClick={() => setSection(s.key)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors text-sm',
                  section === s.key
                    ? 'bg-[var(--surface-muted)] text-[var(--ink)] font-medium'
                    : 'text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]'
                )}
              >
                <Icon size={15} className="shrink-0" />
                {s.label}
                {section === s.key && <ChevronRight size={12} className="ml-auto text-[var(--subtle)]" />}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          {section === 'organization' && (
            <div>
              <h3 className="display text-base font-semibold text-[var(--ink)] mb-5">Organization</h3>
              <div className="space-y-4 max-w-md">
                <Input label="Organization name" value={orgName} onChange={e => setOrgName(e.target.value)} />
                <Input label="Plan" value="Demo" disabled />
                <Input label="Network" value="Arc Testnet" disabled />
                <Button loading={saving} onClick={() => void handleSave()}>Save changes</Button>
              </div>
            </div>
          )}

          {section === 'team' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h3 className="display text-base font-semibold text-[var(--ink)]">Team members</h3>
                <Button size="sm" onClick={() => toast.info('Invitations coming in v2')}>Invite member</Button>
              </div>
              <div className="space-y-3">
                {MEMBERS.map(m => (
                  <div key={m.email} className="flex items-center gap-3 p-4 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-muted)] transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center shrink-0">
                      <span className="display text-xs font-bold text-[var(--accent)]">{m.avatar}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[var(--ink)]">{m.name}</p>
                      <p className="text-xs text-[var(--subtle)]">{m.email}</p>
                    </div>
                    <span className="text-xs font-medium text-[var(--muted)] bg-[var(--surface-muted)] px-2 py-1 rounded-lg border border-[var(--border)]">
                      {m.role}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-[var(--subtle)] mt-4">
                Roles: Owner (full access) · Admin (all except billing) · Finance (payments + beneficiaries) · Viewer (read-only)
              </p>
            </div>
          )}

          {section === 'api' && (
            <div>
              <h3 className="display text-base font-semibold text-[var(--ink)] mb-5">API keys</h3>
              <div className="p-4 rounded-xl bg-[var(--surface-muted)] border border-[var(--border)] mb-5">
                <p className="text-xs text-[var(--muted)] label-caps mb-2">Demo API key</p>
                <div className="mono text-xs text-[var(--ink)] bg-[var(--surface)] px-3 py-2 rounded-lg border border-[var(--border)]">
                  nuvia_demo_key_••••••••••••••••
                </div>
                <p className="text-xs text-[var(--subtle)] mt-2">Keys are masked. Contact your admin to rotate.</p>
              </div>
              <Button size="sm" onClick={() => toast.info('Key management coming in v2')}>Generate new key</Button>
            </div>
          )}

          {section === 'notifications' && (
            <div>
              <h3 className="display text-base font-semibold text-[var(--ink)] mb-5">Notifications</h3>
              <div className="space-y-3">
                {[
                  'Payment confirmed',
                  'Payment failed',
                  'Large payment threshold',
                  'New team member',
                  'API key created',
                ].map(item => (
                  <label key={item} className="flex items-center justify-between p-4 rounded-xl border border-[var(--border)] cursor-pointer hover:bg-[var(--surface-muted)] transition-colors">
                    <span className="text-sm text-[var(--ink)]">{item}</span>
                    <input type="checkbox" defaultChecked className="accent-[var(--accent)] w-4 h-4 rounded" />
                  </label>
                ))}
              </div>
            </div>
          )}

          {section === 'security' && (
            <div>
              <h3 className="display text-base font-semibold text-[var(--ink)] mb-5">Security</h3>
              <div className="space-y-4">
                {[
                  { label: 'Two-factor authentication', desc: 'Add an extra layer of security', enabled: false },
                  { label: 'Audit log', desc: 'Immutable record of all actions', enabled: true },
                  { label: 'IP allowlist', desc: 'Restrict API access to known IPs', enabled: false },
                  { label: 'Payment approvals', desc: 'Require approval for payments > $10,000', enabled: true },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between p-4 rounded-xl border border-[var(--border)]">
                    <div>
                      <p className="text-sm font-medium text-[var(--ink)]">{item.label}</p>
                      <p className="text-xs text-[var(--subtle)] mt-0.5">{item.desc}</p>
                    </div>
                    <div className={cn(
                      'px-2.5 py-1 rounded-full text-xs font-medium',
                      item.enabled ? 'bg-[var(--success-bg)] text-[var(--success)]' : 'bg-[var(--surface-muted)] text-[var(--muted)]'
                    )}>
                      {item.enabled ? 'Enabled' : 'Disabled'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
