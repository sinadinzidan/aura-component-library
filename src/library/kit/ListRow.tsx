import type { ReactNode } from 'react';

import { useLook } from '../looks/useLook';

import { cx, type Tone } from './tones';

type ListRowProps = {
  title: ReactNode;
  /** Secondary line: tag, value against limit, owner. */
  meta?: ReactNode;
  /** Leading icon chip, avatar or status pill. */
  leading?: ReactNode;
  /** Trailing value, time or actions. */
  trailing?: ReactNode;
  /** State of the row: an edge bar in studio and console, a filled row in soft and signal. */
  tone?: Tone;
  className?: string;
};

/** One record in a list — an alarm, a work order, a unit. Render inside a `ul`. */
export function ListRow({ title, meta, leading, trailing, tone = 'neutral', className }: ListRowProps) {
  const look = useLook();
  return (
    <li data-look={look} data-tone={tone} className={cx('kit-row', className)}>
      {leading ? <div className="kit-row-leading">{leading}</div> : null}
      <div className="kit-row-text">
        <div className="kit-row-title">{title}</div>
        {meta ? <div className="kit-row-meta">{meta}</div> : null}
      </div>
      {trailing ? <div className="kit-row-trailing">{trailing}</div> : null}
    </li>
  );
}
