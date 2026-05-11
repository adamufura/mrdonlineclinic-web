import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { useForm, useWatch } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { ArrowRight, Loader2, Lock, Mail, Phone, UserRound } from 'lucide-react';
import { AccountCreatingOverlay } from '@/components/auth/AccountCreatingOverlay';
import { AuthDividerOr } from '@/components/auth/AuthDividerOr';
import { AuthEyebrow } from '@/components/auth/AuthEyebrow';
import { AuthSocialButtons } from '@/components/auth/AuthSocialButtons';
import { PasswordMeter } from '@/components/auth/PasswordMeter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { registerPatient } from '@/features/auth/api';
import { normalizeAxiosError } from '@/lib/api/errors';
import { strongPasswordSchema } from '@/lib/validators/auth';
import { ROUTES } from '@/router/routes';
const schema = z
  .object({
    firstName: z.string().min(1, 'Required'),
    lastName: z.string().min(1, 'Required'),
    email: z.string().email(),
    phoneNumber: z.string().min(5, 'Enter a valid phone number'),
    password: strongPasswordSchema,
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((v) => v === true, { message: 'You must accept the terms' }),
  })
  .refine((d) => d.password === d.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' });

type FormValues = z.infer<typeof schema>;

export default function PatientRegisterPage() {
  const navigate = useNavigate();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  });

  const pwd = useWatch({ control: form.control, name: 'password', defaultValue: '' });

  const mutation = useMutation({
    mutationFn: registerPatient,
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
        <title>Patient registration — MRD Online Clinic</title>
      </Helmet>
      <div className="space-y-0.5">
        <AuthEyebrow>Patient sign up</AuthEyebrow>
        <h1 className="font-display text-[clamp(1.65rem,3.8vw,2.35rem)] font-normal leading-[1.08] tracking-[-0.02em] text-brand-navy">
          Welcome — let&apos;s create your <em className="text-brand-hero-blue not-italic">profile.</em>
        </h1>
      </div>

      <form
        className="mt-5 grid grid-cols-2 gap-3"
        onSubmit={form.handleSubmit(({ firstName, lastName, email, phoneNumber, password }) => {
          mutation.mutate({ firstName, lastName, email, phoneNumber, password });
        })}
      >
        <div className="space-y-1.5">
          <Label htmlFor="firstName" className="text-[12px] font-medium text-slate-700">
            First name
          </Label>
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-4 top-1/2 size-[1.125rem] -translate-y-1/2 text-slate-400" aria-hidden />
            <Input
              id="firstName"
              placeholder="Adaeze"
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
            Last name
          </Label>
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-4 top-1/2 size-[1.125rem] -translate-y-1/2 text-slate-400" aria-hidden />
            <Input
              id="lastName"
              placeholder="Okafor"
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
            Email address
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 size-[1.125rem] -translate-y-1/2 text-slate-400" aria-hidden />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              className="rounded-xl border-slate-200 pl-12 focus-visible:border-sky-500 focus-visible:ring-sky-500/20"
              {...form.register('email')}
            />
          </div>
          {form.formState.errors.email ? (
            <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
          ) : null}
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="phoneNumber" className="text-[12px] font-medium text-slate-700">
            Phone number
          </Label>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-4 top-1/2 size-[1.125rem] -translate-y-1/2 text-slate-400" aria-hidden />
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="+234 800 000 0000"
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
            Password
          </Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 size-[1.125rem] -translate-y-1/2 text-slate-400" aria-hidden />
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className="rounded-xl border-slate-200 pl-12 focus-visible:border-sky-500 focus-visible:ring-sky-500/20"
              {...form.register('password')}
            />
          </div>
          <PasswordMeter password={pwd ?? ''} />
          {form.formState.errors.password ? (
            <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-[12px] font-medium text-slate-700">
            Confirm password
          </Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 size-[1.125rem] -translate-y-1/2 text-slate-400" aria-hidden />
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              className="rounded-xl border-slate-200 pl-12 focus-visible:border-sky-500 focus-visible:ring-sky-500/20"
              {...form.register('confirmPassword')}
            />
          </div>
          {form.formState.errors.confirmPassword ? (
            <p className="text-sm text-destructive">{form.formState.errors.confirmPassword.message}</p>
          ) : null}
        </div>

        <label className="col-span-2 flex cursor-pointer items-start gap-2.5 text-[12px] leading-snug text-brand-body sm:text-[13px]">
          <input type="checkbox" className="mt-0.5 accent-sky-500" {...form.register('acceptTerms')} />
          <span>
            I agree to the{' '}
            <Link to="/terms" className="font-semibold text-brand-navy underline-offset-2 hover:underline">
              terms of service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="font-semibold text-brand-navy underline-offset-2 hover:underline">
              privacy policy
            </Link>
            , and consent to receive care via telemedicine.
          </span>
        </label>
        {form.formState.errors.acceptTerms ? (
          <p className="col-span-2 text-sm text-destructive">{form.formState.errors.acceptTerms.message}</p>
        ) : null}

        <Button
          type="submit"
          disabled={mutation.isPending}
          className="col-span-2 mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-sky-500 to-sky-800 text-[15px] font-semibold text-white shadow-[0_8px_20px_rgba(14,165,233,0.28)] transition hover:brightness-[1.03] disabled:opacity-60"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="size-5 shrink-0 animate-spin" strokeWidth={2.5} aria-hidden />
              Creating account…
            </>
          ) : (
            <>
              Create my account
              <ArrowRight className="size-4 shrink-0" strokeWidth={2.5} aria-hidden />
            </>
          )}
        </Button>
      </form>

      <AuthDividerOr label="Or" />
      <AuthSocialButtons />

      <p className="mt-5 text-center text-[13px] text-brand-body">
        Already have an account?{' '}
        <Link to={ROUTES.login} className="font-semibold text-sky-800 hover:underline">
          Log in instead
        </Link>
      </p>
    </>
  );
}
