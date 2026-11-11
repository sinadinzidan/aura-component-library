import { diffTagSets, matchRate, modelCheckFindings } from './modelCheck';

const DRAWING = ['23-KA-9101', '23-HA-9114', '23-XV-9120', '23-HV-9162'];
const MODEL = ['23-KA-9101', '23-XV-9120', '23-HA-9114', '23-XV-9171'];

describe(diffTagSets.name, () => {
  it('splits the tags into matched, drawing only and model only', () => {
    expect(diffTagSets(DRAWING, MODEL)).toEqual({
      matched: ['23-HA-9114', '23-KA-9101', '23-XV-9120'],
      drawingOnly: ['23-HV-9162'],
      modelOnly: ['23-XV-9171'],
    });
  });

  it('ignores case and surrounding space', () => {
    expect(diffTagSets([' 23-ka-9101 '], ['23-KA-9101'])).toEqual({ matched: ['23-KA-9101'], drawingOnly: [], modelOnly: [] });
  });

  it('counts duplicates once and drops empty tags', () => {
    const diff = diffTagSets(['23-KA-9101', '23-KA-9101', ''], ['23-XV-9171', '23-XV-9171']);

    expect(diff.drawingOnly).toEqual(['23-KA-9101']);
    expect(diff.modelOnly).toEqual(['23-XV-9171']);
  });

  it('reports everything as one-sided when the other side is empty', () => {
    expect(diffTagSets(DRAWING, []).drawingOnly).toHaveLength(4);
    expect(diffTagSets([], MODEL).modelOnly).toHaveLength(4);
  });

  it('is clean for identical sets in any order', () => {
    const diff = diffTagSets(['b', 'a'], ['a', 'b']);

    expect(diff.drawingOnly).toEqual([]);
    expect(diff.modelOnly).toEqual([]);
    expect(diff.matched).toEqual(['A', 'B']);
  });
});

describe(modelCheckFindings.name, () => {
  it('lists drawing-side findings first, each with what is wrong', () => {
    expect(modelCheckFindings(diffTagSets(DRAWING, MODEL))).toEqual([
      { tag: '23-HV-9162', kind: 'missing-in-model', message: 'On the drawing, not in the 3D model' },
      { tag: '23-XV-9171', kind: 'missing-on-drawing', message: 'In the 3D model, not on the drawing' },
    ]);
  });

  it('is empty when both sides agree', () => {
    expect(modelCheckFindings(diffTagSets(MODEL, MODEL))).toEqual([]);
  });
});

describe(matchRate.name, () => {
  it('is the share of tags on both sides', () => {
    expect(matchRate(diffTagSets(DRAWING, MODEL))).toBeCloseTo(3 / 5, 9);
  });

  it('is complete for an empty comparison', () => {
    expect(matchRate(diffTagSets([], []))).toBe(1);
  });
});
