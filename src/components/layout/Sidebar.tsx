import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ArrowUpDown, Users, Wallet, Activity,
  Code2, Settings, Zap, ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/dashboard',     icon: LayoutDashboard, label: 'Overview' },
  { to: '/payments',      icon: ArrowUpDown,     label: 'Payments' },
  { to: '/beneficiaries', icon: Users,            label: 'Beneficiaries' },
  { to: '/wallet',        icon: Wallet,           label: 'Wallet' },
  { to: '/activity',      icon: Activity,         label: 'Activity' },
];

const SECONDARY = [
  { to: '/api-docs', icon: Code2,     label: 'API' },
  { to: '/settings', icon: Settings,  label: 'Settings' },
];

export function Sidebar() {
  return (
    <aside
      className="fixed left-0 top-0 bottom-0 z-30 flex flex-col border-r border-[var(--border)] bg-[var(--surface-strong)]"
      style={{ width: 'var(--sidebar-w)' }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-[var(--border)]">
        <div className="w-8 h-8 rounded-xl bg-[var(--accent)] flex items-center justify-center shrink-0">
          <Zap size={14} fill="white" className="text-white" />
        </div>
        <div>
          <p className="display text-sm font-bold text-[var(--ink)] tracking-tight">NUVIA</p>
          <p className="text-[10px] text-[var(--subtle)]">Payments</p>
        </div>
      </div>

      {/* Org selector */}
      <button className="mx-3 mt-3 px-3 py-2.5 rounded-xl border border-[var(--border)] flex items-center gap-2 text-left hover:bg-[var(--surface-muted)] transition-colors group">
        <div className="w-6 h-6 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center shrink-0">
          <span className="display text-[10px] font-bold text-[var(--accent)]">N</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-[var(--ink)] truncate">Demo Org</p>
          <p className="text-[10px] text-[var(--subtle)]">Arc Testnet</p>
        </div>
        <ChevronDown size={12} className="text-[var(--subtle)] shrink-0" />
      </button>

      {/* Primary nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-100',
              isActive
                ? 'bg-[var(--accent)] text-white shadow-sm'
                : 'text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]'
            )}
          >
            <Icon size={15} className="shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Secondary nav */}
      <div className="px-3 pb-5 border-t border-[var(--border)] pt-3 space-y-0.5">
        {SECONDARY.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-100',
              isActive
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]'
            )}
          >
            <Icon size={15} className="shrink-0" />
            {label}
          </NavLink>
        ))}

        {/* Demo badge */}
        <div className="mt-3 mx-1 px-3 py-2 rounded-xl bg-[var(--warning-bg)] border border-[var(--warning)]/20">
          <p className="text-[10px] font-semibold text-[var(--warning)] label-caps mb-0.5">Demo / Testnet</p>
          <p className="text-[10px] text-[var(--warning)]/70 leading-snug">No real funds. Arc Testnet only.</p>
        </div>
      </div>
    </aside>
  );
}
