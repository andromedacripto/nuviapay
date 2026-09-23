import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowRight, ArrowLeft, CheckCircle2, Loader2,
  Copy, Check, ExternalLink, X, AlertCircle,
} from 'lucide-react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useBalance } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils.ts';
import { Button } from '@/components/ui/Button.tsx';
import { Input } from '@/components/ui/Input.tsx';
import { paymentsApi, beneficiariesApi } from '@/lib/api.ts';
import type { Beneficiary, Payment } from '@/lib/api.ts';
import { getUsdc } from '@/onchain-facts.ts';
import { parseAmount, formatAmount, Amount } from '@/onchain-money.ts';
import { arcTestnet } from '@/config.ts';
import { formatAddress, formatCurrency, formatDateTime } from '@/lib/utils.ts';
import { toast } from 'sonner';

// ── ERC-20 transfer ABI ────────────────────────────────────────────────────
const ERC20_TRANSFER_ABI = [{
  type: 'function',
  name: 'transfer',
  inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }],
  outputs: [{ name: '', type: 'bool' }],
  stateMutability: 'nonpayable',
}] as const;

// ── Types ──────────────────────────────────────────────────────────────────
interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface PaymentForm {
  amount: string;
  currency: string;
  beneficiaryName: string;
  company: string;
  walletAddress: string;
  country: string;
  reference: string;
  saveAsBeneficiary: boolean;
}

const STEPS = [
  { id: 1, label: 'Amount' },
  { id: 2, label: 'Beneficiary' },
  { id: 3, label: 'Review' },
  { id: 4, label: 'Confirm' },
  { id: 5, label: 'Processing' },
  { id: 6, label: 'Receipt' },
] as const;

const COUNTRIES = [
  ['US', 'United States'], ['EU', 'European Union'], ['GB', 'United Kingdom'],
  ['SG', 'Singapore'], ['JP', 'Japan'], ['BR', 'Brazil'], ['AU', 'Australia'],
  ['CA', 'Canada'],
];

export default function CreatePaymentModal({ open, onClose, onSuccess }: Props) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<PaymentForm>({
    amount: '', currency: 'USDC', beneficiaryName: '', company: '',
    walletAddress: '', country: 'US', reference: '', saveAsBeneficiary: false,
  });
  const [errors, setErrors]       = useState<Record<string, string>>({});
  const [payment, setPayment]     = useState<Payment | null>(null);
  const [txHash, setTxHash]       = useState<string | null>(null);
  const [copied, setCopied]       = useState<string | null>(null);
  const [timeline, setTimeline]   = useState<string[]>([]);
  const [savedBens, setSavedBens] = useState<Beneficiary[]>([]);
  const [apiLoading, setApiLoading] = useState(false);

  const { address, isConnected } = useAccount();
  const usdcToken = getUsdc(arcTestnet.id);
  const paymentRef = useRef<Payment | null>(null);

  // On Arc, USDC is the native gas token — read native (18 dec) as reliable fallback
  const { data: nativeBalance } = useBalance({
    address,
    chainId: arcTestnet.id,
    query: { enabled: isConnected && !!address },
  });
  const { data: erc20Balance } = useBalance({
    address,
    token: usdcToken?.address as `0x${string}` | undefined,
    chainId: arcTestnet.id,
    query: { enabled: isConnected && !!address && !!usdcToken },
  });
  const usdcBalance = erc20Balance ?? (nativeBalance
    ? { ...nativeBalance, value: nativeBalance.value / BigInt(10 ** 12), decimals: 6 }
    : undefined);

  const { writeContract, data: writeHash, isPending: isWriting, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: onChainConfirmed } =
    useWaitForTransactionReceipt({ hash: writeHash });

  // Load beneficiaries for quick-pick
  useEffect(() => {
    if (open && step === 2) {
      beneficiariesApi.list().then(r => setSavedBens(r.data)).catch(() => {});
    }
  }, [open, step]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setStep(1); setForm({ amount: '', currency: 'USDC', beneficiaryName: '', company: '',
        walletAddress: '', country: 'US', reference: '', saveAsBeneficiary: false });
      setErrors({}); setPayment(null); setTxHash(null); setTimeline([]); setApiLoading(false);
    }
  }, [open]);

  // Watch write error
  useEffect(() => {
    if (writeError) { toast.error(writeError.message.slice(0, 80)); setStep(5); }
  }, [writeError]);

  const finishPayment = useCallback(async (hash: string) => {
    const p = paymentRef.current;
    if (!p || !address) return;
    setTxHash(hash);
    addTimeline('Transaction confirmed on Arc');
    try {
      await paymentsApi.recordTransaction(p.id, {
        tx_hash: hash,
        from_address: address,
        to_address: form.walletAddress,
        amount: form.amount,
      });
      await paymentsApi.transition(p.id, 'confirmed');
      addTimeline('Payment confirmed');
      setStep(6);
      onSuccess();
    } catch {
      addTimeline('Error recording confirmation');
    }
  }, [address, form.walletAddress, form.amount, onSuccess]);

  // On-chain confirmed → record tx + confirm payment
  useEffect(() => {
    if (onChainConfirmed && writeHash) {
      void finishPayment(writeHash);
    }
  }, [onChainConfirmed, writeHash, finishPayment]);

  function addTimeline(msg: string) {
    setTimeline(prev => [...prev, msg]);
  }

  // ── Validation ────────────────────────────────────────────────────────────
  function validateStep1() {
    const e: Record<string, string> = {};
    const n = parseFloat(form.amount);
    if (!form.amount || isNaN(n) || n <= 0) e.amount = 'Enter a valid amount';
    else if (n < 0.01) e.amount = 'Minimum amount is $0.01';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep2() {
    const e: Record<string, string> = {};
    if (!form.beneficiaryName.trim()) e.beneficiaryName = 'Name is required';
    if (!form.walletAddress.trim()) e.walletAddress = 'Wallet address is required';
    else if (!/^0x[0-9a-fA-F]{40}$/.test(form.walletAddress)) e.walletAddress = 'Invalid address (must be 0x + 40 hex chars)';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function next() {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep(s => s + 1);
  }

  function back() { setStep(s => s - 1); setErrors({}); }

  // ── Step 4: Confirm → create payment record + trigger on-chain tx ─────────
  async function handleConfirm() {
    setApiLoading(true);
    setStep(5);
    addTimeline('Payment created');

    try {
      // 1. Create payment record
      const ikey = `idk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const created = await paymentsApi.create({
        amount: form.amount,
        currency: form.currency,
        beneficiary_name: form.beneficiaryName,
        wallet_address: form.walletAddress,
        country: form.country,
        reference: form.reference || undefined,
        idempotency_key: ikey,
      });
      setPayment(created.data);
      paymentRef.current = created.data;
      addTimeline('Authorization approved');

      // 2. Optionally save beneficiary
      if (form.saveAsBeneficiary) {
        try {
          await beneficiariesApi.create({
            name: form.beneficiaryName, company: form.company || undefined,
            wallet_address: form.walletAddress, country: form.country,
          });
        } catch (_) {}
      }

      addTimeline('Submitting to Arc network…');

      // 3. Wallet must be connected — no simulation fallback
      if (!isConnected || !address || !usdcToken) {
        addTimeline('Error: wallet not connected');
        toast.error('Connect your wallet in the top bar to send USDC on Arc');
        await paymentsApi.transition(created.data.id, 'failed');
        return;
      }

      const amountObj = parseAmount(arcTestnet.id, form.amount);
      writeContract({
        address: usdcToken.address as `0x${string}`,
        abi: ERC20_TRANSFER_ABI,
        functionName: 'transfer',
        args: [form.walletAddress as `0x${string}`, amountObj.raw],
        chainId: arcTestnet.id,
      });
      addTimeline('Transaction submitted to Arc');
    } catch (e) {
      addTimeline(`Error: ${e instanceof Error ? e.message : 'Unknown error'}`);
      toast.error(e instanceof Error ? e.message : 'Payment failed');
    } finally {
      setApiLoading(false);
    }
  }

  async function copyText(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  function selectBeneficiary(b: Beneficiary) {
    setForm(f => ({ ...f, beneficiaryName: b.name, company: b.company ?? '', walletAddress: b.wallet_address, country: b.country }));
  }

  if (!open) return null;

  const estimatedFee = '0.001';
  const total = (parseFloat(form.amount || '0') + parseFloat(estimatedFee)).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[var(--ink)]/40 backdrop-blur-sm" onClick={step < 5 ? onClose : undefined} />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.15 }}
        className="relative w-full max-w-xl rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div>
            <h2 className="display text-base font-semibold text-[var(--ink)]">New payment</h2>
            <p className="text-xs text-[var(--muted)]">
              Step {step} of {STEPS.length} — {STEPS[step - 1]?.label}
            </p>
          </div>
          {step < 5 && (
            <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--subtle)] hover:text-[var(--ink)] hover:bg-[var(--surface-muted)] transition-colors">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-[var(--border)]">
          <div
            className="h-full bg-[var(--accent)] transition-all duration-300"
            style={{ width: `${(step / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Steps */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.15 }}
          >
            {/* STEP 1 — Amount */}
            {step === 1 && (
              <div className="p-6 space-y-5">
                <div>
                  <p className="text-xs font-medium text-[var(--ink-2)] mb-2">Amount</p>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-semibold text-[var(--subtle)]">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      autoFocus
                      value={form.amount}
                      onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                      className={cn(
                        'w-full h-16 rounded-xl border bg-[var(--surface-muted)] pl-9 pr-24 text-3xl font-bold display text-[var(--ink)] tabular outline-none transition-all',
                        errors.amount ? 'border-[var(--danger)]' : 'border-[var(--border)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--focus)]/30'
                      )}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[var(--muted)]">USDC</span>
                  </div>
                  {errors.amount && <p className="text-xs text-[var(--danger)] mt-1">{errors.amount}</p>}
                </div>

                {isConnected && usdcBalance && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-muted)] border border-[var(--border)]">
                    <span className="text-xs text-[var(--subtle)]">Available balance</span>
                    <button
                      onClick={() => setForm(f => ({ ...f, amount: usdcToken ? formatAmount(arcTestnet.id, Amount.fromRaw(usdcBalance.value, usdcToken.decimals)) : '0' }))}
                      className="text-xs font-semibold text-[var(--accent)] hover:underline"
                    >
                      {usdcToken ? formatAmount(arcTestnet.id, Amount.fromRaw(usdcBalance.value, usdcToken.decimals)) : '0'} USDC
                    </button>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[var(--ink-2)]">Settlement currency</label>
                  <select
                    value={form.currency}
                    onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                    className="w-full h-10 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)]"
                  >
                    <option value="USDC">USDC (stablecoin)</option>
                  </select>
                  <p className="text-xs text-[var(--subtle)]">USDC on Arc Mainnet. Fiat conversion coming soon.</p>
                </div>

                <Button className="w-full" rightIcon={<ArrowRight size={14} />} onClick={next}>
                  Continue
                </Button>
              </div>
            )}

            {/* STEP 2 — Beneficiary */}
            {step === 2 && (
              <div className="p-6 space-y-4">
                {/* Quick-pick from saved */}
                {savedBens.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-[var(--ink-2)] mb-2">Saved beneficiaries</p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {savedBens.map(b => (
                        <button
                          key={b.id}
                          onClick={() => selectBeneficiary(b)}
                          className={cn(
                            'px-3 py-1.5 rounded-xl text-xs border transition-all',
                            form.walletAddress === b.wallet_address
                              ? 'border-[var(--accent)] bg-[var(--accent)]/8 text-[var(--accent)] font-semibold'
                              : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)]/50 hover:text-[var(--ink)]'
                          )}
                        >
                          {b.name}
                        </button>
                      ))}
                    </div>
                    <div className="relative my-3">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--border)]" /></div>
                      <div className="relative flex justify-center"><span className="bg-[var(--surface-strong)] px-2 text-[10px] text-[var(--subtle)]">or enter manually</span></div>
                    </div>
                  </div>
                )}

                <Input
                  label="Full name *"
                  placeholder="Jane Smith"
                  value={form.beneficiaryName}
                  onChange={e => setForm(f => ({ ...f, beneficiaryName: e.target.value }))}
                  error={errors.beneficiaryName}
                />
                <Input
                  label="Company (optional)"
                  placeholder="Acme Corp"
                  value={form.company}
                  onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                />
                <Input
                  label="Wallet address *"
                  placeholder="0x…"
                  value={form.walletAddress}
                  onChange={e => setForm(f => ({ ...f, walletAddress: e.target.value }))}
                  error={errors.walletAddress}
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[var(--ink-2)]">Country</label>
                  <select
                    value={form.country}
                    onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                    className="w-full h-10 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)]"
                  >
                    {COUNTRIES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <Input
                  label="Payment reference (optional)"
                  placeholder="INV-2026-001"
                  value={form.reference}
                  onChange={e => setForm(f => ({ ...f, reference: e.target.value }))}
                />
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.saveAsBeneficiary}
                    onChange={e => setForm(f => ({ ...f, saveAsBeneficiary: e.target.checked }))}
                    className="accent-[var(--accent)] w-4 h-4 rounded"
                  />
                  <span className="text-xs text-[var(--muted)]">Save as beneficiary for future payments</span>
                </label>

                <div className="flex gap-3">
                  <Button variant="secondary" className="flex-1" leftIcon={<ArrowLeft size={14} />} onClick={back}>Back</Button>
                  <Button className="flex-1" rightIcon={<ArrowRight size={14} />} onClick={next}>Continue</Button>
                </div>
              </div>
            )}

            {/* STEP 3 — Review */}
            {step === 3 && (
              <div className="p-6 space-y-4">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] overflow-hidden">
                  <div className="px-4 py-3 border-b border-[var(--border)]">
                    <p className="text-xs font-semibold text-[var(--subtle)] label-caps">Payment summary</p>
                  </div>
                  <div className="divide-y divide-[var(--border)]">
                    {[
                      { label: 'Amount',       value: formatCurrency(parseFloat(form.amount) || 0) },
                      { label: 'Currency',     value: form.currency },
                      { label: 'Network',      value: 'Arc' },
                      { label: 'Beneficiary',  value: form.beneficiaryName },
                      { label: 'Wallet',       value: formatAddress(form.walletAddress) },
                      { label: 'Reference',    value: form.reference || '—' },
                      { label: 'Est. fee',     value: `${estimatedFee} USDC` },
                      { label: 'Est. time',    value: '< 1 second' },
                    ].map(row => (
                      <div key={row.label} className="flex items-center justify-between px-4 py-2.5">
                        <span className="text-xs text-[var(--subtle)]">{row.label}</span>
                        <span className="text-xs font-medium text-[var(--ink)] text-right max-w-[55%] truncate">{row.value}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between px-4 py-3 bg-[var(--surface)]">
                      <span className="text-sm font-semibold text-[var(--ink)]">Total</span>
                      <span className="display text-sm font-bold text-[var(--ink)] tabular">{formatCurrency(parseFloat(total))} USDC</span>
                    </div>
                  </div>
                </div>

                {!isConnected && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-[var(--danger-bg)] border border-[var(--danger)]/20">
                    <AlertCircle size={14} className="text-[var(--danger)] shrink-0 mt-0.5" />
                    <p className="text-xs text-[var(--danger)]">
                      <strong>Wallet not connected.</strong> Connect your wallet in the top bar before continuing — a real on-chain USDC transfer on Arc is required.
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button variant="secondary" className="flex-1" leftIcon={<ArrowLeft size={14} />} onClick={back}>Back</Button>
                  <Button className="flex-1" rightIcon={<ArrowRight size={14} />} onClick={next}>Review</Button>
                </div>
              </div>
            )}

            {/* STEP 4 — Confirm */}
            {step === 4 && (
              <div className="p-6 space-y-5">
                <div className="text-center py-2">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--accent)]/8 border border-[var(--accent)]/20 flex items-center justify-center mx-auto mb-3">
                    <span className="display text-2xl font-bold text-[var(--accent)]">?</span>
                  </div>
                  <p className="display text-2xl font-bold text-[var(--ink)] tabular">{formatCurrency(parseFloat(form.amount) || 0)}</p>
                  <p className="text-sm text-[var(--muted)] mt-1">to {form.beneficiaryName}</p>
                  {form.reference && <p className="text-xs text-[var(--subtle)] mt-0.5">{form.reference}</p>}
                </div>

                {!isConnected ? (
                  <div className="p-4 rounded-xl bg-[var(--danger-bg)] border border-[var(--danger)]/20">
                    <p className="text-xs font-semibold text-[var(--danger)] mb-1">Wallet not connected</p>
                    <p className="text-xs text-[var(--danger)]/80">
                      Connect your wallet in the top bar to send USDC on Arc.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-[var(--warning-bg)] border border-[var(--warning)]/20">
                    <p className="text-xs font-semibold text-[var(--warning)] mb-1">Confirm this payment</p>
                    <p className="text-xs text-[var(--warning)]/80 text-pretty">
                      This will initiate a real on-chain USDC transfer on Arc. This action cannot be undone.
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button variant="secondary" className="flex-1" leftIcon={<ArrowLeft size={14} />} onClick={back}>Back</Button>
                  <Button className="flex-1" disabled={!isConnected} onClick={() => void handleConfirm()}>
                    Confirm payment
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 5 — Processing */}
            {step === 5 && (
              <div className="p-6 space-y-5">
                <div className="text-center py-2">
                  {writeError ? (
                    <AlertCircle size={36} className="text-[var(--danger)] mx-auto mb-3" />
                  ) : (
                    <div className="w-12 h-12 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin mx-auto mb-3" />
                  )}
                  <p className="display text-base font-semibold text-[var(--ink)]">
                    {writeError ? 'Transaction failed' : isConfirming ? 'Confirming on Arc…' : 'Processing payment'}
                  </p>
                </div>

                {/* Timeline */}
                <div className="space-y-3">
                  {TIMELINE_STEPS.map((ts, i) => {
                    const done  = i < timeline.length;
                    const active = i === timeline.length && !writeError;
                    return (
                      <div key={ts} className="flex items-center gap-3">
                        <div className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all',
                          done   ? 'bg-[var(--success)] text-white' :
                          active ? 'bg-[var(--accent)] text-white' :
                                   'bg-[var(--surface-muted)] border border-[var(--border)]'
                        )}>
                          {done ? <Check size={12} /> : active ? <Loader2 size={11} className="animate-spin" /> : null}
                        </div>
                        <span className={cn(
                          'text-sm transition-all',
                          done   ? 'text-[var(--ink)] font-medium' :
                          active ? 'text-[var(--accent)] font-medium' :
                                   'text-[var(--subtle)]'
                        )}>
                          {ts}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {writeError && (
                  <div className="p-3 rounded-xl bg-[var(--danger-bg)] border border-[var(--danger)]/20">
                    <p className="text-xs text-[var(--danger)]">{writeError.message.slice(0, 120)}</p>
                    <Button size="sm" variant="secondary" className="mt-2" onClick={onClose}>Close</Button>
                  </div>
                )}
              </div>
            )}

            {/* STEP 6 — Receipt */}
            {step === 6 && payment && (
              <div className="p-6 space-y-4">
                <div className="text-center py-2">
                  <CheckCircle2 size={40} className="text-[var(--success)] mx-auto mb-3" />
                  <p className="display text-xl font-bold text-[var(--ink)]">Payment sent</p>
                  <p className="text-sm text-[var(--muted)] mt-1">
                    {formatCurrency(parseFloat(form.amount))} USDC to {form.beneficiaryName}
                  </p>
                </div>

                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-[var(--border)]">
                    <p className="text-[10px] font-semibold text-[var(--subtle)] label-caps">Receipt</p>
                  </div>
                  <div className="divide-y divide-[var(--border)]">
                    {[
                      { label: 'Payment ID',  value: payment.id, mono: true, copy: 'pid' },
                      { label: 'Beneficiary', value: form.beneficiaryName },
                      { label: 'Amount',      value: `${form.amount} USDC` },
                      { label: 'Network',     value: 'Arc' },
                      { label: 'Status',      value: 'Confirmed' },
                      { label: 'Timestamp',   value: formatDateTime(payment.created_at) },
                      ...(txHash ? [{ label: 'Tx hash', value: formatAddress(txHash, 8), mono: true, copy: 'txh', link: `https://explorer.arc.io/tx/${txHash}` }] : []),
                    ].map(row => (
                      <div key={row.label} className="flex items-center justify-between px-4 py-2.5 gap-3">
                        <span className="text-xs text-[var(--subtle)] shrink-0">{row.label}</span>
                        <div className="flex items-center gap-1 min-w-0">
                          <span className={cn('text-xs font-medium text-[var(--ink)] truncate', row.mono && 'mono')}>
                            {row.value}
                          </span>
                          {row.copy && (
                            <button onClick={() => void copyText(row.mono ? (row.label === 'Payment ID' ? payment.id : txHash ?? '') : '', row.copy)} className="p-0.5 text-[var(--subtle)] hover:text-[var(--ink)] shrink-0">
                              {copied === row.copy ? <Check size={11} className="text-[var(--success)]" /> : <Copy size={11} />}
                            </button>
                          )}
                          {'link' in row && row.link && (
                            <a href={row.link} target="_blank" rel="noreferrer" className="p-0.5 text-[var(--subtle)] hover:text-[var(--accent)] shrink-0">
                              <ExternalLink size={11} />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {!isConnected && (
                  <p className="text-xs text-center text-[var(--subtle)]">
                    Wallet not connected — no on-chain transfer was made.
                  </p>
                )}

                <Button className="w-full" onClick={onClose}>Done</Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

const TIMELINE_STEPS = [
  'Payment created',
  'Authorization approved',
  'Submitted to Arc',
  'Confirmed',
];
