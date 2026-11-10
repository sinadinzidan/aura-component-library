import { dayLabel, groupByDay } from './groupByDay';

const NOW = Date.UTC(2026, 2, 12, 14, 0, 0);
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

describe(dayLabel.name, () => {
  it('says Today for the same UTC day', () => {
    expect(dayLabel(NOW - 13 * HOUR, NOW)).toBe('Today');
  });

  it('says Yesterday across midnight, however few hours ago', () => {
    expect(dayLabel(NOW - 15 * HOUR, NOW)).toBe('Yesterday');
  });

  it('uses a short date for older days in the same year', () => {
    expect(dayLabel(NOW - 2 * DAY, NOW)).toBe('10 Mar');
  });

  it('adds the year when it differs', () => {
    expect(dayLabel(Date.UTC(2025, 11, 28, 9, 0, 0), NOW)).toBe('28 Dec 2025');
  });
});

describe(groupByDay.name, () => {
  const events = [
    { id: 'a', at: NOW - 1 * HOUR },
    { id: 'b', at: NOW - 5 * HOUR },
    { id: 'c', at: NOW - 20 * HOUR },
    { id: 'd', at: NOW - 3 * DAY },
  ];

  it('groups consecutive items of one day under one label', () => {
    const groups = groupByDay(events, (event) => event.at, NOW);

    expect(groups.map((group) => group.label)).toEqual(['Today', 'Yesterday', '9 Mar']);
    expect(groups[0].items.map((event) => event.id)).toEqual(['a', 'b']);
  });

  it('keeps the order it was given', () => {
    const groups = groupByDay([...events].reverse(), (event) => event.at, NOW);

    expect(groups.map((group) => group.label)).toEqual(['9 Mar', 'Yesterday', 'Today']);
  });

  it('gives each group a date key', () => {
    const groups = groupByDay(events, (event) => event.at, NOW);

    expect(groups.map((group) => group.key)).toEqual(['2026-03-12', '2026-03-11', '2026-03-09']);
  });

  it('starts a new group when a day comes back out of order', () => {
    const mixed = [events[0], events[2], events[1]];

    const groups = groupByDay(mixed, (event) => event.at, NOW);

    expect(groups.map((group) => group.label)).toEqual(['Today', 'Yesterday', 'Today']);
  });

  it('returns no groups for an empty feed', () => {
    expect(groupByDay([], () => 0, NOW)).toEqual([]);
  });
});
