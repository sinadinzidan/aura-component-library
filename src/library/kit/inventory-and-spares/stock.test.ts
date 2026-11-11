import { availableStock, coverVerdict, daysOfCover, fillPercent, reorderQuantity, stockVerdict, tankVerdict, ullage, type StockLevels } from './stock';

const LEVELS: StockLevels = { onHand: 6, reserved: 1, onOrder: 0, min: 2, reorderPoint: 4, max: 10 };

describe('stock', () => {
  it('gives the fill of a tank and the room left', () => {
    expect(fillPercent(3400, 5000)).toBe(68);
    expect(fillPercent(6000, 5000)).toBe(100);
    expect(fillPercent(10, 0)).toBe(0);
    expect(ullage(3400, 5000)).toBe(1600);
    expect(ullage(5200, 5000)).toBe(0);
  });

  it('judges a tank level', () => {
    expect(tankVerdict(68, 15, 85)).toEqual({ tone: 'success', word: 'Normal' });
    expect(tankVerdict(88, 15, 85).word).toBe('High level');
    expect(tankVerdict(8, 15, 85).word).toBe('Low level');
  });

  it('takes reservations off the free stock', () => {
    expect(availableStock(LEVELS)).toBe(5);
    expect(availableStock({ onHand: 1, reserved: 3 })).toBe(0);
  });

  it('judges free stock against minimum, reorder point and maximum', () => {
    expect(stockVerdict(LEVELS).word).toBe('Healthy');
    expect(stockVerdict({ ...LEVELS, onHand: 5 }).word).toBe('Reorder now');
    expect(stockVerdict({ ...LEVELS, onHand: 2 }).word).toBe('Below minimum');
    expect(stockVerdict({ ...LEVELS, onHand: 12 }).word).toBe('Overstocked');
  });

  it('suggests an order up to the maximum, less what is on its way', () => {
    expect(reorderQuantity(LEVELS)).toBe(5);
    expect(reorderQuantity({ ...LEVELS, onOrder: 3 })).toBe(2);
    expect(reorderQuantity({ ...LEVELS, onHand: 14 })).toBe(0);
  });

  it('counts days of cover and judges them against lead time', () => {
    expect(daysOfCover(184, 9.4)).toBe(19);
    expect(daysOfCover(10, 0)).toBe(Number.POSITIVE_INFINITY);
    expect(coverVerdict(5, 10).word).toBe('Runs out before delivery');
    expect(coverVerdict(12, 10).word).toBe('Order now');
    expect(coverVerdict(19, 10).word).toBe('Covered');
  });
});
