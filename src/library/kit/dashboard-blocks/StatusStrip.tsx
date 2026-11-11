import type { ReactNode } from 'react';

import type { LookId } from '../../looks/looks';
import { useLook } from '../../looks/useLook';
import { cx, type Tone } from '../tones';

export type StatusStripItem = {
  id: string;
  /** The thing: a unit, an area, a system. */
  label: string;
  /** Its state as a word: "Running", "Tripped". */
  state: string;
  tone: Tone;
  /** A short second line: the tag or a figure. */
  detail?: string;
  icon?: ReactNode;
};

type StatusStripProps = {
  /** Names the strip, for example "Unit states". */
  label: string;
  items: readonly StatusStripItem[];
  selectedId?: string;
  /** Makes every cell a button. */
  onSelect?: (id: string) => void;
  className?: string;
};

type Fill = 'vivid' | 'soft' | 'outline';

const LOOK_FILL: Record<LookId, Fill> = {
  studio: 'soft',
  console: 'soft',
  poster: 'vivid',
  glass: 'soft',
  editorial: 'outline',
  soft: 'soft',
  blueprint: 'outline',
  signal: 'vivid',
};

const FILL_CLASS: Record<Fill, string> = {
  vivid: 'bg-(--t-vivid) text-(--t-on-vivid)',
  soft: 'bg-(--t-soft) text-(--kit-text) border-t-4 border-(--t-line)',
  outline: 'bg-transparent text-(--kit-text) border border-(--kit-rule-strong) border-t-4 border-t-(--t-line)',
};

/**
 * One row of equal cells, one per unit, each carrying its state as a word on its state colour.
 * Reads left to right in process order: the place where the row turns red is where to look.
 */
export function StatusStrip({ label, items, selectedId, onSelect, className }: StatusStripProps) {
  const look = useLook();
  const fill = LOOK_FILL[look];
  return (
    <div role="group" aria-label={label} data-look={look} className={cx('grid min-w-0 auto-cols-fr grid-flow-col', look === 'console' || look === 'signal' ? 'gap-px' : 'gap-2', className)}>
      {items.map((item) => {
        const selected = item.id === selectedId;
        const classes = cx(
          'flex min-w-0 flex-col gap-1 rounded-(--kit-radius-sm) px-3 py-3 text-left',
          FILL_CLASS[fill],
          selected && 'outline-3 -outline-offset-3 outline-(--kit-text)'
        );
        const body = (
          <>
            <span className="flex items-center gap-1.5 text-base leading-5 font-semibold [&>svg]:size-4 [&>svg]:shrink-0">
              {item.icon}
              {item.state}
            </span>
            <span className="text-sm leading-5 font-medium">{item.label}</span>
            {item.detail ? <span className={cx('text-xs leading-4 tabular-nums', fill === 'vivid' ? '' : 'text-(--kit-text-2)')}>{item.detail}</span> : null}
          </>
        );
        return onSelect ? (
          <button
            key={item.id}
            type="button"
            data-tone={item.tone}
            aria-pressed={selected}
            onClick={() => onSelect(item.id)}
            className={cx(classes, 'cursor-pointer hover:brightness-105 focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-(--kit-text)')}
          >
            {body}
          </button>
        ) : (
          <div key={item.id} data-tone={item.tone} className={classes}>
            {body}
          </div>
        );
      })}
    </div>
  );
}
