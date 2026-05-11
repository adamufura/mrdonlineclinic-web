import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { ArrowRight, Mail } from 'lucide-react';
import { AuthEyebrow } from '@/components/auth/AuthEyebrow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { forgotPassword } from '@/features/auth/api';
import { normalizeAxiosError } from '@/lib/api/errors';
import { ROUTES } from '@/router/routes';

const schema = z.object({ email: z.string().email() });

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: '' } });
  const mutation = useMutation({
    mutationFn: (v: FormValues) => forgotPassword(v.email),
    onSuccess: () => {
      toast.success('If an account exists, we sent reset instructions.');
    },
    onError: (e) => toast.error(normalizeAxiosError(e).message),
  });

  return (
    <>
      <Helmet>
        <title>Forgot password — MRD Online Clinic</title>
      </Helmet>
      <div className="space-y-1">
        <AuthEyebrow>Account recovery</AuthEyebrow>
        <h1 className="font-display text-[clamp(1.85rem,4vw,2.5rem)] font-normal leading-[1.08] tracking-[-0.02em] text-brand-navy">
          Reset your <em className="text-brand-hero-blue not-italic">password.</em>
        </h1>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-brand-body">
          Enter your email and we will send a reset link if an account exists.
        </p>
      </div>

      <form className="mt-8 space-y-5" onSubmit={form.handleSubmit((v) => mutation.mutate(v))}>
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

        <Button
          type="submit"
          disabled={mutation.isPending}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-sky-500 to-sky-800 text-[14px] font-semibold text-white shadow-[0_8px_20px_rgba(14,165,233,0.28)] transition hover:brightness-[1.03] disabled:opacity-60"
        >
          {mutation.isPending ? 'Sending…' : 'Send link'}
          {!mutation.isPending ? <ArrowRight className="size-4" strokeWidth={2.5} aria-hidden /> : null}
        </Button>

        <p className="text-center text-[13px] text-brand-body">
          <Link to={ROUTES.login} className="font-semibold text-sky-800 hover:underline">
            Back to log in
          </Link>
        </p>
      </form>
    </>
  );
}
