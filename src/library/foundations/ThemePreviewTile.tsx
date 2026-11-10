import type { ReactNode } from 'react';

import { THEME_PRESETS } from '../themes/themes';
import { ThemeScope } from '../themes/ThemeScope';

export type ThemePreviewTileProps = {
  /** Id of a preset from `THEME_PRESETS`, for example `control-room`. */
  preset: string;
  /** The sample screen. Build it from tokens only, so the preset is all that changes. */
  children: ReactNode;
  /** Overrides the preset name in the caption. */
  caption?: string;
};

/**
 * One sample screen inside one theme preset, with the preset's name underneath. Put several in a
 * grid to compare presets at a glance. Dark presets render dark; the others follow the page.
 */
export function ThemePreviewTile({ preset, children, caption }: ThemePreviewTileProps) {
  const found = THEME_PRESETS.find((candidate) => candidate.id === preset);
  const name = caption ?? found?.name ?? preset;
  const isDark = found?.settings.mode === 'dark';

  return (
    <figure data-slot="theme-preview-tile" data-preset={preset} className="flex min-w-0 flex-col gap-2">
      <ThemeScope preset={preset} className="flex min-w-0 flex-1 flex-col rounded-xl bg-base-background p-3">
        {children}
      </ThemeScope>
      <figcaption className="flex items-baseline justify-between gap-2 text-xs">
        <span className="font-medium text-base-foreground">{name}</span>
        <span className="text-muted-foreground">{isDark ? 'Always dark' : 'Follows page mode'}</span>
      </figcaption>
    </figure>
  );
}
