import { toOrders } from './harmonics';

export type FaultId = 'unbalance' | 'misalignment' | 'looseness' | 'bearing-outer' | 'bearing-inner' | 'vane-pass' | 'cage';

/** A relative line in a fault's typical spectrum: where it sits and how tall it is (0–1). */
export type SignatureLine = { order: number; height: number; label?: string };

export type FaultSignature = {
  id: FaultId;
  name: string;
  /** What the spectrum looks like, in a phrase. */
  pattern: string;
  /** How to confirm it with another measurement. */
  confirm: string;
  /** The usual corrective action. */
  action: string;
  lines: readonly SignatureLine[];
};

/** Reference signatures of the four faults every vibration programme starts with. */
export const FAULT_SIGNATURES: Record<'unbalance' | 'misalignment' | 'looseness' | 'bearing-outer', FaultSignature> = {
  unbalance: {
    id: 'unbalance',
    name: 'Unbalance',
    pattern: 'One dominant peak at 1× running speed, mostly radial.',
    confirm: 'Phase is steady and shifts about 90° between horizontal and vertical.',
    action: 'Clean or balance the rotor.',
    lines: [
      { order: 1, height: 1, label: '1×' },
      { order: 2, height: 0.12 },
      { order: 3, height: 0.06 },
    ],
  },
  misalignment: {
    id: 'misalignment',
    name: 'Misalignment',
    pattern: 'High 2×, often above 1×, with 3× present and strong axial vibration.',
    confirm: 'Phase differs about 180° across the coupling.',
    action: 'Check alignment hot and correct soft foot.',
    lines: [
      { order: 1, height: 0.55, label: '1×' },
      { order: 2, height: 1, label: '2×' },
      { order: 3, height: 0.4, label: '3×' },
      { order: 4, height: 0.1 },
    ],
  },
  looseness: {
    id: 'looseness',
    name: 'Mechanical looseness',
    pattern: 'A long comb of running-speed harmonics, with half-orders between them.',
    confirm: 'Readings change with direction and are unsteady from one sample to the next.',
    action: 'Check hold-down bolts, bearing fits and the base frame.',
    lines: [
      { order: 0.5, height: 0.22 },
      { order: 1, height: 1, label: '1×' },
      { order: 1.5, height: 0.2 },
      { order: 2, height: 0.72, label: '2×' },
      { order: 2.5, height: 0.16 },
      { order: 3, height: 0.58, label: '3×' },
      { order: 4, height: 0.5 },
      { order: 5, height: 0.44 },
      { order: 6, height: 0.4 },
      { order: 7, height: 0.36 },
    ],
  },
  'bearing-outer': {
    id: 'bearing-outer',
    name: 'Bearing defect',
    pattern: 'Peaks at a non-integer multiple of running speed (BPFO or BPFI) and its harmonics.',
    confirm: 'Crest factor and kurtosis rise first; BPFI shows 1× sidebands.',
    action: 'Trend it, check lubrication and plan a bearing replacement.',
    lines: [
      { order: 1, height: 0.35, label: '1×' },
      { order: 3.56, height: 1, label: 'BPFO' },
      { order: 7.12, height: 0.5, label: '2 BPFO' },
      { order: 10.68, height: 0.25 },
    ],
  },
};

/** What a diagnosis needs to know about the machine at the measurement point. */
export type DiagnosisContext = {
  runningHz: number;
  bearing?: { bpfo: number; bpfi: number; ftf?: number };
  vanes?: number;
  /** How far, in orders, a peak may sit from a characteristic frequency and still match. */
  toleranceOrders?: number;
};

export type Diagnosis = {
  faultId: FaultId;
  /** Name of the matched frequency: "1×", "2×", "BPFO", "2 BPFO", "Vane pass". */
  frequencyName: string;
  /** Likely cause in plain words. */
  cause: string;
  /** What to check next. */
  nextStep: string;
  /** Distance from the characteristic frequency, in orders. */
  errorOrders: number;
};

type Candidate = Omit<Diagnosis, 'errorOrders'> & { order: number };

function candidates(context: DiagnosisContext): Candidate[] {
  const list: Candidate[] = [];
  if (context.bearing) {
    const families = [
      { name: 'BPFO', hz: context.bearing.bpfo, faultId: 'bearing-outer', cause: 'Defect on the bearing outer race' },
      { name: 'BPFI', hz: context.bearing.bpfi, faultId: 'bearing-inner', cause: 'Defect on the bearing inner race' },
    ] as const;
    for (const family of families) {
      for (const multiple of [1, 2]) {
        list.push({
          faultId: family.faultId,
          frequencyName: multiple === 1 ? family.name : `${multiple} ${family.name}`,
          cause: family.cause,
          nextStep: 'Compare crest factor and kurtosis with the baseline, then check the grease record.',
          order: toOrders(family.hz * multiple, context.runningHz),
        });
      }
    }
    if (context.bearing.ftf !== undefined) {
      list.push({
        faultId: 'cage',
        frequencyName: 'FTF',
        cause: 'Bearing cage wear or a loaded cage',
        nextStep: 'Look for FTF sidebands around the ball pass frequencies.',
        order: toOrders(context.bearing.ftf, context.runningHz),
      });
    }
  }
  if (context.vanes) {
    list.push({
      faultId: 'vane-pass',
      frequencyName: 'Vane pass',
      cause: `Vane pass of the ${context.vanes}-vane impeller`,
      nextStep: 'Normal when small. If it grows, check the operating point against best efficiency and the cutwater clearance.',
      order: context.vanes,
    });
  }
  list.push(
    { faultId: 'unbalance', frequencyName: '1×', cause: 'Unbalance', nextStep: 'Check that phase is steady, then inspect the rotor for deposits or lost mass.', order: 1 },
    { faultId: 'misalignment', frequencyName: '2×', cause: 'Shaft misalignment', nextStep: 'Take axial readings and compare phase across the coupling.', order: 2 },
    { faultId: 'misalignment', frequencyName: '3×', cause: 'Shaft misalignment', nextStep: 'Take axial readings and compare phase across the coupling.', order: 3 }
  );
  for (const order of [0.5, 1.5, 2.5]) {
    list.push({ faultId: 'looseness', frequencyName: `${order}×`, cause: 'Mechanical looseness or a rub', nextStep: 'Check hold-down bolts and bearing fits; look for a comb of harmonics.', order });
  }
  for (const order of [4, 5, 6, 7, 8]) {
    list.push({ faultId: 'looseness', frequencyName: `${order}×`, cause: 'Running-speed harmonic', nextStep: 'A long comb of harmonics points to looseness; a single one is usually harmless.', order });
  }
  return list;
}

/**
 * Links a spectral peak to its most likely cause: the closest characteristic frequency within the
 * tolerance, bearing and vane-pass frequencies first when they tie. `null` when nothing matches.
 */
export function diagnosePeak(frequencyHz: number, context: DiagnosisContext): Diagnosis | null {
  const tolerance = context.toleranceOrders ?? 0.06;
  const order = toOrders(frequencyHz, context.runningHz);
  let best: Diagnosis | null = null;
  for (const candidate of candidates(context)) {
    const errorOrders = Math.abs(candidate.order - order);
    if (errorOrders > tolerance) continue;
    if (!best || errorOrders < best.errorOrders - 1e-9) {
      best = { faultId: candidate.faultId, frequencyName: candidate.frequencyName, cause: candidate.cause, nextStep: candidate.nextStep, errorOrders };
    }
  }
  return best;
}
