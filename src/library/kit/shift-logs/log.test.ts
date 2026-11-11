import { LOG_CATEGORIES, categoryStyle, filterLog, groupByShift, initialsOf, isLogCategory, shiftOfHour, type LogItem } from './log';

const ITEMS: LogItem[] = [
  { id: 'a', time: '13:46', category: 'equipment', author: 'Ingrid Haugen', text: 'Recompressor tripped' },
  { id: 'b', time: '13:58', category: 'safety', author: 'Liv Wold', text: 'Area barriered off' },
  { id: 'c', time: '14:10', category: 'operations', author: 'Ingrid Haugen', text: 'Export reduced' },
];

describe('log', () => {
  it('styles every category and recognises category names', () => {
    for (const category of LOG_CATEGORIES) expect(categoryStyle(category).label.length).toBeGreaterThan(0);
    expect(isLogCategory('safety')).toBe(true);
    expect(isLogCategory('weather')).toBe(false);
  });

  it('maps hours to shifts', () => {
    expect([5, 6, 13, 14, 21, 22].map(shiftOfHour)).toEqual(['Night', 'Day', 'Day', 'Evening', 'Evening', 'Night']);
  });

  it('filters by category and by text or author', () => {
    expect(filterLog(ITEMS, ['safety'], '')).toHaveLength(1);
    expect(filterLog(ITEMS, [], 'ingrid')).toHaveLength(2);
    expect(filterLog(ITEMS, ['operations'], 'tripped')).toHaveLength(0);
  });

  it('groups consecutive entries by shift', () => {
    expect(groupByShift(ITEMS).map((group) => [group.shift, group.items.length])).toEqual([
      ['Day', 2],
      ['Evening', 1],
    ]);
  });

  it('makes initials', () => {
    expect(initialsOf('Tomás Barros')).toBe('TB');
    expect(initialsOf('Liv')).toBe('L');
  });
});
