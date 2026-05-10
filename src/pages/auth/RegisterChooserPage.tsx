import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ROUTES } from '@/router/routes';

export default function RegisterChooserPage() {
  return (
    <>
      <Helmet>
        <title>Sign up — MRD Online Clinic</title>
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Create an account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Choose how you will use MRD Online Clinic.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link to={ROUTES.registerPatient} className="block rounded-xl transition hover:opacity-95">
            <Card className="h-full hover:border-primary/40">
              <CardHeader>
                <CardTitle>I&apos;m a patient</CardTitle>
                <CardDescription>Book visits, message your doctor, and manage prescriptions.</CardDescription>
              </CardHeader>
            </Card>
          </Link>
          <Link to={ROUTES.registerPractitioner} className="block rounded-xl transition hover:opacity-95">
            <Card className="h-full hover:border-primary/40">
              <CardHeader>
                <CardTitle>I&apos;m a practitioner</CardTitle>
                <CardDescription>Complete your profile and submit credentials for verification after email confirmation.</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to={ROUTES.login} className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </>
  );
}
