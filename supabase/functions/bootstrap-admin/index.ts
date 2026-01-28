import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-bootstrap-key",
};

// Bootstrap key for initial admin setup - should be changed after first use
const BOOTSTRAP_KEY = "MRG-BOOTSTRAP-2024-SETUP";

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check for bootstrap key in header
    const bootstrapKey = req.headers.get("x-bootstrap-key");
    if (bootstrapKey !== BOOTSTRAP_KEY) {
      return new Response(
        JSON.stringify({ error: "Invalid bootstrap key" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email } = await req.json() as { email: string };

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUsers?.users.some((u) => u.email === email);

    if (userExists) {
      // User exists, send password reset email
      const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email: email,
      });

      if (resetError) {
        return new Response(
          JSON.stringify({ error: `Failed to generate reset link: ${resetError.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ 
          message: "User already exists. Password reset link generated.",
          status: "exists"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate a secure temporary password
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    const array = new Uint8Array(24);
    crypto.getRandomValues(array);
    const tempPassword = Array.from(array, (byte) => chars[byte % chars.length]).join("");

    // Create the user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: tempPassword,
      email_confirm: true,
    });

    if (createError) {
      return new Response(
        JSON.stringify({ error: `Failed to create user: ${createError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate a password reset link for the user
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: email,
    });

    if (linkError) {
      return new Response(
        JSON.stringify({ 
          message: "User created but could not generate reset link",
          status: "created",
          userId: newUser.user?.id
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        message: "Admin user created successfully",
        status: "created",
        userId: newUser.user?.id,
        resetLink: linkData.properties?.action_link
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
