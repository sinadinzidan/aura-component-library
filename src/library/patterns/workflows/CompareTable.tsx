import { IconArrowDownRight, IconArrowUpRight, IconMinus } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

import { ChangeMarker } from './ChangeMarker';
import { rowChange } from './compareRows';
import type { CompareRow } from './compareRows';

export type CompareTableProps = {
  /** Accessible name: "Model v12 compared with v13". */
  label: string;
  /** Column headings for the two sides. */
  leftLabel: ReactNode;
  rightLabel: ReactNode;
  rows: readonly CompareRow[];
  /** Hides the rows that are the same on both sides. */
  onlyDifferences?: boolean;
  /** Heading of the first column. */
  fieldLabel?: string;
  /** Shown when `onlyDifferences` hides every row. */
  emptyText?: string;
};

const TH = 'px-3 py-2 text-left text-xs font-medium text-muted-foreground';
const TD = 'px-3 py-2 align-baseline';

const DELTA_ICON = { up: IconArrowUpRight, down: IconArrowDownRight, flat: IconMinus } as const;
const DELTA_WORD = { up: 'up', down: 'down', flat: 'no change' } as const;

/**
 * Two versions of the same record, field by field: the value on each side, the difference where
 * it is a number, and a marker that says whether the field was added, removed or changed. The
 * marker carries the state in an icon and a word; the changed side is set in full weight.
 */
export function CompareTable({
  label,
  leftLabel,
  rightLabel,
  rows,
  onlyDifferences = false,
  fieldLabel = 'Field',
  emptyText = 'No differences. Both sides are the same.',
}: CompareTableProps) {
  const visible = onlyDifferences ? rows.filter((row) => rowChange(row) !== 'unchanged') : rows;
  const hasDelta = rows.some((row) => row.delta !== undefined);

  return (
    <table data-slot="compare-table" aria-label={label} className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-default">
          <th scope="col" className={TH}>
            {fieldLabel}
          </th>
          <th scope="col" className={`${TH} text-right`}>
            {leftLabel}
          </th>
          <th scope="col" className={`${TH} text-right`}>
            {rightLabel}
          </th>
          {hasDelta ? (
            <th scope="col" className={`${TH} text-right`}>
              Difference
            </th>
          ) : null}
          <th scope="col" className={TH}>
            Change
          </th>
        </tr>
      </thead>
      <tbody>
        {visible.length === 0 ? (
          <tr>
            <td colSpan={hasDelta ? 5 : 4} className="px-3 py-6 text-center text-sm text-muted-foreground">
              {emptyText}
            </td>
          </tr>
        ) : null}
        {visible.map((row) => {
          const change = rowChange(row);
          const differs = change !== 'unchanged';
          const font = row.mono ? 'font-mono text-xs' : '';
          const DeltaIcon = row.delta ? DELTA_ICON[row.delta.direction] : undefined;
          return (
            <tr key={row.id} data-change={change} className="border-b border-default">
              <th scope="row" className={`${TD} text-left font-normal text-muted-foreground`}>
                {row.label}
              </th>
              <td className={`${TD} text-right tabular-nums ${font} ${change === 'removed' ? 'text-base-foreground' : differs ? 'text-muted-foreground' : 'text-base-foreground'}`}>
                {row.left ?? '—'}
              </td>
              <td className={`${TD} text-right tabular-nums ${font} ${differs && row.right !== undefined ? 'font-medium' : ''} text-base-foreground`}>{row.right ?? '—'}</td>
              {hasDelta ? (
                <td className={`${TD} text-right tabular-nums text-muted-foreground`}>
                  {row.delta && DeltaIcon ? (
                    <span className="inline-flex items-center justify-end gap-1 whitespace-nowrap">
                      <DeltaIcon aria-hidden="true" className="size-3.5 shrink-0" />
                      {row.delta.text}
                      <span className="sr-only">, {DELTA_WORD[row.delta.direction]}</span>
                    </span>
                  ) : null}
                </td>
              ) : null}
              <td className={TD}>
                <ChangeMarker kind={change} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
