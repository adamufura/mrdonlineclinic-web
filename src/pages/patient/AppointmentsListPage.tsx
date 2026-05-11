import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Calendar, ChevronRight, Loader2, X } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { cancelAppointment } from '@/features/appointments/api';
import { listPatientAppointments } from '@/features/patients/api';
import { cn } from '@/lib/utils/cn';
import { ROUTES } from '@/router/routes';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function practitionerName(a: Record<string, unknown>): string {
  const pr = isRecord(a.practitioner) ? (a.practitioner as Record<string, unknown>) : null;
  return pr ? `${String(pr.firstName ?? '')} ${String(pr.lastName ?? '')}`.trim() || 'Clinician' : 'Clinician';
}

const STATUS_TABS = [
  { value: 'all', label: 'All', api: undefined as string | undefined },
  { value: 'PENDING', label: 'Pending', api: 'PENDING' },
  { value: 'CONFIRMED', label: 'Confirmed', api: 'CONFIRMED' },
  { value: 'IN_PROGRESS', label: 'In progress', api: 'IN_PROGRESS' },
  { value: 'COMPLETED', label: 'Completed', api: 'COMPLETED' },
  { value: 'CANCELLED', label: 'Cancelled', api: 'CANCELLED' },
  { value: 'REJECTED', label: 'Declined', api: 'REJECTED' },
  { value: 'NO_SHOW', label: 'No-show', api: 'NO_SHOW' },
] as const;

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

function formatStatusLabel(status: string): string {
  return status.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

export default function PatientAppointmentsListPage() {
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') ?? 'all';
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const apiStatus = useMemo(() => {
    const row = STATUS_TABS.find((t) => t.value === tab);
    return row?.api;
  }, [tab]);

  const listQuery = useQuery({
    queryKey: ['patients', 'appointments', 'list', { page, status: apiStatus ?? 'all' }],
    queryFn: () =>
      listPatientAppointments({
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

  const cancelMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => cancelAppointment(id, reason),
    onSuccess: async () => {
      toast.success('Appointment cancelled');
      setCancelId(null);
      setCancelReason('');
      await qc.invalidateQueries({ queryKey: ['patients', 'appointments'] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Could not cancel'),
  });

  const items = listQuery.data?.items ?? [];
  const meta = listQuery.data?.meta;
  const totalPages = meta?.totalPages ?? 1;

  return (
    <>
      <Helmet>
        <title>Appointments — MRD Online Clinic</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-[#64748b]">
              <Calendar className="size-3.5 text-sky-600" aria-hidden />
              Your care
            </p>
            <h1 className="font-display text-3xl font-normal tracking-tight text-[#0a1628]">Appointments</h1>
            <p className="mt-2 max-w-2xl text-sm text-[#64748b]">
              View upcoming visits, past sessions, and manage bookings you no longer need.
            </p>
          </div>
          {listQuery.isSuccess && meta && tab === 'all' ? (
            <p className="text-sm text-[#64748b]">
              <span className="font-semibold text-[#0a1628]">{meta.total}</span> total
            </p>
          ) : null}
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Tabs value={tab} onValueChange={setTab} className="w-full min-w-[640px]">
            <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
              {STATUS_TABS.map((t) => (
                <TabsTrigger
                  key={t.value}
                  value={t.value}
                  className={cn(
                    'rounded-lg border border-transparent px-3 py-2 text-[13px] data-[state=active]:border-sky-200 data-[state=active]:bg-white data-[state=active]:text-[#0a1628] data-[state=active]:shadow-sm dark:data-[state=active]:bg-white dark:data-[state=active]:text-[#0a1628]',
                    'text-[#64748b] hover:text-[#0a1628]',
                  )}
                >
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <section className="overflow-hidden rounded-[18px] border border-[#e2e8f0] bg-white shadow-sm">
          {listQuery.isLoading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-[#64748b]">
              <Loader2 className="size-5 animate-spin text-sky-600" aria-hidden />
              Loading appointments…
            </div>
          ) : null}
          {listQuery.isError ? (
            <p className="p-8 text-sm text-destructive">Could not load appointments. Try again shortly.</p>
          ) : null}

          {listQuery.isSuccess && items.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="font-medium text-[#0a1628]">No appointments in this view</p>
              <p className="mt-2 text-sm text-[#64748b]">Try another filter or book a visit from Find a doctor.</p>
              <Button asChild className="mt-6" variant="outline">
                <Link to={ROUTES.findDoctor}>Find a doctor</Link>
              </Button>
            </div>
          ) : null}

          {listQuery.isSuccess && items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#e2e8f0] bg-[#fafbfc] text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                    <th className="px-4 py-3 font-medium sm:px-6">When</th>
                    <th className="px-4 py-3 font-medium sm:px-6">Clinician</th>
                    <th className="hidden px-4 py-3 font-medium md:table-cell sm:px-6">Reason</th>
                    <th className="px-4 py-3 font-medium sm:px-6">Status</th>
                    <th className="px-4 py-3 text-right font-medium sm:px-6">Actions</th>
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
                    const canCancel = status === 'PENDING' || status === 'CONFIRMED';

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
                        <td className="px-4 py-4 font-medium text-[#0a1628] sm:px-6">{practitionerName(raw)}</td>
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
                            {formatStatusLabel(status)}
                          </span>
                        </td>
                        <td className="px-4 py-4 sm:px-6">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            {canCancel ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={cancelMut.isPending}
                                className="h-8 gap-1 rounded-lg border-[#e2e8f0] text-[#64748b] hover:bg-rose-50 hover:text-rose-700"
                                onClick={() => {
                                  setCancelReason('');
                                  setCancelId(id);
                                }}
                              >
                                <X className="size-3.5" strokeWidth={2.5} />
                                Cancel
                              </Button>
                            ) : null}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 gap-1 px-2 text-sky-800 hover:bg-sky-50"
                              asChild
                            >
                              <Link to={ROUTES.patient.appointment(id)}>
                                Open
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
                Page <span className="font-semibold text-[#0a1628]">{meta.page}</span> of {totalPages}
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
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-lg border-[#e2e8f0]"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <ConfirmDialog
        open={Boolean(cancelId)}
        onOpenChange={(open) => {
          if (!open) {
            setCancelId(null);
            setCancelReason('');
          }
        }}
        title="Cancel this appointment?"
        description={
          <div className="space-y-3">
            <p>Your clinician will be notified. You cannot undo this from the app.</p>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Brief reason (required)"
              className="min-h-[88px] resize-y"
              disabled={cancelMut.isPending}
            />
          </div>
        }
        confirmLabel={cancelMut.isPending ? 'Cancelling…' : 'Cancel appointment'}
        cancelLabel="Keep appointment"
        variant="destructive"
        onConfirm={async () => {
          const reason = cancelReason.trim();
          if (!cancelId) return;
          if (reason.length < 1) {
            toast.error('Please add a short cancellation reason.');
            throw new Error('Missing cancellation reason');
          }
          await cancelMut.mutateAsync({ id: cancelId, reason });
        }}
      />
    </>
  );
}
