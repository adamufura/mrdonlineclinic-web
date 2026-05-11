import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Clock, MapPin, Sparkles, Star } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { bookAppointment } from '@/features/appointments/api';
import { cn } from '@/lib/utils/cn';
import { ROUTES } from '@/router/routes';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function specialtyNames(pr: Record<string, unknown>): string[] {
  const raw = pr.specialties;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((s) => (isRecord(s) && typeof s.name === 'string' ? s.name : null))
    .filter((n): n is string => Boolean(n));
}

function formatLocationLine(pr: Record<string, unknown>): string | null {
  const loc = pr.practiceLocation;
  if (!isRecord(loc)) return null;
  const parts = [loc.city, loc.state, loc.country].filter((x) => typeof x === 'string' && String(x).trim());
  return parts.length ? parts.map(String).join(', ') : null;
}

type ParsedSlot = { id: string; start: Date; end: Date; durationMinutes: number };

function parseSlots(raw: unknown[]): ParsedSlot[] {
  const out: ParsedSlot[] = [];
  for (const row of raw) {
    if (!isRecord(row) || row._id == null || !row.startTime || !row.endTime) continue;
    const start = new Date(String(row.startTime));
    const end = new Date(String(row.endTime));
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) continue;
    const durationMinutes =
      typeof row.durationMinutes === 'number' && Number.isFinite(row.durationMinutes)
        ? row.durationMinutes
        : Math.max(1, Math.round((end.getTime() - start.getTime()) / 60_000));
    out.push({ id: String(row._id), start, end, durationMinutes });
  }
  return out.sort((a, b) => a.start.getTime() - b.start.getTime());
}

function dayKey(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

function bucketHour(h: number): 'morning' | 'afternoon' | 'evening' {
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export type PractitionerBookingWidgetProps = {
  practitionerId: string;
  practitioner: Record<string, unknown>;
  slots: unknown[];
  slotsLoading: boolean;
  slotsError: boolean;
  /** Patient can submit booking from this surface */
  allowSubmit: boolean;
  initialSlotId?: string | null;
  /** After successful book (patient flow) */
  onBooked?: (appointmentId: string) => void;
  /** e.g. `/login` — used to build `?returnUrl=/patient/appointments/book/...` for guests */
  loginPath: string;
  className?: string;
};

export function PractitionerBookingWidget({
  practitionerId,
  practitioner: pr,
  slots,
  slotsLoading,
  slotsError,
  allowSubmit,
  initialSlotId,
  onBooked,
  loginPath,
  className,
}: PractitionerBookingWidgetProps) {
  const qc = useQueryClient();
  const parsed = useMemo(() => parseSlots(Array.isArray(slots) ? slots : []), [slots]);
  const daysWithSlots = useMemo(() => {
    const s = new Set<string>();
    for (const sl of parsed) {
      s.add(dayKey(sl.start));
    }
    return s;
  }, [parsed]);

  const today = useMemo(() => startOfDay(new Date()), []);
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date>(() => startOfDay(new Date()));
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [reason, setReason] = useState('Consultation');
  const [jumpedToFirstSlot, setJumpedToFirstSlot] = useState(false);

  useEffect(() => {
    if (!initialSlotId || !parsed.length) return;
    const found = parsed.find((s) => s.id === initialSlotId);
    if (found) {
      setSelectedDay(startOfDay(found.start));
      setViewMonth(startOfMonth(found.start));
      setSelectedSlotId(found.id);
    }
  }, [initialSlotId, parsed]);

  useEffect(() => {
    if (jumpedToFirstSlot || initialSlotId || parsed.length === 0) return;
    const hasToday = parsed.some((s) => isSameDay(s.start, today));
    if (!hasToday) {
      setSelectedDay(startOfDay(parsed[0].start));
      setViewMonth(startOfMonth(parsed[0].start));
    }
    setJumpedToFirstSlot(true);
  }, [jumpedToFirstSlot, initialSlotId, parsed, today]);

  const slotsForSelectedDay = useMemo(() => {
    return parsed.filter((s) => isSameDay(s.start, selectedDay));
  }, [parsed, selectedDay]);

  const selectedSlot = useMemo(
    () => parsed.find((s) => s.id === selectedSlotId) ?? null,
    [parsed, selectedSlotId],
  );

  const morning = slotsForSelectedDay.filter((s) => bucketHour(s.start.getHours()) === 'morning');
  const afternoon = slotsForSelectedDay.filter((s) => bucketHour(s.start.getHours()) === 'afternoon');
  const evening = slotsForSelectedDay.filter((s) => bucketHour(s.start.getHours()) === 'evening');

  const specs = specialtyNames(pr);
  const primarySpec = specs[0] ?? 'Consultation';
  const secondarySpec = specs[1] ?? 'General visit';
  const displayName = `${String(pr.firstName ?? '')} ${String(pr.lastName ?? '')}`.trim() || 'Practitioner';
  const drName = displayName.startsWith('Dr.') ? displayName : `Dr. ${displayName}`;
  const rating = typeof pr.averageRating === 'number' ? pr.averageRating : null;
  const reviewCount = typeof pr.totalReviews === 'number' ? pr.totalReviews : 0;
  const isVerified = pr.verificationStatus === 'VERIFIED';
  const locationLine = formatLocationLine(pr);

  const bookMut = useMutation({
    mutationFn: bookAppointment,
    onSuccess: async (data) => {
      toast.success('Request sent. Your practitioner will confirm shortly.');
      await qc.invalidateQueries({ queryKey: ['patients', 'appointments'] });
      const id = data._id != null ? String(data._id) : null;
      if (id && onBooked) onBooked(id);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Booking failed'),
  });

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const gridDays = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const guestLoginHref = useMemo(() => {
    const returnPath = `${ROUTES.patient.book(practitionerId)}${
      selectedSlotId ? `?slotId=${encodeURIComponent(selectedSlotId)}` : ''
    }`;
    return `${loginPath}?${new URLSearchParams({ returnUrl: returnPath }).toString()}`;
  }, [loginPath, practitionerId, selectedSlotId]);

  function goPrevMonth() {
    setViewMonth((m) => addMonths(m, -1));
  }
  function goNextMonth() {
    setViewMonth((m) => addMonths(m, 1));
  }

  return (
    <div className={cn('space-y-5', className)}>
      <section className="relative overflow-hidden rounded-2xl border border-[#e8eef2] bg-white shadow-[0_16px_48px_-24px_rgba(14,22,61,0.2)] ring-1 ring-black/[0.03]">
        {rating != null ? (
          <div
            className="absolute right-3 top-3 z-[2] sm:right-5 sm:top-4"
            role="img"
            aria-label={`Average rating ${rating.toFixed(1)} out of 5, ${reviewCount} reviews`}
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1.5 text-sm font-semibold text-amber-900 shadow-sm ring-1 ring-amber-200/80">
              <Star className="size-4 shrink-0 fill-amber-400 text-amber-500" aria-hidden />
              {rating.toFixed(1)}
              <span className="font-normal text-amber-800/80">({reviewCount})</span>
            </span>
          </div>
        ) : null}
        <div className={cn('border-b border-slate-100 p-5 sm:p-6', rating != null && 'pr-[7.5rem] sm:pr-36')}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
            {typeof pr.profilePhotoUrl === 'string' ? (
              <img
                src={pr.profilePhotoUrl}
                alt=""
                className="mx-auto size-24 shrink-0 rounded-full object-cover shadow-md ring-4 ring-slate-100 sm:mx-0 sm:size-28"
              />
            ) : (
              <div className="mx-auto flex size-24 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-indigo-100 text-xl font-semibold text-sky-900 shadow-inner ring-4 ring-white sm:mx-0 sm:size-28">
                {String(pr.firstName ?? '?')[0]}
                {String(pr.lastName ?? '?')[0]}
              </div>
            )}
            <div className="min-w-0 flex-1 text-center lg:text-left">
              <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                {isVerified ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800 ring-1 ring-emerald-500/20">
                    <Sparkles className="size-3" aria-hidden />
                    Verified
                  </span>
                ) : null}
              </div>
              <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-[#0f172a] sm:text-[1.75rem]">
                {drName}
              </h1>
              {specs.length ? (
                <p className="mt-3 text-sm font-medium text-violet-700">{specs.join(' · ')}</p>
              ) : (
                <p className="mt-3 text-sm font-medium text-violet-700">Medical practitioner</p>
              )}
              {locationLine ? (
                <p className="mt-2 flex items-start justify-center gap-2 text-sm text-slate-600 lg:justify-start">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-sky-600" aria-hidden />
                  <span>{locationLine}</span>
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-6 grid gap-3 rounded-xl bg-slate-50/90 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCell
              label="Service"
              value={
                selectedSlot
                  ? `${primarySpec} (${selectedSlot.durationMinutes} min)`
                  : `${primarySpec} — pick a time`
              }
            />
            <SummaryCell label="Focus" value={secondarySpec} muted={!selectedSlot} />
            <SummaryCell
              label="Date & time"
              value={
                selectedSlot
                  ? `${format(selectedSlot.start, 'h:mm a')} – ${format(selectedSlot.end, 'h:mm a')}, ${format(selectedSlot.start, 'd MMM yyyy')}`
                  : 'Select below'
              }
            />
            <SummaryCell label="Visit type" value="Online (MRD Clinic)" />
          </div>
        </div>

        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:divide-x lg:divide-slate-100">
          <div className="p-5 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                className="grid size-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
                onClick={goPrevMonth}
                aria-label="Previous month"
              >
                <ChevronLeft className="size-5" />
              </button>
              <p className="text-center font-display text-lg font-semibold text-[#0f172a]">
                {format(viewMonth, 'MMMM yyyy')}
              </p>
              <button
                type="button"
                className="grid size-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
                onClick={goNextMonth}
                aria-label="Next month"
              >
                <ChevronRight className="size-5" />
              </button>
            </div>
            <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {WEEKDAYS.map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {gridDays.map((d) => {
                const inMonth = isSameMonth(d, viewMonth);
                const isPast = isBefore(startOfDay(d), today);
                const has = daysWithSlots.has(dayKey(d));
                const selected = isSameDay(d, selectedDay);
                return (
                  <button
                    key={d.toISOString()}
                    type="button"
                    disabled={isPast}
                    onClick={() => {
                      setSelectedDay(startOfDay(d));
                      setSelectedSlotId(null);
                    }}
                    className={cn(
                      'relative mx-auto flex aspect-square w-full max-w-[2.75rem] flex-col items-center justify-center rounded-full text-sm font-medium transition-colors',
                      !inMonth && 'text-slate-300',
                      inMonth && !selected && !isPast && 'text-slate-800 hover:bg-sky-50',
                      isPast && 'cursor-not-allowed text-slate-300 opacity-50',
                      selected && 'bg-sky-600 text-white shadow-md hover:bg-sky-700',
                      has && !selected && inMonth && !isPast && 'font-semibold',
                    )}
                  >
                    {format(d, 'd')}
                    {has && !selected ? (
                      <span className="absolute bottom-1.5 size-1 rounded-full bg-sky-500" aria-hidden />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-2 text-slate-800">
              <Clock className="size-5 text-sky-600" aria-hidden />
              <div>
                <p className="font-display text-base font-semibold text-[#0f172a]">Available times</p>
                <p className="text-xs text-slate-500">{format(selectedDay, 'EEEE, MMMM d')}</p>
              </div>
            </div>

            {slotsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((k) => (
                  <div key={k} className="h-10 animate-pulse rounded-lg bg-slate-100" />
                ))}
              </div>
            ) : null}
            {slotsError ? (
              <p className="text-sm text-red-600">We couldn&apos;t load availability. Try again later.</p>
            ) : null}

            {!slotsLoading && !slotsError ? (
              <div className="space-y-6">
                <TimeBucket label="Morning" slots={morning} selectedId={selectedSlotId} onSelect={setSelectedSlotId} />
                <TimeBucket
                  label="Afternoon"
                  slots={afternoon}
                  selectedId={selectedSlotId}
                  onSelect={setSelectedSlotId}
                />
                <TimeBucket label="Evening" slots={evening} selectedId={selectedSlotId} onSelect={setSelectedSlotId} />
                {slotsForSelectedDay.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
                    No openings this day. Choose another date with a blue dot.
                  </p>
                ) : null}
              </div>
            ) : null}

            {selectedSlotId && allowSubmit ? (
              <div className="mt-6 space-y-3 border-t border-slate-100 pt-6">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="visit-reason">
                  Reason for visit
                </label>
                <Textarea
                  id="visit-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="min-h-[100px] resize-none border-slate-200 bg-white text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:border-sky-500 focus-visible:ring-sky-500/20 dark:bg-white dark:text-slate-900 dark:placeholder:text-slate-400"
                  placeholder="Briefly describe what you’d like to discuss"
                />
                <Button
                  type="button"
                  disabled={!reason.trim() || bookMut.isPending}
                  className="w-full rounded-xl bg-sky-600 py-6 text-base font-semibold text-white shadow-lg shadow-sky-600/25 hover:bg-sky-700"
                  onClick={() => {
                    const r = reason.trim();
                    if (!r || !selectedSlotId) return;
                    bookMut.mutate({ slotId: selectedSlotId, reasonForVisit: r });
                  }}
                >
                  {bookMut.isPending ? 'Sending request…' : 'Request this appointment'}
                </Button>
              </div>
            ) : null}

            {selectedSlotId && !allowSubmit ? (
              <div className="mt-6 space-y-3 border-t border-slate-100 pt-6">
                <Button asChild className="w-full rounded-xl bg-sky-600 py-6 text-base font-semibold text-white shadow-lg hover:bg-sky-700">
                  <Link to={guestLoginHref}>Log in to book this time</Link>
                </Button>
                <p className="text-center text-xs text-slate-500">We&apos;ll bring you back here after sign-in.</p>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}

function SummaryCell({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={cn('mt-1 text-sm font-medium leading-snug text-[#0f172a]', muted && 'text-slate-400')}>{value}</p>
    </div>
  );
}

function TimeBucket({
  label,
  slots,
  selectedId,
  onSelect,
}: {
  label: string;
  slots: ParsedSlot[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      {slots.length === 0 ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex h-10 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 text-sm text-slate-300"
            >
              —
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {slots.map((s) => {
            const sel = s.id === selectedId;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelect(s.id)}
                className={cn(
                  'min-w-[4.25rem] rounded-lg px-3 py-2.5 text-sm font-semibold tabular-nums transition-all',
                  sel
                    ? 'bg-sky-600 text-white shadow-md ring-2 ring-sky-600 ring-offset-2'
                    : 'border border-sky-200 bg-sky-50 text-sky-900 hover:border-sky-400 hover:bg-sky-100',
                )}
              >
                {format(s.start, 'HH:mm')}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
