import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  hint,
  leftAddon,
  rightAddon,
  className,
  id,
  ...props
}, ref) => {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-[var(--ink-2)]">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftAddon && (
          <div className="absolute left-3 text-[var(--subtle)] pointer-events-none">{leftAddon}</div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full h-10 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]',
            'px-3 text-sm text-[var(--ink)] placeholder:text-[var(--subtle)]',
            'outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--focus)]/30',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-all duration-150',
            error && 'border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[var(--danger)]/20',
            leftAddon && 'pl-9',
            rightAddon && 'pr-9',
            className
          )}
          {...props}
        />
        {rightAddon && (
          <div className="absolute right-3 text-[var(--subtle)] pointer-events-none">{rightAddon}</div>
        )}
      </div>
      {(error || hint) && (
        <p className={cn('text-xs', error ? 'text-[var(--danger)]' : 'text-[var(--subtle)]')}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: React.ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label, error, children, className, id, ...props
}, ref) => {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-xs font-medium text-[var(--ink-2)]">{label}</label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={cn(
          'w-full h-10 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]',
          'px-3 text-sm text-[var(--ink)] outline-none',
          'focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--focus)]/30',
          'disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150',
          error && 'border-[var(--danger)]',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
    </div>
  );
});

Select.displayName = 'Select';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label, error, className, id, ...props
}, ref) => {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label htmlFor={inputId} className="text-xs font-medium text-[var(--ink-2)]">{label}</label>}
      <textarea
        ref={ref}
        id={inputId}
        className={cn(
          'w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]',
          'px-3 py-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--subtle)]',
          'outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--focus)]/30',
          'disabled:opacity-50 resize-none transition-all duration-150',
          error && 'border-[var(--danger)]',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
    </div>
  );
});

Textarea.displayName = 'Textarea';
