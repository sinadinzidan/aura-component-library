import { NODE_WIDTH, nodeHeight } from './graphModel';
import type { GraphData, GraphNode } from './graphModel';

export type LayoutOptions = { columnGap?: number; rowGap?: number; originX?: number; originY?: number; grid?: number };

/**
 * Layered layout: every node goes in the column of its longest path from a source, and nodes in a
 * column are ordered by the average row of their predecessors to keep edges short. Returns new
 * positions only; the graph is not changed.
 */
export function layerNodes(graph: GraphData): Map<string, number> {
  const layer = new Map<string, number>();
  const incoming = new Map<string, string[]>();
  for (const node of graph.nodes) incoming.set(node.id, []);
  for (const edge of graph.edges) incoming.get(edge.to.node)?.push(edge.from.node);

  const visit = (id: string, trail: Set<string>): number => {
    const known = layer.get(id);
    if (known !== undefined) return known;
    if (trail.has(id)) return 0;
    trail.add(id);
    const parents = incoming.get(id) ?? [];
    const value = parents.length === 0 ? 0 : Math.max(...parents.map((parent) => visit(parent, trail))) + 1;
    trail.delete(id);
    layer.set(id, value);
    return value;
  };
  for (const node of graph.nodes) visit(node.id, new Set());
  return layer;
}

export function autoLayout(graph: GraphData, { columnGap = 96, rowGap = 32, originX = 40, originY = 40, grid = 8 }: LayoutOptions = {}): Map<string, { x: number; y: number }> {
  const layers = layerNodes(graph);
  const columns: GraphNode[][] = [];
  for (const node of graph.nodes) {
    const index = layers.get(node.id) ?? 0;
    (columns[index] ??= []).push(node);
  }
  const rowOf = new Map<string, number>();
  const positions = new Map<string, { x: number; y: number }>();
  const snapTo = (value: number) => (grid > 0 ? Math.round(value / grid) * grid : value);

  columns.forEach((column, columnIndex) => {
    if (!column) return;
    const barycentre = (node: GraphNode): number => {
      const parents = graph.edges.filter((edge) => edge.to.node === node.id).map((edge) => rowOf.get(edge.from.node) ?? 0);
      return parents.length === 0 ? graph.nodes.indexOf(node) : parents.reduce((sum, row) => sum + row, 0) / parents.length;
    };
    const ordered = [...column].sort((a, b) => barycentre(a) - barycentre(b) || graph.nodes.indexOf(a) - graph.nodes.indexOf(b));
    let y = originY;
    ordered.forEach((node, row) => {
      rowOf.set(node.id, row);
      positions.set(node.id, { x: snapTo(originX + columnIndex * (NODE_WIDTH + columnGap)), y: snapTo(y) });
      y += nodeHeight(node) + rowGap;
    });
  });
  return positions;
}
