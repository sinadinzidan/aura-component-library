import { autoLayout } from './graphLayout';
import { NODE_WIDTH, checkConnection, nodeHeight, snap } from './graphModel';
import type { GraphData, GraphEdge, GraphNode, PortType, RunState } from './graphModel';

/** State of a node graph editor: the graph, the selection and a bounded undo history. */

export type GraphState = {
  graph: GraphData;
  selection: readonly string[];
  selectedEdge: string | null;
  past: readonly GraphData[];
  future: readonly GraphData[];
  grid: number;
  nextId: number;
  /** Why the last connection attempt was refused. */
  error: string | null;
  /** Last thing that happened, for the live region. */
  message: string;
};

export type NodeSpec = { kind: string; title: string; detail?: string; inputs: GraphNode['inputs']; outputs: GraphNode['outputs']; x: number; y: number };

export type GraphAction =
  | { type: 'select'; id: string; additive?: boolean }
  | { type: 'selectMany'; ids: readonly string[]; additive?: boolean }
  | { type: 'selectEdge'; id: string | null }
  | { type: 'clearSelection' }
  | { type: 'selectAll' }
  | { type: 'moveSelection'; dx: number; dy: number; commit?: boolean }
  | { type: 'moveStart' }
  | { type: 'connect'; from: { node: string; port: string }; to: { node: string; port: string } }
  | { type: 'addNode'; spec: NodeSpec }
  | { type: 'deleteSelection' }
  | { type: 'deleteEdge'; id: string }
  | { type: 'duplicate' }
  | { type: 'autoLayout' }
  | { type: 'updateNode'; id: string; patch: Partial<Pick<GraphNode, 'title' | 'detail'>> }
  | { type: 'setRunState'; id: string; state: RunState; error?: string }
  | { type: 'clearError' }
  | { type: 'undo' }
  | { type: 'redo' };

const HISTORY_LIMIT = 50;
export const DEFAULT_GRID = 8;

export function initGraphState(graph: GraphData, grid = DEFAULT_GRID): GraphState {
  return { graph, selection: [], selectedEdge: null, past: [], future: [], grid, nextId: graph.nodes.length + graph.edges.length + 1, error: null, message: '' };
}

/** Records the current graph before a change, so the change can be undone. */
function commit(state: GraphState, graph: GraphData, message: string, extra: Partial<GraphState> = {}): GraphState {
  return { ...state, ...extra, graph, past: [...state.past, state.graph].slice(-HISTORY_LIMIT), future: [], error: null, message };
}

const sameSet = (a: readonly string[], b: readonly string[]): boolean => a.length === b.length && a.every((id) => b.includes(id));

const titleOf = (graph: GraphData, id: string): string => graph.nodes.find((node) => node.id === id)?.title ?? id;

export function graphReducer(state: GraphState, action: GraphAction): GraphState {
  switch (action.type) {
    case 'select': {
      const selection = action.additive ? (state.selection.includes(action.id) ? state.selection.filter((id) => id !== action.id) : [...state.selection, action.id]) : state.selection.includes(action.id) && state.selection.length > 1 ? state.selection : [action.id];
      return { ...state, selection, selectedEdge: null, message: selection.length === 1 ? `${titleOf(state.graph, selection[0])} selected` : `${selection.length} nodes selected` };
    }
    case 'selectMany': {
      const selection = action.additive ? [...new Set([...state.selection, ...action.ids])] : [...action.ids];
      if (sameSet(selection, state.selection) && state.selectedEdge === null) return state;
      return { ...state, selection, selectedEdge: null, message: `${selection.length} ${selection.length === 1 ? 'node' : 'nodes'} selected` };
    }
    case 'selectEdge':
      return { ...state, selectedEdge: action.id, selection: [], message: action.id ? 'Connection selected' : state.message };
    case 'clearSelection':
      return state.selection.length === 0 && state.selectedEdge === null ? state : { ...state, selection: [], selectedEdge: null, message: 'Selection cleared' };
    case 'selectAll':
      return { ...state, selection: state.graph.nodes.map((node) => node.id), selectedEdge: null, message: `${state.graph.nodes.length} nodes selected` };
    case 'moveStart':
      return { ...state, past: [...state.past, state.graph].slice(-HISTORY_LIMIT), future: [] };
    case 'moveSelection': {
      if (state.selection.length === 0 || (action.dx === 0 && action.dy === 0)) return state;
      const graph = { ...state.graph, nodes: state.graph.nodes.map((node) => (state.selection.includes(node.id) ? { ...node, x: node.x + action.dx, y: node.y + action.dy } : node)) };
      // A keyboard move is one undo step; a drag has already recorded its own with `moveStart`.
      if (action.commit) return commit(state, graph, `Moved ${state.selection.length === 1 ? titleOf(graph, state.selection[0]) : `${state.selection.length} nodes`}`);
      return { ...state, graph };
    }
    case 'connect': {
      const check = checkConnection(state.graph, action.from, action.to);
      if (!check.ok) return { ...state, error: check.reason, message: `Not connected. ${check.reason}` };
      const edge: GraphEdge = { id: `e${state.nextId}`, from: action.from, to: action.to };
      return commit(state, { ...state.graph, edges: [...state.graph.edges, edge] }, `Connected ${titleOf(state.graph, action.from.node)} to ${titleOf(state.graph, action.to.node)}`, { nextId: state.nextId + 1 });
    }
    case 'addNode': {
      const { spec } = action;
      const id = `n${state.nextId}`;
      const node: GraphNode = { id, kind: spec.kind, title: spec.title, detail: spec.detail, inputs: spec.inputs, outputs: spec.outputs, x: snap(spec.x, state.grid), y: snap(spec.y, state.grid), state: 'idle' };
      return commit(state, { ...state.graph, nodes: [...state.graph.nodes, node] }, `${spec.title} added`, { nextId: state.nextId + 1, selection: [id], selectedEdge: null });
    }
    case 'deleteSelection': {
      if (state.selectedEdge) return graphReducer(state, { type: 'deleteEdge', id: state.selectedEdge });
      if (state.selection.length === 0) return state;
      const gone = new Set(state.selection);
      const graph = { nodes: state.graph.nodes.filter((node) => !gone.has(node.id)), edges: state.graph.edges.filter((edge) => !gone.has(edge.from.node) && !gone.has(edge.to.node)) };
      return commit(state, graph, `Deleted ${gone.size} ${gone.size === 1 ? 'node' : 'nodes'}`, { selection: [] });
    }
    case 'deleteEdge': {
      if (!state.graph.edges.some((edge) => edge.id === action.id)) return state;
      return commit(state, { ...state.graph, edges: state.graph.edges.filter((edge) => edge.id !== action.id) }, 'Connection removed', { selectedEdge: null });
    }
    case 'duplicate': {
      if (state.selection.length === 0) return state;
      const chosen = state.graph.nodes.filter((node) => state.selection.includes(node.id));
      let next = state.nextId;
      const idMap = new Map<string, string>();
      const copies = chosen.map((node) => {
        const id = `n${next++}`;
        idMap.set(node.id, id);
        return { ...node, id, x: node.x + state.grid * 3, y: node.y + state.grid * 3, state: 'idle' as const, error: undefined };
      });
      // Connections between copied nodes come along; connections to the rest of the graph do not.
      const edges = state.graph.edges
        .filter((edge) => idMap.has(edge.from.node) && idMap.has(edge.to.node))
        .map((edge) => ({ id: `e${next++}`, from: { node: idMap.get(edge.from.node) ?? '', port: edge.from.port }, to: { node: idMap.get(edge.to.node) ?? '', port: edge.to.port } }));
      return commit(state, { nodes: [...state.graph.nodes, ...copies], edges: [...state.graph.edges, ...edges] }, `Duplicated ${copies.length} ${copies.length === 1 ? 'node' : 'nodes'}`, { nextId: next, selection: copies.map((node) => node.id) });
    }
    case 'autoLayout': {
      const positions = autoLayout(state.graph, { grid: state.grid });
      const graph = { ...state.graph, nodes: state.graph.nodes.map((node) => ({ ...node, ...(positions.get(node.id) ?? {}) })) };
      return commit(state, graph, 'Nodes arranged left to right');
    }
    case 'updateNode': {
      const graph = { ...state.graph, nodes: state.graph.nodes.map((node) => (node.id === action.id ? { ...node, ...action.patch } : node)) };
      return { ...state, graph, message: state.message };
    }
    case 'setRunState': {
      const graph = { ...state.graph, nodes: state.graph.nodes.map((node) => (node.id === action.id ? { ...node, state: action.state, error: action.state === 'failed' ? action.error : undefined } : node)) };
      return { ...state, graph };
    }
    case 'clearError':
      return state.error === null ? state : { ...state, error: null };
    case 'undo': {
      const previous = state.past[state.past.length - 1];
      if (!previous) return state;
      const ids = new Set(previous.nodes.map((node) => node.id));
      return { ...state, graph: previous, past: state.past.slice(0, -1), future: [state.graph, ...state.future], selection: state.selection.filter((id) => ids.has(id)), selectedEdge: null, error: null, message: 'Undone' };
    }
    case 'redo': {
      const [next, ...rest] = state.future;
      if (!next) return state;
      return { ...state, graph: next, past: [...state.past, state.graph], future: rest, selection: state.selection.filter((id) => next.nodes.some((node) => node.id === id)), selectedEdge: null, error: null, message: 'Redone' };
    }
    default:
      return state;
  }
}

/** Where a new node from the palette goes: the middle of the visible area, offset from the last. */
export function dropPosition(centre: { x: number; y: number }, count: number): { x: number; y: number } {
  return { x: centre.x - NODE_WIDTH / 2 + (count % 5) * 16, y: centre.y - nodeHeight({ inputs: [], outputs: [] }) / 2 + (count % 5) * 16 };
}

/** Types shown in the legend, in a stable order. */
export const PORT_TYPES: readonly PortType[] = ['signal', 'number', 'boolean', 'text', 'table', 'any'];
