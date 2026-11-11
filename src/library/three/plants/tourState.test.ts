import { initialTourState, tourAtEnd, tourAtStart, tourCameraTarget, tourFlightTarget, tourProgress, tourReducer, tourStopFor } from './tourState';
import type { TourState, TourStop } from './tourState';

const START = initialTourState(5);

const at = (stageIndex: number, overrides: Partial<TourState> = {}): TourState => ({ ...initialTourState(5, stageIndex), ...overrides });

describe(initialTourState.name, () => {
  it('starts on the overview, following the tour, with nothing selected', () => {
    expect(START).toEqual({ stageIndex: -1, stageCount: 5, mode: 'tour', selectedUnitId: null, flights: 0 });
  });

  it('clamps a starting stop into range', () => {
    expect(initialTourState(5, 9).stageIndex).toBe(4);
    expect(initialTourState(5, -4).stageIndex).toBe(-1);
    expect(initialTourState(5, Number.NaN).stageIndex).toBe(-1);
  });
});

describe(tourReducer.name, () => {
  it('steps forward from the overview to the first stop', () => {
    const next = tourReducer(START, { type: 'next' });

    expect(next.stageIndex).toBe(0);
    expect(next.flights).toBe(1);
  });

  it('stays on the last stop when stepping forward', () => {
    const last = at(4);

    expect(tourReducer(last, { type: 'next' })).toBe(last);
  });

  it('steps back from the first stop to the overview and stays there', () => {
    const overview = tourReducer(at(0), { type: 'previous' });

    expect(overview.stageIndex).toBe(-1);
    expect(tourReducer(overview, { type: 'previous' })).toBe(overview);
  });

  it('jumps to a stop and picks a unit there', () => {
    const next = tourReducer(START, { type: 'goTo', stageIndex: 3, unitId: 'tank-a' });

    expect(next).toMatchObject({ stageIndex: 3, selectedUnitId: 'tank-a', mode: 'tour' });
  });

  it('clamps a jump outside the tour', () => {
    expect(tourReducer(START, { type: 'goTo', stageIndex: 12 }).stageIndex).toBe(4);
    expect(tourReducer(START, { type: 'goTo', stageIndex: -7 }).stageIndex).toBe(-1);
  });

  it('clears the picked unit when moving to another stop', () => {
    const picked = at(2, { selectedUnitId: 'mche' });

    expect(tourReducer(picked, { type: 'next' }).selectedUnitId).toBeNull();
    expect(tourReducer(picked, { type: 'previous' }).selectedUnitId).toBeNull();
    expect(tourReducer(picked, { type: 'overview' }).selectedUnitId).toBeNull();
  });

  it('detaches when the user grabs the scene, once', () => {
    const free = tourReducer(at(2), { type: 'detach' });

    expect(free.mode).toBe('free');
    expect(free.flights).toBe(0);
    expect(tourReducer(free, { type: 'detach' })).toBe(free);
  });

  it('resumes on the same stop with a new flight and keeps the picked unit', () => {
    const free = at(2, { mode: 'free', selectedUnitId: 'mche', flights: 3 });
    const resumed = tourReducer(free, { type: 'resume' });

    expect(resumed).toMatchObject({ stageIndex: 2, mode: 'tour', selectedUnitId: 'mche', flights: 4 });
  });

  it('ignores resume while already following', () => {
    const following = at(2);

    expect(tourReducer(following, { type: 'resume' })).toBe(following);
  });

  it('returns to the tour when stepping while free', () => {
    const free = at(1, { mode: 'free' });

    expect(tourReducer(free, { type: 'next' })).toMatchObject({ stageIndex: 2, mode: 'tour' });
  });

  it('flies back to the last stop when stepping forward there while free', () => {
    const free = at(4, { mode: 'free' });

    expect(tourReducer(free, { type: 'next' })).toMatchObject({ stageIndex: 4, mode: 'tour', flights: 1 });
  });

  it('flies back to the overview when stepping back there while free', () => {
    const free = at(-1, { mode: 'free' });

    expect(tourReducer(free, { type: 'previous' })).toMatchObject({ stageIndex: -1, mode: 'tour', flights: 1 });
  });
});

describe('tour position helpers', () => {
  it('knows the two ends', () => {
    expect(tourAtStart(START)).toBe(true);
    expect(tourAtStart(at(0))).toBe(false);
    expect(tourAtEnd(at(4))).toBe(true);
    expect(tourAtEnd(at(3))).toBe(false);
  });

  it('reports progress from the first stop to the last', () => {
    expect(tourProgress(START)).toBe(0);
    expect(tourProgress(at(0))).toBe(0);
    expect(tourProgress(at(2))).toBe(0.5);
    expect(tourProgress(at(4))).toBe(1);
    expect(tourProgress(initialTourState(1, 0))).toBe(0);
  });
});

describe(tourCameraTarget.name, () => {
  const stop: TourStop = { focus: [10, 2, -4], distance: 100, azimuth: 0, elevation: 30 };

  it('looks at the focus from the given distance', () => {
    const target = tourCameraTarget(stop);
    const offset = target.position.map((value, index) => value - stop.focus[index]);

    expect(target.lookAt).toEqual([10, 2, -4]);
    expect(Math.hypot(offset[0], offset[1], offset[2])).toBeCloseTo(100);
  });

  it('stands south of the focus at azimuth 0 and east of it at 90', () => {
    const south = tourCameraTarget(stop);
    const east = tourCameraTarget({ ...stop, azimuth: 90 });

    expect(south.position[0]).toBeCloseTo(10);
    expect(south.position[2]).toBeGreaterThan(-4);
    expect(east.position[0]).toBeGreaterThan(10);
    expect(east.position[2]).toBeCloseTo(-4);
  });

  it('rises with the elevation and never goes below the horizon', () => {
    expect(tourCameraTarget(stop).position[1]).toBeCloseTo(2 + 50);
    expect(tourCameraTarget({ ...stop, elevation: -20 }).position[1]).toBeGreaterThan(2);
  });

  it('stands further back when zoomed out', () => {
    const offset = tourCameraTarget(stop, 1.5).position.map((value, index) => value - stop.focus[index]);

    expect(Math.hypot(offset[0], offset[1], offset[2])).toBeCloseTo(150);
  });

  it('uses a default angle when none is given', () => {
    const target = tourCameraTarget({ focus: [0, 0, 0], distance: 10 });

    expect(target.position.every((value) => value > 0)).toBe(true);
  });
});

describe(tourStopFor.name, () => {
  const stops: TourStop[] = [
    { focus: [0, 0, 0], distance: 10 },
    { focus: [5, 0, 0], distance: 10 },
  ];
  const overview: TourStop = { focus: [2, 0, 0], distance: 50 };

  it('returns the stop of the current stage', () => {
    expect(tourStopFor(initialTourState(2, 1), stops, overview)).toBe(stops[1]);
  });

  it('returns the overview before the first stop', () => {
    expect(tourStopFor(initialTourState(2), stops, overview)).toBe(overview);
  });
});

describe(tourFlightTarget.name, () => {
  const target = tourCameraTarget({ focus: [0, 0, 0], distance: 10 });

  it('gives consecutive flights different targets at the same stop', () => {
    expect(tourFlightTarget(target, 1).position).not.toEqual(tourFlightTarget(target, 2).position);
  });

  it('moves the camera by less than a millimetre and keeps the focus', () => {
    const nudged = tourFlightTarget(target, 1);

    expect(Math.abs(nudged.position[1] - target.position[1])).toBeLessThan(0.001);
    expect(nudged.lookAt).toBe(target.lookAt);
  });
});
