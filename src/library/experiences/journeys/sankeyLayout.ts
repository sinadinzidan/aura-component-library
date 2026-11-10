/**
 * Layout for a column-based flow (Sankey) diagram. Nodes are assigned to columns by the caller;
 * this stacks them, sizes them by throughput and routes a ribbon for every link. Pure geometry in
 * an abstract box, so a component can draw it at any size.
 */
export type SankeyNodeInput = { id: string; label: string; column: number };
export type SankeyLinkInput = { id?: string; source: string; target: string; value: number };

export type SankeyBox = {
  width: number;
  height: number;
  /** Width of a node bar. */
  nodeWidth: number;
  /** Vertical gap between nodes of one column. */
  nodeGap: number;
};

export type SankeyNode = SankeyNodeInput & {
  /** Throughput: the larger of what flows in and what flows out. */
  value: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type SankeyLink = {
  id: string;
  source: string;
  target: string;
  value: number;
  thickness: number;
  /** Right edge of the source node and left edge of the target node. */
  x0: number;
  x1: number;
  /** Top of the ribbon where it leaves the source and where it enters the target. */
  y0: number;
  y1: number;
  /** Closed ribbon outline, ready for a `<path d>`. */
  path: string;
};

export type SankeyLayout = { nodes: SankeyNode[]; links: SankeyLink[]; scale: number };

export type SankeySelection = { kind: 'node' | 'link'; id: string };

const round = (value: number): number => Math.round(value * 100) / 100;

/** Stable id of a link that was given none. */
export function sankeyLinkId(link: SankeyLinkInput): string {
  return link.id ?? `${link.source}->${link.target}`;
}

/** Throughput per node: the larger of the sum flowing in and the sum flowing out. */
export function sankeyNodeValues(nodes: readonly SankeyNodeInput[], links: readonly SankeyLinkInput[]): Map<string, number> {
  const values = new Map<string, number>();
  for (const node of nodes) {
    const incoming = links.filter((link) => link.target === node.id).reduce((sum, link) => sum + link.value, 0);
    const outgoing = links.filter((link) => link.source === node.id).reduce((sum, link) => sum + link.value, 0);
    values.set(node.id, Math.max(incoming, outgoing));
  }
  return values;
}

/** A ribbon between two vertical edges with horizontal tangents at both ends. */
export function sankeyRibbon(x0: number, y0: number, x1: number, y1: number, thickness: number): string {
  const middle = round((x0 + x1) / 2);
  const [a, b, c, d] = [round(y0), round(y1), round(y1 + thickness), round(y0 + thickness)];
  return `M ${round(x0)} ${a} C ${middle} ${a} ${middle} ${b} ${round(x1)} ${b} L ${round(x1)} ${c} C ${middle} ${c} ${middle} ${d} ${round(x0)} ${d} Z`;
}

export function sankeyLayout(nodes: readonly SankeyNodeInput[], links: readonly SankeyLinkInput[], box: SankeyBox): SankeyLayout {
  const known = new Set(nodes.map((node) => node.id));
  const usable = links.filter((link) => link.value > 0 && known.has(link.source) && known.has(link.target));
  const values = sankeyNodeValues(nodes, usable);
  const columns = [...new Set(nodes.map((node) => node.column))].sort((a, b) => a - b);
  const byColumn = columns.map((column) => nodes.filter((node) => node.column === column));

  // One scale for the whole diagram, set by the column that needs the most room.
  const scale = Math.min(
    ...byColumn.map((column) => {
      const total = column.reduce((sum, node) => sum + (values.get(node.id) ?? 0), 0);
      const room = box.height - box.nodeGap * Math.max(column.length - 1, 0);
      return total > 0 ? Math.max(room, 0) / total : Number.POSITIVE_INFINITY;
    })
  );
  const safeScale = Number.isFinite(scale) ? scale : 0;

  const placed: SankeyNode[] = [];
  byColumn.forEach((column, position) => {
    const heights = column.map((node) => (values.get(node.id) ?? 0) * safeScale);
    const total = heights.reduce((sum, height) => sum + height, 0) + box.nodeGap * Math.max(column.length - 1, 0);
    let y = (box.height - total) / 2;
    const x = columns.length <= 1 ? 0 : (position / (columns.length - 1)) * (box.width - box.nodeWidth);
    column.forEach((node, index) => {
      const height = heights[index] ?? 0;
      placed.push({ ...node, value: values.get(node.id) ?? 0, x: round(x), y: round(y), width: box.nodeWidth, height: round(height) });
      y += height + box.nodeGap;
    });
  });

  const nodeById = new Map(placed.map((node) => [node.id, node]));
  const yOf = (id: string): number => nodeById.get(id)?.y ?? 0;
  const sourceOffset = new Map<string, number>();
  const targetOffset = new Map<string, number>();

  // Ribbons leave a node in the order of their targets and arrive in the order of their sources,
  // so they do not cross more than the data requires.
  const leaveOrder = [...usable].sort((a, b) => yOf(a.source) - yOf(b.source) || yOf(a.target) - yOf(b.target));
  for (const link of leaveOrder) {
    const id = sankeyLinkId(link);
    const used = sourceOffset.get(`sum:${link.source}`) ?? 0;
    sourceOffset.set(id, used);
    sourceOffset.set(`sum:${link.source}`, used + link.value * safeScale);
  }
  const arriveOrder = [...usable].sort((a, b) => yOf(a.target) - yOf(b.target) || yOf(a.source) - yOf(b.source));
  for (const link of arriveOrder) {
    const id = sankeyLinkId(link);
    const used = targetOffset.get(`sum:${link.target}`) ?? 0;
    targetOffset.set(id, used);
    targetOffset.set(`sum:${link.target}`, used + link.value * safeScale);
  }

  const routed = usable.flatMap((link): SankeyLink[] => {
    const source = nodeById.get(link.source);
    const target = nodeById.get(link.target);
    if (!source || !target) return [];
    const id = sankeyLinkId(link);
    const thickness = round(link.value * safeScale);
    const x0 = source.x + source.width;
    const x1 = target.x;
    const y0 = round(source.y + (sourceOffset.get(id) ?? 0));
    const y1 = round(target.y + (targetOffset.get(id) ?? 0));
    return [{ id, source: link.source, target: link.target, value: link.value, thickness, x0, x1, y0, y1, path: sankeyRibbon(x0, y0, x1, y1, thickness) }];
  });

  return { nodes: placed, links: routed, scale: safeScale };
}

/**
 * The path a selection belongs to: for a node, everything that feeds it and everything it feeds;
 * for a link, the link, what feeds its source and what its target feeds.
 */
export function sankeyPath(
  links: readonly { id: string; source: string; target: string }[],
  selection: SankeySelection | null
): { nodes: Set<string>; links: Set<string> } {
  const nodes = new Set<string>();
  const marked = new Set<string>();
  if (!selection) return { nodes, links: marked };

  const walk = (start: string, direction: 'up' | 'down') => {
    const queue = [start];
    const visited = new Set<string>();
    while (queue.length > 0) {
      const current = queue.shift();
      if (current === undefined || visited.has(current)) continue;
      visited.add(current);
      nodes.add(current);
      for (const link of links) {
        if (direction === 'down' && link.source === current) {
          marked.add(link.id);
          queue.push(link.target);
        }
        if (direction === 'up' && link.target === current) {
          marked.add(link.id);
          queue.push(link.source);
        }
      }
    }
  };

  if (selection.kind === 'node') {
    walk(selection.id, 'up');
    walk(selection.id, 'down');
    return { nodes, links: marked };
  }
  const link = links.find((candidate) => candidate.id === selection.id);
  if (!link) return { nodes, links: marked };
  marked.add(link.id);
  walk(link.source, 'up');
  walk(link.target, 'down');
  return { nodes, links: marked };
}
