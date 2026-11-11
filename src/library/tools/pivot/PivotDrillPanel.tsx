import { IconX } from '@cognite/aura/icons';

import { IconAction } from '../../patterns/collections/IconAction';
import { Table } from '../../primitives/table/Table';
import { TableBody } from '../../primitives/table/TableBody';
import { TableCell } from '../../primitives/table/TableCell';
import { TableHead } from '../../primitives/table/TableHead';
import { TableHeader } from '../../primitives/table/TableHeader';
import { TableRow } from '../../primitives/table/TableRow';

import type { PivotRecord } from './pivot';

export type DrillColumn = {
  field: string;
  title: string;
  align?: 'start' | 'end';
  mono?: boolean;
  /** Text for a value; the raw value when omitted. */
  format?: (value: string | number | undefined) => string;
};

export type PivotDrillPanelProps = {
  /** What was picked: "Compression, Jan". */
  title: string;
  records: readonly PivotRecord[];
  columns: readonly DrillColumn[];
  onClose: () => void;
};

/**
 * The records behind one figure of a pivot: a titled panel with a count and a small table, so a
 * number can be checked without leaving the report.
 */
export function PivotDrillPanel({ title, records, columns, onClose }: PivotDrillPanelProps) {
  return (
    <section aria-label={`Records for ${title}`} data-slot="pivot-drill-panel" className="flex min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-lg border border-default bg-base-background">
      <header className="flex items-start justify-between gap-3 border-b border-default px-4 py-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-base-foreground">{title}</h3>
          <p className="text-xs tabular-nums text-muted-foreground">
            {records.length} {records.length === 1 ? 'record' : 'records'}
          </p>
        </div>
        <IconAction label="Close records" onClick={onClose}>
          <IconX />
        </IconAction>
      </header>
      {records.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">No records behind this figure</p>
      ) : (
        <Table label={`${title} records`} density="compact" stickyHeader className="min-h-0 flex-1">
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.field} numeric={column.align === 'end'}>
                  {column.title}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record, index) => (
              <TableRow key={index}>
                {columns.map((column) => {
                  const value = record[column.field];
                  return (
                    <TableCell key={column.field} numeric={column.align === 'end'} mono={column.mono} wrap="nowrap">
                      {column.format ? column.format(value) : (value ?? '')}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
