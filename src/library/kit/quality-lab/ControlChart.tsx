import type { CSSProperties } from 'react';

import { useLook } from '../../looks/useLook';
import { cx, formatNumber } from '../tones';

import { SPC_RULE_TEXT, type SpcLimits, type SpcSpec, type SpcViolation } from './spc';

type ControlChartProps = {
  /** What the chart shows, in words. */
  label: string;
  /** Results in time order; the last one is the result under review. */
  values: readonly number[];
  /** One label per result for the x axis; every `labelEvery`-th is drawn. */
  labels: readonly string[];
  limits: SpcLimits;
  spec?: SpcSpec;
  violations?: readonly SpcViolation[];
  unit?: string;
  decimals?: number;
  /** Shade the A, B and C zones between the control limits. */
  zones?: boolean;
  /** Plot height in px. */
  height?: number;
  labelEvery?: number;
  /** Hide the gutters with limit values, for a small multiple. */
  compact?: boolean;
  className?: string;
};

type Band = { id: string; from: number; to: number; tone: 'success' | 'warning' | 'critical'; strength: number; letter?: string };

const percent = (share: number): string => `${(share * 100).toFixed(2)}%`;

/**
 * An individuals control chart: results against the centre line and the three-sigma limits of an
 * earlier baseline, with the A, B and C zones shaded, specification limits drawn where they fit
 * the scale, and every result that breaks a run rule marked with the number of the rule.
 */
export function ControlChart({
  label,
  values,
  labels,
  limits,
  spec = {},
  violations = [],
  unit = '',
  decimals = 1,
  zones = true,
  height = 320,
  labelEvery = 4,
  compact = false,
  className,
}: ControlChartProps) {
  const look = useLook();
  const { mean, sigma, ucl, lcl } = limits;
  const reach = Math.max(ucl - lcl, Number.EPSILON);
  const low = Math.min(lcl - sigma * 0.9, ...values.map((value) => value - sigma * 0.5));
  const high = Math.max(ucl + sigma * 0.9, ...values.map((value) => value + sigma * 0.5));
  // A specification limit far outside the control limits would flatten the chart: only draw it nearby.
  const fits = (limit: number | undefined): limit is number => limit !== undefined && limit > low - reach * 0.35 && limit < high + reach * 0.35;
  const min = Math.min(low, fits(spec.lsl) ? spec.lsl - sigma * 0.6 : low);
  const max = Math.max(high, fits(spec.usl) ? spec.usl + sigma * 0.6 : high);
  const span = max - min || 1;
  const y = (value: number): number => 1 - (value - min) / span;
  // Points keep clear of the edges: the zone letters sit in the strip on the left.
  const inset = compact ? 0.02 : 0.05;
  const x = (index: number): number => (values.length > 1 ? inset + (index / (values.length - 1)) * (1 - inset - 0.015) : 0.5);
  const suffix = unit ? ` ${unit}` : '';
  const lastIndex = values.length - 1;
  const lastValue = values[lastIndex];
  const ruleAt = new Map(violations.map((violation) => [violation.index, violation.rule]));
  const lastRule = ruleAt.get(lastIndex);

  const bands: Band[] = [
    { id: 'out-high', from: ucl, to: max, tone: 'critical', strength: 9 },
    { id: 'a-high', from: mean + 2 * sigma, to: ucl, tone: 'warning', strength: 20, letter: 'A' },
    { id: 'b-high', from: mean + sigma, to: mean + 2 * sigma, tone: 'warning', strength: 9, letter: 'B' },
    { id: 'c-high', from: mean, to: mean + sigma, tone: 'success', strength: 12, letter: 'C' },
    { id: 'c-low', from: mean - sigma, to: mean, tone: 'success', strength: 12, letter: 'C' },
    { id: 'b-low', from: mean - 2 * sigma, to: mean - sigma, tone: 'warning', strength: 9, letter: 'B' },
    { id: 'a-low', from: lcl, to: mean - 2 * sigma, tone: 'warning', strength: 20, letter: 'A' },
    { id: 'out-low', from: min, to: lcl, tone: 'critical', strength: 9 },
  ];

  const gutter: CSSProperties = compact ? { left: 0, right: 0, top: 8, bottom: 8 } : { left: 60, right: 96, top: 12, bottom: 30 };
  const rules = [
    { id: 'ucl', value: ucl, name: 'UCL', strong: true },
    { id: 'cl', value: mean, name: 'Centre', strong: true },
    { id: 'lcl', value: lcl, name: 'LCL', strong: true },
  ];
  const ticks = [ucl, mean + sigma * 1.5, mean, mean - sigma * 1.5, lcl];

  return (
    <figure data-look={look} className={cx('flex min-w-0 flex-col', className)}>
      <div role="img" aria-label={label} className="relative w-full" style={{ height }}>
        {compact
          ? null
          : ticks.map((tick) => (
              <span
                key={tick}
                className="absolute left-0 w-[52px] -translate-y-1/2 text-right text-xs text-[var(--kit-text-3)] tabular-nums"
                style={{ top: `calc(12px + (100% - 42px) * ${y(tick).toFixed(4)})` }}
              >
                {formatNumber(tick, decimals)}
              </span>
            ))}
        <div className="absolute" style={gutter}>
          <div className="absolute inset-0 overflow-hidden rounded-[var(--kit-radius-sm)]">
            {zones
              ? bands.map((band) => (
                  <span
                    key={band.id}
                    data-zone={band.id}
                    className="absolute inset-x-0"
                    style={{
                      top: percent(y(band.to)),
                      height: percent(y(band.from) - y(band.to)),
                      background: `color-mix(in oklab, var(--kit-line-${band.tone}) ${band.strength}%, transparent)`,
                    }}
                  >
                    {band.letter && !compact ? (
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-[var(--kit-text-3)]">{band.letter}</span>
                    ) : null}
                  </span>
                ))
              : null}
          </div>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" className="absolute inset-0 size-full overflow-visible">
            {rules.map((rule) => (
              <line
                key={rule.id}
                x1="0"
                x2="100"
                y1={y(rule.value) * 100}
                y2={y(rule.value) * 100}
                vectorEffect="non-scaling-stroke"
                stroke={rule.id === 'cl' ? 'var(--kit-text-3)' : 'var(--kit-line-critical)'}
                strokeWidth={rule.id === 'cl' ? 1 : 1.5}
                strokeDasharray={rule.id === 'cl' ? undefined : '6 4'}
              />
            ))}
            {[spec.lsl, spec.usl].filter(fits).map((limit) => (
              <line key={limit} x1="0" x2="100" y1={y(limit) * 100} y2={y(limit) * 100} vectorEffect="non-scaling-stroke" stroke="var(--kit-text)" strokeWidth={1.5} />
            ))}
            <polyline
              points={values.map((value, index) => `${(x(index) * 100).toFixed(2)},${(y(value) * 100).toFixed(2)}`).join(' ')}
              fill="none"
              vectorEffect="non-scaling-stroke"
              stroke="var(--kit-line-accent)"
              strokeWidth={2}
              strokeLinejoin="round"
            />
          </svg>
          {values.map((value, index) => {
            const rule = ruleAt.get(index);
            const position: CSSProperties = { left: percent(x(index)), top: percent(y(value)) };
            if (rule !== undefined && !compact) {
              return (
                <span
                  key={index}
                  data-rule={rule}
                  title={`${SPC_RULE_TEXT[rule]}: ${formatNumber(value, decimals)}${suffix}`}
                  className="absolute flex size-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--kit-line-critical)] text-xs font-bold text-[var(--kit-surface)] shadow-[0_0_0_3px_var(--kit-halo)]"
                  style={position}
                >
                  {rule}
                </span>
              );
            }
            return (
              <span
                key={index}
                data-rule={rule}
                className={cx(
                  'absolute -translate-x-1/2 -translate-y-1/2 rounded-full',
                  rule !== undefined ? 'size-2.5 bg-[var(--kit-line-critical)]' : 'size-2 bg-[var(--kit-line-accent)]',
                  compact ? '' : 'shadow-[0_0_0_2px_var(--kit-halo)]'
                )}
                style={position}
              />
            );
          })}
          {lastValue !== undefined && !compact ? (
            <span
              data-current=""
              className={cx(
                'absolute -translate-y-1/2 translate-x-3 whitespace-nowrap rounded-[var(--kit-radius-sm)] px-2 py-0.5 text-xs font-semibold tabular-nums text-[var(--kit-surface)]',
                lastRule === undefined ? 'bg-[var(--kit-line-accent)]' : 'bg-[var(--kit-line-critical)]'
              )}
              style={{ left: '100%', top: percent(y(lastValue)) }}
            >
              {formatNumber(lastValue, decimals)}
              {suffix}
            </span>
          ) : null}
          {compact
            ? null
            : rules
                .filter((rule) => lastValue === undefined || Math.abs(y(rule.value) - y(lastValue)) > 0.07)
                .map((rule) => (
                  <span
                    key={rule.id}
                    className={cx(
                      'absolute left-full ml-3 -translate-y-1/2 whitespace-nowrap text-xs font-medium tabular-nums',
                      rule.id === 'cl' ? 'text-[var(--kit-text-2)]' : 'text-[var(--kit-line-critical)]'
                    )}
                    style={{ top: percent(y(rule.value)) }}
                  >
                    {rule.name} {formatNumber(rule.value, decimals)}
                  </span>
                ))}
          {compact
            ? null
            : [
                { id: 'usl', value: spec.usl, name: 'Upper spec' },
                { id: 'lsl', value: spec.lsl, name: 'Lower spec' },
              ].map((limit) =>
                fits(limit.value) ? (
                  <span
                    key={limit.id}
                    className="absolute left-8 -translate-y-full whitespace-nowrap pb-0.5 text-xs font-semibold tabular-nums text-[var(--kit-text)]"
                    style={{ top: percent(y(limit.value)) }}
                  >
                    {limit.name} {formatNumber(limit.value, decimals)}
                    {suffix}
                  </span>
                ) : null
              )}
          {compact
            ? null
            : labels.map((text, index) =>
                (lastIndex - index) % labelEvery === 0 ? (
                  <span
                    key={index}
                    className={cx(
                      'absolute top-full mt-2 whitespace-nowrap text-xs tabular-nums',
                      index === lastIndex ? '-translate-x-full font-semibold text-[var(--kit-text)]' : '-translate-x-1/2 text-[var(--kit-text-3)]'
                    )}
                    style={{ left: index === lastIndex ? '100%' : percent(x(index)) }}
                  >
                    {text}
                  </span>
                ) : null
              )}
        </div>
      </div>
    </figure>
  );
}
