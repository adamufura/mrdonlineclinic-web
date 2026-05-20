import { type FormEvent, useState } from 'react';
import { Lock, Mail, MapPin, Phone, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, Outlet } from 'react-router-dom';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { toast } from 'sonner';
import { BrandMark } from '@/components/brand/BrandMark';
import { MarketingFooterSocial } from '@/components/marketing/MarketingFooterSocial';
import { MarketingLocationMap } from '@/components/marketing/MarketingLocationMap';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-0.5 leading-none">
        <span className="text-lg font-bold tracking-tight text-brand-hero-blue sm:text-xl">MRD</span>
        <span className="text-lg font-bold tracking-tight text-brand-navy sm:text-xl">Online</span>
        <span className="text-lg font-bold tracking-tight text-brand-navy sm:text-xl">Clinic</span>
      </div>
    </Link>
  );
}

export function MarketingLayout() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);

  const hashLinks = (
    <>
      <Link className={navLinkClass} to={ROUTES.home}>
        {t('marketing.nav.home')}
      </Link>
      <Link className={navLinkClass} to={ROUTES.findDoctor}>
        {t('marketing.nav.practitioners')}
      </Link>
      <Link className={navLinkClass} to={`${ROUTES.home}#patients`}>
        {t('marketing.nav.patients')}
      </Link>
      <Link className={navLinkClass} to={`${ROUTES.home}#pharmacy`}>
        {t('marketing.nav.pharmacy')}
      </Link>
    </>
  );

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
        <div className="mx-auto grid w-full max-w-site grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 px-4 py-4 sm:px-6 lg:grid-cols-[auto_1fr_auto] lg:gap-x-6 lg:px-8">
          <div className="min-w-0">
            <Logo />
          </div>
          <nav className="hidden items-center justify-center gap-x-7 lg:flex xl:gap-x-9">{hashLinks}</nav>
          <div className="flex items-center justify-end gap-2 sm:gap-3">
            <LanguageSwitcher />
            {user?.role === 'PATIENT' ? (
              <Button asChild size="sm">
                <Link to={ROUTES.patient.dashboard}>{t('marketing.nav.patientHub')}</Link>
              </Button>
            ) : user?.role === 'PRACTITIONER' ? (
              <Button asChild size="sm">
                <Link to={ROUTES.practitioner.dashboard}>{t('marketing.nav.practitionerHub')}</Link>
              </Button>
            ) : (
              <>
                <Button variant="navNavy" size="sm" className="hidden gap-2 sm:inline-flex lg:gap-2" asChild>
                  <Link to={ROUTES.register}>
                    <User className="size-4" />
                    {t('marketing.nav.register')}
                  </Link>
                </Button>
                <Button variant="navCyan" size="sm" className="gap-2 lg:gap-2" asChild>
                  <Link to={ROUTES.login}>
                    <Lock className="size-4" />
                    {t('marketing.nav.logIn')}
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
                {t('marketing.nav.register')}
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
