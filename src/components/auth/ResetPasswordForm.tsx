import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Lock, Loader2, CheckCircle } from "lucide-react";

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const verifyToken = async () => {
      // Get token and email from URL query params
      const token = searchParams.get("token");
      const email = searchParams.get("email");

      // Also check for hash fragment (Supabase's default format)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");

      if (accessToken) {
        // Handle Supabase's default hash format (for preview compatibility)
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setIsValidToken(true);
          setIsVerifying(false);
          return;
        }
      }

      if (token && email) {
        // Verify the OTP token from the custom email link
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: "recovery",
        });

        if (error) {
          console.error("Token verification error:", error);
          toast({
            title: "Invalid or Expired Link",
            description: "Please request a new password reset link.",
            variant: "destructive",
          });
          navigate("/forgot-password");
          return;
        }

        setIsValidToken(true);
        setIsVerifying(false);
        return;
      }

      // No valid token found
      toast({
        title: "Invalid Link",
        description: "Please request a new password reset link.",
        variant: "destructive",
      });
      navigate("/forgot-password");
    };

    verifyToken();
  }, [navigate, toast, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setIsSuccess(true);
      toast({
        title: "Password Updated",
        description: "Your password has been successfully reset.",
      });

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while verifying token
  if (isVerifying) {
    return (
      <div className="text-center space-y-6 animate-fade-in">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground">Verifying your reset link...</p>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="text-center space-y-6 animate-fade-in">
        <div className="mx-auto w-16 h-16 rounded-full gradient-primary flex items-center justify-center shadow-glow">
          <CheckCircle className="h-8 w-8 text-primary-foreground" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-display font-semibold text-foreground">
            Password Updated!
          </h2>
          <p className="text-muted-foreground">
            Redirecting you to your dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-xl font-display font-semibold text-foreground">
          Set a new password
        </h2>
        <p className="text-muted-foreground text-sm">
          Enter your new password below
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-foreground font-medium">
          New Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10 h-12 bg-background border-border focus:border-primary focus:ring-primary"
            required
            disabled={isLoading}
            minLength={6}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-foreground font-medium">
          Confirm Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="pl-10 h-12 bg-background border-border focus:border-primary focus:ring-primary"
            required
            disabled={isLoading}
            minLength={6}
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
            Updating...
          </>
        ) : (
          "Update Password"
        )}
      </Button>
    </form>
  );
}
