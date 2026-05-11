import { type FormEvent, useState } from 'react';
import { Lock, Mail, MapPin, Phone, User } from 'lucide-react';
import { Link, Outlet } from 'react-router-dom';
import { toast } from 'sonner';
import { MarketingFooterSocial } from '@/components/marketing/MarketingFooterSocial';
import { MarketingLocationMap } from '@/components/marketing/MarketingLocationMap';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ROUTES } from '@/router/routes';
import { useAuthStore } from '@/stores/auth-store';

const navLinkClass =
  'text-[15px] font-semibold text-brand-navy transition-colors hover:text-brand-cyan xl:text-[16px]';

function NewsletterSignup() {
  const [email, setEmail] = useState('');

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      toast.error('Please enter your email.');
      return;
    }
    toast.success('Thanks for subscribing — we will keep you posted.');
    setEmail('');
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 flex w-full max-w-md gap-0">
      <Input
        type="email"
        name="newsletter-email"
        autoComplete="email"
        placeholder="Enter Email"
        value={email}
        onChange={(ev) => setEmail(ev.target.value)}
        className="h-11 min-w-0 flex-1 rounded-l-xl rounded-r-none border-brand-stroke-soft bg-white text-sm shadow-sm focus-visible:ring-brand-hero-blue/35"
      />
      <Button
        type="submit"
        className="h-11 shrink-0 rounded-l-none rounded-r-xl bg-brand-hero-blue px-5 text-sm font-semibold text-white shadow-sm hover:bg-brand-navy"
      >
        Submit
      </Button>
    </form>
  );
}

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
      <MarketingLocationMap />
      <footer className="border-t border-brand-stroke-soft bg-[#f4f9fc]">
        <div className="mx-auto w-full max-w-site px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2 xl:grid-cols-5 xl:gap-10">
            {/* Brand */}
            <div>
              <Logo />
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-brand-body">
                Effortlessly schedule your medical appointments with MRD Online Clinic. Connect with healthcare
                professionals, manage appointments, and prioritize your wellbeing.
              </p>
            </div>

            <div>
              <h3 className="text-base font-bold text-brand-navy">Company</h3>
              <ul className="mt-4 space-y-2.5">
                {[
                  { label: 'Home', to: ROUTES.home },
                  { label: 'Specialities', to: ROUTES.specialties },
                  { label: 'Video Consult', to: ROUTES.findDoctor },
                ].map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className="text-sm text-brand-body transition-colors hover:text-brand-hero-blue">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-base font-bold text-brand-navy">Specialities</h3>
              <ul className="mt-4 space-y-2.5">
                {[
                  { label: 'Neurology', to: ROUTES.specialties },
                  { label: 'Cardiologist', to: ROUTES.specialties },
                  { label: 'Dentist', to: ROUTES.specialties },
                ].map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className="text-sm text-brand-body transition-colors hover:text-brand-hero-blue">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-base font-bold text-brand-navy">Contact Us</h3>
              <ul className="mt-4 space-y-3.5">
                <li className="flex items-start gap-2.5 text-sm text-brand-body">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-brand-navy" aria-hidden />
                  <span>
                    Abba Saude House
                    <br />
                    Katsina, Nigeria
                  </span>
                </li>
                <li>
                  <a
                    href="tel:+2348166644083"
                    className="flex items-center gap-2.5 text-sm text-brand-body transition-colors hover:text-brand-hero-blue"
                  >
                    <Phone className="size-4 shrink-0 text-brand-navy" aria-hidden />
                    08166644083
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:contact@mrdonlineclinic.com"
                    className="flex items-center gap-2.5 text-sm text-brand-body transition-colors hover:text-brand-hero-blue"
                  >
                    <Mail className="size-4 shrink-0 text-brand-navy" aria-hidden />
                    contact@mrdonlineclinic.com
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-base font-bold text-brand-navy">Join Our Newsletter</h3>
              <NewsletterSignup />
              <MarketingFooterSocial />
            </div>
          </div>
        </div>

        <div className="border-t border-brand-stroke-soft bg-[#eef5f9] py-5">
          <div className="mx-auto flex w-full max-w-site flex-col items-center justify-between gap-3 px-4 text-sm text-brand-body sm:flex-row sm:px-6 lg:px-8">
            <p>Copyright © {new Date().getFullYear()} MRD Online Clinic. All Rights Reserved</p>
            <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
              <Link to="/privacy" className="transition-colors hover:text-brand-hero-blue">
                Privacy Policy
              </Link>
              <span className="text-brand-body/40" aria-hidden>
                |
              </span>
              <Link to="/terms" className="transition-colors hover:text-brand-hero-blue">
                Terms &amp; Conditions
              </Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
