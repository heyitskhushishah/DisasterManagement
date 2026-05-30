import { type NextRequest, NextResponse } from "next/server";
import { AUTH_ROUTES, isAuthPage, isPublicPath } from "@/lib/auth/routes";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const { supabaseResponse, user } = await updateSession(request);
  const isAuthenticated = Boolean(user);
  const isPublic = isPublicPath(pathname);

  if (isAuthenticated && isAuthPage(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = AUTH_ROUTES.dashboard;
    return NextResponse.redirect(url);
  }

  if (!isAuthenticated && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = AUTH_ROUTES.login;
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
