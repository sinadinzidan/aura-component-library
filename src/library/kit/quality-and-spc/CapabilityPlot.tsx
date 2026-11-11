import type { ReactNode } from 'react';

import { useLookDefinition } from '../../looks/useLook';
import { ChartFrame } from '../ChartFrame';
import { cx, formatNumber, toneLine, type Tone } from '../tones';

import { capability, histogramBins, normalShare } from './spc';

type CapabilityPlotProps = {
  /** What the plot shows, in words. */
  label: string;
  /** Individual results. */
  values: readonly number[];
  lsl: number;
  usl: number;
  target?: number;
  unit?: string;
  decimals?: number;
  bins?: number;
  tone?: Tone;
  height?: number;
  headline?: ReactNode;
  notes?: ReactNode;
  className?: string;
};

/**
 * Process capability as a picture: the histogram of results with its fitted normal curve between
 * the specification limits. Bins outside the limits are drawn in the critical colour, the mean
 * and target are marked, so "narrow enough" and "centred" can be judged separately.
 */
export function CapabilityPlot({ label, values, lsl, usl, target, unit = '', decimals = 2, bins = 14, tone = 'accent', height = 260, headline, notes, className }: CapabilityPlotProps) {
  const { chart } = useLookDefinition();
  const { mean, sigma } = capability(values, lsl, usl);
  const margin = (usl - lsl) * 0.15;
  const lo = Math.min(lsl - margin, mean - 3.5 * sigma);
  const hi = Math.max(usl + margin, mean + 3.5 * sigma);
  const width = (hi - lo) / bins;
  const counts = histogramBins(values, lo, hi, bins);
  const peak = (values.length * width) / (sigma * Math.sqrt(2 * Math.PI));
  const top = Math.max(...counts, peak, 1) * 1.08;
  const x = (value: number) => ((value - lo) / (hi - lo)) * 100;
  const curve = Array.from({ length: 49 }, (_, index) => {
    const at = lo + ((hi - lo) * index) / 48;
    return `${x(at)},${100 - ((peak * normalShare(at, mean, sigma)) / top) * 100}`;
  }).join(' ');
  const format = (value: number) => formatNumber(value, decimals);
  const marks: Array<{ id: string; value: number; text: string; kind: 'spec' | 'target' | 'mean' }> = [
    { id: 'lsl', value: lsl, text: `LSL ${format(lsl)}`, kind: 'spec' },
    { id: 'usl', value: usl, text: `USL ${format(usl)}`, kind: 'spec' },
  ];
  if (target !== undefined) marks.push({ id: 'target', value: target, text: `Target ${format(target)}`, kind: 'target' });

  return (
    <ChartFrame
      label={label}
      headline={headline}
      notes={notes}
      height={height}
      className={className}
      legend={[
        { label: 'Results', tone },
        { label: 'Outside specification', tone: 'critical' },
        { label: 'Fitted normal curve', tone: 'neutral', mark: 'line' },
      ]}
    >
      <div className="flex h-full flex-col text-xs leading-4 text-(--kit-text-2) tabular-nums">
        <div className="relative h-5">
          {marks.map((mark) => (
            <span
              key={mark.id}
              data-tone={mark.kind === 'spec' ? 'critical' : undefined}
              className={cx('absolute top-0 -translate-x-1/2 font-medium whitespace-nowrap', mark.kind === 'spec' ? 'text-(--t-ink)' : 'text-(--kit-text)')}
              style={{ left: `${x(mark.value)}%` }}
            >
              {mark.text}
            </span>
          ))}
        </div>
        <div className={cx('relative min-h-0 flex-1 border-b', chart.axisLine ? 'border-(--kit-rule-strong)' : 'border-(--kit-rule)')}>
          <div className="absolute inset-0 flex items-end">
            {counts.map((count, index) => {
              const middle = lo + (index + 0.5) * width;
              const outside = middle < lsl || middle > usl;
              return (
                <span key={index} data-tone={outside ? 'critical' : tone} data-bin={count} className="flex h-full flex-1 items-end px-px">
                  <span className="w-full bg-(--t-solid)" style={{ height: `${(count / top) * 100}%`, borderRadius: `${Math.min(chart.barRadius, 3)}px ${Math.min(chart.barRadius, 3)}px 0 0`, opacity: outside ? 1 : 0.75 }} />
                </span>
              );
            })}
          </div>
          {marks.map((mark) => (
            <span
              key={mark.id}
              aria-hidden="true"
              data-tone={mark.kind === 'spec' ? 'critical' : undefined}
              className={cx('absolute inset-y-0 border-l-2', mark.kind === 'spec' ? 'border-(--t-line)' : 'border-dashed border-(--kit-text)')}
              style={{ left: `${x(mark.value)}%` }}
            />
          ))}
          <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
            <polyline points={curve} fill="none" stroke={toneLine('neutral')} strokeWidth={chart.strokeWidth} vectorEffect="non-scaling-stroke" />
          </svg>
          <span className="absolute bottom-0 flex -translate-x-1/2 translate-y-1/2 flex-col items-center" style={{ left: `${x(mean)}%` }}>
            <span className="h-3 w-3 rotate-45 border-2 border-(--kit-halo) bg-(--kit-text)" />
          </span>
        </div>
        <div className="flex items-baseline justify-between pt-3">
          <span>{format(lo)}</span>
          <span className="font-medium text-(--kit-text)">
            Mean {format(mean)}
            {unit ? ` ${unit}` : ''} · σ {formatNumber(sigma, decimals + 1)}
          </span>
          <span>{format(hi)}</span>
        </div>
      </div>
    </ChartFrame>
  );
}
