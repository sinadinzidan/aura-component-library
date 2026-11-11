import { EquipmentBase } from '../EquipmentBase';
import type { EquipmentProps } from '../equipmentProps';
import { useSceneEnvironment } from '../sceneEnvironment';
import { Strut } from '../Strut';
import { useEquipmentMaterials } from '../useEquipmentMaterials';

export type ContainmentTankProps = EquipmentProps & {
  diameter?: number;
  /** Wall height, dome excluded. */
  height?: number;
  /** Fill level, 0 (empty) to 1 (full), shown on the level gauge strip on the wall. */
  fill?: number;
};

/**
 * A full-containment LNG storage tank: an opaque concrete outer wall under a shallow dome, with
 * the pump platform and rundown lines on the roof — everything enters and leaves over the top.
 * The wall hides the liquid, so a gauge strip on the side shows the level.
 */
export function ContainmentTank({ diameter = 34, height = 22, fill = 0.6, hovered, selected, dimmed, ...base }: ContainmentTankProps) {
  const { palette } = useSceneEnvironment();
  const { steel, frame, pipe } = useEquipmentMaterials({ hovered, selected, dimmed });
  const radius = diameter / 2;
  const rise = diameter * 0.18;
  const level = Math.min(1, Math.max(0, fill));
  const gauge = height - 2;
  const fade = dimmed ? 0.2 : 1;

  return (
    <EquipmentBase {...base} dimmed={dimmed} beaconRadius={radius + 2.4}>
      <mesh position={[0, 0.3, 0]} material={frame}>
        <cylinderGeometry args={[radius + 1, radius + 1, 0.6, 48]} />
      </mesh>
      <mesh position={[0, height / 2 + 0.3, 0]} material={steel}>
        <cylinderGeometry args={[radius, radius, height, 48]} />
      </mesh>
      <mesh position={[0, height + 0.3, 0]} rotation={[Math.PI / 2, 0, 0]} material={frame}>
        <torusGeometry args={[radius, 0.3, 8, 48]} />
      </mesh>
      <mesh position={[0, height + 0.3, 0]} scale={[1, rise / radius, 1]} material={steel}>
        <sphereGeometry args={[radius, 40, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      {/* Roof platform with pump columns */}
      <mesh position={[0, height + rise + 0.5, 0]} material={frame}>
        <cylinderGeometry args={[radius * 0.22, radius * 0.22, 0.3, 20]} />
      </mesh>
      {[-1, 0, 1].map((slot) => (
        <Strut key={slot} from={[slot * 1.6, height + rise, 0.8]} to={[slot * 1.6, height + rise + 2.2, 0.8]} radius={0.3} material={pipe} />
      ))}
      {/* Rundown and loading lines over the roof and down the wall */}
      <Strut from={[0, height + rise + 1, 0]} to={[-radius - 0.6, height + 1.4, 0]} radius={0.3} material={pipe} />
      <Strut from={[-radius - 0.6, height + 1.4, 0]} to={[-radius - 0.6, 0.8, 0]} radius={0.3} material={pipe} />
      {/* Stair tower */}
      <mesh position={[-radius - 0.6, (height + 0.3) / 2, 2.2]} material={frame}>
        <boxGeometry args={[1.2, height + 0.3, 2]} />
      </mesh>
      {/* Level gauge strip, facing south */}
      <mesh position={[0, 1.3 + gauge / 2, radius + 0.05]} material={frame}>
        <boxGeometry args={[1.1, gauge, 0.1]} />
      </mesh>
      {level > 0.01 ? (
        <mesh position={[0, 1.3 + (gauge * level) / 2, radius + 0.14]}>
          <boxGeometry args={[0.7, gauge * level, 0.1]} />
          <meshBasicMaterial color={palette.liquid.color} transparent opacity={palette.liquid.opacity * fade} />
        </mesh>
      ) : null}
    </EquipmentBase>
  );
}
