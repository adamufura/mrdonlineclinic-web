import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Loader2, Mail, Phone, Search, UserRound, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { listPractitionerPatients } from '@/features/practitioners/session-api';
import { cn } from '@/lib/utils/cn';
import { ROUTES } from '@/router/routes';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function displayName(p: Record<string, unknown>): string {
  return `${String(p.firstName ?? '')} ${String(p.lastName ?? '')}`.trim() || 'Patient';
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';
}

const AVATAR_TONES = [
  'from-sky-400 to-sky-700',
  'from-teal-300 to-teal-600',
  'from-violet-300 to-violet-600',
  'from-amber-300 to-amber-600',
  'from-rose-300 to-rose-500',
] as const;

export default function PractitionerPatientsPage() {
  const [q, setQ] = useState('');

  const patients = useQuery({
    queryKey: ['practitioners', 'me', 'patients'],
    queryFn: listPractitionerPatients,
  });

  const filtered = useMemo(() => {
    const raw = patients.data ?? [];
    const needle = q.trim().toLowerCase();
    if (!needle) return raw;
    return raw.filter((row) => {
      if (!isRecord(row)) return false;
      const name = displayName(row).toLowerCase();
      const email = typeof row.email === 'string' ? row.email.toLowerCase() : '';
      const phone = typeof row.phoneNumber === 'string' ? row.phoneNumber.toLowerCase() : '';
      return name.includes(needle) || email.includes(needle) || phone.includes(needle);
    });
  }, [patients.data, q]);

  return (
    <>
      <Helmet>
        <title>Patients — MRD Online Clinic</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-[#64748b]">
              <Users className="size-3.5 text-teal-600" aria-hidden />
              Practice
            </p>
            <h1 className="font-display text-3xl font-normal tracking-tight text-[#0a1628]">Patients</h1>
            <p className="mt-2 max-w-2xl text-sm text-[#64748b]">
              Everyone you&apos;ve seen or have on your schedule — one row per patient, sorted by most recent
              appointment.
            </p>
          </div>
          {patients.isSuccess ? (
            <p className="text-sm text-[#64748b]">
              <span className="font-semibold text-[#0a1628]">{patients.data?.length ?? 0}</span> patient
              {(patients.data?.length ?? 0) === 1 ? '' : 's'}
            </p>
          ) : null}
        </div>

        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
          <Input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, email, or phone…"
            className="h-10 border-[#e2e8f0] bg-white pl-9 pr-3 text-sm shadow-sm focus-visible:border-teal-500 focus-visible:ring-teal-500/20"
            aria-label="Filter patients"
          />
        </div>

        <section className="overflow-hidden rounded-[18px] border border-[#e2e8f0] bg-white shadow-sm">
          {patients.isLoading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-[#64748b]">
              <Loader2 className="size-5 animate-spin text-teal-600" aria-hidden />
              Loading patients…
            </div>
          ) : null}
          {patients.isError ? (
            <p className="p-8 text-sm text-destructive">Could not load your patient list. Try again shortly.</p>
          ) : null}

          {patients.isSuccess && filtered.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-[#f1f5f9] text-[#64748b]">
                <UserRound className="size-7" strokeWidth={1.5} />
              </div>
              <p className="font-display text-lg font-medium text-[#0a1628]">
                {q.trim() ? 'No matches' : 'No patients yet'}
              </p>
              <p className="mt-2 max-w-sm text-sm text-[#64748b]">
                {q.trim()
                  ? 'Try a different search term.'
                  : 'When patients book or you confirm visits, they will appear here automatically.'}
              </p>
              {!q.trim() ? (
                <Button asChild className="mt-6 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-sm hover:from-teal-600 hover:to-teal-800">
                  <Link to={ROUTES.practitioner.appointments}>View appointments</Link>
                </Button>
              ) : null}
            </div>
          ) : null}

          {patients.isSuccess && filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#e2e8f0] bg-[#fafbfc] text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                    <th className="px-4 py-3 font-medium sm:px-6">Patient</th>
                    <th className="hidden px-4 py-3 font-medium sm:table-cell sm:px-6">Email</th>
                    <th className="hidden px-4 py-3 font-medium md:table-cell sm:px-6">Phone</th>
                    <th className="px-4 py-3 font-medium sm:px-6">Last appointment</th>
                    <th className="px-4 py-3 text-right font-medium sm:px-6"> </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eef1f6]">
                  {filtered.map((raw, idx) => {
                    if (!isRecord(raw) || raw._id == null) return null;
                    const id = String(raw._id);
                    const name = displayName(raw);
                    const email = typeof raw.email === 'string' ? raw.email.trim() : '';
                    const phone = typeof raw.phoneNumber === 'string' ? raw.phoneNumber.trim() : '';
                    const lastRaw = raw.lastAppointmentAt;
                    const last =
                      lastRaw != null && (typeof lastRaw === 'string' || lastRaw instanceof Date)
                        ? new Date(String(lastRaw))
                        : null;
                    const tone = AVATAR_TONES[idx % AVATAR_TONES.length];

                    return (
                      <tr key={id} className="transition-colors hover:bg-[#f8fafc]/90">
                        <td className="px-4 py-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                'flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white shadow-sm',
                                tone,
                              )}
                            >
                              {initials(name)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-[#0a1628]">{name}</p>
                              <p className="mt-0.5 truncate text-xs text-[#64748b] sm:hidden">{email || '—'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="hidden px-4 py-4 sm:table-cell sm:px-6">
                          {email ? (
                            <a
                              href={`mailto:${email}`}
                              className="inline-flex items-center gap-1.5 text-teal-800 hover:underline"
                            >
                              <Mail className="size-3.5 shrink-0 text-[#94a3b8]" aria-hidden />
                              <span className="truncate">{email}</span>
                            </a>
                          ) : (
                            <span className="text-[#94a3b8]">—</span>
                          )}
                        </td>
                        <td className="hidden px-4 py-4 md:table-cell sm:px-6">
                          {phone ? (
                            <a href={`tel:${phone}`} className="inline-flex items-center gap-1.5 tabular-nums text-[#475569] hover:text-[#0a1628]">
                              <Phone className="size-3.5 shrink-0 text-[#94a3b8]" aria-hidden />
                              {phone}
                            </a>
                          ) : (
                            <span className="text-[#94a3b8]">—</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-[#475569] sm:px-6">
                          {last && !Number.isNaN(last.getTime()) ? (
                            <span className="tabular-nums">{format(last, 'MMM d, yyyy · h:mm a')}</span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-4 py-4 text-right sm:px-6">
                          <Button variant="ghost" size="sm" className="text-teal-800 hover:bg-teal-50" asChild>
                            <Link to={ROUTES.practitioner.messages}>Messages</Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      </div>
    </>
  );
}
