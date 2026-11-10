import { useMemo } from 'react';
import type { ReactNode } from 'react';

import { SceneEnvironmentContext, useSceneEnvironment } from '../sceneEnvironment';

export type StillSceneProps = {
  /** Set to false to let the scene animate again. */
  still?: boolean;
  children: ReactNode;
};

/**
 * Holds everything inside it still: flights are instant, pulses, flames and flow chevrons freeze.
 * It tells the scene the user prefers reduced motion, so every part that already respects that
 * preference stops asking for frames. Use it for thumbnails, theme previews and any page that
 * mounts several scenes, where only one should animate.
 */
export function StillScene({ still = true, children }: StillSceneProps) {
  const environment = useSceneEnvironment();
  const value = useMemo(() => (still ? { ...environment, reducedMotion: true } : environment), [environment, still]);

  return <SceneEnvironmentContext.Provider value={value}>{children}</SceneEnvironmentContext.Provider>;
}
