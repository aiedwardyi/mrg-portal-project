import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface MemberData {
  email: string;
  available_balance: number;
  purchase_round: string;
}

export function useMemberData(user: User | null) {
  const [memberData, setMemberData] = useState<MemberData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMemberData() {
      if (!user?.email) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from("members")
          .select("email, available_balance, purchase_round")
          .eq("user_id", user.id)
          .maybeSingle();

        if (fetchError) {
          console.error("Error fetching member data:", fetchError);
          setError("Failed to load your account data.");
          return;
        }

        if (!data) {
          setError("No member record found for your account. Please contact support.");
          return;
        }

        setMemberData({
          email: data.email,
          available_balance: Number(data.available_balance),
          purchase_round: data.purchase_round,
        });
      } catch (err) {
        console.error("Unexpected error:", err);
        setError("An unexpected error occurred.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchMemberData();
  }, [user]);

  return { memberData, isLoading, error };
}
