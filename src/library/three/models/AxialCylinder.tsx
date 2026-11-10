import type { Material } from 'three';

export type AxialCylinderProps = {
  /** Centre of the cylinder along the shaft axis. */
  x: number;
  y?: number;
  z?: number;
  /** Radius at the −x end, and everywhere unless `radiusEnd` is set. */
  radius: number;
  /** Radius at the +x end, for cones and reducers. */
  radiusEnd?: number;
  length: number;
  material: Material;
  segments?: number;
};

const QUARTER_TURN = Math.PI / 2;

/** A cylinder or cone lying along the x axis: casings, shafts, flanges and couplings of rotating machines. */
export function AxialCylinder({ x, y = 0, z = 0, radius, radiusEnd = radius, length, material, segments = 24 }: AxialCylinderProps) {
  return (
    <mesh position={[x, y, z]} rotation={[0, 0, QUARTER_TURN]} material={material}>
      <cylinderGeometry args={[radius, radiusEnd, length, segments]} />
    </mesh>
  );
}
