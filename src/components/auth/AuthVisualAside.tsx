import { Link, useLocation } from 'react-router-dom';
import { Star } from 'lucide-react';
import { AuthHeroIllustration } from '@/components/auth/AuthHeroIllustration';
import { ROUTES } from '@/router/routes';
import { cn } from '@/lib/utils/cn';

type AsideMode = 'role' | 'signup' | 'default';

function asideMode(pathname: string): AsideMode {
  if (pathname === ROUTES.register || pathname === `${ROUTES.register}/`) return 'role';
  if (pathname.startsWith(ROUTES.registerPatient) || pathname.startsWith(ROUTES.registerPractitioner)) return 'signup';
  return 'default';
}

function BrandMark() {
  return (
    <div className="flex size-9 shrink-0 items-center justify-center rounded-[11px] bg-gradient-to-br from-teal-300 to-sky-400 shadow-[0_8px_24px_rgba(56,189,248,0.35)] ring-1 ring-white/25 sm:size-10">
      <svg viewBox="0 0 24 24" className="size-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
        <circle cx="12" cy="12" r="9" />
        <path d="M9 12h6M12 9v6" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function TestimonialBlock() {
  return (
    <div className="relative z-10 rounded-[18px] border border-white/[0.08] bg-white/[0.04] px-5 py-5 backdrop-blur-md sm:px-6">
      <p className="font-display text-lg font-normal leading-snug tracking-tight text-white sm:text-[1.15rem]">
        <span className="mr-1 font-serif text-3xl leading-none text-teal-300">&ldquo;</span>
        Booked at 8am, spoke with Dr. Adeyemi by 9, prescription at my pharmacy by lunchtime. This is how care should work.
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-300 to-sky-400 font-display text-sm font-semibold text-slate-900">
          N
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="text-[13px] font-semibold text-white">Nneka I.</p>
          <p className="text-xs text-white/55">Patient · Lagos</p>
        </div>
        <div className="ml-auto flex gap-0.5 text-teal-300">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="size-3 fill-current" aria-hidden />
          ))}
        </div>
      </div>
    </div>
  );
}

function SignupFooter() {
  return (
    <div className="relative z-10 space-y-6">
      <div className="border-t border-white/[0.08] pt-6">
        <p className="max-w-[22rem] text-[15px] leading-relaxed text-white/90">
          Pick up exactly where you left off — your messages, appointments, and prescriptions.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2 border-t border-white/[0.08] pt-5 text-white">
        <div>
          <p className="font-display text-2xl font-medium tracking-tight">
            12k<em className="text-lg not-italic text-teal-300">+</em>
          </p>
          <p className="text-[11px] uppercase tracking-wider text-white/55">Patients seen</p>
        </div>
        <div>
          <p className="font-display text-2xl font-medium tracking-tight">
            340<em className="text-lg not-italic text-teal-300">+</em>
          </p>
          <p className="text-[11px] uppercase tracking-wider text-white/55">Verified doctors</p>
        </div>
        <div>
          <p className="font-display text-2xl font-medium tracking-tight">
            9<em className="text-lg not-italic text-teal-300">m</em>
          </p>
          <p className="text-[11px] uppercase tracking-wider text-white/55">Avg. wait time</p>
        </div>
      </div>
    </div>
  );
}

function DefaultFooter() {
  return (
    <div className="relative z-10 border-t border-white/[0.08] pt-6">
      <p className="max-w-sm font-display text-lg font-light leading-snug text-white/90">
        Your records, <em className="text-sky-300 not-italic">your doctor</em>, exactly where you left them.
      </p>
    </div>
  );
}

export function AuthVisualAside() {
  const { pathname } = useLocation();
  const mode = asideMode(pathname);

  return (
    <aside
      className={cn(
        'relative hidden min-h-0 flex-col justify-between overflow-hidden p-9 text-white lg:p-11',
        'bg-auth-visual md:flex',
      )}
    >
      {/* Radial glows */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_15%_20%,rgba(94,234,212,0.18),transparent_70%),radial-gradient(ellipse_60%_50%_at_85%_80%,rgba(56,189,248,0.28),transparent_70%),radial-gradient(ellipse_70%_50%_at_50%_110%,rgba(99,102,241,0.18),transparent_60%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.45] [mask-image:radial-gradient(ellipse_at_center,black_22%,transparent_70%)]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
        aria-hidden
      />

      <div className="relative z-10 flex items-center gap-2.5">
        <BrandMark />
        <Link to={ROUTES.home} className="font-display text-[1.15rem] font-medium tracking-tight text-white sm:text-xl">
          MRD <span className="font-light text-white/70">Online Clinic</span>
        </Link>
      </div>

      <AuthHeroIllustration />

      {mode === 'role' ? <TestimonialBlock /> : null}
      {mode === 'signup' ? <SignupFooter /> : null}
      {mode === 'default' ? <DefaultFooter /> : null}
    </aside>
  );
}
