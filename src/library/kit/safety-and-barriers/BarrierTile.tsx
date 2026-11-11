import type { ReactNode } from 'react';

import { useLook } from '../../looks/useLook';
import { cx, type Tone } from '../tones';

type BarrierTileProps = {
  /** The barrier: "Gas detection". */
  name: string;
  /** Its state as one word: "Healthy", "Degraded", "Impaired". */
  state: string;
  tone: Tone;
  /** Icon element for the barrier. */
  icon?: ReactNode;
  /** One line under the state: what is wrong, or how much was checked. */
  detail?: string;
  /** A short mark in the corner, such as the barrier number. */
  mark?: string;
  selected?: boolean;
  /** Makes the tile a toggle button. */
  onSelect?: () => void;
  size?: 'md' | 'lg';
  className?: string;
};

/**
 * One barrier on a wall of barriers: the whole tile is filled with its state colour and the state
 * is written as the largest word on it, so a wall of them reads from across a room. Selecting a
 * tile frames it in the text colour of the canvas.
 */
export function BarrierTile({ name, state, tone, icon, detail, mark, selected = false, onSelect, size = 'md', className }: BarrierTileProps) {
  const look = useLook();
  const body = (
    <>
      <span className="flex items-start justify-between gap-2">
        <span className={cx('leading-tight font-semibold', size === 'lg' ? 'text-xl' : 'text-base')}>{name}</span>
        {icon ? (
          <span aria-hidden="true" className={cx('shrink-0', size === 'lg' ? '[&>svg]:size-8' : '[&>svg]:size-6')}>
            {icon}
          </span>
        ) : null}
      </span>
      <span className="mt-auto block">
        <span className={cx('block leading-none font-extrabold tracking-tight whitespace-nowrap', size === 'lg' ? 'text-[min(3rem,17cqw)]' : 'text-[min(2rem,20cqw)]')}>{state}</span>
        {detail || mark ? (
          <span className="mt-1.5 flex items-baseline justify-between gap-2 text-sm leading-5 font-medium">
            <span>{detail}</span>
            {mark ? <span className="tabular-nums">{mark}</span> : null}
          </span>
        ) : null}
      </span>
    </>
  );
  const classes = cx(
    '@container flex min-w-0 flex-col gap-3 rounded-(--kit-radius) bg-(--t-vivid) p-4 text-left text-(--t-on-vivid)',
    size === 'lg' ? 'min-h-44' : 'min-h-36',
    selected && 'outline-4 outline-offset-2 outline-(--kit-text)',
    className
  );

  if (!onSelect) {
    return (
      <div data-look={look} data-tone={tone} className={classes}>
        {body}
      </div>
    );
  }
  return (
    <button
      type="button"
      data-look={look}
      data-tone={tone}
      aria-pressed={selected}
      aria-label={`${name}: ${state}${detail ? `, ${detail}` : ''}`}
      onClick={onSelect}
      className={cx(classes, 'cursor-pointer hover:brightness-110 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-(--kit-text)')}
    >
      {body}
    </button>
  );
}
