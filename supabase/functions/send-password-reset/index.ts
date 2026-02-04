import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PasswordResetRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: PasswordResetRequest = await req.json();

    // Validate required fields
    if (!email) {
      throw new Error("Email is required");
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if email exists in members table
    const { data: member } = await supabase
      .from("members")
      .select("id")
      .eq("email", trimmedEmail)
      .maybeSingle();

    // Only send reset email if member exists
    if (member) {
      // Generate password reset link using Supabase Admin API
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: "recovery",
        email: trimmedEmail,
      });

      if (linkError) {
        console.error("Error generating reset link:", linkError);
        // Still return success to prevent enumeration
      } else if (linkData?.properties?.action_link) {
        // Extract the token_hash from the generated link
        // The action_link format: https://xxx.supabase.co/auth/v1/verify?token=xxx&type=recovery&redirect_to=xxx
        const actionLink = linkData.properties.action_link;
        const url = new URL(actionLink);
        const token = url.searchParams.get("token");
        
        // Build a direct link to our custom domain with the token
        // The frontend will use verifyOtp to validate the token
        const resetUrl = `https://mrgwallet.com/reset-password?token=${token}&email=${encodeURIComponent(trimmedEmail)}`;
        
        // Send the email via Resend
        const emailResponse = await resend.emails.send({
          from: "MRG Wallet <noreply@mrgwallet.com>",
          to: [trimmedEmail],
          subject: "Reset your MRG Wallet password",
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f7fa; color: #1e293b; margin: 0; padding: 40px 20px;">
              <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 10px 15px -3px rgba(30, 41, 59, 0.08), 0 4px 6px -4px rgba(30, 41, 59, 0.05); border: 1px solid #e2e8f0;">
                <div style="text-align: center; margin-bottom: 32px;">
                  <h1 style="color: #0891b2; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">METARISING</h1>
                  <p style="color: #64748b; margin: 8px 0 0 0; font-size: 14px;">MRG Wallet</p>
                </div>
                <h2 style="color: #1e293b; margin: 0 0 16px 0; font-size: 22px; font-weight: 600;">Reset Your Password</h2>
                <p style="color: #64748b; line-height: 1.7; margin: 0 0 28px 0; font-size: 15px;">
                  You requested to reset your password. Click the button below to set a new password:
                </p>
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #14b8a6 0%, #0891b2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px -3px rgba(20, 184, 166, 0.4);">Reset Password</a>
                </div>
                <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 28px 0 0 0;">
                  If you didn't request this, you can safely ignore this email. This link will expire in 1 hour.
                </p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">
                <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
                  © 2026 MetaRising. All rights reserved.
                </p>
              </div>
            </body>
            </html>
          `,
        });

        console.log("Password reset email sent successfully:", emailResponse);
      }
    }

    // Always return success to prevent email enumeration
    return new Response(
      JSON.stringify({ success: true, message: "If this email is registered, you will receive a password reset link." }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    console.error("Error in send-password-reset function:", error);
    // Still return success to prevent enumeration
    return new Response(
      JSON.stringify({ success: true, message: "If this email is registered, you will receive a password reset link." }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
