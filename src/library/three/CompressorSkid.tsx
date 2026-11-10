import { EquipmentBase } from './EquipmentBase';
import type { EquipmentProps } from './equipmentProps';
import { useEquipmentMaterials } from './useEquipmentMaterials';

export type CompressorSkidProps = EquipmentProps & {
  length?: number;
  width?: number;
};

const HALF_TURN = Math.PI / 2;

/** A centrifugal compressor train on a base frame: barrel casing with nozzles, gearbox, coupling and driver. */
export function CompressorSkid({ length = 10, width = 4, hovered, selected, dimmed, ...base }: CompressorSkidProps) {
  const { steel, frame, pipe, detail } = useEquipmentMaterials({ hovered, selected, dimmed });
  const deck = 0.5;
  const shaft = deck + 1.35;
  const casingX = -length * 0.27;
  const driverX = length * 0.24;

  return (
    <EquipmentBase {...base} dimmed={dimmed} beaconRadius={Math.hypot(length, width) / 2 + 0.6}>
      <mesh position={[0, deck / 2, 0]} material={frame}>
        <boxGeometry args={[length, deck, width]} />
      </mesh>
      {/* Compressor casing */}
      <mesh position={[casingX, shaft, 0]} rotation={[0, 0, HALF_TURN]} material={steel}>
        <cylinderGeometry args={[1.15, 1.15, length * 0.26, 24]} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[casingX + side * length * 0.14, shaft, 0]} rotation={[0, 0, HALF_TURN]} material={frame}>
          <cylinderGeometry args={[1.3, 1.3, 0.22, 24]} />
        </mesh>
      ))}
      {[-0.6, 0.6].map((offset) => (
        <group key={offset} position={[casingX + offset, shaft + 1.1, 0]}>
          <mesh position={[0, 0.35, 0]} material={pipe}>
            <cylinderGeometry args={[0.32, 0.32, 0.9, 14]} />
          </mesh>
          <mesh position={[0, 0.8, 0]} material={frame}>
            <cylinderGeometry args={[0.46, 0.46, 0.1, 14]} />
          </mesh>
        </group>
      ))}
      {/* Gearbox and coupling guard */}
      <mesh position={[-length * 0.04, shaft - 0.1, 0]} material={steel}>
        <boxGeometry args={[length * 0.13, 1.7, 1.6]} />
      </mesh>
      <mesh position={[length * 0.06, shaft, 0]} rotation={[0, 0, HALF_TURN]} material={detail}>
        <cylinderGeometry args={[0.3, 0.3, length * 0.08, 12]} />
      </mesh>
      {/* Driver */}
      <mesh position={[driverX, shaft, 0]} rotation={[0, 0, HALF_TURN]} material={steel}>
        <cylinderGeometry args={[1, 1, length * 0.3, 24]} />
      </mesh>
      {[-0.32, -0.16, 0, 0.16, 0.32].map((offset) => (
        <mesh key={offset} position={[driverX + offset * length * 0.3, shaft, 0]} rotation={[0, 0, HALF_TURN]} material={frame}>
          <cylinderGeometry args={[1.08, 1.08, 0.08, 24]} />
        </mesh>
      ))}
      <mesh position={[driverX, shaft + 1.15, 0]} material={frame}>
        <boxGeometry args={[0.9, 0.5, 0.9]} />
      </mesh>
      {/* Lube oil console */}
      <mesh position={[length * 0.36, deck + 0.45, width * 0.3]} material={steel}>
        <boxGeometry args={[1.6, 0.9, 0.9]} />
      </mesh>
      {/* Supports */}
      {[casingX, driverX].map((x) => (
        <mesh key={x} position={[x, deck + 0.3, 0]} material={frame}>
          <boxGeometry args={[1.4, 0.6, 1.8]} />
        </mesh>
      ))}
    </EquipmentBase>
  );
}
