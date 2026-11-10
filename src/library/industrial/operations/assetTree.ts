/**
 * Pure helpers for an asset hierarchy held as a flat list with `parentId`: index it for a tree,
 * roll alarms and states up the branches, find a path or the siblings of a node, and filter it.
 */
import type { Health, RunState, Severity } from '../status';

import { worstSeverity } from './alarms';

export type AssetTreeInput = {
  id: string;
  /** Functional location tag. */
  tag: string;
  name: string;
  parentId: string | null;
  type?: string;
  state?: RunState;
  health?: Health;
  /** 0–100. */
  healthScore?: number;
  /** Severities of the open alarms on this node itself (not its children). */
  alarms?: readonly Severity[];
};

export type AssetTreeNode = AssetTreeInput & { children: string[] };
export type AssetTreeIndex = Record<string, AssetTreeNode>;

/** Id of the hidden node above the top-level assets. */
export const ASSET_TREE_ROOT = 'root';

const STATE_ORDER: readonly RunState[] = ['tripped', 'maintenance', 'stopped', 'standby', 'running'];
const HEALTH_ORDER: readonly Health[] = ['poor', 'watch', 'good'];

/** Flat list → lookup with child ids, under a hidden root. Assets with an unknown parent go to the top level. */
export function indexAssetTree(assets: readonly AssetTreeInput[], rootName = 'All assets'): AssetTreeIndex {
  const index: AssetTreeIndex = {
    [ASSET_TREE_ROOT]: { id: ASSET_TREE_ROOT, tag: '', name: rootName, parentId: null, children: [] },
  };
  for (const asset of assets) index[asset.id] = { ...asset, children: [] };
  for (const asset of assets) {
    const parent = asset.parentId !== null && asset.parentId in index ? asset.parentId : ASSET_TREE_ROOT;
    index[parent].children.push(asset.id);
  }
  return index;
}

export type AssetRollUp = {
  /** Leaves at or below the node. A leaf counts itself. */
  equipment: number;
  /** Open alarms on the node and everything below it. */
  alarms: number;
  worstSeverity?: Severity;
  worstState?: RunState;
  worstHealth?: Health;
  /** How many leaves are in each run state. */
  states: Record<RunState, number>;
};

/** Everything a branch row needs to know about what is below it. */
export function rollUp(index: AssetTreeIndex, id: string): AssetRollUp {
  const states: Record<RunState, number> = { running: 0, standby: 0, stopped: 0, tripped: 0, maintenance: 0 };
  const severities: Severity[] = [];
  const healths: Health[] = [];
  let equipment = 0;

  const visit = (nodeId: string) => {
    const node = index[nodeId];
    if (node === undefined) return;
    severities.push(...(node.alarms ?? []));
    if (node.children.length === 0) {
      equipment += 1;
      if (node.state) states[node.state] += 1;
      if (node.health) healths.push(node.health);
      return;
    }
    node.children.forEach(visit);
  };
  visit(id);

  return {
    equipment,
    alarms: severities.length,
    worstSeverity: worstSeverity(severities),
    worstState: STATE_ORDER.find((state) => states[state] > 0),
    worstHealth: HEALTH_ORDER.find((health) => healths.includes(health)),
    states,
  };
}

/** The nodes from the top level down to `id`, the hidden root left out. Empty for an unknown id. */
export function pathTo(index: AssetTreeIndex, id: string): AssetTreeNode[] {
  const path: AssetTreeNode[] = [];
  let node: AssetTreeNode | undefined = index[id];
  while (node !== undefined && node.id !== ASSET_TREE_ROOT) {
    path.unshift(node);
    node = node.parentId === null ? undefined : index[node.parentId];
  }
  return path;
}

export type AssetSiblings = { previous?: AssetTreeNode; next?: AssetTreeNode; position: number; count: number };

/** The neighbours of a node under the same parent, for previous / next navigation. */
export function siblingsOf(index: AssetTreeIndex, id: string): AssetSiblings {
  const node = index[id];
  if (node === undefined) return { position: 0, count: 0 };
  const parentId = node.parentId !== null && node.parentId in index ? node.parentId : ASSET_TREE_ROOT;
  const siblings = index[parentId].children;
  const at = siblings.indexOf(id);
  return {
    previous: at > 0 ? index[siblings[at - 1]] : undefined,
    next: at < siblings.length - 1 ? index[siblings[at + 1]] : undefined,
    position: at + 1,
    count: siblings.length,
  };
}

export type FilteredAssetTree = {
  /** The index with only matches and the branches that lead to them. */
  index: AssetTreeIndex;
  /** Branches to open so every match is visible. */
  expanded: string[];
  matches: number;
};

/** Keeps nodes whose name or tag contains the query, plus their ancestors. An empty query keeps everything. */
export function filterAssetTree(index: AssetTreeIndex, query: string): FilteredAssetTree {
  const needle = query.trim().toLowerCase();
  const all = Object.keys(index).filter((id) => id !== ASSET_TREE_ROOT);
  if (needle === '') return { index, expanded: [], matches: all.length };

  const kept = new Set<string>([ASSET_TREE_ROOT]);
  const expanded = new Set<string>();
  let matches = 0;
  for (const id of all) {
    const node = index[id];
    if (!`${node.name} ${node.tag}`.toLowerCase().includes(needle)) continue;
    matches += 1;
    const path = pathTo(index, id);
    path.forEach((step) => kept.add(step.id));
    path.slice(0, -1).forEach((step) => expanded.add(step.id));
  }

  const filtered: AssetTreeIndex = {};
  for (const id of kept) {
    filtered[id] = { ...index[id], children: index[id].children.filter((child) => kept.has(child)) };
  }
  return { index: filtered, expanded: [...expanded], matches };
}
