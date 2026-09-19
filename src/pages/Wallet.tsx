import { useCallback, useEffect, useState } from 'react';
import {
  Wallet as WalletIcon, Copy, Check, ArrowDownLeft,
  ArrowUpRight, RefreshCw, ExternalLink, Info, Droplets,
} from 'lucide-react';
import { useAccount, useBalance, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { Button } from '@/components/ui/Button.tsx';
import { Input } from '@/components/ui/Input.tsx';
import { Modal } from '@/components/ui/Modal.tsx';
import { StatusBadge } from '@/components/ui/StatusBadge.tsx';
import { walletApi, paymentsApi } from '@/lib/api.ts';
import type { WalletData, Payment } from '@/lib/api.ts';
import { getUsdc } from '@/onchain-facts.ts';
import { formatAmount, parseAmount, Amount } from '@/onchain-money.ts';
import { arcTestnet } from '@/config.ts';
import { formatAddress, formatCurrency, timeAgo } from '@/lib/utils.ts';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function WalletPage() {
  const { address, isConnected } = useAccount();
  const usdcToken = getUsdc(arcTestnet.id);

  const { data: usdcBalance, refetch: refetchBalance } = useBalance({
    address,
    token: usdcToken?.address as `0x${string}` | undefined,
    chainId: arcTestnet.id,
    query: { enabled: isConnected && !!address && !!usdcToken },
  });

  const [walletData,  setWalletData]  = useState<WalletData | null>(null);
  const [payments,    setPayments]    = useState<Payment[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showReceive, setShowReceive] = useState(false);
  const [showSend,    setShowSend]    = useState(false);
  const [sendTo,      setSendTo]      = useState('');
  const [sendAmount,  setSendAmount]  = useState('');
  const [sendErrors,  setSendErrors]  = useState<Record<string, string>>({});
  const [copied,      setCopied]      = useState(false);

  const { sendTransaction, data: sendTxHash, isPending: isSending } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: sendTxHash });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [w, p] = await Promise.all([walletApi.balance(), paymentsApi.list()]);
      setWalletData(w.data);
      setPayments(p.payments.slice(0, 8));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // Sync connected wallet address to backend
  useEffect(() => {
    if (address) void walletApi.syncAddress(address);
  }, [address]);

  // Sync on-chain balance to backend
  useEffect(() => {
    if (usdcBalance && usdcToken) {
      void walletApi.syncBalance(
        formatAmount(arcTestnet.id, Amount.fromRaw(usdcBalance.value, usdcToken.decimals))
      );
    }
  }, [usdcBalance, usdcToken]);

  // Toast on confirmation
  useEffect(() => {
    if (isConfirmed) {
      toast.success('Transaction confirmed');
      void load();
      void refetchBalance();
      setShowSend(false);
    }
  }, [isConfirmed, load, refetchBalance]);

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function validateSend() {
    const e: Record<string, string> = {};
    if (!sendTo.trim()) e.to = 'Destination required';
    else if (!/^0x[0-9a-fA-F]{40}$/.test(sendTo)) e.to = 'Invalid wallet address';
    const amt = parseFloat(sendAmount);
    if (!sendAmount || isNaN(amt) || amt <= 0) e.amount = 'Invalid amount';
    setSendErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSend() {
    if (!validateSend() || !isConnected) return;
    if (!usdcToken) { toast.error('USDC token not found for this network'); return; }
    try {
      const amtObj = parseAmount(arcTestnet.id, sendAmount);
      // ERC-20 transfer: encode transfer(address,uint256)
      const data = encodeERC20Transfer(sendTo as `0x${string}`, amtObj.raw);
      sendTransaction({ to: usdcToken.address as `0x${string}`, data, chainId: arcTestnet.id });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Transaction failed');
    }
  }

  const displayAddress = address ?? walletData?.wallet_address;
  const onChainBalanceDisplay = usdcBalance && usdcToken
    ? formatAmount(arcTestnet.id, Amount.fromRaw(usdcBalance.value, usdcToken.decimals))
    : walletData?.on_chain_balance ?? '0';
  const availableBalance = walletData?.available_balance ?? '0';

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="display text-lg sm:text-xl font-semibold text-[var(--ink)] tracking-tight">Wallet</h2>
          <p className="text-xs sm:text-sm text-[var(--muted)] mt-0.5">Arc Testnet · USDC</p>
        </div>
        <Button size="sm" variant="secondary" leftIcon={<RefreshCw size={12} />} onClick={() => { void load(); void refetchBalance(); }}>
          Refresh
        </Button>
      </div>

      {/* Balance cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/8 flex items-center justify-center">
              <WalletIcon size={18} className="text-[var(--accent)]" />
            </div>
            <div className="flex items-center gap-1 text-[10px] text-[var(--subtle)]">
              <Info size={10} />
              <span>Available</span>
            </div>
          </div>
          <p className="text-[10px] font-semibold text-[var(--subtle)] label-caps mb-1">Available balance</p>
          <p className="display text-3xl font-bold text-[var(--ink)] tabular leading-none">
            {loading ? <span className="inline-block w-28 h-9 rounded animate-pulse bg-[var(--surface-muted)]" /> : `${availableBalance} USDC`}
          </p>
          <p className="text-xs text-[var(--subtle)] mt-2">Reflects confirmed + pending payments</p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--success-bg)] flex items-center justify-center">
              <Check size={16} className="text-[var(--success)]" />
            </div>
            <div className="flex items-center gap-1 text-[10px] text-[var(--subtle)]">
              <Info size={10} />
              <span>On-chain</span>
            </div>
          </div>
          <p className="text-[10px] font-semibold text-[var(--subtle)] label-caps mb-1">On-chain balance</p>
          <p className="display text-3xl font-bold text-[var(--ink)] tabular leading-none">
            {isConnected
              ? (usdcBalance && usdcToken
                  ? `${onChainBalanceDisplay} USDC`
                  : <span className="inline-block w-28 h-9 rounded animate-pulse bg-[var(--surface-muted)]" />)
              : <span className="text-base text-[var(--muted)]">Connect wallet</span>
            }
          </p>
          <p className="text-xs text-[var(--subtle)] mt-2">
            {isConnected ? 'Live from Arc Testnet' : 'Connect wallet in the top bar'}
          </p>
        </div>
      </div>

      {/* Wallet address + actions */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold text-[var(--subtle)] label-caps mb-1">Wallet address</p>
            {displayAddress ? (
              <div className="flex items-center gap-2">
                <span className="mono text-sm text-[var(--ink)]">{formatAddress(displayAddress, 10)}</span>
                <button onClick={() => void copy(displayAddress)} className="p-1 text-[var(--subtle)] hover:text-[var(--ink)] transition-colors">
                  {copied ? <Check size={13} className="text-[var(--success)]" /> : <Copy size={13} />}
                </button>
                <a
                  href={`https://explorer.testnet.arc.io/address/${displayAddress}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 text-[var(--subtle)] hover:text-[var(--accent)] transition-colors"
                >
                  <ExternalLink size={13} />
                </a>
              </div>
            ) : (
              <p className="text-sm text-[var(--muted)]">Connect wallet to view address</p>
            )}
            <p className="text-[10px] text-[var(--subtle)] mt-1">Arc Testnet · USDC</p>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" leftIcon={<ArrowDownLeft size={12} />} onClick={() => setShowReceive(true)}>
              Receive
            </Button>
            <Button size="sm" leftIcon={<ArrowUpRight size={12} />} onClick={() => setShowSend(true)} disabled={!isConnected}>
              Send
            </Button>
          </div>
        </div>
      </div>

      {/* Arc Testnet Faucet */}
      <div className="rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent)]/4 p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center shrink-0">
            <Droplets size={18} className="text-[var(--accent)]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[var(--ink)]">Get testnet USDC</p>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Need USDC to test payments? Use the Arc Testnet faucet to get free test tokens.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <a
                href="https://faucet.circle.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                <Droplets size={12} />
                Circle Faucet
                <ExternalLink size={10} />
              </a>
              {displayAddress && (
                <button
                  onClick={() => void copy(displayAddress)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--ink)] hover:bg-[var(--surface-muted)] transition-colors"
                >
                  {copied ? <Check size={11} className="text-[var(--success)]" /> : <Copy size={11} />}
                  Copy my address
                </button>
              )}
            </div>
            <p className="text-[10px] text-[var(--subtle)] mt-2">
              Select "Arc Testnet" and paste your wallet address on the faucet page.
            </p>
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)]">
          <p className="text-sm font-semibold text-[var(--ink)]">Recent activity</p>
        </div>
        {loading ? (
          <div className="divide-y divide-[var(--border)]">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="w-8 h-8 rounded-xl bg-[var(--surface-muted)] animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/3 bg-[var(--surface-muted)] rounded animate-pulse" />
                  <div className="h-2 w-1/4 bg-[var(--surface-muted)] rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : payments.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-[var(--muted)]">No transactions yet</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {payments.map(p => (
              <div key={p.id} className="flex items-center gap-4 px-5 py-4">
                <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/8 flex items-center justify-center shrink-0">
                  <ArrowUpRight size={14} className="text-[var(--accent)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--ink)] truncate">{p.beneficiary_name}</p>
                  <p className="text-xs text-[var(--subtle)]">{timeAgo(p.created_at)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-[var(--ink)] tabular">{formatCurrency(p.amount)}</p>
                  <StatusBadge status={p.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Receive modal */}
      <Modal open={showReceive} onClose={() => setShowReceive(false)} title="Receive USDC">
        <div className="p-6 text-center space-y-4">
          <div className="w-40 h-40 mx-auto rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--surface-muted)] flex items-center justify-center">
            <div className="text-center">
              <WalletIcon size={24} className="text-[var(--subtle)] mx-auto mb-2" />
              <p className="text-xs text-[var(--subtle)]">QR coming soon</p>
            </div>
          </div>
          {displayAddress ? (
            <div className="p-3 rounded-xl bg-[var(--surface-muted)] border border-[var(--border)]">
              <p className="mono text-xs text-[var(--ink)] break-all">{displayAddress}</p>
            </div>
          ) : (
            <p className="text-sm text-[var(--muted)]">Connect a wallet to view your address</p>
          )}
          {displayAddress && (
            <Button className="w-full" leftIcon={<Copy size={13} />} onClick={() => { void copy(displayAddress); toast.success('Address copied'); }}>
              Copy address
            </Button>
          )}
          <p className="text-xs text-[var(--subtle)]">Send USDC on Arc Testnet only</p>
        </div>
      </Modal>

      {/* Send modal */}
      <Modal open={showSend} onClose={() => { setShowSend(false); setSendTo(''); setSendAmount(''); setSendErrors({}); }} title="Send USDC">
        <div className="p-6 space-y-4">
          {!isConnected && (
            <div className="p-3 rounded-xl bg-[var(--warning-bg)] border border-[var(--warning)]/20 text-xs text-[var(--warning)]">
              Connect your wallet to send USDC.
            </div>
          )}
          <Input
            label="Destination address"
            placeholder="0x…"
            value={sendTo}
            onChange={e => setSendTo(e.target.value)}
            error={sendErrors.to}
          />
          <Input
            label="Amount (USDC)"
            placeholder="100.00"
            type="number"
            min="0"
            value={sendAmount}
            onChange={e => setSendAmount(e.target.value)}
            error={sendErrors.amount}
            rightAddon={<span className="text-xs font-medium">USDC</span>}
          />
          <div className="p-3 rounded-xl bg-[var(--surface-muted)] border border-[var(--border)] space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-[var(--subtle)]">Network</span>
              <span className="text-[var(--ink)]">Arc Testnet</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--subtle)]">Est. fee</span>
              <span className="text-[var(--ink)]">~0.001 USDC</span>
            </div>
          </div>
          {isSending && (
            <p className="text-xs text-[var(--blue)] text-center">Confirm in wallet…</p>
          )}
          {isConfirming && (
            <p className="text-xs text-[var(--blue)] text-center">Waiting for confirmation…</p>
          )}
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setShowSend(false)}>Cancel</Button>
            <Button className="flex-1" loading={isSending || isConfirming} disabled={!isConnected} onClick={() => void handleSend()}>
              Send USDC
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/** Encode ERC-20 transfer(address,uint256) calldata */
function encodeERC20Transfer(to: `0x${string}`, amount: bigint): `0x${string}` {
  const selector = '0xa9059cbb';
  const paddedTo = to.slice(2).padStart(64, '0');
  const paddedAmt = amount.toString(16).padStart(64, '0');
  return `${selector}${paddedTo}${paddedAmt}`;
}
