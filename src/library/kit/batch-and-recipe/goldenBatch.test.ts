import { alignByPhase, alignTime, deviationScore, phaseDurations, valueAt } from './goldenBatch';
import type { AlignedPoint, BatchPhase, BatchPoint } from './goldenBatch';

const GOLDEN_PHASES: BatchPhase[] = [
  { id: 'heat', label: 'Heat', start: 0, end: 40 },
  { id: 'react', label: 'React', start: 40, end: 100 },
  { id: 'cool', label: 'Cool', start: 100, end: 130 },
];

const GOLDEN: BatchPoint[] = [
  { t: 0, v: 20 },
  { t: 40, v: 80 },
  { t: 100, v: 80 },
  { t: 130, v: 30 },
];

const aligned = (t: number, v: number, phaseId = 'react'): AlignedPoint => ({ t, v, phaseId, original: t });

describe(valueAt.name, () => {
  it('returns the value at a sample time', () => {
    expect(valueAt(GOLDEN, 40)).toBe(80);
  });

  it('interpolates between samples', () => {
    expect(valueAt(GOLDEN, 20)).toBe(50);
    expect(valueAt(GOLDEN, 115)).toBe(55);
  });

  it('returns null outside the profile', () => {
    expect(valueAt(GOLDEN, -1)).toBeNull();
    expect(valueAt(GOLDEN, 131)).toBeNull();
  });

  it('returns null for an empty profile', () => {
    expect(valueAt([], 10)).toBeNull();
  });

  it('copes with two samples at the same time', () => {
    expect(
      valueAt(
        [
          { t: 0, v: 1 },
          { t: 0, v: 2 },
          { t: 10, v: 3 },
        ],
        0
      )
    ).toBe(2);
  });
});

describe(alignTime.name, () => {
  const slowHeat: BatchPhase[] = [
    { id: 'heat', label: 'Heat', start: 0, end: 50 },
    { id: 'react', label: 'React', start: 50, end: 110 },
  ];

  it('stretches a finished phase onto the golden phase', () => {
    expect(alignTime(25, slowHeat, GOLDEN_PHASES)).toBe(20);
    expect(alignTime(0, slowHeat, GOLDEN_PHASES)).toBe(0);
  });

  it('starts the next phase where the golden phase starts', () => {
    expect(alignTime(50, slowHeat, GOLDEN_PHASES)).toBe(40);
    expect(alignTime(80, slowHeat, GOLDEN_PHASES)).toBe(70);
  });

  it('maps the end of the last phase to the end of its golden phase', () => {
    expect(alignTime(110, slowHeat, GOLDEN_PHASES)).toBe(100);
  });

  it('keeps elapsed time as it is in a phase that is still running', () => {
    const running: BatchPhase[] = [slowHeat[0], { id: 'react', label: 'React', start: 50, end: 72, complete: false }];

    expect(alignTime(60, running, GOLDEN_PHASES)).toBe(50);
    expect(alignTime(72, running, GOLDEN_PHASES)).toBe(62);
  });

  it('lets a running phase overrun the golden phase instead of squeezing it', () => {
    const overrun: BatchPhase[] = [{ id: 'heat', label: 'Heat', start: 0, end: 55, complete: false }];

    expect(alignTime(50, overrun, GOLDEN_PHASES)).toBe(50);
  });

  it('returns null outside every phase', () => {
    expect(alignTime(200, slowHeat, GOLDEN_PHASES)).toBeNull();
    expect(alignTime(-5, slowHeat, GOLDEN_PHASES)).toBeNull();
  });

  it('returns null for a phase the golden batch does not have', () => {
    expect(alignTime(5, [{ id: 'rework', label: 'Rework', start: 0, end: 10 }], GOLDEN_PHASES)).toBeNull();
  });

  it('maps a zero-length phase to the start of the golden phase', () => {
    const phases: BatchPhase[] = [
      { id: 'heat', label: 'Heat', start: 0, end: 0 },
      { id: 'react', label: 'React', start: 0, end: 60 },
    ];

    expect(alignTime(30, phases, GOLDEN_PHASES)).toBe(70);
  });
});

describe(alignByPhase.name, () => {
  const phases: BatchPhase[] = [
    { id: 'heat', label: 'Heat', start: 0, end: 50 },
    { id: 'react', label: 'React', start: 50, end: 70, complete: false },
  ];

  it('moves every point onto the golden clock and tags it with its phase', () => {
    const points = alignByPhase(
      [
        { t: 25, v: 48 },
        { t: 60, v: 81 },
      ],
      phases,
      GOLDEN_PHASES
    );

    expect(points).toEqual([
      { t: 20, v: 48, phaseId: 'heat', original: 25 },
      { t: 50, v: 81, phaseId: 'react', original: 60 },
    ]);
  });

  it('drops points that fall outside every phase', () => {
    expect(alignByPhase([{ t: 500, v: 1 }], phases, GOLDEN_PHASES)).toEqual([]);
  });

  it('keeps the points in time order', () => {
    const source = Array.from({ length: 15 }, (_, index) => ({ t: index * 5, v: index }));
    const times = alignByPhase(source, phases, GOLDEN_PHASES).map((point) => point.t);

    expect(times).toEqual([...times].sort((a, b) => a - b));
  });
});

describe(deviationScore.name, () => {
  it('scores a batch that follows the golden profile as fully conforming', () => {
    const score = deviationScore([aligned(50, 80), aligned(60, 80.5), aligned(70, 79.6)], GOLDEN, 2);

    expect(score).toMatchObject({ compared: 3, conformance: 100, excursions: [] });
  });

  it('finds one excursion for a run of points outside the band', () => {
    const score = deviationScore([aligned(50, 80), aligned(60, 84), aligned(70, 86), aligned(80, 83), aligned(90, 80)], GOLDEN, 2);

    expect(score.excursions).toEqual([{ from: 60, to: 80, phaseId: 'react', peak: 6 }]);
    expect(score.conformance).toBe(40);
  });

  it('keeps the sign of the deviation: below the profile is negative', () => {
    const score = deviationScore([aligned(50, 80), aligned(60, 75)], GOLDEN, 2);

    expect(score.maxDeviation).toBe(-5);
    expect(score.excursions[0].peak).toBe(-5);
  });

  it('treats a deviation exactly at the tolerance as inside', () => {
    expect(deviationScore([aligned(60, 82)], GOLDEN, 2).conformance).toBe(100);
  });

  it('separates excursions that have a conforming point between them', () => {
    const score = deviationScore([aligned(50, 85), aligned(60, 80), aligned(70, 85)], GOLDEN, 2);

    expect(score.excursions).toHaveLength(2);
  });

  it('starts a new excursion at a phase boundary', () => {
    const score = deviationScore([aligned(90, 90, 'react'), aligned(105, 90, 'cool')], GOLDEN, 2);

    expect(score.excursions.map((excursion) => excursion.phaseId)).toEqual(['react', 'cool']);
  });

  it('skips points beyond the end of the golden profile', () => {
    const score = deviationScore([aligned(60, 80), aligned(140, 10)], GOLDEN, 2);

    expect(score.compared).toBe(1);
  });

  it('computes the root-mean-square deviation', () => {
    expect(deviationScore([aligned(50, 83), aligned(60, 76)], GOLDEN, 2).rms).toBe(3.54);
  });

  it('returns zeros when nothing can be compared', () => {
    expect(deviationScore([], GOLDEN, 2)).toEqual({ compared: 0, conformance: 0, maxDeviation: 0, rms: 0, excursions: [] });
  });
});

describe(phaseDurations.name, () => {
  it('reports actual against expected and the overrun of finished phases', () => {
    const rows = phaseDurations([{ id: 'heat', label: 'Heat', start: 0, end: 46 }], GOLDEN_PHASES);

    expect(rows[0]).toEqual({ id: 'heat', label: 'Heat', actual: 46, expected: 40, overrun: 6 });
  });

  it('reports a finished phase that was faster as a negative overrun', () => {
    expect(phaseDurations([{ id: 'heat', label: 'Heat', start: 0, end: 36 }], GOLDEN_PHASES)[0].overrun).toBe(-4);
  });

  it('has no overrun for a running phase that is still within its expected time', () => {
    const rows = phaseDurations([{ id: 'heat', label: 'Heat', start: 0, end: 10, complete: false }], GOLDEN_PHASES);

    expect(rows[0]).toMatchObject({ actual: 10, overrun: null });
  });

  it('reports the overrun of a running phase that has passed its expected time', () => {
    expect(phaseDurations([{ id: 'heat', label: 'Heat', start: 0, end: 52, complete: false }], GOLDEN_PHASES)[0].overrun).toBe(12);
  });

  it('marks phases that have not started', () => {
    const rows = phaseDurations([], GOLDEN_PHASES);

    expect(rows.map((row) => row.actual)).toEqual([null, null, null]);
    expect(rows[1].expected).toBe(60);
  });
});
