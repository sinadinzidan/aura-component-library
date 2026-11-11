import { useLook } from '../../looks/useLook';
import { Legend } from '../Legend';
import { useElementWidth } from '../process-flow/useElementWidth';
import { cx, formatNumber } from '../tones';

import { isUnderperforming, type PowerCurvePoint } from './power';

type PowerCurveProps = {
  /** What is plotted, for assistive technology. */
  label: string;
  /** The warranted curve, ordered by wind speed. */
  curve: readonly PowerCurvePoint[];
  /** Measured averages. */
  points: readonly PowerCurvePoint[];
  ratedPower: number;
  /** Highest wind speed on the axis, m/s. */
  maxWind?: number;
  /** Share under the curve from which a point counts as under-performing. */
  tolerance?: number;
  height?: number;
  className?: string;
};

const MARGIN = { top: 14, right: 16, bottom: 40, left: 46 };

/**
 * Measured power against the warranted curve of a turbine. Points that sit well under the curve
 * are drawn in the warning tone and counted, because they are what the chart is read for. Points
 * are discs in most looks, open circles on a blueprint and squares on a poster.
 */
export function PowerCurve({ label, curve, points, ratedPower, maxWind = 20, tolerance = 0.15, height = 300, className }: PowerCurveProps) {
  const look = useLook();
  const [frame, measured] = useElementWidth<HTMLDivElement>();
  const width = measured > 0 ? measured : 640;
  const plotWidth = width - MARGIN.left - MARGIN.right;
  const plotHeight = height - MARGIN.top - MARGIN.bottom;
  const maxPower = Math.ceil(ratedPower * 1.1);
  const x = (wind: number) => MARGIN.left + (wind / maxWind) * plotWidth;
  const y = (power: number) => MARGIN.top + plotHeight - (power / maxPower) * plotHeight;
  const xTicks = Array.from({ length: Math.floor(maxWind / 5) + 1 }, (_, index) => index * 5);
  const yTicks = Array.from({ length: maxPower + 1 }, (_, index) => index);
  const under = points.filter((point) => isUnderperforming(point, curve, tolerance));
  const path = curve.map((point, index) => `${index === 0 ? 'M' : 'L'} ${x(point.windSpeed)} ${y(point.power)}`).join(' ');
  const open = look === 'blueprint' || look === 'editorial';
  const square = look === 'poster' || look === 'console';
  const radius = look === 'poster' ? 4.5 : 3.5;

  return (
    <figure data-look={look} className={cx('flex w-full min-w-0 flex-col gap-3', className)}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <Legend
          items={[
            { label: 'Warranted curve', tone: 'neutral', mark: 'line' },
            { label: '10-minute average', tone: 'accent' },
            { label: 'Under the curve', tone: 'warning' },
          ]}
        />
        <span data-slot="curve-count" className="text-sm font-medium text-(--kit-text-2) tabular-nums">
          {under.length} of {points.length} points more than {Math.round(tolerance * 100)} % under
        </span>
      </div>
      <div ref={frame} className="w-full min-w-0">
        <svg role="img" aria-label={`${label}. ${under.length} of ${points.length} points sit more than ${Math.round(tolerance * 100)} per cent under the warranted curve.`} width={width} height={height} className="block">
          {yTicks.map((tick) => (
            <g key={tick}>
              <line x1={MARGIN.left} x2={width - MARGIN.right} y1={y(tick)} y2={y(tick)} style={{ stroke: 'var(--kit-grid)' }} strokeWidth={1} />
              <text x={MARGIN.left - 8} y={y(tick) + 4} textAnchor="end" fontSize={12} style={{ fill: 'var(--kit-text-3)', fontVariantNumeric: 'tabular-nums' }}>
                {tick}
              </text>
            </g>
          ))}
          {xTicks.map((tick) => (
            <g key={tick}>
              {look === 'blueprint' || look === 'console' ? <line x1={x(tick)} x2={x(tick)} y1={MARGIN.top} y2={MARGIN.top + plotHeight} style={{ stroke: 'var(--kit-grid)' }} strokeWidth={1} /> : null}
              <text x={x(tick)} y={MARGIN.top + plotHeight + 18} textAnchor="middle" fontSize={12} style={{ fill: 'var(--kit-text-3)', fontVariantNumeric: 'tabular-nums' }}>
                {tick}
              </text>
            </g>
          ))}
          <line x1={MARGIN.left} x2={width - MARGIN.right} y1={MARGIN.top + plotHeight} y2={MARGIN.top + plotHeight} style={{ stroke: 'var(--kit-rule-strong)' }} strokeWidth={1} />
          <text x={MARGIN.left + plotWidth / 2} y={height - 4} textAnchor="middle" fontSize={12} style={{ fill: 'var(--kit-text-2)' }}>
            Wind speed, m/s
          </text>
          <text x={12} y={MARGIN.top + plotHeight / 2} textAnchor="middle" fontSize={12} transform={`rotate(-90 12 ${MARGIN.top + plotHeight / 2})`} style={{ fill: 'var(--kit-text-2)' }}>
            Power, MW
          </text>
          <line x1={MARGIN.left} x2={width - MARGIN.right} y1={y(ratedPower)} y2={y(ratedPower)} style={{ stroke: 'var(--kit-text-3)' }} strokeWidth={1} strokeDasharray="4 4" />
          <text x={width - MARGIN.right - 4} y={y(ratedPower) - 6} textAnchor="end" fontSize={12} fontWeight={600} style={{ fill: 'var(--kit-text-2)', stroke: 'var(--kit-halo)', strokeWidth: 4, paintOrder: 'stroke' }}>
            Rated {formatNumber(ratedPower, 1)} MW
          </text>
          <path d={path} fill="none" style={{ stroke: 'var(--kit-line-neutral)' }} strokeWidth={look === 'poster' ? 4 : 2.5} strokeLinejoin="round" />
          {points.map((point, index) => {
            const low = isUnderperforming(point, curve, tolerance);
            const paint = { fill: open ? 'var(--kit-halo)' : 'var(--t-line)', fillOpacity: open ? 1 : low ? 1 : 0.7, stroke: open ? 'var(--t-line)' : look === 'poster' ? 'var(--kit-text)' : 'none', strokeWidth: 1.5 };
            return square ? (
              <rect key={index} data-tone={low ? 'warning' : 'accent'} data-point={low ? 'under' : 'ok'} x={x(point.windSpeed) - radius} y={y(point.power) - radius} width={radius * 2} height={radius * 2} style={paint} />
            ) : (
              <circle key={index} data-tone={low ? 'warning' : 'accent'} data-point={low ? 'under' : 'ok'} cx={x(point.windSpeed)} cy={y(point.power)} r={radius} style={paint} />
            );
          })}
        </svg>
      </div>
    </figure>
  );
}
