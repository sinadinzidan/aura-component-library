import type { KeyboardEvent, ReactNode } from 'react';

import { useLook } from '../../looks/useLook';
import { cx, type Tone } from '../tones';

export type AlarmTableColumn<Row> = {
  id: string;
  header: string;
  cell: (row: Row) => ReactNode;
  /** Right-aligned tabular figures. */
  numeric?: boolean;
  /** Quieter text for secondary columns. */
  muted?: boolean;
  /** Layout class for the column width, such as `w-24`. */
  width?: string;
  /** The one column that takes the remaining width and shortens with an ellipsis when it must. */
  fill?: boolean;
  /** Leave the column out when the table itself is narrow. */
  optional?: boolean;
};

/** `band` fills the whole row with its state, `edge` keeps only the leading block, `quiet` recedes. */
export type AlarmRowEmphasis = 'band' | 'edge' | 'quiet';

type AlarmTableProps<Row> = {
  /** Accessible name, for example "Standing alarms". */
  label: string;
  columns: readonly AlarmTableColumn<Row>[];
  rows: readonly Row[];
  rowKey: (row: Row) => string;
  /** The state colour of a row. */
  rowTone: (row: Row) => Tone;
  rowEmphasis?: (row: Row) => AlarmRowEmphasis;
  /** Content of the leading status block: an icon and the priority word. */
  rowBadge: (row: Row) => ReactNode;
  /** Header of the leading status column. */
  badgeHeader?: string;
  selected?: string;
  onSelect?: (key: string) => void;
  /** Shown instead of rows when there are none. */
  empty?: string;
  className?: string;
};

/**
 * A dense, selectable list in which state is the loudest thing: every row starts with a filled
 * block in its state colour, rows that need action are banded edge to edge, and rows that are
 * dealt with recede. Rows are selected by click, Enter or Space.
 */
export function AlarmTable<Row>({
  label,
  columns,
  rows,
  rowKey,
  rowTone,
  rowEmphasis,
  rowBadge,
  badgeHeader = 'Priority',
  selected,
  onSelect,
  empty = 'Nothing to show.',
  className,
}: AlarmTableProps<Row>) {
  const look = useLook();
  const cellPad = 'px-3 py-1.5';

  return (
    <div data-look={look} className={cx('@container min-h-0 min-w-0 overflow-auto', className)}>
      <table role="grid" aria-label={label} className="w-full border-collapse text-sm text-[var(--kit-text)]">
        <thead className="sticky top-0 z-10 bg-[var(--kit-well)] text-xs text-[var(--kit-text-3)]">
          <tr>
            <th scope="col" className="w-26 px-3 py-2 text-left font-medium">
              {badgeHeader}
            </th>
            {columns.map((column) => (
              <th key={column.id} scope="col" className={cx('px-3 py-2 font-medium', column.numeric ? 'text-right' : 'text-left', column.width, column.optional ? '@max-[680px]:hidden' : '')}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length + 1} className="px-3 py-10 text-center text-[var(--kit-text-3)]">
                {empty}
              </td>
            </tr>
          ) : null}
          {rows.map((row) => {
            const key = rowKey(row);
            const emphasis = rowEmphasis?.(row) ?? 'edge';
            const active = key === selected;
            const onKeyDown = (event: KeyboardEvent<HTMLTableRowElement>) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onSelect?.(key);
              }
            };
            return (
              <tr
                key={key}
                data-tone={rowTone(row)}
                data-emphasis={emphasis}
                aria-selected={active}
                tabIndex={0}
                onClick={() => onSelect?.(key)}
                onKeyDown={onKeyDown}
                className={cx(
                  'cursor-pointer border-b border-[var(--kit-rule)] outline-none transition-colors focus-visible:[box-shadow:inset_0_0_0_2px_var(--kit-accent)]',
                  emphasis === 'band' ? 'bg-[color-mix(in_oklab,var(--t-line)_20%,transparent)] font-medium' : '',
                  emphasis === 'quiet' ? 'text-[var(--kit-text-3)]' : '',
                  active ? '[box-shadow:inset_0_0_0_2px_var(--kit-text)]' : 'hover:bg-[color-mix(in_oklab,var(--t-line)_30%,transparent)]'
                )}
              >
                <td className="p-0">
                  <span
                    className={cx(
                      'flex h-9 items-center gap-1.5 px-3 text-xs font-semibold [&>svg]:size-4 [&>svg]:shrink-0',
                      emphasis === 'quiet'
                        ? 'text-[var(--kit-text-3)] [box-shadow:inset_4px_0_0_var(--t-line)]'
                        : emphasis === 'band'
                          ? 'bg-[var(--t-solid)] text-[var(--t-on-solid)]'
                          : 'text-[var(--t-ink)] [box-shadow:inset_4px_0_0_var(--t-line)]'
                    )}
                  >
                    {rowBadge(row)}
                  </span>
                </td>
                {columns.map((column) => (
                  <td
                    key={column.id}
                    className={cx(
                      cellPad,
                      column.fill ? 'w-full max-w-0 truncate' : 'whitespace-nowrap',
                      column.numeric ? 'text-right tabular-nums' : 'text-left',
                      column.muted && emphasis !== 'band' ? 'text-[var(--kit-text-3)]' : '',
                      column.optional ? '@max-[680px]:hidden' : ''
                    )}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
