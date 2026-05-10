import { Lock, Mail, MapPin, Phone, User } from 'lucide-react';
import { Link, Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/router/routes';
import { useAuthStore } from '@/stores/auth-store';

const navLinkClass =
  'text-[15px] font-semibold text-brand-navy transition-colors hover:text-brand-cyan xl:text-[16px]';

function Logo() {
  return (
    <Link
      to={ROUTES.home}
      className="group flex max-w-[min(100%,220px)] items-center gap-1 sm:max-w-none sm:gap-1.5"
      aria-label="MRD Online Clinic — home"
    >
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-0.5 leading-none">
        <span className="text-lg font-bold tracking-tight text-brand-hero-blue sm:text-xl">MRD</span>
        <span className="text-lg font-bold tracking-tight text-brand-navy sm:text-xl">Online</span>
        <span className="text-lg font-bold tracking-tight text-brand-navy sm:text-xl">Clinic</span>
      </div>
      <svg
        aria-hidden
        className="h-8 w-[22px] shrink-0 text-brand-hero-blue sm:h-9 sm:w-6"
        viewBox="0 0 28 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M8 6c0-4 5-7 11-7v30c0 6-11 12-17 13"
          stroke="currentColor"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
}

export function MarketingLayout() {
  const user = useAuthStore((s) => s.user);

  const hashLinks = (
    <>
      <Link className={navLinkClass} to={ROUTES.home}>
        Home
      </Link>
      <Link className={navLinkClass} to={ROUTES.findDoctor}>
        Practitioners
      </Link>
      <Link className={navLinkClass} to={`${ROUTES.home}#patients`}>
        Patients
      </Link>
      <Link className={navLinkClass} to={`${ROUTES.home}#pharmacy`}>
        Pharmacy
      </Link>
      <Link className={navLinkClass} to={`${ROUTES.home}#pricing`}>
        Pricing
      </Link>
    </>
  );

  return (
    <div className="flex min-h-dvh flex-col bg-brand-marketing font-sans text-brand-navy">
      <header className="sticky top-0 z-50 border-b border-brand-stroke-soft bg-white/95 backdrop-blur-md">
        <div className="mx-auto grid w-full max-w-site grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 px-4 py-4 sm:px-6 lg:grid-cols-[auto_1fr_auto] lg:gap-x-6 lg:px-8">
          <div className="min-w-0">
            <Logo />
          </div>
          <nav className="hidden items-center justify-center gap-x-7 lg:flex xl:gap-x-9">{hashLinks}</nav>
          <div className="flex items-center justify-end gap-2 sm:gap-3">
            {user?.role === 'PATIENT' ? (
              <Button asChild size="sm">
                <Link to={ROUTES.patient.dashboard}>Patient hub</Link>
              </Button>
            ) : user?.role === 'PRACTITIONER' ? (
              <Button asChild size="sm">
                <Link to={ROUTES.practitioner.dashboard}>Practitioner hub</Link>
              </Button>
            ) : (
              <>
                <Button variant="navNavy" size="sm" className="hidden gap-2 sm:inline-flex lg:gap-2" asChild>
                  <Link to={ROUTES.register}>
                    <User className="size-4" />
                    Register
                  </Link>
                </Button>
                <Button variant="navCyan" size="sm" className="gap-2 lg:gap-2" asChild>
                  <Link to={ROUTES.login}>
                    <Lock className="size-4" />
                    Log in
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-brand-stroke-soft px-4 py-3 lg:hidden">
          {hashLinks}
          {!user ? (
            <Button variant="navNavy" size="sm" className="gap-2 sm:hidden" asChild>
              <Link to={ROUTES.register}>
                <User className="size-4" />
                Register
              </Link>
            </Button>
          ) : null}
        </nav>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-brand-stroke-soft bg-white">
        <div className="mx-auto w-full max-w-site px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-12">
            {/* Brand */}
            <div>
              <Logo />
              <p className="mt-4 text-sm leading-relaxed text-brand-body">
                Connect with verified healthcare practitioners for consultations, prescriptions, and ongoing care —
                entirely online.
              </p>
            </div>

            {/* Quick links */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-brand-navy">Quick Links</h3>
              <ul className="mt-4 space-y-2.5">
                {[
                  { label: 'Home', to: ROUTES.home },
                  { label: 'Find a Doctor', to: ROUTES.findDoctor },
                  { label: 'Specialties', to: ROUTES.specialties },
                  { label: 'How It Works', to: ROUTES.howItWorks },
                  { label: 'FAQ', to: ROUTES.faq },
                  { label: 'Contact Us', to: ROUTES.contact },
                ].map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className="text-sm text-brand-body transition-colors hover:text-brand-cyan">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* For patients */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-brand-navy">For Patients</h3>
              <ul className="mt-4 space-y-2.5">
                {[
                  { label: 'Register as Patient', to: ROUTES.registerPatient },
                  { label: 'Book Appointment', to: ROUTES.findDoctor },
                  { label: 'Patient Portal', to: ROUTES.patient.dashboard },
                  { label: 'Join as a Doctor', to: ROUTES.registerPractitioner },
                ].map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className="text-sm text-brand-body transition-colors hover:text-brand-cyan">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-brand-navy">Contact</h3>
              <ul className="mt-4 space-y-3">
                <li>
                  <a
                    href="mailto:contact@mrdonlineclinic.com"
                    className="flex items-center gap-2.5 text-sm text-brand-body transition-colors hover:text-brand-cyan"
                  >
                    <Mail className="size-4 shrink-0 text-brand-cyan" aria-hidden />
                    contact@mrdonlineclinic.com
                  </a>
                </li>
                <li>
                  <a
                    href="tel:+2348000000000"
                    className="flex items-center gap-2.5 text-sm text-brand-body transition-colors hover:text-brand-cyan"
                  >
                    <Phone className="size-4 shrink-0 text-brand-cyan" aria-hidden />
                    +234 800 000 0000
                  </a>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-brand-body">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-brand-cyan" aria-hidden />
                  Lagos, Nigeria
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-brand-stroke-soft py-6">
          <div className="mx-auto flex w-full max-w-site flex-wrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <p className="text-sm text-brand-body">
              © {new Date().getFullYear()} MRD Online Clinic · Telemedicine you can trust
            </p>
            <div className="flex gap-5">
              <Link to="/privacy" className="text-sm text-brand-body transition-colors hover:text-brand-cyan">
                Privacy
              </Link>
              <Link to="/terms" className="text-sm text-brand-body transition-colors hover:text-brand-cyan">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
