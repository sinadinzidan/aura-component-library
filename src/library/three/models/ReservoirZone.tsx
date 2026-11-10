import { Edges } from '@react-three/drei';
import { DoubleSide } from 'three';

export type ReservoirZoneProps = {
  /** Top and base of the zone in scene units (negative below the seabed). */
  top: number;
  base: number;
  /** Half the width of the zone on the map. */
  halfExtent: number;
  /** Resolved colour. */
  color: string;
  opacity?: number;
};

/** The reservoir interval as a translucent slab with outlined edges, between two depths. */
export function ReservoirZone({ top, base, halfExtent, color, opacity = 0.12 }: ReservoirZoneProps) {
  const thickness = Math.abs(top - base);

  return (
    <mesh position={[0, (top + base) / 2, 0]}>
      <boxGeometry args={[halfExtent * 2, thickness, halfExtent * 2]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} side={DoubleSide} depthWrite={false} />
      <Edges color={color} lineWidth={1} transparent opacity={0.7} />
    </mesh>
  );
}
