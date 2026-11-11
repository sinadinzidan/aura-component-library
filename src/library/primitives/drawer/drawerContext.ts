import { createContext, useContext } from 'react';

export type DrawerContextValue = {
  /** Modal drawers trap focus and dim the page; non-modal drawers leave the page usable. */
  modal: boolean;
  /** False while closing is blocked, for example during a save. */
  dismissible: boolean;
};

export const DrawerContext = createContext<DrawerContextValue>({ modal: true, dismissible: true });

/** Reads the settings of the nearest `Drawer`. */
export function useDrawerContext(): DrawerContextValue {
  return useContext(DrawerContext);
}
