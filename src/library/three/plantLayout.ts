import { boundsCenter, boundsFromFootprint, frameBounds, unionBounds } from './cameraTargets';
import type { Bounds, CameraTarget, CameraView, Vec3 } from './cameraTargets';

/** The procedural models a layout can place. Each maps to one component in this folder. */
export type PlantEquipmentKind =
  | 'horizontal-vessel'
  | 'vertical-vessel'
  | 'column'
  | 'storage-tank'
  | 'compressor'
  | 'pump'
  | 'heat-exchanger'
  | 'air-cooler'
  | 'turbine'
  | 'valve'
  | 'flare'
  | 'building'
  | 'control-room'
  | 'pipe-rack';

export type PlantEquipment = {
  /** Asset id. Selection, statuses and camera focus all use it. */
  id: string;
  kind: PlantEquipmentKind;
  /** Functional location tag, shown on the label. */
  tag: string;
  name?: string;
  /** Where the model stands: its centre on the ground. */
  position: Vec3;
  /** Rotation around the vertical axis, in radians. Models lie along x by default. */
  rotationY?: number;
  scale?: number;
  /** Fill level 0–1, for storage tanks. */
  fill?: number;
  /** Length override, for pipe racks. */
  length?: number;
};

export type PlantArea = {
  id: string;
  tag: string;
  name: string;
  /** Centre of the area on the ground plane: x, z. */
  center: readonly [number, number];
  /** Width (x) and depth (z). */
  size: readonly [number, number];
  /** Height of the outlined volume. */
  height?: number;
  equipment: readonly PlantEquipment[];
};

export type PlantPipe = {
  id: string;
  /** Route, corner to corner, in flow direction. */
  points: readonly Vec3[];
  radius?: number;
  /** Show flow chevrons. */
  flow?: boolean;
  /** Area the line belongs to. Lines without one are trunk lines and never dim. */
  areaId?: string;
};

/** A whole plant scene as data: what stands where. Render it with `PlantScene`. */
export type PlantLayout = {
  id: string;
  name: string;
  /** Width (x) and depth (z) of the plot, centred on the origin. */
  size: readonly [number, number];
  areas: readonly PlantArea[];
  /** Equipment that gives the plant its shape but cannot be selected: flare, racks, buildings, tanks. */
  scenery: readonly PlantEquipment[];
  pipes: readonly PlantPipe[];
};

export type PlantNode =
  | { type: 'plant'; id: string; layout: PlantLayout }
  | { type: 'area'; id: string; area: PlantArea }
  | { type: 'equipment'; id: string; equipment: PlantEquipment; area: PlantArea };

/** Bounding size (x, y, z) of each model at scale 1, in its own orientation. */
export const EQUIPMENT_SIZES: Record<PlantEquipmentKind, Vec3> = {
  'horizontal-vessel': [9.6, 4.6, 3],
  'vertical-vessel': [3.6, 8.4, 2.8],
  column: [4.2, 22.6, 4.2],
  'storage-tank': [10.8, 9, 10],
  compressor: [10, 3.8, 4],
  pump: [4, 2, 1.8],
  'heat-exchanger': [8.4, 3.2, 1.9],
  'air-cooler': [10.8, 5, 5],
  turbine: [10, 6.5, 3.4],
  valve: [2.8, 2.8, 1.2],
  flare: [3, 33.5, 3],
  building: [12.5, 4.5, 8.5],
  'control-room': [12.5, 7.6, 8.5],
  'pipe-rack': [40, 5.6, 4.3],
};

const DEFAULT_AREA_HEIGHT = 7;
const PLANT_HEIGHT = 8;

/** Size of a placed piece of equipment in its own orientation, with scale and length applied. */
export function equipmentSize(equipment: PlantEquipment): Vec3 {
  const [x, y, z] = EQUIPMENT_SIZES[equipment.kind];
  const scale = equipment.scale ?? 1;
  return [(equipment.length ?? x) * scale, y * scale, z * scale];
}

/** World-space box around a placed piece of equipment, accounting for its rotation. */
export function equipmentBounds(equipment: PlantEquipment): Bounds {
  const [x, y, z] = equipmentSize(equipment);
  const cos = Math.abs(Math.cos(equipment.rotationY ?? 0));
  const sin = Math.abs(Math.sin(equipment.rotationY ?? 0));
  return boundsFromFootprint(equipment.position, [x * cos + z * sin, y, x * sin + z * cos]);
}

export function areaBounds(area: PlantArea): Bounds {
  return boundsFromFootprint([area.center[0], 0, area.center[1]], [area.size[0], area.height ?? DEFAULT_AREA_HEIGHT, area.size[1]]);
}

export function plantBounds(layout: PlantLayout): Bounds {
  return boundsFromFootprint([0, 0, 0], [layout.size[0], PLANT_HEIGHT, layout.size[1]]);
}

/** Finds the plant, an area or a piece of selectable equipment by id. */
export function findNode(layout: PlantLayout, id: string): PlantNode | null {
  if (id === layout.id) return { type: 'plant', id, layout };
  for (const area of layout.areas) {
    if (area.id === id) return { type: 'area', id, area };
    const equipment = area.equipment.find((candidate) => candidate.id === id);
    if (equipment) return { type: 'equipment', id, equipment, area };
  }
  return null;
}

/** Ids from the plant down to the node: `['nk', 'nk-23', '23-ka-9101']`. Empty for an unknown id. */
export function pathTo(layout: PlantLayout, id: string): string[] {
  const node = findNode(layout, id);
  if (!node) return [];
  if (node.type === 'plant') return [layout.id];
  if (node.type === 'area') return [layout.id, node.area.id];
  return [layout.id, node.area.id, node.equipment.id];
}

/** Box around a node; `null` for an unknown id. */
export function boundsOf(layout: PlantLayout, id: string): Bounds | null {
  const node = findNode(layout, id);
  if (!node) return null;
  if (node.type === 'plant') return plantBounds(layout);
  if (node.type === 'area') return unionBounds([areaBounds(node.area), ...node.area.equipment.map(equipmentBounds)]);
  return equipmentBounds(node.equipment);
}

export type CameraTargetOptions = {
  view?: CameraView;
  /** Canvas width / height. */
  aspect?: number;
  /** Vertical field of view in degrees. */
  fov?: number;
};

const FRAMING: Record<PlantNode['type'], { padding: number; minDistance: number }> = {
  // A plot is flat, so its bounding sphere overstates what the camera must fit.
  plant: { padding: 0.74, minDistance: 0 },
  area: { padding: 0.86, minDistance: 0 },
  equipment: { padding: 1.5, minDistance: 15 },
};

/** The camera target that frames a node. Unknown ids frame the whole plant. */
export function cameraTargetFor(layout: PlantLayout, id: string, options: CameraTargetOptions = {}): CameraTarget {
  const node = findNode(layout, id);
  const bounds = boundsOf(layout, id) ?? plantBounds(layout);
  const framing = FRAMING[node?.type ?? 'plant'];
  return frameBounds(bounds, { ...options, ...framing });
}

/** Where a label for a piece of equipment goes: above the middle of its top. */
export function labelAnchor(equipment: PlantEquipment, gap = 0.8): Vec3 {
  const bounds = equipmentBounds(equipment);
  const center = boundsCenter(bounds);
  return [center[0], bounds.max[1] + gap, center[2]];
}

/**
 * A point on a piece of equipment from an anchor in its own frame: x and z from −1 to 1 across the
 * footprint (x along the machine), y from 0 (ground) to 1 (top). Used to place sensor markers.
 */
export function anchorPosition(equipment: PlantEquipment, anchor: Vec3): Vec3 {
  const [x, y, z] = equipmentSize(equipment);
  const localX = (anchor[0] * x) / 2;
  const localZ = (anchor[2] * z) / 2;
  const angle = equipment.rotationY ?? 0;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [
    equipment.position[0] + localX * cos + localZ * sin,
    equipment.position[1] + anchor[1] * y,
    equipment.position[2] - localX * sin + localZ * cos,
  ];
}
