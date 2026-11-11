import { Button } from '@cognite/aura/components/button';
import { useMemo, useReducer } from 'react';

import { cn } from '../../../lib/utils';
import { HeatScaleLegend } from '../../industrial/charts/HeatScaleLegend';

import { explorerReducer, initialExplorerState, specOf } from './explorerReducer';
import { expandableIds, pivot, recordsOf } from './pivot';
import type { Aggregation, PivotRecord, PivotSpec } from './pivot';
import { PivotControls } from './PivotControls';
import type { PivotField } from './PivotControls';
import { PivotDrillPanel } from './PivotDrillPanel';
import type { DrillColumn } from './PivotDrillPanel';
import { PivotTable } from './PivotTable';

export type PivotExplorerProps = {
  /** Name of the report, for the accessible name of the table and panel: "Work orders". */
  label: string;
  records: readonly PivotRecord[];
  dimensions: readonly PivotField[];
  measures: readonly PivotField[];
  /** Starting layout. */
  initial: Pick<PivotSpec, 'rows' | 'column' | 'measure' | 'aggregation'>;
  initialHeat?: boolean;
  /** Preferred value order per field, such as months. */
  order?: PivotSpec['order'];
  /** Decimals and unit for a measure, so a figure reads "14.5 h". Counts are always whole numbers. */
  measureFormat: Readonly<Record<string, { decimals: number; unit?: string }>>;
  /** Columns of the drill-through panel. */
  drillColumns: readonly DrillColumn[];
  loading?: boolean;
  density?: 'default' | 'compact';
  /** Layout classes for the frame, usually a height. */
  className?: string;
};

const AGGREGATION_NAME: Record<Aggregation, string> = { sum: 'Sum of', count: 'Count of records', average: 'Average' };

function formatFigure(value: number | null, decimals: number, unit?: string): string {
  if (value === null) return '';
  const text = new Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
  return unit ? `${text}\u00a0${unit}` : text;
}

/**
 * A working pivot report: field controls, the pivot table with collapsible groups, optional heat
 * shading and a drill-through panel for any figure. State lives in `explorerReducer`.
 */
export function PivotExplorer({ label, records, dimensions, measures, initial, initialHeat = false, order, measureFormat, drillColumns, loading = false, density = 'default', className }: PivotExplorerProps) {
  const [state, dispatch] = useReducer(explorerReducer, undefined, () => initialExplorerState(initial, initialHeat));
  const result = useMemo(() => pivot(records, specOf(state, order)), [records, state, order]);
  const field = (id: string | null, list: readonly PivotField[]) => list.find((candidate) => candidate.id === id)?.label ?? '';
  const measureLabel = field(state.measure, measures);
  const format = measureFormat[state.measure] ?? { decimals: 0 };
  const decimals = state.aggregation === 'count' ? 0 : format.decimals + (state.aggregation === 'average' ? 1 : 0);
  const unit = state.aggregation === 'count' ? undefined : format.unit;
  const formatValue = (value: number | null) => formatFigure(value, decimals, unit);
  const title = state.aggregation === 'count' ? AGGREGATION_NAME.count : `${AGGREGATION_NAME[state.aggregation]} ${measureLabel.toLowerCase()}`;
  const collapsed = useMemo(() => new Set(state.collapsed), [state.collapsed]);
  const ids = useMemo(() => expandableIds(result.groups), [result.groups]);

  const drilled = useMemo(() => {
    if (!state.drill) return null;
    const { groupId, columnKey } = state.drill;
    const find = (list: typeof result.groups): (typeof result.groups)[number] | undefined => {
      for (const group of list) {
        if (group.id === groupId) return group;
        const inner = find(group.children);
        if (inner) return inner;
      }
      return undefined;
    };
    const group = groupId === null ? undefined : find(result.groups);
    const columnIndex = columnKey === null ? -1 : result.columns.findIndex((column) => column.key === columnKey);
    const source = group ?? result.grandTotal;
    const cell = columnIndex === -1 ? source.total : source.cells[columnIndex];
    if (!cell) return null;
    const parts = [group?.label ?? 'All records', columnKey === null ? null : columnKey];
    return { title: parts.filter((part) => part !== null).join(', '), records: recordsOf(records, cell.records) };
  }, [state.drill, result, records]);

  return (
    <div data-slot="pivot-explorer" className={cn('flex w-full min-w-0 flex-col gap-4', className)}>
      <PivotControls
        dimensions={dimensions}
        measures={measures}
        rows={state.rows}
        column={state.column}
        measure={state.measure}
        aggregation={state.aggregation}
        heat={state.heat}
        onRowChange={(level, next) => dispatch({ type: 'setRow', level, field: next })}
        onColumnChange={(next) => dispatch({ type: 'setColumn', field: next })}
        onMeasureChange={(next) => dispatch({ type: 'setMeasure', field: next })}
        onAggregationChange={(next) => dispatch({ type: 'setAggregation', aggregation: next })}
        onHeatChange={(next) => dispatch({ type: 'setHeat', heat: next })}
      />
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" disabled={ids.length === 0 || state.collapsed.length === 0} onClick={() => dispatch({ type: 'expandAll' })}>
            Expand all
          </Button>
          <Button variant="ghost" size="sm" disabled={ids.length === 0 || state.collapsed.length === ids.length} onClick={() => dispatch({ type: 'collapseAll', ids })}>
            Collapse all
          </Button>
        </div>
        {state.heat && result.range ? <HeatScaleLegend title={title} lowLabel={formatValue(result.range.min)} highLabel={formatValue(result.range.max)} emptyLabel="No records" /> : <span className="text-xs tabular-nums text-muted-foreground">{result.recordCount} records</span>}
      </div>
      <div className={cn('grid min-h-0 min-w-0 flex-1 gap-4', drilled ? 'grid-cols-[minmax(0,1fr)_20rem]' : 'grid-cols-1')}>
        <div className="min-h-0 min-w-0 overflow-auto">
          <PivotTable
            result={result}
            label={`${label}: ${title.toLowerCase()}`}
            rowFieldLabels={state.rows.map((row) => field(row, dimensions))}
            columnFieldLabel={state.column ? field(state.column, dimensions) : undefined}
            measureLabel={title}
            formatValue={formatValue}
            collapsed={collapsed}
            onToggleGroup={(id) => dispatch({ type: 'toggleGroup', id })}
            heat={state.heat}
            onDrill={(selection) => dispatch({ type: 'drill', selection })}
            selection={state.drill}
            loading={loading}
            density={density}
          />
        </div>
        {drilled ? <PivotDrillPanel title={drilled.title} records={drilled.records} columns={drillColumns} onClose={() => dispatch({ type: 'closeDrill' })} /> : null}
      </div>
    </div>
  );
}
