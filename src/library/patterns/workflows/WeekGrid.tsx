import { IconAlertTriangle } from '@cognite/aura/icons';

import { formatMinutes, layoutEvents } from './layoutEvents';

export type WeekGridDay = {
  id: string;
  /** Column heading: "Thu 12". */
  label: string;
  /** Marks the column of the current day. */
  today?: boolean;
};

export type WeekGridEvent = {
  id: string;
  dayId: string;
  /** Minutes from midnight. */
  start: number;
  end: number;
  title: string;
  /** Extra line, shown when the block is tall enough: a place, a crew, a tag. Always part of the name. */
  detail?: string;
  /** `window` draws a dashed, unfilled block for a reserved period such as a maintenance window. */
  kind?: 'event' | 'window';
  /** Adds a warning icon and the word "Conflict" to the block. */
  conflict?: boolean;
};

export type WeekGridProps = {
  /** What the grid shows, for the accessible name: "Maintenance week 11". */
  label: string;
  /** One day gives a day view; five or seven give a week. */
  days: readonly WeekGridDay[];
  events: readonly WeekGridEvent[];
  /** First and last hour shown, 0–24. */
  startHour?: number;
  endHour?: number;
  /** Draws the "now" line in one day column. */
  now?: { dayId: string; minute: number };
  /** Height of one hour in spacing units, so the grid follows the theme's density. */
  hourUnits?: number;
  /** Makes the blocks buttons. */
  onSelect?: (eventId: string) => void;
  selectedId?: string;
};

const TITLE_CLAMP: Record<number, string> = { 1: 'truncate', 2: 'line-clamp-2 break-words', 3: 'line-clamp-3 break-words' };

/**
 * A day or week as a time grid: hours down the side, one column per day, and events as blocks
 * placed by their start and end. Overlapping events share the column side by side (see
 * `layoutEvents`). Static positions only; it shows a plan and lets you pick an event.
 */
export function WeekGrid({ label, days, events, startHour = 8, endHour = 18, now, hourUnits = 12, onSelect, selectedId }: WeekGridProps) {
  const hours = Math.max(1, endHour - startHour);
  const window = { start: startHour * 60, end: endHour * 60 };
  const columns = { gridTemplateColumns: `3rem repeat(${days.length}, minmax(0, 1fr))` };
  const percent = (fraction: number) => `${Math.round(fraction * 10000) / 100}%`;
  const ticks = Array.from({ length: hours + 1 }, (_, index) => index);

  return (
    <div data-slot="week-grid" role="group" aria-label={label} className="flex w-full min-w-0 flex-col">
      <div className="grid pb-2" style={columns}>
        <span />
        {days.map((day) => (
          <span
            key={day.id}
            aria-current={day.today ? 'date' : undefined}
            className={`truncate px-2 text-xs tabular-nums ${day.today ? 'font-semibold text-base-foreground' : 'text-muted-foreground'}`}
          >
            {day.label}
            {day.today ? <span className="font-normal text-muted-foreground"> · Today</span> : null}
          </span>
        ))}
      </div>

      <div className="grid py-2" style={columns}>
        <div aria-hidden="true" className="relative" style={{ height: `calc(var(--spacing) * ${hourUnits * hours})` }}>
          {ticks.map((tick) => (
            <span key={tick} className="absolute right-2 -translate-y-1/2 text-xs tabular-nums text-muted-foreground" style={{ top: percent(tick / hours) }}>
              {formatMinutes((startHour + tick) * 60)}
            </span>
          ))}
        </div>

        {days.map((day) => {
          const dayEvents = events.filter((event) => event.dayId === day.id);
          const placements = layoutEvents(dayEvents, window);
          const showNow = now !== undefined && now.dayId === day.id && now.minute >= window.start && now.minute <= window.end;
          return (
            <ul key={day.id} aria-label={day.label} data-slot="week-grid-day" className="relative border-l border-default">
              {ticks.map((tick) => (
                <li key={tick} aria-hidden="true" className="absolute inset-x-0 border-t border-default" style={{ top: percent(tick / hours) }} />
              ))}
              {placements.map((placement) => {
                const event = dayEvents.find((candidate) => candidate.id === placement.id);
                if (!event) return null;
                const isWindow = event.kind === 'window';
                // Lines of small text the block can hold: 4px per spacing unit, 16px per line, minus the padding.
                const lines = Math.max(1, Math.floor((((event.end - event.start) / 60) * hourUnits * 4 - 6) / 16));
                const showTime = lines >= 2;
                const showConflict = event.conflict === true && lines >= 3;
                const showDetail = event.detail !== undefined && lines >= 4 + (showConflict ? 1 : 0);
                const titleLines = Math.min(3, lines - (showTime ? 1 : 0) - (showConflict ? 1 : 0) - (showDetail ? 1 : 0));
                const time = `${formatMinutes(event.start)}–${formatMinutes(event.end)}`;
                const className = `flex h-full w-full min-w-0 flex-col overflow-hidden rounded-md px-2 py-0.5 text-left ${
                  isWindow ? 'border border-dashed border-emphasized bg-base-background' : 'bg-chart-1-200'
                } ${selectedId === event.id ? 'shadow-focus-ring' : ''}`;
                const content = (
                  <>
                    <span className="flex min-w-0 items-start gap-1">
                      {event.conflict ? <IconAlertTriangle aria-hidden="true" className="mt-px size-3.5 shrink-0 text-warning-foreground-strong" /> : null}
                      <span className={`min-w-0 text-xs font-medium leading-4 text-base-foreground ${TITLE_CLAMP[titleLines] ?? 'truncate'}`}>{event.title}</span>
                    </span>
                    {showTime ? <span className="shrink-0 whitespace-nowrap text-xs leading-4 tabular-nums text-medium-foreground">{time}</span> : null}
                    {showDetail ? <span className="shrink-0 truncate text-xs leading-4 text-medium-foreground">{event.detail}</span> : null}
                    {showConflict ? <span className="shrink-0 text-xs font-medium leading-4 text-warning-foreground-strong">Conflict</span> : null}
                  </>
                );
                const name = `${event.title}, ${time}${event.detail ? `, ${event.detail}` : ''}${isWindow ? ', reserved window' : ''}${event.conflict ? ', conflict' : ''}`;
                return (
                  <li
                    key={event.id}
                    data-slot="week-grid-event"
                    data-kind={isWindow ? 'window' : 'event'}
                    data-conflict={event.conflict ? 'true' : undefined}
                    className="absolute p-px"
                    style={{
                      top: percent(placement.top),
                      height: percent(placement.height),
                      left: percent(placement.lane / placement.lanes),
                      width: percent(1 / placement.lanes),
                    }}
                  >
                    {onSelect ? (
                      <button
                        type="button"
                        aria-label={name}
                        aria-pressed={selectedId === event.id}
                        className={`${className} cursor-pointer outline-none focus-visible:shadow-focus-ring`}
                        onClick={() => onSelect(event.id)}
                      >
                        {content}
                      </button>
                    ) : (
                      <div role="img" aria-label={name} className={className}>
                        {content}
                      </div>
                    )}
                  </li>
                );
              })}
              {showNow && now ? (
                <li data-slot="week-grid-now" className="pointer-events-none absolute inset-x-0 flex -translate-y-1/2 items-center" style={{ top: percent((now.minute - window.start) / (window.end - window.start)) }}>
                  <span aria-hidden="true" className="-ml-1 size-2 shrink-0 rounded-full bg-base-foreground" />
                  <span aria-hidden="true" className="h-px flex-1 bg-base-foreground" />
                  <span className="sr-only">Now, {formatMinutes(now.minute)}</span>
                </li>
              ) : null}
            </ul>
          );
        })}
      </div>
    </div>
  );
}
