import { useQuery } from '@tanstack/react-query';
import { endOfDay, format, startOfDay } from 'date-fns';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { listPractitionerAppointments } from '@/features/practitioners/session-api';
import { ROUTES } from '@/router/routes';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

export default function PractitionerDashboardPage() {
  const today = new Date();
  const from = startOfDay(today);
  const to = endOfDay(today);

  const todayAppts = useQuery({
    queryKey: ['practitioners', 'me', 'appointments', 'today', from.toISOString(), to.toISOString()],
    queryFn: () =>
      listPractitionerAppointments({
        page: 1,
        limit: 50,
        from,
        to,
      }),
  });

  const pending = useQuery({
    queryKey: ['practitioners', 'me', 'appointments', { status: 'PENDING', page: 1, limit: 20 }],
    queryFn: () => listPractitionerAppointments({ page: 1, limit: 20, status: 'PENDING' }),
  });

  const items = [...(todayAppts.data?.items ?? [])].sort((a, b) => {
    if (!isRecord(a) || !isRecord(b)) return 0;
    const ta = a.scheduledStart ? new Date(String(a.scheduledStart)).getTime() : 0;
    const tb = b.scheduledStart ? new Date(String(b.scheduledStart)).getTime() : 0;
    return ta - tb;
  });

  return (
    <>
      <Helmet>
        <title>Practitioner dashboard — MRD Online Clinic</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Today&apos;s schedule uses <code className="rounded bg-muted px-1">GET /api/v1/practitioners/me/appointments</code>{' '}
            with <code className="rounded bg-muted px-1">from</code> / <code className="rounded bg-muted px-1">to</code> set to
            the current local day (ISO strings). Pending requests use the same endpoint with{' '}
            <code className="rounded bg-muted px-1">status=PENDING</code>.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl tabular-nums">{items.length}</CardTitle>
              <CardDescription>Appointments today</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl tabular-nums">{pending.data?.meta.total ?? '—'}</CardTitle>
              <CardDescription>Pending requests (total)</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" size="sm">
                <Link to={ROUTES.practitioner.appointments}>Review appointments</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Today ({format(today, 'MMM d, yyyy')})</CardTitle>
            <CardDescription>Filtered by scheduled start within today&apos;s window</CardDescription>
          </CardHeader>
          <CardContent>
            {todayAppts.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
            {todayAppts.isError ? <p className="text-sm text-destructive">Could not load today&apos;s visits.</p> : null}
            {items.length ? (
              <ul className="space-y-2">
                {items.map((a: unknown, i: number) => {
                  if (!isRecord(a)) return null;
                  const st = a.scheduledStart ? new Date(String(a.scheduledStart)) : null;
                  const patient = isRecord(a.patient) ? (a.patient as Record<string, unknown>) : null;
                  const ptName = patient ? `${String(patient.firstName ?? '')} ${String(patient.lastName ?? '')}`.trim() : 'Patient';
                  return (
                    <li key={String(a._id ?? i)} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm dark:bg-zinc-950">
                      <span className="font-medium">{ptName}</span>
                      <span className="text-muted-foreground">
                        {st ? format(st, 'h:mm a') : ''} · <span className="capitalize">{String(a.status ?? '').toLowerCase()}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : todayAppts.isSuccess ? (
              <p className="text-sm text-muted-foreground">No appointments scheduled for today.</p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
