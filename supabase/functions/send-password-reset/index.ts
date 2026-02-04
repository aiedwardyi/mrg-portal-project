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
        options: {
          redirectTo: "https://mrgwallet.com/reset-password",
        },
      });

      if (linkError) {
        console.error("Error generating reset link:", linkError);
        // Still return success to prevent enumeration
      } else if (linkData?.properties?.action_link) {
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
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0f; color: #ffffff; margin: 0; padding: 40px 20px;">
              <div style="max-width: 480px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16162a 100%); border-radius: 16px; padding: 40px; border: 1px solid rgba(139, 92, 246, 0.2);">
                <h1 style="color: #a78bfa; margin: 0 0 24px 0; font-size: 24px; text-align: center;">MRG Wallet</h1>
                <h2 style="color: #ffffff; margin: 0 0 16px 0; font-size: 20px;">Reset Your Password</h2>
                <p style="color: #a1a1aa; line-height: 1.6; margin: 0 0 24px 0;">
                  You requested to reset your password. Click the button below to set a new password:
                </p>
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${linkData.properties.action_link}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Reset Password</a>
                </div>
                <p style="color: #71717a; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
                  If you didn't request this, you can safely ignore this email. This link will expire in 1 hour.
                </p>
                <hr style="border: none; border-top: 1px solid rgba(139, 92, 246, 0.2); margin: 32px 0;">
                <p style="color: #52525b; font-size: 12px; text-align: center; margin: 0;">
                  © 2026 MRG Wallet. All rights reserved.
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
