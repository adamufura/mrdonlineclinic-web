import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { ArrowRight, Lock, Mail } from 'lucide-react';
import { AuthDividerOr } from '@/components/auth/AuthDividerOr';
import { AuthEyebrow } from '@/components/auth/AuthEyebrow';
import { AuthSocialButtons } from '@/components/auth/AuthSocialButtons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login } from '@/features/auth/api';
import { safeReturnPath } from '@/lib/navigation';
import { normalizeAxiosError } from '@/lib/api/errors';
import { ROUTES } from '@/router/routes';
import { useAuthStore } from '@/stores/auth-store';
import type { AuthRole } from '@/types/api';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

type FormValues = z.infer<typeof schema>;

function homeForRole(role: AuthRole): string {
  if (role === 'PATIENT') return ROUTES.patient.dashboard;
  if (role === 'PRACTITIONER') return ROUTES.practitioner.dashboard;
  return ROUTES.home;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setSession = useAuthStore((s) => s.setSession);
  const [remember, setRemember] = useState(true);

  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setSession(data.user, data.tokens.accessToken);
      toast.success('Welcome back');
      const next = safeReturnPath(searchParams.get('returnUrl')) ?? homeForRole(data.user.role);
      void navigate(next, { replace: true });
    },
    onError: (e) => {
      const n = normalizeAxiosError(e);
      toast.error(n.message);
    },
  });

  return (
    <>
      <Helmet>
        <title>Log in — MRD Online Clinic</title>
      </Helmet>
      <div className="space-y-1">
        <AuthEyebrow>Returning to MRD</AuthEyebrow>
        <h1 className="font-display text-[clamp(2rem,4.5vw,2.75rem)] font-normal leading-[1.06] tracking-[-0.02em] text-brand-navy">
          Sign in to your <em className="text-brand-hero-blue not-italic">account.</em>
        </h1>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-brand-body">
          Pick up exactly where you left off — your messages, appointments, and prescriptions.
        </p>
      </div>

      <form
        className="mt-8 space-y-4"
        onSubmit={form.handleSubmit((values) => {
          try {
            if (remember) localStorage.setItem('mrd_auth_remember', '1');
            else localStorage.removeItem('mrd_auth_remember');
          } catch {
            /* ignore storage errors */
          }
          mutation.mutate(values);
        })}
      >
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-[12px] font-medium text-slate-700">
            Email address
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 size-[1.125rem] -translate-y-1/2 text-slate-400" aria-hidden />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="rounded-xl border-slate-200 pl-12 focus-visible:border-sky-500 focus-visible:ring-sky-500/20"
              {...form.register('email')}
            />
          </div>
          {form.formState.errors.email ? (
            <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
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
              autoComplete="current-password"
              placeholder="••••••••"
              className="rounded-xl border-slate-200 pl-12 focus-visible:border-sky-500 focus-visible:ring-sky-500/20"
              {...form.register('password')}
            />
          </div>
          {form.formState.errors.password ? (
            <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <label className="flex cursor-pointer items-center gap-2 text-[13px] text-brand-body">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="size-4 rounded border-slate-300 accent-sky-500"
            />
            Remember me for 30 days
          </label>
          <Link to={ROUTES.forgotPassword} className="text-[13px] font-semibold text-sky-800 hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          disabled={mutation.isPending}
          className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-sky-500 to-sky-800 text-[14px] font-semibold text-white shadow-[0_8px_20px_rgba(14,165,233,0.28)] transition hover:brightness-[1.03] disabled:opacity-60"
        >
          {mutation.isPending ? 'Signing in…' : 'Sign in'}
          {!mutation.isPending ? <ArrowRight className="size-4" strokeWidth={2.5} aria-hidden /> : null}
        </Button>
      </form>

      <AuthDividerOr label="Or" />
      <AuthSocialButtons />

      <p className="mt-6 text-center text-[13px] text-brand-body">
        New to MRD?{' '}
        <Link to={ROUTES.register} className="font-semibold text-sky-800 hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}
