import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, formatDistanceToNowStrict, isPast } from 'date-fns';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  MessageSquare,
  Stethoscope,
  X,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { UserAvatar } from '@/components/shared/user-avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cancelAppointment, getAppointment } from '@/features/appointments/api';
import { cn } from '@/lib/utils/cn';
import { displayTranslatedField } from '@/lib/display-text';
import { ROUTES } from '@/router/routes';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
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
      return 'border-emerald-200 bg-emerald-50 text-emerald-900';
    case 'CANCELLED':
      return 'border-slate-200 bg-slate-100 text-slate-600';
    case 'REJECTED':
      return 'border-rose-200 bg-rose-50 text-rose-900';
    case 'NO_SHOW':
      return 'border-violet-200 bg-violet-50 text-violet-900';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-700';
  }
}

function statusLabelKey(status: string): string {
  switch (status) {
    case 'PENDING':
      return 'patient.appointment.statusPending';
    case 'CONFIRMED':
      return 'patient.appointment.statusConfirmed';
    case 'IN_PROGRESS':
      return 'patient.appointment.statusInProgress';
    case 'COMPLETED':
      return 'patient.appointment.statusCompleted';
    case 'CANCELLED':
      return 'patient.appointment.statusCancelled';
    case 'REJECTED':
      return 'patient.appointment.statusRejected';
    case 'NO_SHOW':
      return 'patient.appointment.statusNoShow';
    default:
      return 'patient.appointment.status';
  }
}

function statusHintKey(status: string): string | null {
  switch (status) {
    case 'PENDING':
      return 'patient.appointment.statusPendingHint';
    case 'CONFIRMED':
      return 'patient.appointment.statusConfirmedHint';
    case 'IN_PROGRESS':
      return 'patient.appointment.statusInProgressHint';
    case 'COMPLETED':
      return 'patient.appointment.statusCompletedHint';
    case 'CANCELLED':
      return 'patient.appointment.statusCancelledHint';
    case 'REJECTED':
      return 'patient.appointment.statusRejectedHint';
    case 'NO_SHOW':
      return 'patient.appointment.statusNoShowHint';
    default:
      return null;
  }
}

function statusIcon(status: string) {
  switch (status) {
    case 'COMPLETED':
      return <CheckCircle2 className="size-4 text-emerald-600" />;
    case 'CANCELLED':
    case 'REJECTED':
      return <XCircle className="size-4 text-rose-500" />;
    case 'IN_PROGRESS':
      return <Clock className="size-4 text-sky-600" />;
    default:
      return <Calendar className="size-4 text-amber-600" />;
  }
}

export default function PatientAppointmentDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const query = useQuery({
    queryKey: ['appointments', id],
    queryFn: () => getAppointment(id!),
    enabled: Boolean(id),
  });

  const cancelMut = useMutation({
    mutationFn: ({ apptId, reason }: { apptId: string; reason: string }) => cancelAppointment(apptId, reason),
    onSuccess: async () => {
      toast.success(t('patient.appointmentsList.cancelledToast'));
      setCancelOpen(false);
      setCancelReason('');
      await qc.invalidateQueries({ queryKey: ['appointments', id] });
      await qc.invalidateQueries({ queryKey: ['patients', 'appointments'] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Could not cancel'),
  });

  const appt = query.data as Record<string, unknown> | undefined;
  const status = appt ? String(appt.status ?? '') : '';
  const canCancel = status === 'PENDING' || status === 'CONFIRMED';

  // Practitioner info
  const pr = appt && isRecord(appt.practitioner) ? (appt.practitioner as Record<string, unknown>) : null;
  const prFirstName = pr ? String(pr.firstName ?? '') : '';
  const prLastName = pr ? String(pr.lastName ?? '') : '';
  const prName = `${prFirstName} ${prLastName}`.trim();
  const prPhotoUrl = pr && typeof pr.profilePhotoUrl === 'string' ? pr.profilePhotoUrl : undefined;

  // Schedule info
  const scheduledStart = appt?.scheduledStart ? new Date(String(appt.scheduledStart)) : null;
  const scheduledEnd = appt?.scheduledEnd ? new Date(String(appt.scheduledEnd)) : null;

  // Slot info for duration
  const slot = appt && isRecord(appt.slot) ? (appt.slot as Record<string, unknown>) : null;
  const durationMinutes = slot && typeof slot.durationMinutes === 'number' ? slot.durationMinutes : null;

  // Visit details
  const apptRecord = appt as Record<string, unknown> | null;
  const reasonForVisit = apptRecord ? displayTranslatedField(apptRecord, 'reasonForVisit') : '';
  const symptoms = appt && Array.isArray(appt.symptoms) ? (appt.symptoms as string[]).filter(Boolean) : [];
  const practitionerNotes = apptRecord ? displayTranslatedField(apptRecord, 'practitionerNotes') : '';
  const cancellationReason = appt && typeof appt.cancellationReason === 'string' ? appt.cancellationReason.trim() : '';
  const cancelledAt = appt?.cancelledAt ? new Date(String(appt.cancelledAt)) : null;
  const startedAt = appt?.startedAt ? new Date(String(appt.startedAt)) : null;
  const completedAt = appt?.completedAt ? new Date(String(appt.completedAt)) : null;
  const chatRoom = appt?.chatRoom ? String(appt.chatRoom) : null;
  const createdAt = appt?.createdAt ? new Date(String(appt.createdAt)) : null;

  return (
    <>
      <Helmet>
        <title>
          {appt && prName
            ? t('patient.appointment.titleWith', { name: prName })
            : t('patient.appointment.title')}
        </title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="space-y-6">
        {/* Back navigation */}
        <button
          type="button"
          onClick={() => navigate(ROUTES.patient.appointments)}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#64748b] transition-colors hover:text-[#0a1628]"
        >
          <ArrowLeft className="size-4" />
          {t('patient.appointment.backToList')}
        </button>

        {/* Loading state */}
        {query.isLoading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-[#64748b]">
            <Loader2 className="size-5 animate-spin text-sky-600" aria-hidden />
            {t('patient.appointment.loading')}
          </div>
        ) : null}

        {/* Error state */}
        {query.isError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
            <p className="font-medium text-rose-900">{t('patient.appointment.couldNotLoadDetail')}</p>
            <p className="mt-2 text-sm text-rose-700">{t('patient.appointment.couldNotLoadHint')}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate(ROUTES.patient.appointments)}
            >
              {t('patient.appointment.goToAppointments')}
            </Button>
          </div>
        ) : null}

        {/* Main content */}
        {appt ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            {/* Left column — main details */}
            <div className="space-y-5">
              {/* Header card */}
              <section className="rounded-[18px] border border-[#e2e8f0] bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      {statusIcon(status)}
                      <span
                        className={cn(
                          'inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize',
                          statusBadgeClass(status),
                        )}
                      >
                        {t(statusLabelKey(status))}
                      </span>
                    </div>
                    <h1 className="font-display text-2xl font-normal tracking-tight text-[#0a1628] sm:text-[28px]">
                      {reasonForVisit || t('patient.appointment.fallbackTitle')}
                    </h1>
                    {scheduledStart ? (
                      <p className="text-sm text-[#64748b]">
                        {format(scheduledStart, 'EEEE, MMMM d, yyyy')} · {format(scheduledStart, 'h:mm a')}
                        {scheduledEnd ? ` – ${format(scheduledEnd, 'h:mm a')}` : ''}
                      </p>
                    ) : null}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {chatRoom ? (
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="gap-1.5 rounded-lg border-[#e2e8f0]"
                      >
                        <Link to={ROUTES.patient.messagesRoom(chatRoom)}>
                          <MessageSquare className="size-3.5" />
                          {t('patient.appointment.message')}
                        </Link>
                      </Button>
                    ) : null}
                    {canCancel ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5 rounded-lg border-[#e2e8f0] text-[#64748b] hover:bg-rose-50 hover:text-rose-700"
                        onClick={() => {
                          setCancelReason('');
                          setCancelOpen(true);
                        }}
                      >
                        <X className="size-3.5" strokeWidth={2.5} />
                        {t('patient.appointment.cancel')}
                      </Button>
                    ) : null}
                  </div>
                </div>
              </section>

              {/* Schedule details */}
              <section className="rounded-[18px] border border-[#e2e8f0] bg-white p-6 shadow-sm">
                <h2 className="mb-4 font-display text-lg font-medium tracking-tight text-[#0a1628]">
                  {t('patient.appointment.scheduleDetails')}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <InfoRow
                    icon={<Calendar className="size-4 text-sky-600" />}
                    label={t('patient.appointment.date')}
                    value={scheduledStart ? format(scheduledStart, 'EEE, MMM d, yyyy') : '—'}
                  />
                  <InfoRow
                    icon={<Clock className="size-4 text-sky-600" />}
                    label={t('patient.appointment.time')}
                    value={
                      scheduledStart
                        ? `${format(scheduledStart, 'h:mm a')}${scheduledEnd ? ` – ${format(scheduledEnd, 'h:mm a')}` : ''}`
                        : '—'
                    }
                  />
                  <InfoRow
                    icon={<Clock className="size-4 text-teal-600" />}
                    label={t('patient.appointment.duration')}
                    value={durationMinutes ? t('patient.appointment.durationMinutes', { count: durationMinutes }) : '—'}
                  />
                  <InfoRow
                    icon={<Calendar className="size-4 text-violet-600" />}
                    label={t('patient.appointment.booked')}
                    value={createdAt ? formatDistanceToNowStrict(createdAt, { addSuffix: true }) : '—'}
                  />
                </div>

                {/* Timeline events */}
                {(startedAt || completedAt || cancelledAt) ? (
                  <div className="mt-5 border-t border-[#e2e8f0] pt-4">
                    <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[#64748b]">
                      {t('patient.appointment.timeline')}
                    </p>
                    <div className="space-y-2">
                      {startedAt ? (
                        <TimelineItem
                          label={t('patient.appointment.visitStarted')}
                          time={format(startedAt, 'MMM d, h:mm a')}
                          color="text-sky-600"
                        />
                      ) : null}
                      {completedAt ? (
                        <TimelineItem
                          label={t('patient.appointment.visitCompleted')}
                          time={format(completedAt, 'MMM d, h:mm a')}
                          color="text-emerald-600"
                        />
                      ) : null}
                      {cancelledAt ? (
                        <TimelineItem
                          label={t('patient.appointment.cancelled')}
                          time={format(cancelledAt, 'MMM d, h:mm a')}
                          color="text-rose-600"
                        />
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </section>

              {/* Visit information */}
              <section className="rounded-[18px] border border-[#e2e8f0] bg-white p-6 shadow-sm">
                <h2 className="mb-4 font-display text-lg font-medium tracking-tight text-[#0a1628]">
                  {t('patient.appointment.visitInformation')}
                </h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-[#64748b]">
                      {t('patient.appointment.reasonForVisit')}
                    </p>
                    <p className="mt-1 text-sm text-[#0a1628]">{reasonForVisit || '—'}</p>
                  </div>
                  {symptoms.length > 0 ? (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-[#64748b]">
                        {t('patient.appointment.symptoms')}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {symptoms.map((s, i) => (
                          <span
                            key={i}
                            className="inline-flex rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-3 py-1 text-xs font-medium text-[#0a1628]"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {cancellationReason ? (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-rose-600">
                        {t('patient.appointment.cancellationReason')}
                      </p>
                      <p className="mt-1 text-sm text-[#0a1628]">{cancellationReason}</p>
                    </div>
                  ) : null}
                </div>
              </section>

              {/* Practitioner notes */}
              {practitionerNotes ? (
                <section className="rounded-[18px] border border-[#e2e8f0] bg-white p-6 shadow-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <FileText className="size-4 text-sky-600" />
                    <h2 className="font-display text-lg font-medium tracking-tight text-[#0a1628]">
                      {t('patient.appointment.clinicianNotes')}
                    </h2>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#334155]">
                    {practitionerNotes}
                  </p>
                </section>
              ) : null}
            </div>

            {/* Right column — practitioner card & quick actions */}
            <div className="space-y-5">
              {/* Practitioner card */}
              {pr ? (
                <section className="rounded-[18px] border border-[#e2e8f0] bg-white p-6 shadow-sm">
                  <p className="mb-4 text-xs font-medium uppercase tracking-wide text-[#64748b]">
                    {t('patient.appointment.yourClinician')}
                  </p>
                  <div className="flex items-center gap-4">
                    <UserAvatar
                      name={prName || 'Doctor'}
                      photoUrl={prPhotoUrl}
                      className="h-14 w-14"
                      fallbackClassName="h-14 w-14 bg-gradient-to-br from-teal-300 to-sky-400 text-lg text-[#04132a]"
                    />
                    <div className="min-w-0">
                      <p className="font-display text-base font-medium text-[#0a1628]">
                        Dr. {prName}
                      </p>
                      <p className="text-xs text-[#64748b]">{t('patient.appointment.generalPractitioner')}</p>
                    </div>
                  </div>
                  {chatRoom ? (
                    <Button
                      asChild
                      className="mt-4 w-full gap-2 rounded-lg bg-gradient-to-br from-sky-500 to-sky-700 text-[13px] font-medium text-white shadow-[0_4px_12px_rgba(14,165,233,0.25)]"
                    >
                      <Link to={ROUTES.patient.messagesRoom(chatRoom)}>
                        <MessageSquare className="size-4" />
                        {t('patient.appointment.messageDr', { name: prFirstName || t('patient.appointment.yourClinician') })}
                      </Link>
                    </Button>
                  ) : null}
                </section>
              ) : null}

              {/* Status summary card */}
              <section className="rounded-[18px] border border-[#e2e8f0] bg-white p-6 shadow-sm">
                <p className="mb-4 text-xs font-medium uppercase tracking-wide text-[#64748b]">
                  {t('patient.appointment.status')}
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    {statusIcon(status)}
                    <div>
                      <p className="text-sm font-medium text-[#0a1628]">{t(statusLabelKey(status))}</p>
                      <p className="text-xs text-[#64748b]">
                        {statusHintKey(status) ? t(statusHintKey(status)!) : null}
                      </p>
                    </div>
                  </div>

                  {scheduledStart && !isPast(scheduledStart) && (status === 'PENDING' || status === 'CONFIRMED') ? (
                    <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-3">
                      <p className="text-xs font-medium text-sky-800">
                        {formatDistanceToNowStrict(scheduledStart, { addSuffix: true })}
                      </p>
                      <p className="mt-0.5 text-[11px] text-sky-700/70">{t('patient.appointment.untilAppointment')}</p>
                    </div>
                  ) : null}
                </div>
              </section>

              {/* Quick links */}
              <section className="rounded-[18px] border border-[#e2e8f0] bg-white p-6 shadow-sm">
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[#64748b]">
                  {t('patient.appointment.quickLinks')}
                </p>
                <div className="space-y-2">
                  <QuickLink
                    to={ROUTES.patient.appointments}
                    icon={<Calendar className="size-4" />}
                    label={t('patient.appointment.allAppointments')}
                  />
                  {pr ? (
                    <QuickLink
                      to={ROUTES.patient.findDoctorProfile(String((pr as Record<string, unknown>)._id ?? ''))}
                      icon={<Stethoscope className="size-4" />}
                      label={t('patient.appointment.practitionerProfile', { name: prName })}
                    />
                  ) : null}
                  <QuickLink
                    to={ROUTES.patient.prescriptions}
                    icon={<FileText className="size-4" />}
                    label={t('patient.appointment.prescriptions')}
                  />
                </div>
              </section>
            </div>
          </div>
        ) : null}
      </div>

      {/* Cancel dialog */}
      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCancelOpen(false);
            setCancelReason('');
          }
        }}
        title={t('patient.appointment.cancelTitle')}
        description={
          <div className="space-y-3">
            <p>{t('patient.appointment.cancelDesc')}</p>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder={t('patient.appointment.cancelReasonPlaceholder')}
              className="min-h-[88px] resize-y"
              disabled={cancelMut.isPending}
            />
          </div>
        }
        confirmLabel={cancelMut.isPending ? t('patient.appointment.cancelling') : t('patient.appointment.cancelAppointment')}
        cancelLabel={t('patient.appointmentsList.keepAppointment')}
        variant="destructive"
        onConfirm={async () => {
          const reason = cancelReason.trim();
          if (!id) return;
          if (reason.length < 1) {
            toast.error(t('patient.appointment.cancelReasonRequired'));
            throw new Error('Missing cancellation reason');
          }
          await cancelMut.mutateAsync({ apptId: id, reason });
        }}
      />
    </>
  );
}

/* ─── Helper components ─── */

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-[#64748b]">{label}</p>
        <p className="mt-0.5 text-sm font-medium text-[#0a1628]">{value}</p>
      </div>
    </div>
  );
}

function TimelineItem({ label, time, color }: { label: string; time: string; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn('h-2 w-2 rounded-full', color.replace('text-', 'bg-'))} />
      <p className="text-sm text-[#0a1628]">
        <span className="font-medium">{label}</span>
        <span className="ml-2 text-xs text-[#64748b]">{time}</span>
      </p>
    </div>
  );
}

function QuickLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3 text-sm font-medium text-[#0a1628] transition-colors hover:border-sky-200 hover:bg-sky-50/50"
    >
      <span className="text-sky-600">{icon}</span>
      {label}
    </Link>
  );
}
