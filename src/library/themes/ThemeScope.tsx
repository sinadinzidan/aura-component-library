import type { ReactNode } from 'react';

import { LookProvider } from '../looks/LookScope';

import { DEFAULT_THEME, THEME_PRESETS, themeAttributes, type ThemeSettings } from './themes';

type ThemeScopeProps = {
  /** Id of a preset from `THEME_PRESETS`, for example `control-room`. */
  preset?: string;
  /** Explicit settings; wins over `preset`. */
  settings?: ThemeSettings;
  /** Layout classes for the scope element. */
  className?: string;
  children: ReactNode;
};

/**
 * Themes one region: everything inside renders in the given preset, whatever the rest of the app
 * uses. Dark presets force dark here; other presets follow the surrounding mode, because Aura
 * defines light only at the root. Kit components inside draw themselves in the preset's look.
 */
export function ThemeScope({ preset, settings, className = '', children }: ThemeScopeProps) {
  const resolved = settings ?? THEME_PRESETS.find((candidate) => candidate.id === preset)?.settings ?? DEFAULT_THEME;
  const mode = resolved.mode === 'dark' ? 'dark' : '';

  return (
    <div
      {...themeAttributes(resolved)}
      data-theme-scope={preset ?? 'custom'}
      className={`${mode} font-sans text-base-foreground ${className}`.trim()}
    >
      <LookProvider look={resolved.look}>{children}</LookProvider>
    </div>
  );
}
