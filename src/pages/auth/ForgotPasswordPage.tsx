import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
      <Card className="border-0 shadow-none sm:border sm:shadow-sm">
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
          <CardDescription>Enter your email and we will send a reset link if an account exists.</CardDescription>
        </CardHeader>
        <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))}>
          <CardContent className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...form.register('email')} />
            {form.formState.errors.email ? (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            ) : null}
          </CardContent>
          <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Sending…' : 'Send link'}
            </Button>
            <Link to={ROUTES.login} className="text-sm text-primary hover:underline">
              Back to log in
            </Link>
          </CardFooter>
        </form>
      </Card>
    </>
  );
}
