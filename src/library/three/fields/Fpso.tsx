import { toTuple } from '../cameraTargets';
import type { Vec3 } from '../cameraTargets';
import { useSceneEnvironment } from '../sceneEnvironment';
import { useEquipmentMaterials } from '../useEquipmentMaterials';

import { TURRET_FRACTION } from './subseaField';

export type FpsoProps = {
  /** Midships on the waterline. The vessel lies along x with its bow and turret towards −x. */
  position?: Vec3;
  rotationY?: number;
  length?: number;
  dimmed?: boolean;
};

const HALF_TURN = Math.PI / 2;

/**
 * A floating production vessel, blocky on purpose: hull with a pointed bow, the turret that risers
 * and mooring lines attach to, a row of topside process modules on a pipe rack, a flare boom and
 * the accommodation block with a helideck aft. Its origin is on the waterline.
 */
export function Fpso({ position = [0, 0, 0], rotationY = 0, length = 52, dimmed = false }: FpsoProps) {
  const { palette } = useSceneEnvironment();
  const { steel, frame, pipe, detail } = useEquipmentMaterials({ dimmed });
  const beam = length * 0.22;
  const draught = 3.4;
  const freeboard = 3.4;
  const depth = draught + freeboard;
  const body = length * 0.82;
  const bow = length - body;
  const half = Math.SQRT1_2 * beam;
  const bodyCentre = bow / 2;
  const turretX = -length * TURRET_FRACTION;
  const deck = freeboard;
  const moduleX = [-0.12, 0.04, 0.2].map((fraction) => fraction * length);

  return (
    <group position={toTuple(position)} rotation={[0, rotationY, 0]}>
      <mesh position={[bodyCentre, (freeboard - draught) / 2, 0]} material={steel}>
        <boxGeometry args={[body, depth, beam]} />
      </mesh>
      <mesh position={[bodyCentre - body / 2 - bow / 2 + bow / 2, (freeboard - draught) / 2, 0]} rotation={[0, Math.PI / 4, 0]} scale={[(bow * 2) / beam, 1, 1]} material={steel}>
        <boxGeometry args={[half, depth, half]} />
      </mesh>
      <mesh position={[bodyCentre, deck + 0.06, 0]} material={frame}>
        <boxGeometry args={[body, 0.12, beam * 0.96]} />
      </mesh>
      {/* Waterline stripe, so the hull reads as floating */}
      <mesh position={[bodyCentre, 0.02, 0]}>
        <boxGeometry args={[body + 0.05, 0.14, beam + 0.05]} />
        <meshBasicMaterial color={palette.accent.color} transparent opacity={dimmed ? 0.1 : 0.55} depthWrite={false} />
      </mesh>
      {/* Turret, reaching well below the keel */}
      <mesh position={[turretX, (deck - draught - 3) / 2, 0]} material={frame}>
        <cylinderGeometry args={[beam * 0.26, beam * 0.3, deck + draught + 3 + 1.6, 20]} />
      </mesh>
      <mesh position={[turretX, deck + 1.1, 0]} material={detail}>
        <cylinderGeometry args={[beam * 0.2, beam * 0.2, 0.5, 20]} />
      </mesh>
      {/* Topside modules and pipe rack */}
      {moduleX.map((x, index) => (
        <mesh key={x} position={[x, deck + 1.5 + (index === 1 ? 0.6 : 0), (index - 1) * beam * 0.12]} material={steel}>
          <boxGeometry args={[length * 0.1, 3 + (index === 1 ? 1.2 : 0), beam * 0.46]} />
        </mesh>
      ))}
      <mesh position={[length * 0.04, deck + 3.6, 0]} rotation={[0, 0, HALF_TURN]} material={pipe}>
        <cylinderGeometry args={[0.28, 0.28, length * 0.42, 10]} />
      </mesh>
      {/* Flare boom */}
      <mesh position={[-length * 0.46, deck + 3.4, 0]} rotation={[0, 0, 0.5]} material={frame}>
        <cylinderGeometry args={[0.18, 0.28, 7.5, 8]} />
      </mesh>
      {/* Accommodation and helideck aft */}
      <mesh position={[length * 0.4, deck + 3.2, 0]} material={steel}>
        <boxGeometry args={[length * 0.1, 6.4, beam * 0.8]} />
      </mesh>
      <mesh position={[length * 0.4, deck + 6.7, 0]} material={frame}>
        <cylinderGeometry args={[beam * 0.36, beam * 0.36, 0.3, 20]} />
      </mesh>
      <mesh position={[length * 0.4, deck + 6.87, 0]}>
        <ringGeometry args={[beam * 0.2, beam * 0.26, 24]} />
        <meshBasicMaterial color={palette.highlight.color} transparent opacity={dimmed ? 0.15 : 0.8} depthWrite={false} />
      </mesh>
    </group>
  );
}
