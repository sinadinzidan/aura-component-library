import { countByStatus, earnedHours, isOverdue, priorityMeaning, sortByPriority, workOrderStatusLabel, workOrderTypeLabel } from './workOrders';

describe('workOrders', () => {
  it('is overdue when the due date has passed and the work is not done', () => {
    expect(isOverdue({ dueAt: 90, status: 'open' }, 100)).toBe(true);
  });

  it('is never overdue once done or while the due date is ahead', () => {
    expect(isOverdue({ dueAt: 90, status: 'done' }, 100)).toBe(false);
    expect(isOverdue({ dueAt: 110, status: 'planned' }, 100)).toBe(false);
  });

  it('sorts P1 first and the earliest due date first within a priority', () => {
    const sorted = sortByPriority([
      { id: 'c', priority: 'P3', dueAt: 1 },
      { id: 'b', priority: 'P1', dueAt: 9 },
      { id: 'a', priority: 'P1', dueAt: 2 },
    ] as const);

    expect(sorted.map((order) => order.id)).toEqual(['a', 'b', 'c']);
  });

  it('counts every status, including the empty ones', () => {
    expect(countByStatus([{ status: 'open' }, { status: 'open' }, { status: 'done' }])).toEqual({
      open: 2,
      planned: 0,
      'in-progress': 0,
      waiting: 0,
      done: 1,
    });
  });

  it('derives earned hours from estimate and progress', () => {
    expect(earnedHours({ estimatedHours: 8, progress: 35 })).toBeCloseTo(2.8);
    expect(earnedHours({ estimatedHours: 8, progress: 140 })).toBe(8);
  });

  it('labels priorities, statuses and types in words', () => {
    expect(priorityMeaning('P1')).toBe('Immediate');
    expect(workOrderStatusLabel('in-progress')).toBe('In progress');
    expect(workOrderTypeLabel('preventive')).toBe('Preventive');
  });
});
