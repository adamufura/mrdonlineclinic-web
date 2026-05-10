import { useQuery } from '@tanstack/react-query';
import { useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  listPractitionersDirectory,
  type DirectorySort,
  type PractitionerDirectoryItem,
} from '@/features/practitioners/public-api';
import { ROUTES } from '@/router/routes';

export default function FindADoctorPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchRef = useRef<HTMLInputElement>(null);
  const specialtyId = searchParams.get('specialtyId') ?? undefined;
  const search = searchParams.get('search') ?? undefined;
  const sort = (searchParams.get('sort') as DirectorySort | null) ?? 'rating';
  const page = Number(searchParams.get('page') ?? '1') || 1;

  const directory = useQuery({
    queryKey: ['practitioners', 'directory', { page, specialtyId, search, sort }],
    queryFn: () =>
      listPractitionersDirectory({
        page,
        limit: 12,
        specialtyId: specialtyId && /^[a-fA-F0-9]{24}$/.test(specialtyId) ? specialtyId : undefined,
        search: search?.trim() || undefined,
        sort,
      }),
  });

  function updateParam(key: string, value: string | null) {
    const next = new URLSearchParams(searchParams);
    if (!value) next.delete(key);
    else next.set(key, value);
    if (key !== 'page') next.delete('page');
    setSearchParams(next, { replace: true });
  }

  return (
    <>
      <Helmet>
        <title>Find a doctor — MRD Online Clinic</title>
      </Helmet>
      <div className="mx-auto w-full max-w-site px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold">Find a doctor</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          <code className="rounded bg-muted px-1">GET /api/v1/practitioners</code> with{' '}
          <code className="rounded bg-muted px-1">page</code>, <code className="rounded bg-muted px-1">limit</code>,{' '}
          <code className="rounded bg-muted px-1">specialtyId</code>, <code className="rounded bg-muted px-1">search</code>,{' '}
          <code className="rounded bg-muted px-1">sort</code> (rating | experience | createdAt).
        </p>

        <div className="mt-8 flex flex-col gap-4 rounded-xl border border-border bg-white p-4 dark:bg-zinc-950 lg:flex-row lg:items-end">
          <div className="flex-1 space-y-2">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="search">
              Search by name
            </label>
            <Input
              ref={searchRef}
              id="search"
              key={search ?? 'empty'}
              defaultValue={search ?? ''}
              placeholder="e.g. Smith"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  updateParam('search', searchRef.current?.value.trim() || null);
                }
              }}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="sort">
              Sort
            </label>
            <select
              id="sort"
              className="flex h-10 w-full rounded-lg border border-border bg-white px-3 text-sm dark:bg-zinc-950 lg:w-48"
              value={sort}
              onChange={(e) => updateParam('sort', e.target.value)}
            >
              <option value="rating">Rating</option>
              <option value="experience">Experience</option>
              <option value="createdAt">Newest</option>
            </select>
          </div>
          <Button type="button" onClick={() => updateParam('search', searchRef.current?.value.trim() || null)}>
            Search
          </Button>
        </div>

        {directory.isLoading ? <p className="mt-10 text-muted-foreground">Loading directory…</p> : null}
        {directory.isError ? <p className="mt-10 text-destructive">Could not load practitioners.</p> : null}

        {directory.data ? (
          <>
            <p className="mt-6 text-sm text-muted-foreground">
              Page {directory.data.meta.page} of {directory.data.meta.totalPages} · {directory.data.meta.total} total
            </p>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {directory.data.items.map((p: PractitionerDirectoryItem) => {
                const id = String(p._id);
                const name = `${p.firstName} ${p.lastName}`;
                const rating = typeof p.averageRating === 'number' ? p.averageRating.toFixed(1) : '—';
                return (
                  <li key={id} className="rounded-xl border border-border bg-white p-4 shadow-sm dark:bg-zinc-950">
                    <div className="flex gap-3">
                      {p.profilePhotoUrl ? (
                        <img src={p.profilePhotoUrl} alt="" className="size-14 shrink-0 rounded-full object-cover" />
                      ) : (
                        <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
                          {p.firstName[0]}
                          {p.lastName[0]}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold">{name}</p>
                        <p className="text-xs text-muted-foreground">
                          ★ {rating} ({p.totalReviews ?? 0}) · {p.yearsOfExperience ?? '—'} yrs exp
                        </p>
                        {p.specialties?.length ? (
                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            {p.specialties.map((s) => s.name).join(', ')}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <Button asChild className="mt-4 w-full" variant="outline" size="sm">
                      <Link to={ROUTES.findDoctorProfile(id)}>View profile</Link>
                    </Button>
                  </li>
                );
              })}
            </ul>
            <div className="mt-8 flex justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={page <= 1}
                onClick={() => updateParam('page', String(page - 1))}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={page >= (directory.data.meta.totalPages ?? 1)}
                onClick={() => updateParam('page', String(page + 1))}
              >
                Next
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
