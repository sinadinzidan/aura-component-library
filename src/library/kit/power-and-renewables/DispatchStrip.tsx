import { useLook } from '../../looks/useLook';
import { BLOCK_ANATOMY } from '../process-flow/anatomy';
import { cx, type Tone } from '../tones';

export type DispatchSegment = { id: string; from: number; to: number; label: string; tone: Tone };

export type DispatchRow = { id: string; label: string; detail?: string; segments: readonly DispatchSegment[] };

type DispatchStripProps = {
  /** What is scheduled: "Dispatch schedule, 12 March". */
  label: string;
  rows: readonly DispatchRow[];
  /** First and last hour on the axis. */
  hours?: readonly [number, number];
  /** The current hour, drawn as a line through every row. */
  now?: number;
  /** Hours between axis labels. */
  tickEvery?: number;
  className?: string;
};

const pad = (hour: number) => `${String(Math.floor(hour) % 24).padStart(2, '0')}:${String(Math.round((hour % 1) * 60)).padStart(2, '0')}`;

/**
 * A day of dispatch instructions: one row per unit, one block per instruction, and a line at now.
 * A block prints its instruction when it is wide enough and always names it for assistive
 * technology. Blocks are soft pills in the card looks, solid in console, poster and signal, and
 * outlined on a blueprint.
 */
export function DispatchStrip({ label, rows, hours = [0, 24], now, tickEvery = 6, className }: DispatchStripProps) {
  const look = useLook();
  const anatomy = BLOCK_ANATOMY[look];
  const [start, end] = hours;
  const at = (hour: number) => ((hour - start) / (end - start)) * 100;
  const ticks = Array.from({ length: Math.floor((end - start) / tickEvery) + 1 }, (_, index) => start + index * tickEvery);
  const filled = anatomy === 'strip' || anatomy === 'solid';
  const outlined = anatomy === 'outline' || anatomy === 'rule';

  return (
    <div data-look={look} role="group" aria-label={label} className={cx('grid w-full min-w-0 items-center gap-x-4 gap-y-2', className)} style={{ gridTemplateColumns: 'minmax(112px, max-content) minmax(0, 1fr)' }}>
      {rows.map((row) => (
        <div key={row.id} data-row={row.id} className="contents">
          <div className="flex min-w-0 flex-col">
            <span className="text-sm font-semibold text-(--kit-text)">{row.label}</span>
            {row.detail ? <span className="text-xs text-(--kit-text-3) tabular-nums">{row.detail}</span> : null}
          </div>
          <ul aria-label={`${row.label} instructions`} className="relative h-10" style={{ background: 'var(--kit-track)', borderRadius: filled || outlined ? 0 : 'var(--kit-radius-sm)', boxShadow: outlined ? 'inset 0 0 0 1px var(--kit-rule)' : undefined }}>
            {row.segments.map((segment) => {
              const wide = (segment.to - segment.from) / (end - start) >= 0.11;
              return (
                <li
                  key={segment.id}
                  data-tone={segment.tone}
                  data-segment={segment.id}
                  aria-label={`${segment.label}, ${pad(segment.from)} to ${pad(segment.to)}`}
                  className="absolute inset-y-1 flex items-center justify-center px-2 text-xs font-semibold"
                  style={{
                    left: `calc(${at(segment.from)}% + 1px)`,
                    width: `calc(${at(segment.to) - at(segment.from)}% - 2px)`,
                    borderRadius: filled || outlined ? 0 : 'calc(var(--kit-radius-sm) - 2px)',
                    background: outlined ? 'color-mix(in oklab, var(--t-line) 12%, var(--kit-halo))' : filled ? 'var(--t-solid)' : 'var(--t-soft)',
                    color: outlined ? 'var(--t-ink)' : filled ? 'var(--t-on-solid)' : 'var(--t-on-soft)',
                    boxShadow: outlined ? 'inset 0 0 0 1.5px var(--t-line)' : look === 'poster' ? 'inset 0 0 0 2px var(--kit-text)' : undefined,
                  }}
                >
                  {wide ? <span className="whitespace-nowrap">{segment.label}</span> : null}
                </li>
              );
            })}
            {now !== undefined ? <li aria-hidden="true" data-slot="dispatch-now" className="absolute -inset-y-1 -translate-x-1/2" style={{ left: `${at(now)}%`, width: 2, background: 'var(--kit-text)' }} /> : null}
          </ul>
        </div>
      ))}
      <span />
      <div className="relative h-5 text-xs text-(--kit-text-3) tabular-nums">
        {ticks.map((tick, index) => (
          <span key={tick} className={cx('absolute', index === 0 ? '' : index === ticks.length - 1 ? '-translate-x-full' : '-translate-x-1/2')} style={{ left: `${at(tick)}%` }}>
            {pad(tick)}
          </span>
        ))}
        {now !== undefined ? (
          <span className="absolute -translate-x-1/2 bg-(--kit-text) px-1.5 font-semibold whitespace-nowrap text-(--kit-halo)" style={{ left: `${at(now)}%`, borderRadius: filled || outlined ? 0 : 4, color: 'var(--kit-surface)' }}>
            Now {pad(now)}
          </span>
        ) : null}
      </div>
    </div>
  );
}
