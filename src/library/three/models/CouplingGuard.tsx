import type { EquipmentVisualState } from '../equipmentMaterials';
import { useEquipmentMaterials } from '../useEquipmentMaterials';

import { AxialCylinder } from './AxialCylinder';
import { TRAIN_SHAFT_HEIGHT } from './compressorTrainLayout';

export type CouplingGuardProps = EquipmentVisualState;

const SHAFT = TRAIN_SHAFT_HEIGHT;

/** The high-speed coupling between gearbox and compressor: spacer, two hubs and a vented guard. */
export function CouplingGuard(state: CouplingGuardProps) {
  const { frame, pipe, detail } = useEquipmentMaterials(state);

  return (
    <group>
      {/* Spacer and hubs */}
      <AxialCylinder x={-0.5} y={SHAFT} radius={0.14} length={1.5} material={detail} segments={12} />
      {[-1.12, 0.12].map((x) => (
        <AxialCylinder key={x} x={x} y={SHAFT} radius={0.34} length={0.16} material={detail} segments={18} />
      ))}
      {/* Guard */}
      <AxialCylinder x={-0.5} y={SHAFT} radius={0.5} length={1.02} material={pipe} segments={20} />
      {[-1, 0].map((x) => (
        <AxialCylinder key={x} x={x} y={SHAFT} radius={0.56} length={0.06} material={frame} segments={20} />
      ))}
      {/* Vent and speed probe boss */}
      <mesh position={[-0.5, SHAFT + 0.53, 0]} material={frame}>
        <boxGeometry args={[0.5, 0.08, 0.3]} />
      </mesh>
      {[-0.85, -0.15].map((x) => (
        <mesh key={x} position={[x, SHAFT - 0.3, 0]} material={frame}>
          <boxGeometry args={[0.1, 0.6, 1.1]} />
        </mesh>
      ))}
    </group>
  );
}
