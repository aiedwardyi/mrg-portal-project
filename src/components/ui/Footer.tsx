import { Cookie, Cherry } from "lucide-react";

export function Footer() {
  return (
    <footer className="py-6 text-center space-y-3">
      <div className="flex items-center justify-center gap-6 text-sm">
        <a 
          href="https://microtuber.io" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
        >
          <Cookie className="h-4 w-4" />
          <span>Microtuber</span>
        </a>
        <a 
          href="https://metarising.io" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
        >
          <Cherry className="h-4 w-4" />
          <span>MetaRising</span>
        </a>
      </div>
      <p className="text-xs text-muted-foreground">
        © 2026 MetaRising. All rights reserved.
      </p>
    </footer>
  );
}
