import { countCautions, sortCautions } from './cautions';
import type { CautionItem } from './cautions';

const ITEMS: readonly CautionItem[] = [
  { id: 'a', level: 'advisory', message: 'Standby test overdue', source: '27-PA-2001B', raisedAt: 50, time: '09:00' },
  { id: 'b', level: 'caution', message: 'Temperature high', source: '23-TT-92532', raisedAt: 10, time: '13:22' },
  { id: 'c', level: 'warning', message: 'Recompressor tripped', source: '23-KA-9103', raisedAt: 5, time: '13:46' },
  { id: 'd', level: 'caution', message: 'Vibration rising', source: '23-VT-92540', raisedAt: 30, time: '12:00' },
];

describe('sortCautions', () => {
  it('puts warnings before cautions before advisories', () => {
    expect(sortCautions(ITEMS).map((item) => item.level)).toEqual(['warning', 'caution', 'caution', 'advisory']);
  });

  it('puts the newest first within a level', () => {
    expect(sortCautions(ITEMS).map((item) => item.id)).toEqual(['c', 'd', 'b', 'a']);
  });

  it('does not change its input', () => {
    sortCautions(ITEMS);

    expect(ITEMS[0].id).toBe('a');
  });
});

describe('countCautions', () => {
  it('counts messages per level', () => {
    expect(countCautions(ITEMS)).toEqual({ warning: 1, caution: 2, advisory: 1 });
  });

  it('counts nothing for an empty list', () => {
    expect(countCautions([])).toEqual({ warning: 0, caution: 0, advisory: 0 });
  });
});
