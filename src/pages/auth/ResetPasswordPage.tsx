import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { useForm, useWatch } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { ArrowRight, Lock } from 'lucide-react';
import { AuthEyebrow } from '@/components/auth/AuthEyebrow';
import { PasswordMeter } from '@/components/auth/PasswordMeter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { resetPassword } from '@/features/auth/api';
import { normalizeAxiosError } from '@/lib/api/errors';
import { strongPasswordSchema } from '@/lib/validators/auth';
import { ROUTES } from '@/router/routes';

const schema = z
  .object({
    password: strongPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' });

type FormValues = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const navigate = useNavigate();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmPassword: '' },
  });
  const pwd = useWatch({ control: form.control, name: 'password', defaultValue: '' });

  const mutation = useMutation({
    mutationFn: (v: Pick<FormValues, 'password'>) => resetPassword(token, v.password),
    onSuccess: () => {
      toast.success('Password updated. You can log in.');
      void navigate(ROUTES.login, { replace: true });
    },
    onError: (e) => toast.error(normalizeAxiosError(e).message),
  });

  if (!token) {
    return (
      <>
        <Helmet>
          <title>Invalid reset link — MRD Online Clinic</title>
        </Helmet>
        <AuthEyebrow>Secure link</AuthEyebrow>
        <h1 className="font-display text-3xl font-normal text-brand-navy">Invalid link</h1>
        <p className="mt-3 text-[15px] text-brand-body">Missing reset token. Open the link from your email.</p>
        <Button asChild className="mt-8 rounded-xl bg-brand-navy px-8 text-white hover:bg-brand-navy/90">
          <Link to={ROUTES.login}>Log in</Link>
        </Button>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>New password — MRD Online Clinic</title>
      </Helmet>
      <div className="space-y-1">
        <AuthEyebrow>Secure reset</AuthEyebrow>
        <h1 className="font-display text-[clamp(1.85rem,4vw,2.5rem)] font-normal leading-[1.08] tracking-[-0.02em] text-brand-navy">
          Choose a new <em className="text-brand-hero-blue not-italic">password.</em>
        </h1>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-brand-body">
          Use a strong password you have not used elsewhere.
        </p>
      </div>

      <form className="mt-8 space-y-4" onSubmit={form.handleSubmit((v) => mutation.mutate({ password: v.password }))}>
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-[12px] font-medium text-slate-700">
            New password
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

        <Button
          type="submit"
          disabled={mutation.isPending}
          className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-sky-500 to-sky-800 text-[14px] font-semibold text-white shadow-[0_8px_20px_rgba(14,165,233,0.28)] transition hover:brightness-[1.03] disabled:opacity-60"
        >
          {mutation.isPending ? 'Saving…' : 'Update password'}
          {!mutation.isPending ? <ArrowRight className="size-4" strokeWidth={2.5} aria-hidden /> : null}
        </Button>
      </form>
    </>
  );
}
