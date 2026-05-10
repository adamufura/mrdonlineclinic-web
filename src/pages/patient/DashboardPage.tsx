import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { listPatientAppointments, listPatientPrescriptions } from '@/features/patients/api';
import { ROUTES } from '@/router/routes';
import { useAuthStore } from '@/stores/auth-store';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

export default function PatientDashboardPage() {
  const authUser = useAuthStore((s) => s.user);

  const appointments = useQuery({
    queryKey: ['patients', 'appointments', { page: 1, limit: 40 }],
    queryFn: () => listPatientAppointments({ page: 1, limit: 40 }),
  });

  const prescriptions = useQuery({
    queryKey: ['patients', 'prescriptions', { page: 1, limit: 3 }],
    queryFn: () => listPatientPrescriptions({ page: 1, limit: 3 }),
  });

  const items = appointments.data?.items ?? [];
  const now = new Date();
  const upcoming = items
    .filter((a) => {
      if (!isRecord(a) || !a.scheduledStart) return false;
      const st = new Date(String(a.scheduledStart));
      const status = String(a.status ?? '');
      return st >= now && (status === 'PENDING' || status === 'CONFIRMED');
    })
    .sort((a, b) => {
      const ta = new Date(String((a as Record<string, unknown>).scheduledStart)).getTime();
      const tb = new Date(String((b as Record<string, unknown>).scheduledStart)).getTime();
      return ta - tb;
    });
  const next = upcoming[0] as Record<string, unknown> | undefined;

  const pr = next && isRecord(next.practitioner) ? (next.practitioner as Record<string, unknown>) : null;
  const prName = pr ? `${String(pr.firstName ?? '')} ${String(pr.lastName ?? '')}`.trim() : '';

  return (
    <>
      <Helmet>
        <title>Patient dashboard — MRD Online Clinic</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Data from <code className="rounded bg-muted px-1">GET /api/v1/patients/me/appointments</code> and{' '}
            <code className="rounded bg-muted px-1">GET /api/v1/patients/me/prescriptions</code> (pagination query:{' '}
            <code className="rounded bg-muted px-1">page</code>, <code className="rounded bg-muted px-1">limit</code>; optional{' '}
            <code className="rounded bg-muted px-1">status</code>, <code className="rounded bg-muted px-1">from</code>,{' '}
            <code className="rounded bg-muted px-1">to</code> on appointments).
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Hello, {authUser?.firstName}</CardTitle>
            <CardDescription>Your next visit</CardDescription>
          </CardHeader>
          <CardContent>
            {appointments.isLoading ? <p className="text-sm text-muted-foreground">Loading appointments…</p> : null}
            {appointments.isError ? <p className="text-sm text-destructive">Could not load appointments.</p> : null}
            {next ? (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{prName || 'Practitioner'}</p>
                  <p className="text-sm text-muted-foreground">
                    {next.scheduledStart ? format(new Date(String(next.scheduledStart)), 'EEEE, MMM d · h:mm a') : ''} ·{' '}
                    <span className="capitalize">{String(next.status ?? '').toLowerCase().replace('_', ' ')}</span>
                  </p>
                  {typeof next.reasonForVisit === 'string' ? (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{next.reasonForVisit}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to={ROUTES.patient.messages}>Open messages</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link to={ROUTES.patient.appointment(String(next._id))}>View appointment</Link>
                  </Button>
                </div>
              </div>
            ) : appointments.isSuccess ? (
              <p className="text-sm text-muted-foreground">No upcoming confirmed or pending visits on file.</p>
            ) : null}
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Appointments (total)</CardDescription>
              <CardTitle className="text-2xl tabular-nums">{appointments.data?.meta.total ?? '—'}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Prescriptions (total)</CardDescription>
              <CardTitle className="text-2xl tabular-nums">{prescriptions.data?.meta.total ?? '—'}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Directory</CardDescription>
              <CardTitle className="text-base">
                <Button asChild variant="link" className="h-auto p-0">
                  <Link to={ROUTES.findDoctor}>Find a doctor</Link>
                </Button>
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Recent prescriptions</h2>
          <p className="mt-1 text-xs text-muted-foreground">First page from the prescriptions list endpoint.</p>
          {prescriptions.isLoading ? <p className="mt-4 text-sm text-muted-foreground">Loading…</p> : null}
          {prescriptions.isError ? <p className="mt-4 text-sm text-destructive">Could not load prescriptions.</p> : null}
          <ul className="mt-4 space-y-2">
            {(prescriptions.data?.items ?? []).map((rx: unknown, i: number) => {
              if (!isRecord(rx)) return null;
              const issued = rx.issuedAt ? format(new Date(String(rx.issuedAt)), 'MMM d, yyyy') : '';
              return (
                <li key={String(rx._id ?? i)} className="flex items-center justify-between rounded-lg border border-border bg-white px-4 py-3 text-sm dark:bg-zinc-950">
                  <span>{issued || 'Prescription'}</span>
                  <Button asChild variant="outline" size="sm">
                    <Link to={ROUTES.patient.prescriptions}>View all</Link>
                  </Button>
                </li>
              );
            })}
          </ul>
          {!prescriptions.isLoading && (prescriptions.data?.items.length ?? 0) === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No prescriptions yet.</p>
          ) : null}
        </div>
      </div>
    </>
  );
}
