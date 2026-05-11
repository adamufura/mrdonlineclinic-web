import { useQuery } from '@tanstack/react-query';
import { addDays, format, isValid } from 'date-fns';
import { Helmet } from 'react-helmet-async';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Languages,
  MapPin,
  Sparkles,
  Star,
  Stethoscope,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { getPractitionerPublicProfile, getPractitionerPublicSlots } from '@/features/practitioners/public-api';
import { cn } from '@/lib/utils/cn';
import { ROUTES } from '@/router/routes';
import { useAuthStore } from '@/stores/auth-store';

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

function formatLocation(pr: Record<string, unknown>): string | null {
  const loc = pr.practiceLocation;
  if (!isRecord(loc)) return null;
  const parts = [loc.city, loc.state, loc.country].filter((x) => typeof x === 'string' && String(x).trim());
  return parts.length ? parts.map(String).join(', ') : null;
}

function languagesList(pr: Record<string, unknown>): string[] {
  const raw = pr.consultationLanguages;
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === 'string' && x.trim().length > 0);
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

function groupSlotStarts(slots: unknown[]): Map<string, Date[]> {
  const map = new Map<string, Date[]>();
  for (const slot of slots) {
    if (!isRecord(slot) || !slot.startTime) continue;
    const start = new Date(String(slot.startTime));
    if (!isValid(start)) continue;
    const key = format(start, 'yyyy-MM-dd');
    const list = map.get(key) ?? [];
    list.push(start);
    map.set(key, list);
  }
  for (const [, list] of map) {
    list.sort((a, b) => a.getTime() - b.getTime());
  }
  return map;
}

export default function PractitionerPublicProfilePage() {
  const { practitionerId } = useParams();
  const user = useAuthStore((s) => s.user);
  const id = practitionerId && /^[a-fA-F0-9]{24}$/.test(practitionerId) ? practitionerId : '';

  const profile = useQuery({
    queryKey: ['practitioners', 'public', id],
    queryFn: () => getPractitionerPublicProfile(id),
    enabled: Boolean(id),
  });

  const from = new Date();
  const to = addDays(from, 7);
  const slots = useQuery({
    queryKey: ['practitioners', 'public', id, 'slots', from.toISOString(), to.toISOString()],
    queryFn: () => getPractitionerPublicSlots(id, from, to),
    enabled: Boolean(id) && profile.isSuccess,
  });

  const pr = profile.data?.practitioner;
  const name = isRecord(pr)
    ? `${String(pr.firstName ?? '')} ${String(pr.lastName ?? '')}`.trim()
    : '';
  const bookReturn = id ? `${ROUTES.patient.book(id)}` : ROUTES.patient.dashboard;
  const loginHref = `${ROUTES.login}?${new URLSearchParams({ returnUrl: bookReturn }).toString()}`;

  const rating = isRecord(pr) && typeof pr.averageRating === 'number' ? pr.averageRating : null;
  const reviewCount = isRecord(pr) ? Number(pr.totalReviews ?? 0) : 0;
  const yearsExp = isRecord(pr) ? pr.yearsOfExperience : null;
  const isVerified = isRecord(pr) && pr.verificationStatus === 'VERIFIED';

  return (
    <>
      <Helmet>
        <title>{name ? `${name} — MRD Online Clinic` : 'Practitioner — MRD Online Clinic'}</title>
      </Helmet>
      <div className="mx-auto w-full max-w-site px-4 py-8 text-brand-navy sm:px-6 sm:py-10 lg:px-8">
        <div className="mx-auto max-w-3xl lg:max-w-4xl">
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
              <div className="h-40 animate-pulse rounded-3xl bg-slate-200/60" />
              <div className="h-32 animate-pulse rounded-2xl bg-slate-200/50" />
              <div className="h-48 animate-pulse rounded-2xl bg-slate-200/40" />
            </div>
          ) : null}

          {profile.isError ? (
            <p className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              This practitioner is not available or the link is invalid.
            </p>
          ) : null}

          {isRecord(pr) ? (
            <div className="mt-8 space-y-8">
              {/* Hero card */}
              <section className="overflow-hidden rounded-3xl border border-[#e8eef2] bg-gradient-to-br from-white via-sky-50/40 to-[#f0f7fc] p-6 shadow-[0_20px_50px_-28px_rgba(14,22,61,0.25)] ring-1 ring-black/[0.04] sm:p-8">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                  {typeof pr.profilePhotoUrl === 'string' ? (
                    <img
                      src={pr.profilePhotoUrl}
                      alt=""
                      className="size-28 shrink-0 rounded-2xl object-cover shadow-md ring-4 ring-white sm:size-32"
                    />
                  ) : (
                    <div className="flex size-28 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 to-sky-200/90 text-2xl font-semibold tracking-tight text-sky-950 shadow-inner ring-4 ring-white sm:size-32">
                      {String(pr.firstName ?? '?')[0]}
                      {String(pr.lastName ?? '?')[0]}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-700">Practitioner</p>
                      {isVerified ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-800 ring-1 ring-emerald-500/25">
                          <Sparkles className="size-3" aria-hidden />
                          Verified
                        </span>
                      ) : null}
                    </div>
                    <h1 className="mt-1 font-display text-[clamp(1.75rem,4.5vw,2.5rem)] font-normal leading-tight tracking-[-0.02em]">
                      {name}
                    </h1>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-brand-body">
                      <span className="inline-flex items-center gap-2">
                        {rating != null ? <StarRow value={rating} /> : null}
                        <span className="font-medium text-brand-navy">
                          {rating != null ? rating.toFixed(1) : '—'}
                        </span>
                        <span className="text-brand-body/90">
                          ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
                        </span>
                      </span>
                      <span className="hidden text-brand-body/40 sm:inline" aria-hidden>
                        ·
                      </span>
                      <span>{yearsExp != null ? `${yearsExp} years experience` : 'Experience on request'}</span>
                    </div>

                    {specialtyNames(pr).length ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {specialtyNames(pr).map((label) => (
                          <span
                            key={label}
                            className="inline-flex items-center gap-1.5 rounded-full border border-sky-200/80 bg-white/90 px-3 py-1 text-xs font-semibold text-sky-900 shadow-sm"
                          >
                            <Stethoscope className="size-3.5 text-sky-600" aria-hidden />
                            {label}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {formatLocation(pr) ? (
                      <p className="mt-3 flex items-start gap-2 text-sm text-brand-body">
                        <MapPin className="mt-0.5 size-4 shrink-0 text-sky-600" aria-hidden />
                        {formatLocation(pr)}
                      </p>
                    ) : null}

                    {languagesList(pr).length ? (
                      <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-brand-body">
                        <Languages className="size-4 shrink-0 text-sky-600" aria-hidden />
                        <span>{languagesList(pr).join(' · ')}</span>
                      </p>
                    ) : null}
                  </div>
                </div>

                {typeof pr.bio === 'string' && pr.bio.trim() ? (
                  <div className="mt-6 border-t border-sky-200/40 pt-6">
                    <p className="text-[15px] leading-relaxed text-brand-body sm:text-[0.95rem] sm:leading-relaxed">
                      {pr.bio}
                    </p>
                  </div>
                ) : null}
              </section>

              {/* Open slots */}
              <section className="rounded-2xl border border-[#eef1f6] bg-white p-6 shadow-[0_12px_40px_-22px_rgba(14,22,61,0.18)] sm:p-8">
                <div className="flex items-start gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-50 to-sky-100 text-sky-700 shadow-sm ring-1 ring-sky-200/60">
                    <Calendar className="size-5" strokeWidth={2} aria-hidden />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-medium tracking-tight text-brand-navy">Open visit times</h2>
                    <p className="mt-1 text-sm text-brand-body">Next 7 days — pick a time when you book.</p>
                  </div>
                </div>

                {slots.isLoading ? (
                  <div className="mt-6 space-y-3">
                    {[1, 2, 3].map((k) => (
                      <div key={k} className="h-14 animate-pulse rounded-xl bg-slate-100" />
                    ))}
                  </div>
                ) : null}
                {slots.isError ? (
                  <p className="mt-6 text-sm text-red-600">We couldn&apos;t load availability. Try again later.</p>
                ) : null}

                {Array.isArray(slots.data) && slots.data.length > 0 ? (
                  <div className="mt-6 space-y-6">
                    {Array.from(groupSlotStarts(slots.data).entries())
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([dayKey, starts]) => {
                        const first = starts[0];
                        if (!first) return null;
                        return (
                          <div key={dayKey}>
                            <p className="text-xs font-semibold uppercase tracking-wide text-brand-body">
                              {format(first, 'EEEE, MMMM d')}
                            </p>
                            <ul className="mt-2 flex flex-wrap gap-2">
                              {starts.map((start) => (
                                <li
                                  key={start.toISOString()}
                                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-slate-50/90 px-3.5 py-2 text-sm font-medium text-brand-navy shadow-sm"
                                >
                                  <Clock className="size-3.5 text-sky-600" aria-hidden />
                                  {format(start, 'h:mm a')}
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                  </div>
                ) : slots.isSuccess ? (
                  <p className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center text-sm text-brand-body">
                    No open slots in the next week. Check back soon or explore other practitioners.
                  </p>
                ) : null}
              </section>

              {/* Reviews */}
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

              {/* CTA */}
              <div className="flex flex-col gap-3 rounded-2xl border border-sky-200/60 bg-gradient-to-r from-sky-50/90 to-cyan-50/50 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
                <div>
                  <p className="font-display text-lg font-medium text-brand-navy">Ready to book?</p>
                  <p className="mt-1 text-sm text-brand-body">Sign in as a patient to choose a slot and confirm your visit.</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-3">
                  {user?.role === 'PATIENT' ? (
                    <Button
                      asChild
                      size="lg"
                      className="rounded-full border-0 bg-gradient-search-pill px-8 font-semibold text-white shadow-md hover:brightness-[1.05]"
                    >
                      <Link to={ROUTES.patient.book(id)}>Book appointment</Link>
                    </Button>
                  ) : (
                    <Button
                      asChild
                      size="lg"
                      className="rounded-full border-0 bg-gradient-search-pill px-8 font-semibold text-white shadow-md hover:brightness-[1.05]"
                    >
                      <Link to={loginHref}>Log in to book</Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
