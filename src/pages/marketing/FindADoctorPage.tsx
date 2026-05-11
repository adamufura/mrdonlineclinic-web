import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import { Loader2, MapPin, Star } from 'lucide-react';
import { FindDoctorSearchBar, type FindDoctorDraft } from '@/components/marketing/FindDoctorSearchBar';
import { Button } from '@/components/ui/button';
import {
  listPractitionersDirectory,
  type DirectorySort,
  type PractitionerDirectoryItem,
} from '@/features/practitioners/public-api';
import { listPublicSpecialties } from '@/features/specialties/api';
import { ROUTES } from '@/router/routes';

function parseSort(v: string | null): DirectorySort {
  if (v === 'experience' || v === 'createdAt' || v === 'rating') return v;
  return 'rating';
}

function readDraftFromParams(sp: URLSearchParams): FindDoctorDraft {
  return {
    search: sp.get('search') ?? '',
    location: sp.get('location') ?? '',
    date: sp.get('date') ?? '',
    specialtyId: sp.get('specialtyId') ?? '',
    sort: parseSort(sp.get('sort')),
  };
}

function formatPracticeLocation(p: PractitionerDirectoryItem): string | null {
  const loc = p.practiceLocation;
  if (!loc) return null;
  const parts = [loc.city, loc.state, loc.country].filter(Boolean);
  return parts.length ? parts.join(', ') : null;
}

export default function FindADoctorPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [draft, setDraft] = useState<FindDoctorDraft>(() => readDraftFromParams(searchParams));

  useEffect(() => {
    setDraft(readDraftFromParams(searchParams));
  }, [searchParams]);

  const page = Number(searchParams.get('page') ?? '1') || 1;
  const specialtyId = searchParams.get('specialtyId') ?? undefined;
  const search = searchParams.get('search') ?? undefined;
  const location = searchParams.get('location') ?? undefined;
  const date = searchParams.get('date') ?? undefined;
  const sort = parseSort(searchParams.get('sort'));

  const specialtiesQuery = useQuery({
    queryKey: ['specialties', 'public'],
    queryFn: listPublicSpecialties,
  });

  const directoryParams = useMemo(
    () => ({
      page,
      limit: 12,
      specialtyId: specialtyId && /^[a-fA-F0-9]{24}$/.test(specialtyId) ? specialtyId : undefined,
      search: search?.trim() || undefined,
      location: location?.trim() || undefined,
      date: date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined,
      sort,
    }),
    [page, specialtyId, search, location, date, sort],
  );

  const directory = useQuery({
    queryKey: ['practitioners', 'directory', directoryParams],
    queryFn: () => listPractitionersDirectory(directoryParams),
  });

  function applyFilters() {
    const next = new URLSearchParams();
    if (draft.search.trim()) next.set('search', draft.search.trim());
    if (draft.location.trim()) next.set('location', draft.location.trim());
    if (draft.date && /^\d{4}-\d{2}-\d{2}$/.test(draft.date)) next.set('date', draft.date);
    if (draft.specialtyId && /^[a-fA-F0-9]{24}$/.test(draft.specialtyId)) next.set('specialtyId', draft.specialtyId);
    if (draft.sort !== 'rating') next.set('sort', draft.sort);
    setSearchParams(next, { replace: true });
  }

  function updatePage(newPage: number) {
    const next = new URLSearchParams(searchParams);
    if (newPage <= 1) next.delete('page');
    else next.set('page', String(newPage));
    setSearchParams(next, { replace: true });
  }

  return (
    <>
      <Helmet>
        <title>Find a doctor — MRD Online Clinic</title>
      </Helmet>
      <div className="mx-auto w-full max-w-site px-4 py-10 text-brand-navy sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-700">Practitioners</p>
          <h1 className="mt-1 font-display text-[clamp(1.85rem,4vw,2.5rem)] font-normal leading-tight tracking-[-0.02em]">
            Find a <em className="text-sky-700 not-italic">doctor</em>
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-brand-body">
            Search by name, narrow by location or specialty, and optionally pick a day to see who has open visit slots.
          </p>
        </div>

        <div className="mt-8 max-w-6xl">
          <FindDoctorSearchBar
            draft={draft}
            onDraftChange={(partial) => setDraft((d) => ({ ...d, ...partial }))}
            onApply={applyFilters}
            specialties={specialtiesQuery.data}
            specialtiesLoading={specialtiesQuery.isLoading}
            isApplying={Boolean(directory.data) && directory.isFetching}
          />
        </div>

        {directory.isLoading ? (
          <div className="mt-14 flex flex-col items-center justify-center gap-3 text-brand-body">
            <Loader2 className="size-9 animate-spin text-sky-600" aria-hidden />
            <p className="text-sm">Loading practitioners…</p>
          </div>
        ) : null}

        {directory.isError ? (
          <p className="mt-14 text-center text-sm text-red-600">Could not load practitioners. Check that the API is running.</p>
        ) : null}

        {directory.data ? (
          <>
            <p className="mt-8 text-sm text-brand-body">
              Page {directory.data.meta.page} of {directory.data.meta.totalPages} · {directory.data.meta.total}{' '}
              {directory.data.meta.total === 1 ? 'practitioner' : 'practitioners'}
            </p>

            {directory.data.items.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-[#eef1f6] bg-white px-6 py-14 text-center shadow-sm">
                <p className="font-medium text-brand-navy">No practitioners match your filters</p>
                <p className="mt-2 text-sm text-brand-body">
                  Try widening your search, clearing the date filter, or choosing a different specialty.
                </p>
              </div>
            ) : (
              <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {directory.data.items.map((p: PractitionerDirectoryItem) => {
                  const id = String(p._id);
                  const name = `${p.firstName} ${p.lastName}`;
                  const rating = typeof p.averageRating === 'number' ? p.averageRating.toFixed(1) : '—';
                  const locLine = formatPracticeLocation(p);
                  return (
                    <li
                      key={id}
                      className="flex flex-col rounded-2xl border border-[#eef1f6] bg-white p-5 shadow-[0_8px_28px_-16px_rgba(14,22,61,0.2)] ring-1 ring-black/[0.03] transition hover:shadow-[0_14px_36px_-18px_rgba(14,22,61,0.22)]"
                    >
                      <div className="flex gap-3">
                        {p.profilePhotoUrl ? (
                          <img src={p.profilePhotoUrl} alt="" className="size-14 shrink-0 rounded-full object-cover ring-2 ring-sky-100" />
                        ) : (
                          <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-50 to-sky-100 text-sm font-semibold text-sky-900 ring-2 ring-sky-100">
                            {p.firstName[0]}
                            {p.lastName[0]}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-brand-navy">{name}</p>
                          <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-brand-body">
                            <Star className="size-3.5 shrink-0 fill-amber-400 text-amber-400" aria-hidden />
                            <span className="font-medium text-brand-navy">{rating}</span>
                            <span className="text-brand-body/80">({p.totalReviews ?? 0})</span>
                            <span aria-hidden>·</span>
                            <span>{p.yearsOfExperience ?? '—'} yrs exp</span>
                          </p>
                          {p.specialties?.length ? (
                            <p className="mt-1.5 truncate text-xs text-brand-body">{p.specialties.map((s) => s.name).join(', ')}</p>
                          ) : null}
                          {locLine ? (
                            <p className="mt-1 flex items-start gap-1 text-xs text-brand-body">
                              <MapPin className="mt-0.5 size-3 shrink-0 text-sky-600" aria-hidden />
                              <span className="line-clamp-2">{locLine}</span>
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <Button
                        asChild
                        className="mt-5 w-full rounded-xl border border-slate-200 bg-white text-[13px] font-semibold text-brand-navy shadow-sm hover:bg-slate-50"
                        variant="outline"
                        size="sm"
                      >
                        <Link to={ROUTES.findDoctorProfile(id)}>View profile</Link>
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}

            {directory.data.items.length > 0 ? (
              <div className="mt-10 flex justify-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl border-slate-200 bg-white"
                  disabled={page <= 1}
                  onClick={() => updatePage(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl border-slate-200 bg-white"
                  disabled={page >= (directory.data.meta.totalPages ?? 1)}
                  onClick={() => updatePage(page + 1)}
                >
                  Next
                </Button>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </>
  );
}
