import type { BarrierState } from '../domains/safety';
import { worstBarrierState } from '../domains/safety';

/**
 * The bow-tie model and its geometry. A bow-tie puts one top event in the centre, the threats
 * that can cause it on the left and its consequences on the right; every path between them
 * carries the barriers that stop it. Everything here is pure: the model in, boxes and lines out.
 */

export type BarrierType = 'engineered' | 'procedural' | 'human';

export const BARRIER_TYPES: readonly BarrierType[] = ['engineered', 'procedural', 'human'];

export const BARRIER_TYPE_LABEL: Record<BarrierType, string> = {
  engineered: 'Engineered',
  procedural: 'Procedural',
  human: 'Human',
};

export type BowTieBarrier = {
  id: string;
  name: string;
  type: BarrierType;
  state: BarrierState;
  /** A condition that can defeat the barrier, drawn under it. */
  escalation?: string;
};

export type BowTieSeverity = 'minor' | 'major' | 'severe';

export type BowTiePath = {
  id: string;
  name: string;
  /** Barriers along the path, in the order the event meets them. */
  barrierIds: readonly string[];
  /** Consequences only. */
  severity?: BowTieSeverity;
};

export type BowTieModel = {
  hazard: string;
  topEvent: string;
  barriers: readonly BowTieBarrier[];
  threats: readonly BowTiePath[];
  consequences: readonly BowTiePath[];
};

export type BowTieSide = 'threat' | 'consequence';

export type Box = { x: number; y: number; width: number; height: number };

export type PathNode = Box & { id: string; side: BowTieSide; lines: string[]; severity?: BowTieSeverity };

export type BarrierNode = Box & {
  /** Unique per placement: a barrier shared by two paths is drawn twice. */
  key: string;
  pathId: string;
  side: BowTieSide;
  barrier: BowTieBarrier;
  lines: string[];
  escalation?: Box & { lines: string[] };
};

export type PathLine = { id: string; side: BowTieSide; d: string };

export type BowTieLayout = {
  width: number;
  height: number;
  hazard: Box & { lines: string[] };
  topEvent: Box & { lines: string[] };
  threats: PathNode[];
  consequences: PathNode[];
  barriers: BarrierNode[];
  lines: PathLine[];
};

export type BowTieMetrics = {
  pathWidth: number;
  pathHeight: number;
  barrierWidth: number;
  barrierHeight: number;
  slotGap: number;
  /** Space between a threat or consequence box and its nearest barrier slot. */
  lead: number;
  /** Horizontal run of the converging part of a path. */
  knee: number;
  eventWidth: number;
  eventHeight: number;
  hazardHeight: number;
  rowGap: number;
  escalationHeight: number;
  escalationGap: number;
  padding: number;
  pathChars: number;
  barrierChars: number;
  /** Draw escalation factors. Off in the compact form. */
  showEscalation: boolean;
};

export const DEFAULT_METRICS: BowTieMetrics = {
  pathWidth: 164,
  pathHeight: 48,
  barrierWidth: 96,
  barrierHeight: 54,
  slotGap: 10,
  lead: 14,
  knee: 60,
  eventWidth: 132,
  eventHeight: 72,
  hazardHeight: 38,
  rowGap: 14,
  escalationHeight: 34,
  escalationGap: 10,
  padding: 8,
  pathChars: 26,
  barrierChars: 16,
  showEscalation: true,
};

/** Barriers shrink to a state mark; labels move to the legend and the summary table. */
export const COMPACT_METRICS: BowTieMetrics = {
  ...DEFAULT_METRICS,
  pathWidth: 128,
  pathHeight: 36,
  barrierWidth: 18,
  barrierHeight: 18,
  slotGap: 8,
  lead: 10,
  knee: 32,
  eventWidth: 104,
  eventHeight: 52,
  hazardHeight: 30,
  rowGap: 8,
  pathChars: 21,
  barrierChars: 0,
  showEscalation: false,
};

/**
 * Breaks a label into at most `maxLines` lines of about `maxChars` characters, on spaces. Text
 * that does not fit ends in an ellipsis; a single word longer than a line is kept whole.
 */
export function wrapLabel(text: string, maxChars: number, maxLines = 2): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0 || maxChars <= 0 || maxLines <= 0) return [];
  const lines: string[] = [];
  let current = '';
  let consumed = 0;
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars || !current) {
      current = candidate;
      consumed += 1;
      continue;
    }
    if (lines.length === maxLines - 1) break;
    lines.push(current);
    current = word;
    consumed += 1;
  }
  lines.push(current);
  if (consumed < words.length) lines[lines.length - 1] = `${lines[lines.length - 1].replace(/[.,;:]$/, '')}…`;
  return lines;
}

const byId = (model: BowTieModel): Map<string, BowTieBarrier> => new Map(model.barriers.map((barrier) => [barrier.id, barrier]));

/** The barriers of one path, in order. Unknown ids are skipped. */
export function barriersOf(model: BowTieModel, path: BowTiePath): BowTieBarrier[] {
  const lookup = byId(model);
  return path.barrierIds.flatMap((id) => {
    const barrier = lookup.get(id);
    return barrier ? [barrier] : [];
  });
}

/** The worst barrier state on a path. A path without barriers counts as impaired: nothing stops it. */
export function pathState(model: BowTieModel, path: BowTiePath): BarrierState {
  const barriers = barriersOf(model, path);
  if (barriers.length === 0) return 'impaired';
  return worstBarrierState(barriers.map((barrier) => barrier.state));
}

/** The model with only the threats and consequences whose path has a weakened barrier. */
export function weakenedPaths(model: BowTieModel): BowTieModel {
  const weakened = (path: BowTiePath): boolean => pathState(model, path) !== 'healthy';
  return { ...model, threats: model.threats.filter(weakened), consequences: model.consequences.filter(weakened) };
}

export type PathStrength = {
  id: string;
  name: string;
  side: BowTieSide;
  total: number;
  healthy: number;
  degraded: number;
  impaired: number;
  /** `unprotected` no healthy barrier left; `single` one; `weakened` several but not all; `intact` all. */
  level: 'intact' | 'weakened' | 'single' | 'unprotected';
};

/** How much protection is left on every path: the count of barriers per state and a level. */
export function pathStrengths(model: BowTieModel): PathStrength[] {
  const describe = (path: BowTiePath, side: BowTieSide): PathStrength => {
    const states = barriersOf(model, path).map((barrier) => barrier.state);
    const healthy = states.filter((state) => state === 'healthy').length;
    const degraded = states.filter((state) => state === 'degraded').length;
    const impaired = states.filter((state) => state === 'impaired').length;
    const level = healthy === 0 ? 'unprotected' : healthy === states.length ? 'intact' : healthy === 1 ? 'single' : 'weakened';
    return { id: path.id, name: path.name, side, total: states.length, healthy, degraded, impaired, level };
  };
  return [...model.threats.map((path) => describe(path, 'threat')), ...model.consequences.map((path) => describe(path, 'consequence'))];
}

export type CoverageMatrix = {
  barriers: BowTieBarrier[];
  rows: { path: BowTiePath; cells: (BarrierState | null)[]; healthy: number }[];
};

/** Paths against barriers: each cell holds the barrier's state when it sits on that path, else `null`. */
export function barrierCoverage(model: BowTieModel, side: BowTieSide): CoverageMatrix {
  const paths = side === 'threat' ? model.threats : model.consequences;
  const used = new Set(paths.flatMap((path) => path.barrierIds));
  const barriers = model.barriers.filter((barrier) => used.has(barrier.id));
  return {
    barriers,
    rows: paths.map((path) => {
      const cells = barriers.map((barrier) => (path.barrierIds.includes(barrier.id) ? barrier.state : null));
      return { path, cells, healthy: cells.filter((cell) => cell === 'healthy').length };
    }),
  };
}

const round = (value: number): number => Math.round(value * 100) / 100;

function hasEscalation(model: BowTieModel, path: BowTiePath): boolean {
  return barriersOf(model, path).some((barrier) => barrier.escalation !== undefined);
}

/**
 * Lays the bow-tie out in diagram units. Threats stack on the left and consequences on the
 * right, each column centred on the top event; barriers take fixed slots along the horizontal
 * run of their path, nearest the threat or consequence they belong to; the paths then converge
 * on the top event. A row grows when one of its barriers carries an escalation factor.
 */
export function bowTieLayout(model: BowTieModel, metrics: BowTieMetrics = DEFAULT_METRICS): BowTieLayout {
  const m = metrics;
  const slots = Math.max(1, ...model.threats.map((path) => barriersOf(model, path).length), ...model.consequences.map((path) => barriersOf(model, path).length));
  const lane = slots * m.barrierWidth + (slots - 1) * m.slotGap;
  const sideWidth = m.pathWidth + m.lead + lane + m.lead + m.knee;
  const width = m.padding * 2 + sideWidth * 2 + m.eventWidth;

  const rowHeight = (path: BowTiePath): number => {
    const extra = m.showEscalation && hasEscalation(model, path) ? m.escalationGap + m.escalationHeight : 0;
    return Math.max(m.pathHeight, m.barrierHeight) + extra;
  };
  const columnHeight = (paths: readonly BowTiePath[]): number => paths.reduce((sum, path) => sum + rowHeight(path), 0) + Math.max(paths.length - 1, 0) * m.rowGap;

  const hazardBlock = m.eventHeight / 2 + m.rowGap + m.hazardHeight;
  const height = round(Math.max(columnHeight(model.threats), columnHeight(model.consequences), hazardBlock * 2) + m.padding * 2);
  const centreY = height / 2;

  const eventX = m.padding + sideWidth;
  const topEvent = { x: eventX, y: round(centreY - m.eventHeight / 2), width: m.eventWidth, height: m.eventHeight, lines: wrapLabel(model.topEvent, Math.max(8, Math.floor(m.eventWidth / 7)), 3) };
  const hazardWidth = m.eventWidth;
  const hazard = { x: eventX, y: round(topEvent.y - m.rowGap - m.hazardHeight), width: hazardWidth, height: m.hazardHeight, lines: wrapLabel(model.hazard, Math.max(8, Math.floor(hazardWidth / 6.5)), 2) };

  const threats: PathNode[] = [];
  const consequences: PathNode[] = [];
  const barriers: BarrierNode[] = [];
  const lines: PathLine[] = [];
  const rowBody = Math.max(m.pathHeight, m.barrierHeight);

  const place = (paths: readonly BowTiePath[], side: BowTieSide) => {
    let top = round(centreY - columnHeight(paths) / 2);
    for (const path of paths) {
      const rowCentre = top + rowBody / 2;
      const pathX = side === 'threat' ? m.padding : width - m.padding - m.pathWidth;
      const node: PathNode = { id: path.id, side, x: pathX, y: round(rowCentre - m.pathHeight / 2), width: m.pathWidth, height: m.pathHeight, lines: wrapLabel(path.name, m.pathChars, 2), severity: path.severity };
      (side === 'threat' ? threats : consequences).push(node);

      const onPath = barriersOf(model, path);
      onPath.forEach((barrier, index) => {
        // Threat side: slot 0 is next to the threat. Consequence side: the last barrier is next to the consequence.
        const slot = side === 'threat' ? index : slots - onPath.length + index;
        const laneStart = side === 'threat' ? m.padding + m.pathWidth + m.lead : eventX + m.eventWidth + m.knee + m.lead;
        const x = laneStart + slot * (m.barrierWidth + m.slotGap);
        const y = round(rowCentre - m.barrierHeight / 2);
        const escalation =
          m.showEscalation && barrier.escalation !== undefined
            ? { x, y: round(y + m.barrierHeight + m.escalationGap), width: m.barrierWidth, height: m.escalationHeight, lines: wrapLabel(barrier.escalation, m.barrierChars + 1, 2) }
            : undefined;
        barriers.push({ key: `${path.id}:${barrier.id}`, pathId: path.id, side, barrier, x, y, width: m.barrierWidth, height: m.barrierHeight, lines: wrapLabel(barrier.name, m.barrierChars, 2), escalation });
      });

      const y = round(rowCentre);
      const d =
        side === 'threat'
          ? `M ${pathX + m.pathWidth} ${y} H ${eventX - m.knee} L ${eventX} ${round(centreY)}`
          : `M ${eventX + m.eventWidth} ${round(centreY)} L ${eventX + m.eventWidth + m.knee} ${y} H ${pathX}`;
      lines.push({ id: path.id, side, d });
      top = round(top + rowHeight(path) + m.rowGap);
    }
  };

  place(model.threats, 'threat');
  place(model.consequences, 'consequence');

  return { width: round(width), height, hazard, topEvent, threats, consequences, barriers, lines };
}

export type SummaryRow = {
  side: BowTieSide;
  pathId: string;
  path: string;
  severity?: BowTieSeverity;
  barriers: BowTieBarrier[];
  state: BarrierState;
};

/** The bow-tie as rows, for a table that screen readers and printers can use instead of the drawing. */
export function bowTieSummary(model: BowTieModel): SummaryRow[] {
  const row = (path: BowTiePath, side: BowTieSide): SummaryRow => ({
    side,
    pathId: path.id,
    path: path.name,
    severity: path.severity,
    barriers: barriersOf(model, path),
    state: pathState(model, path),
  });
  return [...model.threats.map((path) => row(path, 'threat')), ...model.consequences.map((path) => row(path, 'consequence'))];
}
