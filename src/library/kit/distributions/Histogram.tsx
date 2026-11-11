import type { ReactNode } from 'react';

import { useLook } from '../../looks/useLook';
import type { LegendItem } from '../Legend';
import { formatNumber, niceTicks, toneLine, type Tone } from '../tones';

import { markGap, markRadius, markStyle } from './marks';
import { PlotFrame } from './PlotFrame';
import { linearTicks, percent } from './stats';

export type HistogramLimit = {
  value: number;
  label: string;
  tone?: Tone;
  /** Draw the bins on this side of the line in the limit's tone, as out of range. */
  side?: 'above' | 'below';
};

type HistogramProps = {
  /** What the histogram shows, in words. */
  label: string;
  /** Count per equal-width bin from `min` to `max`. */
  counts: readonly number[];
  min: number;
  max: number;
  /** Name of the counted series, for the legend. */
  seriesLabel?: string;
  tone?: Tone;
  /** A second distribution on the same bins, drawn as a stepped outline over the first. */
  compare?: { label: string; counts: readonly number[]; tone?: Tone };
  limits?: readonly HistogramLimit[];
  /** Quantity on the x axis with its unit: "Discharge pressure, barg". */
  xTitle?: string;
  /** What is counted: "Hours". */
  yTitle?: string;
  decimals?: number;
  /** Number of intervals between x ticks. */
  xSteps?: number;
  height?: number;
  headline?: ReactNode;
  notes?: ReactNode;
  className?: string;
};

/**
 * How often each value occurs: bars on a continuous axis with limits drawn at their true
 * position, and the bins beyond a limit coloured as out of range. A second distribution can be
 * laid over the first on the same scale.
 */
export function Histogram({
  label,
  counts,
  min,
  max,
  seriesLabel,
  tone = 'accent',
  compare,
  limits = [],
  xTitle,
  yTitle,
  decimals = 0,
  xSteps = 4,
  height = 280,
  headline,
  notes,
  className,
}: HistogramProps) {
  const look = useLook();
  const peak = Math.max(...counts, ...(compare?.counts ?? []), 1);
  const yTicks = niceTicks(peak, 4);
  const top = yTicks[yTicks.length - 1] ?? peak;
  const width = (max - min) / Math.max(counts.length, 1);
  const gap = markGap(look);
  const radius = markRadius(look);

  const binTone = (index: number): Tone => {
    const centre = min + (index + 0.5) * width;
    const hit = limits.find((limit) => (limit.side === 'above' && centre > limit.value) || (limit.side === 'below' && centre < limit.value));
    return hit?.tone ?? tone;
  };

  const legend: LegendItem[] = [];
  if (seriesLabel) legend.push({ label: seriesLabel, tone });
  if (compare) legend.push({ label: compare.label, tone: compare.tone ?? 'amber', mark: 'line' });

  return (
    <PlotFrame
      label={label}
      x={{ min, max, ticks: linearTicks(min, max, xSteps), decimals, title: xTitle }}
      y={{ min: 0, max: top, ticks: yTicks, title: yTitle }}
      height={height}
      legend={legend.length > 0 ? legend : undefined}
      headline={headline}
      notes={notes}
      className={className}
    >
      <div className="absolute inset-0 flex items-end" style={{ gap }}>
        {counts.map((count, index) => (
          <span
            key={index}
            data-bin={count}
            data-tone={binTone(index)}
            className="min-w-0 flex-1"
            style={{
              ...markStyle(look, toneLine(binTone(index))),
              height: count === 0 ? 0 : `max(2px, ${percent(count, 0, top)})`,
              borderRadius: `${radius}px ${radius}px 0 0`,
              marginLeft: look === 'poster' && index > 0 ? -2 : undefined,
            }}
          />
        ))}
      </div>
      {compare ? (
        <div className="absolute inset-0 flex items-end" style={{ gap }}>
          {compare.counts.map((count, index) => (
            <span
              key={index}
              data-compare={count}
              className="min-w-0 flex-1"
              style={{
                height: percent(count, 0, top),
                borderTop: `${look === 'poster' ? 4 : 2.5}px solid ${toneLine(compare.tone ?? 'amber')}`,
                background: `color-mix(in oklab, ${toneLine(compare.tone ?? 'amber')} 16%, transparent)`,
              }}
            />
          ))}
        </div>
      ) : null}
      {limits.map((limit) => {
        const position = percent(limit.value, min, max);
        const flip = (limit.value - min) / (max - min || 1) > 0.6;
        const color = toneLine(limit.tone ?? 'critical');
        return (
          <div key={limit.label} data-limit={limit.value} className="absolute inset-y-0" style={{ left: position }}>
            <span className="absolute inset-y-0 -translate-x-1/2" style={{ borderLeft: `${look === 'poster' ? 3 : 1.5}px ${look === 'poster' ? 'solid' : 'dashed'} ${color}` }} />
            <span
              className={`absolute top-0 whitespace-nowrap bg-[var(--kit-halo)] px-1.5 text-xs font-semibold leading-5 ${flip ? 'right-1' : 'left-1'}`}
              style={{ color }}
            >
              {limit.label} {formatNumber(limit.value, decimals)}
            </span>
          </div>
        );
      })}
    </PlotFrame>
  );
}
