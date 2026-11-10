import type { ReactNode } from 'react';

import type { Vec3 } from './cameraTargets';
import { EquipmentBase } from './EquipmentBase';
import type { EquipmentProps } from './equipmentProps';
import { useSceneEnvironment } from './sceneEnvironment';
import { Strut } from './Strut';
import { useEquipmentMaterials } from './useEquipmentMaterials';

export type ProcessModuleProps = Omit<EquipmentProps, 'selected' | 'hovered'> & {
  /** Width (x), height and depth (z) of the steel frame. */
  size?: Vec3;
  /** Number of deck levels above the ground. */
  decks?: number;
  /** Equipment inside the module, positioned relative to its centre on the ground. */
  children?: ReactNode;
};

/**
 * An open steel-frame module that groups equipment: columns, perimeter beams, bracing and
 * see-through decks. Use it for skids stacked on levels, offshore modules and pipe-rack structures.
 */
export function ProcessModule({ size = [14, 8, 10], decks = 1, dimmed, children, ...base }: ProcessModuleProps) {
  const { palette } = useSceneEnvironment();
  const { frame } = useEquipmentMaterials({ dimmed });
  const [width, height, depth] = size;
  const x = width / 2;
  const z = depth / 2;
  const corners: Vec3[] = [
    [-x, 0, -z],
    [x, 0, -z],
    [x, 0, z],
    [-x, 0, z],
  ];
  const levels = Array.from({ length: decks + 1 }, (_, index) => (height * (index + 1)) / (decks + 1));

  return (
    <EquipmentBase {...base} dimmed={dimmed} beaconRadius={Math.hypot(width, depth) / 2 + 0.8}>
      {corners.map((corner, index) => (
        <Strut key={index} from={corner} to={[corner[0], height, corner[2]]} radius={0.2} segments={4} material={frame} />
      ))}
      {levels.map((level) =>
        corners.map((corner, index) => {
          const next = corners[(index + 1) % corners.length];
          return <Strut key={`${level}-${index}`} from={[corner[0], level, corner[2]]} to={[next[0], level, next[2]]} radius={0.14} segments={4} material={frame} />;
        })
      )}
      {/* Bracing on the two long faces */}
      {[-z, z].map((side) => (
        <group key={side}>
          <Strut from={[-x, 0, side]} to={[0, levels[0], side]} radius={0.07} segments={6} material={frame} />
          <Strut from={[x, 0, side]} to={[0, levels[0], side]} radius={0.07} segments={6} material={frame} />
        </group>
      ))}
      {levels.slice(0, -1).map((level) => (
        <mesh key={level} position={[0, level, 0]}>
          <boxGeometry args={[width, 0.08, depth]} />
          <meshStandardMaterial color={palette.frame.color} transparent opacity={dimmed ? 0.08 : 0.35} depthWrite={false} roughness={0.9} />
        </mesh>
      ))}
      {children}
    </EquipmentBase>
  );
}
