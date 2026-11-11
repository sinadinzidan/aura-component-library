import { explorerReducer, initialExplorerState, specOf } from './explorerReducer';
import type { ExplorerAction, ExplorerState } from './explorerReducer';

function start(): ExplorerState {
  return initialExplorerState({ rows: ['area', 'type'], column: 'month', measure: 'downtime', aggregation: 'sum' });
}

function run(state: ExplorerState, ...actions: ExplorerAction[]): ExplorerState {
  return actions.reduce(explorerReducer, state);
}

describe('initialExplorerState', () => {
  it('keeps at most two row fields', () => {
    expect(initialExplorerState({ rows: ['a', 'b', 'c'], column: null, measure: 'm', aggregation: 'count' }).rows).toEqual(['a', 'b']);
  });
});

describe('explorerReducer', () => {
  it('sets a row field at a level', () => {
    expect(run(start(), { type: 'setRow', level: 1, field: 'priority' }).rows).toEqual(['area', 'priority']);
  });

  it('adds a second row field when there is only one', () => {
    const one = run(start(), { type: 'setRow', level: 1, field: null });
    expect(one.rows).toEqual(['area']);
    expect(run(one, { type: 'setRow', level: 1, field: 'crew' }).rows).toEqual(['area', 'crew']);
  });

  it('promotes the inner field when the outer one is removed', () => {
    expect(run(start(), { type: 'setRow', level: 0, field: null }).rows).toEqual(['type']);
  });

  it('does not repeat a field on both row levels', () => {
    expect(run(start(), { type: 'setRow', level: 1, field: 'area' }).rows).toEqual(['area']);
  });

  it('moves a field from the column to the rows', () => {
    const state = run(start(), { type: 'setRow', level: 0, field: 'month' });
    expect(state.rows[0]).toBe('month');
    expect(state.column).toBeNull();
  });

  it('moves a field from the rows to the column', () => {
    const state = run(start(), { type: 'setColumn', field: 'type' });
    expect(state.column).toBe('type');
    expect(state.rows).toEqual(['area']);
  });

  it('clears the column', () => {
    expect(run(start(), { type: 'setColumn', field: null }).column).toBeNull();
  });

  it('sets the measure and the aggregation and closes a drill', () => {
    const drilled = run(start(), { type: 'drill', selection: { groupId: 'a', columnKey: 'Jan' } });
    const state = run(drilled, { type: 'setMeasure', field: 'hours' }, { type: 'setAggregation', aggregation: 'average' });
    expect(state).toMatchObject({ measure: 'hours', aggregation: 'average', drill: null });
  });

  it('toggles heat without touching the rest', () => {
    const drilled = run(start(), { type: 'drill', selection: { groupId: 'a', columnKey: null } });
    expect(run(drilled, { type: 'setHeat', heat: true })).toMatchObject({ heat: true, drill: { groupId: 'a', columnKey: null } });
  });

  it('collapses and expands groups', () => {
    const closed = run(start(), { type: 'toggleGroup', id: 'Compression' }, { type: 'toggleGroup', id: 'Export' });
    expect(closed.collapsed).toEqual(['Compression', 'Export']);
    expect(run(closed, { type: 'toggleGroup', id: 'Compression' }).collapsed).toEqual(['Export']);
    expect(run(closed, { type: 'expandAll' }).collapsed).toEqual([]);
    expect(run(start(), { type: 'collapseAll', ids: ['a', 'b'] }).collapsed).toEqual(['a', 'b']);
  });

  it('forgets collapsed groups and the drill when the layout changes', () => {
    const state = run(start(), { type: 'toggleGroup', id: 'Compression' }, { type: 'drill', selection: { groupId: null, columnKey: null } }, { type: 'setColumn', field: null });
    expect(state.collapsed).toEqual([]);
    expect(state.drill).toBeNull();
  });

  it('opens and closes a drill', () => {
    const open = run(start(), { type: 'drill', selection: { groupId: 'Export', columnKey: 'Feb' } });
    expect(open.drill).toEqual({ groupId: 'Export', columnKey: 'Feb' });
    expect(run(open, { type: 'closeDrill' }).drill).toBeNull();
  });
});

describe('specOf', () => {
  it('builds the pivot spec', () => {
    expect(specOf(start(), { month: ['Jan'] })).toEqual({ rows: ['area', 'type'], column: 'month', measure: 'downtime', aggregation: 'sum', order: { month: ['Jan'] } });
  });
});
