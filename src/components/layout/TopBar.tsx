import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { Wallet, ChevronDown, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/Button.tsx';
import { formatAddress } from '@/lib/utils.ts';
import { getUsdc } from '@/onchain-facts.ts';
import { formatAmount, Amount } from '@/onchain-money.ts';
import { arcTestnet } from '@/config.ts';

export function TopBar() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const usdcToken = getUsdc(arcTestnet.id);

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
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface-strong)]/95 backdrop-blur px-6 h-14">
      {/* Network status */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
          <Wifi size={12} className="text-[var(--success)]" />
          <span>Arc Testnet</span>
        </div>
        <span className="text-[var(--border)]">·</span>
        <span className="px-2 py-0.5 rounded-full bg-[var(--warning-bg)] text-[var(--warning)] text-[10px] font-semibold label-caps">
          Demo
        </span>
      </div>

      {/* Wallet */}
      <div className="flex items-center gap-3">
        {isConnected && address ? (
          <div className="flex items-center gap-2">
            {displayBalance && (
              <span className="text-xs font-semibold text-[var(--ink)] tabular">
                {displayBalance} USDC
              </span>
            )}
            <button
              onClick={() => disconnect()}
              className="flex items-center gap-2 h-8 px-3 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] text-xs font-medium text-[var(--ink)] hover:bg-[var(--surface-muted-hover)] transition-colors"
            >
              <div className="w-2 h-2 rounded-full bg-[var(--success)]" />
              {formatAddress(address)}
              <ChevronDown size={11} className="text-[var(--subtle)]" />
            </button>
          </div>
        ) : (
          <Button
            size="sm"
            leftIcon={<Wallet size={12} />}
            onClick={() => connect({ connector: injected() })}
          >
            Connect wallet
          </Button>
        )}
      </div>
    </header>
  );
}
