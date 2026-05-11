import { useQuery } from '@tanstack/react-query';
import { addDays, startOfDay } from 'date-fns';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Star } from 'lucide-react';
import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
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

export default function PractitionerPublicProfilePage() {
  const navigate = useNavigate();
  const { practitionerId } = useParams();
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
  const name = isRecord(pr)
    ? `${String(pr.firstName ?? '')} ${String(pr.lastName ?? '')}`.trim()
    : '';
  const isPatient = user?.role === 'PATIENT';

  return (
    <>
      <Helmet>
        <title>{name ? `${name} — MRD Online Clinic` : 'Practitioner — MRD Online Clinic'}</title>
      </Helmet>
      <div className="mx-auto w-full max-w-site px-4 py-8 text-brand-navy sm:px-6 sm:py-10 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Link
            to={ROUTES.findDoctor}
            className="inline-flex items-center gap-2 text-sm font-semibold text-sky-800 transition hover:text-brand-navy"
          >
            <ArrowLeft className="size-4 shrink-0" aria-hidden />
            Back to find a doctor
          </Link>

          {!id ? <p className="mt-8 text-sm text-red-600">Invalid practitioner id.</p> : null}

          {profile.isLoading ? (
            <div className="mt-8 space-y-4">
              <div className="h-72 animate-pulse rounded-2xl bg-slate-200/60" />
              <div className="h-40 animate-pulse rounded-2xl bg-slate-200/50" />
            </div>
          ) : null}

          {profile.isError ? (
            <p className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              This practitioner is not available or the link is invalid.
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
                <section className="rounded-2xl border border-[#eef1f6] bg-white p-6 shadow-sm sm:p-8">
                  <h2 className="font-display text-xl font-medium tracking-tight text-brand-navy">About</h2>
                  <p className="mt-4 text-[15px] leading-relaxed text-brand-body sm:text-[0.95rem] sm:leading-relaxed">
                    {pr.bio}
                  </p>
                </section>
              ) : null}

              <section className="rounded-2xl border border-[#eef1f6] bg-white p-6 shadow-[0_12px_40px_-22px_rgba(14,22,61,0.18)] sm:p-8">
                <div className="flex items-start gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 text-amber-700 shadow-sm ring-1 ring-amber-200/50">
                    <Star className="size-5 fill-amber-400/30 text-amber-600" strokeWidth={2} aria-hidden />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-medium tracking-tight text-brand-navy">Patient reviews</h2>
                    <p className="mt-1 text-sm text-brand-body">Recent feedback from completed visits.</p>
                  </div>
                </div>

                {(profile.data?.reviews ?? []).length === 0 ? (
                  <p className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center text-sm text-brand-body">
                    No reviews yet.
                  </p>
                ) : (
                  <ul className="mt-6 space-y-4">
                    {(profile.data?.reviews ?? []).map((rev: unknown, i: number) => {
                      if (!isRecord(rev)) return null;
                      const patient = isRecord(rev.patient) ? rev.patient : null;
                      const who = patient
                        ? `${String(patient.firstName ?? '')} ${String(patient.lastName ?? '').slice(0, 1)}.`
                        : 'Patient';
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
                                <p className="font-semibold text-brand-navy">{who}</p>
                                <span className="inline-flex items-center gap-1.5 text-sm text-brand-navy">
                                  <StarRow value={stars} size="sm" />
                                  <span className="font-medium tabular-nums">{Number.isFinite(r) ? r : '—'}</span>
                                </span>
                              </div>
                              {typeof rev.comment === 'string' && rev.comment.trim() ? (
                                <p className="mt-3 text-[15px] leading-relaxed text-brand-body">{rev.comment}</p>
                              ) : (
                                <p className="mt-2 text-sm italic text-brand-body/80">No written comment.</p>
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
      </div>
    </>
  );
}
