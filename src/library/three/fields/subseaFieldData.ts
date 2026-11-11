import type { Vec3 } from '../cameraTargets';

import { drapeOnTerrain, snakePlan } from './drapeOnTerrain';
import type { PlanPoint } from './drapeOnTerrain';
import { bendIndices, catenaryPoints, lazyWavePoints } from './lazyWave';
import { turretPosition } from './subseaField';
import type { SubseaFieldLayout, SubseaLine, SubseaStructure } from './subseaField';
import { terrainHeight } from './terrainHeight';
import type { HeightFunction, TerrainSpec } from './terrainHeight';

/** The seabed of the Nordkapp Vest field: gently rolling, deterministic. */
export const SUBSEA_TERRAIN: TerrainSpec = { relief: 2.2, wavelength: 55, seed: 3, base: 0 };

export const subseaHeight: HeightFunction = (x, z) => terrainHeight(SUBSEA_TERRAIN, x, z);

/** Scene units are drawn larger than life; this converts a height to metres of water depth. */
export const SUBSEA_METRES_PER_UNIT = 12;

const WATER_DEPTH = 40;
const VESSEL = { id: 'fpso', tag: 'FPSO Nordkapp Vest', position: [56, WATER_DEPTH, -6], length: 52 } as const;

const SEABED_CLEARANCE = 0.25;

const onSeabed = (height: HeightFunction, x: number, z: number, lift = SEABED_CLEARANCE): Vec3 => [x, height(x, z) + lift, z];

function structure(id: string, tag: string, name: string, kind: SubseaStructure['kind'], system: SubseaStructure['system'], position: readonly [number, number], extra: Partial<SubseaStructure> = {}): SubseaStructure {
  return { id, tag, name, kind, system, position, ...extra };
}

function laid(height: HeightFunction, id: string, tag: string, name: string, kind: SubseaLine['kind'], system: SubseaLine['system'], from: PlanPoint, to: PlanPoint, amplitude: number, extra: Partial<SubseaLine> = {}): SubseaLine {
  const plan = snakePlan(from, to, { amplitude, waves: 1.5, steps: 14 });
  return { id, tag, name, kind, system, points: drapeOnTerrain(plan, height, { spacing: 5, clearance: SEABED_CLEARANCE }), radius: 0.22, selectable: true, flow: kind === 'flowline', ...extra };
}

/**
 * The whole field as data: four drilling templates and a manifold on the seabed, flowlines and
 * umbilicals draped along it, three lazy-wave risers up to the vessel's turret, and six mooring
 * lines. Every line starts or ends exactly on something, which the tests check.
 */
export function buildSubseaLayout(height: HeightFunction = subseaHeight): SubseaFieldLayout {
  const vessel = { ...VESSEL, position: [...VESSEL.position] as [number, number, number] };
  const turret = turretPosition(vessel);
  const around = (angle: number, radius: number, y = turret[1]): Vec3 => [turret[0] + Math.cos(angle) * radius, y, turret[2] + Math.sin(angle) * radius];

  const structures: SubseaStructure[] = [
    structure('t-a', '23-TA', 'Template A', 'template', 'production', [-76, -26], { slots: 4 }),
    structure('t-b', '23-TB', 'Template B', 'template', 'production', [-76, 12], { slots: 4 }),
    structure('t-c', '23-TC', 'Template C', 'template', 'production', [-54, 36], { slots: 3 }),
    structure('t-d', '23-TD', 'Template D, water injection', 'template', 'injection', [-48, -42], { slots: 2 }),
    structure('m-1', '23-MF-1', 'Production manifold', 'manifold', 'production', [-46, -4]),
    structure('plet-1', '23-PLET-1', 'Pipeline end termination', 'plet', 'production', [-18, 4], { rotationY: 0 }),
  ];

  const riserBase = (angle: number, radius: number, plan: PlanPoint): { top: Vec3; touchdown: Vec3 } => ({ top: around(angle, radius), touchdown: onSeabed(height, plan[0], plan[1]) });
  const production = riserBase(0.2, 2.2, [-2, 8]);
  const injection = riserBase(1.2, 2.2, [-2, -14]);
  const umbilical = riserBase(2.2, 2.2, [-12, -24]);

  const riser = (id: string, tag: string, name: string, system: SubseaLine['system'], ends: { top: Vec3; touchdown: Vec3 }, upwards: boolean, radius: number): SubseaLine => {
    const path = lazyWavePoints(ends.top, ends.touchdown, { segments: 28 });
    return { id, tag, name, kind: 'riser', system, points: upwards ? [...path].reverse() : path, radius, selectable: true, flow: system !== 'control' };
  };

  const lines: SubseaLine[] = [
    laid(height, 'fl-a', '23-FL-A', 'Flowline A to manifold', 'flowline', 'production', [-76, -26], [-46, -4], 3),
    laid(height, 'fl-b', '23-FL-B', 'Flowline B to manifold', 'flowline', 'production', [-76, 12], [-46, -4], 3),
    laid(height, 'fl-c', '23-FL-C', 'Flowline C to manifold', 'flowline', 'production', [-54, 36], [-46, -4], 4),
    laid(height, 'exp-1', '23-EXP-1', 'Production trunkline', 'pipeline', 'production', [-46, -4], [-18, 4], 2.5, { radius: 0.3 }),
    laid(height, 'jmp-1', '23-JMP-1', 'Jumper to riser base', 'jumper', 'production', [-18, 4], [-2, 8], 0.8, { selectable: false, flow: true }),
    riser('rs-1', '23-RS-1', 'Production riser, lazy wave', 'production', production, true, 0.3),
    laid(height, 'ij-1', '23-IJ-1', 'Injection flowline to template D', 'flowline', 'injection', [-2, -14], [-48, -42], 6),
    riser('rs-2', '23-RS-2', 'Injection riser, lazy wave', 'injection', injection, false, 0.28),
    laid(height, 'um-1', '23-UM-1', 'Control umbilical to template A', 'umbilical', 'control', [-12, -24], [-76, -26], 6, { radius: 0.12, flow: false }),
    laid(height, 'um-2', '23-UM-2', 'Control umbilical to template C', 'umbilical', 'control', [-12, -24], [-54, 36], 8, { radius: 0.12, flow: false, selectable: false }),
    riser('ru-1', '23-RU-1', 'Dynamic umbilical, lazy wave', 'control', umbilical, false, 0.14),
  ];

  for (let index = 0; index < 6; index += 1) {
    const angle = (index / 6) * Math.PI * 2 + 0.5;
    const anchor = onSeabed(height, turret[0] + Math.cos(angle) * 72, turret[2] + Math.sin(angle) * 72, 0.5);
    lines.push({
      id: `ml-${index + 1}`,
      tag: `23-ML-${index + 1}`,
      name: `Mooring line ${index + 1}`,
      kind: 'mooring',
      system: 'mooring',
      points: catenaryPoints(anchor, around(angle, 3.2, turret[1] + 1.5), 22),
      radius: 0.16,
      selectable: false,
    });
  }

  return { size: [230, 180], waterDepth: WATER_DEPTH, fieldCenter: [-46, -4], vessel, structures, lines };
}

/** Whether a riser path really is a lazy wave: one sag bend with one hog bend above it. */
export function isLazyWave(points: readonly Vec3[]): boolean {
  const { sag, hog } = bendIndices(points);
  return sag.length === 1 && hog.length === 1;
}
