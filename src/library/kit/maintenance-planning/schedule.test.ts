import { canMove, columnHours, firstFreeColumn, laneLoad, loadState, moveOrder, packRows, placeOrder, type PlanOrder } from './schedule';

const ORDERS: PlanOrder[] = [
  { id: 'a', laneId: 'mech', start: 0, span: 2, hours: 16 },
  { id: 'b', laneId: 'mech', start: 1, span: 1, hours: 6 },
  { id: 'c', laneId: 'inst', start: 3, span: 1, hours: 4 },
  { id: 'd', laneId: 'mech', start: null, span: 2, hours: 20 },
];

describe('schedule', () => {
  it('moves an order and keeps it inside the timeline', () => {
    expect(moveOrder(ORDERS, 'c', 1, 5).find((order) => order.id === 'c')?.start).toBe(4);
    expect(moveOrder(ORDERS, 'c', 9, 5).find((order) => order.id === 'c')?.start).toBe(4);
    expect(moveOrder(ORDERS, 'a', -1, 5).find((order) => order.id === 'a')?.start).toBe(0);
  });

  it('leaves backlog orders alone when moving', () => {
    expect(moveOrder(ORDERS, 'd', 1, 5).find((order) => order.id === 'd')?.start).toBeNull();
  });

  it('places an order on the timeline and back in the backlog', () => {
    expect(placeOrder(ORDERS, 'd', 4, 5).find((order) => order.id === 'd')?.start).toBe(3);
    expect(placeOrder(ORDERS, 'a', null, 5).find((order) => order.id === 'a')?.start).toBeNull();
  });

  it('knows when an order has reached an edge', () => {
    expect(canMove(ORDERS[0], -1, 5)).toBe(false);
    expect(canMove(ORDERS[0], 1, 5)).toBe(true);
    expect(canMove(ORDERS[3], 1, 5)).toBe(false);
  });

  it('spreads hours evenly over the span', () => {
    expect(columnHours(ORDERS, 5)).toEqual([8, 14, 0, 4, 0]);
    expect(columnHours(ORDERS, 5, 'inst')).toEqual([0, 0, 0, 4, 0]);
  });

  it('adds up a lane against its capacity', () => {
    expect(laneLoad(ORDERS, 'mech', [8, 8, 8, 8, 8])).toEqual({ planned: 22, capacity: 40 });
  });

  it('names the load', () => {
    expect(loadState({ planned: 10, capacity: 40 })).toBe('free');
    expect(loadState({ planned: 35, capacity: 40 })).toBe('tight');
    expect(loadState({ planned: 41, capacity: 40 })).toBe('over');
  });

  it('finds the first column with room', () => {
    expect(firstFreeColumn(ORDERS, ORDERS[3], [16, 16, 16, 16, 16], 0)).toBe(2);
    expect(firstFreeColumn(ORDERS, ORDERS[3], [2, 2, 2, 2, 2], 1)).toBe(1);
  });

  it('stacks overlapping orders of one lane in separate rows', () => {
    const rows = packRows(ORDERS);
    expect(rows.get('a')).toBe(0);
    expect(rows.get('b')).toBe(1);
    expect(rows.get('c')).toBe(0);
    expect(rows.has('d')).toBe(false);
  });
});
