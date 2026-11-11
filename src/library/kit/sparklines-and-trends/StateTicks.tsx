import { useLook } from '../../looks/useLook';
import { cx, type Tone } from '../tones';

export type StateTick = { label: string; tone: Tone; word: string };

type StateTicksProps = {
  /** What the strip shows, for example "Daily flaring against the permit, last 14 days". */
  label: string;
  /** One tick per period, oldest first. */
  ticks: readonly StateTick[];
  /** Captions under the first and the last tick. */
  axis?: readonly [string, string];
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const HEIGHT = { sm: 14, md: 22, lg: 32 } as const;

/**
 * A run of periods reduced to their state: one block per day or shift, coloured by outcome. It
 * answers "how often" where a line answers "how much".
 */
export function StateTicks({ label, ticks, axis, size = 'md', className }: StateTicksProps) {
  const look = useLook();
  const summary = ticks.filter((tick) => tick.tone !== 'success' && tick.tone !== 'neutral').length;
  return (
    <span data-look={look} className={cx('inline-flex min-w-0 flex-col gap-1 align-middle', className)}>
      <span role="img" aria-label={`${label}: ${summary} of ${ticks.length} outside normal`} className="flex gap-[3px]" style={{ height: HEIGHT[size] }}>
        {ticks.map((tick) => (
          <span
            key={tick.label}
            data-tone={tick.tone}
            data-part="tick"
            title={`${tick.label}: ${tick.word}`}
            className="min-w-[5px] flex-1"
            style={{
              background: tick.tone === 'neutral' ? 'var(--kit-track)' : 'var(--t-line)',
              borderRadius: 'min(var(--kit-track-radius), 3px)',
              alignSelf: 'flex-end',
              height: tick.tone === 'success' || tick.tone === 'neutral' ? '62%' : '100%',
            }}
          />
        ))}
      </span>
      {axis ? (
        <span aria-hidden="true" className="flex justify-between text-xs text-(--kit-text-3) tabular-nums">
          <span>{axis[0]}</span>
          <span>{axis[1]}</span>
        </span>
      ) : null}
    </span>
  );
}
