import { ALARM_RULE_GRAPH, PIPELINE_GRAPH } from './graphFixtures';
import {
  NODE_WIDTH,
  checkConnection,
  edgePath,
  graphBounds,
  nodeHeight,
  nodeRect,
  nodesInRect,
  portAt,
  portPosition,
  rectFromPoints,
  rectsIntersect,
  snap,
  typesCompatible,
  wouldCreateCycle,
} from './graphModel';

describe('graphModel', () => {
  it('grows a node with its longer side', () => {
    expect(nodeHeight({ inputs: [], outputs: [] })).toBe(nodeHeight({ inputs: [{ id: 'a', label: 'A', type: 'any' }], outputs: [] }));
    const two = { inputs: [{ id: 'a', label: 'A', type: 'any' as const }, { id: 'b', label: 'B', type: 'any' as const }], outputs: [] };
    expect(nodeHeight(two)).toBe(nodeHeight({ inputs: [], outputs: [] }) + 24);
  });

  it('places inputs on the left edge and outputs on the right', () => {
    const node = PIPELINE_GRAPH.nodes[3];
    const input = portPosition(node, 'input', 'in');
    const second = portPosition(node, 'input', 'thr');
    const output = portPosition(node, 'output', 'out');
    expect(input?.x).toBe(node.x);
    expect(output?.x).toBe(node.x + NODE_WIDTH);
    expect((second?.y ?? 0) - (input?.y ?? 0)).toBe(24);
    expect(portPosition(node, 'input', 'missing')).toBeNull();
  });

  it('treats any as compatible with every type', () => {
    expect(typesCompatible('number', 'number')).toBe(true);
    expect(typesCompatible('any', 'table')).toBe(true);
    expect(typesCompatible('text', 'any')).toBe(true);
    expect(typesCompatible('number', 'text')).toBe(false);
  });

  describe('checkConnection', () => {
    it('accepts a matching free input', () => {
      expect(checkConnection(PIPELINE_GRAPH, { node: 'thr', port: 'out' }, { node: 'sink', port: 'in' })).toEqual({ ok: false, reason: 'Number cannot feed table.' });
      const free = { nodes: PIPELINE_GRAPH.nodes, edges: PIPELINE_GRAPH.edges.filter((edge) => edge.id !== 'e4') };
      expect(checkConnection(free, { node: 'thr', port: 'out' }, { node: 'model', port: 'thr' })).toEqual({ ok: true });
    });

    it('refuses a type mismatch with a reason', () => {
      const result = checkConnection(PIPELINE_GRAPH, { node: 'src', port: 'out' }, { node: 'model', port: 'thr' });
      expect(result).toEqual({ ok: false, reason: 'Time series cannot feed number.' });
    });

    it('refuses an input that is already connected', () => {
      const result = checkConnection(PIPELINE_GRAPH, { node: 'src', port: 'out' }, { node: 'clean', port: 'in' });
      expect(result.ok).toBe(false);
      expect(result.ok === false && result.reason).toContain('already has a connection');
    });

    it('refuses a connection to the same node and a loop', () => {
      expect(checkConnection(ALARM_RULE_GRAPH, { node: 'and', port: 'out' }, { node: 'and', port: 'a' })).toEqual({ ok: false, reason: 'A node cannot connect to itself.' });
      const open = { nodes: ALARM_RULE_GRAPH.nodes, edges: ALARM_RULE_GRAPH.edges.filter((edge) => edge.id !== 'e3') };
      expect(checkConnection(open, { node: 'hold', port: 'out' }, { node: 'and', port: 'a' })).toEqual({ ok: false, reason: 'That would create a loop.' });
    });

    it('refuses unknown ports', () => {
      expect(checkConnection(PIPELINE_GRAPH, { node: 'nope', port: 'out' }, { node: 'sink', port: 'in' }).ok).toBe(false);
    });
  });

  it('finds cycles through a chain', () => {
    expect(wouldCreateCycle(PIPELINE_GRAPH, 'sink', 'src')).toBe(true);
    expect(wouldCreateCycle(PIPELINE_GRAPH, 'src', 'sink')).toBe(false);
  });

  it('draws a cubic path that starts and ends on the ports', () => {
    const path = edgePath({ x: 0, y: 0 }, { x: 200, y: 100 });
    expect(path.startsWith('M 0 0 C')).toBe(true);
    expect(path.endsWith('200 100')).toBe(true);
  });

  it('bows a backwards edge out at least 40 units', () => {
    expect(edgePath({ x: 100, y: 0 }, { x: 100, y: 0 })).toBe('M 100 0 C 140 0, 60 0, 100 0');
  });

  it('snaps to a grid and leaves a zero grid alone', () => {
    expect(snap(13, 8)).toBe(16);
    expect(snap(11, 8)).toBe(8);
    expect(snap(13.4, 0)).toBe(13.4);
  });

  it('builds a rectangle whichever way the marquee is dragged', () => {
    expect(rectFromPoints({ x: 50, y: 40 }, { x: 10, y: 80 })).toEqual({ x: 10, y: 40, width: 40, height: 40 });
  });

  it('tests rectangles for overlap, not touching', () => {
    expect(rectsIntersect({ x: 0, y: 0, width: 10, height: 10 }, { x: 9, y: 9, width: 5, height: 5 })).toBe(true);
    expect(rectsIntersect({ x: 0, y: 0, width: 10, height: 10 }, { x: 10, y: 0, width: 5, height: 5 })).toBe(false);
  });

  it('selects the nodes a marquee touches', () => {
    const box = { x: 0, y: 0, width: 300, height: 100 };
    expect(nodesInRect(PIPELINE_GRAPH, box).sort()).toEqual(['clean', 'src']);
  });

  it('bounds a set of nodes and has a default for none', () => {
    const rect = nodeRect(PIPELINE_GRAPH.nodes[0]);
    expect(graphBounds([PIPELINE_GRAPH.nodes[0]])).toEqual(rect);
    expect(graphBounds([])).toEqual({ x: 0, y: 0, width: 400, height: 300 });
    expect(graphBounds(PIPELINE_GRAPH.nodes).width).toBeGreaterThan(1000);
  });

  it('finds the nearest port within reach', () => {
    const node = PIPELINE_GRAPH.nodes[1];
    const position = portPosition(node, 'input', 'in');
    expect(portAt(PIPELINE_GRAPH, { x: (position?.x ?? 0) + 3, y: (position?.y ?? 0) - 2 }, 'input')).toEqual({ node: 'clean', port: 'in' });
    expect(portAt(PIPELINE_GRAPH, { x: (position?.x ?? 0) + 3, y: position?.y ?? 0 }, 'output')).toBeNull();
    expect(portAt(PIPELINE_GRAPH, { x: -500, y: -500 }, 'input')).toBeNull();
  });
});
