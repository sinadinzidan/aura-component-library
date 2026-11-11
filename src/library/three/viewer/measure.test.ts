import { INITIAL_MEASURE, distanceBetween, formatLength, measureHint, measureReducer, measurementOf } from './measure';

describe('measureReducer', () => {
  it('collects up to two points', () => {
    let state = measureReducer(INITIAL_MEASURE, { type: 'pick', point: [0, 0, 0] });
    state = measureReducer(state, { type: 'pick', point: [3, 4, 0] });
    expect(state.points).toHaveLength(2);
  });

  it('starts over from the third pick', () => {
    let state = measureReducer(INITIAL_MEASURE, { type: 'pick', point: [0, 0, 0] });
    state = measureReducer(state, { type: 'pick', point: [1, 0, 0] });
    state = measureReducer(state, { type: 'pick', point: [5, 5, 5] });
    expect(state.points).toEqual([[5, 5, 5]]);
  });

  it('undoes the last point and clears', () => {
    const two = { points: [[0, 0, 0], [1, 1, 1]] as const };
    expect(measureReducer(two, { type: 'undo' }).points).toHaveLength(1);
    expect(measureReducer(INITIAL_MEASURE, { type: 'undo' }).points).toHaveLength(0);
    expect(measureReducer(two, { type: 'clear' })).toEqual(INITIAL_MEASURE);
    expect(measureReducer(INITIAL_MEASURE, { type: 'clear' })).toBe(INITIAL_MEASURE);
  });
});

describe('measurementOf', () => {
  it('is null until two points are picked', () => {
    expect(measurementOf({ points: [[0, 0, 0]] })).toBeNull();
  });

  it('gives distance, components, horizontal run and midpoint', () => {
    const measurement = measurementOf({ points: [[0, 0, 0], [3, 4, 12]] });
    expect(measurement?.distance).toBeCloseTo(13);
    expect(measurement).toMatchObject({ dx: 3, dy: 4, dz: 12, midpoint: [1.5, 2, 6] });
    expect(measurement?.horizontal).toBeCloseTo(Math.hypot(3, 12));
  });

  it('uses absolute differences whichever way the points were picked', () => {
    expect(measurementOf({ points: [[3, 4, 0], [0, 0, 0]] })).toMatchObject({ dx: 3, dy: 4 });
  });

  it('measures a 3-4-5 distance', () => {
    expect(distanceBetween([0, 0, 0], [3, 4, 0])).toBe(5);
  });
});

describe('formatting and hints', () => {
  it('formats metres and millimetres', () => {
    expect(formatLength(4.8231)).toBe('4.82 m');
    expect(formatLength(12)).toBe('12.00 m');
    expect(formatLength(0.64)).toBe('640 mm');
  });

  it('says what to do next', () => {
    expect(measureHint(INITIAL_MEASURE)).toBe('Pick the first point on the model.');
    expect(measureHint({ points: [[0, 0, 0]] })).toBe('Pick the second point.');
    expect(measureHint({ points: [[0, 0, 0], [3, 4, 0]] })).toBe('Distance 5.00 m.');
  });
});
