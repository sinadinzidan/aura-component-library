import { describe, expect, it } from 'vitest';

import { linkStatus, reconcile, settledCount, settledPercent } from './reconciliation';

const LINKS = [
  { tag: '23-KA-9101', drawingId: 'S-103', sceneId: 'N-4103' },
  { tag: '23-XV-9171', drawingId: null, sceneId: 'N-4106' },
  { tag: '23-HV-9162', drawingId: 'S-106', sceneId: null },
  { tag: '23-HA-9114', drawingId: 'S-104', sceneId: 'N-4104' },
];

describe('reconciliation', () => {
  it('names the state of a link', () => {
    expect(linkStatus(LINKS[0])).toBe('matched');
    expect(linkStatus(LINKS[1])).toBe('missing-on-drawing');
    expect(linkStatus(LINKS[2])).toBe('missing-in-model');
  });

  it('lists mismatches first, then by tag', () => {
    expect(reconcile(LINKS).map((row) => row.tag)).toEqual(['23-HV-9162', '23-XV-9171', '23-HA-9114', '23-KA-9101']);
  });

  it('counts matched and resolved tags as settled', () => {
    const rows = reconcile(LINKS);
    expect(settledCount(rows, [])).toBe(2);
    expect(settledCount(rows, ['23-HV-9162'])).toBe(3);
    expect(settledPercent(rows, [])).toBe(50);
    expect(settledPercent(rows, ['23-HV-9162', '23-XV-9171'])).toBe(100);
    expect(settledPercent([], [])).toBe(100);
  });
});
