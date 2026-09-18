import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: string | number | bigint, decimals = 2): string {
  const n = typeof value === 'bigint' ? Number(value) / 1e6 : Number(value);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

export function formatAddress(addr: string | null | undefined, chars = 6): string {
  if (!addr) return '—';
  if (addr.length <= chars * 2 + 2) return addr;
  return `${addr.slice(0, chars)}...${addr.slice(-4)}`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso));
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export const STATUS_COLORS: Record<string, string> = {
  draft:              'bg-[var(--surface-muted)] text-[var(--muted)]',
  quoted:             'bg-[var(--blue-bg)] text-[var(--blue)]',
  pending_approval:   'bg-[var(--warning-bg)] text-[var(--warning)]',
  processing:         'bg-[var(--blue-bg)] text-[var(--blue)]',
  submitted:          'bg-[var(--blue-bg)] text-[var(--blue)]',
  confirmed:          'bg-[var(--success-bg)] text-[var(--success)]',
  failed:             'bg-[var(--danger-bg)] text-[var(--danger)]',
  cancelled:          'bg-[var(--surface-muted)] text-[var(--muted)]',
  pending:            'bg-[var(--warning-bg)] text-[var(--warning)]',
};

export const STATUS_LABELS: Record<string, string> = {
  draft:            'Draft',
  quoted:           'Quoted',
  pending_approval: 'Pending',
  processing:       'Processing',
  submitted:        'Submitted',
  confirmed:        'Confirmed',
  failed:           'Failed',
  cancelled:        'Cancelled',
  pending:          'Pending',
};
