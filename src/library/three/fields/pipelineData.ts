import type { Vec3 } from '../cameraTargets';

import { corridorHeight } from './corridorTerrain';
import type { CorridorDip } from './corridorTerrain';
import { applyIsolation, applyLeak, isolationValves, pressureAt, pressureProfile } from './hydraulicGradient';
import type { HydraulicInput, PressurePoint } from './hydraulicGradient';
import { buildRoute, kpToDistance, sampleRoute } from './routeSpline';
import type { Route } from './routeSpline';

/** Length of the export pipeline in kilometres. */
export const PIPELINE_TOTAL_KM = 84;
/** Scene units per kilometre along the line. Drawn compressed: stations are far apart in life. */
export const PIPELINE_UNITS_PER_KM = 5;
/** Metres of elevation per scene unit of height. */
export const PIPELINE_METRES_PER_UNIT = 12;
/** Maximum allowable operating pressure, in barg. */
export const PIPELINE_MAOP = 132;

export type PipelineStationKind = 'launcher' | 'valve' | 'crossing' | 'compressor' | 'metering' | 'terminal';

export type PipelineValve = { tag: string; position: 'open' | 'closed' };

export type PipelineStation = {
  id: string;
  /** Short label for the profile strip and the 3D label. */
  short: string;
  name: string;
  kind: PipelineStationKind;
  /** Chainage in kilometres. */
  kp: number;
  /** Which way the crossing runs, for crossings. */
  crossing?: 'river' | 'road';
  /** Valves at the station. Block valve stations isolate a segment when closed. */
  valves: readonly PipelineValve[];
  temperature: number;
  flow: number;
  /** Extra facts shown on the station card, e.g. a burial depth. */
  facts: readonly { label: string; value: number; unit: string; decimals?: number }[];
};

/** Waypoints of the route: chainage, ground elevation in metres and sideways drift in scene units. */
const WAYPOINTS: readonly { kp: number; elevation: number; z: number }[] = [
  { kp: 0, elevation: 12, z: 0 },
  { kp: 6, elevation: 44, z: 4 },
  { kp: 14, elevation: 96, z: -6 },
  { kp: 22, elevation: 128, z: -10 },
  { kp: 30, elevation: 74, z: -2 },
  { kp: 38, elevation: 82, z: 6 },
  { kp: 48, elevation: 140, z: 12 },
  { kp: 58, elevation: 118, z: 4 },
  { kp: 68, elevation: 64, z: -6 },
  { kp: 76, elevation: 40, z: -2 },
  { kp: 84, elevation: 18, z: 0 },
];

export const PIPELINE_STATIONS: readonly PipelineStation[] = [
  { id: 'launcher', short: 'PL-01', name: 'Landfall and pig launcher', kind: 'launcher', kp: 0, valves: [{ tag: 'PL-01-XV-001', position: 'open' }, { tag: 'PL-01-XV-002', position: 'closed' }], temperature: 8, flow: 14.2, facts: [{ label: 'Launcher barrel', value: 36, unit: 'in' }] },
  { id: 'bv-01', short: 'BV-01', name: 'Block valve station 1', kind: 'valve', kp: 12, valves: [{ tag: 'BV-01-XV-001', position: 'open' }, { tag: 'BV-01-HV-002', position: 'closed' }], temperature: 7, flow: 14.2, facts: [{ label: 'Actuator', value: 24, unit: 'V DC' }] },
  { id: 'river', short: 'River', name: 'Skarelva river crossing', kind: 'crossing', crossing: 'river', kp: 27, valves: [], temperature: 6, flow: 14.2, facts: [{ label: 'Cover below bed', value: 4.5, unit: 'm', decimals: 1 }, { label: 'Crossing length', value: 240, unit: 'm' }] },
  { id: 'cs-01', short: 'CS-01', name: 'Compressor station 1', kind: 'compressor', kp: 38, valves: [{ tag: 'CS-01-XV-101', position: 'open' }, { tag: 'CS-01-XV-102', position: 'open' }, { tag: 'CS-01-HV-103', position: 'closed' }], temperature: 41, flow: 14.2, facts: [{ label: 'Boost', value: 21, unit: 'bar' }, { label: 'Shaft power', value: 7.8, unit: 'MW', decimals: 1 }] },
  { id: 'bv-02', short: 'BV-02', name: 'Block valve station 2', kind: 'valve', kp: 52, valves: [{ tag: 'BV-02-XV-001', position: 'open' }, { tag: 'BV-02-HV-002', position: 'closed' }], temperature: 16, flow: 14.2, facts: [{ label: 'Actuator', value: 24, unit: 'V DC' }] },
  { id: 'road', short: 'Road', name: 'E6 road crossing', kind: 'crossing', crossing: 'road', kp: 66, valves: [], temperature: 12, flow: 14.2, facts: [{ label: 'Cover under road', value: 2.1, unit: 'm', decimals: 1 }, { label: 'Casing length', value: 38, unit: 'm' }] },
  { id: 'bv-03', short: 'BV-03', name: 'Block valve station 3', kind: 'valve', kp: 70, valves: [{ tag: 'BV-03-XV-001', position: 'open' }, { tag: 'BV-03-HV-002', position: 'closed' }], temperature: 10, flow: 14.2, facts: [{ label: 'Actuator', value: 24, unit: 'V DC' }] },
  { id: 'ms-01', short: 'MS-01', name: 'Metering station', kind: 'metering', kp: 78, valves: [{ tag: 'MS-01-XV-001', position: 'open' }, { tag: 'MS-01-XV-002', position: 'open' }], temperature: 9, flow: 14.1, facts: [{ label: 'Metering skids', value: 2, unit: 'duty' }] },
  { id: 'terminal', short: 'Terminal', name: 'Terminal and pig receiver', kind: 'terminal', kp: 84, valves: [{ tag: 'TM-XV-001', position: 'open' }], temperature: 8, flow: 14.1, facts: [{ label: 'Receiver barrel', value: 36, unit: 'in' }] },
];

/** Pressure model of the line: friction loss, with the compressor station adding pressure. */
export const PIPELINE_HYDRAULICS: HydraulicInput = { totalKm: PIPELINE_TOTAL_KM, inletPressure: 121, lossPerKm: 0.52, boosters: [{ kp: 38, boost: 21 }] };

/** Block valve stations that isolate a segment when closed. */
export const PIPELINE_BLOCK_VALVES = PIPELINE_STATIONS.filter((station) => station.kind === 'valve');

export type AnomalySeverity = 'critical' | 'high' | 'medium' | 'low';

/** A feature reported by the last in-line inspection run. */
export type PipelineAnomaly = {
  id: string;
  kp: number;
  type: string;
  /** Depth as a percentage of the wall thickness. */
  depth: number;
  /** Length along the pipe, in millimetres. */
  length: number;
  /** Position around the pipe as a clock face: 12 is the top, 6 the bottom. */
  clock: string;
};

export const PIPELINE_ANOMALIES: readonly PipelineAnomaly[] = [
  { id: 'a-1', kp: 9.4, type: 'External metal loss', depth: 18, length: 42, clock: '5:30' },
  { id: 'a-2', kp: 17.8, type: 'Dent', depth: 2.1, length: 180, clock: '6:00' },
  { id: 'a-3', kp: 29.6, type: 'External metal loss', depth: 34, length: 120, clock: '6:00' },
  { id: 'a-4', kp: 37.2, type: 'Girth weld anomaly', depth: 12, length: 28, clock: '3:00' },
  { id: 'a-5', kp: 53.9, type: 'External metal loss', depth: 41, length: 230, clock: '4:30' },
  { id: 'a-6', kp: 61.7, type: 'Lamination', depth: 8, length: 64, clock: '10:00' },
  { id: 'a-7', kp: 71.2, type: 'Internal metal loss', depth: 22, length: 88, clock: '6:30' },
  { id: 'a-8', kp: 79.3, type: 'Dent', depth: 3.4, length: 150, clock: '12:00' },
];

/** How serious an anomaly is, from its depth: deeper metal loss is worse, dents are judged on their own scale. */
export function anomalySeverity(anomaly: PipelineAnomaly): AnomalySeverity {
  if (anomaly.type === 'Dent') return anomaly.depth >= 3 ? 'medium' : 'low';
  if (anomaly.depth >= 40) return 'high';
  if (anomaly.depth >= 25) return 'medium';
  return 'low';
}

/** The leak the scenario button plays: where it is and the stage it has reached. */
export const PIPELINE_LEAK = { kp: 58.4, drop: 20, reachKm: 9, settledPressure: 61 } as const;

export type LeakStage = 'off' | 'detected' | 'isolated';

/** The next stage when the scenario button is pressed: off → detected → isolated → off. */
export function nextLeakStage(stage: LeakStage): LeakStage {
  return stage === 'off' ? 'detected' : stage === 'detected' ? 'isolated' : 'off';
}

/** The two block valve stations that shut in the leak, or `null` if the leak lies outside the valves. */
export function leakIsolation(kp: number = PIPELINE_LEAK.kp): { upstream: PipelineStation; downstream: PipelineStation } | null {
  return isolationValves(PIPELINE_BLOCK_VALVES, kp);
}

/** The pressure profile for a stage of the scenario: normal, with the pressure wave, or with the segment shut in. */
export function scenarioProfile(stage: LeakStage, stepKm = 1): PressurePoint[] {
  const base = pressureProfile(PIPELINE_HYDRAULICS, stepKm);
  if (stage === 'off') return base;
  if (stage === 'detected') return applyLeak(base, PIPELINE_LEAK);
  const pair = leakIsolation();
  return pair ? applyIsolation(base, pair.upstream.kp, pair.downstream.kp, PIPELINE_LEAK.settledPressure) : base;
}

/** The pressure at a chainage in a stage of the scenario. */
export function scenarioPressureAt(stage: LeakStage, kp: number): number {
  const normal = pressureAt(PIPELINE_HYDRAULICS, kp);
  if (stage === 'off') return normal;
  if (stage === 'detected') {
    const distance = Math.abs(kp - PIPELINE_LEAK.kp);
    return distance >= PIPELINE_LEAK.reachKm ? normal : normal - PIPELINE_LEAK.drop * (1 - distance / PIPELINE_LEAK.reachKm);
  }
  const pair = leakIsolation();
  return pair && kp >= pair.upstream.kp && kp <= pair.downstream.kp ? PIPELINE_LEAK.settledPressure : normal;
}

/** The valves of a station as they stand in a stage: the block valves of the isolated segment are closed. */
export function stationValves(station: PipelineStation, stage: LeakStage): PipelineValve[] {
  const pair = stage === 'isolated' ? leakIsolation() : null;
  const closes = pair !== null && (station.id === pair.upstream.id || station.id === pair.downstream.id);
  return station.valves.map((valve, index) => (closes && index === 0 ? { ...valve, position: 'closed' } : valve));
}

/** Ground elevation in metres at a chainage, by interpolation between the waypoints. */
export function elevationAt(kp: number): number {
  const at = Math.min(PIPELINE_TOTAL_KM, Math.max(0, kp));
  for (let index = 1; index < WAYPOINTS.length; index += 1) {
    const from = WAYPOINTS[index - 1];
    const to = WAYPOINTS[index];
    if (at <= to.kp) return from.elevation + ((to.elevation - from.elevation) * (at - from.kp)) / (to.kp - from.kp);
  }
  return WAYPOINTS[WAYPOINTS.length - 1].elevation;
}

/** The elevation profile every kilometre, for the profile strip. */
export function elevationProfile(stepKm = 1): { kp: number; value: number }[] {
  const points: { kp: number; value: number }[] = [];
  for (let kp = 0; kp < PIPELINE_TOTAL_KM; kp += stepKm) points.push({ kp, value: elevationAt(kp) });
  points.push({ kp: PIPELINE_TOTAL_KM, value: elevationAt(PIPELINE_TOTAL_KM) });
  return points;
}

/** The route in scene coordinates: east along x, height from elevation, sideways drift in z. */
export function buildPipelineRoute(): Route {
  const waypoints: Vec3[] = WAYPOINTS.map((point) => [point.kp * PIPELINE_UNITS_PER_KM, point.elevation / PIPELINE_METRES_PER_UNIT + 1, point.z]);
  return buildRoute(waypoints, 14);
}

/** Where the ground dips under the line, in scene coordinates: the river and the road cutting, centred on their chainage. */
export function pipelineDips(route: Route): CorridorDip[] {
  return PIPELINE_STATIONS.filter((station) => station.kind === 'crossing').map((station) => ({
    x: positionAtKp(route, station.kp).position[0],
    width: station.crossing === 'river' ? 22 : 9,
    depth: station.crossing === 'river' ? 5.5 : 1.4,
  }));
}

export const PIPELINE_CLEARANCE = 1;

/** Ground level of the corridor at a point, for a route. */
export function pipelineGround(route: Route, x: number, z: number): number {
  return corridorHeight(route, x, z, { clearance: PIPELINE_CLEARANCE, relief: 6, dips: pipelineDips(route) });
}

/** The scene position and direction of a chainage on a route. */
export function positionAtKp(route: Route, kp: number): { position: Vec3; tangent: Vec3 } {
  return sampleRoute(route, kpToDistance(route, kp, PIPELINE_TOTAL_KM));
}
