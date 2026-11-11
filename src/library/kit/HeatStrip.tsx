import type { CSSProperties } from 'react';

import { useLook } from '../looks/useLook';

import { cx, type Tone } from './tones';

export type HeatRow = { label: string; values: readonly number[]; tone?: Tone };

type HeatStripProps = {
  /** What the strip shows, for example "Alarms per hour by area, last 24 hours". */
  label: string;
  rows: readonly HeatRow[];
  /** Captions under the first and last cell: `['Mon', 'Sun']`. */
  axis?: readonly [string, string];
  /** Value that maps to the strongest colour. Defaults to the largest value in all rows. */
  max?: number;
  tone?: Tone;
  className?: string;
};

/**
 * Intensity over time as rows of cells: when something happens and how much, at a glance. Cell
 * colour is one tone mixed toward the track, so it stays readable in every look and mode.
 */
export function HeatStrip({ label, rows, axis, max, tone = 'accent', className }: HeatStripProps) {
  const look = useLook();
  const top = max ?? Math.max(1, ...rows.flatMap((row) => row.values));
  const hasLabels = rows.some((row) => row.label !== '');

  return (
    <div role="img" aria-label={label} data-look={look} className={cx('kit-heat', className)}>
      {rows.map((row) => (
        <div key={row.label} data-tone={row.tone ?? tone} className="kit-heat-row">
          {hasLabels ? <span className="kit-heat-label">{row.label}</span> : null}
          <div className="kit-heat-cells">
            {row.values.map((value, index) => {
              const level = Math.round(Math.min(1, Math.max(0, value / top)) * 100);
              const style: CSSProperties & Record<'--kit-heat-level', string> = { '--kit-heat-level': `${level}%` };
              return <span key={index} className="kit-heat-cell" style={style} />;
            })}
          </div>
        </div>
      ))}
      {axis ? (
        <div className="kit-heat-row">
          {hasLabels ? <span className="kit-heat-label" /> : null}
          <div className="kit-heat-axis kit-heat-cells">
            <span>{axis[0]}</span>
            <span>{axis[1]}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
