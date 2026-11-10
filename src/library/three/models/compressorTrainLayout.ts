import type { Bounds, Vec3 } from '../cameraTargets';

import type { AssemblyNode } from './assemblyTree';
import type { ExplodeSpec } from './explodeOffsets';

/** The drawable sub-assemblies of the compressor train. */
export const TRAIN_ASSEMBLY_IDS = [
  'turbine',
  'gearbox',
  'coupling',
  'casing',
  'rotor',
  'bearing-de',
  'bearing-nde',
  'seal-gas',
  'lube-oil',
  'instruments',
  'base-frame',
] as const;

export type TrainAssemblyId = (typeof TRAIN_ASSEMBLY_IDS)[number];

export function isTrainAssemblyId(value: string): value is TrainAssemblyId {
  return TRAIN_ASSEMBLY_IDS.some((id) => id === value);
}

/** Height of the shaft centre line above the ground, and of the deck the machines stand on. */
export const TRAIN_SHAFT_HEIGHT = 2.4;
export const TRAIN_DECK_HEIGHT = 0.6;

/** Station of the first impeller on the shaft, and the distance between stages. */
export const IMPELLER_FIRST_X = -5.9;
export const IMPELLER_PITCH = 0.7;

/** Positions of the impellers along the shaft, suction end first. */
export function impellerPositions(stages: number): number[] {
  return Array.from({ length: Math.max(0, Math.floor(stages)) }, (_, index) => IMPELLER_FIRST_X + index * IMPELLER_PITCH);
}

/** The assembly breakdown shown in the parts tree. Leaves match `TRAIN_ASSEMBLY_IDS`. */
export const COMPRESSOR_TRAIN_TREE: AssemblyNode = {
  id: 'train',
  name: 'Compressor train',
  children: [
    {
      id: 'drive-train',
      name: 'Drive train',
      children: [
        { id: 'turbine', name: 'Gas turbine driver', detail: 'Intake to exhaust stack' },
        { id: 'gearbox', name: 'Gearbox', detail: 'Speed increasing, 1 : 1.6' },
        { id: 'coupling', name: 'Coupling and guard', detail: 'High-speed side' },
      ],
    },
    {
      id: 'compressor',
      name: 'Compressor',
      children: [
        { id: 'casing', name: 'Barrel casing', detail: 'Two nozzles' },
        { id: 'rotor', name: 'Rotor and impellers', detail: '5 stages' },
        { id: 'bearing-de', name: 'Drive-end bearing', detail: 'Journal and thrust' },
        { id: 'bearing-nde', name: 'Non-drive-end bearing', detail: 'Journal' },
      ],
    },
    {
      id: 'auxiliaries',
      name: 'Auxiliaries',
      children: [
        { id: 'seal-gas', name: 'Seal gas panel', detail: 'Filters and valve' },
        { id: 'lube-oil', name: 'Lube oil skid', detail: 'Pumps and cooler' },
        { id: 'instruments', name: 'Instrument stands', detail: '3 stands' },
      ],
    },
    { id: 'structure', name: 'Structure', children: [{ id: 'base-frame', name: 'Base frame', detail: 'Three-point mount' }] },
  ],
};

/**
 * How the train comes apart. Everything on the shaft travels along the shaft axis (x): the driver
 * side towards +x, the non-drive end towards −x, and the rotor follows the bearing out of the
 * casing once it has cleared. Auxiliaries step sideways; the frame drops.
 */
export const COMPRESSOR_TRAIN_EXPLODE: Readonly<Record<TrainAssemblyId, ExplodeSpec>> = {
  turbine: { direction: [1, 0, 0], distance: 3.6 },
  gearbox: { direction: [1, 0, 0], distance: 1.9 },
  coupling: { direction: [1, 0, 0], distance: 0.9 },
  casing: { direction: [0, 0, 0], distance: 0 },
  rotor: { direction: [-1, 0, 0], distance: 4.7, start: 0.3 },
  'bearing-de': { direction: [1, 0, 0], distance: 0.35 },
  'bearing-nde': { direction: [-1, 0, 0], distance: 6.3 },
  'seal-gas': { direction: [0, 0, -1], distance: 2.2 },
  'lube-oil': { direction: [0, 0, 1], distance: 2.6 },
  instruments: { direction: [0, 0, 1], distance: 1.4 },
  'base-frame': { direction: [0, -1, 0], distance: 1.4 },
};

/** Bounding box of each sub-assembly in its assembled position. */
export const COMPRESSOR_TRAIN_BOUNDS: Readonly<Record<TrainAssemblyId, Bounds>> = {
  turbine: { min: [3.3, 0.6, -1.7], max: [10, 8.6, 1.7] },
  gearbox: { min: [0.3, 0.6, -1.3], max: [3.2, 3.9, 1.3] },
  coupling: { min: [-1.3, 1.8, -0.6], max: [0.3, 3, 0.6] },
  casing: { min: [-6.75, 0.6, -1.6], max: [-2.25, 5.3, 1.6] },
  rotor: { min: [-7.6, 1.4, -1], max: [-1.3, 3.4, 1] },
  'bearing-de': { min: [-2.2, 0.6, -0.7], max: [-1.4, 3.1, 0.7] },
  'bearing-nde': { min: [-7.7, 0.6, -0.7], max: [-6.8, 3.1, 0.7] },
  'seal-gas': { min: [-5.8, 0, -3.9], max: [-3.2, 3.2, -3.1] },
  'lube-oil': { min: [3.4, 0, 3.3], max: [8.2, 2.5, 5.3] },
  instruments: { min: [-5.9, 0.6, 2.1], max: [-1.6, 2.4, 2.5] },
  'base-frame': { min: [-8.2, 0, -2.6], max: [10.4, 0.6, 2.6] },
};

/** Where an instrument sits on the train: the part it is mounted on and its assembled position. */
export type TrainMeasurementPoint = { assemblyId: TrainAssemblyId; position: Vec3 };

/** The real measurement points of a centrifugal compressor train, keyed by what they measure. */
export const TRAIN_MEASUREMENT_POINTS = {
  driveEndVibration: { assemblyId: 'bearing-de', position: [-1.8, 3.15, 0.25] },
  dischargeTemperature: { assemblyId: 'casing', position: [-3.4, 4.45, 0.5] },
  dischargePressure: { assemblyId: 'casing', position: [-3.4, 5.35, 0] },
  suctionPressure: { assemblyId: 'casing', position: [-5.6, 5.35, 0] },
  shaftSpeed: { assemblyId: 'coupling', position: [-0.5, 3.05, 0] },
  lubeOilPressure: { assemblyId: 'lube-oil', position: [4.6, 2.55, 4.3] },
} as const satisfies Record<string, TrainMeasurementPoint>;
