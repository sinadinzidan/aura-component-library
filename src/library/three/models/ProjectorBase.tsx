import { DoubleSide } from 'three';

import { useSceneEnvironment } from '../sceneEnvironment';

export type ProjectorBaseProps = {
  radius?: number;
  /** Height of the light cone rising from the ring. 0 hides it. */
  beamHeight?: number;
};

const TICKS = Array.from({ length: 24 }, (_, index) => index);

/**
 * The projector a hologram floats above: a dark plate, concentric rings with tick marks in the
 * accent colour, and a faint cone of light rising from it.
 */
export function ProjectorBase({ radius = 4, beamHeight = 3 }: ProjectorBaseProps) {
  const { palette } = useSceneEnvironment();
  const accent = palette.accent.color;

  return (
    <group>
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[radius * 1.05, radius * 1.15, 0.2, 48]} />
        <meshStandardMaterial color={palette.ground.color} roughness={0.9} />
      </mesh>
      <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.21, 0]}>
        {[0.35, 0.68, 1].map((fraction) => (
          <mesh key={fraction}>
            <ringGeometry args={[radius * fraction - 0.06, radius * fraction, 64]} />
            <meshBasicMaterial color={accent} transparent opacity={fraction === 1 ? 1 : 0.6} side={DoubleSide} />
          </mesh>
        ))}
        {TICKS.map((index) => {
          const angle = (index / TICKS.length) * Math.PI * 2;
          const major = index % 6 === 0;
          const distance = radius * (major ? 0.84 : 0.87);
          return (
            <mesh key={index} position={[Math.cos(angle) * distance, Math.sin(angle) * distance, 0]} rotation={[0, 0, angle]}>
              <planeGeometry args={[radius * (major ? 0.14 : 0.07), 0.05]} />
              <meshBasicMaterial color={accent} transparent opacity={0.8} side={DoubleSide} />
            </mesh>
          );
        })}
      </group>
      {beamHeight > 0 ? (
        <mesh position={[0, 0.2 + beamHeight / 2, 0]}>
          <cylinderGeometry args={[radius * 0.5, radius * 0.98, beamHeight, 40, 1, true]} />
          <meshBasicMaterial color={accent} transparent opacity={0.07} side={DoubleSide} depthWrite={false} />
        </mesh>
      ) : null}
    </group>
  );
}
