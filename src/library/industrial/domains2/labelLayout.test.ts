import { spreadPositions } from './labelLayout';

describe(spreadPositions.name, () => {
  it('leaves labels that are far enough apart where they are', () => {
    expect(spreadPositions([10, 40, 80], 6)).toEqual([10, 40, 80]);
  });

  it('pushes close labels down to the minimum gap', () => {
    expect(spreadPositions([70, 72, 75], 6)).toEqual([70, 76, 82]);
  });

  it('keeps the order of the labels', () => {
    const spread = spreadPositions([10, 11, 12, 13, 50], 5);

    expect(spread).toEqual([...spread].sort((a, b) => a - b));
  });

  it('pulls a stack back inside the end of the axis', () => {
    expect(spreadPositions([90, 92, 98], 6)).toEqual([88, 94, 100]);
  });

  it('only moves the labels that have to move when pulling back', () => {
    expect(spreadPositions([10, 95, 98], 6)).toEqual([10, 94, 100]);
  });

  it('never starts before the beginning of the axis', () => {
    expect(spreadPositions([-4, 1], 6)).toEqual([0, 6]);
  });

  it('overflows the end rather than overlapping when the axis is too short', () => {
    expect(spreadPositions([0, 1, 2], 60)).toEqual([0, 60, 120]);
  });

  it('handles no labels', () => {
    expect(spreadPositions([], 6)).toEqual([]);
  });
});
