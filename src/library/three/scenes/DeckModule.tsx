import { useMemo } from 'react';
import type { ReactNode } from 'react';

import type { Vec3 } from '../cameraTargets';
import { useSceneEnvironment } from '../sceneEnvironment';
import { Strut } from '../Strut';
import { useEquipmentMaterials } from '../useEquipmentMaterials';

export type DeckModuleProps = {
  /** Width (x), clear height to the deck above, and depth (z). A height of 0 is an open weather deck. */
  size?: Vec3;
  /** Columns along each long side, corners included. */
  columns?: number;
  /** Handrail around the edge, for a weather deck. */
  handrail?: boolean;
  /** Ghost the deck: structure fades back and the plate turns to glass. */
  dimmed?: boolean;
  /** Equipment on the deck, positioned relative to the middle of the floor. */
  children?: ReactNode;
};

/**
 * One deck of a platform or a stacked module: a floor plate on perimeter girders, with columns up
 * to the deck above. Its origin is the middle of the floor, so equipment stands at y = 0.
 */
export function DeckModule({ size = [40, 7, 26], columns = 3, handrail = false, dimmed = false, children }: DeckModuleProps) {
  const { palette } = useSceneEnvironment();
  const { frame } = useEquipmentMaterials({ dimmed });
  const [width, height, depth] = size;
  const x = width / 2;
  const z = depth / 2;
  const struts = useMemo(() => {
    const list: { from: Vec3; to: Vec3; radius: number }[] = [];
    const corners: Vec3[] = [
      [-x, 0, -z],
      [x, 0, -z],
      [x, 0, z],
      [-x, 0, z],
    ];
    corners.forEach((corner, index) => {
      const next = corners[(index + 1) % 4];
      list.push({ from: [corner[0], -0.35, corner[2]], to: [next[0], -0.35, next[2]], radius: 0.28 });
      if (handrail) list.push({ from: [corner[0], 1.1, corner[2]], to: [next[0], 1.1, next[2]], radius: 0.05 });
    });
    const count = Math.max(2, Math.round(columns));
    for (let index = 0; index < count; index += 1) {
      const columnX = -x + (width * index) / (count - 1);
      [-z, z].forEach((side) => {
        if (height > 0) list.push({ from: [columnX, 0, side], to: [columnX, height, side], radius: 0.24 });
        else if (handrail) list.push({ from: [columnX, 0, side], to: [columnX, 1.1, side], radius: 0.05 });
      });
    }
    return list;
  }, [x, z, width, height, columns, handrail]);

  return (
    <group>
      <mesh position={[0, -0.15, 0]}>
        <boxGeometry args={[width, 0.3, depth]} />
        <meshStandardMaterial color={palette.ground.color} transparent opacity={dimmed ? 0.1 : 0.92} depthWrite={!dimmed} roughness={0.9} />
      </mesh>
      {struts.map((strut, index) => (
        <Strut key={index} from={strut.from} to={strut.to} radius={strut.radius} segments={4} material={frame} />
      ))}
      {children}
    </group>
  );
}
