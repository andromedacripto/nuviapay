import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ArrowUpDown, Users, Wallet, Activity,
  Code2, Settings, Zap, ChevronDown, X,
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
  { to: '/api-docs', icon: Code2,    label: 'API' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const inner = (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-[var(--border)]">
        <div className="w-8 h-8 rounded-xl bg-[var(--accent)] flex items-center justify-center shrink-0">
          <Zap size={14} fill="white" className="text-white" />
        </div>
        <div className="flex-1">
          <p className="display text-sm font-bold text-[var(--ink)] tracking-tight">NUVIA</p>
          <p className="text-[10px] text-[var(--subtle)]">Payments</p>
        </div>
        {/* Close button — mobile only */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden -mr-1 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--surface-muted)] transition-colors"
          >
            <X size={16} className="text-[var(--muted)]" />
          </button>
        )}
      </div>

      {/* Org selector */}
      <button className="mx-3 mt-3 px-3 py-2.5 rounded-xl border border-[var(--border)] flex items-center gap-2 text-left hover:bg-[var(--surface-muted)] transition-colors">
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
            onClick={onClose}
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
            onClick={onClose}
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
    </div>
  );

  return (
    <>
      {/* Desktop: fixed sidebar */}
      <aside
        className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-30 border-r border-[var(--border)] bg-[var(--surface-strong)]"
        style={{ width: 'var(--sidebar-w)' }}
      >
        {inner}
      </aside>

      {/* Mobile: drawer + overlay */}
      {open !== undefined && (
        <>
          {/* Backdrop */}
          <div
            className={cn(
              'lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-200',
              open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            )}
            onClick={onClose}
          />
          {/* Drawer */}
          <aside
            className={cn(
              'lg:hidden fixed left-0 top-0 bottom-0 z-50 flex flex-col border-r border-[var(--border)] bg-[var(--surface-strong)] transition-transform duration-200',
              open ? 'translate-x-0' : '-translate-x-full'
            )}
            style={{ width: 'min(var(--sidebar-w), 80vw)' }}
          >
            {inner}
          </aside>
        </>
      )}
    </>
  );
}
