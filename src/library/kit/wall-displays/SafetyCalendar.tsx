import { useLook } from '../../looks/useLook';
import { cx, type Tone } from '../tones';

export type SafetyDayState = 'safe' | 'near-miss' | 'incident' | 'ahead';

const DAY_TONE: Record<SafetyDayState, Tone> = { safe: 'success', 'near-miss': 'warning', incident: 'critical', ahead: 'neutral' };
const DAY_WORD: Record<SafetyDayState, string> = { safe: 'no incident', 'near-miss': 'near miss', incident: 'incident', ahead: 'not yet' };

type SafetyCalendarProps = {
  /** The month, used as the accessible name: "March 2026". */
  label: string;
  /** One state per day of the month, in order. */
  days: readonly SafetyDayState[];
  /** Empty cells before day 1, so the 1st lands on its weekday (Monday first). */
  offset?: number;
  className?: string;
};

/**
 * A month as a grid of days, each filled with what happened: nothing, a near miss or an incident.
 * The classic safety calendar of a shop floor, readable as a pattern from a distance; every cell
 * carries its day number and a different shape of mark, so it does not rest on colour.
 */
export function SafetyCalendar({ label, days, offset = 0, className }: SafetyCalendarProps) {
  const look = useLook();
  const square = look === 'console' || look === 'poster' || look === 'blueprint';
  return (
    <div data-look={look} className={cx('flex min-w-0 flex-col gap-2', className)}>
      <div aria-hidden="true" className="grid grid-cols-7 gap-1.5 text-center text-sm font-medium text-(--kit-text-2)">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <ol aria-label={label} className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: offset }, (_, index) => (
          <li key={`pad-${index}`} aria-hidden="true" />
        ))}
        {days.map((state, index) => (
          <li
            key={index}
            data-tone={DAY_TONE[state]}
            data-state={state}
            aria-label={`${index + 1}: ${DAY_WORD[state]}`}
            className={cx(
              'flex h-11 items-center justify-center gap-1 text-base font-semibold tabular-nums',
              square ? '' : 'rounded-(--kit-radius-sm)',
              state === 'ahead' ? 'bg-(--kit-track) text-(--kit-text-3)' : state === 'safe' ? 'bg-(--t-soft) text-(--t-on-soft)' : 'bg-(--t-solid) text-(--t-on-solid)'
            )}
          >
            {index + 1}
            {state === 'near-miss' ? <span aria-hidden="true">!</span> : null}
            {state === 'incident' ? <span aria-hidden="true">×</span> : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
