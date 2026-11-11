import { useLook } from '../../looks/useLook';
import { cx, formatNumber, type Tone } from '../tones';

import './boards.css';

type CompareRowProps = {
  /** The measure: "Availability". */
  label: string;
  unit?: string;
  /** The value on the left. */
  a: number;
  /** The value on the right. */
  b: number;
  /** Value that fills a bar completely. Defaults to the larger of the two. */
  max?: number;
  decimals?: number;
  /** Which direction wins; the better side takes the `good` colour. `none` judges neither. */
  better?: 'higher' | 'lower' | 'none';
  /** Colours of the two sides, matching the column headings. */
  tones?: readonly [Tone, Tone];
  className?: string;
};

function winner(a: number, b: number, better: 'higher' | 'lower' | 'none'): 'a' | 'b' | null {
  if (better === 'none' || a === b) return null;
  if (better === 'higher') return a > b ? 'a' : 'b';
  return a < b ? 'a' : 'b';
}

/**
 * One measure for two things, mirrored around its name: two bars growing outward so the longer
 * one is obvious, and the better figure in the success colour.
 */
export function CompareRow({ label, unit, a, b, max, decimals = 0, better = 'higher', tones = ['blue', 'purple'], className }: CompareRowProps) {
  const look = useLook();
  const full = max ?? Math.max(a, b, Number.EPSILON);
  const best = winner(a, b, better);
  const share = (value: number) => `${Math.min(100, Math.max(0, (value / full) * 100))}%`;

  return (
    <div role="group" aria-label={label} data-look={look} className={cx('dash-compare', className)}>
      <div data-side="a" data-tone={best === 'a' ? 'success' : 'neutral'} data-better={best === 'a' ? '' : undefined} className="dash-compare-side">
        <span className="dash-compare-value">{formatNumber(a, decimals)}</span>
        <span aria-hidden="true" className="dash-compare-track">
          <span data-tone={tones[0]} className="dash-compare-fill" style={{ width: share(a) }} />
        </span>
      </div>
      <div className="dash-compare-label">
        <p className="dash-compare-name">{label}</p>
        {unit ? <p className="dash-compare-unit">{unit}</p> : null}
      </div>
      <div data-side="b" data-tone={best === 'b' ? 'success' : 'neutral'} data-better={best === 'b' ? '' : undefined} className="dash-compare-side">
        <span aria-hidden="true" className="dash-compare-track">
          <span data-tone={tones[1]} className="dash-compare-fill" style={{ width: share(b) }} />
        </span>
        <span className="dash-compare-value">{formatNumber(b, decimals)}</span>
      </div>
    </div>
  );
}
