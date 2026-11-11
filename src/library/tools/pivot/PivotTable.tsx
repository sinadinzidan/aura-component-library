import { Skeleton } from '@cognite/aura/components/skeleton';
import { IconChevronDown, IconChevronRight } from '@cognite/aura/icons';

import { cn } from '../../../lib/utils';
import { HEAT_LEVEL_BG, HEAT_LEVEL_TEXT } from '../../industrial/charts/heatLevels';

import { heatStep, visiblePivotRows } from './pivot';
import type { PivotCell, PivotResult } from './pivot';

/** A cell picked for drill-through: a row group (or the grand total) and a column (or the total). */
export type PivotSelection = { groupId: string | null; columnKey: string | null };

export type PivotTableProps = {
  result: PivotResult;
  /** Names the row fields, outermost first, for the header: "Area / Type". */
  rowFieldLabels: readonly string[];
  /** Name of the measure, spanning the value columns: "Downtime (h)". */
  measureLabel: string;
  /** Name of the column field, shown over the columns: "Month". */
  columnFieldLabel?: string;
  formatValue: (value: number | null) => string;
  /** Group ids that are collapsed. */
  collapsed: ReadonlySet<string>;
  onToggleGroup: (id: string) => void;
  /** Shade the body cells from the lightest to the strongest heat step. */
  heat?: boolean;
  /** Called when a figure is activated. Without it the figures are plain text. */
  onDrill?: (selection: PivotSelection) => void;
  selection?: PivotSelection | null;
  loading?: boolean;
  density?: 'default' | 'compact';
  /** Accessible name of the table. */
  label: string;
  /** Shown when there is nothing to pivot. */
  empty?: string;
};

const sameSelection = (a: PivotSelection | null | undefined, groupId: string | null, columnKey: string | null) => a != null && a.groupId === groupId && a.columnKey === columnKey;

/**
 * A pivot table: nested, collapsible row groups with subtotals, one column per value of the
 * column field with a total column, a grand total row, a two-level header and optional heat
 * shading. Figures can be activated to drill through to their records.
 */
export function PivotTable({
  result,
  rowFieldLabels,
  measureLabel,
  columnFieldLabel,
  formatValue,
  collapsed,
  onToggleGroup,
  heat = false,
  onDrill,
  selection,
  loading = false,
  density = 'default',
  label,
  empty = 'No records match the current filters',
}: PivotTableProps) {
  const rows = visiblePivotRows(result.groups, collapsed);
  const pad = density === 'compact' ? 'px-3 py-1' : 'px-3 py-2';
  const columnCount = result.columns.length;

  const figure = (cell: PivotCell, groupId: string | null, columnKey: string | null, name: string, shade: number | null, strong = false) => {
    const text = formatValue(cell.value);
    const picked = sameSelection(selection, groupId, columnKey);
    const base = cn('flex w-full items-center justify-end rounded-md px-2 tabular-nums', density === 'compact' ? 'py-0.5' : 'py-1', strong ? 'font-semibold' : '');
    const tone = shade === null ? 'text-base-foreground' : cn(HEAT_LEVEL_BG[shade], HEAT_LEVEL_TEXT[shade]);
    if (!onDrill || cell.count === 0) {
      return (
        <span className={cn(base, tone, cell.value === null ? 'text-muted-foreground' : '')}>
          {cell.value === null ? '–' : text}
          {cell.value === null ? <span className="sr-only">No records</span> : null}
        </span>
      );
    }
    return (
      <button
        type="button"
        aria-label={`${name}: ${text}, ${cell.count} ${cell.count === 1 ? 'record' : 'records'}. Show records`}
        aria-pressed={picked}
        onClick={() => onDrill({ groupId, columnKey })}
        className={cn(base, tone, 'cursor-pointer outline-none hover:underline focus-visible:shadow-focus-ring', picked ? 'shadow-focus-ring' : '')}
      >
        {text}
      </button>
    );
  };

  return (
    <div data-slot="pivot-table" className="w-full min-w-0 overflow-auto rounded-lg border border-default bg-base-background">
      <table aria-label={label} aria-busy={loading || undefined} className="w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            <th scope="col" rowSpan={2} className={cn('sticky left-0 top-0 z-20 min-w-44 border-b border-default bg-muted-background text-left align-bottom text-xs font-medium text-medium-foreground', pad)}>
              {rowFieldLabels.length === 0 ? 'All records' : rowFieldLabels.join(' / ')}
            </th>
            <th scope="colgroup" colSpan={Math.max(columnCount, 1)} className={cn('sticky top-0 z-10 border-b border-default bg-muted-background text-center text-xs font-medium text-medium-foreground', pad)}>
              {columnFieldLabel ? `${measureLabel} by ${columnFieldLabel.toLowerCase()}` : measureLabel}
            </th>
            <th scope="col" rowSpan={2} className={cn('sticky top-0 z-10 min-w-20 border-b border-l border-default bg-muted-background text-right align-bottom text-xs font-medium text-base-foreground', pad)}>
              Total
            </th>
          </tr>
          <tr>
            {result.columns.map((column) => (
              <th key={column.key} scope="col" className={cn('sticky top-9 z-10 min-w-16 border-b border-default bg-muted-background text-right text-xs font-medium text-medium-foreground', density === 'compact' ? 'px-3 py-1' : 'px-3 py-1.5')}>
                {column.label}
              </th>
            ))}
            {columnCount === 0 ? <th aria-hidden="true" className="sticky top-9 z-10 border-b border-default bg-muted-background" /> : null}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 5 }, (_, row) => (
                <tr key={row}>
                  <th scope="row" className={cn('sticky left-0 border-b border-default bg-base-background text-left', pad)}>
                    <Skeleton className="h-4 w-28" />
                  </th>
                  {Array.from({ length: Math.max(columnCount, 3) + 1 }, (_, col) => (
                    <td key={col} className={cn('border-b border-default', pad)}>
                      <Skeleton className="ml-auto h-4 w-10" />
                    </td>
                  ))}
                </tr>
              ))
            : null}
          {!loading && rows.length === 0 ? (
            <tr>
              <td colSpan={columnCount + 2} className="px-4 py-10 text-center text-sm text-muted-foreground">
                {empty}
              </td>
            </tr>
          ) : null}
          {!loading
            ? rows.map(({ group, expandable, expanded }) => {
                const parent = expandable;
                return (
                  <tr key={group.id} data-level={group.level} data-parent={parent || undefined}>
                    <th
                      scope="row"
                      aria-level={group.level + 1}
                      className={cn('sticky left-0 z-10 border-b border-default text-left font-normal', parent ? 'bg-muted-background' : 'bg-base-background', pad)}
                      style={{ paddingLeft: `calc(var(--spacing) * ${3 + group.level * 5})` }}
                    >
                      <span className="flex items-center gap-1.5">
                        {expandable ? (
                          <button
                            type="button"
                            aria-expanded={expanded}
                            aria-label={`${expanded ? 'Collapse' : 'Expand'} ${group.label}`}
                            onClick={() => onToggleGroup(group.id)}
                            className="-ml-1 flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none hover:text-base-foreground focus-visible:shadow-focus-ring"
                          >
                            {expanded ? <IconChevronDown aria-hidden="true" className="size-4" /> : <IconChevronRight aria-hidden="true" className="size-4" />}
                          </button>
                        ) : (
                          <span aria-hidden="true" className="size-4 shrink-0" />
                        )}
                        <span className={cn('min-w-0 truncate', parent ? 'font-medium text-base-foreground' : 'text-medium-foreground')}>{group.label}</span>
                        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{group.total.count}</span>
                      </span>
                    </th>
                    {group.cells.map((cell, index) => (
                      <td key={result.columns[index].key} className={cn('border-b border-default', density === 'compact' ? 'px-1 py-0.5' : 'px-1 py-1')}>
                        {figure(cell, group.id, result.columns[index].key, `${group.label}, ${result.columns[index].label}`, !parent && heat ? heatStep(cell.value, result.range) : null, parent)}
                      </td>
                    ))}
                    <td className={cn('border-b border-l border-default', density === 'compact' ? 'px-1 py-0.5' : 'px-1 py-1')}>{figure(group.total, group.id, null, `${group.label}, total`, null, true)}</td>
                  </tr>
                );
              })
            : null}
        </tbody>
        {!loading && rows.length > 0 ? (
          <tfoot>
            <tr>
              <th scope="row" className={cn('sticky bottom-0 left-0 z-10 border-t border-emphasized bg-muted-background text-left text-sm font-semibold text-base-foreground', pad)}>
                Grand total
              </th>
              {result.grandTotal.cells.map((cell, index) => (
                <td key={result.columns[index].key} className={cn('sticky bottom-0 border-t border-emphasized bg-muted-background', density === 'compact' ? 'px-1 py-0.5' : 'px-1 py-1')}>
                  {figure(cell, null, result.columns[index].key, `Grand total, ${result.columns[index].label}`, null, true)}
                </td>
              ))}
              <td className={cn('sticky bottom-0 border-l border-t border-emphasized bg-muted-background', density === 'compact' ? 'px-1 py-0.5' : 'px-1 py-1')}>{figure(result.grandTotal.total, null, null, 'Grand total', null, true)}</td>
            </tr>
          </tfoot>
        ) : null}
      </table>
    </div>
  );
}
