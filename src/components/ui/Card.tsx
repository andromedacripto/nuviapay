import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export function Card({ children, className, onClick, hoverable }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-2xl border border-[var(--border)] bg-[var(--surface)] backdrop-blur-sm',
        hoverable && 'cursor-pointer hover:border-[var(--border-strong)] hover:bg-[var(--surface-strong)] transition-all duration-150',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  trend?: { value: string; positive: boolean };
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({ label, value, sub, trend, icon, className }: StatCardProps) {
  return (
    <Card className={cn('p-5', className)}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-[var(--subtle)] label-caps">{label}</p>
        {icon && <div className="text-[var(--subtle)]">{icon}</div>}
      </div>
      <p className="display text-2xl font-semibold text-[var(--ink)] tabular">{value}</p>
      {(sub || trend) && (
        <div className="mt-1.5 flex items-center gap-2">
          {sub && <p className="text-xs text-[var(--muted)]">{sub}</p>}
          {trend && (
            <span className={cn('text-xs font-medium', trend.positive ? 'text-[var(--success)]' : 'text-[var(--danger)]')}>
              {trend.positive ? '+' : ''}{trend.value}
            </span>
          )}
        </div>
      )}
    </Card>
  );
}
