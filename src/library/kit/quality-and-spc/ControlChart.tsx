import type { ReactNode } from 'react';

import { useLookDefinition } from '../../looks/useLook';
import { ChartFrame } from '../ChartFrame';
import { cx, formatNumber, toneLine, type Tone } from '../tones';

import { axisTicks, runRules } from './spc';

type ControlChartProps = {
  /** What the chart shows, in words. */
  label: string;
  /** One value per subgroup, oldest first. */
  values: readonly number[];
  /** Subgroup names for the x axis, same length as `values`. */
  labels: readonly string[];
  center: number;
  ucl: number;
  lcl: number;
  /** Customer limits, drawn differently from the control limits. */
  spec?: { lsl?: number; usl?: number };
  /** Name of the centre line: "X̿" for a mean chart, "R̄" for a range chart. */
  centerLabel?: string;
  unit?: string;
  decimals?: number;
  /** Shade the outer third between the centre line and each control limit. */
  zones?: boolean;
  tone?: Tone;
  /** Print every n-th x label. */
  labelEvery?: number;
  height?: number;
  /** Index of the highlighted point. */
  selected?: number;
  /** Makes flagged points buttons. */
  onSelect?: (index: number) => void;
  headline?: ReactNode;
  notes?: ReactNode;
  className?: string;
};

/**
 * A Shewhart control chart: the subgroup values as a line, the centre line and control limits
 * labelled at the right edge, and every point that breaks a run rule drawn as a numbered marker
 * (the number is the rule). Specification limits, when given, are drawn solid in the critical
 * colour so they are never mistaken for the dashed control limits.
 */
export function ControlChart({
  label,
  values,
  labels,
  center,
  ucl,
  lcl,
  spec,
  centerLabel = 'CL',
  unit = '',
  decimals = 2,
  zones = false,
  tone = 'accent',
  labelEvery = 5,
  height = 280,
  selected,
  onSelect,
  headline,
  notes,
  className,
}: ControlChartProps) {
  const { chart } = useLookDefinition();
  const flags = runRules(values, center, ucl, lcl);
  const extremes = [...values, ucl, lcl, spec?.lsl ?? lcl, spec?.usl ?? ucl];
  const pad = (Math.max(...extremes) - Math.min(...extremes)) * 0.1 || 1;
  const lo = Math.min(...extremes) - pad;
  const hi = Math.max(...extremes) + pad;
  const y = (value: number) => ((value - lo) / (hi - lo)) * 100;
  const x = (index: number) => (values.length > 1 ? (index / (values.length - 1)) * 100 : 50);
  const third = (ucl - center) / 3;
  const format = (value: number) => formatNumber(value, decimals);
  const lines: Array<{ id: string; value: number; text: string; kind: 'control' | 'center' | 'spec' }> = [
    { id: 'ucl', value: ucl, text: `UCL ${format(ucl)}`, kind: 'control' },
    { id: 'cl', value: center, text: `${centerLabel} ${format(center)}`, kind: 'center' },
    { id: 'lcl', value: lcl, text: `LCL ${format(lcl)}`, kind: 'control' },
  ];
  if (spec?.usl !== undefined) lines.push({ id: 'usl', value: spec.usl, text: `USL ${format(spec.usl)}`, kind: 'spec' });
  if (spec?.lsl !== undefined) lines.push({ id: 'lsl', value: spec.lsl, text: `LSL ${format(spec.lsl)}`, kind: 'spec' });
  const flagTone = (rule: number): Tone => (rule === 1 ? 'critical' : 'warning');

  return (
    <ChartFrame
      label={label}
      headline={headline}
      notes={notes}
      height={height}
      className={className}
      legend={[
        { label: 'Subgroup value', tone, mark: 'line' },
        { label: 'Control limits', tone: 'neutral', mark: 'dashed' },
        ...(spec ? [{ label: 'Specification', tone: 'critical' as const, mark: 'line' as const }] : []),
        { label: 'Breaks a run rule', tone: 'critical' },
      ]}
    >
      <div className="grid h-full text-xs leading-4 text-(--kit-text-2) tabular-nums" style={{ gridTemplateColumns: 'auto minmax(0, 1fr) auto', gridTemplateRows: 'auto minmax(0, 1fr) auto' }}>
        <span className="col-span-3 pb-2 font-medium">{unit}</span>
        <div className="relative w-11">
          {axisTicks(lo, hi).map((tick) => (
            <span key={tick} className="absolute right-2 translate-y-1/2" style={{ bottom: `${y(tick)}%` }}>
              {format(tick)}
            </span>
          ))}
        </div>
        <div data-plot="" className={cx('relative border-b border-l', chart.axisLine ? 'border-(--kit-rule-strong)' : 'border-(--kit-rule)')}>
          {zones ? (
            <>
              <span aria-hidden="true" data-zone="upper" className="absolute inset-x-0 bg-(--kit-track)" style={{ bottom: `${y(center + 2 * third)}%`, height: `${y(ucl) - y(center + 2 * third)}%` }} />
              <span aria-hidden="true" data-zone="lower" className="absolute inset-x-0 bg-(--kit-track)" style={{ bottom: `${y(lcl)}%`, height: `${y(center - 2 * third) - y(lcl)}%` }} />
            </>
          ) : null}
          {lines.map((line) => (
            <span
              key={line.id}
              aria-hidden="true"
              data-line={line.id}
              data-tone={line.kind === 'spec' ? 'critical' : undefined}
              className={cx(
                'absolute inset-x-0 border-t',
                line.kind === 'control' && 'border-dashed border-(--kit-text-2)',
                line.kind === 'center' && 'border-(--kit-text-3)',
                line.kind === 'spec' && 'border-t-2 border-(--t-line)',
              )}
              style={{ bottom: `${y(line.value)}%` }}
            />
          ))}
          <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
            <polyline
              points={values.map((value, index) => `${x(index)},${100 - y(value)}`).join(' ')}
              fill="none"
              stroke={toneLine(tone)}
              strokeWidth={chart.strokeWidth}
              vectorEffect="non-scaling-stroke"
              strokeLinejoin="round"
            />
          </svg>
          {values.map((value, index) => {
            const flag = flags.find((candidate) => candidate.index === index);
            const position = { left: `${x(index)}%`, bottom: `${y(value)}%` };
            if (!flag) {
              return <span key={index} aria-hidden="true" className="absolute h-1.5 w-1.5 -translate-x-1/2 translate-y-1/2 rounded-full" style={{ ...position, background: toneLine(tone) }} />;
            }
            const marker = cx(
              'absolute flex h-5 w-5 -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full bg-(--t-solid) text-xs leading-none font-semibold text-(--t-on-solid) ring-2 ring-(--kit-halo)',
              selected === index && 'outline-2 outline-offset-2 outline-(--kit-text)',
            );
            const name = `${labels[index]}: ${format(value)}${unit ? ` ${unit}` : ''}, rule ${flag.rule}, ${flag.text.toLowerCase()}`;
            return onSelect ? (
              <button key={index} type="button" data-flag={flag.rule} data-tone={flagTone(flag.rule)} aria-label={name} aria-pressed={selected === index} onClick={() => onSelect(index)} className={cx(marker, 'cursor-pointer')} style={position}>
                {flag.rule}
              </button>
            ) : (
              <span key={index} data-flag={flag.rule} data-tone={flagTone(flag.rule)} title={name} className={marker} style={position}>
                {flag.rule}
              </span>
            );
          })}
        </div>
        <div className="relative w-22">
          {lines.map((line) => (
            <span
              key={line.id}
              data-tone={line.kind === 'spec' ? 'critical' : undefined}
              className={cx('absolute left-2 translate-y-1/2 font-medium whitespace-nowrap', line.kind === 'spec' ? 'text-(--t-ink)' : 'text-(--kit-text)')}
              style={{ bottom: `${y(line.value)}%` }}
            >
              {line.text}
            </span>
          ))}
        </div>
        <span />
        <div className="relative h-6">
          {labels.map((text, index) =>
            index % labelEvery === 0 ? (
              <span key={text} className={cx('absolute top-1.5 whitespace-nowrap', index === 0 ? '' : '-translate-x-1/2')} style={{ left: `${x(index)}%` }}>
                {text}
              </span>
            ) : null,
          )}
        </div>
        <span />
      </div>
    </ChartFrame>
  );
}
