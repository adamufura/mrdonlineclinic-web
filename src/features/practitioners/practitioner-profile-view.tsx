import { useQuery } from '@tanstack/react-query';
import { addDays, startOfDay } from 'date-fns';
import { ArrowLeft, Star } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { PractitionerBookingWidget } from '@/features/booking/practitioner-booking-widget';
import { getPractitionerPublicProfile, getPractitionerPublicSlots } from '@/features/practitioners/public-api';
import { ROUTES } from '@/router/routes';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils/cn';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function StarRow({ value, size = 'md' }: { value: number; size?: 'sm' | 'md' }) {
  const full = Math.round(Math.min(5, Math.max(0, value)));
  const iconClass = size === 'sm' ? 'size-3.5' : 'size-4';
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(iconClass, i < full ? 'fill-amber-400 text-amber-400' : 'fill-slate-200/90 text-slate-200')}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}

type PractitionerProfileViewProps = {
  practitionerId: string;
  backTo: string;
  backLabel?: string;
  /** Patient portal: always allow booking. Public: only when logged in as patient. */
  portalMode?: boolean;
};

export function PractitionerProfileView({
  practitionerId,
  backTo,
  backLabel,
  portalMode = false,
}: PractitionerProfileViewProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const resolvedBackLabel = backLabel ?? t('patient.practitionerProfile.backToFindDoctor');
  const user = useAuthStore((s) => s.user);
  const id = practitionerId && /^[a-fA-F0-9]{24}$/.test(practitionerId) ? practitionerId : '';

  const profile = useQuery({
    queryKey: ['practitioners', 'public', id],
    queryFn: () => getPractitionerPublicProfile(id),
    enabled: Boolean(id),
  });

  const from = useMemo(() => startOfDay(new Date()), []);
  const to = addDays(from, 90);
  const slots = useQuery({
    queryKey: ['practitioners', 'public', id, 'slots', from.toISOString(), to.toISOString()],
    queryFn: () => getPractitionerPublicSlots(id, from, to),
    enabled: Boolean(id) && profile.isSuccess,
  });

  const pr = profile.data?.practitioner;
  const isPatient = portalMode || user?.role === 'PATIENT';

  return (
    <div className={portalMode ? 'mx-auto max-w-4xl' : 'mx-auto max-w-4xl'}>
      <Link
        to={backTo}
        className="inline-flex items-center gap-2 text-sm font-semibold text-sky-800 transition hover:text-[#0a1628]"
      >
        <ArrowLeft className="size-4 shrink-0" aria-hidden />
        {resolvedBackLabel}
      </Link>

      {!id ? <p className="mt-8 text-sm text-red-600">{t('patient.practitionerProfile.invalidId')}</p> : null}

      {profile.isLoading ? (
        <div className="mt-8 space-y-4">
          <div className="h-72 animate-pulse rounded-2xl bg-slate-200/60" />
          <div className="h-40 animate-pulse rounded-2xl bg-slate-200/50" />
        </div>
      ) : null}

      {profile.isError ? (
        <p className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {t('patient.practitionerProfile.notAvailable')}
        </p>
      ) : null}

      {isRecord(pr) ? (
        <div className="mt-8 space-y-10">
          <PractitionerBookingWidget
            practitionerId={id}
            practitioner={pr}
            slots={Array.isArray(slots.data) ? slots.data : []}
            slotsLoading={slots.isLoading}
            slotsError={slots.isError}
            allowSubmit={isPatient}
            loginPath={ROUTES.login}
            onBooked={(appointmentId) => void navigate(ROUTES.patient.appointment(appointmentId))}
          />

          {typeof pr.bio === 'string' && pr.bio.trim() ? (
            <section className="rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-sm sm:p-8">
              <h2 className="font-display text-xl font-medium tracking-tight text-[#0a1628]">{t('patient.practitionerProfile.about')}</h2>
              <p className="mt-4 text-[15px] leading-relaxed text-[#64748b] sm:text-[0.95rem] sm:leading-relaxed">{pr.bio}</p>
            </section>
          ) : null}

          <section className="rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-[0_12px_40px_-22px_rgba(14,22,61,0.18)] sm:p-8">
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 text-amber-700 shadow-sm ring-1 ring-amber-200/50">
                <Star className="size-5 fill-amber-400/30 text-amber-600" strokeWidth={2} aria-hidden />
              </div>
              <div>
                <h2 className="font-display text-xl font-medium tracking-tight text-[#0a1628]">
                  {t('patient.practitionerProfile.patientReviews')}
                </h2>
                <p className="mt-1 text-sm text-[#64748b]">{t('patient.practitionerProfile.reviewsHint')}</p>
              </div>
            </div>

            {(profile.data?.reviews ?? []).length === 0 ? (
              <p className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center text-sm text-[#64748b]">
                {t('patient.practitionerProfile.noReviews')}
              </p>
            ) : (
              <ul className="mt-6 space-y-4">
                {(profile.data?.reviews ?? []).map((rev: unknown, i: number) => {
                  if (!isRecord(rev)) return null;
                  const patient = isRecord(rev.patient) ? rev.patient : null;
                  const who = patient
                    ? `${String(patient.firstName ?? '')} ${String(patient.lastName ?? '').slice(0, 1)}.`
                    : t('patient.practitionerProfile.patient');
                  const r = typeof rev.rating === 'number' ? rev.rating : Number(rev.rating);
                  const stars = Number.isFinite(r) ? r : 0;
                  const initial = who.trim().charAt(0).toUpperCase() || 'P';
                  return (
                    <li
                      key={String(rev._id ?? i)}
                      className="rounded-2xl border border-[#e8ecf2] bg-[#fafbfd] p-5 shadow-sm ring-1 ring-black/[0.02]"
                    >
                      <div className="flex gap-3">
                        <div
                          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-sky-800 shadow-sm ring-1 ring-slate-200/80"
                          aria-hidden
                        >
                          {initial}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-semibold text-[#0a1628]">{who}</p>
                            <span className="inline-flex items-center gap-1.5 text-sm text-[#0a1628]">
                              <StarRow value={stars} size="sm" />
                              <span className="font-medium tabular-nums">{Number.isFinite(r) ? r : '—'}</span>
                            </span>
                          </div>
                          {typeof rev.comment === 'string' && rev.comment.trim() ? (
                            <p className="mt-3 text-[15px] leading-relaxed text-[#64748b]">{rev.comment}</p>
                          ) : (
                            <p className="mt-2 text-sm italic text-[#64748b]/80">{t('patient.practitionerProfile.noComment')}</p>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
