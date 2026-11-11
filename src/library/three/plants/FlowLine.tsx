import { useThree } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { useEffect, useMemo, useState } from 'react';

import { toTuple } from '../cameraTargets';
import type { Vec3 } from '../cameraTargets';
import { segmentTransform } from '../pipeGeometry';
import { setSceneCursor } from '../sceneCursor';
import { useSceneEnvironment } from '../sceneEnvironment';

import { FlowParticles } from './FlowParticles';
import type { ParticleOptions } from './particlePositions';

/**
 * How a line is drawn. `normal`: fluid colour with its stream. `selected`: the picked line, with
 * an accent sleeve. `traced`: on the path of the picked line. `faded`: off that path.
 */
export type FlowLineEmphasis = 'normal' | 'selected' | 'traced' | 'faded';

export type FlowLineProps = {
  id: string;
  /** The route, corner to corner, in flow direction. */
  route: readonly Vec3[];
  /** A resolved token colour for the fluid in the line. */
  color: string;
  /** Flow as a 0–1 share of the reference flow. 0 means blocked or starved: the line goes dark. */
  rate: number;
  emphasis?: FlowLineEmphasis;
  radius?: number;
  /** Called with the id on click. */
  onSelect?: (id: string) => void;
  /** Hold the stream at this time instead of animating it. */
  time?: number;
  options?: ParticleOptions;
};

const TUBE_OPACITY: Record<FlowLineEmphasis, number> = { normal: 0.34, selected: 0.6, traced: 0.5, faded: 0.1 };
const STREAM_OPACITY: Record<FlowLineEmphasis, number> = { normal: 0.95, selected: 1, traced: 1, faded: 0.25 };

/**
 * One process line as the subject of a scene: a translucent tube in the fluid's colour with a
 * particle stream inside it. A line without flow turns into a dark, empty tube. The whole route
 * is clickable through a wider invisible sleeve, so thin pipes are easy to hit.
 */
export function FlowLine({ id, route, color, rate, emphasis = 'normal', radius = 0.3, onSelect, time, options }: FlowLineProps) {
  const { palette } = useSceneEnvironment();
  const gl = useThree((state) => state.gl);
  const invalidate = useThree((state) => state.invalidate);
  const [hovered, setHovered] = useState(false);
  const segments = useMemo(() => route.slice(1).map((point, index) => segmentTransform(route[index], point)), [route]);
  const flowing = rate > 0;
  const tubeColor = flowing ? color : palette.frame.color;
  const lit = hovered || emphasis === 'selected';
  const opacity = flowing ? TUBE_OPACITY[emphasis] + (hovered ? 0.2 : 0) : emphasis === 'faded' ? 0.12 : 0.4;

  useEffect(() => () => setSceneCursor(gl.domElement, ''), [gl]);

  const enter = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    setHovered(true);
    setSceneCursor(gl.domElement, 'pointer');
    invalidate();
  };
  const leave = () => {
    setHovered(false);
    setSceneCursor(gl.domElement, '');
    invalidate();
  };

  return (
    <group>
      {segments.map((segment, index) => (
        <mesh key={index} position={toTuple(segment.center)} quaternion={[...segment.quaternion]} renderOrder={2}>
          <cylinderGeometry args={[radius, radius, segment.length, 12, 1, true]} />
          <meshBasicMaterial color={tubeColor} transparent opacity={opacity} depthWrite={false} />
        </mesh>
      ))}
      {route.slice(1, -1).map((point, index) => (
        <mesh key={index} position={toTuple(point)} renderOrder={2}>
          <sphereGeometry args={[radius * 1.05, 10, 8]} />
          <meshBasicMaterial color={tubeColor} transparent opacity={opacity} depthWrite={false} />
        </mesh>
      ))}
      {lit
        ? segments.map((segment, index) => (
            <mesh key={index} position={toTuple(segment.center)} quaternion={[...segment.quaternion]} renderOrder={1}>
              <cylinderGeometry args={[radius * 2.1, radius * 2.1, segment.length, 12, 1, true]} />
              <meshBasicMaterial color={palette.accent.color} transparent opacity={emphasis === 'selected' ? 0.3 : 0.16} depthWrite={false} />
            </mesh>
          ))
        : null}
      {flowing ? <FlowParticles route={route} rate={rate} color={color} opacity={STREAM_OPACITY[emphasis]} size={radius * 0.62} time={time} options={options} /> : null}
      {onSelect
        ? segments.map((segment, index) => (
            <mesh
              key={index}
              position={toTuple(segment.center)}
              quaternion={[...segment.quaternion]}
              onPointerOver={enter}
              onPointerOut={leave}
              onClick={(event) => {
                event.stopPropagation();
                onSelect(id);
              }}
            >
              <cylinderGeometry args={[radius * 3.2, radius * 3.2, segment.length, 8, 1, true]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
          ))
        : null}
    </group>
  );
}
