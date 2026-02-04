import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const trimmedEmail = email.trim().toLowerCase();
      
      // Call edge function to send password reset via Resend
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-password-reset`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ email: trimmedEmail }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send reset email");
      }

      // Always show success message to prevent email enumeration
      setIsSuccess(true);
      toast({
        title: "Reset Link Sent",
        description: "If this email is registered, you will receive a password reset link.",
      });
    } catch (error) {
      // Still show success to prevent enumeration
      setIsSuccess(true);
      toast({
        title: "Reset Link Sent",
        description: "If this email is registered, you will receive a password reset link.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center space-y-6 animate-fade-in">
        <div className="mx-auto w-16 h-16 rounded-full gradient-primary flex items-center justify-center shadow-glow">
          <CheckCircle className="h-8 w-8 text-primary-foreground" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-display font-semibold text-foreground">
            Check your email
          </h2>
          <p className="text-muted-foreground">
            We've sent a password reset link to <strong className="text-foreground">{email}</strong>
          </p>
        </div>
        <Link to="/login">
          <Button variant="outline" className="w-full h-12">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-xl font-display font-semibold text-foreground">
          Reset your password
        </h2>
        <p className="text-muted-foreground text-sm">
          Enter your email and we'll send you a reset link
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-foreground font-medium">
          Email Address
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10 h-12 bg-background border-border focus:border-primary focus:ring-primary"
            required
            disabled={isLoading}
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full h-12 gradient-primary text-primary-foreground font-semibold shadow-glow hover:opacity-90 transition-opacity"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          "Send Reset Link"
        )}
      </Button>

      <Link to="/login" className="block">
        <Button variant="ghost" className="w-full h-12 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Login
        </Button>
      </Link>
    </form>
  );
}
