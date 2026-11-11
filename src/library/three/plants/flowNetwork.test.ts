import { downstreamEdges, isEdgeOpen, peakFlow, solveNetwork, toggleValve, topologicalOrder, traceStream, upstreamEdges } from './flowNetwork';
import type { FlowNetwork } from './flowNetwork';

/**
 * feed → separator ─ gas ──→ compressor → export
 *                  ├ gas (relief valve) → flare
 *                  └ liquid → pump A / pump B (valves) → storage
 */
const NETWORK: FlowNetwork = {
  nodes: [
    { id: 'feed', label: 'Feed', kind: 'source', supply: 100 },
    { id: 'separator', label: 'Separator', kind: 'unit', yields: { gas: 0.8, liquid: 0.2 } },
    { id: 'compressor', label: 'Compressor', kind: 'unit' },
    { id: 'export', label: 'Export', kind: 'sink' },
    { id: 'flare', label: 'Flare', kind: 'sink' },
    { id: 'storage', label: 'Storage', kind: 'sink' },
  ],
  edges: [
    { id: 'inlet', from: 'feed', to: 'separator', group: 'feed', conductance: 1, valveId: 'esd' },
    { id: 'suction', from: 'separator', to: 'compressor', group: 'gas', conductance: 3, valveId: 'suction-valve' },
    { id: 'relief', from: 'separator', to: 'flare', group: 'gas', conductance: 1, valveId: 'relief-valve' },
    { id: 'discharge', from: 'compressor', to: 'export', group: 'gas', conductance: 1 },
    { id: 'pump-a', from: 'separator', to: 'storage', group: 'liquid', conductance: 1, valveId: 'valve-a' },
    { id: 'pump-b', from: 'separator', to: 'storage', group: 'liquid', conductance: 1, valveId: 'valve-b' },
  ],
};

const NORMAL = ['relief-valve', 'valve-b'];

describe(topologicalOrder.name, () => {
  it('orders nodes so every line points forward', () => {
    const order = topologicalOrder(NETWORK) ?? [];

    for (const edge of NETWORK.edges) expect(order.indexOf(edge.from)).toBeLessThan(order.indexOf(edge.to));
    expect(order).toHaveLength(NETWORK.nodes.length);
  });

  it('returns null for a loop', () => {
    const loop: FlowNetwork = {
      nodes: [
        { id: 'a', label: 'A', kind: 'unit' },
        { id: 'b', label: 'B', kind: 'unit' },
      ],
      edges: [
        { id: 'ab', from: 'a', to: 'b', group: 'x', conductance: 1 },
        { id: 'ba', from: 'b', to: 'a', group: 'x', conductance: 1 },
      ],
    };

    expect(topologicalOrder(loop)).toBeNull();
  });
});

describe(isEdgeOpen.name, () => {
  it('is closed when its valve is closed or it has no conductance', () => {
    expect(isEdgeOpen(NETWORK.edges[1], ['suction-valve'])).toBe(false);
    expect(isEdgeOpen({ ...NETWORK.edges[3], conductance: 0 }, [])).toBe(false);
  });

  it('is open without a valve, or with its valve open', () => {
    expect(isEdgeOpen(NETWORK.edges[3], ['esd'])).toBe(true);
    expect(isEdgeOpen(NETWORK.edges[1], ['relief-valve'])).toBe(true);
  });
});

describe(solveNetwork.name, () => {
  it('splits a separator by its yields in normal operation', () => {
    const solution = solveNetwork(NETWORK, NORMAL);

    expect(solution.flows).toMatchObject({ inlet: 100, suction: 80, relief: 0, discharge: 80, 'pump-a': 20, 'pump-b': 0 });
    expect(solution.delivered).toEqual({ export: 80, flare: 0, storage: 20 });
  });

  it('balances: supplied equals delivered plus held', () => {
    const solution = solveNetwork(NETWORK, NORMAL);

    expect(solution.supplied).toBe(100);
    expect(solution.deliveredTotal).toBe(100);
    expect(solution.heldTotal).toBe(0);
    expect(solution.imbalance).toBeCloseTo(0);
  });

  it('re-splits parallel open lines by conductance', () => {
    const solution = solveNetwork(NETWORK, []);

    expect(solution.flows.suction).toBeCloseTo(60);
    expect(solution.flows.relief).toBeCloseTo(20);
    expect(solution.flows['pump-a']).toBeCloseTo(10);
    expect(solution.flows['pump-b']).toBeCloseTo(10);
  });

  it('sends everything through the remaining line when one closes', () => {
    const solution = solveNetwork(NETWORK, ['suction-valve', 'valve-a']);

    expect(solution.flows).toMatchObject({ suction: 0, relief: 80, discharge: 0, 'pump-a': 0, 'pump-b': 20 });
    expect(solution.delivered).toEqual({ export: 0, flare: 80, storage: 20 });
  });

  it('holds a group back at the unit when it has no open outlet', () => {
    const solution = solveNetwork(NETWORK, ['suction-valve', 'relief-valve', 'valve-b']);

    expect(solution.held).toEqual([{ nodeId: 'separator', group: 'gas', amount: 80 }]);
    expect(solution.deliveredTotal).toBe(20);
    expect(solution.imbalance).toBeCloseTo(0);
  });

  it('starves everything downstream of a closed inlet and holds the feed', () => {
    const solution = solveNetwork(NETWORK, ['esd']);

    expect(Object.values(solution.flows).every((flow) => flow === 0)).toBe(true);
    expect(solution.heldTotal).toBe(100);
    expect(solution.held[0].nodeId).toBe('feed');
  });

  it('stays balanced for every combination of valves', () => {
    const valves = ['esd', 'suction-valve', 'relief-valve', 'valve-a', 'valve-b'];
    for (let mask = 0; mask < 2 ** valves.length; mask += 1) {
      const closed = valves.filter((_, index) => (mask >> index) % 2 === 1);
      const solution = solveNetwork(NETWORK, closed);

      expect(solution.imbalance).toBeCloseTo(0, 9);
      expect(solution.deliveredTotal + solution.heldTotal).toBeCloseTo(100, 9);
    }
  });

  it('adds flows that meet at a node', () => {
    const merge: FlowNetwork = {
      nodes: [
        { id: 'a', label: 'A', kind: 'source', supply: 30 },
        { id: 'b', label: 'B', kind: 'source', supply: 12 },
        { id: 'header', label: 'Header', kind: 'unit' },
        { id: 'out', label: 'Out', kind: 'sink' },
      ],
      edges: [
        { id: 'a-header', from: 'a', to: 'header', group: 'gas', conductance: 1 },
        { id: 'b-header', from: 'b', to: 'header', group: 'gas', conductance: 1 },
        { id: 'header-out', from: 'header', to: 'out', group: 'gas', conductance: 1 },
      ],
    };

    expect(solveNetwork(merge).flows['header-out']).toBe(42);
    expect(solveNetwork(merge).inflow.header).toBe(42);
  });

  it('normalises yields that do not add up to one', () => {
    const network: FlowNetwork = {
      nodes: [{ id: 'feed', label: 'Feed', kind: 'source', supply: 60 }, { ...NETWORK.nodes[1], yields: { gas: 2, liquid: 1 } }, ...NETWORK.nodes.slice(2)],
      edges: NETWORK.edges,
    };

    expect(solveNetwork(network, NORMAL).flows.suction).toBeCloseTo(40);
  });

  it('holds everything at the sources when the network has a loop', () => {
    const loop: FlowNetwork = {
      nodes: [
        { id: 'feed', label: 'Feed', kind: 'source', supply: 10 },
        { id: 'a', label: 'A', kind: 'unit' },
        { id: 'b', label: 'B', kind: 'unit' },
      ],
      edges: [
        { id: 'in', from: 'feed', to: 'a', group: 'x', conductance: 1 },
        { id: 'ab', from: 'a', to: 'b', group: 'x', conductance: 1 },
        { id: 'ba', from: 'b', to: 'a', group: 'x', conductance: 1 },
      ],
    };
    const solution = solveNetwork(loop);

    expect(solution.heldTotal).toBe(10);
    expect(solution.imbalance).toBe(0);
  });
});

describe('graph traversal', () => {
  it('finds every line upstream of a line, nearest first', () => {
    expect(upstreamEdges(NETWORK, 'discharge')).toEqual(['suction', 'inlet']);
  });

  it('finds every line downstream of a line', () => {
    expect(downstreamEdges(NETWORK, 'inlet').sort()).toEqual(['discharge', 'pump-a', 'pump-b', 'relief', 'suction']);
  });

  it('returns nothing for an unknown line', () => {
    expect(upstreamEdges(NETWORK, 'nope')).toEqual([]);
    expect(downstreamEdges(NETWORK, 'nope')).toEqual([]);
  });

  it('skips lines the filter rejects, and everything behind them', () => {
    expect(downstreamEdges(NETWORK, 'inlet', (edge) => edge.id !== 'suction').sort()).toEqual(['pump-a', 'pump-b', 'relief']);
  });
});

describe(traceStream.name, () => {
  it('traces a line to its sources and sinks', () => {
    const trace = traceStream(NETWORK, 'suction');

    expect(trace).toEqual({ upstream: ['inlet'], downstream: ['discharge'], sources: ['feed'], sinks: ['export'] });
  });

  it('follows only lines that carry flow when given a solution', () => {
    const flows = solveNetwork(NETWORK, NORMAL).flows;
    const trace = traceStream(NETWORK, 'inlet', flows);

    expect(trace.downstream.sort()).toEqual(['discharge', 'pump-a', 'suction']);
    expect(trace.sinks.sort()).toEqual(['export', 'storage']);
  });

  it('includes the line own ends when it starts at a source or ends at a sink', () => {
    expect(traceStream(NETWORK, 'inlet').sources).toEqual(['feed']);
    expect(traceStream(NETWORK, 'relief').sinks).toEqual(['flare']);
  });
});

describe(toggleValve.name, () => {
  it('closes an open valve and opens a closed one', () => {
    expect(toggleValve(['a'], 'b')).toEqual(['a', 'b']);
    expect(toggleValve(['a', 'b'], 'a')).toEqual(['b']);
  });
});

describe(peakFlow.name, () => {
  it('is the largest line flow', () => {
    expect(peakFlow(solveNetwork(NETWORK, NORMAL))).toBe(100);
    expect(peakFlow(solveNetwork(NETWORK, ['esd']))).toBe(0);
  });
});
