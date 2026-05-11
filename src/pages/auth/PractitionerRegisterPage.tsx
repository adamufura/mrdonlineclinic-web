import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { useForm, useWatch } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { ArrowRight, Lock, Mail, Phone, Stethoscope, UserRound } from 'lucide-react';
import { AuthDividerOr } from '@/components/auth/AuthDividerOr';
import { AuthEyebrow } from '@/components/auth/AuthEyebrow';
import { AuthSocialButtons } from '@/components/auth/AuthSocialButtons';
import { PasswordMeter } from '@/components/auth/PasswordMeter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { registerPractitioner } from '@/features/auth/api';
import { listPublicSpecialties } from '@/features/specialties/api';
import { normalizeAxiosError } from '@/lib/api/errors';
import { mongoIdSchema, strongPasswordSchema } from '@/lib/validators/auth';
import { cn } from '@/lib/utils/cn';
import { ROUTES } from '@/router/routes';

const schema = z
  .object({
    firstName: z.string().min(1, 'Required'),
    middleName: z.string().optional(),
    lastName: z.string().min(1, 'Required'),
    email: z.string().email(),
    phoneNumber: z.string().min(5, 'Enter a valid phone number'),
    password: strongPasswordSchema,
    confirmPassword: z.string(),
    specialties: z.array(mongoIdSchema).min(1, 'Select at least one specialty'),
    acceptTerms: z.boolean().refine((v) => v === true, { message: 'You must accept the terms' }),
  })
  .refine((d) => d.password === d.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' });

type FormValues = z.infer<typeof schema>;

export default function PractitionerRegisterPage() {
  const specialtiesQuery = useQuery({
    queryKey: ['specialties', 'public'],
    queryFn: listPublicSpecialties,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '',
      middleName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
      specialties: [],
      acceptTerms: false,
    },
  });

  const selected = useWatch({ control: form.control, name: 'specialties', defaultValue: [] });
  const pwd = useWatch({ control: form.control, name: 'password', defaultValue: '' });

  function toggleSpecialty(id: string) {
    const set = new Set(selected);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    form.setValue('specialties', [...set], { shouldValidate: true });
  }

  const mutation = useMutation({
    mutationFn: registerPractitioner,
    onSuccess: () => {
      toast.success('Check your email to verify your account.');
    },
    onError: (e) => {
      toast.error(normalizeAxiosError(e).message);
    },
  });

  return (
    <>
      <Helmet>
        <title>Practitioner registration — MRD Online Clinic</title>
      </Helmet>
      <div className="space-y-0.5">
        <AuthEyebrow>Practitioner sign up</AuthEyebrow>
        <h1 className="font-display text-[clamp(1.65rem,3.8vw,2.35rem)] font-normal leading-[1.08] tracking-[-0.02em] text-brand-navy">
          Join MRD as a <em className="text-brand-hero-blue not-italic">clinician.</em>
        </h1>
        <p className="mt-2 max-w-md text-[14px] leading-snug text-brand-body sm:text-[15px] sm:leading-relaxed">
          After you verify your email, you will complete your professional profile and submit credentials for admin review
          before accepting patients.
        </p>
      </div>

      <form
        className="mt-5 grid grid-cols-2 gap-x-3 gap-y-3"
        onSubmit={form.handleSubmit(({ firstName, middleName, lastName, email, phoneNumber, password, specialties }) => {
          mutation.mutate({ firstName, middleName, lastName, email, phoneNumber, password, specialties });
        })}
      >
        <div className="col-span-2 space-y-1.5">
          <Label className="inline-flex items-center gap-2 text-[12px] font-medium text-slate-700">
            <Stethoscope className="size-3.5 text-slate-400" aria-hidden />
            Specialties
          </Label>
          {specialtiesQuery.isLoading ? (
            <p className="text-sm text-brand-body">Loading specialties…</p>
          ) : specialtiesQuery.isError ? (
            <p className="text-sm text-destructive">Could not load specialties. Is the API running?</p>
          ) : (
            <ul className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/80 p-2 text-sm">
              {specialtiesQuery.data?.map((s) => {
                const on = selected.includes(s.id);
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => toggleSpecialty(s.id)}
                      className={cn(
                        'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-brand-navy transition hover:bg-white',
                        on && 'bg-white font-semibold shadow-sm ring-1 ring-sky-400/35',
                      )}
                    >
                      {s.name}
                      <span className={cn('text-xs', on ? 'text-sky-700' : 'text-brand-body')}>
                        {on ? 'Selected' : 'Tap to select'}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {form.formState.errors.specialties ? (
            <p className="text-sm text-destructive">{form.formState.errors.specialties.message}</p>
          ) : null}
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="firstName" className="text-[12px] font-medium text-slate-700">
            First name
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
          <Label htmlFor="middleName" className="text-[12px] font-medium text-slate-700">
            Middle name <span className="font-normal text-slate-400">(optional)</span>
          </Label>
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-4 top-1/2 size-[1.125rem] -translate-y-1/2 text-slate-400" aria-hidden />
            <Input
              id="middleName"
              className="rounded-xl border-slate-200 pl-12 focus-visible:border-sky-500 focus-visible:ring-sky-500/20"
              {...form.register('middleName')}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="lastName" className="text-[12px] font-medium text-slate-700">
            Last name
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

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-[12px] font-medium text-slate-700">
            Email address
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

        <div className="space-y-1.5">
          <Label htmlFor="phoneNumber" className="text-[12px] font-medium text-slate-700">
            Phone number
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
            Password
          </Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 size-[1.125rem] -translate-y-1/2 text-slate-400" aria-hidden />
            <Input
              id="password"
              type="password"
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
            .
          </span>
        </label>
        {form.formState.errors.acceptTerms ? (
          <p className="col-span-2 text-sm text-destructive">{form.formState.errors.acceptTerms.message}</p>
        ) : null}

        <Button
          type="submit"
          disabled={mutation.isPending || specialtiesQuery.isLoading}
          className="col-span-2 mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-sky-500 to-sky-800 text-[15px] font-semibold text-white shadow-[0_8px_20px_rgba(14,165,233,0.28)] transition hover:brightness-[1.03] disabled:opacity-60"
        >
          {mutation.isPending ? 'Creating account…' : 'Create my account'}
          {!mutation.isPending ? <ArrowRight className="size-4" strokeWidth={2.5} aria-hidden /> : null}
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
