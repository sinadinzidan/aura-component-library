import { monthCells } from './monthCells';

describe(monthCells.name, () => {
  it('lays March 2026 out in six Monday-first weeks', () => {
    const weeks = monthCells(2026, 2);

    expect(weeks).toHaveLength(6);
    expect(weeks.every((week) => week.length === 7)).toBe(true);
    expect(weeks[0][0]).toEqual({ key: '2026-02-23', day: 23, inMonth: false });
    expect(weeks[0][6]).toEqual({ key: '2026-03-01', day: 1, inMonth: true });
  });

  it('fits a month that starts on the first weekday in four rows', () => {
    const weeks = monthCells(2027, 1);

    expect(weeks).toHaveLength(4);
    expect(weeks[0][0].key).toBe('2027-02-01');
    expect(weeks[3][6].key).toBe('2027-02-28');
  });

  it('pads the end with days of the next month', () => {
    const weeks = monthCells(2026, 2);
    const last = weeks[weeks.length - 1];

    expect(last[1]).toEqual({ key: '2026-03-31', day: 31, inMonth: true });
    expect(last[6]).toEqual({ key: '2026-04-05', day: 5, inMonth: false });
  });

  it('can start weeks on Sunday', () => {
    const weeks = monthCells(2026, 2, 0);

    expect(weeks[0][0]).toEqual({ key: '2026-03-01', day: 1, inMonth: true });
  });

  it('counts leap days', () => {
    const days = monthCells(2028, 1)
      .flat()
      .filter((cell) => cell.inMonth);

    expect(days).toHaveLength(29);
  });
});
