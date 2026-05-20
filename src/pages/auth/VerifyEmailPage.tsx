import { Helmet } from 'react-helmet-async';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { AuthEyebrow } from '@/components/auth/AuthEyebrow';
import { Button } from '@/components/ui/button';
import { verifyEmail } from '@/features/auth/api';
import { normalizeAxiosError } from '@/lib/api/errors';
import { ROUTES } from '@/router/routes';

export default function VerifyEmailPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [state, setState] = useState<'loading' | 'ok' | 'err'>(() => (token ? 'loading' : 'err'));

  useEffect(() => {
    if (!token) {
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        await verifyEmail(token);
        if (!cancelled) {
          setState('ok');
          toast.success(t('auth.verifyEmail.successToast'));
        }
      } catch (e) {
        if (!cancelled) {
          setState('err');
          toast.error(normalizeAxiosError(e).message);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, t]);

  return (
    <>
      <Helmet>
        <title>{t('auth.verifyEmail.title')}</title>
      </Helmet>
      <div className="space-y-1">
        <AuthEyebrow>{t('auth.verifyEmail.eyebrow')}</AuthEyebrow>
        <h1 className="font-display text-[clamp(1.85rem,4vw,2.5rem)] font-normal leading-[1.08] tracking-[-0.02em] text-brand-navy">
          {t('auth.verifyEmail.heading')}{' '}
          <em className="text-brand-hero-blue not-italic">{t('auth.verifyEmail.headingEm')}</em>
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-brand-body">
          {token ? t('auth.verifyEmail.confirming') : t('auth.verifyEmail.missingToken')}
        </p>
      </div>

      <div className="mt-8 space-y-3 text-[15px] text-brand-body">
        {state === 'loading' ? <p>{t('auth.verifyEmail.pleaseWait')}</p> : null}
        {state === 'ok' ? <p className="font-medium text-brand-navy">{t('auth.verifyEmail.verified')}</p> : null}
        {state === 'err' && token ? <p className="text-destructive">{t('auth.verifyEmail.failed')}</p> : null}
        {!token ? <p className="text-destructive">{t('auth.verifyEmail.invalidLink')}</p> : null}
      </div>

      <Button
        asChild
        className="mt-8 flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-sky-800 text-[14px] font-semibold text-white shadow-[0_8px_20px_rgba(14,165,233,0.28)] hover:brightness-[1.03]"
      >
        <Link to={ROUTES.login}>{t('auth.verifyEmail.goToLogin')}</Link>
      </Button>
    </>
  );
}
