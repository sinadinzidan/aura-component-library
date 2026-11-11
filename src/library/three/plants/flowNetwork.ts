/**
 * A small steady-state model of a process network: nodes joined by directed lines, sources that
 * supply mass, sinks that take it, and valves that close lines. It is not a hydraulic simulator —
 * it answers "where does the flow go when this valve closes" well enough for a what-if screen,
 * and it always balances: supplied = delivered + held back.
 */
export type FlowNode = {
  id: string;
  label: string;
  kind: 'source' | 'sink' | 'unit';
  /** Mass a source feeds in, in the network's flow unit. */
  supply?: number;
  /**
   * How a unit splits what arrives between its outlet groups, e.g. a separator:
   * `{ gas: 0.8, condensate: 0.14, water: 0.06 }`. Shares are normalised. Without it, all
   * outgoing lines form one group.
   */
  yields?: Readonly<Record<string, number>>;
};

export type FlowEdge = {
  id: string;
  from: string;
  to: string;
  /** Outlet group at the `from` node. Lines in one group share that group's flow by conductance. */
  group: string;
  /** Relative ease of flow. Parallel open lines split in proportion to it. */
  conductance: number;
  /** The valve that can close this line. */
  valveId?: string;
};

export type FlowNetwork = { nodes: readonly FlowNode[]; edges: readonly FlowEdge[] };

/** Flow that reached a unit but has no open outlet for its group. */
export type HeldFlow = { nodeId: string; group: string; amount: number };

export type FlowSolution = {
  /** Flow on every line, 0 for blocked or starved lines. */
  flows: Readonly<Record<string, number>>;
  /** Total arriving at every node, supply included. */
  inflow: Readonly<Record<string, number>>;
  /** What each sink receives. */
  delivered: Readonly<Record<string, number>>;
  held: readonly HeldFlow[];
  supplied: number;
  deliveredTotal: number;
  heldTotal: number;
  /** supplied − delivered − held. Zero within rounding for a valid network. */
  imbalance: number;
};

const SINGLE_GROUP = '*';

/** Node ids with every line pointing forward; `null` when the network has a loop. */
export function topologicalOrder(network: FlowNetwork): string[] | null {
  const pending = new Map<string, number>(network.nodes.map((node) => [node.id, 0]));
  for (const edge of network.edges) {
    if (pending.has(edge.to) && pending.has(edge.from)) pending.set(edge.to, (pending.get(edge.to) ?? 0) + 1);
  }
  const ready = network.nodes.filter((node) => pending.get(node.id) === 0).map((node) => node.id);
  const order: string[] = [];
  while (ready.length > 0) {
    const id = ready.shift();
    if (id === undefined) break;
    order.push(id);
    for (const edge of network.edges) {
      if (edge.from !== id || !pending.has(edge.to)) continue;
      const left = (pending.get(edge.to) ?? 0) - 1;
      pending.set(edge.to, left);
      if (left === 0) ready.push(edge.to);
    }
  }
  return order.length === network.nodes.length ? order : null;
}

/** Whether a line can carry flow given the closed valves. */
export function isEdgeOpen(edge: FlowEdge, closedValves: readonly string[]): boolean {
  return edge.conductance > 0 && (edge.valveId === undefined || !closedValves.includes(edge.valveId));
}

function outletGroups(node: FlowNode): { group: string; share: number }[] {
  if (!node.yields) return [{ group: SINGLE_GROUP, share: 1 }];
  const entries = Object.entries(node.yields).filter(([, share]) => share > 0);
  const total = entries.reduce((sum, [, share]) => sum + share, 0);
  if (total <= 0) return [{ group: SINGLE_GROUP, share: 1 }];
  // A yield without any line of that group still takes its share: it is held back at the unit.
  return entries.map(([group, share]) => ({ group, share: share / total }));
}

/**
 * Solves the network for a set of closed valves. Each node passes on what it receives: split
 * between outlet groups by its yields, and within a group between the open lines by conductance.
 * A group with no open line holds its share back at the node. A network with a loop cannot be
 * solved this way and returns all-zero flows with everything held at the sources.
 */
export function solveNetwork(network: FlowNetwork, closedValves: readonly string[] = []): FlowSolution {
  const flows: Record<string, number> = Object.fromEntries(network.edges.map((edge) => [edge.id, 0]));
  const inflow: Record<string, number> = Object.fromEntries(network.nodes.map((node) => [node.id, node.kind === 'source' ? Math.max(0, node.supply ?? 0) : 0]));
  const delivered: Record<string, number> = {};
  const held: HeldFlow[] = [];
  const supplied = network.nodes.reduce((sum, node) => sum + (node.kind === 'source' ? Math.max(0, node.supply ?? 0) : 0), 0);
  const order = topologicalOrder(network);

  if (!order) {
    for (const node of network.nodes) {
      if (node.kind === 'source' && inflow[node.id] > 0) held.push({ nodeId: node.id, group: SINGLE_GROUP, amount: inflow[node.id] });
    }
    return { flows, inflow, delivered, held, supplied, deliveredTotal: 0, heldTotal: supplied, imbalance: 0 };
  }

  const byId = new Map(network.nodes.map((node) => [node.id, node]));
  for (const id of order) {
    const node = byId.get(id);
    if (!node) continue;
    const arriving = inflow[id] ?? 0;
    if (node.kind === 'sink') {
      delivered[id] = arriving;
      continue;
    }
    if (arriving <= 0) continue;
    const outgoing = network.edges.filter((edge) => edge.from === id && byId.has(edge.to));
    for (const { group, share } of outletGroups(node)) {
      const amount = arriving * share;
      const lines = outgoing.filter((edge) => (group === SINGLE_GROUP || edge.group === group) && isEdgeOpen(edge, closedValves));
      const conductance = lines.reduce((sum, edge) => sum + edge.conductance, 0);
      if (conductance <= 0) {
        held.push({ nodeId: id, group, amount });
        continue;
      }
      for (const edge of lines) {
        const flow = (amount * edge.conductance) / conductance;
        flows[edge.id] = flow;
        inflow[edge.to] = (inflow[edge.to] ?? 0) + flow;
      }
    }
  }

  const deliveredTotal = Object.values(delivered).reduce((sum, amount) => sum + amount, 0);
  const heldTotal = held.reduce((sum, entry) => sum + entry.amount, 0);
  return { flows, inflow, delivered, held, supplied, deliveredTotal, heldTotal, imbalance: supplied - deliveredTotal - heldTotal };
}

function walk(network: FlowNetwork, startEdgeId: string, direction: 'up' | 'down', include: (edge: FlowEdge) => boolean): string[] {
  const start = network.edges.find((edge) => edge.id === startEdgeId);
  if (!start) return [];
  const found: string[] = [];
  const seen = new Set<string>([start.id]);
  const frontier = [direction === 'up' ? start.from : start.to];
  while (frontier.length > 0) {
    const nodeId = frontier.shift();
    if (nodeId === undefined) break;
    for (const edge of network.edges) {
      const touches = direction === 'up' ? edge.to === nodeId : edge.from === nodeId;
      if (!touches || seen.has(edge.id) || !include(edge)) continue;
      seen.add(edge.id);
      found.push(edge.id);
      frontier.push(direction === 'up' ? edge.from : edge.to);
    }
  }
  return found;
}

/** Every line that feeds the given line, nearest first. `include` filters lines, e.g. to those that flow. */
export function upstreamEdges(network: FlowNetwork, edgeId: string, include: (edge: FlowEdge) => boolean = () => true): string[] {
  return walk(network, edgeId, 'up', include);
}

/** Every line the given line feeds, nearest first. */
export function downstreamEdges(network: FlowNetwork, edgeId: string, include: (edge: FlowEdge) => boolean = () => true): string[] {
  return walk(network, edgeId, 'down', include);
}

export type FlowTrace = {
  upstream: string[];
  downstream: string[];
  /** Sources that feed the line and sinks it reaches, by node id. */
  sources: string[];
  sinks: string[];
};

/**
 * The path through a line: what feeds it and where it ends up. With `flows`, only lines that
 * actually carry flow are followed, so a closed valve cuts the trace as it cuts the stream.
 */
export function traceStream(network: FlowNetwork, edgeId: string, flows?: Readonly<Record<string, number>>): FlowTrace {
  const include = flows ? (edge: FlowEdge) => (flows[edge.id] ?? 0) > 0 : () => true;
  const upstream = upstreamEdges(network, edgeId, include);
  const downstream = downstreamEdges(network, edgeId, include);
  const edgeOf = (id: string) => network.edges.find((edge) => edge.id === id);
  const kindOf = (id: string) => network.nodes.find((node) => node.id === id)?.kind;
  const unique = (ids: (string | undefined)[]): string[] => [...new Set(ids.flatMap((id) => (id === undefined ? [] : [id])))];
  const sources = unique([edgeId, ...upstream].map((id) => edgeOf(id)?.from)).filter((id) => kindOf(id) === 'source');
  const sinks = unique([edgeId, ...downstream].map((id) => edgeOf(id)?.to)).filter((id) => kindOf(id) === 'sink');
  return { upstream, downstream, sources, sinks };
}

/** The closed-valve list with one valve flipped. */
export function toggleValve(closedValves: readonly string[], valveId: string): string[] {
  return closedValves.includes(valveId) ? closedValves.filter((id) => id !== valveId) : [...closedValves, valveId];
}

/** The largest flow in a solution, or 0. Use it as the reference rate for particle speed. */
export function peakFlow(solution: FlowSolution): number {
  return Object.values(solution.flows).reduce((peak, flow) => Math.max(peak, flow), 0);
}
