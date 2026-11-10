import { IconAlertTriangle } from '@cognite/aura/icons';

import type { MonthCell } from './monthCells';

export type MonthEntry = {
  /** Number of events on the day. */
  count: number;
  /** Something on the day needs attention, such as a conflict. Shown as an icon and in the name. */
  flagged?: boolean;
};

export type MonthGridProps = {
  /** Month and year, for the accessible name: "March 2026". */
  label: string;
  /** Rows of seven days, from `monthCells`. */
  weeks: readonly (readonly MonthCell[])[];
  /** Events per day, keyed by ISO date. */
  entries?: Readonly<Record<string, MonthEntry>>;
  weekdays?: readonly string[];
  todayKey?: string;
  selectedKey?: string;
  /** Makes the days of the month buttons. */
  onSelect?: (key: string) => void;
  /** `dots` shows up to three dots and a "+N"; `count` prints the number with its noun. */
  display?: 'dots' | 'count';
  noun?: { one: string; other: string };
};

const MAX_DOTS = 3;

/**
 * A month as a grid of days with how busy each one is: dots for a glance, or a count when the
 * number matters. Today is a filled marker, the selected day an outlined one, and days of the
 * neighbouring months are muted. Pair it with an agenda for the selected day.
 */
export function MonthGrid({
  label,
  weeks,
  entries = {},
  weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  todayKey,
  selectedKey,
  onSelect,
  display = 'dots',
  noun = { one: 'event', other: 'events' },
}: MonthGridProps) {
  return (
    <table data-slot="month-grid" aria-label={label} className="w-full table-fixed border-collapse">
      <thead>
        <tr>
          {weekdays.map((weekday) => (
            <th key={weekday} scope="col" className="pb-2 text-center text-xs font-medium text-muted-foreground">
              {weekday}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {weeks.map((week) => (
          <tr key={week[0]?.key}>
            {week.map((cell) => {
              const entry = entries[cell.key];
              const count = entry?.count ?? 0;
              const today = cell.key === todayKey;
              const selected = cell.key === selectedKey;
              const countText = `${count} ${count === 1 ? noun.one : noun.other}`;
              const name = `${cell.day}${today ? ', today' : ''}, ${count === 0 ? `no ${noun.other}` : countText}${entry?.flagged ? ', needs attention' : ''}`;
              const body = (
                <>
                  <span
                    className={`flex size-6 items-center justify-center rounded-full text-xs tabular-nums ${
                      today ? 'bg-primary-background font-medium text-primary-foreground' : cell.inMonth ? 'text-base-foreground' : 'text-base-foreground-disabled'
                    }`}
                  >
                    {cell.day}
                  </span>
                  <span aria-hidden="true" className="flex h-4 items-center justify-center gap-0.5">
                    {entry?.flagged ? <IconAlertTriangle className="size-3 shrink-0 text-warning-foreground-strong" /> : null}
                    {display === 'dots' ? (
                      <>
                        {Array.from({ length: Math.min(count, MAX_DOTS) }, (_, index) => (
                          <span key={index} data-slot="month-grid-dot" className="size-1.5 rounded-full bg-muted-foreground" />
                        ))}
                        {count > MAX_DOTS ? <span className="text-xs tabular-nums text-muted-foreground">+{count - MAX_DOTS}</span> : null}
                      </>
                    ) : count > 0 ? (
                      <span className="text-xs tabular-nums text-muted-foreground">{count}</span>
                    ) : null}
                  </span>
                </>
              );
              const cellClass = `flex w-full flex-col items-center gap-0.5 rounded-lg border py-1 ${selected ? 'border-emphasized' : 'border-transparent'}`;
              return (
                <td key={cell.key} data-in-month={cell.inMonth ? 'true' : 'false'} className="p-0.5 align-top">
                  {onSelect && cell.inMonth ? (
                    <button
                      type="button"
                      aria-label={name}
                      aria-pressed={selected}
                      aria-current={today ? 'date' : undefined}
                      className={`${cellClass} cursor-pointer outline-none hover:bg-base-background-hover focus-visible:shadow-focus-ring`}
                      onClick={() => onSelect(cell.key)}
                    >
                      {body}
                    </button>
                  ) : (
                    <div className={cellClass} aria-current={today ? 'date' : undefined}>
                      {body}
                      <span className="sr-only">{name}</span>
                    </div>
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
