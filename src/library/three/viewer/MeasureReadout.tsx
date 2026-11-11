import { Button } from '@cognite/aura/components/button';

import { cn } from '../../../lib/utils';

import { formatLength, measureHint, measurementOf } from './measure';
import type { MeasureState } from './measure';

export type MeasureReadoutProps = {
  state: MeasureState;
  onUndo: () => void;
  onClear: () => void;
  className?: string;
};

/**
 * The readout of the measure tool: what to pick next, then the straight-line distance with its
 * east–west, height and north–south parts. The sentence at the top is announced as it changes.
 */
export function MeasureReadout({ state, onUndo, onClear, className }: MeasureReadoutProps) {
  const measurement = measurementOf(state);
  return (
    <div data-slot="measure-readout" className={cn('flex w-full flex-col gap-3', className)}>
      <p aria-live="polite" className="text-sm text-medium-foreground">
        {measureHint(state)}
      </p>
      {measurement ? (
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm">
          <dt className="text-muted-foreground">Distance</dt>
          <dd className="text-right text-lg font-semibold tabular-nums text-base-foreground">{formatLength(measurement.distance)}</dd>
          <dt className="text-muted-foreground">East–west</dt>
          <dd className="text-right tabular-nums text-base-foreground">{formatLength(measurement.dx)}</dd>
          <dt className="text-muted-foreground">Height</dt>
          <dd className="text-right tabular-nums text-base-foreground">{formatLength(measurement.dy)}</dd>
          <dt className="text-muted-foreground">North–south</dt>
          <dd className="text-right tabular-nums text-base-foreground">{formatLength(measurement.dz)}</dd>
          <dt className="text-muted-foreground">Along the ground</dt>
          <dd className="text-right tabular-nums text-base-foreground">{formatLength(measurement.horizontal)}</dd>
        </dl>
      ) : null}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={state.points.length === 0} onClick={onUndo}>
          Undo point
        </Button>
        <Button variant="ghost" size="sm" disabled={state.points.length === 0} onClick={onClear}>
          Clear
        </Button>
      </div>
    </div>
  );
}
