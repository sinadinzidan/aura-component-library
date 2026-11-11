import { Button } from '@cognite/aura/components/button';
import type { ReactNode } from 'react';

import { useLook } from '../../looks/useLook';
import { StatusPill } from '../StatusPill';
import { TagId } from '../TagId';
import { cx } from '../tones';

import { ENERGY_WORD, NEXT_ACTION, STATE_TONE, STATE_WORD, type IsolationPoint } from './isolation';

type IsolationPointRowProps = {
  point: IsolationPoint;
  /** Icon element for the energy type. */
  icon?: ReactNode;
  /** Shows the next action as a button and reports it. Leave out for a read-only row. */
  onAdvance?: (id: string) => void;
  /** A different action for this row, such as "Remove lock" during de-isolation. */
  action?: ReactNode;
  /** Highlights the row the worker is at. */
  current?: boolean;
  className?: string;
};

const SQUARE_LOOKS = ['console', 'poster', 'blueprint', 'signal'];

/**
 * One isolation point as a row: its step in the sequence, the tag and what it is, the energy it
 * holds back and what is done to it, then its state, the lock number and the next action. A
 * removed point is struck through but stays readable.
 */
export function IsolationPointRow({ point, icon, onAdvance, action, current = false, className }: IsolationPointRowProps) {
  const look = useLook();
  const square = SQUARE_LOOKS.includes(look);
  const next = NEXT_ACTION[point.state];
  const reached = point.state !== 'planned' && point.state !== 'removed';

  return (
    <li
      data-look={look}
      data-tone={STATE_TONE[point.state]}
      data-state={point.state}
      aria-current={current ? 'step' : undefined}
      className={cx(
        'grid grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-x-3 border-b border-(--kit-rule) px-3 py-3 text-(--kit-text) last:border-b-0',
        current ? 'bg-(--kit-well)' : '',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cx(
          'flex size-9 items-center justify-center text-base font-semibold tabular-nums',
          square ? '' : 'rounded-full',
          reached ? 'bg-(--t-solid) text-(--t-on-solid)' : 'border border-(--kit-rule-strong) text-(--kit-text-2)',
        )}
      >
        {point.step}
      </span>
      <div className="min-w-0">
        <p className={cx('text-sm leading-5 font-medium', point.state === 'removed' ? 'line-through' : '')}>
          <span className="sr-only">Step {point.step}: </span>
          {point.name}
        </p>
        <p className="flex flex-wrap items-center gap-x-2 text-xs leading-5 text-(--kit-text-2)">
          <TagId>{point.tag}</TagId>
          <span className="inline-flex items-center gap-1 [&_svg]:size-3.5">
            {icon}
            {ENERGY_WORD[point.energy]}
          </span>
          <span>· {point.method}</span>
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-end gap-0.5">
          <StatusPill tone={STATE_TONE[point.state]}>{STATE_WORD[point.state]}</StatusPill>
          <span className="text-xs leading-4 text-(--kit-text-2) tabular-nums">{point.lock ? `Lock ${point.lock}` : 'No lock yet'}</span>
        </div>
        {action}
        {!action && onAdvance && next ? (
          <Button size="sm" variant="secondary" onClick={() => onAdvance(point.id)}>
            {next}
          </Button>
        ) : null}
      </div>
    </li>
  );
}
