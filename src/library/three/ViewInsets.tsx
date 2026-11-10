import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { PerspectiveCamera } from 'three';

import { viewOffsetFor } from './cameraTargets';
import type { ViewInsetsValue } from './cameraTargets';
import { useSceneEnvironment } from './sceneEnvironment';

export type ViewInsetsProps = ViewInsetsValue;

/**
 * Keeps the subject clear of overlays. Tell it how many pixels HUD panels cover on each edge and
 * it shifts the camera's view window so whatever the camera looks at lands in the middle of the
 * free part of the canvas. The shift eases when panels open and close.
 */
export function ViewInsets({ top = 0, right = 0, bottom = 0, left = 0 }: ViewInsetsProps) {
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const invalidate = useThree((state) => state.invalidate);
  const { reducedMotion } = useSceneEnvironment();
  const current = useRef<{ x: number; y: number } | null>(null);
  const goal = viewOffsetFor({ top, right, bottom, left });

  useEffect(() => {
    invalidate();
  }, [goal.x, goal.y, size.width, size.height, invalidate]);

  useEffect(
    () => () => {
      if (camera instanceof PerspectiveCamera) camera.clearViewOffset();
    },
    [camera]
  );

  useFrame((_, delta) => {
    if (!(camera instanceof PerspectiveCamera)) return;
    const offset = current.current ?? { x: goal.x, y: goal.y };
    const ease = reducedMotion ? 1 : Math.min(1, Math.min(delta, 0.05) * 7);
    offset.x += (goal.x - offset.x) * ease;
    offset.y += (goal.y - offset.y) * ease;
    const settled = Math.abs(goal.x - offset.x) < 0.5 && Math.abs(goal.y - offset.y) < 0.5;
    if (settled) {
      offset.x = goal.x;
      offset.y = goal.y;
    }
    current.current = offset;
    camera.setViewOffset(size.width, size.height, offset.x, offset.y, size.width, size.height);
    if (!settled) invalidate();
  });

  return null;
}
