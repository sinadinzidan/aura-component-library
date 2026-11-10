import { DoubleSide } from 'three';

import { useSceneEnvironment } from '../sceneEnvironment';

export type ScanPlaneProps = {
  /** Radius of the plane's disc. */
  radius: number;
  /** Radius of the cross-section the plane is cutting; `null` when it is between parts. */
  sectionRadius?: number | null;
  /** Resolved colour; the accent by default. */
  color?: string;
};

/**
 * A horizontal scan plane: a faint disc with a bright rim, and a brighter ring where it cuts the
 * model. It sits at the origin of its parent group — move the group along y to sweep it.
 */
export function ScanPlane({ radius, sectionRadius = null, color }: ScanPlaneProps) {
  const { palette } = useSceneEnvironment();
  const tint = color ?? palette.accent.color;

  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <mesh>
        <circleGeometry args={[radius, 48]} />
        <meshBasicMaterial color={tint} transparent opacity={0.1} side={DoubleSide} depthWrite={false} />
      </mesh>
      <mesh>
        <ringGeometry args={[radius * 0.985, radius, 64]} />
        <meshBasicMaterial color={tint} transparent opacity={0.9} side={DoubleSide} depthWrite={false} />
      </mesh>
      {sectionRadius !== null ? (
        <mesh renderOrder={6}>
          <ringGeometry args={[sectionRadius * 1.02, sectionRadius * 1.02 + 0.09, 48]} />
          <meshBasicMaterial color={palette.highlight.color} transparent opacity={0.95} side={DoubleSide} depthTest={false} />
        </mesh>
      ) : null}
    </group>
  );
}
