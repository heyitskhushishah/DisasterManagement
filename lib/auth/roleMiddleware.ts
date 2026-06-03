import type { NextRequest } from "next/server";
import { checkRouteAccess } from "@/lib/supabase/middleware";
import { updateSession } from "@/lib/supabase/middleware";
import { NextResponse } from "next/server";

export async function roleMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { supabaseResponse, user } = await updateSession(request);
  const isAuthenticated = Boolean(user);

  if (!isAuthenticated) {
    if (!pathname.startsWith("/login") && !pathname.startsWith("/register")) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  const { allowed, redirectTo } = checkRouteAccess(pathname, user);
  if (!allowed && redirectTo) {
    const url = request.nextUrl.clone();
    url.pathname = redirectTo;
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
