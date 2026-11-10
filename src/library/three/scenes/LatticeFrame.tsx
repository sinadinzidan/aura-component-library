import type { Material } from 'three';

import { Strut } from '../Strut';

import type { LatticeMember } from './latticeGeometry';

export type LatticeFrameProps = {
  /** Members from `towerMembers` or `boomMembers`. Keep the array stable between renders. */
  members: readonly LatticeMember[];
  material: Material;
  /** Radius of legs and chords. */
  legRadius?: number;
  /** Radius of rings and diagonals. */
  braceRadius?: number;
};

/** Draws a lattice structure — jacket, derrick, boom — as struts, thick legs and thinner bracing. */
export function LatticeFrame({ members, material, legRadius = 0.3, braceRadius = 0.12 }: LatticeFrameProps) {
  return (
    <group>
      {members.map((member, index) => (
        <Strut key={index} from={member.from} to={member.to} radius={member.kind === 'leg' ? legRadius : braceRadius} segments={member.kind === 'leg' ? 10 : 6} material={material} />
      ))}
    </group>
  );
}
