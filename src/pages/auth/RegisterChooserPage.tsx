import { Helmet } from 'react-helmet-async';
import { ArrowRight, Stethoscope, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { AuthDividerOr } from '@/components/auth/AuthDividerOr';
import { AuthEyebrow } from '@/components/auth/AuthEyebrow';
import { AuthSocialButtons } from '@/components/auth/AuthSocialButtons';
import { ROUTES } from '@/router/routes';
import { cn } from '@/lib/utils/cn';

const cardBase =
  'group relative flex h-full flex-col rounded-[18px] border border-slate-200/90 bg-white p-6 text-left shadow-sm ring-1 ring-slate-100/80 transition duration-300 hover:-translate-y-1 hover:border-sky-400/40 hover:shadow-[0_10px_40px_-10px_rgba(14,165,233,0.14),0_22px_60px_-22px_rgba(15,23,42,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/35 focus-visible:ring-offset-2';

const iconPatient = 'bg-gradient-to-br from-sky-400 to-sky-600 shadow-[0_8px_20px_rgba(14,165,233,0.25)]';
const iconPractitioner = 'bg-gradient-to-br from-teal-300 to-teal-600 shadow-[0_8px_20px_rgba(20,184,166,0.28)]';

export default function RegisterChooserPage() {
  const { t } = useTranslation();

  return (
    <>
      <Helmet>
        <title>{t('auth.registerChooser.title')}</title>
      </Helmet>
      <div className="space-y-1">
        <AuthEyebrow>{t('auth.registerChooser.eyebrow')}</AuthEyebrow>
        <h1 className="font-display text-[clamp(2rem,4.5vw,2.75rem)] font-normal leading-[1.06] tracking-[-0.02em] text-brand-navy">
          {t('auth.registerChooser.heading')}{' '}
          <em className="text-brand-hero-blue not-italic">{t('auth.registerChooser.headingEm')}</em>
        </h1>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-brand-body">{t('auth.registerChooser.intro')}</p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-4">
        <Link to={ROUTES.registerPatient} className={cardBase}>
          <span className={cn('mb-[18px] inline-flex size-11 items-center justify-center rounded-xl text-white', iconPatient)}>
            <UserRound className="size-[22px]" strokeWidth={2} aria-hidden />
          </span>
          <span className="text-[17px] font-semibold text-brand-navy">{t('auth.registerChooser.patientTitle')}</span>
          <span className="mt-1.5 block text-[13px] leading-relaxed text-brand-body">
            {t('auth.registerChooser.patientDesc')}
          </span>
          <span className="mt-[18px] inline-flex items-center gap-1 text-[13px] font-semibold text-sky-800">
            {t('auth.registerChooser.patientCta')}
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" strokeWidth={2.5} aria-hidden />
          </span>
        </Link>

        <Link to={ROUTES.registerPractitioner} className={cardBase}>
          <span className={cn('mb-[18px] inline-flex size-11 items-center justify-center rounded-xl text-white', iconPractitioner)}>
            <Stethoscope className="size-[22px]" strokeWidth={2} aria-hidden />
          </span>
          <span className="text-[17px] font-semibold text-brand-navy">{t('auth.registerChooser.practitionerTitle')}</span>
          <span className="mt-1.5 block text-[13px] leading-relaxed text-brand-body">
            {t('auth.registerChooser.practitionerDesc')}
          </span>
          <span className="mt-[18px] inline-flex items-center gap-1 text-[13px] font-semibold text-teal-800">
            {t('auth.registerChooser.practitionerCta')}
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" strokeWidth={2.5} aria-hidden />
          </span>
        </Link>
      </div>

      <AuthDividerOr label={t('auth.or')} />
      <AuthSocialButtons />

      <p className="mt-2 text-center text-[13px] text-brand-body">
        {t('auth.registerChooser.hasAccount')}{' '}
        <Link to={ROUTES.login} className="font-semibold text-sky-800 hover:underline">
          {t('auth.registerChooser.signIn')}
        </Link>
      </p>
    </>
  );
}
