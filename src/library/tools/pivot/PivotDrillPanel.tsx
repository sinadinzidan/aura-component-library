import { IconX } from '@cognite/aura/icons';

import { IconAction } from '../../patterns/collections/IconAction';

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
      <div className="min-h-0 flex-1 overflow-auto">
        {records.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">No records behind this figure</p>
        ) : (
          <table className="w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.field} scope="col" className={`sticky top-0 border-b border-default bg-muted-background px-3 py-1.5 text-xs font-medium text-medium-foreground ${column.align === 'end' ? 'text-right' : 'text-left'}`}>
                    {column.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((record, index) => (
                <tr key={index}>
                  {columns.map((column) => {
                    const value = record[column.field];
                    return (
                      <td key={column.field} className={`whitespace-nowrap border-b border-default px-3 py-1.5 ${column.align === 'end' ? 'text-right tabular-nums' : 'text-left'} ${column.mono ? 'font-mono text-xs' : ''}`}>
                        {column.format ? column.format(value) : (value ?? '')}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
