import type { EquipmentVisualState } from '../equipmentMaterials';
import { Strut } from '../Strut';
import { useEquipmentMaterials } from '../useEquipmentMaterials';

export type SealGasPanelProps = EquipmentVisualState;

const X = -4.5;
const Z = -3.5;
const FACE = Z + 0.12;

/** The dry gas seal panel: a free-standing rack with duplex filters, pressure gauges, a control valve and tubing headers. */
export function SealGasPanel(state: SealGasPanelProps) {
  const { steel, frame, pipe, detail } = useEquipmentMaterials(state);

  return (
    <group>
      <mesh position={[X, 0.08, Z]} material={frame}>
        <boxGeometry args={[2.6, 0.16, 0.8]} />
      </mesh>
      {[-1.15, 1.15].map((offset) => (
        <mesh key={offset} position={[X + offset, 1.6, Z]} material={frame}>
          <boxGeometry args={[0.1, 3, 0.1]} />
        </mesh>
      ))}
      <mesh position={[X, 2, Z]} material={steel}>
        <boxGeometry args={[2.3, 2.2, 0.08]} />
      </mesh>
      {/* Duplex filters */}
      {[-0.85, -0.5].map((offset) => (
        <mesh key={offset} position={[X + offset, 1.75, FACE + 0.14]} material={pipe}>
          <cylinderGeometry args={[0.14, 0.14, 0.9, 12]} />
        </mesh>
      ))}
      {/* Gauges */}
      {[-0.1, 0.35, 0.8].map((offset) => (
        <mesh key={offset} position={[X + offset, 2.7, FACE + 0.05]} rotation={[Math.PI / 2, 0, 0]} material={detail}>
          <cylinderGeometry args={[0.15, 0.15, 0.08, 16]} />
        </mesh>
      ))}
      {/* Control valve with actuator */}
      <mesh position={[X + 0.5, 1.7, FACE + 0.14]} material={pipe}>
        <boxGeometry args={[0.3, 0.22, 0.22]} />
      </mesh>
      <mesh position={[X + 0.5, 2.05, FACE + 0.14]} material={frame}>
        <cylinderGeometry args={[0.2, 0.2, 0.14, 14]} />
      </mesh>
      {/* Tubing headers */}
      <Strut from={[X - 1, 1.3, FACE + 0.1]} to={[X + 1, 1.3, FACE + 0.1]} radius={0.035} material={pipe} segments={8} />
      <Strut from={[X - 1, 2.35, FACE + 0.1]} to={[X + 1, 2.35, FACE + 0.1]} radius={0.035} material={pipe} segments={8} />
      <Strut from={[X + 1, 1.3, FACE + 0.1]} to={[X + 1, 2.35, FACE + 0.1]} radius={0.035} material={pipe} segments={8} />
    </group>
  );
}
