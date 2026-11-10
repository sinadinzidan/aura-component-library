import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Group } from 'three';

import { useSceneEnvironment } from '../sceneEnvironment';

import { easeLift } from './explode';

export type ExplodeLiftProps = {
  /** How far the content is raised. Change it and the content glides there. */
  y: number;
  /** Glide time in seconds. The move is instant under reduced motion. */
  duration?: number;
  children: ReactNode;
};

type Move = { from: number; to: number; startedAt: number | null };

/**
 * Raises its content to a height and eases to every new one — the moving part of an exploded
 * view. Wrap each level in one and feed it `explodeOffset`. The first height is applied at once.
 */
export function ExplodeLift({ y, duration = 0.8, children }: ExplodeLiftProps) {
  const group = useRef<Group>(null);
  const move = useRef<Move | null>(null);
  const mounted = useRef(false);
  const [initialY] = useState(y);
  const invalidate = useThree((state) => state.invalidate);
  const { reducedMotion } = useSceneEnvironment();

  useEffect(() => {
    const node = group.current;
    if (!node) return;
    if (!mounted.current || reducedMotion || duration <= 0) {
      mounted.current = true;
      move.current = null;
      node.position.setY(y);
    } else {
      move.current = { from: node.position.y, to: y, startedAt: null };
    }
    invalidate();
  }, [y, reducedMotion, duration, invalidate]);

  useFrame((state) => {
    const current = move.current;
    const node = group.current;
    if (!current || !node) return;
    const now = state.clock.elapsedTime;
    current.startedAt ??= now;
    const progress = (now - current.startedAt) / duration;
    node.position.setY(easeLift(current.from, current.to, progress));
    if (progress >= 1) move.current = null;
    state.invalidate();
  });

  return (
    <group ref={group} position-y={initialY}>
      {children}
    </group>
  );
}
