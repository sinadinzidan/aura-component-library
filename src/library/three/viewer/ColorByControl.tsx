import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@cognite/aura/components/select';

import { cn } from '../../../lib/utils';

import { COLOR_KEY_BG, COLOR_MODES, legendInUse } from './colorBy';
import type { ColorMode } from './colorBy';
import { VIEWER_PARTS } from './viewerModel';
import type { ViewerPart } from './viewerModel';

export type ColorByControlProps = {
  mode: ColorMode;
  onModeChange: (mode: ColorMode) => void;
  /** Parts the legend is drawn for; only colours in use are listed. */
  parts?: readonly ViewerPart[];
  className?: string;
};

function isColorMode(value: unknown): value is ColorMode {
  return COLOR_MODES.some((mode) => mode.value === value);
}

/** Choose what colour means on the model and read the legend. Every swatch has its meaning in words. */
export function ColorByControl({ mode, onModeChange, parts = VIEWER_PARTS, className }: ColorByControlProps) {
  const legend = legendInUse(mode, parts);
  return (
    <div data-slot="color-by-control" className={cn('flex w-full flex-col gap-3', className)}>
      <div className="flex flex-col">
        <span className="px-3 pt-1 text-sm font-medium text-base-foreground" id="color-by-label">
          Colour by
        </span>
        <Select items={COLOR_MODES} value={mode} onValueChange={(next) => isColorMode(next) && onModeChange(next)}>
          <SelectTrigger aria-labelledby="color-by-label" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COLOR_MODES.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {legend.length === 0 ? (
        <p className="text-xs text-muted-foreground">No colour coding. Parts show their material.</p>
      ) : (
        <ul aria-label="Colour legend" className="flex flex-col gap-1.5">
          {legend.map((entry) => (
            <li key={entry.key} className="flex items-center gap-2 text-sm text-base-foreground">
              <span aria-hidden="true" className={cn('size-3 shrink-0 rounded-xs', COLOR_KEY_BG[entry.key])} />
              {entry.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
