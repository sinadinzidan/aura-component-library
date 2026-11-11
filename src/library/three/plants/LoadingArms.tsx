import { EquipmentBase } from '../EquipmentBase';
import type { EquipmentProps } from '../equipmentProps';
import { Strut } from '../Strut';
import { useEquipmentMaterials } from '../useEquipmentMaterials';

export type LoadingArmsProps = EquipmentProps & {
  /** Number of arms on the berth head. */
  arms?: number;
  /** How many of them are connected to the ship, counted from the first. The rest stand parked. */
  connected?: number;
  /** Distance between arms along z. */
  spacing?: number;
  /** Height of the berth deck above the origin. */
  deck?: number;
  /** How far a connected arm reaches out along +x, towards the ship's manifold. */
  reach?: number;
};

/**
 * A berth head with marine loading arms: articulated pipes on risers that reach out over the
 * water to a ship's manifold. Connected arms are extended towards +x; parked arms stand folded
 * upright. Place its origin on the waterline at the centre of the berth.
 */
export function LoadingArms({ arms = 4, connected = 0, spacing = 3.4, deck = 4, reach = 8, hovered, selected, dimmed, ...base }: LoadingArmsProps) {
  const { steel, frame, pipe } = useEquipmentMaterials({ hovered, selected, dimmed });
  const count = Math.max(1, Math.round(arms));
  const span = (count - 1) * spacing;
  const depth = span + 6;
  const riser = 7;
  const lanes = Array.from({ length: count }, (_, index) => -span / 2 + index * spacing);

  return (
    <EquipmentBase {...base} dimmed={dimmed} beaconRadius={Math.hypot(8, depth) / 2 + 2}>
      <mesh position={[0, deck - 0.3, 0]} material={steel}>
        <boxGeometry args={[8, 0.6, depth]} />
      </mesh>
      {[-1, 1].flatMap((sideX) =>
        [-1, 1].map((sideZ) => (
          <Strut key={`${sideX}${sideZ}`} from={[sideX * 3.2, -6, sideZ * (depth / 2 - 0.8)]} to={[sideX * 3.2, deck - 0.6, sideZ * (depth / 2 - 0.8)]} radius={0.4} material={frame} />
        ))
      )}
      {/* Loading header along the berth */}
      <Strut from={[-1.5, deck + 0.6, -depth / 2 + 0.5]} to={[-1.5, deck + 0.6, depth / 2 - 0.5]} radius={0.35} material={pipe} />
      {lanes.map((z, index) => {
        const isConnected = index < connected;
        const top = deck + riser;
        const apex: readonly [number, number, number] = isConnected ? [2 + reach * 0.45, top + 3.6, z] : [2.2, top + 5.6, z];
        const tip: readonly [number, number, number] = isConnected ? [2 + reach, deck + 1.4, z] : [3.2, top + 0.4, z];
        return (
          <group key={z}>
            <Strut from={[2, deck, z]} to={[2, top, z]} radius={0.36} material={steel} />
            <Strut from={[2, top, z]} to={apex} radius={0.24} material={pipe} />
            <Strut from={apex} to={tip} radius={0.2} material={pipe} />
            {/* Counterweight behind the riser */}
            <Strut from={[2, top, z]} to={[0.2, top - 1, z]} radius={0.14} material={frame} />
            <mesh position={[0.2, top - 1, z]} material={frame}>
              <boxGeometry args={[1, 1.2, 0.7]} />
            </mesh>
          </group>
        );
      })}
    </EquipmentBase>
  );
}
