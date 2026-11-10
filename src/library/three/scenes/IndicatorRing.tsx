import { toTuple } from '../cameraTargets';
import type { Vec3 } from '../cameraTargets';

export type IndicatorRingProps = {
  /** Centre of the ring on the ground. */
  position?: Vec3;
  /** Outer radius. */
  radius: number;
  /** Band width. */
  width?: number;
  /** A resolved token colour: a status tone from the scene palette, or a chart colour for a category. */
  color: string;
  opacity?: number;
  /** Fade the ring back with the item it belongs to. */
  dimmed?: boolean;
};

/**
 * A flat band on the ground around an item that carries one encoded value — a status, a category,
 * a threshold class. The item itself stays steel; the ring is the only coloured mark, and a label
 * or legend always says what the colour means.
 */
export function IndicatorRing({ position = [0, 0, 0], radius, width = 1, color, opacity = 0.95, dimmed = false }: IndicatorRingProps) {
  return (
    <mesh position={toTuple([position[0], position[1] + 0.07, position[2]])} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[Math.max(0, radius - width), radius, 56]} />
      <meshBasicMaterial color={color} transparent opacity={dimmed ? opacity * 0.2 : opacity} depthWrite={false} />
    </mesh>
  );
}
