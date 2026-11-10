import { availableStock, coverTone, daysOfCover, fillPercent, reorderQuantity, stockState, stockStatus, ullage } from './inventory';

const LEVELS = { min: 2, reorderPoint: 4, max: 10 };

describe(stockState.name, () => {
  it.each([
    [0, 'stock-out'],
    [1, 'below-min'],
    [2, 'reorder'],
    [4, 'reorder'],
    [5, 'in-range'],
    [10, 'in-range'],
    [11, 'overstock'],
  ] as const)('reads %s on hand as %s', (onHand, state) => {
    expect(stockState({ ...LEVELS, onHand })).toBe(state);
  });
});

describe(stockStatus.name, () => {
  it('keeps stock in range neutral', () => {
    expect(stockStatus({ ...LEVELS, onHand: 6 })).toEqual({ tone: 'neutral', label: 'In range', shape: 'dot' });
  });

  it('warns at the reorder point', () => {
    expect(stockStatus({ ...LEVELS, onHand: 4 })).toMatchObject({ tone: 'warning', label: 'Reorder' });
  });

  it('is critical below the minimum', () => {
    expect(stockStatus({ ...LEVELS, onHand: 1 })).toMatchObject({ tone: 'critical', label: 'Below minimum' });
  });
});

describe(availableStock.name, () => {
  it('subtracts reserved stock', () => {
    expect(availableStock(6, 2)).toBe(4);
  });

  it('never goes negative', () => {
    expect(availableStock(1, 3)).toBe(0);
  });
});

describe(reorderQuantity.name, () => {
  it('orders up to the maximum, counting stock already on order', () => {
    expect(reorderQuantity(3, 2, 10)).toBe(5);
  });

  it('orders nothing when the maximum is already covered', () => {
    expect(reorderQuantity(8, 4, 10)).toBe(0);
  });
});

describe(daysOfCover.name, () => {
  it('divides stock by daily use', () => {
    expect(daysOfCover(1800, 120)).toBe(15);
  });

  it('is null when nothing is used', () => {
    expect(daysOfCover(1800, 0)).toBeNull();
  });

  it('is 0 for negative stock', () => {
    expect(daysOfCover(-5, 10)).toBe(0);
  });
});

describe(coverTone.name, () => {
  it.each([
    [9, 'critical'],
    [10, 'warning'],
    [14.9, 'warning'],
    [15, 'neutral'],
    [40, 'neutral'],
  ] as const)('judges %s days against a 10 day lead time as %s', (days, tone) => {
    expect(coverTone(days, 10)).toBe(tone);
  });

  it('is neutral when there is no consumption', () => {
    expect(coverTone(null, 10)).toBe('neutral');
  });
});

describe(ullage.name, () => {
  it('gives the free volume', () => {
    expect(ullage(5000, 3400)).toBe(1600);
  });

  it('never goes negative', () => {
    expect(ullage(5000, 5100)).toBe(0);
  });
});

describe(fillPercent.name, () => {
  it('gives volume as a share of capacity', () => {
    expect(fillPercent(3400, 5000)).toBe(68);
  });

  it('clamps to 0–100', () => {
    expect(fillPercent(6000, 5000)).toBe(100);
    expect(fillPercent(-1, 5000)).toBe(0);
  });

  it('is 0 without a capacity', () => {
    expect(fillPercent(10, 0)).toBe(0);
  });
});
