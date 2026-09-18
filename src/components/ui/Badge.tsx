import { cn } from '@/lib/utils';
import { STATUS_COLORS, STATUS_LABELS } from '@/lib/utils';

interface BadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium tabular',
      STATUS_COLORS[status] ?? 'bg-[var(--surface-muted)] text-[var(--muted)]',
      className
    )}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

interface PillProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'blue';
  className?: string;
}

const PILL_VARIANTS: Record<string, string> = {
  default: 'bg-[var(--surface-muted)] text-[var(--muted)]',
  success: 'bg-[var(--success-bg)] text-[var(--success)]',
  danger:  'bg-[var(--danger-bg)] text-[var(--danger)]',
  warning: 'bg-[var(--warning-bg)] text-[var(--warning)]',
  blue:    'bg-[var(--blue-bg)] text-[var(--blue)]',
};

export function Pill({ children, variant = 'default', className }: PillProps) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', PILL_VARIANTS[variant], className)}>
      {children}
    </span>
  );
}

export function DemoBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--warning-bg)] text-[var(--warning)] text-xs font-semibold label-caps border border-[var(--warning)]/20">
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--warning)] animate-pulse" />
      Demo / Testnet
    </span>
  );
}
