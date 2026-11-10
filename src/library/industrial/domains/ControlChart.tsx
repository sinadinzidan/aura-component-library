import { cn } from '../../../lib/utils';
import { SCALE_TEXT, formatReading, formatValue } from '../status';

import { RUN_RULE_TEXT, runRuleViolations } from './spc';
import type { ControlLimits, RunRuleViolation } from './spc';

export type ControlChartProps = {
  /** What is plotted, e.g. "Wobbe index, subgroup means". */
  label: string;
  /** One point per subgroup, oldest first. */
  values: readonly number[];
  limits: ControlLimits;
  /** Points to mark. Defaults to the run-rule violations of `values` against `limits`; pass `[]` to mark none. */
  violations?: readonly RunRuleViolation[];
  /** One x label per point; the first, middle and last are printed. */
  categories?: readonly string[];
  unit?: string;
  decimals?: number;
  /** Height of the plot in pixels. */
  height?: number;
  /** Faint lines at one and two sigma either side of the centre line. */
  showSigmaLines?: boolean;
  /** Name of the centre line in the margin: "CL", "X̿" or "R̄". */
  centerLabel?: string;
  className?: string;
};

const LINE = { vectorEffect: 'non-scaling-stroke' } as const;

/**
 * A Shewhart control chart: the points, a centre line and the control limits, with every point
 * that breaks a run rule drawn as a numbered diamond. The limit values are printed in the margin,
 * so the chart needs no y axis.
 */
export function ControlChart({
  label,
  values,
  limits,
  violations,
  categories,
  unit,
  decimals = 1,
  height = 176,
  showSigmaLines = false,
  centerLabel = 'CL',
  className,
}: ControlChartProps) {
  const marked = violations ?? runRuleViolations(values, limits);
  const ruleAt = new Map(marked.map((violation) => [violation.index, violation.rule]));
  const lowest = Math.min(limits.lcl, ...values);
  const highest = Math.max(limits.ucl, ...values);
  const padding = (highest - lowest || 1) * 0.14;
  const domainMin = lowest - padding;
  const domainMax = highest + padding;
  const y = (value: number): number => ((domainMax - value) / (domainMax - domainMin)) * 100;
  const x = (index: number): number => (values.length > 1 ? (index / (values.length - 1)) * 100 : 50);
  const sigma = (limits.ucl - limits.center) / 3;
  const sigmaLines = showSigmaLines ? [-2, -1, 1, 2].map((step) => limits.center + step * sigma) : [];
  const margin = [
    { key: 'ucl', text: `UCL ${formatValue(limits.ucl, decimals)}`, at: limits.ucl },
    { key: 'center', text: `${centerLabel} ${formatValue(limits.center, decimals)}`, at: limits.center },
    { key: 'lcl', text: `LCL ${formatValue(limits.lcl, decimals)}`, at: limits.lcl },
  ];
  const tickIndexes = categories && categories.length > 2 ? [0, Math.floor((categories.length - 1) / 2), categories.length - 1] : [];
  const name = `${label}: ${values.length} points, centre line ${formatReading(limits.center, unit, decimals)}, control limits ${formatValue(
    limits.lcl,
    decimals
  )} to ${formatReading(limits.ucl, unit, decimals)}, ${marked.length === 0 ? 'no run-rule violations' : `${marked.length} run-rule ${marked.length === 1 ? 'violation' : 'violations'}`}`;

  return (
    <div data-slot="control-chart" className={cn('flex w-full min-w-0 flex-col gap-1.5', className)}>
      <div role="img" aria-label={name} className="flex w-full">
        <div className="relative min-w-0 flex-1" style={{ height }}>
          <div className="absolute inset-x-2 inset-y-0">
            <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" fill="none" className="absolute inset-0 size-full overflow-visible">
              {sigmaLines.map((value) => (
                <line key={value} data-slot="sigma-line" x1={-2} x2={102} y1={y(value)} y2={y(value)} strokeWidth={1} className="stroke-chart-gridlines" {...LINE} />
              ))}
              <line data-slot="limit-line" x1={-2} x2={102} y1={y(limits.ucl)} y2={y(limits.ucl)} strokeWidth={1} strokeDasharray="4 3" className="stroke-chart-critical-450" {...LINE} />
              <line data-slot="limit-line" x1={-2} x2={102} y1={y(limits.lcl)} y2={y(limits.lcl)} strokeWidth={1} strokeDasharray="4 3" className="stroke-chart-critical-450" {...LINE} />
              <line data-slot="center-line" x1={-2} x2={102} y1={y(limits.center)} y2={y(limits.center)} strokeWidth={1} className="stroke-chart-neutral-400" {...LINE} />
              <polyline
                data-slot="series"
                points={values.map((value, index) => `${x(index)},${y(value)}`).join(' ')}
                strokeWidth={1.5}
                strokeLinejoin="round"
                className="stroke-chart-1-450"
                {...LINE}
              />
            </svg>
            {values.map((value, index) => {
              const rule = ruleAt.get(index);
              return rule === undefined ? (
                <span
                  key={index}
                  data-slot="point"
                  className="absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-chart-1-450"
                  style={{ left: `${x(index)}%`, top: `${y(value)}%` }}
                />
              ) : (
                <span
                  key={index}
                  data-slot="violation"
                  data-rule={rule}
                  title={`${RUN_RULE_TEXT[rule]}: ${formatReading(value, unit, decimals)}`}
                  className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
                  style={{ left: `${x(index)}%`, top: `${y(value)}%` }}
                >
                  <span className="absolute bottom-full pb-1 text-xs font-medium leading-none tabular-nums text-critical-foreground-strong">{rule}</span>
                  <span className="size-2.5 rotate-45 bg-chart-critical-450" />
                </span>
              );
            })}
          </div>
        </div>
        <div aria-hidden="true" className="relative w-20 shrink-0">
          {margin.map((entry) => (
            <span key={entry.key} className={cn(SCALE_TEXT, 'absolute left-2 -translate-y-1/2 whitespace-nowrap leading-none')} style={{ top: `${y(entry.at)}%` }}>
              {entry.text}
            </span>
          ))}
        </div>
      </div>
      {tickIndexes.length > 0 && categories ? (
        <div aria-hidden="true" className={cn(SCALE_TEXT, 'mr-20 flex justify-between px-2 leading-none')}>
          {tickIndexes.map((index) => (
            <span key={index}>{categories[index]}</span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
