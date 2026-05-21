import { type FormEvent, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronRight,
  HeartPulse,
  Home,
  Lock,
  Mail,
  MapPin,
  Menu,
  Phone,
  Pill,
  Stethoscope,
  User,
  X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { toast } from 'sonner';
import { BrandMark } from '@/components/brand/BrandMark';
import { MarketingFooterSocial } from '@/components/marketing/MarketingFooterSocial';
import { MarketingLocationMap } from '@/components/marketing/MarketingLocationMap';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils/cn';
import { ROUTES } from '@/router/routes';
import { useAuthStore } from '@/stores/auth-store';

const navLinkClass =
  'text-[15px] font-semibold text-brand-navy transition-colors hover:text-brand-cyan xl:text-[16px]';

function NewsletterSignup() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      toast.error(t('marketing.newsletter.emailRequired'));
      return;
    }
    toast.success(t('marketing.newsletter.thanks'));
    setEmail('');
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 flex w-full max-w-md gap-0">
      <Input
        type="email"
        name="newsletter-email"
        autoComplete="email"
        placeholder={t('marketing.newsletter.placeholder')}
        value={email}
        onChange={(ev) => setEmail(ev.target.value)}
        className="h-11 min-w-0 flex-1 rounded-l-xl rounded-r-none border-brand-stroke-soft bg-white text-sm shadow-sm focus-visible:ring-brand-hero-blue/35"
      />
      <Button
        type="submit"
        className="h-11 shrink-0 rounded-l-none rounded-r-xl bg-brand-hero-blue px-5 text-sm font-semibold text-white shadow-sm hover:bg-brand-navy"
      >
        {t('marketing.newsletter.submit')}
      </Button>
    </form>
  );
}

function Logo() {
  return (
    <Link
      to={ROUTES.home}
      className="group flex max-w-[min(100%,280px)] items-center gap-2.5 sm:max-w-none sm:gap-3"
      aria-label="MRD Online Clinic — home"
    >
      <BrandMark size="xl" variant="transparent" />
      <div className="flex min-w-0 items-baseline gap-x-0.5 whitespace-nowrap leading-none">
        <span className="text-base font-bold tracking-tight text-brand-hero-blue sm:text-lg lg:text-xl">MRD</span>
        <span className="text-base font-bold tracking-tight text-brand-navy sm:text-lg lg:text-xl">Online</span>
        <span className="text-base font-bold tracking-tight text-brand-navy sm:text-lg lg:text-xl">Clinic</span>
      </div>
    </Link>
  );
}

function AuthActions({
  user,
  compact,
  onNavigate,
}: {
  user: ReturnType<typeof useAuthStore.getState>['user'];
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const { t } = useTranslation();

  if (user?.role === 'PATIENT') {
    if (compact) {
      return (
        <Link
          to={ROUTES.patient.dashboard}
          onClick={onNavigate}
          className="flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 text-[14px] font-semibold text-white shadow-[0_6px_18px_rgba(14,165,233,0.35)] transition hover:brightness-105 active:scale-[0.99]"
        >
          {t('marketing.nav.patientHub')}
        </Link>
      );
    }
    return (
      <Button asChild size="default" className="lg:w-auto">
        <Link to={ROUTES.patient.dashboard} onClick={onNavigate}>
          {t('marketing.nav.patientHub')}
        </Link>
      </Button>
    );
  }
  if (user?.role === 'PRACTITIONER') {
    if (compact) {
      return (
        <Link
          to={ROUTES.practitioner.dashboard}
          onClick={onNavigate}
          className="flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 text-[14px] font-semibold text-white shadow-[0_6px_18px_rgba(20,184,166,0.35)] transition hover:brightness-105 active:scale-[0.99]"
        >
          {t('marketing.nav.practitionerHub')}
        </Link>
      );
    }
    return (
      <Button asChild size="default" className="lg:w-auto">
        <Link to={ROUTES.practitioner.dashboard} onClick={onNavigate}>
          {t('marketing.nav.practitionerHub')}
        </Link>
      </Button>
    );
  }

  if (compact) {
    return (
      <div className="flex w-full flex-col gap-2.5">
        <Link
          to={ROUTES.register}
          onClick={onNavigate}
          className="flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-brand-navy/10 bg-brand-navy text-[14px] font-semibold text-white shadow-[0_6px_18px_rgba(4,19,42,0.2)] transition hover:brightness-110 active:scale-[0.99]"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
            <User className="size-4 shrink-0" aria-hidden />
          </span>
          {t('marketing.nav.register')}
        </Link>
        <Link
          to={ROUTES.login}
          onClick={onNavigate}
          className="flex h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 text-[14px] font-semibold text-white shadow-[0_6px_18px_rgba(14,165,233,0.35)] transition hover:brightness-105 active:scale-[0.99]"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
            <Lock className="size-4 shrink-0" aria-hidden />
          </span>
          {t('marketing.nav.logIn')}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <Button variant="navNavy" size="sm" className="gap-2" asChild>
        <Link to={ROUTES.register} onClick={onNavigate}>
          <User className="size-4" />
          {t('marketing.nav.register')}
        </Link>
      </Button>
      <Button variant="navCyan" size="sm" className="gap-2" asChild>
        <Link to={ROUTES.login} onClick={onNavigate}>
          <Lock className="size-4" />
          {t('marketing.nav.logIn')}
        </Link>
      </Button>
    </div>
  );
}

type MobileNavItem = {
  to: string;
  label: string;
  icon: typeof Home;
};

function isMobileNavActive(to: string, pathname: string, hash: string): boolean {
  if (to.includes('#')) {
    const [path, fragment] = to.split('#');
    const base = path || '/';
    return pathname === base && hash === `#${fragment}`;
  }
  if (to === ROUTES.home) return pathname === '/' && !hash;
  return pathname === to || pathname.startsWith(`${to}/`);
}

function MarketingMobileMenu({
  open,
  onClose,
  navItems,
  user,
}: {
  open: boolean;
  onClose: () => void;
  navItems: MobileNavItem[];
  user: ReturnType<typeof useAuthStore.getState>['user'];
}) {
  const { t } = useTranslation();
  const { pathname, hash } = useLocation();

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] lg:hidden" role="dialog" aria-modal="true" id="marketing-mobile-menu">
      <button
        type="button"
        className="absolute inset-0 bg-brand-navy/55 backdrop-blur-[3px] transition-opacity"
        aria-label="Close menu"
        onClick={onClose}
      />
      <div className="absolute inset-y-0 right-0 flex w-[min(100vw,20.5rem)] flex-col bg-gradient-to-b from-white via-white to-[#f0f7fc] shadow-[-12px_0_40px_rgba(4,19,42,0.12)] sm:w-[22rem]">
        <div className="relative shrink-0 overflow-hidden border-b border-brand-stroke-soft/70 px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <div
            className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-hero-blue via-sky-400 to-teal-400"
            aria-hidden
          />
          <div className="flex items-center gap-3">
            <BrandMark size="md" variant="transparent" className="shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-hero-blue">
                MRD Online Clinic
              </p>
              <p className="truncate text-lg font-bold tracking-tight text-brand-navy">{t('marketing.nav.menu')}</p>
            </div>
            <button
              type="button"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-brand-stroke-soft bg-white text-brand-navy shadow-sm transition hover:border-sky-200 hover:bg-sky-50"
              aria-label="Close menu"
              onClick={onClose}
            >
              <X className="size-5" strokeWidth={2.25} />
            </button>
          </div>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4" aria-label="Mobile">
          <p className="px-3 pb-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-body/55">
            {t('marketing.nav.explore')}
          </p>
          <ul className="flex flex-col gap-1">
            {navItems.map(({ to, label, icon: Icon }) => {
              const active = isMobileNavActive(to, pathname, hash);
              return (
                <li key={to}>
                  <Link
                    to={to}
                    onClick={onClose}
                    className={cn(
                      'group flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200',
                      active
                        ? 'bg-gradient-to-r from-sky-50 to-teal-50/90 text-brand-hero-blue ring-1 ring-sky-200/70 shadow-sm'
                        : 'text-brand-navy hover:bg-white/90 hover:shadow-sm hover:ring-1 hover:ring-brand-stroke-soft/80',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors',
                        active
                          ? 'bg-white text-brand-hero-blue shadow-sm'
                          : 'bg-[#eef5f9] text-brand-navy/65 group-hover:bg-white group-hover:text-brand-hero-blue',
                      )}
                    >
                      <Icon className="size-[18px]" strokeWidth={2} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1 text-[15px] font-semibold leading-tight">{label}</span>
                    <ChevronRight
                      className={cn(
                        'size-4 shrink-0 transition-all',
                        active ? 'text-brand-hero-blue opacity-100' : 'text-brand-body/30 opacity-0 group-hover:opacity-60',
                      )}
                      strokeWidth={2.25}
                      aria-hidden
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="shrink-0 space-y-4 border-t border-brand-stroke-soft/80 bg-white/90 px-4 py-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] backdrop-blur-sm">
          <div className="flex justify-center">
            <LanguageSwitcher className="h-10 w-full max-w-[12rem] justify-center rounded-xl border-brand-stroke-soft/90 py-2.5 text-[13px]" />
          </div>
          {!user ? (
            <p className="text-center text-[12px] font-medium text-brand-body/80">{t('marketing.nav.getStarted')}</p>
          ) : null}
          <AuthActions user={user} compact onNavigate={onClose} />
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function MarketingLayout() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: MobileNavItem[] = [
    { to: ROUTES.home, label: t('marketing.nav.home'), icon: Home },
    { to: ROUTES.findDoctor, label: t('marketing.nav.practitioners'), icon: Stethoscope },
    { to: `${ROUTES.home}#patients`, label: t('marketing.nav.patients'), icon: HeartPulse },
    { to: `${ROUTES.home}#pharmacy`, label: t('marketing.nav.pharmacy'), icon: Pill },
  ];

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [user?.id]);

  const companyLinks = [
    { label: t('marketing.footer.home'), to: ROUTES.home },
    { label: t('marketing.footer.specialities'), to: ROUTES.specialties },
    { label: t('marketing.footer.videoConsult'), to: ROUTES.findDoctor },
  ];

  const specialtyLinks = [
    { label: t('marketing.footer.neurology'), to: ROUTES.specialties },
    { label: t('marketing.footer.cardiologist'), to: ROUTES.specialties },
    { label: t('marketing.footer.dentist'), to: ROUTES.specialties },
  ];

  return (
    <div className="flex min-h-dvh flex-col bg-brand-marketing font-sans text-brand-navy">
      <header className="sticky top-0 z-50 border-b border-brand-stroke-soft bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-site items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:gap-6 lg:px-8 lg:py-4">
          <div className="min-w-0 shrink">
            <Logo />
          </div>

          <nav className="hidden items-center justify-center gap-x-7 lg:flex xl:gap-x-9" aria-label="Main">
            {navItems.map(({ to, label }) => (
              <Link key={to} className={navLinkClass} to={to}>
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-3">
            <LanguageSwitcher />
            <div className="hidden lg:block">
              <AuthActions user={user} />
            </div>
            <div className="hidden sm:block lg:hidden">
              {!user ? (
                <Button variant="navCyan" size="sm" className="gap-2" asChild>
                  <Link to={ROUTES.login}>
                    <Lock className="size-4" />
                    {t('marketing.nav.logIn')}
                  </Link>
                </Button>
              ) : (
                <AuthActions user={user} />
              )}
            </div>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-brand-navy transition-colors hover:bg-brand-stroke-soft/60 lg:hidden"
              aria-expanded={mobileMenuOpen}
              aria-controls="marketing-mobile-menu"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMobileMenuOpen((o) => !o)}
            >
              {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
            </button>
          </div>
        </div>

      </header>

      <MarketingMobileMenu
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        navItems={navItems}
        user={user}
      />
      <main className="flex-1">
        <Outlet />
      </main>
      <MarketingLocationMap />
      <footer className="border-t border-brand-stroke-soft bg-[#f4f9fc]">
        <div className="mx-auto w-full max-w-site px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2 xl:grid-cols-5 xl:gap-10">
            <div>
              <Logo />
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-brand-body">{t('marketing.footer.tagline')}</p>
            </div>

            <div>
              <h3 className="text-base font-bold text-brand-navy">{t('marketing.footer.company')}</h3>
              <ul className="mt-4 space-y-2.5">
                {companyLinks.map((l) => (
                  <li key={l.to + l.label}>
                    <Link to={l.to} className="text-sm text-brand-body transition-colors hover:text-brand-hero-blue">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-base font-bold text-brand-navy">{t('marketing.footer.specialitiesHeading')}</h3>
              <ul className="mt-4 space-y-2.5">
                {specialtyLinks.map((l) => (
                  <li key={l.to + l.label}>
                    <Link to={l.to} className="text-sm text-brand-body transition-colors hover:text-brand-hero-blue">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-base font-bold text-brand-navy">{t('marketing.footer.contactUs')}</h3>
              <ul className="mt-4 space-y-3.5">
                <li className="flex items-start gap-2.5 text-sm text-brand-body">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-brand-navy" aria-hidden />
                  <span>
                    {t('marketing.footer.addressLine1')}
                    <br />
                    {t('marketing.footer.addressLine2')}
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
              <h3 className="text-base font-bold text-brand-navy">{t('marketing.newsletter.title')}</h3>
              <NewsletterSignup />
              <MarketingFooterSocial />
            </div>
          </div>
        </div>

        <div className="border-t border-brand-stroke-soft bg-[#eef5f9] py-5">
          <div className="mx-auto flex w-full max-w-site flex-col items-center justify-between gap-3 px-4 text-sm text-brand-body sm:flex-row sm:px-6 lg:px-8">
            <p>{t('marketing.footer.copyright', { year: new Date().getFullYear() })}</p>
            <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
              <Link to="/privacy" className="transition-colors hover:text-brand-hero-blue">
                {t('marketing.footer.privacy')}
              </Link>
              <span className="text-brand-body/40" aria-hidden>
                |
              </span>
              <Link to="/terms" className="transition-colors hover:text-brand-hero-blue">
                {t('marketing.footer.terms')}
              </Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
