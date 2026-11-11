import { CheckboxItem, CheckboxItemControl, CheckboxItemLabel } from '@cognite/aura/components/checkbox';
import { SegmentedControl, SegmentedControlButton, SegmentedControlList } from '@cognite/aura/components/segmented-control';

import { cn } from '../../../lib/utils';

import { SYSTEM_ORDER, systemLabel } from './colorBy';
import { VIEWER_PARTS } from './viewerModelLogic';
import type { ViewerSystem } from './viewerModelLogic';

export type LayerFilterProps = {
  /** Systems that are switched on. */
  enabled: readonly ViewerSystem[];
  onEnabledChange: (systems: ViewerSystem[]) => void;
  /** What happens to systems that are off: disappear, or fade back for context. */
  mode: 'hide' | 'ghost';
  onModeChange: (mode: 'hide' | 'ghost') => void;
  className?: string;
};

/**
 * Layers by system: a checkbox per system with its part count, and a choice between hiding the
 * layers that are off and ghosting them, which keeps the context of the whole module.
 */
export function LayerFilter({ enabled, onEnabledChange, mode, onModeChange, className }: LayerFilterProps) {
  const toggle = (system: ViewerSystem, on: boolean) => onEnabledChange(on ? [...enabled, system] : enabled.filter((candidate) => candidate !== system));

  return (
    <div data-slot="layer-filter" className={cn('flex w-full flex-col gap-3', className)}>
      <ul aria-label="Layers" className="flex flex-col gap-2">
        {SYSTEM_ORDER.map((system) => (
          <li key={system} className="flex items-center justify-between gap-3">
            <CheckboxItem>
              <CheckboxItemControl checked={enabled.includes(system)} onCheckedChange={(checked) => toggle(system, checked)} />
              <CheckboxItemLabel>{systemLabel(system)}</CheckboxItemLabel>
            </CheckboxItem>
            <span className="text-xs text-muted-foreground tabular-nums">{VIEWER_PARTS.filter((part) => part.system === system).length}</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-muted-foreground">Layers that are off</span>
        <SegmentedControl value={mode} onValueChange={(next: unknown) => (next === 'hide' || next === 'ghost') && onModeChange(next)}>
          <SegmentedControlList aria-label="Treatment of layers that are off" size="small">
            <SegmentedControlButton value="ghost" size="small" tabContent="label-only">
              Ghost
            </SegmentedControlButton>
            <SegmentedControlButton value="hide" size="small" tabContent="label-only">
              Hide
            </SegmentedControlButton>
          </SegmentedControlList>
        </SegmentedControl>
      </div>
    </div>
  );
}
