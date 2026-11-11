import { Label } from '@cognite/aura/components/label';
import { SegmentedControl, SegmentedControlButton, SegmentedControlList } from '@cognite/aura/components/segmented-control';
import { Switch } from '@cognite/aura/components/switch';
import { useId } from 'react';

import { OptionSelect } from '../../patterns/data-entry/OptionSelect';

import type { Aggregation } from './pivot';

export type PivotField = { id: string; label: string };

export type PivotControlsProps = {
  /** Fields that can group rows or columns. */
  dimensions: readonly PivotField[];
  /** Fields that can be measured. */
  measures: readonly PivotField[];
  rows: readonly string[];
  column: string | null;
  measure: string;
  aggregation: Aggregation;
  heat: boolean;
  onRowChange: (level: 0 | 1, field: string | null) => void;
  onColumnChange: (field: string | null) => void;
  onMeasureChange: (field: string) => void;
  onAggregationChange: (aggregation: Aggregation) => void;
  onHeatChange: (heat: boolean) => void;
};

const NONE = '__none__';
const AGGREGATIONS: readonly { value: Aggregation; label: string }[] = [
  { value: 'sum', label: 'Sum' },
  { value: 'count', label: 'Count' },
  { value: 'average', label: 'Average' },
];

/**
 * The controls of a pivot: up to two row fields, a column field, a measure with its aggregation
 * and the heat shading switch. It only reports changes; `explorerReducer` holds the state.
 */
export function PivotControls({ dimensions, measures, rows, column, measure, aggregation, heat, onRowChange, onColumnChange, onMeasureChange, onAggregationChange, onHeatChange }: PivotControlsProps) {
  const id = useId();
  const dimensionOptions = (none: string) => [{ value: NONE, label: none }, ...dimensions.map((field) => ({ value: field.id, label: field.label }))];
  const pick = (value: string) => (value === NONE ? null : value);

  return (
    <div data-slot="pivot-controls" className="flex flex-wrap items-end gap-x-4 gap-y-3">
      <div className="min-w-40">
        <Label htmlFor={`${id}-row0`}>Group rows by</Label>
        <OptionSelect id={`${id}-row0`} size="sm" options={dimensionOptions('No grouping')} value={rows[0] ?? NONE} onValueChange={(value) => onRowChange(0, pick(value))} />
      </div>
      <div className="min-w-40">
        <Label htmlFor={`${id}-row1`}>Then by</Label>
        <OptionSelect id={`${id}-row1`} size="sm" options={dimensionOptions('None')} value={rows[1] ?? NONE} disabled={rows.length === 0} onValueChange={(value) => onRowChange(1, pick(value))} />
      </div>
      <div className="min-w-40">
        <Label htmlFor={`${id}-column`}>Columns</Label>
        <OptionSelect id={`${id}-column`} size="sm" options={dimensionOptions('One total column')} value={column ?? NONE} onValueChange={(value) => onColumnChange(pick(value))} />
      </div>
      <div className="min-w-40">
        <Label htmlFor={`${id}-measure`}>Measure</Label>
        <OptionSelect id={`${id}-measure`} size="sm" options={measures.map((field) => ({ value: field.id, label: field.label }))} value={measure} disabled={aggregation === 'count'} onValueChange={onMeasureChange} />
      </div>
      <SegmentedControl value={aggregation} onValueChange={(value) => onAggregationChange(AGGREGATIONS.find((option) => option.value === value)?.value ?? 'sum')}>
        <SegmentedControlList aria-label="Aggregation" size="small">
          {AGGREGATIONS.map((option) => (
            <SegmentedControlButton key={option.value} value={option.value} tabContent="label-only" size="small">
              {option.label}
            </SegmentedControlButton>
          ))}
        </SegmentedControlList>
      </SegmentedControl>
      <Switch label="Heat shading" checked={heat} onCheckedChange={(next) => onHeatChange(next)} />
    </div>
  );
}
