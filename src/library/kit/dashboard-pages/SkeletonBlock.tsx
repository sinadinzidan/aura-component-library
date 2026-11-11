import type { CSSProperties } from 'react';

import { useLook } from '../../looks/useLook';
import { cx } from '../tones';

import './boards.css';

type SkeletonBlockProps = {
  /** What is loading, for assistive technology: "Loading gas export". */
  label: string;
  /** The shape of the content it stands in for. */
  shape: 'stat' | 'chart' | 'rows';
  /** Number of rows or bars. */
  count?: number;
  /** Height in px of a chart placeholder. */
  height?: number;
  /** Pulse while loading. Off for static documentation. */
  animate?: boolean;
  className?: string;
};

const BAR_HEIGHTS = [46, 62, 54, 78, 70, 88, 64, 52, 74, 92, 68, 58];

/**
 * A placeholder in the shape of what is loading — a figure, a chart or rows — so a dashboard
 * keeps its layout while data arrives. Heights are fixed, so nothing jumps when content lands.
 */
export function SkeletonBlock({ label, shape, count, height = 200, animate = true, className }: SkeletonBlockProps) {
  const look = useLook();
  const style: CSSProperties | undefined = shape === 'chart' ? { height } : undefined;
  const amount = count ?? (shape === 'chart' ? 12 : 4);

  return (
    <div role="status" aria-label={label} data-look={look} data-shape={shape} data-animate={animate} style={style} className={cx('dash-skeleton', className)}>
      {shape === 'stat' ? (
        <>
          <span className="dash-bone" />
          <span className="dash-bone" />
          <span className="dash-bone" />
        </>
      ) : null}
      {shape === 'chart'
        ? Array.from({ length: amount }, (_, index) => <span key={index} className="dash-bone" style={{ height: `${BAR_HEIGHTS[index % BAR_HEIGHTS.length]}%` }} />)
        : null}
      {shape === 'rows'
        ? Array.from({ length: amount }, (_, index) => (
            <span key={index} className="dash-skeleton-row">
              <span data-part="mark" className="dash-bone" />
              <span data-part="line" className="dash-bone" />
              <span data-part="end" className="dash-bone" />
            </span>
          ))
        : null}
    </div>
  );
}
