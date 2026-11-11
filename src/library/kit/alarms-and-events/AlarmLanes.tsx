import { useLook } from '../../looks/useLook';
import { cx, type Tone } from '../tones';

export type AlarmSpan = {
  /** Start and end as a share of the window, 0–1. */
  from: number;
  to: number;
  tone: Tone;
  /** What the span is, for assistive technology: "Active 13:46 to now". */
  label: string;
  /** `standing` is drawn solid; `acknowledged` hatched lighter; `shelved` as an outline. */
  kind?: 'standing' | 'acknowledged' | 'shelved';
};

export type AlarmLane = {
  id: string;
  /** Alarm text. */
  label: string;
  tag: string;
  spans: readonly AlarmSpan[];
  /** Total at the end of the lane: "14 min", "3 times". */
  total: string;
};

type AlarmLanesProps = {
  /** Accessible name, for example "Standing time per alarm, last 24 hours". */
  label: string;
  lanes: readonly AlarmLane[];
  /** Evenly spaced captions under the lanes, first to last. */
  ticks: readonly string[];
  /** Header of the totals column. */
  totalHeader?: string;
  className?: string;
};

const clamp = (share: number) => Math.min(1, Math.max(0, share));

/**
 * One lane per alarm on a shared clock: when it stood, for how long, and how often it came back.
 * Chattering shows as a comb of short spans and a standing alarm as one long bar.
 */
export function AlarmLanes({ label, lanes, ticks, totalHeader = 'Standing', className }: AlarmLanesProps) {
  const look = useLook();
  const square = look === 'console' || look === 'poster' || look === 'blueprint';
  const columns = 'grid grid-cols-[minmax(0,15rem)_minmax(0,1fr)_4.5rem] items-center gap-x-4';

  return (
    <div role="img" aria-label={label} data-look={look} className={cx('flex flex-col text-sm text-[var(--kit-text)]', className)}>
      <div className={cx(columns, 'pb-2 text-xs font-medium text-[var(--kit-text-2)]')}>
        <span>Alarm</span>
        <span />
        <span className="text-right">{totalHeader}</span>
      </div>
      {lanes.map((lane) => (
        <div key={lane.id} className={cx(columns, 'border-t border-[var(--kit-rule)] py-2.5')}>
          <span className="flex min-w-0 flex-col">
            <span className="leading-5 font-medium">{lane.label}</span>
            <span className="text-[0.8125rem] leading-5 font-medium text-[var(--kit-text-2)] tabular-nums">{lane.tag}</span>
          </span>
          <span className={cx('relative h-6 bg-[var(--kit-track)]', square ? '' : 'rounded-[var(--kit-radius-sm)]')}>
            {lane.spans.map((span) => {
              const left = clamp(span.from);
              const width = Math.max(clamp(span.to) - left, 0.004);
              return (
                <span
                  key={`${span.from}-${span.to}`}
                  data-tone={span.tone}
                  data-kind={span.kind ?? 'standing'}
                  title={span.label}
                  style={{ left: `${left * 100}%`, width: `${width * 100}%` }}
                  className={cx(
                    'absolute inset-y-0 min-w-0.5',
                    square ? '' : 'rounded-[calc(var(--kit-radius-sm)/2)]',
                    span.kind === 'shelved'
                      ? 'border border-dashed border-[var(--t-line)]'
                      : span.kind === 'acknowledged'
                        ? 'bg-[color-mix(in_oklab,var(--t-line)_42%,transparent)]'
                        : 'bg-[var(--t-line)]'
                  )}
                />
              );
            })}
          </span>
          <span className="text-right font-semibold whitespace-nowrap tabular-nums">{lane.total}</span>
        </div>
      ))}
      <div className={cx(columns, 'border-t border-[var(--kit-rule-strong)] pt-2 text-xs text-[var(--kit-text-2)]')}>
        <span />
        <span className="flex justify-between tabular-nums">
          {ticks.map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </span>
        <span />
      </div>
    </div>
  );
}
