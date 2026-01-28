import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className, size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative">
        <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shadow-glow">
          <span className="text-primary-foreground font-bold text-sm font-display">M</span>
        </div>
      </div>
      <span className={cn("font-display font-bold text-foreground", sizeClasses[size])}>
        MRG <span className="text-primary">Dashboard</span>
      </span>
    </div>
  );
}
