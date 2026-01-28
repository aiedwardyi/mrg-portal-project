import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Admin emails allowed to use this function
const ADMIN_EMAILS = ["aiedwardyi@gmail.com"]; // TODO: Update with actual admin email(s)

// Generate a cryptographically secure random password
function generateSecurePassword(length = 24): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join("");
}

interface ProvisionResult {
  email: string;
  status: "created" | "skipped" | "failed";
  error?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Authorization required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create client with user's token to verify identity
    const supabaseUser = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user and check admin status
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userEmail = claimsData.claims.email as string;
    if (!ADMIN_EMAILS.includes(userEmail)) {
      return new Response(JSON.stringify({ error: "Access denied. Admin privileges required." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // Fetch all members from the database
    const { data: members, error: fetchError } = await supabaseAdmin.from("members").select("email, user_id");

    if (fetchError) {
      return new Response(JSON.stringify({ error: `Failed to fetch members: ${fetchError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!members || members.length === 0) {
      return new Response(JSON.stringify({ message: "No members found", results: [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: ProvisionResult[] = [];

    for (const member of members) {
      // Skip if already has a user_id (already provisioned)
      if (member.user_id) {
        results.push({ email: member.email, status: "skipped" });
        continue;
      }

      try {
        // Check if auth user already exists by trying to get user by email
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const userExists = existingUsers?.users.some((u) => u.email === member.email);

        if (userExists) {
          results.push({ email: member.email, status: "skipped" });
          continue;
        }

        // Generate a secure random password (user will never see this)
        const tempPassword = generateSecurePassword();

        // Create the auth user without sending any emails
        const { error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: member.email,
          password: tempPassword,
          email_confirm: true, // Auto-confirm so they can use forgot password
          // No email_invite or phone - prevents sending emails
        });

        if (createError) {
          // Check if it's a duplicate email error
          if (
            createError.message.includes("already been registered") ||
            createError.message.includes("already exists")
          ) {
            results.push({ email: member.email, status: "skipped" });
          } else {
            results.push({ email: member.email, status: "failed", error: createError.message });
          }
        } else {
          results.push({ email: member.email, status: "created" });
        }
      } catch (err) {
        results.push({
          email: member.email,
          status: "failed",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    const createdCount = results.filter((r) => r.status === "created").length;
    const skippedCount = results.filter((r) => r.status === "skipped").length;
    const failedCount = results.filter((r) => r.status === "failed").length;

    return new Response(
      JSON.stringify({
        message: `Provisioned ${createdCount} users, skipped ${skippedCount}, failed ${failedCount}`,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
