import { useEffect } from 'react';
import type { ReactNode } from 'react';

import { LookProvider } from '../../library/looks/LookScope';
import { themeAttributes, type ThemeSettings } from '../../library/themes/themes';

type ThemeRootProps = {
  theme: ThemeSettings;
  /** Element that carries Aura's `.dark` class and the theme attributes. Portalled overlays inherit from it. */
  target: Pick<HTMLElement, 'classList' | 'setAttribute'>;
  children: ReactNode;
};

/** Keeps the document root in step with the selected theme and gives kit components its look. */
export function ThemeRoot({ theme, target, children }: ThemeRootProps) {
  useEffect(() => {
    target.classList.toggle('dark', theme.mode === 'dark');
    for (const [name, value] of Object.entries(themeAttributes(theme))) target.setAttribute(name, value);
  }, [theme, target]);
  return <LookProvider look={theme.look}>{children}</LookProvider>;
}
