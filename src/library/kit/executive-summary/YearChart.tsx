import { useLook } from '../../looks/useLook';
import { cx, formatNumber } from '../tones';

import { annotationNumbers, type YearPoint } from './annotations';

type YearChartProps = {
  /** What the chart shows, in words. */
  label: string;
  points: readonly YearPoint[];
  /** Id of the point in focus. */
  selected: string;
  onSelect: (id: string) => void;
  /** The level every point is measured against. */
  plan: number;
  planLabel?: string;
  unit?: string;
  decimals?: number;
  /** Plot height in px. */
  height?: number;
  className?: string;
};

const percent = (share: number): string => `${(share * 100).toFixed(2)}%`;

/**
 * A year of monthly figures against a plan, drawn the editorial way: a thin line, a stem from the
 * plan to every point so over and under read at a glance, numbered marks where something
 * happened, and one month in focus. Every month is a button, so the chart is also the month
 * switch of the page around it.
 */
export function YearChart({ label, points, selected, onSelect, plan, planLabel = 'Plan', unit = '', decimals = 2, height = 300, className }: YearChartProps) {
  const look = useLook();
  const values = points.map((point) => point.value);
  const low = Math.min(...values, plan);
  const high = Math.max(...values, plan);
  const pad = (high - low || 1) * 0.22;
  const min = low - pad;
  const max = high + pad * 1.6;
  const y = (value: number): number => 1 - (value - min) / (max - min);
  const band = 1 / Math.max(points.length, 1);
  const x = (index: number): number => (index + 0.5) * band;
  const numbers = annotationNumbers(points);
  const ticks = [plan, low, high].filter((tick, index, all) => all.findIndex((other) => Math.abs(y(other) - y(tick)) < 0.09) === index);
  const suffix = unit ? ` ${unit}` : '';

  return (
    <figure data-look={look} className={cx('min-w-0', className)}>
      <div role="group" aria-label={label} className="relative w-full" style={{ height: height + 48 }}>
        {ticks.map((tick) => (
          <span key={tick} className="absolute left-0 w-10 -translate-y-1/2 text-right text-xs tabular-nums text-[var(--kit-text-3)]" style={{ top: `calc(${height}px * ${y(tick).toFixed(4)})` }}>
            {formatNumber(tick, decimals)}
          </span>
        ))}
        <div className="absolute inset-y-0 left-12 right-0">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" className="absolute inset-x-0 top-0 w-full overflow-visible" style={{ height }}>
            <line x1="0" x2="100" y1="100" y2="100" stroke="var(--kit-rule-strong)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            {points.map((point, index) => (
              <line
                key={point.id}
                x1={x(index) * 100}
                x2={x(index) * 100}
                y1={y(plan) * 100}
                y2={y(point.value) * 100}
                vectorEffect="non-scaling-stroke"
                stroke={point.value < plan ? 'var(--kit-line-critical)' : 'var(--kit-line-success)'}
                strokeWidth={point.id === selected ? 5 : 3}
                opacity={point.id === selected ? 0.75 : 0.38}
              />
            ))}
            <line x1="0" x2="100" y1={y(plan) * 100} y2={y(plan) * 100} stroke="var(--kit-text)" strokeWidth="1" strokeDasharray="5 4" vectorEffect="non-scaling-stroke" />
            <polyline
              points={points.map((point, index) => `${(x(index) * 100).toFixed(2)},${(y(point.value) * 100).toFixed(2)}`).join(' ')}
              fill="none"
              stroke="var(--kit-text)"
              strokeWidth="1.75"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <span
            className={cx('absolute left-0 whitespace-nowrap text-xs font-medium tabular-nums text-[var(--kit-text)]', (points[0]?.value ?? plan) < plan ? '-translate-y-full pb-1' : 'pt-1')}
            style={{ top: height * y(plan) }}
          >
            {planLabel}
          </span>
          {points.map((point, index) => {
            const active = point.id === selected;
            const number = numbers.get(point.id);
            const top = height * y(point.value);
            return (
              <button
                key={point.id}
                type="button"
                aria-pressed={active}
                aria-label={`${point.name}: ${formatNumber(point.value, decimals)}${suffix}`}
                onClick={() => onSelect(point.id)}
                className={cx(
                  'group absolute inset-y-0 cursor-pointer outline-none transition-colors focus-visible:[box-shadow:inset_0_0_0_2px_var(--kit-text)]',
                  active ? 'bg-[color-mix(in_oklab,var(--kit-text)_7%,transparent)]' : 'hover:bg-[color-mix(in_oklab,var(--kit-text)_4%,transparent)]'
                )}
                style={{ left: percent(index * band), width: percent(band) }}
              >
                {number === undefined ? null : (
                  <span
                    data-annotation={number}
                    className={cx(
                      'absolute left-1/2 top-1.5 flex size-5 -translate-x-1/2 items-center justify-center rounded-full border text-xs font-semibold tabular-nums',
                      active ? 'border-[var(--kit-text)] bg-[var(--kit-text)] text-[var(--base-background)]' : 'border-[var(--kit-text)] text-[var(--kit-text)]'
                    )}
                  >
                    {number}
                  </span>
                )}
                {number === undefined ? null : <span className="absolute left-1/2 w-px -translate-x-1/2 bg-[var(--kit-text-3)]" style={{ top: 28, height: Math.max(0, top - 36) }} />}
                <span
                  className={cx(
                    'absolute left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full',
                    active ? 'size-3.5 bg-[var(--kit-line-accent)] shadow-[0_0_0_3px_var(--base-background)]' : 'size-2 bg-[var(--kit-text)] shadow-[0_0_0_2px_var(--base-background)]'
                  )}
                  style={{ top }}
                />
                {active ? (
                  <span
                    data-current=""
                    className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap bg-[var(--kit-line-accent)] px-1.5 py-0.5 text-xs font-semibold tabular-nums text-[var(--base-background)]"
                    style={point.value < plan ? { top: top + 12 } : { top: top - 34 }}
                  >
                    {formatNumber(point.value, decimals)}
                  </span>
                ) : null}
                <span className={cx('absolute inset-x-0 text-center text-xs', active ? 'font-semibold text-[var(--kit-text)]' : 'text-[var(--kit-text-3)]')} style={{ top: height + 8 }}>
                  {point.label}
                </span>
                {point.group ? (
                  <span className="absolute inset-x-0 text-center text-xs font-medium text-[var(--kit-text-2)]" style={{ top: height + 26 }}>
                    {point.group}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </figure>
  );
}
