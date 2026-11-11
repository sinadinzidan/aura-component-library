import type { Vec3 } from '../cameraTargets';

import { CRYOGENIC_EXCHANGER_SIZE, airCoolerBankSize, containmentTankSize, lngCarrierSize, loadingArmsSize, slugCatcherSize } from './plantSizes';

/** The models an LNG site can place. Each maps to one component, see `LngSite`. */
export type LngUnitKind =
  | 'slug-catcher'
  | 'separator'
  | 'column'
  | 'vessel'
  | 'mche'
  | 'compressor'
  | 'turbine'
  | 'cooler-bank'
  | 'tank'
  | 'loading-arms'
  | 'carrier'
  | 'flare'
  | 'building'
  | 'control-room';

/** One unit of an LNG site as data: what it is, where it stands and what the tour says about it. */
export type LngUnit = {
  id: string;
  kind: LngUnitKind;
  /** Functional location tag, shown on the label. */
  tag: string;
  name: string;
  /** The tour stop this unit belongs to; `null` for utilities that are not on the tour. */
  stageId: string | null;
  /** Centre on the ground (or on the waterline for ships and berths). */
  position: Vec3;
  /** Rotation around the vertical axis, in radians. Models lie along x. */
  rotationY?: number;
  /** Process temperature in °C, for the temperature colouring; `null` where it has none. */
  temperature: number | null;
  /** Labelled from far away, in the overview. */
  landmark?: boolean;
  /** Overall height, for columns, vessels, the exchanger and the flare. */
  height?: number;
  /** Fill level 0–1, for tanks. */
  fill?: number;
  /** Bays of an air-cooler bank, fingers of a slug catcher, arms of a berth. */
  count?: number;
  /** Arms connected to the ship, for a berth. */
  connected?: number;
};

const FIXED_SIZES: Record<Exclude<LngUnitKind, 'slug-catcher' | 'cooler-bank' | 'tank' | 'loading-arms' | 'carrier' | 'mche' | 'column' | 'vessel' | 'flare'>, Vec3> = {
  separator: [9.6, 4.6, 3],
  compressor: [10, 3.8, 4],
  turbine: [10, 6.5, 3.4],
  building: [12.5, 4.5, 8.5],
  'control-room': [12.5, 7.6, 8.5],
};

/** Bounding size (x, y, z) of a unit in its own orientation. */
export function lngUnitSize(unit: LngUnit): Vec3 {
  switch (unit.kind) {
    case 'slug-catcher':
      return slugCatcherSize(unit.count);
    case 'cooler-bank':
      return airCoolerBankSize(unit.count);
    case 'tank':
      return containmentTankSize();
    case 'loading-arms':
      return loadingArmsSize(unit.count);
    case 'carrier':
      return lngCarrierSize();
    case 'mche':
      return [CRYOGENIC_EXCHANGER_SIZE[0], (unit.height ?? 44) + 2, CRYOGENIC_EXCHANGER_SIZE[2]];
    case 'column':
      return [4.2, (unit.height ?? 22) + 0.6, 4.2];
    case 'vessel':
      return [3.6, (unit.height ?? 8) + 0.4, 2.8];
    case 'flare':
      return [3, (unit.height ?? 30) + 3.5, 3];
    default:
      return FIXED_SIZES[unit.kind];
  }
}

/** Radius of a ground ring that encloses the unit's footprint. */
export function lngUnitRingRadius(unit: LngUnit): number {
  const [x, , z] = lngUnitSize(unit);
  return Math.hypot(x, z) / 2 + 1.2;
}

/** Where the unit's label goes: above the middle of its top. */
export function lngLabelAnchor(unit: LngUnit, gap = 1.2): Vec3 {
  return [unit.position[0], unit.position[1] + lngUnitSize(unit)[1] + gap, unit.position[2]];
}

/** The units of one tour stop, in layout order. */
export function unitsOfStage(units: readonly LngUnit[], stageId: string): LngUnit[] {
  return units.filter((unit) => unit.stageId === stageId);
}

/** The centre of a group of units on the ground, e.g. to aim a camera at a tour stop. */
export function unitsCentre(units: readonly LngUnit[]): Vec3 {
  if (units.length === 0) return [0, 0, 0];
  const sum = units.reduce<[number, number, number]>((total, unit) => [total[0] + unit.position[0], total[1] + unit.position[1], total[2] + unit.position[2]], [0, 0, 0]);
  return [sum[0] / units.length, sum[1] / units.length, sum[2] / units.length];
}
