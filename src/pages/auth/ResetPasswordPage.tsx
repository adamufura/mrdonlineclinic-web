import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { ArrowRight, Lock } from 'lucide-react';
import { AuthEyebrow } from '@/components/auth/AuthEyebrow';
import { PasswordMeter } from '@/components/auth/PasswordMeter';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { resetPassword } from '@/features/auth/api';
import { normalizeAxiosError } from '@/lib/api/errors';
import { createPasswordSchema } from '@/lib/validators/auth-schemas';
import { ROUTES } from '@/router/routes';

type FormValues = { password: string; confirmPassword: string };

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const navigate = useNavigate();

  const schema = useMemo(
    () =>
      z
        .object({
          password: createPasswordSchema(t),
          confirmPassword: z.string(),
        })
        .refine((d) => d.password === d.confirmPassword, {
          path: ['confirmPassword'],
          message: t('auth.validation.passwordMismatch'),
        }),
    [t],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmPassword: '' },
  });
  const pwd = useWatch({ control: form.control, name: 'password', defaultValue: '' });

  const mutation = useMutation({
    mutationFn: (v: Pick<FormValues, 'password'>) => resetPassword(token, v.password),
    onSuccess: () => {
      toast.success(t('auth.resetPassword.successToast'));
      void navigate(ROUTES.login, { replace: true });
    },
    onError: (e) => toast.error(normalizeAxiosError(e).message),
  });

  if (!token) {
    return (
      <>
        <Helmet>
          <title>{t('auth.resetPassword.invalidTitle')}</title>
        </Helmet>
        <AuthEyebrow>{t('auth.resetPassword.invalidEyebrow')}</AuthEyebrow>
        <h1 className="font-display text-3xl font-normal text-brand-navy">{t('auth.resetPassword.invalidHeading')}</h1>
        <p className="mt-3 text-[15px] text-brand-body">{t('auth.resetPassword.invalidIntro')}</p>
        <Button asChild className="mt-8 rounded-xl bg-brand-navy px-8 text-white hover:bg-brand-navy/90">
          <Link to={ROUTES.login}>{t('auth.resetPassword.logIn')}</Link>
        </Button>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{t('auth.resetPassword.title')}</title>
      </Helmet>
      <div className="space-y-1">
        <AuthEyebrow>{t('auth.resetPassword.eyebrow')}</AuthEyebrow>
        <h1 className="font-display text-[clamp(1.85rem,4vw,2.5rem)] font-normal leading-[1.08] tracking-[-0.02em] text-brand-navy">
          {t('auth.resetPassword.heading')}{' '}
          <em className="text-brand-hero-blue not-italic">{t('auth.resetPassword.headingEm')}</em>
        </h1>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-brand-body">{t('auth.resetPassword.intro')}</p>
      </div>

      <form className="mt-8 space-y-4" onSubmit={form.handleSubmit((v) => mutation.mutate({ password: v.password }))}>
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-[12px] font-medium text-slate-700">
            {t('auth.resetPassword.newPassword')}
          </Label>
          <PasswordInput
            id="password"
            leftIcon={<Lock strokeWidth={2} />}
            autoComplete="new-password"
            maxLength={12}
            className="rounded-xl border-slate-200 focus-visible:border-sky-500 focus-visible:ring-sky-500/20"
            {...form.register('password')}
          />
          <PasswordMeter password={pwd ?? ''} />
          {form.formState.errors.password ? (
            <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-[12px] font-medium text-slate-700">
            {t('auth.resetPassword.confirmPassword')}
          </Label>
          <PasswordInput
            id="confirmPassword"
            leftIcon={<Lock strokeWidth={2} />}
            autoComplete="new-password"
            maxLength={12}
            className="rounded-xl border-slate-200 focus-visible:border-sky-500 focus-visible:ring-sky-500/20"
            {...form.register('confirmPassword')}
          />
          {form.formState.errors.confirmPassword ? (
            <p className="text-sm text-destructive">{form.formState.errors.confirmPassword.message}</p>
          ) : null}
        </div>

        <Button
          type="submit"
          disabled={mutation.isPending}
          className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-sky-500 to-sky-800 text-[14px] font-semibold text-white shadow-[0_8px_20px_rgba(14,165,233,0.28)] transition hover:brightness-[1.03] disabled:opacity-60"
        >
          {mutation.isPending ? t('auth.resetPassword.saving') : t('auth.resetPassword.submit')}
          {!mutation.isPending ? <ArrowRight className="size-4" strokeWidth={2.5} aria-hidden /> : null}
        </Button>
      </form>
    </>
  );
}
