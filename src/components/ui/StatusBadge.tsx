import { cn, STATUS_COLORS, STATUS_LABELS } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
  dot?: boolean;
}

export function StatusBadge({ status, className, dot = false }: StatusBadgeProps) {
  const color = STATUS_COLORS[status] ?? 'bg-[var(--surface-muted)] text-[var(--subtle)]';
  const label = STATUS_LABELS[status] ?? status;

  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold', color, className)}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80 shrink-0" />}
      {label}
    </span>
  );
}
