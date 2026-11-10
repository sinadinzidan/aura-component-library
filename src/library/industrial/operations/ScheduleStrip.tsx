import { cn } from '../../../lib/utils';
import { TONE_MARK_BG, TONE_MARK_BG_SOFT } from '../status';
import type { Tone } from '../status';

export type ScheduleBar = {
  id: string;
  /** Row label, e.g. the work order number. */
  label: string;
  /** Second line under the label, e.g. the job. */
  sublabel?: string;
  /** Start and end in column units: 0 is the start of the first column, 1.5 the middle of the second. */
  start: number;
  end: number;
  /** Text printed on the bar, e.g. the assignee or the hours. */
  text?: string;
  /** Neutral is planned work; set a tone only for a state such as overdue. */
  tone?: Tone;
  /** Softer fill for work that is planned but not started. */
  tentative?: boolean;
};

export type ScheduleStripProps = {
  /** Column headings, e.g. the days of a week. */
  columns: readonly string[];
  bars: readonly ScheduleBar[];
  /** Position of "now" in column units, drawn as a vertical line. */
  now?: number;
  /** What the schedule shows, for the accessible name. */
  label: string;
  className?: string;
};

const percent = (value: number, total: number): string => `${Math.round((value / total) * 10000) / 100}%`;

/**
 * A week of work as horizontal bars, one row per job — a Gantt reduced to what a shift plan
 * needs. Static by design: it shows the plan, it does not edit it.
 */
export function ScheduleStrip({ columns, bars, now, label, className }: ScheduleStripProps) {
  const total = columns.length;
  const clamp = (value: number) => Math.min(total, Math.max(0, value));

  return (
    <div data-slot="schedule-strip" role="group" aria-label={label} className={cn('grid w-full min-w-0 grid-cols-[minmax(8rem,12rem)_minmax(0,1fr)] gap-x-4', className)}>
      <span />
      <div aria-hidden="true" className="grid pb-2" style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}>
        {columns.map((column) => (
          <span key={column} className="truncate text-xs text-muted-foreground tabular-nums">
            {column}
          </span>
        ))}
      </div>

      {bars.map((bar) => {
        const start = clamp(bar.start);
        const end = clamp(bar.end);
        const tone = bar.tone ?? 'neutral';
        // A short bar cannot hold its text, so the text moves beside it: after the bar, or before it near the right edge.
        const textInside = end - start >= 1.5;
        const textBefore = end > total - 1.5;
        return (
          <div key={bar.id} data-slot="schedule-row" className="col-span-2 grid grid-cols-subgrid items-center border-t border-default py-2">
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate font-mono text-xs text-base-foreground">{bar.label}</span>
              {bar.sublabel ? <span className="truncate text-xs text-muted-foreground">{bar.sublabel}</span> : null}
            </div>
            <div className="relative h-6">
              <div aria-hidden="true" className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}>
                {columns.map((column, index) => (
                  <span key={column} className={index > 0 ? 'border-l border-default' : undefined} />
                ))}
              </div>
              <span
                data-slot="schedule-bar"
                data-tone={tone}
                role="img"
                aria-label={`${bar.label}${bar.sublabel ? `, ${bar.sublabel}` : ''}: ${columns[Math.min(total - 1, Math.floor(start))]} to ${columns[Math.min(total - 1, Math.max(0, Math.ceil(end) - 1))]}${bar.text ? `, ${bar.text}` : ''}`}
                className={cn(
                  'absolute inset-y-0.5 flex items-center overflow-hidden rounded-md px-2',
                  bar.tentative ? TONE_MARK_BG_SOFT[tone] : TONE_MARK_BG[tone]
                )}
                style={{ left: percent(start, total), width: percent(Math.max(end - start, 0), total) }}
              >
                {bar.text && textInside ? (
                  <span className={cn('truncate text-xs font-medium', bar.tentative ? 'text-base-foreground' : 'text-primary-foreground')}>{bar.text}</span>
                ) : null}
              </span>
              {bar.text && !textInside ? (
                <span
                  aria-hidden="true"
                  data-slot="schedule-bar-text"
                  className={cn('absolute inset-y-0 flex items-center whitespace-nowrap text-xs text-muted-foreground', textBefore ? 'pr-2' : 'pl-2')}
                  style={textBefore ? { right: percent(total - start, total) } : { left: percent(end, total) }}
                >
                  {bar.text}
                </span>
              ) : null}
              {now !== undefined && now >= 0 && now <= total ? (
                <span data-slot="schedule-now" aria-hidden="true" className="absolute -inset-y-2 w-px bg-base-foreground" style={{ left: percent(now, total) }} />
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
