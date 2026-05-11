import { useQuery } from '@tanstack/react-query';
import { format, formatDistanceToNowStrict, isFuture } from 'date-fns';
import { Calendar, CheckCircle2, MessageSquare, Pill, Play, Send } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { listPatientAppointments, listPatientPrescriptions } from '@/features/patients/api';
import { ROUTES } from '@/router/routes';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils/cn';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function greetingLabel(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function useNowEverySecond(enabled: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [enabled]);
  return now;
}

export default function PatientDashboardPage() {
  const authUser = useAuthStore((s) => s.user);

  const appointments = useQuery({
    queryKey: ['patients', 'appointments', { page: 1, limit: 40 }],
    queryFn: () => listPatientAppointments({ page: 1, limit: 40 }),
  });

  const prescriptions = useQuery({
    queryKey: ['patients', 'prescriptions', { page: 1, limit: 5 }],
    queryFn: () => listPatientPrescriptions({ page: 1, limit: 5 }),
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
  const nextStart = next?.scheduledStart ? new Date(String(next.scheduledStart)) : undefined;
  const tick = useNowEverySecond(Boolean(nextStart && isFuture(nextStart)));

  const countdown =
    nextStart && isFuture(nextStart)
      ? (() => {
          const ms = nextStart.getTime() - tick;
          if (ms <= 0) return null;
          const totalSec = Math.floor(ms / 1000);
          const h = Math.floor(totalSec / 3600);
          const m = Math.floor((totalSec % 3600) / 60);
          const s = totalSec % 60;
          return { h, m, s };
        })()
      : null;

  const pr = next && isRecord(next.practitioner) ? (next.practitioner as Record<string, unknown>) : null;
  const prName = pr ? `${String(pr.firstName ?? '')} ${String(pr.lastName ?? '')}`.trim() : '';

  const completedCount = useMemo(
    () => items.filter((a) => isRecord(a) && String(a.status) === 'COMPLETED').length,
    [items],
  );

  const upcomingCount = upcoming.length;
  const rxTotal = prescriptions.data?.meta.total ?? 0;
  const apptTotal = appointments.data?.meta.total ?? 0;

  const visitTitle =
    next && typeof next.reasonForVisit === 'string' && next.reasonForVisit.trim()
      ? String(next.reasonForVisit)
      : 'Upcoming visit';

  const subline =
    nextStart && prName
      ? `Your next visit is ${formatDistanceToNowStrict(nextStart, { addSuffix: true })}. Dr. ${prName} is your clinician.`
      : 'Book a visit when you are ready — your care team is a tap away.';

  return (
    <>
      <Helmet>
        <title>Patient dashboard — MRD Online Clinic</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="space-y-7">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-500/15 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-800">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-500" />
              {format(now, 'EEEE, MMM d')}
            </p>
            <h1 className="font-display text-3xl font-normal tracking-tight text-[#0a1628] sm:text-[38px] sm:leading-[1.1]">
              {greetingLabel()}, <em className="font-medium not-italic text-sky-800">{authUser?.firstName}</em>
            </h1>
            <p className="mt-2 max-w-xl text-sm text-[#64748b]">{subline}</p>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-sm text-[#64748b]">
            <span className="inline-flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" />
              <span className="text-[#0a1628]">
                <span className="font-semibold">{apptTotal}</span> appointments on file
              </span>
            </span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            className="blue"
            label="Upcoming visits"
            value={upcomingCount}
            meta={
              nextStart
                ? `Next: ${format(nextStart, 'EEE')} · ${format(nextStart, 'h:mm a')}`
                : 'Nothing scheduled'
            }
          />
          <StatCard
            className="mint"
            label="Visits completed"
            value={completedCount}
            meta={completedCount > 0 ? 'Across your history' : 'After your first visit'}
          />
          <StatCard
            className="coral"
            label="Active prescriptions"
            value={rxTotal}
            meta={rxTotal > 0 ? 'Issued by your clinicians' : 'None on file yet'}
          />
          <StatCard
            className="warm"
            label="Messages"
            value="—"
            meta={
              <Link to={ROUTES.patient.messages} className="font-medium text-sky-800 hover:underline">
                Open inbox
              </Link>
            }
          />
        </div>

        {appointments.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading your dashboard…</p>
        ) : null}
        {appointments.isError ? (
          <p className="text-sm text-destructive">Could not load appointments. Try again shortly.</p>
        ) : null}

        {next && nextStart ? (
          <section
            className={cn(
              'relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#0a2545] via-[#0d3a6e] to-[#1456a3] p-7 text-white shadow-xl',
              'before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_50%_70%_at_100%_50%,rgba(94,234,212,0.25),transparent_70%),radial-gradient(ellipse_50%_70%_at_0%_100%,rgba(56,189,248,0.2),transparent_70%)]',
            )}
          >
            <div className="relative z-[1] flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0 flex-1 space-y-5">
                <p className="inline-flex items-center gap-2 rounded-full border border-teal-300/25 bg-teal-300/12 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-teal-200">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-300" />
                  Next appointment
                </p>
                <div>
                  <h2 className="font-display text-2xl font-normal tracking-tight sm:text-[26px]">{visitTitle}</h2>
                  <p className="mt-2 text-[13px] text-white/65">
                    {format(nextStart, 'EEEE, MMM d')} · {format(nextStart, 'h:mm a')} ·{' '}
                    <span className="capitalize">{String(next.status ?? '').toLowerCase().replace('_', ' ')}</span>
                  </p>
                </div>

                {prName ? (
                  <div className="flex max-w-md items-center gap-3.5 rounded-xl border border-white/10 bg-white/[0.06] p-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-amber-400 font-display text-sm font-medium text-[#04132a]">
                      {(prName.trim()[0] ?? 'D').toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">Dr. {prName}</p>
                      <p className="text-xs text-white/55">Your clinician for this visit</p>
                    </div>
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  <Button
                    asChild
                    className="h-10 gap-2 rounded-[10px] border-0 bg-white px-4 text-[13px] font-medium text-[#0a2545] hover:bg-white/90"
                  >
                    <Link to={ROUTES.patient.appointment(String(next._id))}>
                      <Play className="h-4 w-4 fill-current" />
                      Join visit
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="h-10 gap-2 rounded-[10px] border-white/25 bg-transparent px-4 text-[13px] font-medium text-white hover:bg-white/10 hover:text-white"
                  >
                    <Link to={ROUTES.patient.messages}>
                      <Send className="h-4 w-4" />
                      Message
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="h-10 gap-2 rounded-[10px] border-white/25 bg-transparent px-4 text-[13px] font-medium text-white hover:bg-white/10 hover:text-white"
                  >
                    <Link to={ROUTES.patient.appointment(String(next._id))}>
                      <Calendar className="h-4 w-4" />
                      Reschedule
                    </Link>
                  </Button>
                </div>
              </div>

              {countdown ? (
                <div className="shrink-0 rounded-2xl border border-white/10 bg-black/20 px-6 py-5 text-center backdrop-blur-sm">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-teal-200/90">Starts in</p>
                  <div className="mt-3 flex items-center justify-center gap-1 font-mono text-3xl font-semibold tabular-nums tracking-tight">
                    <span>{String(countdown.h).padStart(2, '0')}</span>
                    <span className="text-white/40">:</span>
                    <span>{String(countdown.m).padStart(2, '0')}</span>
                    <span className="text-white/40">:</span>
                    <span>{String(countdown.s).padStart(2, '0')}</span>
                  </div>
                  <div className="mt-2 flex justify-center gap-6 text-[10px] font-medium uppercase tracking-wide text-white/45">
                    <span>hours</span>
                    <span>mins</span>
                    <span>secs</span>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        ) : appointments.isSuccess ? (
          <section className="rounded-2xl border border-border bg-white p-8 text-center shadow-sm">
            <p className="font-display text-lg text-[#0a1628]">No upcoming visits</p>
            <p className="mt-2 text-sm text-muted-foreground">When you book, your next visit will appear here.</p>
            <Button asChild className="mt-6" size="lg">
              <Link to={ROUTES.findDoctor}>Find a doctor</Link>
            </Button>
          </section>
        ) : null}

        <div>
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <h2 className="font-display text-xl font-medium tracking-tight text-[#0a1628]">Recent prescriptions</h2>
            <Link
              to={ROUTES.patient.prescriptions}
              className="text-sm font-medium text-sky-800 hover:underline"
            >
              View all
            </Link>
          </div>
          {prescriptions.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
          {prescriptions.isError ? <p className="text-sm text-destructive">Could not load prescriptions.</p> : null}
          <ul className="space-y-2">
            {(prescriptions.data?.items ?? []).map((rx: unknown, i: number) => {
              if (!isRecord(rx)) return null;
              const issued = rx.issuedAt ? format(new Date(String(rx.issuedAt)), 'MMM d, yyyy') : '';
              return (
                <li
                  key={String(rx._id ?? i)}
                  className="flex items-center justify-between rounded-xl border border-[#e2e8f0] bg-white px-4 py-3.5 text-sm shadow-sm"
                >
                  <span className="text-[#0a1628]">{issued || 'Prescription'}</span>
                  <Button asChild variant="outline" size="sm">
                    <Link to={ROUTES.patient.prescriptions}>Details</Link>
                  </Button>
                </li>
              );
            })}
          </ul>
          {!prescriptions.isLoading && (prescriptions.data?.items.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No prescriptions yet.</p>
          ) : null}
        </div>
      </div>
    </>
  );
}

function StatCard({
  className,
  label,
  value,
  meta,
}: {
  className: 'blue' | 'mint' | 'coral' | 'warm';
  label: string;
  value: number | string;
  meta: ReactNode;
}) {
  const tint =
    className === 'blue'
      ? 'from-sky-400 to-sky-700 shadow-sky-500/25'
      : className === 'mint'
        ? 'from-teal-300 to-teal-600 shadow-teal-500/25'
        : className === 'coral'
          ? 'from-rose-300 to-rose-500 shadow-rose-500/25'
          : 'from-amber-300 to-amber-500 shadow-amber-500/25';

  const Icon =
    className === 'blue'
      ? Calendar
      : className === 'mint'
        ? CheckCircle2
        : className === 'coral'
          ? Pill
          : MessageSquare;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md',
        className === 'blue' && 'before:absolute before:right-0 before:top-0 before:h-24 before:w-24 before:rounded-full before:bg-sky-500/10',
        className === 'mint' && 'before:absolute before:right-0 before:top-0 before:h-24 before:w-24 before:rounded-full before:bg-teal-500/10',
        className === 'coral' && 'before:absolute before:right-0 before:top-0 before:h-24 before:w-24 before:rounded-full before:bg-rose-500/10',
        className === 'warm' && 'before:absolute before:right-0 before:top-0 before:h-24 before:w-24 before:rounded-full before:bg-amber-500/15',
      )}
    >
      <div
        className={cn(
          'mb-3.5 grid h-9 w-9 place-items-center rounded-[10px] bg-gradient-to-br text-white',
          tint,
        )}
      >
        <Icon className="h-4 w-4" strokeWidth={2} />
      </div>
      <p className="text-xs font-medium uppercase tracking-wide text-[#64748b]">{label}</p>
      <p className="mt-1 font-display text-[32px] font-medium leading-none tracking-tight text-[#0a1628]">{value}</p>
      <div className="mt-2 text-xs text-[#64748b]">{meta}</div>
    </div>
  );
}
