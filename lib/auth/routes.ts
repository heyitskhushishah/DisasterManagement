export const AUTH_ROUTES = {
  login: "/login",
  register: "/register",
  callback: "/auth/callback",
  dashboard: "/dashboard",
} as const;

export const PUBLIC_PATHS = [
  AUTH_ROUTES.login,
  AUTH_ROUTES.register,
  AUTH_ROUTES.callback,
] as const;

export function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function isAuthPage(pathname: string) {
  return (
    pathname === AUTH_ROUTES.login || pathname === AUTH_ROUTES.register
  );
}
