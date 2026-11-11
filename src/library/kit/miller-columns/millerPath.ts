import { pathTo, type AssetTree, type TreeNode } from './assetTree';

/**
 * Selection logic for miller columns. The state is the list of selected ids from the first
 * column down; the last one is the active node the preview shows.
 */

export type MillerColumn = {
  /** The node whose children the column lists. */
  parent: TreeNode;
  nodes: readonly TreeNode[];
  /** The selected row, when the selection passes through this column. */
  selectedId: string | null;
};

export type MillerKey = 'up' | 'down' | 'left' | 'right' | 'home' | 'end';

/** Drops ids that do not follow from the one before, so a stale path can never break a screen. */
export function sanitizePath(tree: AssetTree, path: readonly string[]): string[] {
  const clean: string[] = [];
  let parent = tree.root;
  for (const id of path) {
    const next = parent.children.find((child) => child.id === id);
    if (!next) break;
    clean.push(id);
    parent = next;
  }
  return clean;
}

/** One column per selected level, plus the children of the active node when it has any. */
export function millerColumns(tree: AssetTree, path: readonly string[]): MillerColumn[] {
  const clean = sanitizePath(tree, path);
  const columns: MillerColumn[] = [];
  let parent = tree.root;
  for (const id of clean) {
    columns.push({ parent, nodes: parent.children, selectedId: id });
    const next = parent.children.find((child) => child.id === id);
    if (!next) break;
    parent = next;
  }
  if (parent.children.length > 0 || clean.length === 0) columns.push({ parent, nodes: parent.children, selectedId: null });
  return columns;
}

/** The node the preview shows: the deepest selected one, or the root when nothing is selected. */
export function activeNode(tree: AssetTree, path: readonly string[]): TreeNode {
  const clean = sanitizePath(tree, path);
  const last = clean[clean.length - 1];
  return (last ? tree.byId.get(last) : undefined) ?? tree.root;
}

/** The selection that makes `id` the active node. */
export function selectNode(tree: AssetTree, id: string): string[] {
  return pathTo(tree, id)
    .slice(1)
    .map((node) => node.id);
}

/** Arrow-key navigation: up and down move within the column, right opens it, left steps back out. */
export function movePath(tree: AssetTree, path: readonly string[], key: MillerKey): string[] {
  const clean = sanitizePath(tree, path);
  const active = activeNode(tree, clean);
  if (clean.length === 0) {
    const first = tree.root.children[0];
    return first && key !== 'left' ? [first.id] : clean;
  }
  if (key === 'left') return clean.length > 1 ? clean.slice(0, -1) : clean;
  if (key === 'right') {
    const first = active.children[0];
    return first ? [...clean, first.id] : clean;
  }
  const parent = active.parentId === null ? undefined : tree.byId.get(active.parentId);
  const siblings = parent?.children ?? [];
  const index = siblings.findIndex((node) => node.id === active.id);
  const target = key === 'home' ? 0 : key === 'end' ? siblings.length - 1 : key === 'up' ? index - 1 : index + 1;
  const next = siblings[Math.min(Math.max(target, 0), siblings.length - 1)];
  return next ? [...clean.slice(0, -1), next.id] : clean;
}
