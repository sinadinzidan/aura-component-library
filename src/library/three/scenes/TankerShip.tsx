import { toTuple } from '../cameraTargets';
import type { Vec3 } from '../cameraTargets';
import { useSceneEnvironment } from '../sceneEnvironment';
import { useEquipmentMaterials } from '../useEquipmentMaterials';

export type TankerShipProps = {
  /** Midships on the waterline. The ship lies along x, bow towards +x. */
  position?: Vec3;
  rotationY?: number;
  length?: number;
  beam?: number;
  /** Hull height above the waterline. A laden ship sits lower. */
  freeboard?: number;
  dimmed?: boolean;
};

/**
 * A simple product tanker alongside: hull with a pointed bow, deck with cargo manifold and pipe
 * trunk, and the accommodation block with bridge and funnel aft. Deliberately blocky — it marks
 * the berth as occupied, it is not a ship model.
 */
export function TankerShip({ position = [0, 0, 0], rotationY = 0, length = 46, beam = 9, freeboard = 3.2, dimmed = false }: TankerShipProps) {
  const { palette } = useSceneEnvironment();
  const { steel, frame, pipe, detail } = useEquipmentMaterials({ dimmed });
  const draught = 2.5;
  const hullHeight = freeboard + draught;
  const hullY = freeboard - hullHeight / 2;
  const body = length * 0.84;
  const bow = length - body;
  const half = Math.SQRT1_2 * beam;

  return (
    <group position={toTuple(position)} rotation={[0, rotationY, 0]}>
      <mesh position={[-bow / 2, hullY, 0]} material={steel}>
        <boxGeometry args={[body, hullHeight, beam]} />
      </mesh>
      {/* Bow: a square prism turned on its corner, squeezed to the bow length. */}
      <mesh position={[body / 2 - bow / 2, hullY, 0]} rotation={[0, Math.PI / 4, 0]} scale={[(bow * 2) / beam, 1, 1]} material={steel}>
        <boxGeometry args={[half, hullHeight, half]} />
      </mesh>
      <mesh position={[-bow / 2, freeboard + 0.06, 0]} material={frame}>
        <boxGeometry args={[body, 0.12, beam * 0.96]} />
      </mesh>
      {/* Deck pipe trunk and cargo manifold */}
      <mesh position={[body * 0.02, freeboard + 0.5, 0]} rotation={[0, 0, Math.PI / 2]} material={pipe}>
        <cylinderGeometry args={[0.3, 0.3, body * 0.58, 10]} />
      </mesh>
      <mesh position={[body * 0.02, freeboard + 0.9, 0]} rotation={[Math.PI / 2, 0, 0]} material={pipe}>
        <cylinderGeometry args={[0.28, 0.28, beam * 0.9, 10]} />
      </mesh>
      {/* Accommodation, bridge and funnel */}
      <mesh position={[-length * 0.36, freeboard + 2.6, 0]} material={steel}>
        <boxGeometry args={[length * 0.13, 5.2, beam * 0.82]} />
      </mesh>
      <mesh position={[-length * 0.345, freeboard + 5.8, 0]}>
        <boxGeometry args={[length * 0.08, 0.9, beam * 1.02]} />
        <meshBasicMaterial color={palette.accent.color} transparent opacity={dimmed ? 0.15 : 0.8} depthWrite={!dimmed} />
      </mesh>
      <mesh position={[-length * 0.345, freeboard + 6.5, 0]} material={frame}>
        <boxGeometry args={[length * 0.09, 0.3, beam * 1.06]} />
      </mesh>
      <mesh position={[-length * 0.43, freeboard + 3.6, 0]} material={detail}>
        <boxGeometry args={[length * 0.05, 7.2, beam * 0.3]} />
      </mesh>
    </group>
  );
}
