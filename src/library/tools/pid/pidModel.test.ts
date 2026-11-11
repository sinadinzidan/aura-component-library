import { PID_FIXTURE, PID_FIXTURE_ALARMS, PID_FIXTURE_DOCUMENTS } from './pidFixture';
import {
  alarmsFor,
  distanceToRoute,
  distanceToSegment,
  documentsFor,
  equipmentBounds,
  findTag,
  instrumentBounds,
  lineAt,
  nextTag,
  padRect,
  readingState,
  routeBounds,
  searchTags,
  tagAt,
  tagRefs,
  valveBounds,
  valveCentreY,
  worstAlarmByTag,
} from './pidModel';

describe('pidModel', () => {
  it('lists every tag in reading order, left to right', () => {
    expect(tagRefs(PID_FIXTURE).map((ref) => ref.tag)).toEqual(['20-VA-1001', '23-HV-9105', '23-PT-92530', '23-KA-9101', '23-TT-92532']);
  });

  it('gives each tag a kind, bounds and a centre inside the bounds', () => {
    for (const ref of tagRefs(PID_FIXTURE)) {
      expect(ref.centre.x).toBeCloseTo(ref.bounds.x + ref.bounds.width / 2);
      expect(ref.centre.y).toBeCloseTo(ref.bounds.y + ref.bounds.height / 2);
    }
    expect(findTag(PID_FIXTURE, 'hv-9105')?.kind).toBe('valve');
    expect(findTag(PID_FIXTURE, 'nope')).toBeUndefined();
  });

  it('wraps a symbol and its labels in the bounds', () => {
    const equipment = equipmentBounds(PID_FIXTURE.equipment[0]);
    expect(equipment.width).toBeGreaterThan(64);
    expect(equipment.y).toBeLessThan(160 - 32);
    expect(equipment.y + equipment.height).toBeGreaterThan(160 + 32 + 20);

    const valve = valveBounds(PID_FIXTURE.valves[0]);
    expect(valve.y).toBeLessThan(valveCentreY(PID_FIXTURE.valves[0]) - 18);

    const bubble = instrumentBounds(PID_FIXTURE.instruments[0]);
    expect(bubble).toEqual({ x: 336, y: 66, width: 48, height: 48 });
  });

  it('lifts a valve centre so its ports land on the line', () => {
    expect(valveCentreY({ y: 160, size: 40 })).toBe(155);
    expect(valveCentreY({ y: 160 })).toBe(155.5);
  });

  describe('searchTags', () => {
    it('returns nothing for an empty query', () => {
      expect(searchTags(PID_FIXTURE, '  ')).toEqual([]);
    });

    it('ignores case, hyphens and spaces', () => {
      expect(searchTags(PID_FIXTURE, 'pt92530').map((ref) => ref.tag)).toEqual(['23-PT-92530']);
      expect(searchTags(PID_FIXTURE, '23 ka').map((ref) => ref.tag)).toEqual(['23-KA-9101']);
    });

    it('ranks a tag prefix before a tag fragment before a name', () => {
      expect(searchTags(PID_FIXTURE, '23').map((ref) => ref.tag)).toEqual(['23-HV-9105', '23-KA-9101', '23-PT-92530', '23-TT-92532']);
      expect(searchTags(PID_FIXTURE, 'separator').map((ref) => ref.tag)).toEqual(['20-VA-1001']);
    });

    it('honours the limit', () => {
      expect(searchTags(PID_FIXTURE, '2', 2)).toHaveLength(2);
    });
  });

  describe('hit testing', () => {
    it('finds the tag under a point', () => {
      expect(tagAt(PID_FIXTURE, { x: 440, y: 160 })?.id).toBe('ka-9101');
      expect(tagAt(PID_FIXTURE, { x: 360, y: 90 })?.id).toBe('pt-92530');
      expect(tagAt(PID_FIXTURE, { x: 5, y: 5 })).toBeUndefined();
    });

    it('measures the distance to a segment, clamped to its ends', () => {
      expect(distanceToSegment({ x: 5, y: 3 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toBe(3);
      expect(distanceToSegment({ x: 13, y: 4 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toBe(5);
      expect(distanceToSegment({ x: 3, y: 4 }, { x: 0, y: 0 }, { x: 0, y: 0 })).toBe(5);
    });

    it('measures the distance to a route', () => {
      const route = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
      ];
      expect(distanceToRoute({ x: 12, y: 5 }, route)).toBe(2);
      expect(distanceToRoute({ x: 0, y: 0 }, [{ x: 1, y: 1 }])).toBe(Infinity);
    });

    it('finds the nearest line within the tolerance', () => {
      expect(lineAt(PID_FIXTURE, { x: 200, y: 163 })?.id).toBe('l-1004');
      expect(lineAt(PID_FIXTURE, { x: 500, y: 158 })?.id).toBe('l-1005');
      expect(lineAt(PID_FIXTURE, { x: 200, y: 200 })).toBeUndefined();
    });
  });

  it('boxes a route and pads a rectangle', () => {
    const box = routeBounds([
      { x: 10, y: 40 },
      { x: 90, y: 40 },
      { x: 90, y: 5 },
    ]);
    expect(box).toEqual({ x: 10, y: 5, width: 80, height: 35 });
    expect(padRect(box, 5)).toEqual({ x: 5, y: 0, width: 90, height: 45 });
  });

  describe('readingState', () => {
    const limits = { lowLow: 5, low: 10, high: 15, highHigh: 20 };

    it('is neutral inside the limits', () => {
      expect(readingState(12, limits)).toEqual({ tone: 'neutral', label: 'Within limits' });
    });

    it('flags high and low as warnings', () => {
      expect(readingState(16, limits)).toEqual({ tone: 'warning', flag: 'H', label: 'High' });
      expect(readingState(8, limits)).toEqual({ tone: 'warning', flag: 'L', label: 'Low' });
    });

    it('flags trip limits as critical', () => {
      expect(readingState(21, limits)).toEqual({ tone: 'critical', flag: 'HH', label: 'High-high' });
      expect(readingState(4, limits)).toEqual({ tone: 'critical', flag: 'LL', label: 'Low-low' });
    });

    it('reports a missing value as no data', () => {
      expect(readingState(null, limits)).toEqual({ tone: 'neutral', label: 'No data' });
      expect(readingState(Number.NaN, limits).label).toBe('No data');
    });
  });

  it('lists the alarms of a tag, most severe first', () => {
    expect(alarmsFor(PID_FIXTURE_ALARMS, 'ka-9101').map((alarm) => alarm.id)).toEqual(['alm-2', 'alm-3']);
    expect(alarmsFor(PID_FIXTURE_ALARMS, 'va-1001')).toEqual([]);
  });

  it('keeps the worst alarm per tag for the overlay', () => {
    const worst = worstAlarmByTag(PID_FIXTURE_ALARMS);
    expect(worst.get('ka-9101')?.severity).toBe('critical');
    expect(worst.get('tt-92532')?.severity).toBe('high');
    expect(worst.size).toBe(2);
  });

  it('finds the documents linked to a tag', () => {
    expect(documentsFor(PID_FIXTURE_DOCUMENTS, 'ka-9101').map((document) => document.id)).toEqual(['doc-1', 'doc-2']);
    expect(documentsFor(PID_FIXTURE_DOCUMENTS, 'hv-9105')).toEqual([]);
  });

  it('cycles tags in both directions and wraps', () => {
    const refs = tagRefs(PID_FIXTURE);
    expect(nextTag(refs, null)?.id).toBe('va-1001');
    expect(nextTag(refs, null, -1)?.id).toBe('tt-92532');
    expect(nextTag(refs, 'tt-92532')?.id).toBe('va-1001');
    expect(nextTag(refs, 'va-1001', -1)?.id).toBe('tt-92532');
    expect(nextTag([], null)).toBeUndefined();
  });
});
