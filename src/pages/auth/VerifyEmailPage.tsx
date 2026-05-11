import { Helmet } from 'react-helmet-async';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { AuthEyebrow } from '@/components/auth/AuthEyebrow';
import { Button } from '@/components/ui/button';
import { verifyEmail } from '@/features/auth/api';
import { normalizeAxiosError } from '@/lib/api/errors';
import { ROUTES } from '@/router/routes';

export default function VerifyEmailPage() {
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
          toast.success('Email verified. You can log in.');
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
  }, [token]);

  return (
    <>
      <Helmet>
        <title>Verify email — MRD Online Clinic</title>
      </Helmet>
      <div className="space-y-1">
        <AuthEyebrow>Email verification</AuthEyebrow>
        <h1 className="font-display text-[clamp(1.85rem,4vw,2.5rem)] font-normal leading-[1.08] tracking-[-0.02em] text-brand-navy">
          Confirm your <em className="text-brand-hero-blue not-italic">inbox.</em>
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-brand-body">
          {token ? 'Confirming your token with the server…' : 'Missing token in the link.'}
        </p>
      </div>

      <div className="mt-8 space-y-3 text-[15px] text-brand-body">
        {state === 'loading' ? <p>Please wait.</p> : null}
        {state === 'ok' ? <p className="font-medium text-brand-navy">You are verified.</p> : null}
        {state === 'err' && token ? <p className="text-destructive">Verification failed.</p> : null}
        {!token ? <p className="text-destructive">Open the link from your email, or request help.</p> : null}
      </div>

      <Button
        asChild
        className="mt-8 flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-sky-800 text-[14px] font-semibold text-white shadow-[0_8px_20px_rgba(14,165,233,0.28)] hover:brightness-[1.03]"
      >
        <Link to={ROUTES.login}>Go to log in</Link>
      </Button>
    </>
  );
}
