import { useAuth } from "@/hooks/useAuth";
import { useMemberData } from "@/hooks/useMemberData";
import { Header } from "@/components/dashboard/Header";
import { BalanceCard } from "@/components/dashboard/BalanceCard";
import { MemberInfo } from "@/components/dashboard/MemberInfo";
import { Loader2, AlertCircle } from "lucide-react";

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth(true);
  const { memberData, isLoading: dataLoading, error } = useMemberData(user);

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen gradient-hero">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto glass-card rounded-2xl p-8 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-display font-semibold text-foreground mb-2">
              Unable to Load Data
            </h2>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </main>
      </div>
    );
  }

  if (!memberData) {
    return null;
  }

  return (
    <div className="min-h-screen gradient-hero">
      <Header />
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Welcome message */}
          <div className="animate-fade-in">
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
              Welcome back
            </h1>
            <p className="text-muted-foreground">
              Here's your current MRG membership status
            </p>
          </div>

          {/* Balance Card */}
          <BalanceCard balance={memberData.available_balance} />

          {/* Member Info */}
          <MemberInfo 
            email={memberData.email} 
            purchaseRound={memberData.purchase_round} 
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center">
        <p className="text-xs text-muted-foreground">
          © 2026 MetaRising. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
