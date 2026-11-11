import {
  IconArrowDownRight,
  IconArrowUpRight,
  IconMinus,
} from '@cognite/aura/icons';
import type { ReactNode } from 'react';

import { Table } from '../../primitives/table/Table';
import type { TableProps } from '../../primitives/table/Table';
import { TableBody } from '../../primitives/table/TableBody';
import { TableCell } from '../../primitives/table/TableCell';
import { TableHead } from '../../primitives/table/TableHead';
import { TableHeader } from '../../primitives/table/TableHeader';
import { TableMessageRow } from '../../primitives/table/TableMessageRow';
import { TableRow } from '../../primitives/table/TableRow';

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
  /** The surface the table sits on, so its rows match it. */
  surface?: TableProps['surface'];
};

const DELTA_ICON = {
  up: IconArrowUpRight,
  down: IconArrowDownRight,
  flat: IconMinus,
} as const;
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
  surface = 'base',
}: CompareTableProps) {
  const visible = onlyDifferences
    ? rows.filter((row) => rowChange(row) !== 'unchanged')
    : rows;
  const hasDelta = rows.some((row) => row.delta !== undefined);

  return (
    <div data-slot="compare-table" className="w-full min-w-0">
      <Table label={label} hover={false} surface={surface}>
        <TableHeader>
          <TableRow>
            <TableHead>{fieldLabel}</TableHead>
            <TableHead numeric>{leftLabel}</TableHead>
            <TableHead numeric>{rightLabel}</TableHead>
            {hasDelta ? <TableHead numeric>Difference</TableHead> : null}
            <TableHead>Change</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.length === 0 ? (
            <TableMessageRow colSpan={hasDelta ? 5 : 4}>
              {emptyText}
            </TableMessageRow>
          ) : null}
          {visible.map((row) => {
            const change = rowChange(row);
            const differs = change !== 'unchanged';
            const DeltaIcon = row.delta
              ? DELTA_ICON[row.delta.direction]
              : undefined;
            return (
              <TableRow key={row.id}>
                <TableCell rowHeader className="align-baseline">
                  <span className="font-normal text-muted-foreground">
                    {row.label}
                  </span>
                </TableCell>
                <TableCell
                  numeric
                  mono={row.mono}
                  wrap="wrap"
                  className="align-baseline"
                >
                  <span
                    className={
                      differs && change !== 'removed'
                        ? 'text-muted-foreground'
                        : 'text-base-foreground'
                    }
                  >
                    {row.left ?? '—'}
                  </span>
                </TableCell>
                <TableCell
                  numeric
                  mono={row.mono}
                  wrap="wrap"
                  className="align-baseline"
                >
                  <span
                    className={
                      differs && row.right !== undefined
                        ? 'font-medium text-base-foreground'
                        : 'text-base-foreground'
                    }
                  >
                    {row.right ?? '—'}
                  </span>
                </TableCell>
                {hasDelta ? (
                  <TableCell numeric muted className="align-baseline">
                    {row.delta && DeltaIcon ? (
                      <span className="inline-flex items-center justify-end gap-1">
                        <DeltaIcon
                          aria-hidden="true"
                          className="size-3.5 shrink-0"
                        />
                        {row.delta.text}
                        <span className="sr-only">
                          , {DELTA_WORD[row.delta.direction]}
                        </span>
                      </span>
                    ) : null}
                  </TableCell>
                ) : null}
                <TableCell className="align-baseline">
                  <ChangeMarker kind={change} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
