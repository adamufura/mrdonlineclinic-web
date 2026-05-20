import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Calendar, Check, ChevronRight, Loader2, X } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  practitionerConfirmAppointment,
  practitionerRejectAppointment,
} from '@/features/appointments/api';
import { listPractitionerAppointments } from '@/features/practitioners/session-api';
import { cn } from '@/lib/utils/cn';
import { ROUTES } from '@/router/routes';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function patientName(a: Record<string, unknown>): string {
  const patient = isRecord(a.patient) ? (a.patient as Record<string, unknown>) : null;
  return patient ? `${String(patient.firstName ?? '')} ${String(patient.lastName ?? '')}`.trim() || 'Patient' : 'Patient';
}

const STATUS_TABS = [
  { value: 'all', labelKey: 'practitioner.appointmentsList.tabAll', api: undefined as string | undefined },
  { value: 'PENDING', labelKey: 'practitioner.appointmentsList.tabPending', api: 'PENDING' },
  { value: 'CONFIRMED', labelKey: 'practitioner.appointmentsList.tabConfirmed', api: 'CONFIRMED' },
  { value: 'IN_PROGRESS', labelKey: 'practitioner.appointmentsList.tabInProgress', api: 'IN_PROGRESS' },
  { value: 'COMPLETED', labelKey: 'practitioner.appointmentsList.tabCompleted', api: 'COMPLETED' },
  { value: 'CANCELLED', labelKey: 'practitioner.appointmentsList.tabCancelled', api: 'CANCELLED' },
  { value: 'REJECTED', labelKey: 'practitioner.appointmentsList.tabDeclined', api: 'REJECTED' },
] as const;

function translatedStatus(status: string, t: (key: string) => string): string {
  switch (status) {
    case 'PENDING':
      return t('practitioner.appointment.statusPending');
    case 'CONFIRMED':
      return t('practitioner.appointment.statusConfirmed');
    case 'IN_PROGRESS':
      return t('practitioner.appointment.statusInProgress');
    case 'COMPLETED':
      return t('practitioner.appointment.statusCompleted');
    case 'CANCELLED':
      return t('practitioner.appointment.statusCancelled');
    case 'REJECTED':
      return t('practitioner.appointment.statusRejected');
    case 'NO_SHOW':
      return t('practitioner.appointment.statusNoShow');
    default:
      return status.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
  }
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'PENDING':
      return 'border-amber-200 bg-amber-50 text-amber-900';
    case 'CONFIRMED':
      return 'border-teal-200 bg-teal-50 text-teal-900';
    case 'IN_PROGRESS':
      return 'border-sky-200 bg-sky-50 text-sky-900';
    case 'COMPLETED':
      return 'border-slate-200 bg-slate-100 text-slate-800';
    case 'CANCELLED':
      return 'border-slate-200 bg-white text-slate-600';
    case 'REJECTED':
      return 'border-rose-200 bg-rose-50 text-rose-900';
    case 'NO_SHOW':
      return 'border-violet-200 bg-violet-50 text-violet-900';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-700';
  }
}

export default function PractitionerAppointmentsListPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') ?? 'all';
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);
  const [rejectId, setRejectId] = useState<string | null>(null);

  const apiStatus = useMemo(() => {
    const row = STATUS_TABS.find((t) => t.value === tab);
    return row?.api;
  }, [tab]);

  const listQuery = useQuery({
    queryKey: ['practitioners', 'me', 'appointments', 'list', { page, status: apiStatus ?? 'all' }],
    queryFn: () =>
      listPractitionerAppointments({
        page,
        limit: 25,
        status: apiStatus,
      }),
  });

  const setTab = useCallback(
    (next: string) => {
      const nextParams = new URLSearchParams(searchParams);
      if (next === 'all') nextParams.delete('tab');
      else nextParams.set('tab', next);
      nextParams.delete('page');
      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const setPage = useCallback(
    (nextPage: number) => {
      const nextParams = new URLSearchParams(searchParams);
      if (nextPage <= 1) nextParams.delete('page');
      else nextParams.set('page', String(nextPage));
      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const confirmMut = useMutation({
    mutationFn: practitionerConfirmAppointment,
    onSuccess: async () => {
      toast.success(t('practitioner.appointmentsList.confirmedToast'));
      await qc.invalidateQueries({ queryKey: ['practitioners', 'me', 'appointments'] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Could not confirm'),
  });

  const rejectMut = useMutation({
    mutationFn: practitionerRejectAppointment,
    onSuccess: async () => {
      toast.success(t('practitioner.appointmentsList.declinedToast'));
      setRejectId(null);
      await qc.invalidateQueries({ queryKey: ['practitioners', 'me', 'appointments'] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Could not decline'),
  });

  const items = listQuery.data?.items ?? [];
  const meta = listQuery.data?.meta;
  const totalPages = meta?.totalPages ?? 1;

  return (
    <>
      <Helmet>
        <title>{t('practitioner.appointments.title')}</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-[#64748b]">
              <Calendar className="size-3.5 text-teal-600" aria-hidden />
              {t('nav.practice')}
            </p>
            <h1 className="font-display text-3xl font-normal tracking-tight text-[#0a1628]">
              {t('practitioner.appointments.heading')}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[#64748b]">{t('practitioner.appointmentsList.reviewHint')}</p>
          </div>
          {listQuery.isSuccess && meta && tab === 'all' ? (
            <p className="text-sm font-semibold text-[#0a1628]">
              {t('practitioner.appointmentsList.total', { count: meta.total })}
            </p>
          ) : null}
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Tabs value={tab} onValueChange={setTab} className="w-full min-w-[640px]">
            <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
              {STATUS_TABS.map((tabRow) => (
                <TabsTrigger
                  key={tabRow.value}
                  value={tabRow.value}
                  className={cn(
                    'rounded-lg border border-transparent px-3 py-2 text-[13px] data-[state=active]:border-teal-200 data-[state=active]:bg-white data-[state=active]:text-[#0a1628] data-[state=active]:shadow-sm dark:data-[state=active]:bg-white dark:data-[state=active]:text-[#0a1628]',
                    'text-[#64748b] hover:text-[#0a1628]',
                  )}
                >
                  {t(tabRow.labelKey)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <section className="overflow-hidden rounded-[18px] border border-[#e2e8f0] bg-white shadow-sm">
          {listQuery.isLoading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-[#64748b]">
              <Loader2 className="size-5 animate-spin text-teal-600" aria-hidden />
              {t('practitioner.appointmentsList.loading')}
            </div>
          ) : null}
          {listQuery.isError ? (
            <p className="p-8 text-sm text-destructive">{t('practitioner.appointmentsList.couldNotLoad')}</p>
          ) : null}

          {listQuery.isSuccess && items.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="font-medium text-[#0a1628]">{t('practitioner.appointmentsList.emptyTitle')}</p>
              <p className="mt-2 text-sm text-[#64748b]">{t('practitioner.appointmentsList.emptyHint')}</p>
            </div>
          ) : null}

          {listQuery.isSuccess && items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#e2e8f0] bg-[#fafbfc] text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                    <th className="px-4 py-3 font-medium sm:px-6">{t('practitioner.appointmentsList.colWhen')}</th>
                    <th className="px-4 py-3 font-medium sm:px-6">{t('practitioner.appointmentsList.colPatient')}</th>
                    <th className="hidden px-4 py-3 font-medium md:table-cell sm:px-6">
                      {t('practitioner.appointmentsList.colReason')}
                    </th>
                    <th className="px-4 py-3 font-medium sm:px-6">{t('practitioner.appointmentsList.colStatus')}</th>
                    <th className="px-4 py-3 text-right font-medium sm:px-6">{t('practitioner.appointmentsList.colActions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eef1f6]">
                  {items.map((raw) => {
                    if (!isRecord(raw) || raw._id == null) return null;
                    const id = String(raw._id);
                    const status = String(raw.status ?? '');
                    const st = raw.scheduledStart ? new Date(String(raw.scheduledStart)) : null;
                    const reason =
                      typeof raw.reasonForVisit === 'string' && raw.reasonForVisit.trim()
                        ? raw.reasonForVisit.trim()
                        : '—';
                    const pending = status === 'PENDING';

                    return (
                      <tr key={id} className="transition-colors hover:bg-[#f8fafc]/80">
                        <td className="whitespace-nowrap px-4 py-4 tabular-nums text-[#0a1628] sm:px-6">
                          {st ? (
                            <>
                              <span className="font-medium">{format(st, 'EEE, MMM d')}</span>
                              <span className="mt-0.5 block text-xs text-[#64748b]">{format(st, 'h:mm a')}</span>
                            </>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-4 py-4 font-medium text-[#0a1628] sm:px-6">{patientName(raw)}</td>
                        <td className="hidden max-w-[240px] truncate px-4 py-4 text-[#64748b] md:table-cell sm:px-6">
                          {reason}
                        </td>
                        <td className="px-4 py-4 sm:px-6">
                          <span
                            className={cn(
                              'inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize',
                              statusBadgeClass(status),
                            )}
                          >
                            {translatedStatus(status, t)}
                          </span>
                        </td>
                        <td className="px-4 py-4 sm:px-6">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            {pending ? (
                              <>
                                <Button
                                  type="button"
                                  size="sm"
                                  disabled={confirmMut.isPending || rejectMut.isPending}
                                  className="h-8 gap-1 rounded-lg bg-gradient-to-br from-teal-500 to-teal-700 px-2.5 text-white shadow-sm hover:from-teal-600 hover:to-teal-800"
                                  onClick={() => confirmMut.mutate(id)}
                                >
                                  {confirmMut.isPending ? (
                                    <Loader2 className="size-3.5 animate-spin" />
                                  ) : (
                                    <Check className="size-3.5" strokeWidth={2.5} />
                                  )}
                                  {t('practitioner.appointmentsList.approve')}
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  disabled={confirmMut.isPending || rejectMut.isPending}
                                  className="h-8 gap-1 rounded-lg border-[#e2e8f0] text-[#64748b] hover:bg-rose-50 hover:text-rose-700"
                                  onClick={() => setRejectId(id)}
                                >
                                  <X className="size-3.5" strokeWidth={2.5} />
                                  {t('practitioner.appointmentsList.decline')}
                                </Button>
                              </>
                            ) : null}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 gap-1 px-2 text-teal-800 hover:bg-teal-50"
                              asChild
                            >
                              <Link to={ROUTES.practitioner.appointment(id)}>
                                {t('practitioner.appointmentsList.open')}
                                <ChevronRight className="size-3.5" />
                              </Link>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}

          {listQuery.isSuccess && meta && totalPages > 1 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e2e8f0] bg-[#fafbfc] px-4 py-3 sm:px-6">
              <p className="text-xs text-[#64748b]">
                {t('practitioner.appointmentsList.pageOf', { page: meta.page, total: totalPages })}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-lg border-[#e2e8f0]"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  {t('practitioner.appointmentsList.pagePrev')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-lg border-[#e2e8f0]"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  {t('practitioner.appointmentsList.pageNext')}
                </Button>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <ConfirmDialog
        open={Boolean(rejectId)}
        onOpenChange={(open) => !open && setRejectId(null)}
        title={t('practitioner.appointmentsList.declineTitle')}
        description={t('practitioner.appointmentsList.declineDesc')}
        confirmLabel={rejectMut.isPending ? t('practitioner.appointment.declining') : t('practitioner.appointment.decline')}
        cancelLabel={t('practitioner.appointment.keepPending')}
        variant="destructive"
        onConfirm={async () => {
          if (!rejectId) return;
          await rejectMut.mutateAsync(rejectId);
        }}
      />
    </>
  );
}
