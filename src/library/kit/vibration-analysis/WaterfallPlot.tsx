import { useLookDefinition } from '../../looks/useLook';
import { cx, formatNumber, niceTicks, toneLine, type Tone } from '../tones';

import type { SpectrumLine } from './signal';

export type WaterfallRow = { label: string; lines: readonly SpectrumLine[] };

type WaterfallPlotProps = {
  /** What the stack shows: "Spectra over eight weeks, pump drive end". */
  label: string;
  /** Oldest first; the last row is drawn in front. */
  rows: readonly WaterfallRow[];
  maxHz: number;
  /** Amplitude that fills the height given to one row. */
  yMax?: number;
  tone?: Tone;
  height?: number;
  className?: string;
};

/**
 * Spectra stacked in time, oldest at the back, so a line that grows — or one that appears — can
 * be followed across surveys. Each row hides what is behind it, like a ridge line.
 */
export function WaterfallPlot({ label, rows, maxHz, yMax, tone = 'accent', height = 280, className }: WaterfallPlotProps) {
  const { id: look, chart } = useLookDefinition();
  const top = yMax ?? Math.max(...rows.flatMap((row) => row.lines.map((line) => line.amplitude)), 0.1);
  const count = rows.length;
  const rowHeight = 60;
  const stepY = count > 1 ? (100 - rowHeight) / (count - 1) : 0;
  const stepX = count > 1 ? 14 / (count - 1) : 0;
  const color = toneLine(tone);
  const filled = chart.area !== 'none';

  return (
    <div data-look={look} className={cx('flex min-w-0 flex-col gap-1 text-xs text-(--kit-text-2) tabular-nums', className)}>
      <div className="flex min-w-0 gap-3">
        <div role="img" aria-label={label} className="relative min-w-0 flex-1" style={{ height }}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" className="absolute inset-0 size-full overflow-visible">
            {rows.map((row, index) => {
              const depth = count - 1 - index;
              const base = 100 - depth * stepY;
              const shift = depth * stepX;
              const x = (hz: number) => shift + (Math.min(hz, maxHz) / maxHz) * 86;
              const y = (amplitude: number) => base - Math.min(1.4, amplitude / top) * rowHeight;
              const trace = row.lines.map((line) => `${x(line.hz).toFixed(2)},${y(line.amplitude).toFixed(2)}`).join(' ');
              const front = index === count - 1;
              return (
                <g key={row.label}>
                  <polygon points={`${x(0)},${base} ${trace} ${x(maxHz)},${base}`} fill={filled ? `color-mix(in oklab, ${color} ${front ? 30 : 10}%, var(--kit-surface))` : 'var(--kit-surface)'} />
                  <polyline
                    points={trace}
                    fill="none"
                    stroke={front ? color : `color-mix(in oklab, ${color} ${Math.round(35 + (index / count) * 45)}%, var(--kit-text-3))`}
                    strokeWidth={front ? Math.min(chart.strokeWidth, 2) : 1.1}
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </g>
              );
            })}
          </svg>
        </div>
        <ol aria-hidden="true" className="relative w-18 shrink-0" style={{ height }}>
          {rows.map((row, index) => (
            <li key={row.label} className={cx('absolute left-0 -translate-y-full whitespace-nowrap', index === count - 1 ? 'font-semibold text-(--kit-text)' : '')} style={{ top: `${100 - (count - 1 - index) * stepY}%` }}>
              {row.label}
            </li>
          ))}
        </ol>
      </div>
      <div aria-hidden="true" className="flex gap-3">
        <div className="relative h-4 min-w-0 flex-1">
          {niceTicks(maxHz, 4)
            .filter((tick) => tick <= maxHz)
            .map((tick) => (
              <span key={tick} className={cx('absolute', tick === 0 ? '' : '-translate-x-1/2')} style={{ left: `${(tick / maxHz) * 86}%` }}>
                {formatNumber(tick)}
              </span>
            ))}
        </div>
        <span className="w-18 shrink-0 font-medium">Hz</span>
      </div>
    </div>
  );
}
