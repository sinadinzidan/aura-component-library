import { cn } from '../../../lib/utils';
import { formatDelta, formatValue } from '../status';

import { deviationScore } from './goldenBatch';
import type { AlignedPoint, BatchPhase, BatchPoint } from './goldenBatch';

export type GoldenBatchChartProps = {
  /** What is compared, e.g. "Reactor temperature, batch B-2603-118 against the golden batch". */
  label: string;
  /** The golden profile, in minutes from batch start. */
  golden: readonly BatchPoint[];
  /** The running batch, already aligned to the golden clock with `alignByPhase`. */
  current: readonly AlignedPoint[];
  goldenPhases: readonly BatchPhase[];
  /** Half-width of the tolerance band around the golden profile, in value units. */
  tolerance: number;
  unit?: string;
  decimals?: number;
  /** Value range of the plot. Defaults to the data with the band. */
  yDomain?: readonly [number, number];
  /** Tailwind height of the plot. */
  heightClassName?: string;
  className?: string;
};

const VIEW = 100;

/**
 * A running batch drawn over the golden batch: the golden profile as a dashed line inside its
 * tolerance band, the current batch as a solid line, and every stretch outside the band shaded
 * and redrawn in the critical colour. Phase names run along the top, so a deviation is read as
 * "late in React", not as a minute count. The one-line summary under the plot states the
 * conformance and each excursion in words.
 */
export function GoldenBatchChart({ label, golden, current, goldenPhases, tolerance, unit, decimals = 1, yDomain, heightClassName = 'h-56', className }: GoldenBatchChartProps) {
  const score = deviationScore(current, golden, tolerance);
  const start = goldenPhases[0]?.start ?? golden[0]?.t ?? 0;
  const end = goldenPhases[goldenPhases.length - 1]?.end ?? golden[golden.length - 1]?.t ?? 1;
  const span = Math.max(end - start, 1);
  const values = [...golden.flatMap((point) => [point.v - tolerance, point.v + tolerance]), ...current.map((point) => point.v)];
  const low = yDomain?.[0] ?? (values.length ? Math.floor(Math.min(...values) / 10) * 10 : 0);
  const high = yDomain?.[1] ?? (values.length ? Math.ceil(Math.max(...values) / 10) * 10 : 1);
  const range = Math.max(high - low, 1);

  const x = (t: number): number => Math.round(((t - start) / span) * VIEW * 100) / 100;
  const y = (v: number): number => Math.round((1 - (v - low) / range) * VIEW * 100) / 100;
  const line = (points: readonly BatchPoint[]): string => points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${x(point.t)} ${y(point.v)}`).join(' ');
  const band =
    golden.length > 1
      ? `${golden.map((point, index) => `${index === 0 ? 'M' : 'L'} ${x(point.t)} ${y(point.v + tolerance)}`).join(' ')} ${[...golden]
          .reverse()
          .map((point) => `L ${x(point.t)} ${y(point.v - tolerance)}`)
          .join(' ')} Z`
      : '';

  const phaseLabel = (phaseId: string): string => goldenPhases.find((phase) => phase.id === phaseId)?.label ?? phaseId;
  const unitText = unit ? ` ${unit}` : '';
  const finding =
    current.length === 0
      ? 'No data for the current batch yet.'
      : score.excursions.length === 0
        ? `${score.conformance}% of samples within ±${formatValue(tolerance, decimals)}${unitText} of the golden batch. No excursions.`
        : `${score.conformance}% of samples within ±${formatValue(tolerance, decimals)}${unitText}. ${score.excursions.length} ${score.excursions.length === 1 ? 'excursion' : 'excursions'}: ${score.excursions
            .map((excursion) => `${phaseLabel(excursion.phaseId)} ${formatDelta(excursion.peak, decimals)}${unitText} at ${formatValue(excursion.from)}–${formatValue(excursion.to)} min`)
            .join('; ')}.`;

  return (
    <figure data-slot="golden-batch-chart" className={cn('flex w-full min-w-0 flex-col gap-2', className)}>
      <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-2">
        <span />
        <div aria-hidden="true" className="flex">
          {goldenPhases.map((phase) => (
            <span key={phase.id} className="min-w-0 truncate pb-1 text-xs text-medium-foreground" style={{ width: `${((phase.end - phase.start) / span) * 100}%` }}>
              {phase.label}
            </span>
          ))}
        </div>

        <div aria-hidden="true" className={cn('flex flex-col justify-between text-right text-xs tabular-nums text-muted-foreground', heightClassName)}>
          <span>{formatValue(high)}</span>
          <span>{formatValue((high + low) / 2)}</span>
          <span>{formatValue(low)}</span>
        </div>
        <svg role="img" aria-label={`${label}. ${finding}`} viewBox={`0 0 ${VIEW} ${VIEW}`} preserveAspectRatio="none" fill="none" className={cn('block w-full overflow-visible', heightClassName)}>
          {score.excursions.map((excursion) => (
            <rect
              key={`${excursion.phaseId}-${excursion.from}`}
              data-slot="excursion"
              x={x(excursion.from) - 0.4}
              y={0}
              width={Math.max(x(excursion.to) - x(excursion.from), 0) + 0.8}
              height={VIEW}
              className="fill-chart-critical-100"
            />
          ))}
          {band ? <path data-slot="tolerance-band" d={band} className="fill-chart-neutral-100" /> : null}
          {[0, 50, 100].map((position) => (
            <line key={position} x1={0} x2={VIEW} y1={position} y2={position} strokeWidth={1} vectorEffect="non-scaling-stroke" className="stroke-chart-gridlines" />
          ))}
          {goldenPhases.slice(1).map((phase) => (
            <line key={phase.id} data-slot="phase-boundary" x1={x(phase.start)} x2={x(phase.start)} y1={0} y2={VIEW} strokeWidth={1} strokeDasharray="2 3" vectorEffect="non-scaling-stroke" className="stroke-chart-neutral-300" />
          ))}
          {golden.length > 1 ? <path data-slot="golden-line" d={line(golden)} strokeWidth={1.5} strokeDasharray="5 4" vectorEffect="non-scaling-stroke" className="stroke-chart-neutral-450" /> : null}
          {current.length > 1 ? <path data-slot="current-line" d={line(current)} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" className="stroke-chart-1-450" /> : null}
          {score.excursions.map((excursion) => {
            const points = current.filter((point) => point.t >= excursion.from && point.t <= excursion.to && point.phaseId === excursion.phaseId);
            if (points.length < 2) return null;
            return <path key={`${excursion.phaseId}-${excursion.from}`} data-slot="excursion-line" d={line(points)} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" className="stroke-chart-critical-450" />;
          })}
        </svg>

        <span />
        <div aria-hidden="true" className="flex justify-between pt-1 text-xs tabular-nums text-muted-foreground">
          <span>{formatValue(start)} min</span>
          <span>{formatValue(start + span / 2)}</span>
          <span>{formatValue(end)} min</span>
        </div>
      </div>

      <ul aria-label="Key" className="flex flex-wrap items-center gap-x-4 gap-y-1 pl-12 text-xs text-medium-foreground">
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-0.5 w-4 bg-chart-1-450" />
          Current batch
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="w-4 border-t-2 border-dashed border-chart-neutral-450" />
          Golden batch
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-2.5 w-4 rounded-sm bg-chart-neutral-100" />
          Tolerance ±{formatValue(tolerance, decimals)}
          {unitText}
        </li>
        {score.excursions.length > 0 ? (
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className="h-2.5 w-4 rounded-sm border-b-2 border-chart-critical-450 bg-chart-critical-100" />
            Outside tolerance
          </li>
        ) : null}
      </ul>
      <figcaption data-slot="golden-batch-summary" className="pl-12 text-xs text-muted-foreground">
        {finding}
      </figcaption>
    </figure>
  );
}
