import { useQuery } from '@tanstack/react-query';
import { addDays, format } from 'date-fns';
import { Helmet } from 'react-helmet-async';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { getPractitionerPublicProfile, getPractitionerPublicSlots } from '@/features/practitioners/public-api';
import { ROUTES } from '@/router/routes';
import { useAuthStore } from '@/stores/auth-store';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
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

  return (
    <>
      <Helmet>
        <title>{name ? `${name} — MRD Online Clinic` : 'Practitioner — MRD Online Clinic'}</title>
      </Helmet>
      <div className="mx-auto w-full max-w-site px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
        {!id ? <p className="text-destructive">Invalid practitioner id.</p> : null}
        {profile.isLoading ? <p className="text-muted-foreground">Loading…</p> : null}
        {profile.isError ? <p className="text-destructive">Practitioner not found or not listed publicly.</p> : null}

        {isRecord(pr) ? (
          <>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              {typeof pr.profilePhotoUrl === 'string' ? (
                <img src={pr.profilePhotoUrl} alt="" className="size-28 rounded-2xl object-cover" />
              ) : (
                <div className="flex size-28 items-center justify-center rounded-2xl bg-muted text-2xl font-semibold text-muted-foreground">
                  {String(pr.firstName ?? '?')[0]}
                  {String(pr.lastName ?? '?')[0]}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h1 className="text-3xl font-semibold">{name}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  ★ {typeof pr.averageRating === 'number' ? pr.averageRating.toFixed(1) : '—'} ({String(pr.totalReviews ?? 0)}{' '}
                  reviews) · {String(pr.yearsOfExperience ?? '—')} years experience
                </p>
                {typeof pr.bio === 'string' && pr.bio ? <p className="mt-4 text-sm leading-relaxed">{pr.bio}</p> : null}
              </div>
            </div>

            <section className="mt-10">
              <h2 className="text-lg font-semibold">Open slots (next 7 days)</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                <code className="rounded bg-muted px-1">GET /api/v1/practitioners/:id/slots</code> — query{' '}
                <code className="rounded bg-muted px-1">from</code> and <code className="rounded bg-muted px-1">to</code> (ISO
                dates) are required.
              </p>
              {slots.isLoading ? <p className="mt-4 text-sm text-muted-foreground">Loading slots…</p> : null}
              {slots.isError ? <p className="mt-4 text-sm text-destructive">Could not load slots.</p> : null}
              {Array.isArray(slots.data) && slots.data.length ? (
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {slots.data.map((slot: unknown, i: number) => {
                    if (!isRecord(slot)) return null;
                    const start = slot.startTime ? new Date(String(slot.startTime)) : null;
                    return (
                      <li key={String(slot._id ?? i)} className="rounded-lg border border-border bg-white px-3 py-2 text-sm dark:bg-zinc-950">
                        {start ? format(start, 'EEE MMM d · h:mm a') : 'Slot'}
                      </li>
                    );
                  })}
                </ul>
              ) : slots.isSuccess ? (
                <p className="mt-4 text-sm text-muted-foreground">No open slots in this window.</p>
              ) : null}
            </section>

            <section className="mt-10">
              <h2 className="text-lg font-semibold">Recent reviews</h2>
              <p className="mt-1 text-xs text-muted-foreground">Bundled in the same response as the practitioner profile.</p>
              <ul className="mt-4 space-y-3">
                {(profile.data?.reviews ?? []).map((rev: unknown, i: number) => {
                  if (!isRecord(rev)) return null;
                  const patient = isRecord(rev.patient) ? rev.patient : null;
                  const who = patient
                    ? `${String(patient.firstName ?? '')} ${String(patient.lastName ?? '').slice(0, 1)}.`
                    : 'Patient';
                  return (
                    <li key={String(rev._id ?? i)} className="rounded-lg border border-border bg-white p-3 text-sm dark:bg-zinc-950">
                      <p className="font-medium">{who}</p>
                      <p className="text-muted-foreground">★ {String(rev.rating ?? '—')}</p>
                      {typeof rev.comment === 'string' && rev.comment ? <p className="mt-2">{rev.comment}</p> : null}
                    </li>
                  );
                })}
              </ul>
            </section>

            <div className="mt-10 flex flex-wrap gap-3">
              {user?.role === 'PATIENT' ? (
                <Button asChild size="lg">
                  <Link to={ROUTES.patient.book(id)}>Book appointment</Link>
                </Button>
              ) : (
                <Button asChild size="lg">
                  <Link to={loginHref}>Log in to book</Link>
                </Button>
              )}
            </div>
          </>
        ) : null}
        </div>
      </div>
    </>
  );
}
