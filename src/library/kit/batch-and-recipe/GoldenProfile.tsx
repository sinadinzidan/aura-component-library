import { useLookDefinition } from '../../looks/useLook';
import { Legend } from '../Legend';
import { cx, formatNumber } from '../tones';

import { valueAt, type BatchPhase, type BatchPoint, type Excursion } from './goldenBatch';

type GoldenProfileProps = {
  /** What the chart shows, in words. */
  label: string;
  /** The reference profile, minutes from batch start. */
  golden: readonly BatchPoint[];
  /** The running batch, already aligned to the golden clock. */
  actual: readonly BatchPoint[];
  /** Golden phases, for the boundaries and their names. */
  phases: readonly BatchPhase[];
  /** Half-width of the band around the golden profile. */
  tolerance: number;
  excursions?: readonly Excursion[];
  unit?: string;
  yDomain: readonly [number, number];
  height?: number;
  showLegend?: boolean;
  className?: string;
};

const GUTTER = { left: 44, right: 12, top: 30, bottom: 26 };

const share = (value: number): string => `${(value * 100).toFixed(3)}%`;

/**
 * A running batch drawn over the golden batch: the reference profile with its tolerance band,
 * the batch so far, phase boundaries named along the top and every excursion outside the band
 * marked with its peak deviation.
 */
export function GoldenProfile({ label, golden, actual, phases, tolerance, excursions = [], unit = '', yDomain, height = 280, showLegend = true, className }: GoldenProfileProps) {
  const { id: look, chart } = useLookDefinition();
  const end = phases[phases.length - 1]?.end ?? 1;
  const x = (t: number): number => Math.min(1, Math.max(0, t / end));
  const y = (value: number): number => 1 - (value - yDomain[0]) / (yDomain[1] - yDomain[0] || 1);
  const at = (point: BatchPoint, offset = 0): string => `${(x(point.t) * 100).toFixed(2)},${(y(point.v + offset) * 100).toFixed(2)}`;
  const band = [...golden.map((point) => at(point, tolerance)), ...[...golden].reverse().map((point) => at(point, -tolerance))].join(' ');
  const ticks = [0, 1, 2, 3, 4].map((step) => yDomain[0] + ((yDomain[1] - yDomain[0]) * step) / 4);
  const last = actual[actual.length - 1];
  const bandStrength = look === 'poster' || look === 'signal' ? 40 : 18;

  return (
    <figure data-look={look} className={cx('flex min-w-0 flex-col gap-3', className)}>
      {showLegend ? (
        <Legend
          items={[
            { label: 'This batch', tone: 'accent', mark: 'line' },
            { label: 'Golden batch', tone: 'neutral', mark: 'dashed' },
            { label: `Tolerance ± ${formatNumber(tolerance, 1)} ${unit}`.trim(), tone: 'success' },
            { label: 'Outside tolerance', tone: 'critical' },
          ]}
        />
      ) : null}
      <div role="img" aria-label={label} className="relative w-full" style={{ height }}>
        {unit ? <span className="absolute top-0 left-0 text-xs leading-4 text-(--kit-text-2)">{unit}</span> : null}
        {ticks.map((tick) => (
          <span
            key={tick}
            className="absolute left-0 -translate-y-1/2 text-right text-xs leading-4 text-(--kit-text-2) tabular-nums"
            style={{ width: GUTTER.left - 10, top: `calc(${GUTTER.top}px + (100% - ${GUTTER.top + GUTTER.bottom}px) * ${y(tick).toFixed(4)})` }}
          >
            {formatNumber(tick, 0)}
          </span>
        ))}
        <div className="absolute" style={{ left: GUTTER.left, right: GUTTER.right, top: GUTTER.top, bottom: GUTTER.bottom }}>
          {chart.grid !== 'none' ? ticks.map((tick) => <span key={tick} className="absolute inset-x-0 border-t border-(--kit-grid)" style={{ top: share(y(tick)) }} />) : null}
          <span className="absolute inset-x-0 bottom-0 border-b border-(--kit-rule-strong)" />
          {phases.map((phase, index) => (
            <div key={phase.id} data-phase={phase.id} className={cx('absolute -top-6 bottom-0', index > 0 && 'border-l border-dashed border-(--kit-rule-strong)')} style={{ left: share(x(phase.start)), width: share(x(phase.end) - x(phase.start)) }}>
              <span className="absolute top-0 left-1.5 text-xs leading-4 font-medium whitespace-nowrap text-(--kit-text-2)">{phase.label}</span>
            </div>
          ))}
          {excursions.map((excursion) => (
            <div
              key={excursion.from}
              data-excursion=""
              className="absolute inset-y-0 border-x border-(--kit-line-critical)"
              style={{
                left: share(x(excursion.from)),
                width: `max(${share(x(excursion.to) - x(excursion.from))}, 6px)`,
                background: 'color-mix(in oklab, var(--kit-line-critical) 16%, transparent)',
              }}
            >
              <span data-tone="critical" className="absolute bottom-1.5 left-1/2 -translate-x-1/2 rounded-(--kit-radius-sm) bg-(--t-vivid) px-1.5 py-0.5 text-xs leading-4 font-medium whitespace-nowrap text-(--t-on-vivid) tabular-nums">
                {excursion.peak > 0 ? '+' : '−'}
                {formatNumber(Math.abs(excursion.peak), 1)} {unit}
              </span>
            </div>
          ))}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" className="absolute inset-0 size-full overflow-visible">
            <polygon points={band} fill={`color-mix(in oklab, var(--kit-line-success) ${bandStrength}%, transparent)`} stroke="none" />
            <polyline points={golden.map((point) => at(point)).join(' ')} fill="none" stroke="var(--kit-line-neutral)" strokeWidth={1.5} strokeDasharray="6 4" vectorEffect="non-scaling-stroke" />
            <polyline
              points={actual.map((point) => at(point)).join(' ')}
              fill="none"
              stroke="var(--kit-line-accent)"
              strokeWidth={chart.strokeWidth}
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          {last ? (
            <div className="absolute size-0" style={{ left: share(x(last.t)), top: share(y(last.v)) }}>
              <span className="absolute size-3 -translate-1/2 rounded-full border-2 border-(--kit-halo) bg-(--kit-line-accent)" />
              <span className="absolute -top-2.5 left-3 rounded-(--kit-radius-sm) bg-(--kit-text) px-1.5 py-0.5 text-xs leading-4 font-medium whitespace-nowrap text-(--kit-halo) tabular-nums">
                {formatNumber(last.v, 1)} {unit}
                {valueAt(golden, last.t) !== null ? ` · golden ${formatNumber(valueAt(golden, last.t) ?? 0, 1)}` : ''}
              </span>
            </div>
          ) : null}
        </div>
        <div className="absolute bottom-0 h-4" style={{ left: GUTTER.left, right: GUTTER.right }}>
          {phases.map((phase) =>
            // A boundary close to the end would collide with the end label.
            x(phase.start) > 0.86 ? null : (
              <span key={phase.id} className="absolute top-0 -translate-x-1/2 text-xs leading-4 whitespace-nowrap text-(--kit-text-2) tabular-nums first:translate-x-0" style={{ left: share(x(phase.start)) }}>
                {phase.start}
              </span>
            )
          )}
          <span className="absolute top-0 right-0 text-xs leading-4 whitespace-nowrap text-(--kit-text-2) tabular-nums">{end} min</span>
        </div>
      </div>
    </figure>
  );
}
