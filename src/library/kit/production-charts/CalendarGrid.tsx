import { useLook } from '../../looks/useLook';
import { cx, formatNumber, type Tone } from '../tones';

import { calendarWeeks, type CalendarDay } from './paretoLogic';

type CalendarGridProps = {
  /** What the calendar shows: "Gas export per day, March 2026". */
  label: string;
  days: readonly CalendarDay[];
  /** Weekday of day 1, 0 for Monday. */
  firstWeekday: number;
  /** Colour of a day from its value. */
  toneOf: (value: number) => Tone;
  decimals?: number;
  /** The day in progress, outlined instead of judged. */
  today?: number;
  selected?: number;
  onSelect?: (day: number) => void;
  className?: string;
};

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SOLID_LOOKS = ['console', 'poster', 'signal'];

/**
 * A month of daily results as a calendar: each day carries its figure and is coloured by how it
 * did, so weekends, runs of bad days and the day in progress read at a glance. Days are buttons
 * when `onSelect` is given. Cells are tinted by default and solid in the block-built looks.
 */
export function CalendarGrid({ label, days, firstWeekday, toneOf, decimals = 1, today, selected, onSelect, className }: CalendarGridProps) {
  const look = useLook();
  const solid = SOLID_LOOKS.includes(look);
  const weeks = calendarWeeks(days, firstWeekday);

  return (
    <div role="group" aria-label={label} data-look={look} className={cx('grid min-w-0 grid-cols-7 gap-1.5 text-(--kit-text)', className)}>
      {WEEKDAYS.map((weekday) => (
        <span key={weekday} aria-hidden="true" className="pb-1 text-xs font-medium text-(--kit-text-2)">
          {weekday}
        </span>
      ))}
      {weeks.flat().map((cell, index) => {
        if (!cell) return <span key={`blank-${index}`} aria-hidden="true" />;
        const pending = cell.value === undefined;
        const tone: Tone = pending || cell.value === undefined ? 'neutral' : toneOf(cell.value);
        const isToday = cell.day === today;
        const classes = cx(
          'flex min-h-14 flex-col justify-between rounded-(--kit-radius-sm) px-2 py-1.5 text-left',
          pending ? 'border border-dashed border-(--kit-rule-strong)' : isToday ? 'border-2 border-(--kit-text)' : solid ? 'bg-(--t-solid) text-(--t-on-solid)' : 'bg-(--t-soft)',
          selected === cell.day && 'outline-2 outline-offset-2 outline-(--kit-text)',
          onSelect && !pending && 'cursor-pointer',
        );
        const content = (
          <>
            <span className={cx('text-xs font-medium', solid && !pending && !isToday ? '' : 'text-(--kit-text-2)')}>{isToday ? `${cell.day} · today` : cell.day}</span>
            <span className="text-sm font-semibold tabular-nums">{cell.value === undefined ? '–' : formatNumber(cell.value, decimals)}</span>
          </>
        );
        return onSelect && !pending ? (
          <button key={cell.day} type="button" data-tone={tone} aria-pressed={selected === cell.day} aria-label={`Day ${cell.day}, ${formatNumber(cell.value ?? 0, decimals)}`} onClick={() => onSelect(cell.day)} className={classes}>
            {content}
          </button>
        ) : (
          <div key={cell.day} data-tone={tone} data-day={cell.day} className={classes}>
            {content}
          </div>
        );
      })}
    </div>
  );
}
