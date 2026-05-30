"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AUTH_ROUTES } from "@/lib/auth/routes";
import { signIn, type AuthActionState } from "@/lib/auth/actions";

function IconAt({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path strokeLinecap="round" d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" />
    </svg>
  );
}

function IconLock({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path strokeLinecap="round" d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function IconShield({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function IconEye({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconEyeOff({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function FieldIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400/80">
      {children}
    </span>
  );
}

const initialState: AuthActionState = {};

export default function ReliefWorkerLogin() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? AUTH_ROUTES.dashboard;
  const [state, formAction, isPending] = useActionState(signIn, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative min-h-screen overflow-hidden font-sans">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=2400&q=80')",
        }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[2px]" aria-hidden />
      <div
        className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-cyan-950/40 to-slate-900/95"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-32 top-20 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl"
        aria-hidden
      />

      <div className="relative z-10 flex min-h-screen flex-col px-4 py-10 sm:px-6 lg:px-8">
        <header className="mx-auto mb-8 max-w-4xl text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-medium tracking-widest text-cyan-300 uppercase">
            <IconShield className="h-3.5 w-3.5" />
            Disaster Response Network
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-4xl">
            Emergency Relief Worker Login
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-white/60 sm:text-base">
            Sign in to access the disaster response coordination portal and manage
            emergency rescue operations.
          </p>
        </header>

        <div
          className="registration-glass mx-auto w-full max-w-md overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-black/50"
          role="region"
          aria-label="Login"
        >
          <div className="p-6 sm:p-8">
            <form action={formAction} className="space-y-5">
              <input type="hidden" name="next" value={next} />

              {state.error ? (
                <p
                  role="alert"
                  className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
                >
                  {state.error}
                </p>
              ) : null}

              <label htmlFor="usernameOrEmail" className="block">
                <span className="mb-1.5 block text-xs font-medium tracking-wide text-white/70">
                  Username / Email
                </span>
                <p className="mb-2 text-xs text-white/45">
                  Use your registered username or email address
                </p>
                <div className="relative">
                  <FieldIcon>
                    <IconAt className="h-4 w-4" />
                  </FieldIcon>
                  <input
                    id="usernameOrEmail"
                    name="usernameOrEmail"
                    type="text"
                    autoComplete="username"
                    required
                    placeholder="Enter username or email"
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-11 pr-4 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-cyan-400/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>
              </label>

              <label htmlFor="password" className="block">
                <span className="mb-1.5 block text-xs font-medium tracking-wide text-white/70">
                  Password
                </span>
                <div className="relative">
                  <FieldIcon>
                    <IconLock className="h-4 w-4" />
                  </FieldIcon>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-11 pr-12 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-cyan-400/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-cyan-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-white/50 transition hover:text-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <IconEyeOff className="h-4 w-4" />
                    ) : (
                      <IconEye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </label>

              <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 py-4 text-base font-semibold tracking-wide text-white shadow-lg shadow-cyan-500/25 transition hover:from-cyan-400 hover:to-cyan-500 hover:shadow-cyan-500/40 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "Signing in…" : "Login to Emergency Portal"}
              </button>

              <p className="text-center text-sm text-white/50">
                Don&apos;t have an account?{" "}
                <Link
                  href={AUTH_ROUTES.register}
                  className="font-medium text-cyan-400 transition hover:text-cyan-300"
                >
                  Register
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
