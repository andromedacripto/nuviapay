import { useAccount, useConnect, useDisconnect, useBalance, useChainId, useSwitchChain } from 'wagmi';
import { useEffect } from 'react';
import { injected } from 'wagmi/connectors';
import { Wallet, ChevronDown, Wifi, Menu, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button.tsx';
import { formatAddress } from '@/lib/utils.ts';
import { getUsdc } from '@/onchain-facts.ts';
import { formatAmount, Amount } from '@/onchain-money.ts';
import { arcTestnet } from '@/config.ts';

interface TopBarProps {
  onMenuOpen?: () => void;
}

export function TopBar({ onMenuOpen }: TopBarProps) {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const usdcToken = getUsdc(arcTestnet.id);
  const isWrongNetwork = isConnected && chainId !== arcTestnet.id;

  // Auto-switch to Arc when wallet connects on wrong network
  useEffect(() => {
    if (isWrongNetwork) {
      switchChain({ chainId: arcTestnet.id });
    }
  }, [isWrongNetwork, switchChain]);

  const { data: usdcBalance } = useBalance({
    address,
    token: usdcToken?.address as `0x${string}` | undefined,
    chainId: arcTestnet.id,
    query: { enabled: isConnected && !!address && !!usdcToken },
  });

  const displayBalance = usdcBalance && usdcToken
    ? formatAmount(arcTestnet.id, Amount.fromRaw(usdcBalance.value, usdcToken.decimals))
    : null;

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface-strong)]/95 backdrop-blur px-4 sm:px-6 h-14 gap-3">
      {/* Left: hamburger (mobile) + network status */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuOpen}
          className="lg:hidden -ml-1 w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[var(--surface-muted)] transition-colors shrink-0"
          aria-label="Open menu"
        >
          <Menu size={18} className="text-[var(--muted)]" />
        </button>

        {/* Network pill */}
        {isWrongNetwork ? (
          <button
            onClick={() => switchChain({ chainId: arcTestnet.id })}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[var(--warning-bg)] text-[var(--warning)] text-xs font-medium hover:opacity-80 transition-opacity"
          >
            <AlertTriangle size={11} className="shrink-0" />
            <span className="hidden sm:inline">Switch to Arc</span>
            <span className="sm:hidden">Wrong network</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
              <Wifi size={12} className="text-[var(--success)] shrink-0" />
              <span className="hidden sm:inline">Arc</span>
            </div>
            <span className="hidden sm:inline text-[var(--border)]">·</span>
            <span className="px-2 py-0.5 rounded-full bg-[var(--success-bg)] text-[var(--success)] text-[10px] font-semibold label-caps">
              Live
            </span>
          </div>
        )}
      </div>

      {/* Right: wallet */}
      <div className="flex items-center gap-2 shrink-0">
        {isConnected && address ? (
          <div className="flex items-center gap-2">
            {displayBalance && (
              <span className="hidden sm:inline text-xs font-semibold text-[var(--ink)] tabular">
                {displayBalance} USDC
              </span>
            )}
            <button
              onClick={() => disconnect()}
              className="flex items-center gap-2 h-8 px-2.5 sm:px-3 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] text-xs font-medium text-[var(--ink)] hover:bg-[var(--surface-muted-hover)] transition-colors"
            >
              <div className="w-2 h-2 rounded-full bg-[var(--success)] shrink-0" />
              <span className="hidden xs:inline">{formatAddress(address)}</span>
              <span className="xs:hidden">{formatAddress(address, 3)}</span>
              <ChevronDown size={11} className="text-[var(--subtle)]" />
            </button>
          </div>
        ) : (
          <Button
            size="sm"
            leftIcon={<Wallet size={12} />}
            onClick={() => connect({ connector: injected() })}
          >
            <span className="hidden sm:inline">Connect wallet</span>
            <span className="sm:hidden">Connect</span>
          </Button>
        )}
      </div>
    </header>
  );
}
