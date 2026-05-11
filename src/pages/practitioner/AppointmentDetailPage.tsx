import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  Stethoscope,
  User,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  getAppointment,
  practitionerCancelAppointment,
  practitionerCompleteAppointment,
  practitionerConfirmAppointment,
  practitionerNoShowAppointment,
  practitionerPatchAppointmentNotes,
  practitionerRejectAppointment,
  practitionerStartAppointment,
} from '@/features/appointments/api';
import { cn } from '@/lib/utils/cn';
import { ROUTES } from '@/router/routes';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function patientBlock(appt: Record<string, unknown>): Record<string, unknown> | null {
  const p = appt.patient;
  return isRecord(p) ? p : null;
}

function patientName(appt: Record<string, unknown>): string {
  const p = patientBlock(appt);
  if (!p) return 'Patient';
  return `${String(p.firstName ?? '')} ${String(p.lastName ?? '')}`.trim() || 'Patient';
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

function formatStatusLabel(status: string): string {
  return status.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}

export default function PractitionerAppointmentDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const validId = id && /^[a-fA-F0-9]{24}$/.test(id) ? id : '';

  const [rejectOpen, setRejectOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [noShowOpen, setNoShowOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [notesDirty, setNotesDirty] = useState(false);

  const apptQuery = useQuery({
    queryKey: ['appointments', 'detail', validId],
    queryFn: () => getAppointment(validId),
    enabled: Boolean(validId),
  });

  const appt = apptQuery.data;
  const status = appt && typeof appt.status === 'string' ? appt.status : '';

  useEffect(() => {
    if (!apptQuery.isSuccess || !appt || notesDirty) return;
    if (String(appt._id ?? '') !== validId) return;
    const n = appt.practitionerNotes;
    setNotes(typeof n === 'string' ? n : '');
  }, [apptQuery.isSuccess, appt, notesDirty, validId]);

  useEffect(() => {
    setNotesDirty(false);
    setNotes('');
  }, [validId]);

  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: ['appointments', 'detail', validId] });
    await qc.invalidateQueries({ queryKey: ['practitioners', 'me', 'appointments'] });
  };

  const confirmMut = useMutation({
    mutationFn: () => practitionerConfirmAppointment(validId),
    onSuccess: async () => {
      toast.success('Appointment confirmed');
      await invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Could not confirm'),
  });

  const rejectMut = useMutation({
    mutationFn: () => practitionerRejectAppointment(validId),
    onSuccess: async () => {
      toast.success('Request declined');
      setRejectOpen(false);
      await invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Could not decline'),
  });

  const startMut = useMutation({
    mutationFn: () => practitionerStartAppointment(validId),
    onSuccess: async () => {
      toast.success('Visit started');
      await invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Could not start'),
  });

  const completeMut = useMutation({
    mutationFn: () => practitionerCompleteAppointment(validId),
    onSuccess: async () => {
      toast.success('Visit completed');
      await invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Could not complete'),
  });

  const noShowMut = useMutation({
    mutationFn: () => practitionerNoShowAppointment(validId),
    onSuccess: async () => {
      toast.success('Marked as no-show');
      setNoShowOpen(false);
      await invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Could not update'),
  });

  const cancelMut = useMutation({
    mutationFn: (reason: string) => practitionerCancelAppointment(validId, reason),
    onSuccess: async () => {
      toast.success('Appointment cancelled');
      setCancelOpen(false);
      setCancelReason('');
      await invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Could not cancel'),
  });

  const notesMut = useMutation({
    mutationFn: (body: string) => practitionerPatchAppointmentNotes(validId, body),
    onSuccess: async () => {
      toast.success('Notes saved');
      setNotesDirty(false);
      await invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Could not save notes'),
  });

  const busy =
    confirmMut.isPending ||
    rejectMut.isPending ||
    startMut.isPending ||
    completeMut.isPending ||
    noShowMut.isPending ||
    cancelMut.isPending;

  const p = appt ? patientBlock(appt) : null;
  const chatRoomId = (() => {
    if (!appt) return null;
    const c = appt.chatRoom;
    if (c == null) return null;
    if (typeof c === 'string') return c;
    if (isRecord(c) && c._id != null) return String(c._id);
    return null;
  })();

  const scheduledStart = appt?.scheduledStart ? new Date(String(appt.scheduledStart)) : null;
  const scheduledEnd = appt?.scheduledEnd ? new Date(String(appt.scheduledEnd)) : null;
  const pageTitle = appt ? `${patientName(appt)} — Appointment` : 'Appointment';

  return (
    <>
      <Helmet>
        <title>{pageTitle} — MRD Online Clinic</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-1.5 px-2 text-teal-800 hover:bg-teal-50" asChild>
            <Link to={ROUTES.practitioner.appointments}>
              <ArrowLeft className="size-4" />
              Appointments
            </Link>
          </Button>
        </div>

        {!validId ? (
          <p className="text-sm text-destructive">Invalid appointment link.</p>
        ) : null}

        {apptQuery.isLoading ? (
          <div className="space-y-4">
            <div className="h-10 w-2/3 max-w-md animate-pulse rounded-lg bg-slate-200/70" />
            <div className="h-48 animate-pulse rounded-[18px] bg-slate-200/50" />
            <div className="h-40 animate-pulse rounded-[18px] bg-slate-200/40" />
          </div>
        ) : null}

        {apptQuery.isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            This appointment could not be loaded. It may have been removed or you may not have access.
            <div className="mt-3">
              <Button variant="outline" size="sm" asChild>
                <Link to={ROUTES.practitioner.appointments}>Back to list</Link>
              </Button>
            </div>
          </div>
        ) : null}

        {apptQuery.isSuccess && appt && isRecord(appt) ? (
          <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="font-display text-2xl font-semibold tracking-tight text-[#0a1628] sm:text-3xl">
                    Visit with {patientName(appt)}
                  </h1>
                  <span
                    className={cn(
                      'inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize',
                      statusBadgeClass(status),
                    )}
                  >
                    {formatStatusLabel(status)}
                  </span>
                </div>
                {scheduledStart ? (
                  <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[#64748b]">
                    <Calendar className="size-4 shrink-0 text-teal-600" aria-hidden />
                    <span className="font-medium text-[#0a1628]">{format(scheduledStart, 'EEEE, MMMM d, yyyy')}</span>
                    <span aria-hidden className="text-[#cbd5e1]">
                      ·
                    </span>
                    <Clock className="size-4 shrink-0 text-sky-600" aria-hidden />
                    <span className="tabular-nums">
                      {format(scheduledStart, 'h:mm a')}
                      {scheduledEnd ? ` – ${format(scheduledEnd, 'h:mm a')}` : null}
                    </span>
                  </p>
                ) : null}
              </div>
              {chatRoomId ? (
                <Button variant="outline" size="sm" className="gap-2 rounded-lg border-[#e2e8f0]" asChild>
                  <Link to={ROUTES.practitioner.messagesRoom(chatRoomId)}>
                    <MessageSquare className="size-4 text-teal-700" />
                    Messages
                  </Link>
                </Button>
              ) : null}
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              <div className="space-y-5 lg:col-span-2">
                <section className="rounded-[18px] border border-[#e2e8f0] bg-white p-6 shadow-sm">
                  <h2 className="font-display text-lg font-medium text-[#0a1628]">Patient</h2>
                  <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-200 to-sky-400 text-lg font-semibold text-[#04132a]">
                      {patientName(appt)
                        .split(/\s+/)
                        .map((w) => w[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0 space-y-2 text-sm">
                      <p className="text-base font-semibold text-[#0a1628]">{patientName(appt)}</p>
                      {p && typeof p.email === 'string' && p.email.trim() ? (
                        <p className="flex items-center gap-2 text-[#64748b]">
                          <Mail className="size-4 shrink-0 text-slate-400" aria-hidden />
                          <a href={`mailto:${p.email}`} className="text-teal-800 underline-offset-2 hover:underline">
                            {p.email}
                          </a>
                        </p>
                      ) : null}
                      {p && typeof p.phoneNumber === 'string' && p.phoneNumber.trim() ? (
                        <p className="flex items-center gap-2 text-[#64748b]">
                          <Phone className="size-4 shrink-0 text-slate-400" aria-hidden />
                          <a href={`tel:${p.phoneNumber}`} className="tabular-nums hover:text-[#0a1628]">
                            {p.phoneNumber}
                          </a>
                        </p>
                      ) : null}
                    </div>
                  </div>
                </section>

                <section className="rounded-[18px] border border-[#e2e8f0] bg-white p-6 shadow-sm">
                  <h2 className="flex items-center gap-2 font-display text-lg font-medium text-[#0a1628]">
                    <Stethoscope className="size-5 text-teal-600" aria-hidden />
                    Visit details
                  </h2>
                  <div className="mt-4 space-y-4 text-sm">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">Reason for visit</p>
                      <p className="mt-1.5 leading-relaxed text-[#0a1628]">
                        {typeof appt.reasonForVisit === 'string' && appt.reasonForVisit.trim()
                          ? appt.reasonForVisit
                          : '—'}
                      </p>
                    </div>
                    {Array.isArray(appt.symptoms) && appt.symptoms.length > 0 ? (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">Symptoms</p>
                        <ul className="mt-2 flex flex-wrap gap-2">
                          {(appt.symptoms as unknown[])
                            .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
                            .map((s) => (
                              <li
                                key={s}
                                className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-1 text-xs font-medium text-[#475569]"
                              >
                                {s}
                              </li>
                            ))}
                        </ul>
                      </div>
                    ) : null}
                    {appt.startedAt ? (
                      <p className="text-xs text-[#64748b]">
                        Visit started{' '}
                        <span className="font-medium text-[#475569]">
                          {format(new Date(String(appt.startedAt)), "MMM d, yyyy 'at' h:mm a")}
                        </span>
                      </p>
                    ) : null}
                    {appt.completedAt ? (
                      <p className="text-xs text-[#64748b]">
                        Visit completed{' '}
                        <span className="font-medium text-[#475569]">
                          {format(new Date(String(appt.completedAt)), "MMM d, yyyy 'at' h:mm a")}
                        </span>
                      </p>
                    ) : null}
                  </div>
                </section>

                {status === 'CANCELLED' ? (
                  <section className="rounded-[18px] border border-slate-200 bg-slate-50 p-6 shadow-sm">
                    <h2 className="font-display text-lg font-medium text-[#0a1628]">Cancellation</h2>
                    <p className="mt-2 text-sm text-[#64748b]">
                      {typeof appt.cancellationReason === 'string' && appt.cancellationReason.trim()
                        ? appt.cancellationReason
                        : 'No reason recorded.'}
                    </p>
                    {appt.cancelledAt ? (
                      <p className="mt-2 text-xs text-[#94a3b8]">
                        {format(new Date(String(appt.cancelledAt)), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    ) : null}
                  </section>
                ) : null}
              </div>

              <div className="space-y-5">
                <section className="rounded-[18px] border border-[#e2e8f0] bg-white p-6 shadow-sm">
                  <h2 className="font-display text-lg font-medium text-[#0a1628]">Actions</h2>
                  <div className="mt-4 flex flex-col gap-2">
                    {status === 'PENDING' ? (
                      <>
                        <Button
                          type="button"
                          disabled={busy}
                          className="w-full justify-center gap-2 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-sm hover:from-teal-600 hover:to-teal-800"
                          onClick={() => confirmMut.mutate()}
                        >
                          {confirmMut.isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                          Approve request
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={busy}
                          className="w-full justify-center gap-2 rounded-xl border-rose-200 text-rose-800 hover:bg-rose-50"
                          onClick={() => setRejectOpen(true)}
                        >
                          <X className="size-4" />
                          Decline request
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          disabled={busy}
                          className="w-full text-[#64748b] hover:bg-slate-50 hover:text-[#0a1628]"
                          onClick={() => setCancelOpen(true)}
                        >
                          Cancel appointment…
                        </Button>
                      </>
                    ) : null}

                    {status === 'CONFIRMED' ? (
                      <>
                        <Button
                          type="button"
                          disabled={busy}
                          className="w-full justify-center gap-2 rounded-xl bg-sky-600 text-white shadow-sm hover:bg-sky-700"
                          onClick={() => startMut.mutate()}
                        >
                          {startMut.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                          Start visit
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={busy}
                          className="w-full justify-center gap-2 rounded-xl border-violet-200 text-violet-900 hover:bg-violet-50"
                          onClick={() => setNoShowOpen(true)}
                        >
                          Mark no-show
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          disabled={busy}
                          className="w-full text-[#64748b] hover:bg-slate-50"
                          onClick={() => setCancelOpen(true)}
                        >
                          Cancel appointment…
                        </Button>
                      </>
                    ) : null}

                    {status === 'IN_PROGRESS' ? (
                      <>
                        <Button
                          type="button"
                          disabled={busy}
                          className="w-full justify-center gap-2 rounded-xl bg-teal-600 text-white shadow-sm hover:bg-teal-700"
                          onClick={() => completeMut.mutate()}
                        >
                          {completeMut.isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                          Complete visit
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          disabled={busy}
                          className="w-full text-[#64748b] hover:bg-slate-50"
                          onClick={() => setCancelOpen(true)}
                        >
                          Cancel appointment…
                        </Button>
                      </>
                    ) : null}

                    {['COMPLETED', 'REJECTED', 'NO_SHOW', 'CANCELLED'].includes(status) ? (
                      <p className="text-sm text-[#64748b]">No further status changes from this screen.</p>
                    ) : null}
                  </div>
                </section>

                <section className="rounded-[18px] border border-[#e2e8f0] bg-white p-6 shadow-sm">
                  <h2 className="flex items-center gap-2 font-display text-lg font-medium text-[#0a1628]">
                    <User className="size-5 text-slate-500" aria-hidden />
                    Your notes
                  </h2>
                  <p className="mt-1 text-xs text-[#64748b]">Private to your practice. Visible on this appointment only.</p>
                  <Textarea
                    className="mt-3 min-h-[120px] border-slate-200 bg-white text-slate-900 dark:bg-white dark:text-slate-900"
                    value={notes}
                    onChange={(e) => {
                      setNotes(e.target.value);
                      setNotesDirty(true);
                    }}
                    placeholder="Clinical notes, follow-up reminders…"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3 rounded-lg border-[#e2e8f0]"
                    disabled={notesMut.isPending}
                    onClick={() => notesMut.mutate(notes)}
                  >
                    {notesMut.isPending ? 'Saving…' : 'Save notes'}
                  </Button>
                </section>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title="Decline this booking?"
        description="The patient will be notified and the slot will reopen for other bookings."
        confirmLabel={rejectMut.isPending ? 'Declining…' : 'Decline'}
        cancelLabel="Keep pending"
        variant="destructive"
        onConfirm={async () => {
          await rejectMut.mutateAsync();
        }}
      />

      <ConfirmDialog
        open={noShowOpen}
        onOpenChange={setNoShowOpen}
        title="Mark as no-show?"
        description="Use when the patient did not attend a confirmed visit. The visit will be closed as a no-show."
        confirmLabel={noShowMut.isPending ? 'Saving…' : 'Mark no-show'}
        cancelLabel="Back"
        variant="destructive"
        onConfirm={async () => {
          await noShowMut.mutateAsync();
        }}
      />

      <Dialog
        open={cancelOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCancelOpen(false);
            setCancelReason('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Cancel appointment</DialogTitle>
            <DialogDescription>
              Please give a short reason. The patient will see this in their appointment history.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="cancel-reason">Reason</Label>
            <Textarea
              id="cancel-reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={4}
              className="border-slate-200 bg-white text-slate-900 dark:bg-white dark:text-slate-900"
              placeholder="e.g. Schedule conflict, clinic closure…"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={() => setCancelOpen(false)}>
              Back
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={!cancelReason.trim() || cancelMut.isPending}
              onClick={() => cancelMut.mutate(cancelReason.trim())}
            >
              {cancelMut.isPending ? 'Cancelling…' : 'Cancel appointment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
