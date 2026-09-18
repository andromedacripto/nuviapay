import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-8 text-center', className)}>
      {icon && (
        <div className="w-12 h-12 rounded-2xl bg-[var(--surface-muted)] flex items-center justify-center text-[var(--subtle)] mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-[var(--ink-2)] mb-1">{title}</h3>
      {description && <p className="text-sm text-[var(--muted)] max-w-[30ch] text-pretty">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center py-16', className)}>
      <div className="w-8 h-8 rounded-full border-2 border-[var(--border)] border-t-[var(--accent)] animate-spin" />
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-sm text-[var(--danger)] mb-3">{message ?? 'Something went wrong'}</p>
      {onRetry && (
        <button onClick={onRetry} className="text-sm text-[var(--ink-2)] underline underline-offset-2">
          Try again
        </button>
      )}
    </div>
  );
}
