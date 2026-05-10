import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
      <Card>
        <CardHeader>
          <CardTitle>Invalid link</CardTitle>
          <CardDescription>Missing reset token. Open the link from your email.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild variant="secondary">
            <Link to={ROUTES.login}>Log in</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <>
      <Helmet>
        <title>New password — MRD Online Clinic</title>
      </Helmet>
      <Card className="border-0 shadow-none sm:border sm:shadow-sm">
        <CardHeader>
          <CardTitle>Choose a new password</CardTitle>
          <CardDescription>Use a strong password you have not used elsewhere.</CardDescription>
        </CardHeader>
        <form onSubmit={form.handleSubmit((v) => mutation.mutate({ password: v.password }))}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input id="password" type="password" {...form.register('password')} />
              {form.formState.errors.password ? (
                <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input id="confirmPassword" type="password" {...form.register('confirmPassword')} />
              {form.formState.errors.confirmPassword ? (
                <p className="text-sm text-destructive">{form.formState.errors.confirmPassword.message}</p>
              ) : null}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Update password'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </>
  );
}
