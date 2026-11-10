import { createContext, useContext } from 'react';

import type { ScenePalette } from './scenePalette';

/** What `SceneCanvas` provides to everything rendered inside it. */
export type SceneEnvironment = {
  /** Token colours of the surrounding theme, ready for materials. */
  palette: ScenePalette;
  /** True when the user asked for reduced motion: skip flights, pulses and flicker. */
  reducedMotion: boolean;
};

export const SceneEnvironmentContext = createContext<SceneEnvironment | null>(null);

/**
 * The palette and motion preference of the enclosing `SceneCanvas`. Every 3D component in this
 * folder reads its colours here, so a scene follows the theme without passing colours around.
 */
export function useSceneEnvironment(): SceneEnvironment {
  const environment = useContext(SceneEnvironmentContext);
  if (!environment) throw new Error('useSceneEnvironment must be used inside <SceneCanvas>.');
  return environment;
}
