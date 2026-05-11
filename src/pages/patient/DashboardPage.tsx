import { useQuery } from '@tanstack/react-query';
import { endOfMonth, format, formatDistanceToNowStrict, isFuture, startOfMonth } from 'date-fns';
import {
  Activity,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Download,
  Droplets,
  Heart,
  MessageSquare,
  Moon,
  Pill,
  Play,
  Send,
  Shield,
} from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { listNotifications } from '@/features/notifications/api';
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

function firstMedicationLine(rx: Record<string, unknown>): string {
  const meds = rx.medications;
  if (!Array.isArray(meds) || meds.length === 0) return 'Prescription';
  const m0 = meds[0];
  if (!isRecord(m0)) return 'Prescription';
  const name = String(m0.drugName ?? 'Medication');
  const dose = String(m0.dosage ?? '');
  const freq = String(m0.frequency ?? '');
  const parts = [name + (dose ? ` ${dose}` : ''), freq].filter(Boolean);
  return parts.join(' · ') || name;
}

function practitionerShort(rx: Record<string, unknown>): string {
  const pr = rx.practitioner;
  if (!isRecord(pr)) return 'Your clinician';
  const n = `${String(pr.firstName ?? '')} ${String(pr.lastName ?? '')}`.trim();
  return n ? `Dr. ${n}` : 'Your clinician';
}

function statusPillClass(status: string): { label: string; className: string } {
  const s = status.toUpperCase();
  if (s === 'CONFIRMED')
    return { label: 'Confirmed', className: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200/80' };
  if (s === 'PENDING') return { label: 'Pending', className: 'bg-amber-100 text-amber-900 ring-1 ring-amber-200/80' };
  return {
    label: s.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase()),
    className: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200/80',
  };
}

export default function PatientDashboardPage() {
  const authUser = useAuthStore((s) => s.user);
  const monthAnchor = new Date();

  const futureAppointments = useQuery({
    queryKey: ['patients', 'appointments', 'dashboard', 'from-now', 40],
    queryFn: () => listPatientAppointments({ page: 1, limit: 40, from: new Date() }),
  });

  const inProgressAppointments = useQuery({
    queryKey: ['patients', 'appointments', 'dashboard', 'in-progress'],
    queryFn: () => listPatientAppointments({ page: 1, limit: 10, status: 'IN_PROGRESS' }),
  });

  const apptsOnFile = useQuery({
    queryKey: ['patients', 'appointments', 'dashboard', 'count-all'],
    queryFn: () => listPatientAppointments({ page: 1, limit: 1 }),
  });

  const completedTotalQ = useQuery({
    queryKey: ['patients', 'appointments', 'dashboard', 'count-completed'],
    queryFn: () => listPatientAppointments({ page: 1, limit: 1, status: 'COMPLETED' }),
  });

  const completedThisMonthQ = useQuery({
    queryKey: [
      'patients',
      'appointments',
      'dashboard',
      'count-completed-month',
      format(startOfMonth(monthAnchor), 'yyyy-MM'),
    ],
    queryFn: () =>
      listPatientAppointments({
        page: 1,
        limit: 1,
        status: 'COMPLETED',
        from: startOfMonth(monthAnchor),
        to: endOfMonth(monthAnchor),
      }),
  });

  const unreadNotifications = useQuery({
    queryKey: ['notifications', 'unread-total'],
    queryFn: () => listNotifications({ page: 1, limit: 1, unreadOnly: true }),
  });

  const prescriptions = useQuery({
    queryKey: ['patients', 'prescriptions', { page: 1, limit: 6 }],
    queryFn: () => listPatientPrescriptions({ page: 1, limit: 6 }),
  });

  const upcoming = useMemo(() => {
    const now = new Date();
    const fut = futureAppointments.data?.items ?? [];
    const prog = inProgressAppointments.data?.items ?? [];
    const seen = new Set<string>();
    const pool: Record<string, unknown>[] = [];
    for (const raw of prog) {
      if (!isRecord(raw) || raw._id == null) continue;
      const id = String(raw._id);
      if (seen.has(id)) continue;
      seen.add(id);
      pool.push(raw);
    }
    for (const raw of fut) {
      if (!isRecord(raw) || raw._id == null) continue;
      const id = String(raw._id);
      if (seen.has(id)) continue;
      seen.add(id);
      pool.push(raw);
    }

    const active = pool.filter((a) => {
      const status = String(a.status ?? '');
      if (status === 'CANCELLED' || status === 'REJECTED' || status === 'NO_SHOW' || status === 'COMPLETED') {
        return false;
      }
      if (status === 'IN_PROGRESS') return true;
      if (status === 'PENDING' || status === 'CONFIRMED') {
        if (!a.scheduledStart) return false;
        return new Date(String(a.scheduledStart)) >= now;
      }
      return false;
    });

    return active.sort((a, b) => {
      const ta = a.scheduledStart ? new Date(String(a.scheduledStart)).getTime() : 0;
      const tb = b.scheduledStart ? new Date(String(b.scheduledStart)).getTime() : 0;
      return ta - tb;
    });
  }, [futureAppointments.data, inProgressAppointments.data]);

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

  const completedTotal = completedTotalQ.data?.meta.total ?? 0;
  const completedThisMonth = completedThisMonthQ.data?.meta.total ?? 0;
  const unreadTotal = unreadNotifications.data?.meta.total ?? 0;

  const upcomingCount = upcoming.length;
  const rxTotal = prescriptions.data?.meta.total ?? 0;
  const apptTotal = apptsOnFile.data?.meta.total ?? 0;

  const dashApptLoading = futureAppointments.isPending || inProgressAppointments.isPending;
  const dashApptError = futureAppointments.isError || inProgressAppointments.isError;
  const dashApptReady = !dashApptLoading && !dashApptError;

  const now = new Date();

  const visitTitle =
    next && typeof next.reasonForVisit === 'string' && next.reasonForVisit.trim()
      ? String(next.reasonForVisit)
      : 'Upcoming visit';

  const subline =
    nextStart && prName
      ? `Your next visit is ${formatDistanceToNowStrict(nextStart, { addSuffix: true })}. Dr. ${prName} is your clinician.`
      : 'Book a visit when you are ready — your care team is a tap away.';

  const upcomingPreview = upcoming.slice(0, 3) as Record<string, unknown>[];
  const rxItems = (prescriptions.data?.items ?? []).slice(0, 3);

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
          <div className="flex flex-col gap-3 text-sm text-[#64748b] sm:items-end">
            <span className="inline-flex items-center gap-2">
              <Heart className="h-4 w-4 text-rose-400" />
              <span className="text-[#0a1628]">
                <span className="font-semibold tabular-nums">72</span> bpm
              </span>
              <span className="hidden text-xs text-muted-foreground sm:inline">· demo</span>
            </span>
            <Link
              to={ROUTES.patient.profileMedical}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-800 hover:underline"
            >
              <Shield className="h-3.5 w-3.5" />
              Log vitals in health profile
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            className="blue"
            label="Upcoming visits"
            value={upcomingCount}
            meta={
              nextStart
                ? `Next: ${format(nextStart, 'EEE')}, ${format(nextStart, 'h:mm a')}`
                : 'Nothing scheduled'
            }
          />
          <StatCard
            className="mint"
            label="Visits completed"
            value={completedTotalQ.isPending ? '…' : completedTotal}
            meta={
              completedThisMonth > 0
                ? `+${completedThisMonth} this month`
                : completedTotal > 0
                  ? 'Across your history'
                  : 'After your first visit'
            }
          />
          <StatCard
            className="coral"
            label="Active prescriptions"
            value={rxTotal}
            meta={rxTotal > 0 ? 'Issued by your clinicians' : 'None on file yet'}
          />
          <StatCard
            className="warm"
            label="Unread messages"
            value={unreadNotifications.isPending ? '…' : unreadNotifications.isError ? '—' : unreadTotal}
            meta={
              <span className="inline-flex flex-wrap items-center gap-x-1">
                <span>
                  {unreadNotifications.isError
                    ? 'Could not load count'
                    : unreadTotal > 0
                      ? 'Notifications & updates'
                      : 'Nothing new'}
                </span>
                <span className="text-[#94a3b8]">·</span>
                <Link to={ROUTES.patient.messages} className="font-medium text-sky-800 hover:underline">
                  Open inbox
                </Link>
              </span>
            }
          />
        </div>

        {dashApptLoading ? (
          <p className="text-sm text-muted-foreground">Loading your dashboard…</p>
        ) : null}
        {dashApptError ? (
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
                  Next appointment · today
                </p>
                <div>
                  <h2 className="font-display text-2xl font-normal tracking-tight sm:text-[26px]">{visitTitle}</h2>
                  <p className="mt-2 text-[13px] text-white/65">
                    {format(nextStart, 'EEEE, MMM d')} · {format(nextStart, 'h:mm a')} · Video visit ·{' '}
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
                      <p className="text-xs text-white/55">General Practitioner · Your clinician</p>
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
                      {prName ? `Message Dr. ${prName.split(/\s+/)[0]}` : 'Message care team'}
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
        ) : dashApptReady ? (
          <section className="rounded-2xl border border-border bg-white p-8 text-center shadow-sm">
            <p className="font-display text-lg text-[#0a1628]">No upcoming visits</p>
            <p className="mt-2 text-sm text-muted-foreground">When you book, your next visit will appear here.</p>
            <Button asChild className="mt-6" size="lg">
              <Link to={ROUTES.findDoctor}>Find a doctor</Link>
            </Button>
          </section>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
          <div className="space-y-5">
            <section className="rounded-[18px] border border-[#e2e8f0] bg-white p-6 shadow-sm">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-medium tracking-tight text-[#0a1628]">
                    Upcoming <em className="not-italic text-sky-800">visits</em>
                  </h2>
                  <p className="mt-1 text-xs text-[#64748b]">Your next scheduled appointments</p>
                </div>
                <Link
                  to={ROUTES.patient.appointments}
                  className="inline-flex items-center gap-1 text-xs font-medium text-sky-800 hover:underline"
                >
                  View all
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              {upcomingPreview.length ? (
                <ul className="space-y-2">
                  {upcomingPreview.map((a, i) => {
                    if (!a.scheduledStart) return null;
                    const st = new Date(String(a.scheduledStart));
                    const prac = isRecord(a.practitioner) ? (a.practitioner as Record<string, unknown>) : null;
                    const dr = prac ? `${String(prac.firstName ?? '')} ${String(prac.lastName ?? '')}`.trim() : '';
                    const reason =
                      typeof a.reasonForVisit === 'string' && a.reasonForVisit.trim()
                        ? String(a.reasonForVisit)
                        : 'Visit';
                    const status = String(a.status ?? '');
                    const pill = statusPillClass(status);
                    const dateTint =
                      i === 0 ? 'from-teal-200 to-teal-500 text-[#04132a]' : i === 1 ? 'from-slate-200 to-slate-400 text-[#04132a]' : 'from-amber-200 to-amber-400 text-[#04132a]';
                    return (
                      <li
                        key={String(a._id ?? i)}
                        className="flex flex-wrap items-center gap-3 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3 sm:flex-nowrap"
                      >
                        <div
                          className={cn(
                            'flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br text-center text-[11px] font-semibold leading-tight shadow-sm',
                            dateTint,
                          )}
                        >
                          <span className="text-[10px] uppercase opacity-90">{format(st, 'MMM')}</span>
                          <span className="font-display text-lg">{format(st, 'd')}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-[#0a1628]">
                            {dr ? `Dr. ${dr}` : 'Clinician'} · {reason}
                          </p>
                          <p className="text-xs text-[#64748b]">Scheduled visit</p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
                          <span className="text-xs font-medium tabular-nums text-[#64748b]">{format(st, 'h:mm a')}</span>
                          <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-medium', pill.className)}>
                            {pill.label}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No upcoming visits. Book from Find a doctor.</p>
              )}
            </section>

            <section className="rounded-[18px] border border-[#e2e8f0] bg-white p-6 shadow-sm">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-medium tracking-tight text-[#0a1628]">
                    Recent <em className="not-italic text-sky-800">prescriptions</em>
                  </h2>
                  <p className="mt-1 text-xs text-[#64748b]">Download or refill from one place</p>
                </div>
                <Link
                  to={ROUTES.patient.prescriptions}
                  className="inline-flex items-center gap-1 text-xs font-medium text-sky-800 hover:underline"
                >
                  All prescriptions
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              {prescriptions.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
              {prescriptions.isError ? <p className="text-sm text-destructive">Could not load prescriptions.</p> : null}
              {rxItems.length ? (
                <ul className="space-y-2">
                  {rxItems.map((rx: unknown, i: number) => {
                    if (!isRecord(rx)) return null;
                    const issued = rx.issuedAt ? format(new Date(String(rx.issuedAt)), 'MMM d, yyyy') : '';
                    const num = typeof rx.prescriptionNumber === 'string' ? rx.prescriptionNumber : '';
                    const pdf = typeof rx.pdfUrl === 'string' ? rx.pdfUrl : '';
                    const duration =
                      Array.isArray(rx.medications) && isRecord(rx.medications[0])
                        ? String((rx.medications[0] as Record<string, unknown>).duration ?? '')
                        : '';
                    return (
                      <li
                        key={String(rx._id ?? i)}
                        className="flex gap-3 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-rose-200 to-rose-500 text-white shadow-sm">
                          <Pill className="h-5 w-5" strokeWidth={2} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-[#0a1628]">{firstMedicationLine(rx)}</p>
                          <p className="text-xs text-[#64748b]">
                            {practitionerShort(rx)} · Issued {issued}
                            {duration ? ` · ${duration}` : ''}
                          </p>
                          {num ? <p className="mt-1 font-mono text-[11px] text-[#94a3b8]">{num}</p> : null}
                        </div>
                        {pdf ? (
                          <a
                            href={pdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[#e2e8f0] bg-white text-[#64748b] transition-colors hover:border-sky-300 hover:text-sky-800"
                            title="Download PDF"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        ) : (
                          <div className="w-10 shrink-0" />
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : !prescriptions.isLoading ? (
                <p className="text-sm text-muted-foreground">No prescriptions yet.</p>
              ) : null}
            </section>

            <section className="rounded-[18px] border border-dashed border-[#c5d5eb] bg-white/80 p-5">
              <h2 className="font-display text-lg font-medium text-[#0a1628]">Your records</h2>
              <p className="mt-1 text-xs text-[#64748b]">Prescriptions, visits, and medical info in one place.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link to={ROUTES.patient.prescriptions}>Prescriptions</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link to={ROUTES.patient.appointments}>Appointments</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link to={ROUTES.patient.profileMedical}>Medical info</Link>
                </Button>
              </div>
            </section>
          </div>

          <div className="space-y-5">
            <section className="rounded-[18px] border border-[#e2e8f0] bg-white p-6 shadow-sm">
              <div className="mb-4">
                <h2 className="font-display text-xl font-medium tracking-tight text-[#0a1628]">
                  Today&apos;s <em className="not-italic text-sky-800">vitals</em>
                </h2>
                <p className="mt-1 text-xs text-[#64748b]">Sample dashboard · connect devices in a future release</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <VitalMini icon={Heart} iconClass="text-rose-500" label="Heart rate" value="72" unit="bpm" bars={[30, 50, 70, 60, 80, 75, 65]} />
                <VitalMini icon={Droplets} iconClass="text-sky-500" label="Blood pressure" value="118/76" bars={[50, 45, 55, 60, 50, 65, 58]} />
                <VitalMini icon={Activity} iconClass="text-teal-500" label="Activity" value="6.4k" unit="steps" bars={[40, 65, 70, 90, 55, 75, 85]} />
                <VitalMini icon={Moon} iconClass="text-violet-500" label="Sleep" value="7h 42" unit="m" bars={[60, 80, 50, 75, 90, 85, 80]} />
              </div>
            </section>

            <section className="rounded-[18px] border border-[#e2e8f0] bg-white p-6 shadow-sm">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="font-display text-xl font-medium tracking-tight text-[#0a1628]">
                    Recent <em className="not-italic text-sky-800">messages</em>
                  </h2>
                  <p className="mt-1 text-xs text-[#64748b]">Chat with your care team after visits are booked</p>
                </div>
                <Link
                  to={ROUTES.patient.messages}
                  className="inline-flex items-center gap-1 text-xs font-medium text-sky-800 hover:underline"
                >
                  Open inbox
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <ul className="space-y-2">
                {[
                  { name: 'Care team', preview: 'Message your clinicians from the inbox.', tone: 'from-sky-400 to-sky-600', unread: 0 },
                  { name: 'Appointments', preview: 'Confirmations and reminders appear here.', tone: 'from-teal-400 to-teal-600', unread: 0 },
                ].map((row) => (
                  <li key={row.name} className="flex gap-3 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3">
                    <div
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white shadow-sm',
                        row.tone,
                      )}
                    >
                      {row.name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#0a1628]">{row.name}</p>
                      <p className="line-clamp-2 text-xs text-[#64748b]">{row.preview}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-[18px] border border-[#e2e8f0] bg-white p-6 shadow-sm">
              <h2 className="font-display text-lg font-medium text-[#0a1628]">Tasks &amp; notes</h2>
              <p className="mt-2 text-sm text-[#64748b]">No tasks yet. After your next visit, follow-ups may appear here.</p>
            </section>
          </div>
        </div>

        <p className="text-center text-[11px] text-muted-foreground">
          {apptTotal} appointments on file · Vitals shown are illustrative
        </p>
      </div>
    </>
  );
}

function VitalMini({
  icon: Icon,
  iconClass,
  label,
  value,
  unit,
  bars,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  iconClass?: string;
  label: string;
  value: string;
  unit?: string;
  bars: number[];
}) {
  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3">
      <div className="flex items-center gap-2">
        <Icon className={cn('h-4 w-4 shrink-0', iconClass)} strokeWidth={2} />
        <span className="text-[11px] font-medium text-[#64748b]">{label}</span>
      </div>
      <p className="mt-2 font-display text-xl font-medium tabular-nums text-[#0a1628]">
        {value}
        {unit ? <span className="text-sm font-normal text-[#64748b]"> {unit}</span> : null}
      </p>
      <div className="mt-2 flex h-10 items-end gap-0.5">
        {bars.map((h, i) => (
          <div
            key={i}
            className={cn('flex-1 rounded-sm bg-sky-200/80', i >= bars.length - 4 ? 'bg-sky-500/90' : '')}
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
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
