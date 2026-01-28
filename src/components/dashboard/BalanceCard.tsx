import { Wallet } from "lucide-react";

interface BalanceCardProps {
  balance: number;
}

export function BalanceCard({ balance }: BalanceCardProps) {
  const formattedBalance = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(balance);

  return (
    <div className="balance-card rounded-2xl p-8 text-primary-foreground animate-scale-in">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-primary-foreground/80 text-sm font-medium mb-1">
            Available Balance
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl md:text-5xl font-display font-bold">
              {formattedBalance}
            </span>
            <span className="text-xl font-semibold text-primary-foreground/90">
              MRG
            </span>
          </div>
        </div>
        <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
          <Wallet className="h-6 w-6 text-primary-foreground" />
        </div>
      </div>
      <p className="text-xs text-primary-foreground/60">
        Balances shown in MRG tokens
      </p>
    </div>
  );
}
