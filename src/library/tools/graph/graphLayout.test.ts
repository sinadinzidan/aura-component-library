import { ALARM_RULE_GRAPH, MAINTENANCE_GRAPH, PIPELINE_GRAPH } from './graphFixtures';
import { autoLayout, layerNodes } from './graphLayout';
import { NODE_WIDTH, nodeHeight } from './graphModel';

describe('layerNodes', () => {
  it('puts sources in column 0 and every node after its predecessors', () => {
    const layers = layerNodes(PIPELINE_GRAPH);
    expect(layers.get('src')).toBe(0);
    expect(layers.get('thr')).toBe(0);
    expect(layers.get('clean')).toBe(1);
    expect(layers.get('feat')).toBe(2);
    expect(layers.get('model')).toBe(3);
    expect(layers.get('sink')).toBe(4);
  });

  it('uses the longest path when branches have different lengths', () => {
    const layers = layerNodes(MAINTENANCE_GRAPH);
    expect(layers.get('assign')).toBe(3);
    expect(layers.get('notify')).toBe(4);
  });

  it('does not loop forever on a cycle', () => {
    const cyclic = {
      nodes: PIPELINE_GRAPH.nodes.slice(0, 2),
      edges: [
        { id: 'a', from: { node: 'src', port: 'out' }, to: { node: 'clean', port: 'in' } },
        { id: 'b', from: { node: 'clean', port: 'out' }, to: { node: 'src', port: 'in' } },
      ],
    };
    expect(layerNodes(cyclic).size).toBe(2);
  });
});

describe('autoLayout', () => {
  it('lays columns out left to right with a gap', () => {
    const positions = autoLayout(ALARM_RULE_GRAPH, { columnGap: 100, grid: 0 });
    expect(positions.get('t')?.x).toBe(40);
    expect(positions.get('gt1')?.x).toBe(40 + NODE_WIDTH + 100);
    expect(positions.get('notify')?.x).toBe(40 + 4 * (NODE_WIDTH + 100));
  });

  it('stacks nodes in a column without overlap', () => {
    const positions = autoLayout(ALARM_RULE_GRAPH, { rowGap: 32, grid: 0 });
    const first = positions.get('t');
    const second = positions.get('v');
    expect((second?.y ?? 0) - (first?.y ?? 0)).toBe(nodeHeight(ALARM_RULE_GRAPH.nodes[0]) + 32);
  });

  it('orders a column by where its predecessors sit to keep edges short', () => {
    const graph = {
      nodes: [PIPELINE_GRAPH.nodes[4], PIPELINE_GRAPH.nodes[0], PIPELINE_GRAPH.nodes[1], PIPELINE_GRAPH.nodes[3]],
      edges: [
        { id: 'a', from: { node: 'thr', port: 'out' }, to: { node: 'model', port: 'thr' } },
        { id: 'b', from: { node: 'src', port: 'out' }, to: { node: 'clean', port: 'in' } },
      ],
    };
    const positions = autoLayout(graph, { grid: 0 });
    expect((positions.get('model')?.y ?? 0) < (positions.get('clean')?.y ?? 0)).toBe(true);
  });

  it('snaps positions to the grid and keeps every node', () => {
    const positions = autoLayout(PIPELINE_GRAPH, { grid: 8, originX: 41, originY: 43 });
    expect(positions.size).toBe(PIPELINE_GRAPH.nodes.length);
    for (const { x, y } of positions.values()) {
      expect(x % 8).toBe(0);
      expect(y % 8).toBe(0);
    }
  });

  it('is deterministic', () => {
    expect([...autoLayout(PIPELINE_GRAPH)]).toEqual([...autoLayout(PIPELINE_GRAPH)]);
  });
});
