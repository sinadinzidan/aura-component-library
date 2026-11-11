import type { StatusTone } from '../tones';

/**
 * The asset hierarchy the structure explorers walk — fleet → site → area → unit → tag — built
 * once from flat asset, sensor and alarm records. Every node carries its state as a tone plus the
 * word that goes with it, a 0–100 score and the alarms raised on or below it.
 */

export const TREE_LEVELS = ['fleet', 'site', 'area', 'unit', 'tag'] as const;
export type TreeLevel = (typeof TREE_LEVELS)[number];

export const TREE_LEVEL_LABEL: Record<TreeLevel, string> = {
  fleet: 'Fleet',
  site: 'Site',
  area: 'Area',
  unit: 'Unit',
  tag: 'Tag',
};

export const TREE_LEVEL_PLURAL: Record<TreeLevel, string> = {
  fleet: 'fleets',
  site: 'sites',
  area: 'areas',
  unit: 'units',
  tag: 'tags',
};

export type TreeAsset = {
  id: string;
  tag: string;
  name: string;
  type: string;
  parentId: string | null;
  state: 'running' | 'standby' | 'stopped' | 'tripped' | 'maintenance';
  health: 'good' | 'watch' | 'poor';
  /** 0–100. */
  healthScore: number;
  criticality?: string;
};

export type TreeSensor = {
  id: string;
  tag: string;
  name: string;
  assetId: string;
  unit: string;
  value: number;
  lowLimit: number;
  highLimit: number;
  highHighLimit?: number;
  rangeMin: number;
  rangeMax: number;
  decimals: number;
  quality: 'good' | 'uncertain' | 'bad';
  seed: number;
};

export type TreeAlarm = {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  sensorTag: string;
  assetId: string;
  state: 'active' | 'acknowledged' | 'cleared' | 'shelved';
  raisedAt: number;
  value: string;
  limit: string;
};

export type TreeNode = {
  id: string;
  level: TreeLevel;
  tag: string;
  name: string;
  /** Asset type (`compressor`, `pump`, …) or `sensor`. */
  kind: string;
  parentId: string | null;
  tone: StatusTone;
  /** The word that goes with the tone: "Running", "Tripped", "Above high limit". */
  stateLabel: string;
  /** Health for assets; margin to the nearest limit for tags. 0–100, higher is better. */
  score: number;
  asset?: TreeAsset;
  sensor?: TreeSensor;
  /** Alarms on the node or anything below it, newest first. */
  alarms: readonly TreeAlarm[];
  openAlarms: number;
  children: readonly TreeNode[];
};

export type AssetTree = { root: TreeNode; byId: ReadonlyMap<string, TreeNode> };

export type AssetTreeInput = {
  assets: readonly TreeAsset[];
  sensors: readonly TreeSensor[];
  alarms?: readonly TreeAlarm[];
  /** Level per asset depth, from the root down. Assets deeper than the list are units. */
  levels?: readonly Exclude<TreeLevel, 'tag'>[];
};

const TONE_RANK: Record<StatusTone, number> = { neutral: 0, success: 0, info: 1, warning: 2, critical: 3 };

export const isAbnormal = (tone: StatusTone): boolean => tone === 'warning' || tone === 'critical';

export const isOpenAlarm = (alarm: Pick<TreeAlarm, 'state'>): boolean => alarm.state === 'active' || alarm.state === 'acknowledged';

/** How far a value sits from the middle of its band towards a limit: 0 dead centre, 100 on or past a limit. */
export function limitProximity(value: number, low: number, high: number): number {
  const half = (high - low) / 2;
  if (half <= 0) return 0;
  return Math.round(Math.min(1, Math.abs(value - (low + high) / 2) / half) * 100);
}

/** State of a tag from its signal quality, its limits and any open alarm on it. */
export function sensorState(sensor: TreeSensor, open: readonly Pick<TreeAlarm, 'severity'>[] = []): { tone: StatusTone; label: string } {
  if (sensor.quality === 'bad') return { tone: 'critical', label: 'Bad signal' };
  if (sensor.highHighLimit !== undefined && sensor.value >= sensor.highHighLimit) return { tone: 'critical', label: 'Trip limit exceeded' };
  if (sensor.value > sensor.highLimit) return { tone: 'warning', label: 'Above high limit' };
  if (sensor.value < sensor.lowLimit) return { tone: 'warning', label: 'Below low limit' };
  if (open.some((alarm) => alarm.severity === 'critical')) return { tone: 'critical', label: 'In alarm' };
  if (open.some((alarm) => alarm.severity === 'high' || alarm.severity === 'medium')) return { tone: 'warning', label: 'In alarm' };
  if (sensor.quality === 'uncertain') return { tone: 'warning', label: 'Uncertain signal' };
  return { tone: 'success', label: 'Normal' };
}

/** State of a unit: its run state, raised to a warning or critical tone when it is degraded. */
export function unitState(asset: Pick<TreeAsset, 'state' | 'health'>): { tone: StatusTone; label: string } {
  if (asset.state === 'tripped') return { tone: 'critical', label: 'Tripped' };
  if (asset.health === 'poor') return { tone: 'critical', label: 'Poor health' };
  if (asset.state === 'maintenance') return { tone: 'warning', label: 'Maintenance' };
  if (asset.health === 'watch') return { tone: 'warning', label: 'Watch' };
  if (asset.state === 'standby') return { tone: 'info', label: 'Standby' };
  if (asset.state === 'stopped') return { tone: 'neutral', label: 'Stopped' };
  return { tone: 'success', label: 'Running' };
}

/** State of a group: the worst state below it and how many children it concerns. */
export function groupState(children: readonly Pick<TreeNode, 'tone'>[]): { tone: StatusTone; label: string } {
  const worst = children.reduce<StatusTone>((tone, child) => (TONE_RANK[child.tone] > TONE_RANK[tone] ? child.tone : tone), 'success');
  if (!isAbnormal(worst)) return { tone: 'success', label: 'Normal' };
  const count = children.filter((child) => isAbnormal(child.tone)).length;
  return { tone: worst, label: `${count} of ${children.length} need attention` };
}

const newestFirst = (alarms: readonly TreeAlarm[]): TreeAlarm[] => [...alarms].sort((a, b) => b.raisedAt - a.raisedAt);

/** Builds the tree from the first asset without a parent. Throws when there is none. */
export function buildAssetTree(input: AssetTreeInput): AssetTree {
  const { assets, sensors, alarms = [], levels = ['site', 'area', 'unit'] } = input;
  const rootAsset = assets.find((asset) => asset.parentId === null);
  if (!rootAsset) throw new Error('buildAssetTree: no root asset');
  const byId = new Map<string, TreeNode>();

  const buildSensor = (sensor: TreeSensor): TreeNode => {
    const own = newestFirst(alarms.filter((alarm) => alarm.sensorTag === sensor.tag));
    const open = own.filter(isOpenAlarm);
    const state = sensorState(sensor, open);
    const node: TreeNode = {
      id: sensor.id,
      level: 'tag',
      tag: sensor.tag,
      name: sensor.name,
      kind: 'sensor',
      parentId: sensor.assetId,
      tone: state.tone,
      stateLabel: state.label,
      score: sensor.quality === 'bad' ? 0 : 100 - limitProximity(sensor.value, sensor.lowLimit, sensor.highLimit),
      sensor,
      alarms: own,
      openAlarms: open.length,
      children: [],
    };
    byId.set(node.id, node);
    return node;
  };

  const buildAsset = (asset: TreeAsset, depth: number): TreeNode => {
    const level = levels[depth] ?? 'unit';
    const below = assets.filter((candidate) => candidate.parentId === asset.id);
    const children = level === 'unit' ? sensors.filter((sensor) => sensor.assetId === asset.id).map(buildSensor) : below.map((child) => buildAsset(child, depth + 1));
    const own = alarms.filter((alarm) => alarm.assetId === asset.id);
    const nodeAlarms = level === 'unit' ? newestFirst(own) : newestFirst(children.flatMap((child) => child.alarms));
    const state = level === 'unit' ? unitState(asset) : children.length > 0 ? groupState(children) : unitState({ state: asset.state, health: asset.health });
    const node: TreeNode = {
      id: asset.id,
      level,
      tag: asset.tag,
      name: asset.name,
      kind: asset.type,
      parentId: depth === 0 ? null : asset.parentId,
      tone: state.tone,
      stateLabel: state.label,
      score: asset.healthScore,
      asset,
      alarms: nodeAlarms,
      openAlarms: nodeAlarms.filter(isOpenAlarm).length,
      children,
    };
    byId.set(node.id, node);
    return node;
  };

  return { root: buildAsset(rootAsset, 0), byId };
}

/** The nodes from the root down to `id`, both included. Empty when the id is unknown. */
export function pathTo(tree: AssetTree, id: string): TreeNode[] {
  const path: TreeNode[] = [];
  let node = tree.byId.get(id);
  while (node) {
    path.unshift(node);
    node = node.parentId === null ? undefined : tree.byId.get(node.parentId);
  }
  return path[0]?.id === tree.root.id ? path : [];
}

/** Every node at `level` on or below `node`. */
export function nodesAt(node: TreeNode, level: TreeLevel): TreeNode[] {
  if (node.level === level) return [node];
  return node.children.flatMap((child) => nodesAt(child, level));
}

/** Number of leaves under a node; a node without children counts as one. */
export function leafCount(node: TreeNode): number {
  if (node.children.length === 0) return 1;
  return node.children.reduce((total, child) => total + leafCount(child), 0);
}

/** "5 units", "1 tag", "Nothing below": what sits directly under a node. */
export function childSummary(node: TreeNode): string {
  const first = node.children[0];
  if (!first) return node.level === 'tag' ? 'Measurement' : 'Nothing below';
  const count = node.children.length;
  return `${count} ${count === 1 ? TREE_LEVEL_LABEL[first.level].toLowerCase() : TREE_LEVEL_PLURAL[first.level]}`;
}
