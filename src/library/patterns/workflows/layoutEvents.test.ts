import { conflictingIds, formatMinutes, layoutEvents } from './layoutEvents';

const DAY = { start: 8 * 60, end: 16 * 60 };

describe(layoutEvents.name, () => {
  it('gives a lone event the full width', () => {
    const [placement] = layoutEvents([{ id: 'a', start: 9 * 60, end: 10 * 60 }], DAY);

    expect(placement).toEqual({ id: 'a', lane: 0, lanes: 1, top: 0.125, height: 0.125 });
  });

  it('puts two overlapping events side by side', () => {
    const placements = layoutEvents(
      [
        { id: 'a', start: 540, end: 660 },
        { id: 'b', start: 600, end: 720 },
      ],
      DAY
    );

    expect(placements.map(({ id, lane, lanes }) => ({ id, lane, lanes }))).toEqual([
      { id: 'a', lane: 0, lanes: 2 },
      { id: 'b', lane: 1, lanes: 2 },
    ]);
  });

  it('does not treat touching events as overlapping', () => {
    const placements = layoutEvents(
      [
        { id: 'a', start: 540, end: 600 },
        { id: 'b', start: 600, end: 660 },
      ],
      DAY
    );

    expect(placements.every((placement) => placement.lanes === 1)).toBe(true);
  });

  it('reuses a lane once the event in it has ended', () => {
    const placements = layoutEvents(
      [
        { id: 'long', start: 540, end: 780 },
        { id: 'first', start: 560, end: 620 },
        { id: 'second', start: 640, end: 700 },
      ],
      DAY
    );
    const byId = Object.fromEntries(placements.map((placement) => [placement.id, placement]));

    expect(byId.first.lane).toBe(1);
    expect(byId.second.lane).toBe(1);
    expect(byId.long.lanes).toBe(2);
  });

  it('uses three lanes for a triple booking', () => {
    const placements = layoutEvents(
      [
        { id: 'a', start: 540, end: 660 },
        { id: 'b', start: 550, end: 660 },
        { id: 'c', start: 560, end: 660 },
      ],
      DAY
    );

    expect(placements.map((placement) => placement.lane)).toEqual([0, 1, 2]);
    expect(placements.every((placement) => placement.lanes === 3)).toBe(true);
  });

  it('keeps separate groups independent', () => {
    const placements = layoutEvents(
      [
        { id: 'a', start: 540, end: 600 },
        { id: 'b', start: 570, end: 630 },
        { id: 'c', start: 780, end: 840 },
      ],
      DAY
    );

    expect(placements.find((placement) => placement.id === 'c')).toMatchObject({ lane: 0, lanes: 1 });
  });

  it('clips events to the window and drops those outside it', () => {
    const placements = layoutEvents(
      [
        { id: 'early', start: 420, end: 540 },
        { id: 'night', start: 1200, end: 1300 },
      ],
      DAY
    );

    expect(placements).toEqual([{ id: 'early', lane: 0, lanes: 1, top: 0, height: 0.125 }]);
  });

  it('ignores events without a duration and empty windows', () => {
    expect(layoutEvents([{ id: 'a', start: 600, end: 600 }], DAY)).toEqual([]);
    expect(layoutEvents([{ id: 'a', start: 540, end: 600 }], { start: 600, end: 600 })).toEqual([]);
  });

  it('orders by start regardless of input order', () => {
    const placements = layoutEvents(
      [
        { id: 'late', start: 720, end: 780 },
        { id: 'early', start: 540, end: 600 },
      ],
      DAY
    );

    expect(placements.map((placement) => placement.id)).toEqual(['early', 'late']);
  });
});

describe(conflictingIds.name, () => {
  it('lists every event that overlaps another', () => {
    const ids = conflictingIds([
      { id: 'a', start: 540, end: 660 },
      { id: 'b', start: 600, end: 720 },
      { id: 'c', start: 720, end: 780 },
    ]);

    expect(ids).toEqual(['a', 'b']);
  });

  it('is empty when nothing overlaps', () => {
    expect(conflictingIds([{ id: 'a', start: 540, end: 600 }])).toEqual([]);
  });
});

describe(formatMinutes.name, () => {
  it('formats minutes from midnight as a 24-hour time', () => {
    expect(formatMinutes(510)).toBe('08:30');
    expect(formatMinutes(0)).toBe('00:00');
    expect(formatMinutes(22 * 60)).toBe('22:00');
  });
});
