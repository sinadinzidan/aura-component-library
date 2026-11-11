/**
 * Golden-batch comparison. Batches never take exactly the same time, so a running batch is first
 * aligned to the golden batch phase by phase, and only then compared value by value. Times are
 * minutes from the start of the batch.
 */

export type BatchPoint = { t: number; v: number };

export type BatchPhase = {
  id: string;
  label: string;
  start: number;
  end: number;
  /** False while the phase is still running: `end` is then "now", not the end of the phase. */
  complete?: boolean;
};

/** Linear interpolation of a profile at time `t`; `null` outside the profile or when it is empty. */
export function valueAt(points: readonly BatchPoint[], t: number): number | null {
  if (points.length === 0) return null;
  if (t < points[0].t || t > points[points.length - 1].t) return null;
  for (let index = 1; index < points.length; index += 1) {
    const a = points[index - 1];
    const b = points[index];
    if (t <= b.t) {
      if (b.t === a.t) return b.v;
      return a.v + ((b.v - a.v) * (t - a.t)) / (b.t - a.t);
    }
  }
  return points[points.length - 1].v;
}

function phaseAt(phases: readonly BatchPhase[], t: number): BatchPhase | undefined {
  const last = phases[phases.length - 1];
  return phases.find((phase) => t >= phase.start && t < phase.end) ?? (last && t === last.end ? last : undefined);
}

/**
 * Moves one time of the running batch onto the golden batch's clock. Inside a finished phase the
 * time is stretched or squeezed so the phase starts and ends where the golden phase does. Inside
 * a phase that is still running there is no end to stretch to, so the elapsed time in the phase
 * is kept as it is. Returns `null` for a time outside every phase or a phase the golden batch lacks.
 */
export function alignTime(t: number, phases: readonly BatchPhase[], goldenPhases: readonly BatchPhase[]): number | null {
  const phase = phaseAt(phases, t);
  const golden = phase ? goldenPhases.find((candidate) => candidate.id === phase.id) : undefined;
  if (!phase || !golden) return null;
  const elapsed = t - phase.start;
  if (phase.complete === false) return golden.start + elapsed;
  const length = phase.end - phase.start;
  if (length <= 0) return golden.start;
  return golden.start + (elapsed / length) * (golden.end - golden.start);
}

export type AlignedPoint = BatchPoint & { phaseId: string; /** Time on the batch's own clock. */ original: number };

/** Every point of the running batch on the golden batch's clock, with the phase it belongs to. */
export function alignByPhase(points: readonly BatchPoint[], phases: readonly BatchPhase[], goldenPhases: readonly BatchPhase[]): AlignedPoint[] {
  return points.flatMap((point) => {
    const t = alignTime(point.t, phases, goldenPhases);
    const phase = phaseAt(phases, point.t);
    if (t === null || !phase) return [];
    return [{ t: Math.round(t * 1000) / 1000, v: point.v, phaseId: phase.id, original: point.t }];
  });
}

export type Excursion = {
  /** Aligned time of the first and last point outside the band. */
  from: number;
  to: number;
  phaseId: string;
  /** The largest deviation in the excursion, signed: positive is above the golden profile. */
  peak: number;
};

export type DeviationScore = {
  /** Points that could be compared with the golden profile. */
  compared: number;
  /** Share of compared points inside the tolerance band, 0–100, whole percent. */
  conformance: number;
  /** Largest absolute deviation, with its sign. 0 when nothing could be compared. */
  maxDeviation: number;
  /** Root-mean-square deviation. */
  rms: number;
  excursions: Excursion[];
};

const round2 = (value: number): number => Math.round(value * 100) / 100;

/**
 * Compares aligned points with the golden profile. A point is outside when it differs from the
 * golden value by more than `tolerance`; neighbouring outside points in one phase form one excursion.
 */
export function deviationScore(aligned: readonly AlignedPoint[], golden: readonly BatchPoint[], tolerance: number): DeviationScore {
  const excursions: Excursion[] = [];
  let open: Excursion | null = null;
  let compared = 0;
  let inside = 0;
  let maxDeviation = 0;
  let squares = 0;

  for (const point of aligned) {
    const reference = valueAt(golden, point.t);
    if (reference === null) {
      open = null;
      continue;
    }
    const deviation = point.v - reference;
    compared += 1;
    squares += deviation * deviation;
    if (Math.abs(deviation) > Math.abs(maxDeviation)) maxDeviation = deviation;
    if (Math.abs(deviation) <= tolerance) {
      inside += 1;
      open = null;
      continue;
    }
    if (open && open.phaseId === point.phaseId) {
      open.to = point.t;
      if (Math.abs(deviation) > Math.abs(open.peak)) open.peak = round2(deviation);
    } else {
      open = { from: point.t, to: point.t, phaseId: point.phaseId, peak: round2(deviation) };
      excursions.push(open);
    }
  }

  return {
    compared,
    conformance: compared === 0 ? 0 : Math.round((inside / compared) * 100),
    maxDeviation: round2(maxDeviation),
    rms: compared === 0 ? 0 : round2(Math.sqrt(squares / compared)),
    excursions,
  };
}

export type PhaseDuration = {
  id: string;
  label: string;
  /** Minutes so far; `null` when the phase has not started. */
  actual: number | null;
  expected: number;
  /** Actual minus expected, for finished phases and for a running phase that is already over. */
  overrun: number | null;
};

/** Duration of each golden phase against the running batch. */
export function phaseDurations(phases: readonly BatchPhase[], goldenPhases: readonly BatchPhase[]): PhaseDuration[] {
  return goldenPhases.map((golden) => {
    const phase = phases.find((candidate) => candidate.id === golden.id);
    const expected = golden.end - golden.start;
    if (!phase) return { id: golden.id, label: golden.label, actual: null, expected, overrun: null };
    const actual = phase.end - phase.start;
    const running = phase.complete === false;
    return { id: golden.id, label: golden.label, actual, expected, overrun: running && actual <= expected ? null : actual - expected };
  });
}
