import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/sos/roles";

export type AuthUser = {
  id: string;
  email: string;
  role: AppRole;
};

export async function getAuthUser(): Promise<AuthUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Try JWT claim first
  const jwtRole = user.app_metadata?.app_role as AppRole | undefined;

  if (jwtRole) {
    return { id: user.id, email: user.email ?? "", role: jwtRole };
  }

  // Fallback to DB
  const { data: profile } = await supabase
    .from("profiles")
    .select("app_role")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email ?? "",
    role: (profile?.app_role as AppRole) ?? "civilian",
  };
}

export async function getAuthUserOrRedirect(
  redirectTo = "/login",
): Promise<AuthUser> {
  const user = await getAuthUser();
  if (!user) {
    const { redirect } = await import("next/navigation");
    redirect(redirectTo);
    throw new Error("redirect");
  }
  return user;
}
