import type { EquipmentVisualState } from '../equipmentMaterials';
import { useEquipmentMaterials } from '../useEquipmentMaterials';

import { AxialCylinder } from './AxialCylinder';
import { TRAIN_DECK_HEIGHT, TRAIN_SHAFT_HEIGHT } from './compressorTrainLayout';

export type TurbineDriverProps = EquipmentVisualState;

const SHAFT = TRAIN_SHAFT_HEIGHT;
const FUEL_NOZZLES = [0, 1, 2, 3, 4, 5];

/**
 * The gas turbine driver without its enclosure: exhaust collector and stack next to the driven
 * equipment, power turbine, gas generator with combustor, and the intake plenum with its filter
 * house at the far end.
 */
export function TurbineDriver(state: TurbineDriverProps) {
  const { steel, frame, pipe, detail } = useEquipmentMaterials(state);

  return (
    <group>
      {/* Output shaft stub and exhaust collector */}
      <AxialCylinder x={3.5} y={SHAFT} radius={0.2} length={0.5} material={detail} segments={12} />
      <mesh position={[4.5, SHAFT, 0]} material={steel}>
        <boxGeometry args={[1.6, 2.6, 2.6]} />
      </mesh>
      <mesh position={[4.5, SHAFT + 1.55, 0]} material={frame}>
        <cylinderGeometry args={[0.8, 1.1, 0.5, 20]} />
      </mesh>
      {/* Exhaust stack with silencer and rain cap */}
      <mesh position={[4.5, SHAFT + 3.6, 0]} material={steel}>
        <cylinderGeometry args={[0.7, 0.8, 3.6, 20]} />
      </mesh>
      <mesh position={[4.5, SHAFT + 3.4, 0]} material={frame}>
        <cylinderGeometry args={[0.98, 0.98, 1.5, 20]} />
      </mesh>
      {[2.62, 4.18, 5.38].map((offset) => (
        <mesh key={offset} position={[4.5, SHAFT + offset, 0]} material={frame}>
          <cylinderGeometry args={[0.86, 0.86, 0.1, 20]} />
        </mesh>
      ))}
      {/* Power turbine */}
      <AxialCylinder x={5.8} y={SHAFT} radius={1.05} radiusEnd={0.82} length={1} material={steel} />
      <AxialCylinder x={5.32} y={SHAFT} radius={1.18} length={0.12} material={frame} />
      {/* Gas generator */}
      <AxialCylinder x={7.35} y={SHAFT} radius={0.74} length={2.1} material={steel} />
      <AxialCylinder x={7} y={SHAFT} radius={0.96} length={0.62} material={pipe} />
      {[6.32, 7.6, 8.38].map((x) => (
        <AxialCylinder key={x} x={x} y={SHAFT} radius={0.86} length={0.08} material={frame} />
      ))}
      {FUEL_NOZZLES.map((index) => {
        const angle = (index / FUEL_NOZZLES.length) * Math.PI * 2 + 0.3;
        return (
          <mesh key={index} position={[7, SHAFT + Math.cos(angle) * 1.02, Math.sin(angle) * 1.02]} rotation={[angle, 0, 0]} material={detail}>
            <cylinderGeometry args={[0.07, 0.07, 0.3, 8]} />
          </mesh>
        );
      })}
      {/* Fuel gas manifold */}
      <mesh position={[7, SHAFT, 0]} rotation={[0, Math.PI / 2, 0]} material={pipe}>
        <torusGeometry args={[1.22, 0.05, 8, 28]} />
      </mesh>
      {/* Intake plenum, duct and filter house */}
      <mesh position={[9.1, SHAFT, 0]} material={steel}>
        <boxGeometry args={[1.4, 2.4, 2.4]} />
      </mesh>
      <mesh position={[9.1, SHAFT + 2.1, 0]} material={frame}>
        <boxGeometry args={[1.1, 1.8, 2]} />
      </mesh>
      <mesh position={[8.9, SHAFT + 4, 0]} material={steel}>
        <boxGeometry args={[2.2, 2, 3.2]} />
      </mesh>
      {[-0.7, -0.35, 0, 0.35, 0.7].map((offset) => (
        <mesh key={offset} position={[10.03, SHAFT + 4 + offset, 0]} rotation={[0, 0, 0.5]} material={frame}>
          <boxGeometry args={[0.06, 0.26, 3]} />
        </mesh>
      ))}
      <mesh position={[9, SHAFT + 5.08, 0]} material={frame}>
        <boxGeometry args={[2.5, 0.12, 3.4]} />
      </mesh>
      {/* Mounts */}
      {[4.5, 6.2, 8.2, 9.1].map((x) => (
        <mesh key={x} position={[x, (TRAIN_DECK_HEIGHT + SHAFT - 0.9) / 2, 0]} material={frame}>
          <boxGeometry args={[0.5, SHAFT - 0.9 - TRAIN_DECK_HEIGHT, 1.5]} />
        </mesh>
      ))}
    </group>
  );
}
