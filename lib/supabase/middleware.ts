import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase/env";
import type { AppRole } from "@/lib/sos/roles";
import { isResponder } from "@/lib/sos/roles";

export type SessionUser = {
  id: string;
  email: string;
  role: AppRole | null;
};

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: AppRole | null = null;
  if (user) {
    const jwtRole = user.app_metadata?.app_role as AppRole | undefined;
    if (jwtRole && isResponder(jwtRole)) {
      role = jwtRole;
    } else {
      const { data: profile } = await supabase
        .from("profiles")
        .select("app_role")
        .eq("id", user.id)
        .single();
      role = (profile?.app_role as AppRole) ?? "civilian";
    }
  }

  return { supabaseResponse, user: user ? { id: user.id, email: user.email ?? "", role } : null };
}

export function checkRouteAccess(
  pathname: string,
  user: SessionUser | null,
): { allowed: boolean; redirectTo: string | null } {
  if (!user) {
    return { allowed: false, redirectTo: "/login" };
  }

  const role = user.role ?? "civilian";

  if (pathname === "/sos/create") {
    return { allowed: role === "civilian", redirectTo: role === "civilian" ? null : "/dashboard" };
  }
  if (pathname === "/sos/my-requests") {
    return { allowed: role === "civilian", redirectTo: role === "civilian" ? null : "/dashboard" };
  }
  if (pathname.startsWith("/sos/all-requests")) {
    const allowed = role !== "civilian";
    return { allowed, redirectTo: allowed ? null : "/dashboard" };
  }
  if (pathname.startsWith("/sos/dispatch")) {
    const allowed = role === "coordinator";
    return { allowed, redirectTo: allowed ? null : "/dashboard" };
  }
  if (pathname.startsWith("/sos/analytics")) {
    const allowed = role === "coordinator";
    return { allowed, redirectTo: allowed ? null : "/dashboard" };
  }

  return { allowed: true, redirectTo: null };
}
