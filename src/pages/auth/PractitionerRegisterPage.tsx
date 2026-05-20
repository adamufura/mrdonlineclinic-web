import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { ArrowRight, ChevronDown, Loader2, Lock, Mail, Phone, Stethoscope, UserRound } from 'lucide-react';
import { AccountCreatingOverlay } from '@/components/auth/AccountCreatingOverlay';
import { AuthDividerOr } from '@/components/auth/AuthDividerOr';
import { AuthEyebrow } from '@/components/auth/AuthEyebrow';
import { AuthSocialButtons } from '@/components/auth/AuthSocialButtons';
import { PasswordMeter } from '@/components/auth/PasswordMeter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { registerPractitioner } from '@/features/auth/api';
import { listPublicSpecialties } from '@/features/specialties/api';
import { normalizeAxiosError } from '@/lib/api/errors';
import { createMongoIdSchema, createPasswordSchema } from '@/lib/validators/auth-schemas';
import { ROUTES } from '@/router/routes';

type FormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  specialtyId: string;
  acceptTerms: boolean;
};

export default function PractitionerRegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const schema = useMemo(
    () =>
      z
        .object({
          firstName: z.string().min(1, t('auth.validation.required')),
          lastName: z.string().min(1, t('auth.validation.required')),
          email: z.string().email(),
          phoneNumber: z.string().min(5, t('auth.validation.phoneInvalid')),
          password: createPasswordSchema(t),
          confirmPassword: z.string(),
          specialtyId: z.string().min(1, t('auth.validation.selectSpecialty')).pipe(createMongoIdSchema(t)),
          acceptTerms: z.boolean().refine((v) => v === true, { message: t('auth.validation.acceptTerms') }),
        })
        .refine((d) => d.password === d.confirmPassword, {
          path: ['confirmPassword'],
          message: t('auth.validation.passwordMismatch'),
        }),
    [t],
  );
  const specialtiesQuery = useQuery({
    queryKey: ['specialties', 'public'],
    queryFn: listPublicSpecialties,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
      specialtyId: '',
      acceptTerms: false,
    },
  });

  const pwd = useWatch({ control: form.control, name: 'password', defaultValue: '' });

  const mutation = useMutation({
    mutationFn: registerPractitioner,
    onSuccess: (res, variables) => {
      toast.success(res.message);
      void navigate({
        pathname: ROUTES.login,
        search: `?email=${encodeURIComponent(variables.email)}`,
      });
    },
    onError: (e) => {
      toast.error(normalizeAxiosError(e).message);
    },
  });

  return (
    <>
      <AccountCreatingOverlay open={mutation.isPending} />
      <Helmet>
        <title>{t('auth.registerPractitioner.title')}</title>
      </Helmet>
      <div className="space-y-0.5">
        <AuthEyebrow>{t('auth.registerPractitioner.eyebrow')}</AuthEyebrow>
        <h1 className="font-display text-[clamp(1.65rem,3.8vw,2.35rem)] font-normal leading-[1.08] tracking-[-0.02em] text-brand-navy">
          {t('auth.registerPractitioner.heading')}{' '}
          <em className="text-brand-hero-blue not-italic">{t('auth.registerPractitioner.headingEm')}</em>
        </h1>
        <p className="mt-2 max-w-md text-[14px] leading-snug text-brand-body sm:text-[15px] sm:leading-relaxed">
          {t('auth.registerPractitioner.intro')}
        </p>
      </div>

      <form
        className="mt-5 grid grid-cols-2 gap-3"
        onSubmit={form.handleSubmit(({ firstName, lastName, email, phoneNumber, password, specialtyId }) => {
          mutation.mutate({ firstName, lastName, email, phoneNumber, password, specialties: [specialtyId] });
        })}
      >
        <div className="space-y-1.5">
          <Label htmlFor="firstName" className="text-[12px] font-medium text-slate-700">
            {t('auth.registerPatient.firstName')}
          </Label>
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-4 top-1/2 size-[1.125rem] -translate-y-1/2 text-slate-400" aria-hidden />
            <Input
              id="firstName"
              className="rounded-xl border-slate-200 pl-12 focus-visible:border-sky-500 focus-visible:ring-sky-500/20"
              {...form.register('firstName')}
            />
          </div>
          {form.formState.errors.firstName ? (
            <p className="text-sm text-destructive">{form.formState.errors.firstName.message}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="lastName" className="text-[12px] font-medium text-slate-700">
            {t('auth.registerPatient.lastName')}
          </Label>
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-4 top-1/2 size-[1.125rem] -translate-y-1/2 text-slate-400" aria-hidden />
            <Input
              id="lastName"
              className="rounded-xl border-slate-200 pl-12 focus-visible:border-sky-500 focus-visible:ring-sky-500/20"
              {...form.register('lastName')}
            />
          </div>
          {form.formState.errors.lastName ? (
            <p className="text-sm text-destructive">{form.formState.errors.lastName.message}</p>
          ) : null}
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="email" className="text-[12px] font-medium text-slate-700">
            {t('auth.registerPatient.email')}
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 size-[1.125rem] -translate-y-1/2 text-slate-400" aria-hidden />
            <Input
              id="email"
              type="email"
              className="rounded-xl border-slate-200 pl-12 focus-visible:border-sky-500 focus-visible:ring-sky-500/20"
              {...form.register('email')}
            />
          </div>
          {form.formState.errors.email ? (
            <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
          ) : null}
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="specialtyId" className="text-[12px] font-medium text-slate-700">
            {t('auth.registerPractitioner.specialty')}
          </Label>
          <div className="relative">
            <Stethoscope className="pointer-events-none absolute left-4 top-1/2 size-[1.125rem] -translate-y-1/2 text-slate-400" aria-hidden />
            <select
              id="specialtyId"
              disabled={specialtiesQuery.isLoading || specialtiesQuery.isError}
              className="flex h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-12 pr-10 text-[15px] text-slate-900 shadow-sm transition-colors focus-visible:border-sky-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900"
              {...form.register('specialtyId')}
            >
              <option value="">{t('auth.registerPractitioner.selectSpecialty')}</option>
              {specialtiesQuery.data?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
          </div>
          {specialtiesQuery.isError ? (
            <p className="text-sm text-destructive">{t('auth.registerPractitioner.specialtiesLoadError')}</p>
          ) : null}
          {form.formState.errors.specialtyId ? (
            <p className="text-sm text-destructive">{form.formState.errors.specialtyId.message}</p>
          ) : null}
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="phoneNumber" className="text-[12px] font-medium text-slate-700">
            {t('auth.registerPatient.phone')}
          </Label>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-4 top-1/2 size-[1.125rem] -translate-y-1/2 text-slate-400" aria-hidden />
            <Input
              id="phoneNumber"
              type="tel"
              className="rounded-xl border-slate-200 pl-12 focus-visible:border-sky-500 focus-visible:ring-sky-500/20"
              {...form.register('phoneNumber')}
            />
          </div>
          {form.formState.errors.phoneNumber ? (
            <p className="text-sm text-destructive">{form.formState.errors.phoneNumber.message}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-[12px] font-medium text-slate-700">
            {t('auth.registerPatient.password')}
          </Label>
          <PasswordInput
            id="password"
            leftIcon={<Lock strokeWidth={2} />}
            autoComplete="new-password"
            maxLength={12}
            placeholder="••••••"
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
            {t('auth.registerPatient.confirmPassword')}
          </Label>
          <PasswordInput
            id="confirmPassword"
            leftIcon={<Lock strokeWidth={2} />}
            autoComplete="new-password"
            maxLength={12}
            placeholder="••••••"
            className="rounded-xl border-slate-200 focus-visible:border-sky-500 focus-visible:ring-sky-500/20"
            {...form.register('confirmPassword')}
          />
          {form.formState.errors.confirmPassword ? (
            <p className="text-sm text-destructive">{form.formState.errors.confirmPassword.message}</p>
          ) : null}
        </div>

        <label className="col-span-2 flex cursor-pointer items-start gap-2.5 text-[12px] leading-snug text-brand-body sm:text-[13px]">
          <input type="checkbox" className="mt-0.5 accent-sky-500" {...form.register('acceptTerms')} />
          <span>
            {t('auth.registerPractitioner.termsPrefix')}{' '}
            <Link to="/terms" className="font-semibold text-brand-navy underline-offset-2 hover:underline">
              {t('auth.registerPractitioner.termsLink')}
            </Link>{' '}
            {t('auth.registerPractitioner.termsAnd')}{' '}
            <Link to="/privacy" className="font-semibold text-brand-navy underline-offset-2 hover:underline">
              {t('auth.registerPractitioner.privacyLink')}
            </Link>
            {t('auth.registerPractitioner.termsSuffix')}
          </span>
        </label>
        {form.formState.errors.acceptTerms ? (
          <p className="col-span-2 text-sm text-destructive">{form.formState.errors.acceptTerms.message}</p>
        ) : null}

        <Button
          type="submit"
          disabled={mutation.isPending || specialtiesQuery.isLoading || specialtiesQuery.isError}
          className="col-span-2 mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-sky-500 to-sky-800 text-[15px] font-semibold text-white shadow-[0_8px_20px_rgba(14,165,233,0.28)] transition hover:brightness-[1.03] disabled:opacity-60"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="size-5 shrink-0 animate-spin" strokeWidth={2.5} aria-hidden />
              {t('auth.registerPractitioner.creating')}
            </>
          ) : (
            <>
              {t('auth.registerPractitioner.submit')}
              <ArrowRight className="size-4 shrink-0" strokeWidth={2.5} aria-hidden />
            </>
          )}
        </Button>
      </form>

      <AuthDividerOr label={t('auth.or')} />
      <AuthSocialButtons />

      <p className="mt-5 text-center text-[13px] text-brand-body">
        {t('auth.registerPractitioner.hasAccount')}{' '}
        <Link to={ROUTES.login} className="font-semibold text-sky-800 hover:underline">
          {t('auth.registerPractitioner.logInInstead')}
        </Link>
      </p>
    </>
  );
}
