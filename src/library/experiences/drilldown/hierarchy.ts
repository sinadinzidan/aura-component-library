import { toneFromLimits } from '../../industrial/status';
import type { Health, Limits, RunState, Severity, SignalQuality, StatusDescriptor, Tone } from '../../industrial/status';

/**
 * The typed node tree every drill-down journey walks: site → area → equipment → sensor. Built once
 * from flat asset, sensor and alarm records, with the state, headline figure, roll-up metrics,
 * trend and alarms each level needs already attached to its node.
 */

export const DRILL_LEVELS = ['site', 'area', 'equipment', 'sensor'] as const;
export type DrillLevel = (typeof DRILL_LEVELS)[number];

export const LEVEL_LABEL: Record<DrillLevel, string> = {
  site: 'Site',
  area: 'Area',
  equipment: 'Equipment',
  sensor: 'Sensor',
};

/** What the children of a level are called, for counts and empty states. */
export const LEVEL_PLURAL: Record<DrillLevel, string> = {
  site: 'sites',
  area: 'areas',
  equipment: 'equipment',
  sensor: 'sensors',
};

export type DrillPoint = { t: number; v: number };

export type DrillAlarm = {
  id: string;
  severity: Severity;
  message: string;
  sensorTag: string;
  assetId: string;
  state: 'active' | 'acknowledged' | 'cleared' | 'shelved';
  raisedAt: number;
  value: string;
  limit: string;
};

/** The one number a node leads with: a health score for assets, the live value for a sensor. */
export type DrillFigure = { label: string; value: number | null; unit?: string; decimals: number; tone: Tone };

/** A sensor's measurement with the scale it is judged against. */
export type DrillReading = {
  value: number | null;
  unit: string;
  decimals: number;
  limits: Limits;
  rangeMin: number;
  rangeMax: number;
  quality: SignalQuality;
};

export type DrillNode = {
  id: string;
  level: DrillLevel;
  tag: string;
  name: string;
  parentId: string | null;
  /** Asset type (`compressor`, `pump`, …) or `sensor`. */
  kind: string;
  /** Neutral while normal; a tone only for an abnormal state, always with a label and a shape. */
  status: StatusDescriptor;
  figure: DrillFigure;
  healthScore?: number;
  runState?: RunState;
  reading?: DrillReading;
  /** Own value on equipment and sensors; the sum of the children on areas and sites. */
  metrics: Readonly<Record<string, number>>;
  /** Trend behind the headline figure, oldest first. */
  series: readonly DrillPoint[];
  /** Alarms raised on the node or anything below it, newest first. */
  alarms: readonly DrillAlarm[];
  children: readonly DrillNode[];
};

export type DrillTree = { root: DrillNode; byId: ReadonlyMap<string, DrillNode> };

export type HierarchyAsset = {
  id: string;
  tag: string;
  name: string;
  type: string;
  parentId: string | null;
  state: RunState;
  health: Health;
  healthScore: number;
};

export type HierarchySensor = {
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
  quality: SignalQuality;
};

export type HierarchyInput = {
  assets: readonly HierarchyAsset[];
  sensors: readonly HierarchySensor[];
  alarms?: readonly DrillAlarm[];
  /** Extra metrics per equipment or sensor id, e.g. `{ '23-ka-9103': { downtimeHours: 41 } }`. */
  metrics?: Readonly<Record<string, Readonly<Record<string, number>>>>;
  /** Trend per node id, oldest first. */
  series?: Readonly<Record<string, readonly DrillPoint[]>>;
  /** Asset to start from. Defaults to the first asset without a parent. */
  rootId?: string;
};

/** Metrics the builder always computes. */
export const OPEN_ALARMS_METRIC = 'openAlarms';
export const HEALTH_DEFICIT_METRIC = 'healthDeficit';

const TONE_RANK: Record<Tone, number> = { neutral: 0, success: 0, info: 1, warning: 2, critical: 3 };

/** The most severe tone in a list; neutral for an empty list. */
export function worstTone(tones: readonly Tone[]): Tone {
  return tones.reduce<Tone>((worst, tone) => (TONE_RANK[tone] > TONE_RANK[worst] ? tone : worst), 'neutral');
}

export const isAbnormal = (tone: Tone): boolean => tone === 'warning' || tone === 'critical';

export const isOpen = (alarm: Pick<DrillAlarm, 'state'>): boolean => alarm.state === 'active' || alarm.state === 'acknowledged';

/**
 * How far a value has moved from the middle of its operating band towards a limit, 0–100.
 * 0 is dead centre, 100 is on or beyond a limit.
 */
export function limitProximity(value: number, low: number, high: number): number {
  const half = (high - low) / 2;
  if (half <= 0) return 0;
  const distance = Math.abs(value - (low + high) / 2) / half;
  return Math.round(Math.min(1, distance) * 100);
}

/** State of a sensor from its signal quality, its limits and any open alarm on its tag. */
export function sensorStatus(sensor: HierarchySensor, openAlarms: readonly Pick<DrillAlarm, 'severity'>[] = []): StatusDescriptor {
  if (sensor.quality === 'bad') return { tone: 'critical', label: 'Bad signal', shape: 'diamond' };
  const limitTone = toneFromLimits(sensor.value, { low: sensor.lowLimit, high: sensor.highLimit, highHigh: sensor.highHighLimit });
  if (limitTone === 'critical') return { tone: 'critical', label: 'Trip limit exceeded', shape: 'diamond' };
  if (limitTone === 'warning') {
    return { tone: 'warning', label: sensor.value > sensor.highLimit ? 'Above high limit' : 'Below low limit', shape: 'square' };
  }
  if (openAlarms.some((alarm) => alarm.severity === 'critical')) return { tone: 'critical', label: 'In alarm', shape: 'diamond' };
  if (openAlarms.some((alarm) => alarm.severity === 'high' || alarm.severity === 'medium')) {
    return { tone: 'warning', label: 'In alarm', shape: 'square' };
  }
  if (sensor.quality === 'uncertain') return { tone: 'warning', label: 'Uncertain signal', shape: 'ring' };
  return { tone: 'neutral', label: 'Normal', shape: 'dot' };
}

const RUN_LABEL: Record<RunState, string> = {
  running: 'Running',
  standby: 'Standby',
  stopped: 'Stopped',
  tripped: 'Tripped',
  maintenance: 'Maintenance',
};

/** State of a piece of equipment: its run state, coloured only when it is tripped, out or degraded. */
export function equipmentStatus(asset: Pick<HierarchyAsset, 'state' | 'health'>): StatusDescriptor {
  if (asset.state === 'tripped') return { tone: 'critical', label: 'Tripped', shape: 'diamond' };
  if (asset.health === 'poor') return { tone: 'critical', label: `${RUN_LABEL[asset.state]}, poor health`, shape: 'diamond' };
  if (asset.state === 'maintenance') return { tone: 'warning', label: 'Maintenance', shape: 'square' };
  if (asset.health === 'watch') return { tone: 'warning', label: `${RUN_LABEL[asset.state]}, watch`, shape: 'square' };
  if (asset.state === 'standby') return { tone: 'neutral', label: 'Standby', shape: 'ring' };
  if (asset.state === 'stopped') return { tone: 'neutral', label: 'Stopped', shape: 'square' };
  return { tone: 'neutral', label: 'Running', shape: 'dot' };
}

/** State of a site or area: the worst state below it, with how many children it concerns. */
export function groupStatus(children: readonly Pick<DrillNode, 'status'>[]): StatusDescriptor {
  const tone = worstTone(children.map((child) => child.status.tone));
  const abnormal = children.filter((child) => isAbnormal(child.status.tone)).length;
  if (!isAbnormal(tone)) return { tone: 'neutral', label: 'Normal', shape: 'dot' };
  return {
    tone,
    label: `${abnormal} of ${children.length} need attention`,
    shape: tone === 'critical' ? 'diamond' : 'square',
  };
}

const healthTone = (health: Health): Tone => (health === 'poor' ? 'critical' : health === 'watch' ? 'warning' : 'neutral');

const newestFirst = (alarms: readonly DrillAlarm[]): DrillAlarm[] => [...alarms].sort((a, b) => b.raisedAt - a.raisedAt);

function sumMetrics(children: readonly DrillNode[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const child of children) {
    for (const [key, value] of Object.entries(child.metrics)) totals[key] = (totals[key] ?? 0) + value;
  }
  return totals;
}

/**
 * Builds the tree. Assets become site (the root), area (its children) and equipment (everything
 * deeper); sensors hang under their asset. Throws when there is no root asset.
 */
export function buildHierarchy(input: HierarchyInput): DrillTree {
  const { assets, sensors, alarms = [], metrics = {}, series = {} } = input;
  const rootAsset = input.rootId ? assets.find((asset) => asset.id === input.rootId) : assets.find((asset) => asset.parentId === null);
  if (!rootAsset) throw new Error('buildHierarchy: no root asset');

  const byId = new Map<string, DrillNode>();

  const buildSensor = (sensor: HierarchySensor): DrillNode => {
    const own = alarms.filter((alarm) => alarm.sensorTag === sensor.tag);
    const status = sensorStatus(sensor, own.filter(isOpen));
    const value = sensor.quality === 'bad' ? null : sensor.value;
    const node: DrillNode = {
      id: sensor.id,
      level: 'sensor',
      tag: sensor.tag,
      name: sensor.name,
      parentId: sensor.assetId,
      kind: 'sensor',
      status,
      figure: { label: sensor.name, value, unit: sensor.unit, decimals: sensor.decimals, tone: status.tone },
      reading: {
        value,
        unit: sensor.unit,
        decimals: sensor.decimals,
        limits: { low: sensor.lowLimit, high: sensor.highLimit, highHigh: sensor.highHighLimit },
        rangeMin: sensor.rangeMin,
        rangeMax: sensor.rangeMax,
        quality: sensor.quality,
      },
      metrics: {
        ...metrics[sensor.id],
        [OPEN_ALARMS_METRIC]: own.filter(isOpen).length,
        [HEALTH_DEFICIT_METRIC]: sensor.quality === 'bad' ? 100 : limitProximity(sensor.value, sensor.lowLimit, sensor.highLimit),
      },
      series: series[sensor.id] ?? [],
      alarms: newestFirst(own),
      children: [],
    };
    byId.set(node.id, node);
    return node;
  };

  const buildAsset = (asset: HierarchyAsset, depth: number): DrillNode => {
    const level: DrillLevel = depth === 0 ? 'site' : depth === 1 ? 'area' : 'equipment';
    const isGroup = level !== 'equipment';
    const children = isGroup
      ? assets.filter((candidate) => candidate.parentId === asset.id).map((child) => buildAsset(child, depth + 1))
      : sensors.filter((sensor) => sensor.assetId === asset.id).map(buildSensor);
    const own = alarms.filter((alarm) => alarm.assetId === asset.id);
    const nodeAlarms = isGroup ? newestFirst(children.flatMap((child) => child.alarms)) : newestFirst(own);
    const node: DrillNode = {
      id: asset.id,
      level,
      tag: asset.tag,
      name: asset.name,
      parentId: depth === 0 ? null : asset.parentId,
      kind: asset.type,
      status: isGroup && children.length > 0 ? groupStatus(children) : equipmentStatus(asset),
      figure: { label: 'Health', value: asset.healthScore, unit: '%', decimals: 0, tone: healthTone(asset.health) },
      healthScore: asset.healthScore,
      runState: asset.state,
      metrics: isGroup
        ? { [OPEN_ALARMS_METRIC]: 0, [HEALTH_DEFICIT_METRIC]: 0, ...sumMetrics(children) }
        : {
            ...metrics[asset.id],
            [OPEN_ALARMS_METRIC]: own.filter(isOpen).length,
            [HEALTH_DEFICIT_METRIC]: Math.max(0, 100 - asset.healthScore),
          },
      series: series[asset.id] ?? [],
      alarms: nodeAlarms,
      children,
    };
    byId.set(node.id, node);
    return node;
  };

  return { root: buildAsset(rootAsset, 0), byId };
}

/** The nodes from the root down to `id`, both included. Empty when the id is unknown. */
export function pathTo(tree: DrillTree, id: string): DrillNode[] {
  const path: DrillNode[] = [];
  let node = tree.byId.get(id);
  while (node) {
    path.unshift(node);
    node = node.parentId === null ? undefined : tree.byId.get(node.parentId);
  }
  return path[0]?.id === tree.root.id ? path : [];
}

/** Every node below `node` at the given level. */
export function descendantsAt(node: DrillNode, level: DrillLevel): DrillNode[] {
  if (node.level === level) return [node];
  return node.children.flatMap((child) => descendantsAt(child, level));
}

/** Number of leaves under a node; a node without children counts as one. */
export function leafCount(node: DrillNode): number {
  if (node.children.length === 0) return 1;
  return node.children.reduce((total, child) => total + leafCount(child), 0);
}

export const levelIndex = (level: DrillLevel): number => DRILL_LEVELS.indexOf(level);

/** The path as text, for a path bar and the clipboard: "NK / NK-23 / 23-KA-9101". */
export function formatPath(nodes: readonly Pick<DrillNode, 'tag'>[], separator = ' / '): string {
  return nodes.map((node) => node.tag).join(separator);
}

/** A short phrase for what sits under a node: "5 equipment", "6 sensors", "1 area". */
export function childSummary(node: DrillNode): string {
  const count = node.children.length;
  const first = node.children[0];
  if (!first) return node.level === 'sensor' ? 'Measurement' : 'Nothing below';
  if (first.level === 'equipment') return `${count} equipment`;
  return `${count} ${count === 1 ? LEVEL_LABEL[first.level].toLowerCase() : LEVEL_PLURAL[first.level]}`;
}
