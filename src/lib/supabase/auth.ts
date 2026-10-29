import { cache } from "react";
import { createClient } from "./server";
import type { Database } from "@/types/database.types";
import { redirect } from "next/navigation";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/**
 * Retrieves the current authenticated user and their profile on the server.
 * Uses React cache for per-request memoization across layout, page, and server components.
 */
export const getCurrentUser = cache(
  async (): Promise<{
    user: { id: string; email?: string } | null;
    profile: Profile | null;
  }> => {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { user: null, profile: null };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    return {
      user: {
        id: user.id,
        email: user.email,
      },
      profile: profile || null,
    };
  }
);

/**
 * Asserts that a user is authenticated. If not, redirects to the sign-in page.
 */
export async function requireUser(redirectTo: string = "/auth/sign-in"): Promise<{
  user: { id: string; email?: string };
  profile: Profile | null;
}> {
  const { user, profile } = await getCurrentUser();

  if (!user) {
    redirect(redirectTo);
  }

  return { user, profile };
}
