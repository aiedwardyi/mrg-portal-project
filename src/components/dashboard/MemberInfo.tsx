import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Tag } from "lucide-react";

interface MemberInfoProps {
  email: string;
  purchaseRound: string;
}

const roundColors: Record<string, string> = {
  "Seed": "bg-success/10 text-success border-success/20",
  "Private A": "bg-primary/10 text-primary border-primary/20",
  "Private B": "bg-accent/10 text-accent border-accent/20",
  "Public": "bg-muted text-muted-foreground border-border",
};

export function MemberInfo({ email, purchaseRound }: MemberInfoProps) {
  const badgeColor = roundColors[purchaseRound] || roundColors["Public"];

  return (
    <Card className="glass-card animate-slide-up" style={{ animationDelay: "0.1s" }}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-display text-foreground">
          Account Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <Mail className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted-foreground mb-1">Email</p>
            <p className="text-foreground font-medium truncate">{email}</p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <Tag className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Purchase Round</p>
            <Badge 
              variant="outline" 
              className={`px-3 py-1 text-sm font-medium ${badgeColor}`}
            >
              {purchaseRound}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
