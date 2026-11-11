import type { ReactNode } from 'react';

import { useLook } from '../../looks/useLook';
import { cx } from '../tones';

export type TitleBlockCell = {
  label: string;
  value: string;
  /** Relative width of the cell; the title usually takes 2 or 3. */
  grow?: number;
  /** Writes the value large: the drawing title. */
  strong?: boolean;
};

type TitleBlockProps = {
  cells: readonly TitleBlockCell[];
  /** A slot before the cells: the company mark. */
  mark?: ReactNode;
  /** A slot after the cells: sheet buttons. */
  end?: ReactNode;
  className?: string;
};

/** The title block of a drawing: boxed cells naming the drawing, its number, revision and date. */
export function TitleBlock({ cells, mark, end, className }: TitleBlockProps) {
  const look = useLook();
  return (
    <div data-look={look} className={cx('flex min-w-0 items-stretch border-2 border-(--kit-rule-strong) bg-(--kit-halo) text-(--kit-text)', className)}>
      {mark ? <div className="flex items-center border-r border-(--kit-rule-strong) px-4">{mark}</div> : null}
      <dl className="flex min-w-0 flex-1 items-stretch">
        {cells.map((cell, index) => (
          <div
            key={cell.label}
            className={cx('flex min-w-0 flex-col justify-center gap-0.5 px-4 py-2.5', index > 0 && 'border-l border-(--kit-rule-strong)')}
            style={{ flexGrow: cell.grow ?? 1, flexBasis: 0 }}
          >
            <dt className="text-xs text-(--kit-text-2)">{cell.label}</dt>
            <dd className={cx('whitespace-nowrap tabular-nums', cell.strong ? 'text-lg leading-6 font-semibold' : 'text-sm font-medium')}>{cell.value}</dd>
          </div>
        ))}
      </dl>
      {end ? <div className="flex items-center gap-2 border-l border-(--kit-rule-strong) px-4">{end}</div> : null}
    </div>
  );
}

type DrawingSheetProps = {
  /** Accessible name of the sheet. */
  label: string;
  /** Zone references along the top edge, usually numbers. */
  columns?: readonly string[];
  /** Zone references down the left edge, usually letters. */
  rows?: readonly string[];
  /** The title block, drawn against the bottom edge of the frame. */
  titleBlock?: ReactNode;
  className?: string;
  children: ReactNode;
};

/**
 * A drawing sheet as page chrome: a ruled frame with zone references in the margin and the title
 * block at the foot. Use it instead of an application bar when the screen should read as a
 * numbered sheet in a set.
 */
export function DrawingSheet({ label, columns = ['1', '2', '3', '4', '5', '6'], rows = ['A', 'B', 'C', 'D'], titleBlock, className, children }: DrawingSheetProps) {
  const look = useLook();
  return (
    <section
      aria-label={label}
      data-look={look}
      className={cx('grid min-w-0 grid-cols-[1.5rem_minmax(0,1fr)] grid-rows-[1.5rem_minmax(0,1fr)] border border-(--kit-rule-strong) bg-(--kit-surface) text-(--kit-text)', className)}
    >
      <div className="border-r border-b border-(--kit-rule-strong)" />
      <div aria-hidden="true" className="flex border-b border-(--kit-rule-strong)">
        {columns.map((zone, index) => (
          <span key={zone} className={cx('flex flex-1 items-center justify-center text-xs font-medium text-(--kit-text-2)', index > 0 && 'border-l border-(--kit-rule-strong)')}>
            {zone}
          </span>
        ))}
      </div>
      <div aria-hidden="true" className="flex flex-col border-r border-(--kit-rule-strong)">
        {rows.map((zone, index) => (
          <span key={zone} className={cx('flex flex-1 items-center justify-center text-xs font-medium text-(--kit-text-2)', index > 0 && 'border-t border-(--kit-rule-strong)')}>
            {zone}
          </span>
        ))}
      </div>
      <div className="flex min-w-0 flex-col">
        <div className="flex min-w-0 flex-1 flex-col p-5">{children}</div>
        {titleBlock ? <div className="-mr-px -mb-px pl-[22%]">{titleBlock}</div> : null}
      </div>
    </section>
  );
}
