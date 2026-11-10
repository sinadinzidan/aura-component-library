import type { Vec3 } from '../cameraTargets';

/** A straight steel member between two points. Legs and chords carry load; braces stiffen. */
export type LatticeMember = { from: Vec3; to: Vec3; kind: 'leg' | 'ring' | 'brace' };

export type TowerShape = {
  /** Width (x) and depth (z) at the bottom. */
  base: readonly [number, number];
  /** Width (x) and depth (z) at the top. */
  top: readonly [number, number];
  /** Height of the bottom and the top. */
  bottomY: number;
  topY: number;
  /** Number of braced bays between bottom and top. */
  bays: number;
  /** `x` crosses every face of every bay; `zigzag` uses one diagonal that alternates. */
  bracing?: 'x' | 'zigzag';
};

/** The four corners of a tapered tower at a fraction of its height, going round: −x−z, +x−z, +x+z, −x+z. */
export function towerCorners(shape: TowerShape, fraction: number): Vec3[] {
  const t = Math.min(1, Math.max(0, fraction));
  const halfX = (shape.base[0] + (shape.top[0] - shape.base[0]) * t) / 2;
  const halfZ = (shape.base[1] + (shape.top[1] - shape.base[1]) * t) / 2;
  const y = shape.bottomY + (shape.topY - shape.bottomY) * t;
  return [
    [-halfX, y, -halfZ],
    [halfX, y, -halfZ],
    [halfX, y, halfZ],
    [-halfX, y, halfZ],
  ];
}

/**
 * Members of a four-legged tapered lattice tower: a jacket, a derrick, a flare tower. Four legs,
 * a horizontal ring at every bay boundary and diagonal bracing on all four faces.
 */
export function towerMembers(shape: TowerShape): LatticeMember[] {
  const bays = Math.max(1, Math.round(shape.bays));
  const bracing = shape.bracing ?? 'x';
  const rings = Array.from({ length: bays + 1 }, (_, index) => towerCorners(shape, index / bays));
  const members: LatticeMember[] = [];

  for (let corner = 0; corner < 4; corner += 1) {
    members.push({ from: rings[0][corner], to: rings[bays][corner], kind: 'leg' });
  }
  rings.forEach((ring) => {
    for (let corner = 0; corner < 4; corner += 1) {
      members.push({ from: ring[corner], to: ring[(corner + 1) % 4], kind: 'ring' });
    }
  });
  for (let bay = 0; bay < bays; bay += 1) {
    for (let corner = 0; corner < 4; corner += 1) {
      const next = (corner + 1) % 4;
      const rising = (bay + corner) % 2 === 0;
      if (bracing === 'x' || rising) members.push({ from: rings[bay][corner], to: rings[bay + 1][next], kind: 'brace' });
      if (bracing === 'x' || !rising) members.push({ from: rings[bay][next], to: rings[bay + 1][corner], kind: 'brace' });
    }
  }
  return members;
}

export type BoomShape = {
  /** Length along the boom's own x axis, from the heel at the origin. */
  length: number;
  /** Side of the triangular cross-section at the heel. */
  width: number;
  /** Side of the cross-section at the tip. Defaults to a third of the heel. */
  tipWidth?: number;
  bays: number;
};

/** The three chord points of a triangular boom at a fraction of its length: two bottom, one top. */
export function boomSection(shape: BoomShape, fraction: number): Vec3[] {
  const t = Math.min(1, Math.max(0, fraction));
  const tip = shape.tipWidth ?? shape.width / 3;
  const side = shape.width + (tip - shape.width) * t;
  const x = shape.length * t;
  return [
    [x, 0, -side / 2],
    [x, 0, side / 2],
    [x, side * 0.87, 0],
  ];
}

/**
 * Members of a triangular lattice boom lying along +x from the origin: a crane jib or a flare
 * boom. Three chords, a triangle at every bay boundary and one diagonal per face per bay.
 */
export function boomMembers(shape: BoomShape): LatticeMember[] {
  const bays = Math.max(1, Math.round(shape.bays));
  const sections = Array.from({ length: bays + 1 }, (_, index) => boomSection(shape, index / bays));
  const members: LatticeMember[] = [];

  for (let chord = 0; chord < 3; chord += 1) {
    members.push({ from: sections[0][chord], to: sections[bays][chord], kind: 'leg' });
  }
  sections.forEach((section) => {
    for (let chord = 0; chord < 3; chord += 1) {
      members.push({ from: section[chord], to: section[(chord + 1) % 3], kind: 'ring' });
    }
  });
  for (let bay = 0; bay < bays; bay += 1) {
    for (let chord = 0; chord < 3; chord += 1) {
      const next = (chord + 1) % 3;
      members.push(bay % 2 === 0 ? { from: sections[bay][chord], to: sections[bay + 1][next], kind: 'brace' } : { from: sections[bay][next], to: sections[bay + 1][chord], kind: 'brace' });
    }
  }
  return members;
}

/** How many members of each kind a list holds. */
export function countMembers(members: readonly LatticeMember[]): Record<LatticeMember['kind'], number> {
  return members.reduce((counts, member) => ({ ...counts, [member.kind]: counts[member.kind] + 1 }), { leg: 0, ring: 0, brace: 0 });
}
