import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { BufferGeometry, Float32BufferAttribute, Line, LineBasicMaterial } from 'three';
import type { Group } from 'three';

import type { Vec3 } from '../cameraTargets';
import { useSceneEnvironment } from '../sceneEnvironment';
import { useEquipmentMaterials } from '../useEquipmentMaterials';

import { approach, tetherPoints } from './tether';

export type RovProps = {
  /** Where the vehicle should be. It flies there; under reduced motion it jumps. */
  target: Vec3;
  /** Where the tether is paid out from: the vessel's side. */
  tetherFrom: Vec3;
  /** Light cone on. */
  lit?: boolean;
  /** Scale of the vehicle. It is drawn larger than life so it reads from a distance. */
  size?: number;
  /** Called once when a flight arrives. */
  onArrive?: () => void;
};

const TETHER_POINTS = 14;
const LIGHT_DIRECTION: readonly [number, number] = [0.6, -0.8];

/**
 * A work-class inspection vehicle on a tether: a skid with thrusters, a camera light that throws
 * a translucent cone onto what it inspects, and a slack cable back to the vessel. It flies to
 * `target` with an eased approach and stops asking for frames once it has arrived.
 */
export function Rov({ target, tetherFrom, lit = true, size = 1, onArrive }: RovProps) {
  const { palette, reducedMotion } = useSceneEnvironment();
  const { steel, frame, detail } = useEquipmentMaterials();
  const body = useRef<Group>(null);
  const position = useRef<Vec3>(target);
  const arrived = useRef(true);
  const onArriveRef = useRef(onArrive);
  const targetRef = useRef(target);
  const fromRef = useRef(tetherFrom);
  useEffect(() => {
    onArriveRef.current = onArrive;
    targetRef.current = target;
    fromRef.current = tetherFrom;
  });
  const [tx, ty, tz] = target;
  useEffect(() => {
    arrived.current = false;
  }, [tx, ty, tz]);

  const geometry = useMemo(() => {
    const built = new BufferGeometry();
    built.setAttribute('position', new Float32BufferAttribute(new Float32Array(TETHER_POINTS * 3), 3));
    return built;
  }, []);
  const material = useMemo(() => new LineBasicMaterial({ color: palette.highlight.color, transparent: true, opacity: 0.8 }), [palette]);
  const tether = useMemo(() => new Line(geometry, material), [geometry, material]);
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material]
  );

  useFrame((state, delta) => {
    const root = body.current;
    if (!root) return;
    const step = reducedMotion ? { position: targetRef.current, arrived: true } : approach(position.current, targetRef.current, Math.min(delta, 0.1) * 2.2, 0.15);
    position.current = step.position;
    root.position.set(step.position[0], step.position[1], step.position[2]);
    const attribute = geometry.getAttribute('position');
    tetherPoints(fromRef.current, step.position, 3, TETHER_POINTS).forEach((point, index) => attribute.setXYZ(index, point[0], point[1], point[2]));
    attribute.needsUpdate = true;
    geometry.computeBoundingSphere();
    if (!step.arrived) state.invalidate();
    else if (!arrived.current) {
      arrived.current = true;
      onArriveRef.current?.();
      state.invalidate();
    }
  });

  const angle = Math.atan2(LIGHT_DIRECTION[0], -LIGHT_DIRECTION[1]);
  const length = 5;

  return (
    <group>
      <primitive object={tether} />
      <group ref={body} position={target} scale={size}>
        <mesh material={steel}>
          <boxGeometry args={[1.7, 0.7, 1.1]} />
        </mesh>
        <mesh position={[0, 0.5, 0]} material={detail}>
          <boxGeometry args={[1.1, 0.3, 0.8]} />
        </mesh>
        {[-0.62, 0.62].map((side) => (
          <mesh key={side} position={[0, -0.5, side]} rotation={[0, 0, Math.PI / 2]} material={frame}>
            <cylinderGeometry args={[0.1, 0.1, 1.9, 8]} />
          </mesh>
        ))}
        {[-0.7, 0.7].map((side) => (
          <mesh key={side} position={[side, 0.1, 0.62]} rotation={[Math.PI / 2, 0, 0]} material={frame}>
            <cylinderGeometry args={[0.2, 0.2, 0.3, 10]} />
          </mesh>
        ))}
        {lit ? (
          <group position={[0.9, -0.1, 0]}>
            <mesh position={[(LIGHT_DIRECTION[0] * length) / 2, (LIGHT_DIRECTION[1] * length) / 2, 0]} rotation={[0, 0, angle]}>
              <coneGeometry args={[1.9, length, 20, 1, true]} />
              <meshBasicMaterial color={palette.accent.color} transparent opacity={0.2} depthWrite={false} side={2} />
            </mesh>
          </group>
        ) : null}
      </group>
    </group>
  );
}
