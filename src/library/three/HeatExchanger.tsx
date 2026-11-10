import { EquipmentBase } from './EquipmentBase';
import type { EquipmentProps } from './equipmentProps';
import { useEquipmentMaterials } from './useEquipmentMaterials';

export type HeatExchangerProps = EquipmentProps & {
  length?: number;
  diameter?: number;
};

const HALF_TURN = Math.PI / 2;

/** A shell-and-tube heat exchanger: shell with girth flanges, channel heads, saddles and four nozzles. */
export function HeatExchanger({ length = 8, diameter = 1.6, hovered, selected, dimmed, ...base }: HeatExchangerProps) {
  const { steel, frame, pipe } = useEquipmentMaterials({ hovered, selected, dimmed });
  const radius = diameter / 2;
  const axis = radius + 0.9;
  const shell = length * 0.72;
  const channel = (length - shell) / 2;

  return (
    <EquipmentBase {...base} dimmed={dimmed} beaconRadius={Math.hypot(length, diameter) / 2 + 0.6}>
      <mesh position={[0, axis, 0]} rotation={[0, 0, HALF_TURN]} material={steel}>
        <cylinderGeometry args={[radius, radius, shell, 24]} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * (shell / 2), axis, 0]}>
          <mesh rotation={[0, 0, HALF_TURN]} material={frame}>
            <cylinderGeometry args={[radius * 1.18, radius * 1.18, 0.2, 24]} />
          </mesh>
          <mesh position={[(side * channel) / 2, 0, 0]} rotation={[0, 0, HALF_TURN]} material={steel}>
            <cylinderGeometry args={[radius * 0.96, radius * 0.96, channel, 24]} />
          </mesh>
          <mesh position={[side * channel, 0, 0]} scale={[0.4, 1, 1]} material={steel}>
            <sphereGeometry args={[radius * 0.96, 20, 12]} />
          </mesh>
        </group>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * shell * 0.3, (axis - radius * 0.4) / 2, 0]} material={frame}>
          <boxGeometry args={[0.4, axis - radius * 0.4, diameter * 0.9]} />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * shell * 0.38, axis + radius + 0.25, 0]} material={pipe}>
            <cylinderGeometry args={[0.2, 0.2, 0.7, 12]} />
          </mesh>
          <mesh position={[side * (shell / 2 + channel * 0.5), axis - radius - 0.25, 0]} material={pipe}>
            <cylinderGeometry args={[0.18, 0.18, 0.7, 12]} />
          </mesh>
        </group>
      ))}
    </EquipmentBase>
  );
}
