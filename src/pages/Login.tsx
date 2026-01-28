import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LoginForm } from "@/components/auth/LoginForm";
import { Logo } from "@/components/ui/Logo";

export default function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

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
            <div className="text-center mb-8">
              <h1 className="text-2xl font-display font-bold text-foreground mb-2">
                Welcome Back
              </h1>
              <p className="text-muted-foreground">
                Sign in to view your MRG balance
              </p>
            </div>
            <LoginForm />
          </div>
          
          <p className="text-center text-xs text-muted-foreground mt-6">
            This portal is for existing MetaRising members only.
          </p>
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
