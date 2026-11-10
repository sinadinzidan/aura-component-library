import { useEffect } from 'react';
import type { ReactNode } from 'react';

import type { Theme } from '../state/catalogState';

type ThemeRootProps = {
  theme: Theme;
  /** Element that carries Aura's `.dark` class. Portalled overlays inherit it from here. */
  target: Pick<HTMLElement, 'classList'>;
  children: ReactNode;
};

/** Keeps Aura's theme class on the document root in step with the selected theme. */
export function ThemeRoot({ theme, target, children }: ThemeRootProps) {
  useEffect(() => {
    target.classList.toggle('dark', theme === 'dark');
  }, [theme, target]);
  return <>{children}</>;
}
