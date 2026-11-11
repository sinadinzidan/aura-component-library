import { createContext, useContext } from 'react';

import { DEFAULT_LOOK, LOOK_DEFINITIONS, type LookDefinition, type LookId } from './looks';

export const LookContext = createContext<LookId>(DEFAULT_LOOK);

/** The look kit components should draw themselves in. `studio` outside any scope. */
export function useLook(): LookId {
  return useContext(LookContext);
}

/** The active look with its chart style and recommendations. */
export function useLookDefinition(): LookDefinition {
  return LOOK_DEFINITIONS[useLook()];
}
