import { useMemo } from 'react';
import type { ReactNode } from 'react';

import { SceneEnvironmentContext, useSceneEnvironment } from '../sceneEnvironment';

export type StillSceneProps = {
  /** Set to false to let the content move again. */
  still?: boolean;
  children: ReactNode;
};

/**
 * Holds everything inside it still: pulses, flights, flicker and sweeps behave as they do under
 * reduced motion and the scene renders single frames on demand. Wrap the content of secondary
 * scenes in it — thumbnails, theme previews, part stages — so that only the main scene on a page
 * animates. Render it inside `SceneCanvas`.
 */
export function StillScene({ still = true, children }: StillSceneProps) {
  const environment = useSceneEnvironment();
  const value = useMemo(() => ({ ...environment, reducedMotion: environment.reducedMotion || still }), [environment, still]);

  return <SceneEnvironmentContext.Provider value={value}>{children}</SceneEnvironmentContext.Provider>;
}
