import { format, isValid, parseISO } from 'date-fns';
import { Calendar, ChevronDown, Loader2, MapPin, Search } from 'lucide-react';
import { type FormEvent, type KeyboardEvent, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import type { DirectorySort } from '@/features/practitioners/public-api';
import type { SpecialtyDto } from '@/features/specialties/api';
import { cn } from '@/lib/utils/cn';

const ICON_STROKE = 1.5;
const iconCls = 'shrink-0 text-[#9ca3af]';
const iconSize = 'size-[1.125rem]';

export type FindDoctorDraft = {
  search: string;
  location: string;
  date: string;
  specialtyId: string;
  sort: DirectorySort;
};

type FindDoctorSearchBarProps = {
  draft: FindDoctorDraft;
  onDraftChange: (partial: Partial<FindDoctorDraft>) => void;
  onApply: () => void;
  specialties: SpecialtyDto[] | undefined;
  specialtiesLoading?: boolean;
  isApplying?: boolean;
};

function formatDisplayDate(iso: string): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
  const parsed = parseISO(iso);
  return isValid(parsed) ? format(parsed, 'MMM d, yyyy') : '';
}

const selectKit =
  'h-11 w-full min-w-0 cursor-pointer appearance-none rounded-xl border border-[#e8ecf2] bg-white py-0 pl-3 pr-9 text-[0.9375rem] font-normal text-brand-navy shadow-sm outline-none transition focus-visible:border-sky-500 focus-visible:ring-2 focus-visible:ring-sky-500/20 disabled:opacity-60';

export function FindDoctorSearchBar({
  draft,
  onDraftChange,
  onApply,
  specialties,
  specialtiesLoading,
  isApplying,
}: FindDoctorSearchBarProps) {
  const dateInputRef = useRef<HTMLInputElement>(null);

  const openDatePicker = useCallback(() => {
    const el = dateInputRef.current;
    if (!el) return;
    try {
      el.showPicker?.();
    } catch {
      el.focus();
      el.click();
    }
  }, []);

  function onDateKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openDatePicker();
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    onApply();
  }

  const displayedDate = formatDisplayDate(draft.date);
  const dateAccessibleLabel = 'Preferred appointment date';

  const segmentBase = cn(
    'relative flex min-h-[3.75rem] w-full items-center gap-2.5 rounded-xl border border-[#edf0f5] bg-white px-3 py-2.5 shadow-sm',
    'transition-[border-color,box-shadow] focus-within:border-sky-400/40 focus-within:shadow-[0_0_0_2px_rgba(14,165,233,0.12)]',
    'sm:min-h-0 sm:min-w-0 sm:rounded-none sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:shadow-none sm:focus-within:border-transparent sm:focus-within:shadow-none',
  );

  const inputCls = cn(
    'min-h-10 min-w-0 flex-1 truncate border-0 bg-transparent py-0 text-[0.9375rem] font-normal leading-[1.375] text-brand-navy outline-none',
    'placeholder:font-normal placeholder:text-[#9ca3af]',
  );

  const dateLabelCls = cn(
    'flex min-h-10 min-w-0 flex-1 items-center truncate border-0 bg-transparent py-0 text-[0.9375rem] font-normal leading-[1.375] outline-none',
  );

  const dividerBar = 'hidden w-px shrink-0 self-stretch bg-[#e8ecf2] sm:block sm:min-h-[2.75rem] sm:max-h-[3rem]';

  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        'flex w-full flex-col gap-3 rounded-2xl border border-[#eef1f6] bg-white p-3 shadow-[0_12px_40px_-18px_rgba(14,22,61,0.18)]',
        'sm:flex-row sm:flex-wrap sm:items-center sm:gap-0 sm:overflow-hidden sm:p-1 sm:pl-4 sm:pr-3 sm:pt-3 sm:pb-3',
      )}
    >
      <label className={cn(segmentBase, 'sm:flex-[1.4_1_12rem] sm:pl-0 sm:pr-2')}>
        <Search className={cn(iconSize, iconCls)} strokeWidth={ICON_STROKE} aria-hidden />
        <input
          type="search"
          value={draft.search}
          onChange={(e) => onDraftChange({ search: e.target.value })}
          placeholder="Search doctors, clinics…"
          className={cn(inputCls, 'accent-sky-500')}
          autoComplete="off"
        />
      </label>

      <span className={dividerBar} aria-hidden />

      <label className={cn(segmentBase, 'sm:flex-[0.85_1_8rem] sm:px-3')}>
        <MapPin className={cn(iconSize, iconCls)} strokeWidth={ICON_STROKE} aria-hidden />
        <input
          type="text"
          value={draft.location}
          onChange={(e) => onDraftChange({ location: e.target.value })}
          placeholder="Location"
          className={cn(inputCls, 'accent-sky-500')}
          autoComplete="off"
        />
      </label>

      <span className={dividerBar} aria-hidden />

      <div
        role="button"
        tabIndex={0}
        aria-label={
          displayedDate ? `${dateAccessibleLabel}, ${displayedDate}` : `${dateAccessibleLabel}, choose a date`
        }
        aria-haspopup="dialog"
        onClick={openDatePicker}
        onKeyDown={onDateKeyDown}
        className={cn(
          segmentBase,
          'cursor-pointer select-none sm:flex-[0.75_1_9rem] sm:px-3',
          'outline-none ring-sky-500/25 focus-visible:ring-2 focus-visible:ring-offset-0',
        )}
      >
        <input
          ref={dateInputRef}
          type="date"
          value={draft.date}
          max="2099-12-31"
          onChange={(e) => onDraftChange({ date: e.target.value })}
          tabIndex={-1}
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 m-[-1px] size-px overflow-hidden border-0 p-0 opacity-0"
        />
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <Calendar className={cn(iconSize, iconCls, 'pointer-events-none shrink-0')} strokeWidth={ICON_STROKE} aria-hidden />
          <span
            className={cn(dateLabelCls, 'tabular-nums', displayedDate ? 'text-brand-navy' : 'text-[#9ca3af]')}
          >
            {displayedDate || 'Date'}
          </span>
        </div>
      </div>

      <span className={dividerBar} aria-hidden />

      <div className="relative w-full sm:flex-[0.95_1_9.5rem] sm:px-2">
        <select
          value={draft.specialtyId}
          onChange={(e) => onDraftChange({ specialtyId: e.target.value })}
          disabled={specialtiesLoading}
          className={selectKit}
          aria-label="Specialty"
        >
          <option value="">All specialties</option>
          {specialties?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#9ca3af]"
          aria-hidden
        />
      </div>

      <span className={dividerBar} aria-hidden />

      <div className="relative w-full sm:w-[min(100%,9.5rem)] sm:shrink-0 sm:px-2">
        <select
          value={draft.sort}
          onChange={(e) => onDraftChange({ sort: e.target.value as DirectorySort })}
          className={cn(selectKit, 'pr-9')}
          aria-label="Sort by"
        >
          <option value="rating">Top rated</option>
          <option value="experience">Experience</option>
          <option value="createdAt">Newest</option>
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#9ca3af]"
          aria-hidden
        />
      </div>

      <div className="flex w-full shrink-0 justify-center pt-1 sm:w-auto sm:items-center sm:pl-3 sm:pr-1 sm:pt-0">
        <Button
          type="submit"
          disabled={isApplying}
          variant="navCyan"
          className={cn(
            'h-12 min-h-12 w-full rounded-full border-0 px-8 text-[0.875rem] font-semibold tracking-tight text-white shadow-sm',
            'bg-gradient-search-pill hover:brightness-[1.04] sm:h-11 sm:min-h-[2.75rem] sm:w-auto sm:min-w-[6.5rem]',
          )}
        >
          {isApplying ? (
            <>
              <Loader2 className="mr-2 size-4 shrink-0 animate-spin" aria-hidden />
              Searching
            </>
          ) : (
            'Search'
          )}
        </Button>
      </div>
    </form>
  );
}
