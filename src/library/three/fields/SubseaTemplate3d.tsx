import type { ReactNode } from 'react';

import { toTuple } from '../cameraTargets';
import type { Vec3 } from '../cameraTargets';
import { SubseaTemplate } from '../models/SubseaTemplate';
import { Selectable } from '../Selectable';
import { Strut } from '../Strut';
import { useEquipmentMaterials } from '../useEquipmentMaterials';

export type SubseaTemplate3dProps = {
  id: string;
  /** Where it stands on the seabed. */
  position: Vec3;
  rotationY?: number;
  /** Number of well slots, each with a christmas tree. */
  slots?: number;
  /** Footprint (x, z) and height of the protection structure. */
  size?: readonly [number, number];
  height?: number;
  selected?: boolean;
  dimmed?: boolean;
  onSelect?: (id: string) => void;
  onHoverChange?: (id: string | null) => void;
  /** Extra scene content in the template's own frame. */
  children?: ReactNode;
};

/** One christmas tree: a master valve block, a swab valve stack and a cap, drawn on a wellhead. */
function ChristmasTree({ at, dimmed, hovered, selected }: { at: readonly [number, number]; dimmed: boolean; hovered: boolean; selected: boolean }) {
  const { steel, pipe, detail, frame } = useEquipmentMaterials({ dimmed, hovered, selected });

  return (
    <group position={[at[0], 0, at[1]]}>
      <mesh position={[0, 0.22, 0]} material={frame}>
        <cylinderGeometry args={[0.46, 0.55, 0.44, 12]} />
      </mesh>
      <mesh position={[0, 0.78, 0]} material={steel}>
        <boxGeometry args={[0.5, 0.7, 0.5]} />
      </mesh>
      <mesh position={[0, 1.3, 0]} material={pipe}>
        <cylinderGeometry args={[0.16, 0.16, 0.6, 10]} />
      </mesh>
      <mesh position={[0.42, 0.85, 0]} rotation={[0, 0, Math.PI / 2]} material={pipe}>
        <cylinderGeometry args={[0.1, 0.1, 0.5, 8]} />
      </mesh>
      <mesh position={[0, 1.7, 0]} material={detail}>
        <sphereGeometry args={[0.21, 10, 8]} />
      </mesh>
    </group>
  );
}

/**
 * A subsea production template: a tubular protection frame over the well slots, a manifold
 * header, and a christmas tree on every slot. Selectable; hovering or selecting it outlines it
 * in the accent colour and lights the trees.
 */
export function SubseaTemplate3d({ id, position, rotationY = 0, slots = 4, size = [7, 7], height = 2.2, selected = false, dimmed = false, onSelect, onHoverChange, children }: SubseaTemplate3dProps) {
  const { frame } = useEquipmentMaterials({ dimmed });
  const count = Math.max(0, Math.floor(slots));
  const spread = size[0] * 0.6;

  return (
    <group position={toTuple(position)} rotation={[0, rotationY, 0]}>
      <Selectable id={id} onSelect={onSelect} onHoverChange={onHoverChange} selected={selected} disabled={dimmed}>
        {(state) => (
          <group>
            <SubseaTemplate size={size} height={height} dimmed={dimmed} />
            {Array.from({ length: count }, (_, index) => {
              const t = count === 1 ? 0.5 : index / (count - 1);
              return <ChristmasTree key={index} at={[-spread / 2 + t * spread, index % 2 === 0 ? -size[1] * 0.18 : size[1] * 0.18]} dimmed={dimmed} hovered={state.hovered} selected={state.selected} />;
            })}
            <Strut from={[-size[0] * 0.4, height * 0.95, 0]} to={[size[0] * 0.4, height * 0.95, 0]} radius={0.05} material={frame} segments={6} />
          </group>
        )}
      </Selectable>
      {children}
    </group>
  );
}
