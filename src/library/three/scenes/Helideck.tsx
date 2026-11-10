import { toTuple } from '../cameraTargets';
import type { Vec3 } from '../cameraTargets';
import { useSceneEnvironment } from '../sceneEnvironment';
import { Strut } from '../Strut';
import { useEquipmentMaterials } from '../useEquipmentMaterials';

export type HelideckProps = {
  /** Middle of the landing surface. */
  position?: Vec3;
  radius?: number;
  /** Height of the support structure under the deck. 0 draws none. */
  support?: number;
  dimmed?: boolean;
};

const BRACES: readonly Vec3[] = [
  [1, 0, 1],
  [-1, 0, 1],
  [-1, 0, -1],
  [1, 0, -1],
];

/**
 * A helideck: an octagonal landing disc with the aiming circle and the H, a safety-net rim and a
 * braced pedestal underneath.
 */
export function Helideck({ position = [0, 0, 0], radius = 7, support = 3, dimmed = false }: HelideckProps) {
  const { palette } = useSceneEnvironment();
  const { steel, frame } = useEquipmentMaterials({ dimmed });
  const fade = dimmed ? 0.2 : 1;
  const bar = radius * 0.09;

  return (
    <group position={toTuple(position)}>
      <mesh position={[0, -0.2, 0]} rotation={[0, Math.PI / 8, 0]} material={steel}>
        <cylinderGeometry args={[radius, radius, 0.4, 8]} />
      </mesh>
      <mesh position={[0, -0.5, 0]} rotation={[Math.PI / 2, 0, 0]} material={frame}>
        <torusGeometry args={[radius * 1.06, 0.1, 6, 8]} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius * 0.62, radius * 0.7, 48]} />
        <meshBasicMaterial color={palette.highlight.color} transparent opacity={0.95 * fade} depthWrite={false} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * radius * 0.2, 0.03, 0]}>
          <boxGeometry args={[bar, 0.02, radius * 0.6]} />
          <meshBasicMaterial color={palette.highlight.color} transparent opacity={0.95 * fade} depthWrite={false} />
        </mesh>
      ))}
      <mesh position={[0, 0.03, 0]}>
        <boxGeometry args={[radius * 0.4, 0.02, bar]} />
        <meshBasicMaterial color={palette.highlight.color} transparent opacity={0.95 * fade} depthWrite={false} />
      </mesh>
      {support > 0 ? (
        <>
          <mesh position={[0, -0.4 - support / 2, 0]} material={frame}>
            <cylinderGeometry args={[0.5, 0.5, support, 10]} />
          </mesh>
          {BRACES.map((brace, index) => (
            <Strut key={index} from={[0, -0.4 - support, 0]} to={[brace[0] * radius * 0.6, -0.4, brace[2] * radius * 0.6]} radius={0.12} segments={6} material={frame} />
          ))}
        </>
      ) : null}
    </group>
  );
}
