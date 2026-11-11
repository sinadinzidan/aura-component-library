import { Button } from '@cognite/aura/components/button';

import type { GridItem } from './gridLayout';
import { LayoutThumbnail } from './LayoutThumbnail';

export type LayoutPreset = {
  id: string;
  name: string;
  /** Who or what the layout is for, in one line. */
  description: string;
  items: readonly GridItem[];
};

type LayoutPresetPickerProps = {
  presets: readonly LayoutPreset[];
  /** Id of the preset the dashboard currently matches, if any. */
  activeId?: string;
  onApply: (id: string) => void;
  cols?: number;
  /** Accessible name of the list. */
  label?: string;
};

/**
 * Starting layouts to choose from, each with a thumbnail of its arrangement. Applying one
 * replaces the whole dashboard in a single undoable step; the preset in use says so instead of
 * offering the button.
 */
export function LayoutPresetPicker({ presets, activeId, onApply, cols = 12, label = 'Layout presets' }: LayoutPresetPickerProps) {
  return (
    <div className="@container w-full">
    <ul aria-label={label} data-slot="layout-preset-picker" className="grid w-full grid-cols-1 gap-4 @md:grid-cols-3">
      {presets.map((preset) => {
        const active = preset.id === activeId;
        return (
          <li key={preset.id} className="flex min-w-0 flex-col gap-3">
            <LayoutThumbnail label={`${preset.name} layout, ${preset.items.length} widgets`} items={preset.items} cols={cols} />
            <div className="flex min-w-0 flex-col">
              <span className="text-sm font-medium text-base-foreground">{preset.name}</span>
              <span className="text-xs text-muted-foreground">{preset.description}</span>
            </div>
            {active ? (
              <span className="flex h-8 items-center text-xs font-medium text-medium-foreground">In use</span>
            ) : (
              <Button variant="secondary" size="sm" className="self-start" aria-label={`Apply ${preset.name} layout`} onClick={() => onApply(preset.id)}>
                Apply layout
              </Button>
            )}
          </li>
        );
      })}
    </ul>
    </div>
  );
}
