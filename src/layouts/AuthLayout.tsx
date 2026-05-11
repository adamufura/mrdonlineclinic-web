import { Link, Outlet } from 'react-router-dom';
import { AuthFormTop } from '@/components/auth/AuthFormTop';
import { AuthVisualAside } from '@/components/auth/AuthVisualAside';
import { ROUTES } from '@/router/routes';

export function AuthLayout() {
  return (
    <div className="grid min-h-dvh grid-cols-1 font-sans text-brand-navy md:grid-cols-[1.05fr_1fr]">
      {/* Mobile — match visual pane tone */}
      <div className="flex items-center justify-between border-b border-white/10 bg-auth-visual px-4 py-3.5 md:hidden">
        <Link to={ROUTES.home} className="font-display text-[0.95rem] font-medium tracking-tight text-white">
          MRD <span className="font-light text-white/70">Online Clinic</span>
        </Link>
        <Link to={ROUTES.home} className="text-xs font-semibold text-white/85 underline-offset-2 hover:underline">
          Home
        </Link>
      </div>

      <AuthVisualAside />

      <div className="relative flex min-h-0 flex-col">
        <div className="pointer-events-none absolute inset-0 bg-auth-form-canvas" aria-hidden />
        <div className="pointer-events-none absolute -right-28 -top-28 size-[22rem] rounded-full bg-sky-400/[0.11] blur-3xl" aria-hidden />
        <div className="relative z-10 flex flex-1 flex-col px-5 py-8 sm:px-8 md:px-11 md:py-10">
          <AuthFormTop />
          <div className="mx-auto w-full max-w-[480px] flex-1 pb-10">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
