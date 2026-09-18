import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  disabled,
  className,
  children,
  ...props
}, ref) => {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--focus)]/40 active:scale-[0.98] select-none whitespace-nowrap';

  const variants: Record<string, string> = {
    primary:   'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] shadow-sm disabled:opacity-50',
    secondary: 'bg-[var(--surface-muted)] text-[var(--ink)] border border-[var(--border)] hover:bg-[var(--surface-muted-hover)] disabled:opacity-50',
    ghost:     'text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)] disabled:opacity-40',
    danger:    'bg-[var(--danger)] text-white hover:opacity-90 disabled:opacity-50',
    outline:   'border border-[var(--border)] text-[var(--ink)] hover:bg-[var(--surface-muted)] disabled:opacity-50',
  };

  const sizes: Record<string, string> = {
    xs: 'h-7 px-2.5 text-xs',
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-11 px-6 text-sm',
  };

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {loading ? <Loader2 size={14} className="animate-spin shrink-0" /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
});

Button.displayName = 'Button';
