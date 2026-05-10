import { Helmet } from 'react-helmet-async';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
      <Card className="border-0 shadow-none sm:border sm:shadow-sm">
        <CardHeader>
          <CardTitle>Email verification</CardTitle>
          <CardDescription>
            {token ? 'Confirming your token with the server…' : 'Missing token in the link.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {state === 'loading' ? <p>Please wait.</p> : null}
          {state === 'ok' ? <p className="text-foreground">You are verified.</p> : null}
          {state === 'err' && token ? <p className="text-destructive">Verification failed.</p> : null}
          {!token ? <p className="text-destructive">Open the link from your email, or request help.</p> : null}
        </CardContent>
        <CardFooter>
          <Button asChild variant="secondary">
            <Link to={ROUTES.login}>Go to log in</Link>
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}
