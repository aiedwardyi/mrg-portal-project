import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { Logo } from "@/components/ui/Logo";

export default function ForgotPassword() {
  return (
    <div className="min-h-screen gradient-hero flex flex-col">
      {/* Header */}
      <header className="p-6">
        <Logo size="md" />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-fade-in">
          <div className="glass-card rounded-2xl p-8">
            <ForgotPasswordForm />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center">
        <p className="text-xs text-muted-foreground">
          © 2026 MetaRising. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
