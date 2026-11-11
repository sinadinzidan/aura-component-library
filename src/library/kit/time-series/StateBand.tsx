import { useLook } from '../../looks/useLook';
import { cx, type Tone } from '../tones';

export type StateSegment = { from: number; to: number; label: string; tone: Tone };

type StateBandProps = {
  /** What the band shows, for example "Run state of the 1st stage compressor". */
  label: string;
  /** Stretches by point index, in the same index space as the plot above. */
  segments: readonly StateSegment[];
  /** Number of points on the time axis the band shares with its plot. */
  count: number;
  /** Row name at the start of the band. */
  caption?: string;
  /** Space left free at the start and the end so the band lines up with a plot's axes. */
  inset?: { left: number; right: number };
  size?: 'md' | 'lg';
  className?: string;
};

/**
 * A discrete state over time — running, tripped, standby — as a strip of blocks on the same time
 * axis as a trend. Each block carries its colour and, where it fits, the state word.
 */
export function StateBand({ label, segments, count, caption, inset = { left: 0, right: 0 }, size = 'md', className }: StateBandProps) {
  const look = useLook();
  const span = Math.max(count - 1, 1);
  const solid = look === 'console' || look === 'poster' || look === 'signal';
  return (
    <div data-look={look} className={cx('flex min-w-0 items-center', className)}>
      <span className="shrink-0 pr-2 text-xs font-medium text-(--kit-text-2)" style={{ width: inset.left }}>
        {caption}
      </span>
      <div role="img" aria-label={`${label}: ${segments.map((segment) => segment.label).join(', ')}`} className="flex min-w-0 flex-1 gap-px overflow-hidden" style={{ height: size === 'lg' ? 28 : 20, borderRadius: 'min(var(--kit-radius-sm), 6px)' }}>
        {segments.map((segment) => {
          const width = ((segment.to - segment.from) / span) * 100;
          return (
            <span
              key={`${segment.from}-${segment.label}`}
              data-tone={segment.tone}
              data-part="segment"
              title={segment.label}
              className="flex min-w-0 items-center justify-center overflow-hidden text-xs font-medium whitespace-nowrap"
              style={{
                width: `${width}%`,
                background: solid ? 'var(--t-solid)' : 'var(--t-soft)',
                color: solid ? 'var(--t-on-solid)' : 'var(--t-on-soft)',
                boxShadow: look === 'blueprint' ? 'inset 0 0 0 1px var(--t-line)' : undefined,
              }}
            >
              {width >= 12 ? segment.label : null}
            </span>
          );
        })}
      </div>
      <span aria-hidden="true" className="shrink-0" style={{ width: inset.right }} />
    </div>
  );
}
