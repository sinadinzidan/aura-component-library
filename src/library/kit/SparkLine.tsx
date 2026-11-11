import type { LookId } from '../looks/looks';
import { useLook } from '../looks/useLook';

import { cx, type Tone } from './tones';

type SparkVariant = 'line' | 'area' | 'bars';

const LOOK_VARIANT: Record<LookId, SparkVariant> = {
  studio: 'area',
  console: 'line',
  poster: 'bars',
  glass: 'area',
  editorial: 'line',
  soft: 'area',
  blueprint: 'line',
  signal: 'bars',
};

type SparkLineProps = {
  values: readonly number[];
  /** What the trend shows, for example "Gas export, last 24 hours". */
  label: string;
  tone?: Tone;
  /** Leave out to let the look choose. */
  variant?: SparkVariant;
  /** Marks the latest value with a dot (line and area only). */
  highlightLast?: boolean;
  /** Layout classes: a width or height such as `h-8 w-24`. */
  className?: string;
};

const WIDTH = 100;
const HEIGHT = 32;
const PAD = 3;

/** A word-sized trend with no axes: the shape of the recent past next to a figure. */
export function SparkLine({ values, label, tone = 'accent', variant, highlightLast = true, className }: SparkLineProps) {
  const look = useLook();
  const kind = variant ?? LOOK_VARIANT[look];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const y = (value: number) => HEIGHT - PAD - ((value - min) / span) * (HEIGHT - PAD * 2);
  const x = (index: number) => (values.length > 1 ? (index / (values.length - 1)) * WIDTH : WIDTH / 2);
  const points = values.map((value, index) => `${x(index).toFixed(2)},${y(value).toFixed(2)}`);
  const last = values[values.length - 1] ?? 0;
  const band = WIDTH / Math.max(values.length, 1);

  return (
    <span role="img" aria-label={label} data-look={look} data-tone={tone} data-variant={kind} className={cx('kit-spark', className)}>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" aria-hidden="true">
        {kind === 'bars'
          ? values.map((value, index) => {
              const top = Math.min(y(value), HEIGHT - 2);
              return (
                <rect
                  key={index}
                  className="kit-spark-bar"
                  data-last={index === values.length - 1}
                  x={index * band + band * 0.14}
                  y={top}
                  width={band * 0.72}
                  height={HEIGHT - top}
                />
              );
            })
          : null}
        {kind === 'area' ? <polygon className="kit-spark-area" points={`0,${HEIGHT} ${points.join(' ')} ${WIDTH},${HEIGHT}`} /> : null}
        {kind !== 'bars' ? <polyline className="kit-spark-line" points={points.join(' ')} /> : null}
      </svg>
      {kind !== 'bars' && highlightLast && values.length > 0 ? (
        <span aria-hidden="true" className="kit-spark-dot" style={{ top: `${(y(last) / HEIGHT) * 100}%` }} />
      ) : null}
    </span>
  );
}
