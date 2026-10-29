"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export type AuthActionResult = {
  error?: string;
  success?: boolean;
  message?: string;
};

/**
 * Signs in an existing user with email and password.
 */
export async function signIn(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();
  const redirectTo = formData.get("redirectTo")?.toString() || "/";

  if (!email || !password) {
    return { error: "Please provide both email and password." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // If blocked by unconfirmed email due to shared SMTP limits, auto-confirm via admin client and retry
    if (error.message.toLowerCase().includes("email not confirmed")) {
      try {
        const admin = createAdminClient();
        const { data: usersData } = await admin.auth.admin.listUsers();
        const existingUser = usersData?.users?.find(
          (u) => u.email?.toLowerCase() === email.toLowerCase()
        );
        if (existingUser) {
          await admin.auth.admin.updateUserById(existingUser.id, {
            email_confirm: true,
          });
          const retry = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (!retry.error) {
            redirect(redirectTo);
          }
        }
      } catch (adminErr) {
        console.warn("Auto-confirmation fallback encountered:", adminErr);
      }
    }
    return { error: error.message };
  }

  redirect(redirectTo);
}

/**
 * Registers a new user and triggers profile creation.
 */
export async function signUp(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();
  const fullName = formData.get("fullName")?.toString().trim();

  if (!email || !password || !fullName) {
    return { error: "Full name, email, and password are required." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters long." };
  }

  const supabase = await createClient();

  // Try creating via admin client first with pre-confirmed email.
  // This completely eliminates Supabase free-tier SMTP rate limiting (HTTP 429)
  // and prevents users from being locked out awaiting confirmation emails that never arrive.
  try {
    const admin = createAdminClient();
    const { data: adminData, error: adminError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (adminError) {
      const msg = adminError.message.toLowerCase();
      if (msg.includes("already registered") || msg.includes("already exists")) {
        return { error: "An account with this email address already exists. Please sign in instead." };
      }
      // If it's a specific validation failure, return it
      if (!msg.includes("service_role") && !msg.includes("network")) {
        return { error: adminError.message };
      }
    } else if (adminData?.user) {
      // User successfully created and confirmed. Now establish the session.
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!signInError) {
        redirect("/");
      }

      // If auto-signin encountered an issue, inform user they can now log in
      return {
        success: true,
        message: "Account created successfully! You may now sign in with your credentials.",
      };
    }
  } catch (adminErr) {
    console.warn("Admin sign up fallback initiated:", adminErr);
  }

  // Standard fallback if admin creation wasn't reached
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") || "http";
  const origin = `${protocol}://${host}`;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes("rate limit") || (error as { status?: number }).status === 429) {
      return {
        error: "Supabase email rate limit exceeded. Please wait a few moments or contact your platform administrator.",
      };
    }
    return { error: error.message };
  }

  // If Supabase has email confirmation enabled, data.session will be null
  if (data?.user && !data.session) {
    // Try to auto-confirm so the user isn't locked out
    try {
      const admin = createAdminClient();
      await admin.auth.admin.updateUserById(data.user.id, { email_confirm: true });
      const { error: autoSignInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (!autoSignInError) {
        redirect("/");
      }
    } catch {
      // Continue to email verification prompt
    }

    return {
      success: true,
      message:
        "Registration successful! Please check your institutional email to verify your account before signing in.",
    };
  }

  redirect("/");
}

/**
 * Requests a password reset email.
 */
export async function requestPasswordReset(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const email = formData.get("email")?.toString().trim();

  if (!email) {
    return { error: "Please enter your registered email address." };
  }

  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") || "http";
  const origin = `${protocol}://${host}`;

  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/auth/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return {
    success: true,
    message:
      "If an account exists with that email, a password recovery link has been sent. Please check your inbox.",
  };
}

/**
 * Updates the password for an authenticated session.
 */
export async function updatePassword(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const password = formData.get("password")?.toString();
  const confirmPassword = formData.get("confirmPassword")?.toString();

  if (!password || !confirmPassword) {
    return { error: "Please fill in all password fields." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters long." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/auth/sign-in?message=Password updated successfully. Please sign in.");
}

/**
 * Terminates user session.
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/sign-in");
}
