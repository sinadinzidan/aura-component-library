import { Button } from '@cognite/aura/components/button';
import { SegmentedControl, SegmentedControlButton, SegmentedControlList } from '@cognite/aura/components/segmented-control';
import { Slider } from '@cognite/aura/components/slider';
import { Switch } from '@cognite/aura/components/switch';
import type { Dispatch } from 'react';

import { cn } from '../../../lib/utils';
import type { Bounds } from '../cameraTargets';

import { clipWorldPosition, describeClip } from './clipPlane';
import type { ClipAction, ClipAxis, ClipState } from './clipPlane';

export type ClipPlaneControlProps = {
  state: ClipState;
  dispatch: Dispatch<ClipAction>;
  /** Bounds of the model, so the position can be printed in metres. */
  bounds: Bounds;
  className?: string;
};

const AXES: readonly { value: ClipAxis; label: string }[] = [
  { value: 'x', label: 'East–west' },
  { value: 'y', label: 'Height' },
  { value: 'z', label: 'North–south' },
];

function isAxis(value: unknown): value is ClipAxis {
  return value === 'x' || value === 'y' || value === 'z';
}

/**
 * Controls for a section plane: switch it on, choose the axis, slide it through the model and pick
 * which side to keep. The state sentence below the controls is a live region, so a screen reader
 * hears where the cut is. The 3D side clips with a plane from `clipPlaneFor`.
 */
export function ClipPlaneControl({ state, dispatch, bounds, className }: ClipPlaneControlProps) {
  const position = Math.round(clipWorldPosition(bounds, state) * 10) / 10;

  return (
    <div role="group" aria-label="Section plane" data-slot="clip-plane-control" className={cn('flex w-full flex-col gap-4', className)}>
      <Switch label="Section plane" checked={state.enabled} onCheckedChange={(checked) => dispatch({ type: 'enable', enabled: checked })} />
      <SegmentedControl value={state.axis} onValueChange={(next: unknown) => isAxis(next) && dispatch({ type: 'axis', axis: next })}>
        <SegmentedControlList aria-label="Plane axis" size="small">
          {AXES.map((axis) => (
            <SegmentedControlButton key={axis.value} value={axis.value} size="small" tabContent="label-only" disabled={!state.enabled}>
              {axis.label}
            </SegmentedControlButton>
          ))}
        </SegmentedControlList>
      </SegmentedControl>
      <div className="flex items-center gap-3">
        <span className="shrink-0 text-sm text-base-foreground">Position</span>
        <Slider aria-label="Plane position" min={0} max={100} step={1} disabled={!state.enabled} value={[Math.round(state.position * 100)]} onValueChange={(next) => dispatch({ type: 'position', position: (next[0] ?? 50) / 100 })} />
        <span className="w-14 shrink-0 text-right text-sm tabular-nums text-muted-foreground">{position} m</span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <Switch label="Keep the far side" checked={state.flip} disabled={!state.enabled} onCheckedChange={(checked) => dispatch({ type: 'flip', flip: checked })} />
        <Button variant="ghost" size="sm" onClick={() => dispatch({ type: 'reset' })}>
          Reset plane
        </Button>
      </div>
      <p aria-live="polite" className="text-xs text-muted-foreground">
        {describeClip(bounds, state)}
      </p>
    </div>
  );
}
