import { useEffect, useMemo } from 'react';
import { DoubleSide } from 'three';
import type { MeshStandardMaterial } from 'three';

export type SectionCutProps = {
  radius: number;
  length: number;
  /** Removes the top half, leaving an open trough you can look into. */
  cut?: boolean;
  /** Shell material. A double-sided copy is used for the cut shell so its inside shows. */
  material: MeshStandardMaterial;
  /** Material of the joint faces along the cut. */
  rimMaterial: MeshStandardMaterial;
  segments?: number;
};

const QUARTER_TURN = Math.PI / 2;

/**
 * A horizontal cylindrical shell along x that can be sectioned on its horizontal joint: whole, or
 * with the top half lifted away and the two joint faces showing. For barrel casings, vessels and
 * pipes whose internals matter.
 */
export function SectionCut({ radius, length, cut = false, material, rimMaterial, segments = 28 }: SectionCutProps) {
  const inside = useMemo(() => {
    const copy = material.clone();
    copy.side = DoubleSide;
    return copy;
  }, [material]);
  useEffect(() => () => inside.dispose(), [inside]);

  if (!cut) {
    return (
      <mesh rotation={[0, 0, QUARTER_TURN]} material={material}>
        <cylinderGeometry args={[radius, radius, length, segments]} />
      </mesh>
    );
  }

  return (
    <group>
      <mesh rotation={[0, 0, QUARTER_TURN]} material={inside}>
        <cylinderGeometry args={[radius, radius, length, segments / 2, 1, true, Math.PI, Math.PI]} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[0, 0, side * (radius - 0.07)]} material={rimMaterial}>
          <boxGeometry args={[length, 0.05, 0.14]} />
        </mesh>
      ))}
    </group>
  );
}
