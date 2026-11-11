import type { ReactNode } from 'react';

import { LOOK_DEFINITIONS, type LookId } from './looks';
import { LookContext } from './useLook';

type LookProviderProps = { look: LookId; children: ReactNode };

/** Context only, for a root that already carries the `data-look` attribute (the app shell). */
export function LookProvider({ look, children }: LookProviderProps) {
  return <LookContext.Provider value={look}>{children}</LookContext.Provider>;
}

type LookScopeProps = {
  look: LookId;
  /**
   * Keep the surrounding accent, typeface and mode instead of the ones the look was drawn with.
   * Dark-only looks then follow the surrounding mode as well.
   */
  inheritTheme?: boolean;
  /** Layout classes for the scope element. */
  className?: string;
  children: ReactNode;
};

/**
 * Draws one region in a look: sets `data-look` on a wrapper, provides the look to every kit
 * component inside, and applies the accent, typeface and mode the look was designed with.
 * Light looks follow the surrounding mode, because Aura defines light only at the root.
 */
export function LookScope({ look, inheritTheme = false, className = '', children }: LookScopeProps) {
  const definition = LOOK_DEFINITIONS[look];
  const dark = !inheritTheme && definition.mode === 'dark';
  const theme = inheritTheme ? {} : { 'data-accent': definition.accent, 'data-typeface': definition.typeface };

  return (
    <LookContext.Provider value={look}>
      <div data-look={look} {...theme} className={`kit-scope font-sans ${dark ? 'dark ' : ''}${className}`.trim()}>
        {children}
      </div>
    </LookContext.Provider>
  );
}
