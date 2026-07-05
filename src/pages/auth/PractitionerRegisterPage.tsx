import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { AuthEyebrow } from '@/components/auth/AuthEyebrow';
import { ROUTES } from '@/router/routes';

export default function PractitionerRegisterPage() {
  const { t } = useTranslation();

  return (
    <>
      <Helmet>
        <title>{t('auth.registerPractitioner.title')}</title>
      </Helmet>
      <div className="space-y-0.5">
        <AuthEyebrow>{t('auth.registerPractitioner.eyebrow')}</AuthEyebrow>
        <h1 className="font-display text-[clamp(1.65rem,3.8vw,2.35rem)] font-normal leading-[1.08] tracking-[-0.02em] text-brand-navy">
          {t('auth.registerPractitioner.heading')}{' '}
          <em className="text-brand-hero-blue not-italic">{t('auth.registerPractitioner.headingEm')}</em>
        </h1>
      </div>

      <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-900 dark:bg-amber-950">
        <AlertCircle className="mb-3 size-10 text-amber-600 dark:text-amber-400" />
        <h2 className="mb-2 text-lg font-semibold text-amber-900 dark:text-amber-100">
          Practitioner Registration Closed
        </h2>
        <p className="text-sm text-amber-800 dark:text-amber-200">
          We no longer accept new practitioner registrations at this time. Please check back later for updates.
        </p>
      </div>

      <p className="mt-5 text-center text-[13px] text-brand-body">
        {t('auth.registerPractitioner.hasAccount')}{' '}
        <Link to={ROUTES.login} className="font-semibold text-sky-800 hover:underline">
          {t('auth.registerPractitioner.logInInstead')}
        </Link>
      </p>
    </>
  );
}
