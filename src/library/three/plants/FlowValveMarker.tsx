import { toTuple } from '../cameraTargets';
import type { Vec3 } from '../cameraTargets';
import { quaternionFromY } from '../pipeGeometry';
import { useSceneEnvironment } from '../sceneEnvironment';

export type FlowValveMarkerProps = {
  /** Where the valve sits on its line. */
  position: Vec3;
  /** Direction of the line there. */
  direction: Vec3;
  open: boolean;
  /** Size of the valve body. */
  size?: number;
};

/**
 * A valve drawn as its P&ID symbol in 3D: two cones tip to tip along the line. Open, it takes the
 * highlight colour; closed, it turns neutral and a plate blocks the bore — a shape change, so the
 * state reads without colour. Pair it with a label that says "Open" or "Closed".
 */
export function FlowValveMarker({ position, direction, open, size = 0.75 }: FlowValveMarkerProps) {
  const { palette } = useSceneEnvironment();
  const color = open ? palette.highlight.color : palette.neutral.color;

  return (
    <group position={toTuple(position)} quaternion={[...quaternionFromY(direction)]}>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[0, side * size * 0.6, 0]} rotation={[side === 1 ? Math.PI : 0, 0, 0]}>
          <coneGeometry args={[size * 0.7, size * 1.2, 12]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ))}
      {open ? null : (
        <mesh>
          <cylinderGeometry args={[size * 1.25, size * 1.25, size * 0.16, 20]} />
          <meshBasicMaterial color={palette.neutral.color} />
        </mesh>
      )}
    </group>
  );
}
