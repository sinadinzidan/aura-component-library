import { ALARM_RULE_GRAPH, NODE_TEMPLATES, PIPELINE_GRAPH } from './graphFixtures';
import { dropPosition, graphReducer, initGraphState } from './graphReducer';
import type { GraphAction, GraphState } from './graphReducer';

const run = (state: GraphState, ...actions: GraphAction[]): GraphState => actions.reduce(graphReducer, state);
const start = (): GraphState => initGraphState(PIPELINE_GRAPH);
const node = (state: GraphState, id: string) => state.graph.nodes.find((candidate) => candidate.id === id);

describe('graphReducer', () => {
  it('selects one node, extends with shift and toggles off', () => {
    const one = run(start(), { type: 'select', id: 'src' });
    expect(one.selection).toEqual(['src']);
    const two = run(one, { type: 'select', id: 'clean', additive: true });
    expect(two.selection).toEqual(['src', 'clean']);
    expect(two.message).toBe('2 nodes selected');
    expect(run(two, { type: 'select', id: 'src', additive: true }).selection).toEqual(['clean']);
  });

  it('keeps a multi-selection when pressing one of its members to drag', () => {
    const two = run(start(), { type: 'selectMany', ids: ['src', 'clean'] });
    expect(run(two, { type: 'select', id: 'src' }).selection).toEqual(['src', 'clean']);
  });

  it('selects with a marquee, additively or not, and ignores no change', () => {
    const base = run(start(), { type: 'select', id: 'sink' });
    expect(run(base, { type: 'selectMany', ids: ['src'] }).selection).toEqual(['src']);
    expect(run(base, { type: 'selectMany', ids: ['src'], additive: true }).selection).toEqual(['sink', 'src']);
    const same = run(start(), { type: 'selectMany', ids: ['src'] });
    expect(graphReducer(same, { type: 'selectMany', ids: ['src'] })).toBe(same);
  });

  it('selects all and clears', () => {
    const all = run(start(), { type: 'selectAll' });
    expect(all.selection).toHaveLength(6);
    expect(run(all, { type: 'clearSelection' }).selection).toEqual([]);
    const empty = start();
    expect(graphReducer(empty, { type: 'clearSelection' })).toBe(empty);
  });

  it('selects an edge instead of nodes', () => {
    const state = run(start(), { type: 'select', id: 'src' }, { type: 'selectEdge', id: 'e1' });
    expect(state.selectedEdge).toBe('e1');
    expect(state.selection).toEqual([]);
  });

  it('moves the selection live and records one history step per drag', () => {
    const state = run(start(), { type: 'select', id: 'src' }, { type: 'moveStart' }, { type: 'moveSelection', dx: 8, dy: 0 }, { type: 'moveSelection', dx: 8, dy: 16 });
    expect(node(state, 'src')?.x).toBe(56);
    expect(node(state, 'src')?.y).toBe(56);
    expect(state.past).toHaveLength(1);
    expect(run(state, { type: 'undo' }).graph).toBe(PIPELINE_GRAPH);
  });

  it('moves several nodes together from the keyboard as one undo step', () => {
    const state = run(start(), { type: 'selectMany', ids: ['src', 'clean'] }, { type: 'moveSelection', dx: 0, dy: 8, commit: true });
    expect(node(state, 'src')?.y).toBe(48);
    expect(node(state, 'clean')?.y).toBe(48);
    expect(state.message).toBe('Moved 2 nodes');
    expect(state.past).toHaveLength(1);
  });

  it('ignores a move with nothing selected', () => {
    const state = start();
    expect(graphReducer(state, { type: 'moveSelection', dx: 8, dy: 0 })).toBe(state);
  });

  it('connects compatible ports and says so', () => {
    const open = initGraphState({ nodes: PIPELINE_GRAPH.nodes, edges: PIPELINE_GRAPH.edges.filter((edge) => edge.id !== 'e4') });
    const state = run(open, { type: 'connect', from: { node: 'thr', port: 'out' }, to: { node: 'model', port: 'thr' } });
    expect(state.graph.edges).toHaveLength(5);
    expect(state.message).toBe('Connected Threshold to Anomaly model');
    expect(state.error).toBeNull();
  });

  it('refuses an invalid connection with a reason and no history', () => {
    const state = run(start(), { type: 'connect', from: { node: 'src', port: 'out' }, to: { node: 'model', port: 'thr' } });
    expect(state.graph).toBe(PIPELINE_GRAPH);
    expect(state.error).toBe('Time series cannot feed number.');
    expect(state.past).toHaveLength(0);
    expect(run(state, { type: 'clearError' }).error).toBeNull();
  });

  it('adds a node from a template, snapped, and selects it', () => {
    const template = NODE_TEMPLATES[2];
    const state = run(start(), { type: 'addNode', spec: { ...template, x: 203, y: 301 } });
    const added = state.graph.nodes[state.graph.nodes.length - 1];
    expect(added.title).toBe('Resample');
    expect(added.x % 8).toBe(0);
    expect(added.state).toBe('idle');
    expect(state.selection).toEqual([added.id]);
    expect(state.graph.nodes.filter((candidate) => candidate.id === added.id)).toHaveLength(1);
  });

  it('deletes selected nodes with their connections', () => {
    const state = run(start(), { type: 'select', id: 'feat' }, { type: 'deleteSelection' });
    expect(state.graph.nodes.map((candidate) => candidate.id)).not.toContain('feat');
    expect(state.graph.edges.map((edge) => edge.id)).toEqual(['e1', 'e4', 'e5']);
    expect(state.selection).toEqual([]);
    expect(run(state, { type: 'undo' }).graph).toBe(PIPELINE_GRAPH);
  });

  it('deletes a selected connection', () => {
    const state = run(start(), { type: 'selectEdge', id: 'e2' }, { type: 'deleteSelection' });
    expect(state.graph.edges.map((edge) => edge.id)).not.toContain('e2');
    expect(state.graph.nodes).toHaveLength(6);
    const unchanged = start();
    expect(graphReducer(unchanged, { type: 'deleteEdge', id: 'missing' })).toBe(unchanged);
  });

  it('duplicates a selection with the connections between its members', () => {
    const state = run(start(), { type: 'selectMany', ids: ['src', 'clean'] }, { type: 'duplicate' });
    expect(state.graph.nodes).toHaveLength(8);
    expect(state.graph.edges).toHaveLength(6);
    const copies = state.graph.nodes.slice(6);
    expect(copies[0].x).toBe(40 + 24);
    expect(copies[0].state).toBe('idle');
    expect(state.selection).toEqual(copies.map((copy) => copy.id));
    const copyEdge = state.graph.edges[5];
    expect(copies.map((copy) => copy.id)).toContain(copyEdge.from.node);
    expect(copies.map((copy) => copy.id)).toContain(copyEdge.to.node);
    expect(new Set(state.graph.nodes.map((candidate) => candidate.id)).size).toBe(8);
  });

  it('arranges nodes on the grid and can be undone', () => {
    const messy = initGraphState({ ...ALARM_RULE_GRAPH, nodes: ALARM_RULE_GRAPH.nodes.map((candidate, index) => ({ ...candidate, x: index * 3, y: index * 5 })) });
    const state = run(messy, { type: 'autoLayout' });
    expect(node(state, 'gt1')?.x).toBeGreaterThan(200);
    expect(run(state, { type: 'undo' }).graph).toBe(messy.graph);
  });

  it('edits a node without adding history, and records run state', () => {
    const state = run(start(), { type: 'updateNode', id: 'src', patch: { title: 'Read tag' } }, { type: 'setRunState', id: 'src', state: 'failed', error: 'No data' });
    expect(node(state, 'src')?.title).toBe('Read tag');
    expect(node(state, 'src')?.error).toBe('No data');
    expect(state.past).toHaveLength(0);
    expect(node(run(state, { type: 'setRunState', id: 'src', state: 'done' }), 'src')?.error).toBeUndefined();
  });

  it('undoes and redoes, and drops the redo list on a new change', () => {
    const deleted = run(start(), { type: 'select', id: 'sink' }, { type: 'deleteSelection' });
    const undone = run(deleted, { type: 'undo' });
    expect(undone.graph).toBe(PIPELINE_GRAPH);
    expect(undone.message).toBe('Undone');
    expect(run(undone, { type: 'redo' }).graph.nodes).toHaveLength(5);
    const diverged = run(undone, { type: 'select', id: 'src' }, { type: 'deleteSelection' });
    expect(diverged.future).toEqual([]);
  });

  it('does nothing to undo or redo with an empty history', () => {
    const state = start();
    expect(graphReducer(state, { type: 'undo' })).toBe(state);
    expect(graphReducer(state, { type: 'redo' })).toBe(state);
  });

  it('keeps only the last 50 history steps', () => {
    let state = start();
    for (let i = 0; i < 60; i += 1) state = graphReducer(state, { type: 'autoLayout' });
    expect(state.past).toHaveLength(50);
  });

  it('places a new node around the centre of the view, staggered', () => {
    expect(dropPosition({ x: 500, y: 300 }, 0).x).toBe(412);
    expect(dropPosition({ x: 500, y: 300 }, 1).x).toBe(428);
    expect(dropPosition({ x: 500, y: 300 }, 5).x).toBe(412);
  });
});
