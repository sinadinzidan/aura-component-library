/**
 * Pure model of a node graph: typed ports, edges that connect an output to an input, and the
 * rules that decide whether a connection is allowed. Positions are in world units.
 */

export type PortType = 'number' | 'text' | 'table' | 'boolean' | 'signal' | 'any';

export type GraphPort = { id: string; label: string; type: PortType };

export type RunState = 'idle' | 'running' | 'done' | 'failed';

export type GraphNode = {
  id: string;
  kind: string;
  title: string;
  x: number;
  y: number;
  inputs: readonly GraphPort[];
  outputs: readonly GraphPort[];
  /** One line of configuration shown in the node and the inspector. */
  detail?: string;
  state: RunState;
  /** Why a node failed, in words. */
  error?: string;
};

export type GraphEdge = { id: string; from: { node: string; port: string }; to: { node: string; port: string } };

export type GraphData = { nodes: readonly GraphNode[]; edges: readonly GraphEdge[] };

export const NODE_WIDTH = 176;
export const HEADER_HEIGHT = 40;
export const PORT_SPACING = 24;
export const NODE_PADDING = 8;
export const FOOTER_HEIGHT = 24;

export const PORT_TYPE_LABEL: Record<PortType, string> = {
  number: 'Number',
  text: 'Text',
  table: 'Table',
  boolean: 'True or false',
  signal: 'Time series',
  any: 'Any',
};

export const RUN_STATE_LABEL: Record<RunState, string> = { idle: 'Not run', running: 'Running', done: 'Done', failed: 'Failed' };

/** Height of a node: header, one row per port on the longer side, and a footer for the run state. */
export function nodeHeight(node: Pick<GraphNode, 'inputs' | 'outputs'>): number {
  const rows = Math.max(node.inputs.length, node.outputs.length, 1);
  return HEADER_HEIGHT + NODE_PADDING + rows * PORT_SPACING + FOOTER_HEIGHT;
}

export type Side = 'input' | 'output';

/** Where a port sits in world units: on the left edge for inputs, the right edge for outputs. */
export function portPosition(node: GraphNode, side: Side, portId: string): { x: number; y: number } | null {
  const ports = side === 'input' ? node.inputs : node.outputs;
  const index = ports.findIndex((port) => port.id === portId);
  if (index === -1) return null;
  return { x: node.x + (side === 'input' ? 0 : NODE_WIDTH), y: node.y + HEADER_HEIGHT + NODE_PADDING + index * PORT_SPACING + PORT_SPACING / 2 };
}

export const findNode = (graph: GraphData, id: string): GraphNode | undefined => graph.nodes.find((node) => node.id === id);

/** Whether a value of type `from` may feed an input of type `to`. */
export function typesCompatible(from: PortType, to: PortType): boolean {
  return from === to || from === 'any' || to === 'any';
}

export type ConnectionCheck = { ok: true } | { ok: false; reason: string };

/** Whether adding an edge from `from` to `to` would close a loop. */
export function wouldCreateCycle(graph: GraphData, fromNode: string, toNode: string): boolean {
  if (fromNode === toNode) return true;
  const seen = new Set<string>();
  const stack = [toNode];
  while (stack.length > 0) {
    const current = stack.pop();
    if (current === undefined || seen.has(current)) continue;
    if (current === fromNode) return true;
    seen.add(current);
    for (const edge of graph.edges) if (edge.from.node === current) stack.push(edge.to.node);
  }
  return false;
}

/** Validates a connection from an output port to an input port and says why it refuses. */
export function checkConnection(graph: GraphData, from: { node: string; port: string }, to: { node: string; port: string }): ConnectionCheck {
  const source = findNode(graph, from.node);
  const target = findNode(graph, to.node);
  const output = source?.outputs.find((port) => port.id === from.port);
  const input = target?.inputs.find((port) => port.id === to.port);
  if (!source || !target || !output || !input) return { ok: false, reason: 'Connect an output to an input.' };
  if (source.id === target.id) return { ok: false, reason: 'A node cannot connect to itself.' };
  if (!typesCompatible(output.type, input.type)) {
    return { ok: false, reason: `${PORT_TYPE_LABEL[output.type]} cannot feed ${PORT_TYPE_LABEL[input.type].toLowerCase()}.` };
  }
  if (graph.edges.some((edge) => edge.to.node === to.node && edge.to.port === to.port)) {
    return { ok: false, reason: `${input.label} on ${target.title} already has a connection.` };
  }
  if (graph.edges.some((edge) => edge.from.node === from.node && edge.from.port === from.port && edge.to.node === to.node && edge.to.port === to.port)) {
    return { ok: false, reason: 'These ports are already connected.' };
  }
  if (wouldCreateCycle(graph, from.node, to.node)) return { ok: false, reason: 'That would create a loop.' };
  return { ok: true };
}

/** A smooth cubic path between two ports, bowing out horizontally in proportion to their distance. */
export function edgePath(from: { x: number; y: number }, to: { x: number; y: number }): string {
  const reach = Math.max(40, Math.min(160, Math.abs(to.x - from.x) / 2 + Math.abs(to.y - from.y) / 4));
  const round = (n: number) => Math.round(n * 100) / 100;
  return `M ${round(from.x)} ${round(from.y)} C ${round(from.x + reach)} ${round(from.y)}, ${round(to.x - reach)} ${round(to.y)}, ${round(to.x)} ${round(to.y)}`;
}

/** Midpoint of the edge curve, for a label or a delete handle. */
export function edgeMidpoint(from: { x: number; y: number }, to: { x: number; y: number }): { x: number; y: number } {
  return { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
}

/** Snaps a value to a grid; a grid of 0 leaves it alone. */
export function snap(value: number, grid: number): number {
  return grid > 0 ? Math.round(value / grid) * grid : value;
}

export type Rect = { x: number; y: number; width: number; height: number };

export const nodeRect = (node: GraphNode): Rect => ({ x: node.x, y: node.y, width: NODE_WIDTH, height: nodeHeight(node) });

/** A rectangle from two corner points, whichever way the marquee was dragged. */
export function rectFromPoints(a: { x: number; y: number }, b: { x: number; y: number }): Rect {
  return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), width: Math.abs(a.x - b.x), height: Math.abs(a.y - b.y) };
}

export function rectsIntersect(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

/** Ids of nodes touched by a marquee. */
export function nodesInRect(graph: GraphData, rect: Rect): string[] {
  return graph.nodes.filter((node) => rectsIntersect(nodeRect(node), rect)).map((node) => node.id);
}

/** Bounding box of some nodes, for fitting the view. */
export function graphBounds(nodes: readonly GraphNode[]): Rect {
  if (nodes.length === 0) return { x: 0, y: 0, width: 400, height: 300 };
  const rects = nodes.map(nodeRect);
  const x = Math.min(...rects.map((r) => r.x));
  const y = Math.min(...rects.map((r) => r.y));
  return { x, y, width: Math.max(...rects.map((r) => r.x + r.width)) - x, height: Math.max(...rects.map((r) => r.y + r.height)) - y };
}

/** The port under a world point, within `radius`, preferring the nearest. */
export function portAt(graph: GraphData, point: { x: number; y: number }, side: Side, radius = 14): { node: string; port: string } | null {
  let best: { node: string; port: string } | null = null;
  let bestDistance = radius;
  for (const node of graph.nodes) {
    for (const port of side === 'input' ? node.inputs : node.outputs) {
      const position = portPosition(node, side, port.id);
      if (!position) continue;
      const distance = Math.hypot(position.x - point.x, position.y - point.y);
      if (distance <= bestDistance) {
        best = { node: node.id, port: port.id };
        bestDistance = distance;
      }
    }
  }
  return best;
}
