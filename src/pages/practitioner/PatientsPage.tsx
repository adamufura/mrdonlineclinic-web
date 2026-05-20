import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Loader2, Mail, Phone, Search, UserRound, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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

  const total = patients.data?.length ?? 0;

  return (
    <>
      <Helmet>
        <title>{t('practitioner.patients.title')}</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-[#64748b]">
              <Users className="size-3.5 text-teal-600" aria-hidden />
              {t('practitioner.patients.badge')}
            </p>
            <h1 className="font-display text-3xl font-normal tracking-tight text-[#0a1628]">
              {t('practitioner.patients.heading')}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[#64748b]">{t('practitioner.patients.description')}</p>
          </div>
          {patients.isSuccess ? (
            <p className="text-sm font-semibold text-[#0a1628]">
              {t('practitioner.patients.count', { count: total })}
            </p>
          ) : null}
        </div>

        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
          <Input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('practitioner.patients.searchPlaceholder')}
            className="h-10 border-[#e2e8f0] bg-white pl-9 pr-3 text-sm shadow-sm focus-visible:border-teal-500 focus-visible:ring-teal-500/20"
            aria-label={t('practitioner.patients.filterLabel')}
          />
        </div>

        <section className="overflow-hidden rounded-[18px] border border-[#e2e8f0] bg-white shadow-sm">
          {patients.isLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              {t('practitioner.patients.loading')}
            </div>
          ) : null}
          {patients.isError ? (
            <p className="py-12 text-center text-sm text-destructive">{t('practitioner.patients.couldNotLoad')}</p>
          ) : null}

          {patients.isSuccess && filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <UserRound className="size-10 text-[#94a3b8]" strokeWidth={1.5} />
              <p className="text-sm text-[#64748b]">
                {q.trim() ? t('practitioner.patients.empty') : t('practitioner.patients.noPatients')}
              </p>
            </div>
          ) : null}

          {filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#e2e8f0] bg-[#f8fafc] text-xs font-medium uppercase tracking-wide text-[#64748b]">
                    <th className="px-5 py-3">{t('practitioner.patients.colPatient')}</th>
                    <th className="px-5 py-3">{t('practitioner.patients.colEmail')}</th>
                    <th className="px-5 py-3">{t('practitioner.patients.colPhone')}</th>
                    <th className="px-5 py-3">{t('practitioner.patients.colLastAppt')}</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eef1f6]">
                  {filtered.map((raw, idx) => {
                    if (!isRecord(raw)) return null;
                    const name = displayName(raw);
                    const email = typeof raw.email === 'string' ? raw.email : '—';
                    const phone = typeof raw.phoneNumber === 'string' ? raw.phoneNumber : '—';
                    const lastAppt = raw.lastAppointmentAt
                      ? format(new Date(String(raw.lastAppointmentAt)), 'MMM d, yyyy · h:mm a')
                      : '—';
                    const roomId = typeof raw.chatRoomId === 'string' ? raw.chatRoomId : null;

                    return (
                      <tr key={String(raw._id ?? idx)} className="transition-colors hover:bg-[#f8fafc]">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-semibold text-white',
                                AVATAR_TONES[idx % AVATAR_TONES.length],
                              )}
                            >
                              {initials(name)}
                            </div>
                            <span className="font-medium text-[#0a1628]">{name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-[#475569]">
                          <span className="inline-flex items-center gap-1.5">
                            <Mail className="size-3.5 text-[#94a3b8]" />
                            {email}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-[#475569]">
                          <span className="inline-flex items-center gap-1.5">
                            <Phone className="size-3.5 text-[#94a3b8]" />
                            {phone}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-[#475569]">{lastAppt}</td>
                        <td className="px-5 py-4 text-right">
                          {roomId ? (
                            <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
                              <Link to={ROUTES.practitioner.messagesRoom(roomId)}>{t('common.messages')}</Link>
                            </Button>
                          ) : null}
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
