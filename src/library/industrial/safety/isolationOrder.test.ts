import { ISOLATION_STATES, applicationOrder, countIsolationStates, deIsolationOrder, isolationStatus, releaseGate, removalGate } from './isolationOrder';
import type { IsolationState } from './isolationOrder';

const point = (id: string, step: number, state: IsolationState = 'verified') => ({ id, step, state, tag: id.toUpperCase() });

describe(applicationOrder.name, () => {
  it('sorts points by step number', () => {
    const ordered = applicationOrder([point('c', 3), point('a', 1), point('b', 2)]);

    expect(ordered.map((entry) => entry.id)).toEqual(['a', 'b', 'c']);
  });

  it('keeps the given order for points that share a step', () => {
    const ordered = applicationOrder([point('x', 2), point('y', 2), point('a', 1)]);

    expect(ordered.map((entry) => entry.id)).toEqual(['a', 'x', 'y']);
  });

  it('does not change the list it was given', () => {
    const points = [point('b', 2), point('a', 1)];
    applicationOrder(points);

    expect(points.map((entry) => entry.id)).toEqual(['b', 'a']);
  });
});

describe(deIsolationOrder.name, () => {
  it('reverses the order of application', () => {
    const order = deIsolationOrder([point('a', 1), point('b', 2), point('c', 3)]);

    expect(order.map((entry) => entry.id)).toEqual(['c', 'b', 'a']);
  });

  it('numbers the removal steps from 1', () => {
    const order = deIsolationOrder([point('a', 1), point('b', 2), point('c', 3)]);

    expect(order.map((entry) => entry.removeStep)).toEqual([1, 2, 3]);
  });

  it('reverses correctly when the input is not sorted', () => {
    const order = deIsolationOrder([point('b', 2), point('c', 3), point('a', 1)]);

    expect(order.map((entry) => entry.id)).toEqual(['c', 'b', 'a']);
  });

  it('leaves out points that are already removed and renumbers the rest', () => {
    const order = deIsolationOrder([point('a', 1), point('b', 2), point('c', 3, 'removed')]);

    expect(order.map((entry) => [entry.id, entry.removeStep])).toEqual([
      ['b', 1],
      ['a', 2],
    ]);
  });

  it('returns nothing for an empty plan', () => {
    expect(deIsolationOrder([])).toEqual([]);
  });
});

describe(countIsolationStates.name, () => {
  it('counts points per state', () => {
    const counts = countIsolationStates([point('a', 1), point('b', 2, 'applied'), point('c', 3, 'planned'), point('d', 4)]);

    expect(counts).toEqual({ planned: 1, applied: 1, verified: 2, removed: 0 });
  });
});

describe(releaseGate.name, () => {
  it('is ready when every point is verified', () => {
    const gate = releaseGate([point('a', 1), point('b', 2)]);

    expect(gate).toEqual({ ready: true, blockers: [], summary: 'All 2 points verified. The equipment can be released for work.' });
  });

  it('blocks on a point that is applied but not verified, naming it', () => {
    const gate = releaseGate([point('a', 1), point('b', 2, 'applied')]);

    expect(gate.ready).toBe(false);
    expect(gate.blockers).toEqual([{ id: 'b', reason: 'B is applied but not verified by a second person' }]);
    expect(gate.summary).toBe('Release is blocked: 1 of 2 points not verified.');
  });

  it('blocks on planned and removed points', () => {
    const gate = releaseGate([point('a', 1, 'planned'), point('b', 2, 'removed')]);

    expect(gate.blockers.map((blocker) => blocker.reason)).toEqual(['A is not applied', 'B is removed']);
  });

  it('blocks on an extra check that is not done', () => {
    const gate = releaseGate([point('a', 1)], [{ id: 'try', label: 'Try step', done: false }]);

    expect(gate.ready).toBe(false);
    expect(gate.summary).toBe('Release is blocked: 1 check not confirmed.');
    expect(gate.blockers).toEqual([{ id: 'try', reason: 'Try step is not confirmed' }]);
  });

  it('names both kinds of blocker in the summary', () => {
    const gate = releaseGate([point('a', 1, 'applied')], [{ id: 'try', label: 'Try step', done: false }]);

    expect(gate.summary).toBe('Release is blocked: 1 of 1 point not verified and 1 check not confirmed.');
  });

  it('is never ready for an empty plan', () => {
    expect(releaseGate([]).ready).toBe(false);
  });

  it('falls back to the id when a point has no tag', () => {
    expect(releaseGate([{ id: 'p-1', state: 'planned' }]).blockers[0].reason).toBe('p-1 is not applied');
  });
});

describe(removalGate.name, () => {
  it('is ready when no personal lock is on', () => {
    expect(removalGate([{ name: 'Liv Wold', lockOn: false }]).ready).toBe(true);
  });

  it('names everyone whose lock is still on', () => {
    const gate = removalGate([
      { name: 'Tomás Barros', lockOn: true },
      { name: 'Aisha Khan', lockOn: false },
      { name: 'Jonas Nyberg', lockOn: true },
    ]);

    expect(gate).toEqual({ ready: false, summary: '2 personal locks still on: Tomás Barros, Jonas Nyberg.' });
  });
});

describe(isolationStatus.name, () => {
  it('shows only a verified point as success', () => {
    const tones = ISOLATION_STATES.map((state) => isolationStatus(state).tone);

    expect(tones).toEqual(['neutral', 'warning', 'success', 'neutral']);
  });
});
