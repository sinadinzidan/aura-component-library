import { canGoBack, createNavState, currentEntry, navReducer, previousEntry, stackOf } from './navStack';
import type { NavAction, NavRoots, NavState } from './navStack';

const ROOTS: NavRoots = {
  alarms: { screen: 'alarm-list', title: 'Alarms' },
  work: { screen: 'order-list', title: 'Work orders' },
  assets: { screen: 'asset-list', title: 'Assets' },
};

function start(tab = 'work'): NavState {
  return createNavState(ROOTS, tab);
}

function run(state: NavState, ...actions: NavAction[]): NavState {
  return actions.reduce((current, action) => navReducer(current, action, ROOTS), state);
}

describe('createNavState', () => {
  it('gives every tab a stack with its root screen and a unique id', () => {
    const state = start();
    expect(Object.keys(state.stacks)).toEqual(['alarms', 'work', 'assets']);
    expect(currentEntry(state)).toMatchObject({ screen: 'order-list', title: 'Work orders' });
    const ids = Object.values(state.stacks).map((stack) => stack[0].id);
    expect(new Set(ids).size).toBe(3);
    expect(state.direction).toBe('none');
  });

  it('cannot go back from a root', () => {
    expect(canGoBack(start())).toBe(false);
    expect(previousEntry(start())).toBeUndefined();
  });
});

describe('push and pop', () => {
  it('pushes a screen on the active tab and points forward', () => {
    const state = run(start(), { type: 'push', screen: 'order', title: 'WO-104482', params: { id: 'WO-104482' } });
    expect(currentEntry(state)).toMatchObject({ screen: 'order', title: 'WO-104482', params: { id: 'WO-104482' } });
    expect(state.direction).toBe('push');
    expect(canGoBack(state)).toBe(true);
    expect(previousEntry(state)?.title).toBe('Work orders');
  });

  it('can push the same screen twice with different ids', () => {
    const state = run(start(), { type: 'push', screen: 'order', title: 'A' }, { type: 'push', screen: 'order', title: 'B' });
    const ids = stackOf(state).map((entry) => entry.id);
    expect(new Set(ids).size).toBe(3);
  });

  it('pops back one screen and points backward', () => {
    const state = run(start(), { type: 'push', screen: 'order', title: 'A' }, { type: 'push', screen: 'asset', title: 'B' }, { type: 'pop' });
    expect(currentEntry(state)?.title).toBe('A');
    expect(state.direction).toBe('pop');
  });

  it('does not pop the root', () => {
    const state = start();
    expect(run(state, { type: 'pop' })).toBe(state);
  });

  it('pops to the root', () => {
    const state = run(start(), { type: 'push', screen: 'order', title: 'A' }, { type: 'push', screen: 'asset', title: 'B' }, { type: 'popToRoot' });
    expect(stackOf(state)).toHaveLength(1);
    expect(state.direction).toBe('pop');
    expect(run(state, { type: 'popToRoot' })).toBe(state);
  });
});

describe('tabs', () => {
  it('switches tab and keeps the other stacks', () => {
    const state = run(start(), { type: 'push', screen: 'order', title: 'A' }, { type: 'selectTab', tab: 'assets' });
    expect(state.activeTab).toBe('assets');
    expect(state.direction).toBe('switch');
    expect(stackOf(run(state, { type: 'selectTab', tab: 'work' }))).toHaveLength(2);
  });

  it('returns to the first screen when the active tab is selected again', () => {
    const state = run(start(), { type: 'push', screen: 'order', title: 'A' }, { type: 'selectTab', tab: 'work' });
    expect(stackOf(state)).toHaveLength(1);
    expect(state.direction).toBe('pop');
  });

  it('ignores the active tab when it is already at its root, and unknown tabs', () => {
    const state = start();
    expect(run(state, { type: 'selectTab', tab: 'work' })).toBe(state);
    expect(run(state, { type: 'selectTab', tab: 'nope' })).toBe(state);
  });
});

describe('reset', () => {
  it('starts over from the roots', () => {
    const state = run(start(), { type: 'push', screen: 'order', title: 'A' }, { type: 'reset' });
    expect(stackOf(state)).toHaveLength(1);
    expect(state.activeTab).toBe('work');
  });

  it('can start on another tab', () => {
    expect(run(start(), { type: 'reset', tab: 'alarms' }).activeTab).toBe('alarms');
  });

  it('does nothing without roots', () => {
    const state = start();
    expect(navReducer(state, { type: 'reset' })).toBe(state);
  });
});
