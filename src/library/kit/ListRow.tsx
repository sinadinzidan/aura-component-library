import type { ReactNode } from 'react';

import { useLook } from '../looks/useLook';

import { cx, type Tone } from './tones';

type ListRowProps = {
  title: ReactNode;
  /** Secondary line: tag, value against limit, owner. */
  meta?: ReactNode;
  /** Leading icon chip, avatar or status pill. */
  leading?: ReactNode;
  /** Trailing value, time or actions. With `onClick` it must not contain controls of its own. */
  trailing?: ReactNode;
  /** State of the row: an edge bar in studio and console, a filled row in soft and signal. */
  tone?: Tone;
  /** Makes the whole row one button with a focus ring. */
  onClick?: () => void;
  /** Marks the row whose detail is showing. */
  selected?: boolean;
  className?: string;
};

/**
 * One record in a list — an alarm, a work order, a unit. Render inside a `ul`. With `onClick` the
 * row is a single button, operable by keyboard, and `selected` marks the current one.
 */
export function ListRow({ title, meta, leading, trailing, tone = 'neutral', onClick, selected, className }: ListRowProps) {
  const look = useLook();
  const content = (
    <>
      {leading ? <div className="kit-row-leading">{leading}</div> : null}
      <div className="kit-row-text">
        <div className="kit-row-title">{title}</div>
        {meta ? <div className="kit-row-meta">{meta}</div> : null}
      </div>
      {trailing ? <div className="kit-row-trailing">{trailing}</div> : null}
    </>
  );

  return (
    <li
      data-look={look}
      data-tone={tone}
      data-interactive={onClick ? 'true' : undefined}
      data-selected={selected ? 'true' : undefined}
      className={cx('kit-row', className)}
    >
      {onClick ? (
        <button type="button" className="kit-row-hit" aria-pressed={selected ?? undefined} onClick={onClick}>
          {content}
        </button>
      ) : (
        content
      )}
    </li>
  );
}
