import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
  className?: string;
}

// Map maxWidth prop values to their sm: responsive counterparts (must be static strings for Tailwind)
const SM_MAX: Record<string, string> = {
  'max-w-sm':  'sm:max-w-sm',
  'max-w-md':  'sm:max-w-md',
  'max-w-lg':  'sm:max-w-lg',
  'max-w-xl':  'sm:max-w-xl',
  'max-w-2xl': 'sm:max-w-2xl',
  'max-w-3xl': 'sm:max-w-3xl',
};

export function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg', className }: ModalProps) {
  const firstFocus = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    firstFocus.current?.focus();
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[var(--ink)]/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            className={cn(
              'relative w-full bg-[var(--surface-strong)] shadow-2xl overflow-hidden',
              // Mobile: full-width bottom sheet with rounded top corners, max 92vh
              'rounded-t-2xl sm:rounded-2xl border-t sm:border border-[var(--border)] max-h-[92dvh] overflow-y-auto',
              // Desktop: constrained width, centered
              SM_MAX[maxWidth] ?? 'sm:max-w-lg',
              className
            )}
          >
            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
                <h2 className="display text-base font-semibold text-[var(--ink)]">{title}</h2>
                <button
                  ref={firstFocus}
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-[var(--subtle)] hover:text-[var(--ink)] hover:bg-[var(--surface-muted)] transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
