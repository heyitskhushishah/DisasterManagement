"use server";

import { redirect } from "next/navigation";
import { AUTH_ROUTES } from "@/lib/auth/routes";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = {
  error?: string;
};

function normalizeIdentifier(value: string) {
  return value.trim();
}

async function resolveEmail(identifier: string) {
  const trimmed = normalizeIdentifier(identifier);

  if (trimmed.includes("@")) {
    return trimmed;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_email_by_username", {
    p_username: trimmed,
  });

  if (error || !data) {
    return null;
  }

  return data as string;
}

export async function signIn(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const identifier = String(formData.get("usernameOrEmail") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!identifier || !password) {
    return { error: "Username/email and password are required." };
  }

  const email = await resolveEmail(identifier);

  if (!email) {
    return { error: "No account found for that username or email." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  const next = String(formData.get("next") ?? AUTH_ROUTES.dashboard);
  redirect(next.startsWith("/") ? next : AUTH_ROUTES.dashboard);
}

export async function signUp(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const organization = String(formData.get("organization") ?? "").trim();
  const role = String(formData.get("role") ?? "Volunteer");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const emergencyContact = String(formData.get("emergencyContact") ?? "").trim();

  if (!fullName || !username || !email || !password) {
    return { error: "Please fill in all required fields." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  if (!/^[a-zA-Z0-9_]{5,15}$/.test(username)) {
    return {
      error:
        "Username must be 5–15 characters and contain only letters, numbers, and underscores.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        username,
        phone,
        organization,
        role,
        emergency_contact: emergencyContact,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  redirect(AUTH_ROUTES.dashboard);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(AUTH_ROUTES.login);
}
