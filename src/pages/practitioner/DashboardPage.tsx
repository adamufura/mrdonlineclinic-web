import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  MessageSquare,
  Star,
  TrendingUp,
  Users,
  Video,
  X,
} from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import {
  endOfDay,
  endOfWeek,
  format,
  formatDistanceToNow,
  startOfDay,
  startOfWeek,
  subWeeks,
} from 'date-fns';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { getPractitionerMe, listPractitionerAppointments } from '@/features/practitioners/session-api';
import { ROUTES } from '@/router/routes';
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

const TERMINAL = new Set(['COMPLETED', 'CANCELLED', 'NO_SHOW', 'REJECTED']);

function patientName(a: Record<string, unknown>): string {
  const patient = isRecord(a.patient) ? (a.patient as Record<string, unknown>) : null;
  return patient ? `${String(patient.firstName ?? '')} ${String(patient.lastName ?? '')}`.trim() || 'Patient' : 'Patient';
}

function patientId(a: Record<string, unknown>): string | null {
  const p = a.patient;
  if (isRecord(p) && p._id != null) return String(p._id);
  if (typeof p === 'string') return p;
  return null;
}

const AVATAR_TONES = [
  'from-sky-400 to-sky-600',
  'from-teal-300 to-teal-600',
  'from-amber-300 to-amber-500',
  'from-violet-300 to-violet-600',
  'from-rose-300 to-rose-500',
] as const;

export default function PractitionerDashboardPage() {
  const today = new Date();
  const from = startOfDay(today);
  const to = endOfDay(today);
  const weekFrom = startOfWeek(today, { weekStartsOn: 1 });
  const weekTo = endOfWeek(today, { weekStartsOn: 1 });
  const prevAnchor = subWeeks(today, 1);
  const prevWeekFrom = startOfWeek(prevAnchor, { weekStartsOn: 1 });
  const prevWeekTo = endOfWeek(prevAnchor, { weekStartsOn: 1 });

  const me = useQuery({
    queryKey: ['practitioners', 'me'],
    queryFn: getPractitionerMe,
  });

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

  const weekAppts = useQuery({
    queryKey: ['practitioners', 'me', 'appointments', 'week', weekFrom.toISOString(), weekTo.toISOString()],
    queryFn: () =>
      listPractitionerAppointments({
        page: 1,
        limit: 200,
        from: weekFrom,
        to: weekTo,
      }),
  });

  const prevWeekAppts = useQuery({
    queryKey: ['practitioners', 'me', 'appointments', 'prev-week', prevWeekFrom.toISOString(), prevWeekTo.toISOString()],
    queryFn: () =>
      listPractitionerAppointments({
        page: 1,
        limit: 200,
        from: prevWeekFrom,
        to: prevWeekTo,
      }),
  });

  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const items = useMemo(() => {
    const raw = [...(todayAppts.data?.items ?? [])];
    return raw.sort((a, b) => {
      if (!isRecord(a) || !isRecord(b)) return 0;
      const ta = a.scheduledStart ? new Date(String(a.scheduledStart)).getTime() : 0;
      const tb = b.scheduledStart ? new Date(String(b.scheduledStart)).getTime() : 0;
      return ta - tb;
    });
  }, [todayAppts.data?.items]);

  const now = new Date(nowTick);
  const nextId = useMemo(() => {
    for (const a of items) {
      if (!isRecord(a) || !a.scheduledStart || !a._id) continue;
      const t = new Date(String(a.scheduledStart)).getTime();
      const st = String(a.status ?? '');
      if (t >= now.getTime() && ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(st)) {
        return String(a._id);
      }
    }
    return null;
  }, [items, nowTick]);

  const completedToday = items.filter((a) => isRecord(a) && String(a.status) === 'COMPLETED').length;
  const totalToday = items.length;
  const toGo = Math.max(0, totalToday - completedToday);

  const weekItems = weekAppts.data?.items ?? [];
  const prevWeekItems = prevWeekAppts.data?.items ?? [];
  const completedThisWeek = weekItems.filter((a) => isRecord(a) && String(a.status) === 'COMPLETED').length;
  const completedPrevWeek = prevWeekItems.filter((a) => isRecord(a) && String(a.status) === 'COMPLETED').length;

  const weekOverWeekPct =
    completedPrevWeek > 0
      ? Math.round(((completedThisWeek - completedPrevWeek) / completedPrevWeek) * 100)
      : completedThisWeek > 0
        ? null
        : 0;

  const uniquePatientsThisWeek = useMemo(() => {
    const ids = new Set<string>();
    for (const raw of weekItems) {
      if (!isRecord(raw)) continue;
      const id = patientId(raw);
      if (id) ids.add(id);
    }
    return ids.size;
  }, [weekItems]);

  const newPatientsThisWeek = useMemo(() => {
    const prevIds = new Set<string>();
    for (const raw of prevWeekItems) {
      if (!isRecord(raw)) continue;
      const id = patientId(raw);
      if (id) prevIds.add(id);
    }
    const newIds = new Set<string>();
    for (const raw of weekItems) {
      if (!isRecord(raw)) continue;
      const id = patientId(raw);
      if (id && !prevIds.has(id)) newIds.add(id);
    }
    return newIds.size;
  }, [weekItems, prevWeekItems]);

  const recentPatients = useMemo(() => {
    const map = new Map<string, { id: string; name: string; visits: number; last: Date }>();
    for (const raw of weekItems) {
      if (!isRecord(raw)) continue;
      const pid = patientId(raw);
      if (!pid) continue;
      const name = patientName(raw);
      const st = raw.scheduledStart ? new Date(String(raw.scheduledStart)) : new Date(0);
      const cur = map.get(pid);
      if (!cur) map.set(pid, { id: pid, name, visits: 1, last: st });
      else {
        cur.visits += 1;
        if (st.getTime() > cur.last.getTime()) cur.last = st;
      }
    }
    return [...map.values()]
      .sort((a, b) => b.visits - a.visits || b.last.getTime() - a.last.getTime())
      .slice(0, 6);
  }, [weekItems]);

  const chartBuckets = useMemo(() => {
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const counts = [0, 0, 0, 0, 0, 0, 0];
    for (const a of weekItems) {
      if (!isRecord(a) || !a.scheduledStart) continue;
      const d = new Date(String(a.scheduledStart));
      const dow = d.getDay();
      const idx = dow === 0 ? 6 : dow - 1;
      counts[idx] += 1;
    }
    const max = Math.max(...counts, 1);
    const todayDow = today.getDay();
    const todayIdx = todayDow === 0 ? 6 : todayDow - 1;
    return labels.map((label, i) => ({
      label,
      count: counts[i],
      h: Math.round((counts[i] / max) * 100),
      isToday: i === todayIdx,
    }));
  }, [weekItems, today]);

  const totalWeekSlots = weekItems.length;

  const lastName = typeof me.data?.lastName === 'string' ? me.data.lastName : '';
  const rating = typeof me.data?.averageRating === 'number' ? me.data.averageRating : null;
  const reviewCount = typeof me.data?.totalReviews === 'number' ? me.data.totalReviews : 0;

  const pendingTotal = pending.data?.meta.total ?? 0;
  const pendingItems = pending.data?.items ?? [];

  const first = items[0] as Record<string, unknown> | undefined;
  const last = items[items.length - 1] as Record<string, unknown> | undefined;
  const scheduleRange =
    first?.scheduledStart && last?.scheduledStart
      ? `${format(new Date(String(first.scheduledStart)), 'h:mm a')} – ${format(new Date(String(last.scheduledStart)), 'h:mm a')}`
      : null;

  const completedMeta =
    weekOverWeekPct === null && completedThisWeek > 0
      ? 'First week of data'
      : weekOverWeekPct !== 0 && weekOverWeekPct !== null
        ? (
            <span className={cn('font-medium', weekOverWeekPct >= 0 ? 'text-teal-600' : 'text-rose-600')}>
              {weekOverWeekPct >= 0 ? '+' : ''}
              {weekOverWeekPct}% vs last week
            </span>
          )
        : completedThisWeek > 0
          ? 'Same as last week'
          : 'No completed visits yet';

  return (
    <>
      <Helmet>
        <title>Practitioner dashboard — MRD Online Clinic</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="space-y-7">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-500/15 bg-teal-500/10 px-3 py-1 text-xs font-medium text-teal-800">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-500" />
              {format(today, 'EEEE, MMM d')} · Day view
            </p>
            <h1 className="font-display text-3xl font-normal tracking-tight text-[#0a1628] sm:text-[38px] sm:leading-[1.1]">
              {greetingLabel()}, <em className="font-medium not-italic text-teal-700">Dr. {lastName || '—'}</em>
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[#64748b]">
              You have <span className="font-semibold text-[#0a1628]">{totalToday}</span> visits today
              {pendingTotal > 0 ? (
                <>
                  {' '}
                  and <span className="font-semibold text-rose-600">{pendingTotal}</span> request
                  {pendingTotal === 1 ? '' : 's'} awaiting your decision.
                </>
              ) : (
                <> and no pending booking requests.</>
              )}
            </p>
          </div>
          <div className="flex flex-col gap-2 text-sm text-[#64748b] sm:items-end">
            {rating != null ? (
              <span className="inline-flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-[#0a1628]">{rating.toFixed(1)}</span>
                <span>· {reviewCount} reviews</span>
              </span>
            ) : (
              <span className="text-muted-foreground">No public rating yet</span>
            )}
            <Link
              to={ROUTES.practitioner.messages}
              className="inline-flex items-center gap-1.5 font-medium text-teal-800 hover:underline"
            >
              <MessageSquare className="h-4 w-4" />
              Inbox
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            tone="blue"
            icon={Calendar}
            label="Today's visits"
            value={totalToday}
            meta={`${completedToday} completed · ${toGo} to go`}
          />
          <StatCard
            tone="warm"
            icon={Clock}
            label="Pending requests"
            value={pendingTotal}
            meta={
              pendingTotal > 0 ? (
                <span className="inline-flex items-center gap-1 font-medium text-rose-600">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
                  Action needed
                </span>
              ) : (
                'All caught up'
              )
            }
          />
          <StatCard
            tone="mint"
            icon={TrendingUp}
            label="Completed this week"
            value={completedThisWeek}
            meta={completedMeta}
          />
          <StatCard
            tone="coral"
            icon={Users}
            label="Patients this week"
            value={uniquePatientsThisWeek}
            meta={
              newPatientsThisWeek > 0
                ? `+${newPatientsThisWeek} new vs last week`
                : 'Unique patients with visits'
            }
          />
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-5">
            <section className="rounded-[18px] border border-[#e2e8f0] bg-white p-6 shadow-sm">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-medium tracking-tight text-[#0a1628]">
                    Today&apos;s <em className="not-italic text-teal-700">schedule</em>
                  </h2>
                  <p className="mt-1 text-xs text-[#64748b]">
                    {totalToday} visits · {scheduleRange ?? 'No visits scheduled'}
                  </p>
                </div>
                <Link
                  to={ROUTES.practitioner.schedule}
                  className="inline-flex items-center gap-1 text-xs font-medium text-teal-800 hover:underline"
                >
                  Full calendar
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {todayAppts.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
              {todayAppts.isError ? (
                <p className="text-sm text-destructive">Could not load today&apos;s visits.</p>
              ) : null}

              {items.length ? (
                <ul className="relative space-y-0 pl-1 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-px before:bg-[#e2e8f0]">
                  {items.map((a: unknown, i: number) => {
                    if (!isRecord(a) || !a.scheduledStart) return null;
                    const st = new Date(String(a.scheduledStart));
                    const id = String(a._id ?? i);
                    const status = String(a.status ?? '');
                    const terminal = TERMINAL.has(status);
                    const isNext = !terminal && id === nextId;
                    const tMs = st.getTime();
                    const isPast = terminal || tMs < now.getTime();
                    const isUpcoming = !isPast && !terminal;

                    const reason =
                      typeof a.reasonForVisit === 'string' && a.reasonForVisit.trim()
                        ? a.reasonForVisit.trim()
                        : 'Visit';

                    return (
                      <li key={id} className="relative flex gap-4 pb-6 last:pb-0">
                        <div
                          className={cn(
                            'relative z-[1] flex w-8 shrink-0 flex-col items-center pt-0.5',
                            isNext && 'text-teal-600',
                          )}
                        >
                          <span
                            className={cn(
                              'mt-1 h-2.5 w-2.5 rounded-full border-2 border-white shadow-sm',
                              isPast && 'bg-slate-300',
                              isNext && 'bg-teal-400 ring-4 ring-teal-100',
                              !isPast && !isNext && 'bg-slate-200',
                            )}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-mono text-xs font-medium text-[#64748b]">{format(st, 'HH:mm')}</p>
                          <p className="mt-1 font-medium text-[#0a1628]">
                            {patientName(a)} · <span className="font-normal text-[#64748b]">{reason}</span>
                          </p>
                        </div>
                        <div className="shrink-0 pt-5">
                          {status === 'COMPLETED' ? (
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                              Completed
                            </span>
                          ) : isNext ? (
                            <span className="rounded-full bg-teal-100 px-2.5 py-1 text-[11px] font-medium text-teal-800">
                              Next up · {formatDistanceToNow(st, { addSuffix: true })}
                            </span>
                          ) : isUpcoming ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-medium text-sky-800">
                              <Video className="h-3 w-3" />
                              Video
                            </span>
                          ) : (
                            <span className="rounded-full border border-[#e2e8f0] bg-white px-2.5 py-1 text-[11px] font-medium capitalize text-[#64748b]">
                              {status.toLowerCase().replace('_', ' ')}
                            </span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : todayAppts.isSuccess ? (
                <p className="text-sm text-muted-foreground">No appointments scheduled for today.</p>
              ) : null}
            </section>

            <section className="rounded-[18px] border border-[#e2e8f0] bg-white p-6 shadow-sm">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="font-display text-xl font-medium tracking-tight text-[#0a1628]">
                    This week&apos;s <em className="not-italic text-teal-700">visits</em>
                  </h2>
                  <p className="mt-1 text-xs text-[#64748b]">
                    {completedThisWeek} completed · {totalWeekSlots} appointment{totalWeekSlots === 1 ? '' : 's'} this
                    week
                  </p>
                </div>
                <Link
                  to={ROUTES.practitioner.appointments}
                  className="inline-flex items-center gap-1 text-xs font-medium text-teal-800 hover:underline"
                >
                  Reports
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="flex h-40 items-end justify-between gap-2 border-b border-[#e2e8f0] pb-2 pl-1 pr-1 pt-4">
                {chartBuckets.map((col) => (
                  <div key={col.label} className="flex flex-1 flex-col items-center gap-2">
                    <div className="relative flex h-28 w-full max-w-[2.5rem] items-end justify-center">
                      <div
                        className={cn(
                          'w-full min-h-[6px] rounded-t-md transition-all',
                          col.isToday
                            ? 'bg-gradient-to-t from-teal-600 to-teal-400'
                            : 'bg-gradient-to-t from-sky-700 to-sky-400 opacity-80',
                        )}
                        style={{ height: `${Math.max(col.h, 8)}%` }}
                      />
                      <span className="absolute -top-5 text-[11px] font-medium text-[#0a1628]">{col.count || '—'}</span>
                    </div>
                    <span className={cn('text-[11px] font-medium', col.isToday ? 'text-teal-700' : 'text-[#64748b]')}>
                      {col.label}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-5">
            <section className="rounded-[18px] border border-[#e2e8f0] bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-display text-xl font-medium tracking-tight text-[#0a1628]">
                    Pending <em className="not-italic text-teal-700">requests</em>
                  </h2>
                  <p className="mt-1 text-xs text-[#64748b]">
                    {pendingTotal > 0
                      ? `Action needed · ${pendingTotal} awaiting review`
                      : 'No requests waiting'}
                  </p>
                </div>
                <Link
                  to={ROUTES.practitioner.appointments}
                  className="text-xs font-medium text-teal-800 hover:underline"
                >
                  View all
                </Link>
              </div>

              {pending.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
              {pending.isError ? <p className="text-sm text-destructive">Could not load requests.</p> : null}

              {pendingItems.length ? (
                <ul className="space-y-3">
                  {pendingItems.slice(0, 5).map((a: unknown, i: number) => {
                    if (!isRecord(a) || !a._id) return null;
                    const st = a.scheduledStart ? new Date(String(a.scheduledStart)) : null;
                    const reason =
                      typeof a.reasonForVisit === 'string' && a.reasonForVisit.trim()
                        ? a.reasonForVisit.trim()
                        : 'Consultation';
                    const symptoms = Array.isArray(a.symptoms)
                      ? (a.symptoms as unknown[]).filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
                      : [];
                    const tagSource = symptoms.length ? symptoms : reason.split(',').map((s) => s.trim()).filter(Boolean);
                    const tags = tagSource.slice(0, 2);
                    const extra = tagSource.length > 2 ? tagSource.length - 2 : 0;

                    const initials = patientName(a)
                      .split(/\s+/)
                      .map((w) => w[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase();
                    return (
                      <li
                        key={String(a._id ?? i)}
                        className="flex gap-3 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3"
                      >
                        <div
                          className={cn(
                            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-semibold text-white shadow-sm',
                            AVATAR_TONES[i % AVATAR_TONES.length],
                          )}
                        >
                          {initials || 'P'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-[#0a1628]">{patientName(a)}</p>
                          <p className="text-xs text-[#64748b]">
                            {st ? `${format(st, 'MMM d')} · ${format(st, 'h:mm a')}` : 'Time TBC'} · {reason}
                          </p>
                          {tags.length ? (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {tags.map((t) => (
                                <span
                                  key={t}
                                  className="rounded-md border border-[#e2e8f0] bg-white px-2 py-0.5 text-[11px] font-medium text-[#475569]"
                                >
                                  {t.length > 24 ? `${t.slice(0, 24)}…` : t}
                                </span>
                              ))}
                              {extra > 0 ? (
                                <span className="rounded-md bg-teal-50 px-2 py-0.5 text-[11px] font-medium text-teal-800">
                                  +{extra}
                                </span>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 flex-col gap-1.5">
                          <Button
                            size="icon"
                            className="h-9 w-9 rounded-lg bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-sm hover:from-teal-600 hover:to-teal-800"
                            asChild
                            title="Review & confirm"
                          >
                            <Link to={ROUTES.practitioner.appointment(String(a._id))}>
                              <Check className="h-4 w-4" strokeWidth={2.5} />
                            </Link>
                          </Button>
                          <Button size="icon" variant="outline" className="h-9 w-9 rounded-lg border-[#e2e8f0]" asChild title="Decline or reschedule">
                            <Link to={ROUTES.practitioner.appointment(String(a._id))}>
                              <X className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : pending.isSuccess ? (
                <p className="text-sm text-muted-foreground">No pending requests.</p>
              ) : null}
            </section>

            <section className="rounded-[18px] border border-[#e2e8f0] bg-white p-6 shadow-sm">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="font-display text-xl font-medium tracking-tight text-[#0a1628]">
                    Recent <em className="not-italic text-teal-700">patients</em>
                  </h2>
                  <p className="mt-1 text-xs text-[#64748b]">Seen this week (by appointment volume)</p>
                </div>
                <Link
                  to={ROUTES.practitioner.patients}
                  className="inline-flex items-center gap-1 text-xs font-medium text-teal-800 hover:underline"
                >
                  All patients
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {weekAppts.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
              {recentPatients.length ? (
                <ul className="divide-y divide-[#eef1f6] rounded-xl border border-[#e2e8f0] bg-[#fafbfc]">
                  {recentPatients.map((p, idx) => (
                    <li key={p.id}>
                      <Link
                        to={ROUTES.practitioner.patients}
                        className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-violet-50/60"
                      >
                        <div
                          className={cn(
                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white',
                            AVATAR_TONES[idx % AVATAR_TONES.length],
                          )}
                        >
                          {p.name
                            .split(/\s+/)
                            .map((w) => w[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-[#0a1628]">{p.name}</p>
                          <p className="text-[11px] text-[#64748b]">
                            Last visit {format(p.last, 'MMM d')} · Active this week
                          </p>
                        </div>
                        <span className="shrink-0 text-xs font-medium tabular-nums text-[#64748b]">
                          {p.visits} visit{p.visits === 1 ? '' : 's'}
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-[#94a3b8]" />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : weekAppts.isSuccess ? (
                <p className="text-sm text-muted-foreground">No patients in this week&apos;s schedule yet.</p>
              ) : null}
            </section>
          </div>
        </div>
      </div>
    </>
  );
}

function StatCard({
  tone,
  icon: Icon,
  label,
  value,
  meta,
}: {
  tone: 'blue' | 'warm' | 'mint' | 'coral';
  icon: typeof Calendar;
  label: string;
  value: number | string;
  meta: ReactNode;
}) {
  const iconGrad =
    tone === 'blue'
      ? 'from-sky-400 to-sky-700 shadow-sky-500/25'
      : tone === 'warm'
        ? 'from-amber-300 to-amber-600 shadow-amber-500/25'
        : tone === 'mint'
          ? 'from-teal-300 to-teal-600 shadow-teal-500/25'
          : 'from-rose-300 to-rose-500 shadow-rose-500/25';

  const wash =
    tone === 'blue'
      ? 'before:bg-sky-500/10'
      : tone === 'warm'
        ? 'before:bg-amber-500/10'
        : tone === 'mint'
          ? 'before:bg-teal-500/10'
          : 'before:bg-rose-500/10';

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md',
        'before:pointer-events-none before:absolute before:right-0 before:top-0 before:h-24 before:w-24 before:rounded-full',
        wash,
      )}
    >
      <div
        className={cn(
          'mb-3.5 grid h-9 w-9 place-items-center rounded-[10px] bg-gradient-to-br text-white',
          iconGrad,
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
