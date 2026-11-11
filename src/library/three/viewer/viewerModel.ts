import { boundsFromFootprint, frameBounds, unionBounds } from '../cameraTargets';
import type { Bounds, CameraTarget, Vec3 } from '../cameraTargets';
import type { AssemblyNode } from '../models/assemblyTree';
import type { ExplodeSpec } from '../models/explodeOffsets';

export type ViewerSystem = 'separation' | 'compression' | 'cooling' | 'piping' | 'structure';

/** `box`: size is x, y, z. `hcyl`: size is length along x, then diameter. `vcyl`: size is diameter, then height. */
export type PartShape = 'box' | 'hcyl' | 'vcyl';

export type ViewerPart = {
  id: string;
  name: string;
  tag: string;
  system: ViewerSystem;
  health: 'good' | 'watch' | 'poor';
  status: 'running' | 'standby' | 'stopped' | 'tripped';
  shape: PartShape;
  /** Centre of the part on the ground: x, base height, z. */
  position: Vec3;
  size: Vec3;
  /** Short note for the selection panel. */
  note: string;
};

/**
 * A fictional compressor module, built from primitives, for the viewer chrome to work on: ten parts
 * in five systems, with run state and health per part. Tags follow the plant's style.
 */
export const VIEWER_PARTS: readonly ViewerPart[] = [
  { id: 'base-frame', name: 'Base frame', tag: '23-SK-9100', system: 'structure', health: 'good', status: 'running', shape: 'box', position: [0, 0, 0], size: [18, 0.5, 7.4], note: 'Skid steelwork with three-point mount.' },
  { id: 'separator', name: 'Suction separator', tag: '23-VG-9120', system: 'separation', health: 'good', status: 'running', shape: 'hcyl', position: [-6.2, 0.5, -1.8], size: [5, 2.4, 0], note: 'Horizontal knock-out vessel, 2.4 m diameter.' },
  { id: 'scrubber', name: 'Seal gas scrubber', tag: '23-VG-9124', system: 'separation', health: 'good', status: 'standby', shape: 'vcyl', position: [-7.4, 0.5, 2.1], size: [1.2, 3.2, 0], note: 'Vertical scrubber on the seal gas supply.' },
  { id: 'compressor', name: '1st stage compressor', tag: '23-KA-9101', system: 'compression', health: 'watch', status: 'running', shape: 'box', position: [-0.5, 0.5, 0], size: [4.6, 2.2, 2.6], note: 'Barrel casing. Drive-end vibration is rising.' },
  { id: 'motor', name: 'Drive motor', tag: '23-EM-9101', system: 'compression', health: 'good', status: 'running', shape: 'hcyl', position: [4.4, 0.5, 0], size: [3.6, 2, 0], note: 'Variable-speed motor, 4.2 MW.' },
  { id: 'cooler', name: 'Interstage cooler', tag: '23-HA-9114', system: 'cooling', health: 'watch', status: 'standby', shape: 'box', position: [-1.2, 0.5, -2.7], size: [5.2, 1.5, 1.4], note: 'Shell and tube. Fouling suspected.' },
  { id: 'lube-oil', name: 'Lube oil skid', tag: '23-LU-9105', system: 'cooling', health: 'good', status: 'running', shape: 'box', position: [5.4, 0.5, 2.5], size: [3.4, 1.2, 1.6], note: 'Pumps, filters and header.' },
  { id: 'suction-line', name: 'Suction line', tag: '23-PL-9130', system: 'piping', health: 'good', status: 'running', shape: 'hcyl', position: [-3.6, 2.4, 0], size: [3.4, 0.7, 0], note: '24 inch carbon steel.' },
  { id: 'discharge-line', name: 'Discharge line', tag: '23-PL-9131', system: 'piping', health: 'good', status: 'running', shape: 'vcyl', position: [-0.5, 2.7, 0], size: [0.6, 2.2, 0], note: '16 inch, to the interstage cooler.' },
  { id: 'antisurge', name: 'Anti-surge valve', tag: '23-XV-9140', system: 'piping', health: 'poor', status: 'tripped', shape: 'box', position: [1.9, 0.5, -2.7], size: [1.2, 1.4, 1.2], note: 'Failed to stroke in the last partial test.' },
];

export const findPart = (id: string): ViewerPart | undefined => VIEWER_PARTS.find((part) => part.id === id);

/** Footprint box of a part, assembled. */
export function partBounds(part: ViewerPart): Bounds {
  const [x, y, z] = part.position;
  if (part.shape === 'box') return boundsFromFootprint([x, y, z], part.size);
  if (part.shape === 'hcyl') return boundsFromFootprint([x, y, z], [part.size[0], part.size[1], part.size[1]]);
  return boundsFromFootprint([x, y, z], [part.size[0], part.size[1], part.size[0]]);
}

export const VIEWER_BOUNDS: Bounds = unionBounds(VIEWER_PARTS.map(partBounds)) ?? { min: [0, 0, 0], max: [1, 1, 1] };

const SYSTEM_NAMES: Record<ViewerSystem, string> = { separation: 'Separation', compression: 'Compression', cooling: 'Cooling and lube', piping: 'Piping', structure: 'Structure' };

/** The assembly tree: module, then one group per system, then the parts. */
export const VIEWER_TREE: AssemblyNode = {
  id: 'module',
  name: 'Compressor module 23-KA-9101',
  children: (Object.keys(SYSTEM_NAMES) as ViewerSystem[]).flatMap((system) => {
    const children = VIEWER_PARTS.filter((part) => part.system === system).map((part) => ({ id: part.id, name: part.name, detail: part.tag }));
    return children.length > 0 ? [{ id: `sys-${system}`, name: SYSTEM_NAMES[system], children }] : [];
  }),
};

/** How the module comes apart: lifted by system, spread outwards. */
export const VIEWER_EXPLODE: Readonly<Record<string, ExplodeSpec>> = {
  'base-frame': { direction: [0, -1, 0], distance: 1.2 },
  separator: { direction: [-1, 0.2, -0.5], distance: 3.4 },
  scrubber: { direction: [-1, 0.4, 1], distance: 3 },
  compressor: { direction: [0, 0.6, 0.3], distance: 2.4 },
  motor: { direction: [1, 0.3, 0], distance: 3.2 },
  cooler: { direction: [0, 0.5, -1], distance: 3 },
  'lube-oil': { direction: [0.5, 0.2, 1], distance: 3 },
  'suction-line': { direction: [-0.6, 1, 0], distance: 3 },
  'discharge-line': { direction: [0, 1, 0], distance: 3.4 },
  antisurge: { direction: [0.4, 0.6, -1], distance: 2.6 },
};

export const systemOf = (partId: string): ViewerSystem | undefined => findPart(partId)?.system;

/** Leaf ids belonging to the given systems. */
export const partIdsInSystems = (systems: readonly ViewerSystem[]): string[] => VIEWER_PARTS.filter((part) => systems.includes(part.system)).map((part) => part.id);

/** The default home view: the whole module from the isometric corner. */
export const VIEWER_HOME: CameraTarget = frameBounds(VIEWER_BOUNDS, { view: 'isometric', aspect: 1.3, padding: 1.05 });
