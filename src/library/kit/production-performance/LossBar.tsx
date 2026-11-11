import { useLook } from '../../looks/useLook';
import { cx, formatNumber, type Tone } from '../tones';

export type LossSegment = {
  id: string;
  label: string;
  value: number;
  tone: Tone;
  /** A short line under the label, for example the group the loss belongs to. */
  note?: string;
};

type LossBarProps = {
  /** What the bar accounts for, in words. */
  label: string;
  segments: readonly LossSegment[];
  /** Id of the opened segment, if any. */
  selected: string | null;
  onSelect: (id: string) => void;
  /** The whole the losses come out of. Draws a true-to-scale strip above the blocks. */
  whole?: { total: number; keptLabel: string; lostLabel: string };
  unit?: string;
  decimals?: number;
  className?: string;
};

/**
 * A stacked bar of losses built from solid blocks that are buttons. A thin strip on top keeps the
 * true proportion of what was kept and what was lost; the lost part is then blown up to the full
 * width so every cause is large enough to read and to tap. The opened block is inverted.
 */
export function LossBar({ label, segments, selected, onSelect, whole, unit = '', decimals = 1, className }: LossBarProps) {
  const look = useLook();
  const lost = segments.reduce((sum, segment) => sum + segment.value, 0);
  const lostShare = whole ? Math.min(100, (lost / (whole.total || 1)) * 100) : 0;

  return (
    <div data-look={look} className={cx('flex min-w-0 flex-col', className)}>
      {whole ? (
        <div aria-hidden="true" className="flex flex-col">
          <div className="flex h-9 border-2 border-base-foreground text-sm font-bold">
            <span className="flex min-w-0 items-center bg-base-background px-3 text-base-foreground" style={{ width: `${(100 - lostShare).toFixed(2)}%` }}>
              {whole.keptLabel}
            </span>
            <span className="flex min-w-0 flex-1 items-center justify-end whitespace-nowrap bg-base-foreground px-3 text-base-background">{whole.lostLabel}</span>
          </div>
          <svg viewBox="0 0 100 10" preserveAspectRatio="none" className="h-5 w-full text-base-foreground">
            <polygon points={`${100 - lostShare},0 100,0 100,10 0,10`} fill="currentColor" opacity="0.14" />
            <line x1={100 - lostShare} y1="0" x2="0" y2="10" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
      ) : null}
      <div role="group" aria-label={label} className="flex items-stretch gap-0.5 border-2 border-base-foreground bg-base-foreground">
        {segments.map((segment) => {
          const active = segment.id === selected;
          return (
            <button
              key={segment.id}
              type="button"
              data-tone={segment.tone}
              aria-pressed={active}
              onClick={() => onSelect(segment.id)}
              style={{ flexGrow: segment.value, flexBasis: 0 }}
              className={cx(
                'relative flex min-h-28 min-w-24 cursor-pointer flex-col justify-between gap-2 p-2.5 text-left outline-none transition-colors focus-visible:[box-shadow:inset_0_0_0_4px_var(--base-background)]',
                active ? 'bg-base-foreground text-[var(--t-pop)]' : 'bg-[var(--t-pop)] text-[var(--t-on-pop)] hover:brightness-110'
              )}
            >
              <span className="text-4xl font-extrabold leading-none tracking-tighter tabular-nums">
                −{formatNumber(segment.value, decimals)}
                {unit ? <span className="ml-1 text-sm font-bold tracking-normal">{unit}</span> : null}
              </span>
              <span className="text-sm font-bold leading-tight">
                {segment.label}
                {segment.note ? <span className="mt-0.5 block text-xs font-semibold opacity-85">{segment.note}</span> : null}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
