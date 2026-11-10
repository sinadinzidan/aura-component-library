import { IconCube } from '@cognite/aura/icons';
import { Canvas } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { cn } from '../../lib/utils';

import { SceneEnvironmentContext } from './sceneEnvironment';
import { SCENE_TOKENS } from './scenePalette';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';
import { useTokenColors } from './useTokenColors';
import { isWebGLAvailable } from './webgl';

export type SceneCanvasProps = {
  /** What the scene shows. Becomes the accessible name of the canvas and the fallback's title. */
  label: string;
  /** three.js content: lights, a camera rig and meshes. Rendered only when WebGL is available. */
  children: ReactNode;
  /** Extra content for the non-WebGL fallback, typically a list of the items in the scene. */
  fallback?: ReactNode;
  /** Render the fallback even when WebGL works, to design or demonstrate it. */
  forceFallback?: boolean;
  /** `demand` renders only when something changes; animated parts ask for frames themselves. */
  frameloop?: 'demand' | 'always' | 'never';
  shadows?: boolean;
  /** Initial camera. A `CameraRig` inside the scene takes over from here. */
  camera?: { position?: [number, number, number]; fov?: number; near?: number; far?: number };
  /** Called on a click that hits nothing, e.g. to clear the selection. */
  onPointerMissed?: () => void;
  /** Layout classes for the wrapper. It fills its parent by default. */
  className?: string;
  /** WebGL check, injectable for tests. */
  webglAvailable?: () => boolean;
};

const DEFAULT_CAMERA = { position: [60, 50, 80], fov: 40, near: 0.5, far: 2000 } satisfies SceneCanvasProps['camera'];

/**
 * The one way to mount a 3D scene. Checks for WebGL, resolves the theme's tokens to material
 * colours (see `useSceneEnvironment`), fills its parent, and names the canvas for assistive
 * technology. Without WebGL it renders a designed fallback instead of a blank box.
 * Give the parent a height; the canvas has none of its own.
 */
export function SceneCanvas({
  label,
  children,
  fallback,
  forceFallback = false,
  frameloop = 'demand',
  shadows = false,
  camera,
  onPointerMissed,
  className,
  webglAvailable = isWebGLAvailable,
}: SceneCanvasProps) {
  const scopeRef = useRef<HTMLDivElement>(null);
  const [supported] = useState(webglAvailable);
  const palette = useTokenColors(SCENE_TOKENS, scopeRef);
  const reducedMotion = usePrefersReducedMotion();
  const environment = useMemo(() => (palette ? { palette, reducedMotion } : null), [palette, reducedMotion]);
  const showScene = supported && !forceFallback;
  const [onScreen, setOnScreen] = useState(true);

  // Scenes that have scrolled out of view stop rendering, so a page can hold several of them.
  useEffect(() => {
    const element = scopeRef.current;
    if (!element || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { rootMargin: '200px' });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={scopeRef} data-slot="scene-canvas" className={cn('relative h-full min-h-0 w-full overflow-hidden', className)}>
      {showScene ? (
        <div role="img" aria-label={label} className="absolute inset-0">
          {environment ? (
            <Canvas
              flat
              dpr={[1, 2]}
              frameloop={onScreen ? frameloop : 'never'}
              shadows={shadows}
              gl={{ antialias: true, alpha: true }}
              camera={{ ...DEFAULT_CAMERA, ...camera }}
              onPointerMissed={onPointerMissed}
            >
              <SceneEnvironmentContext.Provider value={environment}>{children}</SceneEnvironmentContext.Provider>
            </Canvas>
          ) : null}
        </div>
      ) : (
        <div
          role="group"
          aria-label={label}
          data-slot="scene-fallback"
          className="absolute inset-0 flex flex-col items-center justify-center gap-4 overflow-y-auto bg-muted-background p-6 text-center"
        >
          <span className="flex size-12 items-center justify-center rounded-xl border border-default bg-card-background text-muted-foreground">
            <IconCube aria-hidden="true" className="size-6" />
          </span>
          <div className="flex max-w-sm flex-col gap-1">
            <p className="text-sm font-medium text-base-foreground">{label}</p>
            <p className="text-sm text-muted-foreground">
              The 3D view needs WebGL, which is not available here.{fallback ? ' The same items are listed below.' : ''}
            </p>
          </div>
          {fallback ? <div className="w-full max-w-md text-left">{fallback}</div> : null}
        </div>
      )}
    </div>
  );
}
