import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addMinutes, addDays, format, startOfDay } from 'date-fns';
import { Trash2 } from 'lucide-react';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  createPractitionerSlot,
  deletePractitionerSlot,
  listPractitionerSlots,
} from '@/features/practitioners/session-api';
import { cn } from '@/lib/utils/cn';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function combineLocalDateAndTime(dateStr: string, timeStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = timeStr.split(':').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0, 0, 0);
}

function slotId(row: Record<string, unknown>): string | null {
  if (row._id != null) return String(row._id);
  return null;
}

function errMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return 'Something went wrong';
}

export function practitionerOpenSlotsQueryKey(from: Date, to: Date) {
  return ['practitioners', 'me', 'slots', from.toISOString(), to.toISOString(), 'OPEN'] as const;
}

const DURATIONS = [15, 20, 30, 45, 60, 90] as const;

type Ctx = { openSlotManager: () => void };

const PractitionerSlotManagerContext = createContext<Ctx | null>(null);

export function usePractitionerSlotManager(): Ctx {
  const v = useContext(PractitionerSlotManagerContext);
  if (!v) {
    throw new Error('usePractitionerSlotManager must be used within PractitionerSlotManagerProvider');
  }
  return v;
}

export function PractitionerSlotManagerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openSlotManager = useCallback(() => setOpen(true), []);
  const value = useMemo(() => ({ openSlotManager }), [openSlotManager]);

  return (
    <PractitionerSlotManagerContext.Provider value={value}>
      {children}
      <PractitionerSlotManagerDialog open={open} onOpenChange={setOpen} />
    </PractitionerSlotManagerContext.Provider>
  );
}

function PractitionerSlotManagerDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const today = useMemo(() => startOfDay(new Date()), []);
  const rangeTo = useMemo(() => addDays(today, 42), [today]);

  const [dateStr, setDateStr] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [timeStr, setTimeStr] = useState(() => {
    const d = new Date();
    d.setMinutes(0, 0, 0);
    d.setHours(d.getHours() + 1);
    return format(d, 'HH:mm');
  });
  const [durationMin, setDurationMin] = useState<number>(30);
  const [slotToDelete, setSlotToDelete] = useState<{ id: string; label: string } | null>(null);

  const slotsQuery = useQuery({
    queryKey: practitionerOpenSlotsQueryKey(today, rangeTo),
    queryFn: () =>
      listPractitionerSlots({
        page: 1,
        limit: 100,
        from: today,
        to: rangeTo,
        status: 'OPEN',
      }),
    enabled: open,
  });

  const createMut = useMutation({
    mutationFn: createPractitionerSlot,
    onSuccess: async () => {
      toast.success(t('practitioner.slots.dialog.slotAdded'));
      await qc.invalidateQueries({ queryKey: practitionerOpenSlotsQueryKey(today, rangeTo) });
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  const deleteMut = useMutation({
    mutationFn: deletePractitionerSlot,
    onSuccess: async () => {
      toast.success(t('practitioner.slots.dialog.slotRemoved'));
      setSlotToDelete(null);
      await qc.invalidateQueries({ queryKey: practitionerOpenSlotsQueryKey(today, rangeTo) });
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  const items = useMemo(() => {
    const raw = slotsQuery.data?.items ?? [];
    return [...raw].sort((a, b) => {
      if (!isRecord(a) || !isRecord(b)) return 0;
      const ta = a.startTime ? new Date(String(a.startTime)).getTime() : 0;
      const tb = b.startTime ? new Date(String(b.startTime)).getTime() : 0;
      return ta - tb;
    });
  }, [slotsQuery.data?.items]);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const start = combineLocalDateAndTime(dateStr, timeStr);
    const end = addMinutes(start, durationMin);
    if (end.getTime() <= start.getTime()) {
      toast.error(t('practitioner.slots.dialog.endAfterStart'));
      return;
    }
    createMut.mutate({ startTime: start, endTime: end });
  }

  const minDate = format(new Date(), 'yyyy-MM-dd');

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[min(90vh,720px)] max-w-2xl overflow-y-auto p-0 sm:max-w-2xl">
          <div className="border-b border-[#e2e8f0] p-6 pb-4">
            <DialogHeader className="pr-6">
              <DialogTitle>{t('practitioner.slots.dialog.title')}</DialogTitle>
              <DialogDescription>{t('practitioner.slots.dialog.description')}</DialogDescription>
            </DialogHeader>
          </div>

          <div className="grid gap-8 p-6 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-[#0a1628]">{t('practitioner.slots.dialog.addTitle')}</h3>
              <p className="mt-1 text-xs text-[#64748b]">{t('practitioner.slots.dialog.addHint')}</p>
              <form className="mt-4 space-y-4" onSubmit={handleCreate}>
                <div className="space-y-1.5">
                  <Label htmlFor="slot-date" className="text-xs font-medium text-[#475569]">
                    {t('practitioner.slots.dialog.date')}
                  </Label>
                  <Input
                    id="slot-date"
                    type="date"
                    min={minDate}
                    value={dateStr}
                    onChange={(e) => setDateStr(e.target.value)}
                    className="border-[#e2e8f0]"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="slot-start" className="text-xs font-medium text-[#475569]">
                    {t('practitioner.slots.dialog.startTime')}
                  </Label>
                  <Input
                    id="slot-start"
                    type="time"
                    value={timeStr}
                    onChange={(e) => setTimeStr(e.target.value)}
                    className="border-[#e2e8f0]"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="slot-duration" className="text-xs font-medium text-[#475569]">
                    {t('practitioner.slots.dialog.duration')}
                  </Label>
                  <select
                    id="slot-duration"
                    value={durationMin}
                    onChange={(e) => setDurationMin(Number(e.target.value))}
                    className={cn(
                      'flex h-10 w-full rounded-md border border-[#e2e8f0] bg-white px-3 py-2 text-sm',
                      'ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/25 focus-visible:ring-offset-2',
                    )}
                  >
                    {DURATIONS.map((m) => (
                      <option key={m} value={m}>
                        {t('practitioner.slots.dialog.minutes', { count: m })}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  type="submit"
                  disabled={createMut.isPending}
                  className="w-full bg-gradient-to-br from-teal-500 to-teal-700 text-white hover:from-teal-600 hover:to-teal-800"
                >
                  {createMut.isPending ? t('practitioner.slots.dialog.saving') : t('practitioner.slots.dialog.addOpenSlot')}
                </Button>
              </form>
            </div>

            <div className="flex min-h-0 flex-col border-t border-[#e2e8f0] pt-6 md:border-l md:border-t-0 md:pl-6 md:pt-0">
              <h3 className="text-sm font-semibold text-[#0a1628]">{t('practitioner.slots.dialog.upcomingTitle')}</h3>
              <p className="mt-1 text-xs text-[#64748b]">
                {slotsQuery.isFetching
                  ? t('practitioner.slots.dialog.refreshing')
                  : t('practitioner.slots.dialog.inNextWeeks', { count: items.length })}
              </p>
              <div className="mt-3 max-h-[280px] flex-1 space-y-2 overflow-y-auto pr-1">
                {slotsQuery.isLoading ? <p className="text-sm text-muted-foreground">{t('practitioner.slots.dialog.loading')}</p> : null}
                {slotsQuery.isError ? (
                  <p className="text-sm text-destructive">{t('practitioner.slots.dialog.couldNotLoad')}</p>
                ) : null}
                {!slotsQuery.isLoading && !items.length && slotsQuery.isSuccess ? (
                  <p className="rounded-lg border border-dashed border-[#e2e8f0] bg-[#f8fafc] p-4 text-sm text-[#64748b]">
                    {t('practitioner.slots.dialog.empty')}
                  </p>
                ) : null}
                {items.map((row) => {
                  if (!isRecord(row)) return null;
                  const id = slotId(row);
                  if (!id || !row.startTime || !row.endTime) return null;
                  const st = new Date(String(row.startTime));
                  const en = new Date(String(row.endTime));
                  const label = `${format(st, 'EEE, MMM d')} · ${format(st, 'h:mm a')} – ${format(en, 'h:mm a')}`;
                  return (
                    <div
                      key={id}
                      className="flex items-center gap-2 rounded-xl border border-[#e2e8f0] bg-[#fafbfc] px-3 py-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-[#0a1628]">{label}</p>
                        <p className="text-[11px] text-[#64748b]">
                          {typeof row.durationMinutes === 'number'
                            ? `${row.durationMinutes} min`
                            : t('practitioner.slots.dialog.open')}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 text-[#64748b] hover:bg-rose-50 hover:text-rose-600"
                        title={t('practitioner.slots.dialog.removeSlotTitle')}
                        onClick={() => setSlotToDelete({ id, label })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-[#e2e8f0] bg-[#f8fafc] px-6 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('practitioner.slots.dialog.done')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(slotToDelete)}
        onOpenChange={(o) => !o && setSlotToDelete(null)}
        title={t('practitioner.slots.dialog.removeConfirmTitle')}
        description={
          slotToDelete ? (
            <span>{t('practitioner.slots.dialog.removeConfirmDesc', { label: slotToDelete.label })}</span>
          ) : null
        }
        confirmLabel={t('practitioner.slots.dialog.removeConfirm')}
        cancelLabel={t('practitioner.slots.dialog.keepSlot')}
        variant="destructive"
        onConfirm={async () => {
          if (!slotToDelete) return;
          await deleteMut.mutateAsync(slotToDelete.id);
        }}
      />
    </>
  );
}

/** Inline list for dashboard / availability page — uses same query key as the manager dialog. */
export function PractitionerOpenSlotsSummary({
  maxItems = 5,
  className,
}: {
  maxItems?: number;
  className?: string;
}) {
  const { t } = useTranslation();
  const { openSlotManager } = usePractitionerSlotManager();
  const today = useMemo(() => startOfDay(new Date()), []);
  const rangeTo = useMemo(() => addDays(today, 42), [today]);

  const q = useQuery({
    queryKey: practitionerOpenSlotsQueryKey(today, rangeTo),
    queryFn: () =>
      listPractitionerSlots({
        page: 1,
        limit: 100,
        from: today,
        to: rangeTo,
        status: 'OPEN',
      }),
  });

  const items = useMemo(() => {
    const raw = q.data?.items ?? [];
    return [...raw].sort((a, b) => {
      if (!isRecord(a) || !isRecord(b)) return 0;
      const ta = a.startTime ? new Date(String(a.startTime)).getTime() : 0;
      const tb = b.startTime ? new Date(String(b.startTime)).getTime() : 0;
      return ta - tb;
    });
  }, [q.data?.items]);

  const slice = items.slice(0, maxItems);

  return (
    <div className={cn('rounded-[18px] border border-[#e2e8f0] bg-white p-6 shadow-sm', className)}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-medium tracking-tight text-[#0a1628]">
            {t('practitioner.slots.title')}{' '}
            <em className="not-italic text-teal-700">{t('practitioner.slots.titleEm')}</em>
          </h2>
          <p className="mt-1 text-xs text-[#64748b]">
            {q.isSuccess
              ? t('practitioner.slots.openCount', { count: items.length })
              : t('practitioner.slots.subtitle')}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          className="rounded-[9px] bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-sm hover:from-teal-600 hover:to-teal-800"
          onClick={openSlotManager}
        >
          {t('practitioner.slots.addManage')}
        </Button>
      </div>

      {q.isLoading ? <p className="text-sm text-muted-foreground">{t('practitioner.slots.loading')}</p> : null}
      {q.isError ? <p className="text-sm text-destructive">{t('practitioner.slots.couldNotLoad')}</p> : null}

      {slice.length ? (
        <ul className="divide-y divide-[#eef1f6] rounded-xl border border-[#e2e8f0] bg-[#fafbfc]">
          {slice.map((row) => {
            if (!isRecord(row) || !row.startTime || !row.endTime) return null;
            const id = slotId(row);
            if (!id) return null;
            const st = new Date(String(row.startTime));
            const en = new Date(String(row.endTime));
            return (
              <li key={id} className="px-3 py-2.5 text-sm">
                <span className="font-medium text-[#0a1628]">{format(st, 'EEE, MMM d')}</span>
                <span className="text-[#64748b]"> · </span>
                <span className="tabular-nums text-[#475569]">
                  {format(st, 'h:mm a')} – {format(en, 'h:mm a')}
                </span>
              </li>
            );
          })}
        </ul>
      ) : q.isSuccess ? (
        <p className="text-sm text-muted-foreground">{t('practitioner.slots.empty')}</p>
      ) : null}

      {items.length > maxItems ? (
        <button
          type="button"
          className="mt-3 text-xs font-medium text-teal-800 hover:underline"
          onClick={openSlotManager}
        >
          {t('practitioner.slots.viewAll', { count: items.length })}
        </button>
      ) : null}
    </div>
  );
}
