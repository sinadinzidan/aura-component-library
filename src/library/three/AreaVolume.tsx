import { useThree } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { useEffect, useMemo, useState } from 'react';
import { BoxGeometry, EdgesGeometry } from 'three';

import { setSceneCursor } from './sceneCursor';
import { useSceneEnvironment } from './sceneEnvironment';

export type AreaVolumeProps = {
  id: string;
  /** Centre on the ground plane: x, z. */
  center: readonly [number, number];
  /** Width (x) and depth (z). */
  size: readonly [number, number];
  height?: number;
  /** The area in focus: stronger outline, no hover. */
  active?: boolean;
  /** Another area is in focus: fade this one back. */
  dimmed?: boolean;
  /** Called with the id when the area's floor is clicked. */
  onSelect?: (id: string) => void;
};

/**
 * A plant area as an outlined volume with a tinted floor plate. Click the floor to select the
 * area; equipment inside stays clickable because `Selectable` stops the event first.
 */
export function AreaVolume({ id, center, size, height = 7, active = false, dimmed = false, onSelect }: AreaVolumeProps) {
  const { palette } = useSceneEnvironment();
  const gl = useThree((state) => state.gl);
  const invalidate = useThree((state) => state.invalidate);
  const [hovered, setHovered] = useState(false);
  const [width, depth] = size;
  const edges = useMemo(() => new EdgesGeometry(new BoxGeometry(width, height, depth)), [width, height, depth]);
  useEffect(() => () => edges.dispose(), [edges]);
  const interactive = Boolean(onSelect) && !active;
  const lit = active || (hovered && interactive);

  const enter = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    setHovered(true);
    setSceneCursor(gl.domElement, 'pointer');
    invalidate();
  };
  const leave = () => {
    setHovered(false);
    setSceneCursor(gl.domElement, '');
    invalidate();
  };

  return (
    <group position={[center[0], 0, center[1]]}>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.03, 0]}
        onPointerOver={interactive ? enter : undefined}
        onPointerOut={interactive ? leave : undefined}
        onClick={
          interactive
            ? (event) => {
                event.stopPropagation();
                leave();
                onSelect?.(id);
              }
            : undefined
        }
      >
        <planeGeometry args={[width, depth]} />
        <meshBasicMaterial color={palette.accent.color} transparent opacity={lit ? 0.14 : dimmed ? 0.02 : 0.06} depthWrite={false} />
      </mesh>
      <lineSegments geometry={edges} position={[0, height / 2 + 0.03, 0]}>
        <lineBasicMaterial color={lit ? palette.accent.color : palette.outline.color} transparent opacity={lit ? 1 : dimmed ? 0.18 : 0.55} />
      </lineSegments>
    </group>
  );
}
