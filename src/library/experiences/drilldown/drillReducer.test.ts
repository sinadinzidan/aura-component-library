import { fixtureTree } from './drilldownFixture';
import { createDrillReducer, createDrillState, currentNode, drillKeyAction, levelSteps, pathNodes } from './drillReducer';
import type { DrillAction, DrillState } from './drillReducer';

const tree = fixtureTree();
const reduce = createDrillReducer(tree);
const run = (actions: readonly DrillAction[], start: DrillState = createDrillState(tree)): DrillState => actions.reduce(reduce, start);

describe(createDrillState.name, () => {
  it('starts on the root with the keyboard on its first child', () => {
    expect(createDrillState(tree, { lens: 'openAlarms' })).toEqual({
      path: ['site'],
      trail: ['site'],
      focusId: 'area-a',
      hoverId: null,
      lens: 'openAlarms',
    });
  });

  it('can start deep in the tree', () => {
    const state = createDrillState(tree, { startId: 'comp-1' });

    expect(state.path).toEqual(['site', 'area-b', 'comp-1']);
    expect(state.focusId).toBe('pt');
  });
});

describe(createDrillReducer.name, () => {
  it('drills into a child and focuses its first child', () => {
    const state = run([{ type: 'drill', id: 'area-b' }]);

    expect(state.path).toEqual(['site', 'area-b']);
    expect(state.focusId).toBe('comp-1');
    expect(currentNode(tree, state).tag).toBe('NK-23');
  });

  it('ignores a drill into something that is not a child', () => {
    const start = createDrillState(tree);

    expect(reduce(start, { type: 'drill', id: 'comp-1' })).toBe(start);
    expect(reduce(start, { type: 'drill', id: 'nope' })).toBe(start);
  });

  it('goes up one level and keeps the keyboard on where it came from', () => {
    const state = run([{ type: 'drill', id: 'area-b' }, { type: 'drill', id: 'comp-3' }, { type: 'up' }]);

    expect(state.path).toEqual(['site', 'area-b']);
    expect(state.focusId).toBe('comp-3');
  });

  it('stays put when going up from the root', () => {
    const start = createDrillState(tree);

    expect(reduce(start, { type: 'up' })).toBe(start);
  });

  it('reaches the sensor in three drills and has no focus there', () => {
    const state = run([{ type: 'drill', id: 'area-b' }, { type: 'drill', id: 'comp-1' }, { type: 'drill', id: 'tt' }]);

    expect(pathNodes(tree, state).map((node) => node.level)).toEqual(['site', 'area', 'equipment', 'sensor']);
    expect(state.focusId).toBeNull();
  });

  it('remembers the deepest path as a trail when going up', () => {
    const state = run([{ type: 'drill', id: 'area-b' }, { type: 'drill', id: 'comp-1' }, { type: 'up' }, { type: 'up' }]);

    expect(state.path).toEqual(['site']);
    expect(state.trail).toEqual(['site', 'area-b', 'comp-1']);
  });

  it('follows the trail back down by depth', () => {
    const state = run([{ type: 'drill', id: 'area-b' }, { type: 'drill', id: 'comp-1' }, { type: 'reset' }, { type: 'depth', depth: 2 }]);

    expect(state.path).toEqual(['site', 'area-b', 'comp-1']);
  });

  it('ignores a depth beyond the trail', () => {
    const start = run([{ type: 'drill', id: 'area-b' }]);

    expect(reduce(start, { type: 'depth', depth: 3 })).toBe(start);
    expect(reduce(start, { type: 'depth', depth: 1 })).toBe(start);
  });

  it('starts a new trail when drilling into another branch', () => {
    const state = run([{ type: 'drill', id: 'area-b' }, { type: 'drill', id: 'comp-1' }, { type: 'up' }, { type: 'up' }, { type: 'drill', id: 'area-a' }]);

    expect(state.trail).toEqual(['site', 'area-a']);
  });

  it('jumps straight to any node', () => {
    const state = run([{ type: 'jump', id: 'vt' }]);

    expect(state.path).toEqual(['site', 'area-b', 'comp-3', 'vt']);
  });

  it('keeps the keyboard on the branch when jumping to an ancestor', () => {
    const state = run([{ type: 'jump', id: 'vt' }, { type: 'jump', id: 'area-b' }]);

    expect(state.path).toEqual(['site', 'area-b']);
    expect(state.focusId).toBe('comp-3');
  });

  it('ignores a jump to an unknown node or to where it already is', () => {
    const start = run([{ type: 'jump', id: 'comp-1' }]);

    expect(reduce(start, { type: 'jump', id: 'nope' })).toBe(start);
    expect(reduce(start, { type: 'jump', id: 'comp-1' })).toBe(start);
  });

  it('steps the focus through the children and wraps', () => {
    const start = run([{ type: 'drill', id: 'area-b' }]);

    expect(reduce(start, { type: 'focus-step', delta: 1 }).focusId).toBe('comp-3');
    expect(reduce(start, { type: 'focus-step', delta: -1 }).focusId).toBe('comp-3');
    expect(run([{ type: 'focus-step', delta: 1 }, { type: 'focus-step', delta: 1 }], start).focusId).toBe('comp-1');
  });

  it('previews the child the keyboard lands on, like a hover', () => {
    const start = run([{ type: 'drill', id: 'area-b' }]);

    expect(reduce(start, { type: 'focus-step', delta: 1 }).hoverId).toBe('comp-3');
  });

  it('only focuses children of the current node', () => {
    const start = createDrillState(tree);

    expect(reduce(start, { type: 'focus', id: 'area-b' }).focusId).toBe('area-b');
    expect(reduce(start, { type: 'focus', id: 'comp-1' })).toBe(start);
  });

  it('tracks hover and clears it on a move', () => {
    const hovered = run([{ type: 'hover', id: 'comp-1' }]);

    expect(hovered.hoverId).toBe('comp-1');
    expect(reduce(hovered, { type: 'drill', id: 'area-a' }).hoverId).toBeNull();
  });

  it('switches the lens without moving', () => {
    const state = run([{ type: 'drill', id: 'area-b' }, { type: 'lens', lens: 'downtimeHours' }]);

    expect(state.lens).toBe('downtimeHours');
    expect(state.path).toEqual(['site', 'area-b']);
  });

  it('resets to the root and keeps the lens', () => {
    const state = run([{ type: 'lens', lens: 'x' }, { type: 'jump', id: 'vt' }, { type: 'reset' }]);

    expect(state.path).toEqual(['site']);
    expect(state.lens).toBe('x');
  });
});

describe(drillKeyAction.name, () => {
  const deep = { focusId: 'comp-1', path: ['site', 'area-b'] };

  it('maps arrows to focus steps', () => {
    expect(drillKeyAction('ArrowRight', deep)).toEqual({ type: 'focus-step', delta: 1 });
    expect(drillKeyAction('ArrowDown', deep)).toEqual({ type: 'focus-step', delta: 1 });
    expect(drillKeyAction('ArrowLeft', deep)).toEqual({ type: 'focus-step', delta: -1 });
    expect(drillKeyAction('ArrowUp', deep)).toEqual({ type: 'focus-step', delta: -1 });
  });

  it('drills into the focused child on Enter and Space', () => {
    expect(drillKeyAction('Enter', deep)).toEqual({ type: 'drill', id: 'comp-1' });
    expect(drillKeyAction(' ', deep)).toEqual({ type: 'drill', id: 'comp-1' });
    expect(drillKeyAction('Enter', { focusId: null, path: ['site'] })).toBeNull();
  });

  it('goes up on Escape and Backspace, except at the root', () => {
    expect(drillKeyAction('Escape', deep)).toEqual({ type: 'up' });
    expect(drillKeyAction('Backspace', deep)).toEqual({ type: 'up' });
    expect(drillKeyAction('Escape', { focusId: 'area-a', path: ['site'] })).toBeNull();
  });

  it('returns to the top on Home and ignores other keys', () => {
    expect(drillKeyAction('Home', deep)).toEqual({ type: 'reset' });
    expect(drillKeyAction('a', deep)).toBeNull();
  });
});

describe(levelSteps.name, () => {
  it('lists the four levels with the current one marked', () => {
    const steps = levelSteps(tree, run([{ type: 'drill', id: 'area-b' }]));

    expect(steps.map((step) => step.level)).toEqual(['site', 'area', 'equipment', 'sensor']);
    expect(steps.map((step) => step.current)).toEqual([false, true, false, false]);
    expect(steps.map((step) => step.node?.id ?? null)).toEqual(['site', 'area-b', null, null]);
  });

  it('keeps deeper levels reachable along the trail after going up', () => {
    const steps = levelSteps(tree, run([{ type: 'jump', id: 'tt' }, { type: 'depth', depth: 1 }]));

    expect(steps.map((step) => step.reachable)).toEqual([true, true, true, true]);
    expect(steps[3]?.node?.id).toBe('tt');
    expect(steps[1]?.current).toBe(true);
  });
});
