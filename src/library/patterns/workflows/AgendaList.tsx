import { IconAlertTriangle } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

export type AgendaEvent = {
  id: string;
  /** Formatted start, and end when the event has one: "08:00", "10:30". */
  start: string;
  end?: string;
  title: string;
  /** Second line: where, on what, with whom. */
  detail?: ReactNode;
  /** End of the row: an avatar, a badge or a duration. */
  trailing?: ReactNode;
  /** Adds a warning icon and the word "Conflict" under the time. */
  conflict?: boolean;
};

export type AgendaDay = {
  id: string;
  /** Day heading: "Thursday 12 March". */
  label: string;
  /** Quiet note after the heading: "Today", "Night shift". */
  note?: string;
  events: readonly AgendaEvent[];
};

export type AgendaListProps = {
  days: readonly AgendaDay[];
  /** Shown under a day without events, so a free day reads as free rather than missing. */
  emptyText?: string;
  /** Makes each title a button. */
  onSelect?: (eventId: string) => void;
};

/**
 * Events grouped under their day and ordered by time: the calendar as a list, for narrow panels
 * and for people who want "what is next" rather than a grid. Days without events stay in the
 * list with a line that says so.
 */
export function AgendaList({ days, emptyText = 'Nothing scheduled', onSelect }: AgendaListProps) {
  return (
    <div data-slot="agenda-list" className="flex w-full min-w-0 flex-col gap-4">
      {days.map((day) => (
        <section key={day.id} aria-label={day.label} className="flex flex-col gap-1">
          <h3 className="flex items-baseline gap-2 border-b border-default pb-1 text-sm font-medium text-base-foreground">
            {day.label}
            {day.note ? <span className="text-xs font-normal text-muted-foreground">{day.note}</span> : null}
            <span className="ml-auto text-xs font-normal tabular-nums text-muted-foreground">{day.events.length}</span>
          </h3>
          {day.events.length === 0 ? (
            <p data-slot="agenda-empty" className="py-2 text-sm text-muted-foreground">
              {emptyText}
            </p>
          ) : (
            <ul className="flex flex-col">
              {day.events.map((event) => (
                <li key={event.id} data-conflict={event.conflict ? 'true' : undefined} className="grid grid-cols-[6rem_minmax(0,1fr)_auto] items-start gap-x-3 py-2">
                  <span className="flex flex-col gap-0.5 text-sm tabular-nums text-muted-foreground">
                    <span>
                      {event.start}
                      {event.end ? `–${event.end}` : ''}
                    </span>
                    {event.conflict ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-warning-foreground-strong">
                        <IconAlertTriangle aria-hidden="true" className="size-3.5 shrink-0" />
                        Conflict
                      </span>
                    ) : null}
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    {onSelect ? (
                      <button
                        type="button"
                        className="cursor-pointer rounded-sm text-left text-sm font-medium text-base-foreground outline-none hover:underline focus-visible:shadow-focus-ring"
                        onClick={() => onSelect(event.id)}
                      >
                        {event.title}
                      </button>
                    ) : (
                      <span className="text-sm font-medium text-base-foreground">{event.title}</span>
                    )}
                    {event.detail ? <span className="text-xs text-muted-foreground">{event.detail}</span> : null}
                  </span>
                  {event.trailing ? <span className="flex shrink-0 items-center gap-2">{event.trailing}</span> : <span />}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
