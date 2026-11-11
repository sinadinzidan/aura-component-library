import { EquipmentBase } from '../EquipmentBase';
import type { EquipmentProps } from '../equipmentProps';
import { Strut } from '../Strut';
import { useEquipmentMaterials } from '../useEquipmentMaterials';

export type SlugCatcherProps = EquipmentProps & {
  /** Number of parallel storage fingers. */
  fingers?: number;
  /** Length of the fingers along x. Gas and liquid enter at −x. */
  length?: number;
  /** Centre-to-centre distance between fingers. */
  pitch?: number;
  /** Finger diameter. */
  diameter?: number;
};

/**
 * A finger-type slug catcher: parallel large-bore pipes that slope gently away from the inlet so
 * liquid slugs from the pipeline settle out, with a gas header across the top of the inlet end and
 * a liquid header under the low end.
 */
export function SlugCatcher({ fingers = 6, length = 36, pitch = 2.4, diameter = 1.2, hovered, selected, dimmed, ...base }: SlugCatcherProps) {
  const { steel, frame, pipe } = useEquipmentMaterials({ hovered, selected, dimmed });
  const count = Math.max(1, Math.round(fingers));
  const radius = diameter / 2;
  const span = (count - 1) * pitch;
  const lanes = Array.from({ length: count }, (_, index) => -span / 2 + index * pitch);
  const high = 2.6;
  const low = 1.3;
  const start = -length / 2;
  const end = length / 2;
  const sleepers = [0.08, 0.36, 0.64, 0.92].map((fraction) => start + length * fraction);

  return (
    <EquipmentBase {...base} dimmed={dimmed} beaconRadius={Math.hypot(length, span) / 2 + 2}>
      {lanes.map((z) => (
        <group key={z}>
          <Strut from={[start, high, z]} to={[end, low, z]} radius={radius} segments={16} material={steel} />
          {/* Riser from each finger to the gas header */}
          <Strut from={[start + 1.2, high, z]} to={[start + 1.2, high + 2, z]} radius={radius * 0.5} material={pipe} />
          {/* Drain to the liquid header */}
          <Strut from={[end - 1, low, z]} to={[end - 1, 0.45, z]} radius={radius * 0.35} material={pipe} />
        </group>
      ))}
      {/* Inlet header, gas outlet header and liquid header across the fingers */}
      <Strut from={[start, high, -span / 2 - 1]} to={[start, high, span / 2 + 1]} radius={radius * 0.9} segments={16} material={steel} />
      <Strut from={[start + 1.2, high + 2, -span / 2 - 1.5]} to={[start + 1.2, high + 2, span / 2 + 0.2]} radius={radius * 0.7} material={pipe} />
      <Strut from={[end - 1, 0.45, -span / 2 - 0.2]} to={[end - 1, 0.45, span / 2 + 1.5]} radius={radius * 0.5} material={pipe} />
      {sleepers.map((x) => {
        const top = high + ((low - high) * (x - start)) / length - radius;
        return (
          <mesh key={x} position={[x, top / 2, 0]} material={frame}>
            <boxGeometry args={[0.5, top, span + 1.6]} />
          </mesh>
        );
      })}
    </EquipmentBase>
  );
}
