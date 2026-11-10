import { useThree } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { useEffect, useMemo, useState } from 'react';
import { CatmullRomCurve3, TubeGeometry, Vector3 } from 'three';

import type { Vec3 } from '../cameraTargets';
import { setSceneCursor } from '../sceneCursor';

export type WellTubeProps = {
  id: string;
  /** The path in scene coordinates, wellhead first. See `pathToScene`. */
  points: readonly Vec3[];
  /** Resolved colour of the well type. */
  color: string;
  radius?: number;
  selected?: boolean;
  /** Fade the well back while another one is selected. */
  dimmed?: boolean;
  onSelect?: (id: string) => void;
  onHoverChange?: (id: string | null) => void;
};

/** Builds the tube of a well path. Exported for tests. */
export function wellTubeGeometry(points: readonly Vec3[], radius: number): TubeGeometry {
  const curve = new CatmullRomCurve3(
    points.map((point) => new Vector3(point[0], point[1], point[2])),
    false,
    'centripetal'
  );
  return new TubeGeometry(curve, Math.max(8, points.length * 2), radius, 8, false);
}

/**
 * A wellbore as a smooth tube through its path points. It glows in its type colour, thickens when
 * selected and fades when another well is in focus. A wider invisible tube around it takes the
 * pointer, so a thin well is still easy to click.
 */
export function WellTube({ id, points, color, radius = 0.09, selected = false, dimmed = false, onSelect, onHoverChange }: WellTubeProps) {
  const gl = useThree((state) => state.gl);
  const invalidate = useThree((state) => state.invalidate);
  const [hovered, setHovered] = useState(false);
  const drawn = radius * (selected ? 1.7 : hovered ? 1.3 : 1);
  const tube = useMemo(() => wellTubeGeometry(points, drawn), [points, drawn]);
  const hit = useMemo(() => wellTubeGeometry(points, radius * 4), [points, radius]);
  useEffect(() => () => tube.dispose(), [tube]);
  useEffect(() => () => hit.dispose(), [hit]);
  useEffect(() => () => setSceneCursor(gl.domElement, ''), [gl]);
  const interactive = Boolean(onSelect);

  const enter = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    setHovered(true);
    setSceneCursor(gl.domElement, 'pointer');
    onHoverChange?.(id);
    invalidate();
  };
  const leave = () => {
    setHovered(false);
    setSceneCursor(gl.domElement, '');
    onHoverChange?.(null);
    invalidate();
  };

  return (
    <group>
      <mesh geometry={tube}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={selected ? 0.9 : hovered ? 0.7 : 0.45}
          roughness={0.5}
          transparent={dimmed}
          opacity={dimmed ? 0.16 : 1}
          depthWrite={!dimmed}
        />
      </mesh>
      {interactive ? (
        <mesh
          geometry={hit}
          onPointerOver={enter}
          onPointerOut={leave}
          onClick={(event) => {
            event.stopPropagation();
            onSelect?.(id);
          }}
        >
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      ) : null}
    </group>
  );
}
