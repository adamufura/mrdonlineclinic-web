import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { listPublicSpecialties, type SpecialtyDto } from '@/features/specialties/api';
import { ROUTES } from '@/router/routes';

export default function SpecialtiesPage() {
  const q = useQuery({ queryKey: ['specialties', 'public'], queryFn: listPublicSpecialties });

  return (
    <>
      <Helmet>
        <title>Specialties — MRD Online Clinic</title>
      </Helmet>
      <div className="mx-auto w-full max-w-site px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold">Specialties</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Active catalog from <code className="rounded bg-muted px-1">GET /api/v1/specialties</code>. Each card links to the
          directory filtered by <code className="rounded bg-muted px-1">specialtyId</code> (matches backend query on{' '}
          <code className="rounded bg-muted px-1">GET /api/v1/practitioners</code>).
        </p>
        {q.isLoading ? <p className="mt-8 text-muted-foreground">Loading…</p> : null}
        {q.isError ? <p className="mt-8 text-destructive">Failed to load specialties.</p> : null}
        {q.data ? (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {q.data.map((s: SpecialtyDto) => (
              <li key={s.id}>
                <Link
                  to={`${ROUTES.findDoctor}?specialtyId=${encodeURIComponent(s.id)}`}
                  className="block h-full rounded-xl border border-border bg-white p-5 shadow-sm transition hover:border-primary/40 dark:bg-zinc-950"
                >
                  <h2 className="font-semibold">{s.name}</h2>
                  {s.description ? <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{s.description}</p> : null}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </>
  );
}
