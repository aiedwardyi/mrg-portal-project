import { cn } from "@/lib/utils";
import metarisingLogo from "@/assets/metarising-logo.png";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className, size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: "h-6",
    md: "h-8",
    lg: "h-10",
  };

  return (
    <div className={cn("flex items-center", className)}>
      <img 
        src={metarisingLogo} 
        alt="MetaRising" 
        className={cn("w-auto", sizeClasses[size])}
      />
    </div>
  );
}
