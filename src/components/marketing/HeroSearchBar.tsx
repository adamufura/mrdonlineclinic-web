import { format, isValid, parseISO } from 'date-fns';
import { Calendar, MapPin, Search } from 'lucide-react';
import { type FormEvent, type KeyboardEvent, useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/router/routes';
import { cn } from '@/lib/utils/cn';

const ICON_STROKE = 1.5;

/** Kit: outline icons + placeholders — ~#9CA3AF */
const iconCls = 'shrink-0 text-[#9ca3af]';

function formatHeroDate(iso: string): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
  const parsed = parseISO(iso);
  return isValid(parsed) ? format(parsed, 'MMM d, yyyy') : '';
}

/** Search column takes most of the row; location/date keep readable mins */
const flexSearch = 'lg:min-w-[14rem] lg:flex-[13_1_0%]';
const flexLocation = 'lg:min-w-[9.5rem] lg:flex-[6.5_1_0%]';
const flexDate = 'lg:min-w-[11rem] lg:flex-[6_1_0%]';

const iconSize = 'size-[1.125rem]';

export function HeroSearchBar({ className }: { className?: string }) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [loc, setLoc] = useState('');
  const [dateIso, setDateIso] = useState('');
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

  function onDatePickerKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openDatePicker();
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set('search', q.trim());
    if (loc.trim()) params.set('location', loc.trim());
    const d = dateIso.trim();
    if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) params.set('date', d);
    const qs = params.toString();
    navigate(qs ? `${ROUTES.findDoctor}?${qs}` : ROUTES.findDoctor);
  }

  const displayedDate = formatHeroDate(dateIso);

  const segmentBase = cn(
    'relative flex min-h-[4rem] w-full items-center rounded-xl',
    'border border-[#edf0f5] bg-white px-4 py-4 shadow-hero-search-kit',
    'transition-[border-color,box-shadow] focus-within:border-brand-cyan/35 focus-within:shadow-[0_0_0_2px_rgba(9,209,231,0.12)]',
    'lg:min-h-0 lg:min-w-0 lg:rounded-none lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:shadow-none lg:focus-within:border-transparent lg:focus-within:shadow-none',
  );

  /** Same line box for text inputs */
  const inputCls = cn(
    'min-h-10 min-w-0 flex-1 truncate border-0 bg-transparent py-0 text-[0.9375rem] font-normal leading-[1.375] text-brand-navy outline-none',
    'placeholder:font-normal placeholder:text-[#9ca3af]',
  );

  /** Visually match adjacent `<input>` rows; `items-center` + `leading-[1.375]` aligns with placeholder text metrics */
  const dateLabelCls = cn(
    'flex min-h-10 min-w-0 flex-1 items-center truncate border-0 bg-transparent py-0 text-[0.9375rem] font-normal leading-[1.375] outline-none',
  );

  const dividerBar =
    'hidden w-px shrink-0 self-center bg-[#e8ecf2] lg:block lg:h-[3rem] lg:max-h-[min(54%,3.25rem)]';

  const dateAccessibleLabel = 'Preferred appointment date';

  return (
    <form
      id="hero-search"
      onSubmit={onSubmit}
      className={cn(
        'flex w-full flex-col gap-2.5 rounded-xl border border-[#eef1f6] bg-white p-3 shadow-hero-search-kit',
        'mx-auto max-w-full min-[440px]:max-w-none sm:mx-0 sm:max-w-6xl md:max-w-[76rem]',
        'lg:mx-0 lg:max-w-full lg:min-h-[4.875rem] lg:flex-row lg:flex-nowrap lg:items-center lg:gap-0 lg:overflow-hidden',
        'lg:rounded-2xl lg:border lg:border-[#eef1f6] lg:p-0 lg:py-4 lg:pl-6 lg:pr-6 lg:shadow-hero-search-kit lg:scroll-mt-28',
        'xl:min-h-[5rem]',
        className,
      )}
    >
      <label
        className={cn(
          segmentBase,
          flexSearch,
          'gap-2.5 lg:items-center lg:gap-2.5 lg:pl-0 lg:pr-2',
        )}
      >
        <Search className={cn(iconSize, iconCls, 'shrink-0 self-center')} strokeWidth={ICON_STROKE} aria-hidden />
        <input
          type="search"
          name="hero-q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search doctors, clinics, hospitals, etc"
          className={cn(inputCls, 'accent-brand-cyan')}
          autoComplete="off"
        />
      </label>

      <span className={dividerBar} aria-hidden />

      <label className={cn(segmentBase, flexLocation, 'gap-2.5 lg:items-center lg:gap-2.5 lg:px-4')}>
        <MapPin className={cn(iconSize, iconCls, 'shrink-0 self-center')} strokeWidth={ICON_STROKE} aria-hidden />
        <input
          type="text"
          name="hero-location"
          value={loc}
          onChange={(e) => setLoc(e.target.value)}
          placeholder="Location"
          className={cn(inputCls, 'accent-brand-cyan')}
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
        aria-haspopup="true"
        onClick={openDatePicker}
        onKeyDown={onDatePickerKeyDown}
        className={cn(
          segmentBase,
          flexDate,
          'cursor-pointer select-none lg:items-center lg:pl-4 lg:pr-2',
          'outline-none ring-brand-cyan/25 focus-visible:ring-2 focus-visible:ring-offset-0',
        )}
      >
        {/* Native date input must not be a flex item — it skews cross-axis alignment in some browsers */}
        <input
          ref={dateInputRef}
          id="hero-date-native"
          type="date"
          name="hero-date"
          value={dateIso}
          max="2099-12-31"
          onChange={(e) => setDateIso(e.target.value)}
          tabIndex={-1}
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 m-[-1px] size-px overflow-hidden border-0 p-0 opacity-0"
        />

        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <Calendar
            className={cn(iconSize, iconCls, 'pointer-events-none shrink-0')}
            strokeWidth={ICON_STROKE}
            aria-hidden
          />
          <span
            className={cn(
              dateLabelCls,
              'tabular-nums',
              displayedDate ? 'text-brand-navy' : 'text-[#9ca3af]',
            )}
          >
            {displayedDate || 'Date'}
          </span>
        </div>
      </div>

      <div className="flex w-full shrink-0 justify-center px-1 max-lg:pt-1 lg:w-auto lg:items-center lg:self-center lg:pl-4 lg:pr-1">
        <Button
          type="submit"
          variant="navCyan"
          className={cn(
            'h-12 min-h-12 w-full rounded-full border-0 px-9 text-[0.875rem] font-semibold tracking-tight text-white shadow-sm',
            'bg-gradient-search-pill hover:brightness-[1.04] hover:shadow-md',
            'lg:h-11 lg:min-h-[2.75rem] lg:w-auto lg:min-w-[6rem] lg:px-[2.125rem] lg:text-[0.875rem]',
          )}
        >
          Search
        </Button>
      </div>
    </form>
  );
}
