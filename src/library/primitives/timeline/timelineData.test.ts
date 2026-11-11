import { formatTimelineDuration, groupTimelineItems, splitTimelineMiddle } from './timelineData';

describe(groupTimelineItems.name, () => {
  it('groups consecutive items with the same key in order', () => {
    const events = [
      { id: 1, day: '12 Mar' },
      { id: 2, day: '12 Mar' },
      { id: 3, day: '11 Mar' },
    ];

    const groups = groupTimelineItems(events, (event) => event.day);

    expect(groups.map((group) => [group.key, group.items.map((item) => item.id)])).toEqual([
      ['12 Mar', [1, 2]],
      ['11 Mar', [3]],
    ]);
  });

  it('does not merge items with the same key that are apart', () => {
    const groups = groupTimelineItems(['a', 'b', 'a'], (item) => item);

    expect(groups.map((group) => group.key)).toEqual(['a', 'b', 'a']);
  });

  it('returns no groups for no items', () => {
    expect(groupTimelineItems([], String)).toEqual([]);
  });
});

describe(splitTimelineMiddle.name, () => {
  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  it('keeps the head and the tail and folds the rest', () => {
    expect(splitTimelineMiddle(items, 1, 1)).toEqual({
      head: [1],
      middle: [2, 3, 4, 5, 6, 7, 8, 9],
      tail: [10],
    });
  });

  it('folds nothing when fewer than two items would be hidden', () => {
    expect(splitTimelineMiddle([1, 2, 3, 4], 2, 1)).toEqual({
      head: [1, 2, 3, 4],
      middle: [],
      tail: [],
    });
  });

  it('can keep only the tail', () => {
    expect(splitTimelineMiddle(items, 0, 2)).toMatchObject({
      head: [],
      tail: [9, 10],
    });
  });

  it('treats negative counts as zero', () => {
    expect(splitTimelineMiddle([1, 2, 3], -1, -1).middle).toEqual([1, 2, 3]);
  });
});

describe(formatTimelineDuration.name, () => {
  it.each([
    [0, '0 s'],
    [45_000, '45 s'],
    [12 * 60_000, '12 min'],
    [59.6 * 60_000, '1 h'],
    [2 * 3_600_000, '2 h'],
    [2 * 3_600_000 + 5 * 60_000, '2 h 5 min'],
    [3 * 86_400_000, '3 d'],
    [3 * 86_400_000 + 4 * 3_600_000, '3 d 4 h'],
    [-500, '0 s'],
  ])('formats %d ms as %s', (milliseconds, expected) => {
    expect(formatTimelineDuration(milliseconds)).toBe(expected);
  });
});
