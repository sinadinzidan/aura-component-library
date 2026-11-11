import { Button } from '@cognite/aura/components/button';
import { IconArrowBackUp, IconChevronRight, IconZoomIn } from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { squarify } from '../../../library/experiences/drilldown/treemapLayout';
import { Bars } from '../../../library/kit/Bars';
import { Canvas } from '../../../library/kit/Canvas';
import { Legend, type LegendItem } from '../../../library/kit/Legend';
import { buildAssetTree, nodesAt, pathTo, type TreeNode } from '../../../library/kit/miller-columns/assetTree';
import { EXTRA_SENSORS } from '../../../library/kit/miller-columns/plantFixture';
import { Panel } from '../../../library/kit/Panel';
import { Stat } from '../../../library/kit/Stat';
import { formatNumber, type StatusTone } from '../../../library/kit/tones';
import { LookScope } from '../../../library/looks/LookScope';
import { ALARMS, ASSETS, SENSORS } from '../../data/plant';
import { definePage } from '../../types';

import source from './treemap-explorer.tsx?raw';

type TreemapMetricId = 'production' | 'energy' | 'cost' | 'downtime';

type TreemapMetric = {
  id: TreemapMetricId;
  label: string;
  unit: string;
  decimals: number;
  /** Completes "<name> <verb> 45 % of <noun>". */
  verb: string;
  noun: string;
};

const TREEMAP_METRICS: readonly TreemapMetric[] = [
  { id: 'production', label: 'Production at stake', unit: 'kboe/d', decimals: 1, verb: 'holds', noun: 'the production at stake' },
  { id: 'energy', label: 'Power draw', unit: 'MW', decimals: 1, verb: 'draws', noun: 'the power' },
  { id: 'cost', label: 'Maintenance spend', unit: 'kNOK', decimals: 0, verb: 'takes', noun: 'the maintenance spend' },
  { id: 'downtime', label: 'Downtime, 30 days', unit: 'h', decimals: 0, verb: 'caused', noun: 'the downtime' },
];

/** What each unit accounts for. Production is what stops if the unit stops, so shared paths count twice. */
const TREEMAP_UNIT_METRICS: Record<string, Record<TreemapMetricId, number>> = {
  '20-va-1001': { production: 27.5, energy: 0.4, cost: 86, downtime: 2 },
  '20-va-1002': { production: 1.8, energy: 0.1, cost: 22, downtime: 0 },
  '20-xv-1105': { production: 27.5, energy: 0.1, cost: 41, downtime: 1 },
  '23-ka-9101': { production: 14.2, energy: 8.6, cost: 412, downtime: 9 },
  '23-ka-9102': { production: 14.2, energy: 7.9, cost: 188, downtime: 3 },
  '23-ka-9103': { production: 3.6, energy: 2.2, cost: 640, downtime: 41 },
  '23-ha-9114': { production: 14.2, energy: 0.6, cost: 254, downtime: 6 },
  '23-gt-9001': { production: 14.2, energy: 1.1, cost: 310, downtime: 4 },
  '27-pa-2001a': { production: 6.4, energy: 1.8, cost: 64, downtime: 1 },
  '27-pa-2001b': { production: 3.2, energy: 0.2, cost: 38, downtime: 0 },
  '40-pa-4001': { production: 9.8, energy: 1.4, cost: 147, downtime: 18 },
};

const TREEMAP_TREE = buildAssetTree({ assets: ASSETS, sensors: [...SENSORS, ...EXTRA_SENSORS], alarms: ALARMS });

const TREEMAP_UNITS = nodesAt(TREEMAP_TREE.root, 'unit');

const TREEMAP_HEALTH_LEGEND: readonly LegendItem[] = [
  { label: 'Good', tone: 'success' },
  { label: 'Watch', tone: 'warning' },
  { label: 'Poor or tripped', tone: 'critical' },
];

const TREEMAP_INK = 'border-[color:var(--kit-text)]';

function treemapMetric(id: TreemapMetricId): TreemapMetric {
  return TREEMAP_METRICS.find((metric) => metric.id === id) ?? { id, label: id, unit: '', decimals: 0, verb: 'holds', noun: 'the total' };
}

/** A node's figure for a metric: its own for a unit, the sum of its units for an area or the plant. */
function treemapValue(node: TreeNode, metric: TreemapMetricId): number {
  if (node.level === 'unit') return TREEMAP_UNIT_METRICS[node.id]?.[metric] ?? 0;
  return nodesAt(node, 'unit').reduce((total, unit) => total + treemapValue(unit, metric), 0);
}

/** Health as a block colour: standby and stopped units are healthy, just not running. */
function treemapTone(node: TreeNode): StatusTone {
  return node.tone === 'critical' || node.tone === 'warning' ? node.tone : 'success';
}

function treemapShare(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

type TreemapBlock = {
  id: string;
  name: string;
  tag: string;
  /** What the block is sized by. */
  value: number;
  /** The figure printed on it. */
  figure: string;
  unit: string;
  tone: StatusTone;
  word: string;
};

function treemapBlocks(parent: TreeNode, metric: TreemapMetric): TreemapBlock[] {
  return parent.children.map((child) => {
    if (child.sensor) {
      const sensor = child.sensor;
      return {
        id: child.id,
        name: child.name,
        tag: child.tag,
        value: 100 - child.score,
        figure: sensor.quality === 'bad' ? '—' : formatNumber(sensor.value, sensor.decimals),
        unit: sensor.unit,
        tone: treemapTone(child),
        word: child.stateLabel,
      };
    }
    return {
      id: child.id,
      name: child.name,
      tag: child.tag,
      value: treemapValue(child, metric.id),
      figure: formatNumber(treemapValue(child, metric.id), metric.decimals),
      unit: metric.unit,
      tone: treemapTone(child),
      word: child.level === 'unit' ? child.stateLabel : child.tone === 'success' ? 'Good' : child.tone === 'warning' ? 'Watch' : 'Poor',
    };
  });
}

/** One level of blocks, squarified into a box of `width` × `height` and placed in percent so it scales. */
function TreemapTiles({
  label,
  blocks,
  width,
  height,
  selectedId,
  minShare = 0.08,
  onPick,
}: {
  label: string;
  blocks: readonly TreemapBlock[];
  width: number;
  height: number;
  selectedId?: string | null;
  minShare?: number;
  onPick: (id: string) => void;
}) {
  const rects = squarify(
    blocks.map((block) => ({ id: block.id, value: block.value })),
    { x: 0, y: 0, width, height },
    { minShare }
  );

  return (
    <div role="group" aria-label={label} className="relative h-full w-full">
      {rects.map((rect) => {
        const block = blocks.find((candidate) => candidate.id === rect.id);
        if (!block) return null;
        const size = rect.width >= 285 && rect.height >= 180 ? 'lg' : rect.width >= 150 && rect.height >= 104 ? 'md' : 'sm';
        const upright = size === 'sm' && rect.width < 110 && rect.height >= 130;
        const selected = block.id === selectedId;
        return (
          <button
            key={block.id}
            type="button"
            data-tone={block.tone}
            data-block={block.id}
            aria-pressed={selected}
            aria-label={`${block.name}, ${block.figure} ${block.unit}, ${block.word}`}
            onClick={() => onPick(block.id)}
            style={{
              left: `${(rect.x / width) * 100}%`,
              top: `${(rect.y / height) * 100}%`,
              width: `${(rect.width / width) * 100}%`,
              height: `${(rect.height / height) * 100}%`,
            }}
            className={`absolute flex flex-col justify-between border bg-[var(--t-pop)] text-left text-[color:var(--t-on-pop)] outline-none ring-inset ring-[color:var(--kit-text)] focus-visible:z-10 focus-visible:ring-[5px] ${TREEMAP_INK} ${
              size === 'lg' ? 'p-4' : size === 'md' ? 'p-3' : 'p-2'
            } ${selected ? 'ring-[5px]' : 'hover:ring-[3px]'}`}
          >
            {upright ? (
              <span className="whitespace-nowrap text-xs font-bold [writing-mode:vertical-rl]">
                {block.name} · <span className="font-extrabold tabular-nums">{block.figure}</span>
              </span>
            ) : size === 'sm' ? (
              <>
                <span className="whitespace-nowrap text-xs font-bold leading-tight">{rect.width >= 150 ? block.name : block.tag}</span>
                <span className="text-sm font-extrabold tabular-nums">{block.figure}</span>
              </>
            ) : (
              <>
                <span>
                  <span className={`block font-extrabold leading-tight tracking-tight ${size === 'lg' ? 'text-xl' : 'text-sm'}`}>{block.name}</span>
                  <span className="mt-0.5 block text-xs font-bold tabular-nums">{block.tag}</span>
                </span>
                <span>
                  <span className="flex items-baseline gap-1.5">
                    <span className={`font-extrabold tracking-tighter tabular-nums ${size === 'lg' ? 'text-6xl' : 'text-3xl'}`}>{block.figure}</span>
                    <span className={`font-bold ${size === 'lg' ? 'text-base' : 'text-xs'}`}>{block.unit}</span>
                  </span>
                  <span className={`mt-1 inline-block bg-[var(--kit-text)] px-1.5 font-bold text-[color:var(--kit-surface)] ${size === 'lg' ? 'text-sm leading-6' : 'text-xs leading-5'}`}>
                    {block.word}
                  </span>
                </span>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** The plant level: one framed group per area, its units squarified inside. */
function TreemapNested({
  metric,
  width,
  height,
  selectedId,
  onPick,
  onDrill,
}: {
  metric: TreemapMetric;
  width: number;
  height: number;
  selectedId: string | null;
  onPick: (id: string) => void;
  onDrill: (id: string) => void;
}) {
  const total = treemapValue(TREEMAP_TREE.root, metric.id);
  const areas = TREEMAP_TREE.root.children;
  const rects = squarify(
    areas.map((area) => ({ id: area.id, value: treemapValue(area, metric.id) })),
    { x: 0, y: 0, width, height },
    { minShare: 0.14 }
  );
  const header = 40;

  return (
    <div className="relative h-full w-full">
      {rects.map((rect) => {
        const area = areas.find((candidate) => candidate.id === rect.id);
        if (!area) return null;
        return (
          <section
            key={area.id}
            aria-label={area.name}
            style={{
              left: `${(rect.x / width) * 100}%`,
              top: `${(rect.y / height) * 100}%`,
              width: `${(rect.width / width) * 100}%`,
              height: `${(rect.height / height) * 100}%`,
            }}
            className={`absolute flex flex-col border ${TREEMAP_INK}`}
          >
            <button
              type="button"
              onClick={() => onDrill(area.id)}
              className="flex h-10 shrink-0 items-center justify-between gap-2 bg-[var(--kit-text)] px-3 text-left text-sm font-bold text-[color:var(--kit-surface)] outline-none focus-visible:underline"
            >
              <span className="leading-tight">{rect.width >= 220 ? area.name : area.tag}</span>
              <span className="flex shrink-0 items-center gap-1 tabular-nums">
                {treemapShare(rect.value, total)} % <IconZoomIn aria-hidden="true" className="size-4" />
              </span>
            </button>
            <div className="min-h-0 flex-1">
              <TreemapTiles
                label={`${area.name} units`}
                blocks={treemapBlocks(area, metric)}
                width={rect.width}
                height={rect.height - header}
                selectedId={selectedId}
                minShare={0.12}
                onPick={onPick}
              />
            </div>
          </section>
        );
      })}
    </div>
  );
}

type TreemapExplorer = {
  metric: TreemapMetric;
  focus: TreeNode;
  selected: TreeNode;
  setMetric: (id: TreemapMetricId) => void;
  /** Click on a block: select it, or drill into it when it is already selected. */
  pick: (id: string) => void;
  drill: (id: string) => void;
  up: () => void;
};

function treemapDefaultSelection(focus: TreeNode): TreeNode {
  const candidates = focus.level === 'site' ? nodesAt(focus, 'unit') : focus.children;
  return [...candidates].sort((a, b) => a.score - b.score)[0] ?? focus;
}

function useTreemapExplorer(initialFocus: string, initialMetric: TreemapMetricId = 'production'): TreemapExplorer {
  const [metricId, setMetricId] = useState<TreemapMetricId>(initialMetric);
  const [focusId, setFocusId] = useState(initialFocus);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const focus = TREEMAP_TREE.byId.get(focusId) ?? TREEMAP_TREE.root;
  const selected = (selectedId ? TREEMAP_TREE.byId.get(selectedId) : undefined) ?? treemapDefaultSelection(focus);

  const drill = (id: string) => {
    const node = TREEMAP_TREE.byId.get(id);
    if (!node || node.children.length === 0) return;
    setFocusId(id);
    setSelectedId(null);
  };

  return {
    metric: treemapMetric(metricId),
    focus,
    selected,
    setMetric: setMetricId,
    pick: (id) => (id === selected.id && selectedId !== null ? drill(id) : setSelectedId(id)),
    drill,
    up: () => {
      if (focus.parentId === null) return;
      setSelectedId(focus.id);
      setFocusId(focus.parentId);
    },
  };
}

/** The sentence the screen leads with: who dominates the current level, in the current metric. */
function treemapHeadline(explorer: TreemapExplorer): { title: string; detail: string } {
  const { focus, metric } = explorer;
  if (focus.level === 'unit') {
    const worst = [...focus.children].sort((a, b) => a.score - b.score)[0];
    const flagged = focus.children.filter((child) => child.tone !== 'success').length;
    return {
      title: worst && worst.tone !== 'success' ? `${worst.name} is closest to a limit.` : `Every tag on the ${focus.name.toLowerCase()} has room.`,
      detail: `${focus.children.length} tags on ${focus.tag}, sized by how close each runs to a limit. ${flagged} flagged.`,
    };
  }
  const total = treemapValue(focus, metric.id);
  const top = [...focus.children].sort((a, b) => treemapValue(b, metric.id) - treemapValue(a, metric.id))[0];
  const units = nodesAt(focus, 'unit');
  const flagged = units.filter((unit) => treemapTone(unit) !== 'success').length;
  return {
    title: top ? `${top.name} ${metric.verb} ${treemapShare(treemapValue(top, metric.id), total)} % of ${metric.noun}.` : focus.name,
    detail: `${formatNumber(total, metric.decimals)} ${metric.unit} across ${units.length} units ${focus.level === 'site' ? `at ${focus.name}` : `in ${focus.name.toLowerCase()}`}. ${flagged} of them need attention.`,
  };
}

/** Size-by switch that doubles as the totals: each option carries the plant figure for its metric. */
function TreemapMetricSwitch({ value, disabled = false, onChange }: { value: TreemapMetricId; disabled?: boolean; onChange: (id: TreemapMetricId) => void }) {
  return (
    <div role="radiogroup" aria-label="Size blocks by" className={`border-2 ${TREEMAP_INK}`}>
      {TREEMAP_METRICS.map((metric) => {
        const active = metric.id === value && !disabled;
        return (
          <button
            key={metric.id}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(metric.id)}
            className={`flex w-full items-baseline justify-between gap-6 border-t-2 px-3 py-1.5 text-left text-sm font-bold first:border-t-0 disabled:opacity-50 ${TREEMAP_INK} ${
              active ? 'bg-[var(--kit-text)] text-[color:var(--kit-surface)]' : 'hover:bg-[color-mix(in_oklab,var(--kit-text)_10%,transparent)]'
            }`}
          >
            <span>{metric.label}</span>
            <span className="tabular-nums">
              {formatNumber(treemapValue(TREEMAP_TREE.root, metric.id), metric.decimals)} {metric.unit}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function TreemapCrumbs({ focus, onDrill }: { focus: TreeNode; onDrill: (id: string) => void }) {
  const trail = pathTo(TREEMAP_TREE, focus.id);
  return (
    <nav aria-label="Level">
      <ol className="flex items-center">
        {trail.map((node, index) => {
          const current = node.id === focus.id;
          return (
            <li key={node.id} className="flex items-center">
              {index > 0 ? <IconChevronRight aria-hidden="true" className="mx-1 size-4" /> : null}
              <button
                type="button"
                aria-current={current ? 'location' : undefined}
                onClick={() => onDrill(node.id)}
                className={`px-2.5 py-1 text-sm font-bold ${current ? 'bg-[var(--kit-text)] text-[color:var(--kit-surface)]' : 'underline decoration-2 underline-offset-4'}`}
              >
                {node.name}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function TreemapShareBar({ label, share, tone }: { label: string; share: number; tone: StatusTone }) {
  return (
    <div className="grid grid-cols-[9.5rem_1fr_3rem] items-center gap-3 text-sm font-bold">
      <span>{label}</span>
      <span className="block h-4 border border-current" aria-hidden="true">
        <span data-tone={tone} className="block h-full bg-[var(--t-pop)]" style={{ width: `${Math.max(share, 1)}%` }} />
      </span>
      <span className="text-right tabular-nums">{share} %</span>
    </div>
  );
}

/** The inverse strip under the map: the selected block in the current metric, and its share of every metric. */
function TreemapDetailStrip({ node, metric }: { node: TreeNode; metric: TreemapMetric }) {
  const unit = node.level === 'tag' && node.parentId ? (TREEMAP_TREE.byId.get(node.parentId) ?? node) : node;
  const sensor = node.sensor;
  const tone = treemapTone(node);
  return (
    <div className="grid grid-cols-12 items-center gap-6 bg-[var(--kit-text)] px-6 py-5 text-[color:var(--kit-surface)]">
      <div className="col-span-4">
        <p className="text-sm font-bold opacity-80">Selected {node.level}</p>
        <p className="text-3xl font-extrabold leading-none tracking-tight">{node.name}</p>
        <p className="mt-2 flex flex-wrap items-center gap-2 text-sm font-bold tabular-nums">
          {node.tag}
          <span data-tone={tone} className="bg-[var(--t-pop)] px-1.5 leading-6 text-[color:var(--t-on-pop)]">
            {node.stateLabel}
          </span>
        </p>
      </div>
      <div className="col-span-3">
        <p className="text-sm font-bold opacity-80">{sensor ? 'Reading now' : metric.label}</p>
        <p className="flex items-baseline gap-2">
          <span className="text-6xl font-extrabold leading-none tracking-tighter tabular-nums">
            {sensor ? (sensor.quality === 'bad' ? '—' : formatNumber(sensor.value, sensor.decimals)) : formatNumber(treemapValue(node, metric.id), metric.decimals)}
          </span>
          <span className="text-base font-bold">{sensor ? sensor.unit : metric.unit}</span>
        </p>
        <p className="mt-1 text-sm font-bold tabular-nums opacity-80">
          {sensor
            ? `High limit ${formatNumber(sensor.highLimit, sensor.decimals)} ${sensor.unit}`
            : `Health ${node.score} of 100 · ${node.openAlarms} open ${node.openAlarms === 1 ? 'alarm' : 'alarms'}`}
        </p>
      </div>
      <div className="col-span-5 space-y-1.5">
        <p className="text-sm font-bold opacity-80">{unit.name}, share of the plant</p>
        {TREEMAP_METRICS.map((entry) => (
          <TreemapShareBar
            key={entry.id}
            label={entry.label.replace(', 30 days', '')}
            share={treemapShare(treemapValue(unit, entry.id), treemapValue(TREEMAP_TREE.root, entry.id))}
            tone={treemapTone(unit)}
          />
        ))}
      </div>
    </div>
  );
}

function TreemapToolbar({ explorer, legend = true }: { explorer: TreemapExplorer; legend?: boolean }) {
  const { focus, selected } = explorer;
  const canDrill = selected.children.length > 0 && selected.id !== focus.id;
  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 border-y-2 px-6 py-2 ${TREEMAP_INK}`}>
      <TreemapCrumbs focus={focus} onDrill={explorer.drill} />
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={focus.parentId === null} onClick={explorer.up}>
          <IconArrowBackUp /> Up a level
        </Button>
        <Button size="sm" disabled={!canDrill} onClick={() => explorer.drill(selected.id)}>
          <IconZoomIn /> Drill in
        </Button>
      </div>
      {legend ? <Legend items={TREEMAP_HEALTH_LEGEND} className="ml-auto" /> : null}
    </div>
  );
}

/** The map for the current level: nested areas at the plant, one flat level below it. */
function TreemapMap({ explorer, width, height }: { explorer: TreemapExplorer; width: number; height: number }) {
  const { focus, metric, selected } = explorer;
  if (focus.level === 'site') {
    return <TreemapNested metric={metric} width={width} height={height} selectedId={selected.id} onPick={explorer.pick} onDrill={explorer.drill} />;
  }
  return (
    <TreemapTiles
      label={`${focus.name}, sized by ${focus.level === 'unit' ? 'closeness to a limit' : metric.label.toLowerCase()}`}
      blocks={treemapBlocks(focus, metric)}
      width={width}
      height={height}
      selectedId={selected.id}
      minShare={focus.level === 'unit' ? 0.12 : 0.07}
      onPick={explorer.pick}
    />
  );
}

function TreemapMasthead({ explorer, children }: { explorer: TreemapExplorer; children?: ReactNode }) {
  const headline = treemapHeadline(explorer);
  return (
    <header className="flex items-end justify-between gap-8 px-6 pb-5 pt-6">
      <div className="min-w-0">
        <h2 className="max-w-3xl text-5xl font-extrabold leading-none tracking-tighter">{headline.title}</h2>
        <p className="mt-3 text-base font-semibold">{headline.detail}</p>
      </div>
      {children}
    </header>
  );
}

function TreemapExplorerSignature() {
  const explorer = useTreemapExplorer('nk');
  return (
    <LookScope look="poster">
      <Canvas padding="none" className="flex h-[860px] flex-col">
        <TreemapMasthead explorer={explorer}>
          <div className="w-80 shrink-0">
            <p className="mb-1 text-sm font-bold">Size blocks by</p>
            <TreemapMetricSwitch value={explorer.metric.id} disabled={explorer.focus.level === 'unit'} onChange={explorer.setMetric} />
          </div>
        </TreemapMasthead>
        <TreemapToolbar explorer={explorer} />
        <div className="min-h-0 flex-1">
          <TreemapMap explorer={explorer} width={1150} height={460} />
        </div>
        <TreemapDetailStrip node={explorer.selected} metric={explorer.metric} />
      </Canvas>
    </LookScope>
  );
}

function TreemapExplorerRanking() {
  const [metricId, setMetricId] = useState<TreemapMetricId>('cost');
  const metric = treemapMetric(metricId);
  const ranked = [...TREEMAP_UNITS].sort((a, b) => treemapValue(b, metricId) - treemapValue(a, metricId));
  const total = treemapValue(TREEMAP_TREE.root, metricId);
  const byTone = (tone: StatusTone) => TREEMAP_UNITS.filter((unit) => treemapTone(unit) === tone);
  const sum = (units: readonly TreeNode[]) => units.reduce((all, unit) => all + treemapValue(unit, metricId), 0);
  const top = ranked[0];

  return (
    <LookScope look="poster">
      <Canvas className="grid grid-cols-12 gap-5">
        <header className="col-span-12 flex items-end justify-between gap-8">
          <div>
            <h2 className="text-5xl font-extrabold leading-none tracking-tighter">The league table.</h2>
            <p className="mt-3 text-base font-semibold">
              Eleven units ranked by {metric.label.toLowerCase()}. {top ? `${top.name} leads with ${treemapShare(treemapValue(top, metricId), total)} %.` : ''}
            </p>
          </div>
          <div className="w-80 shrink-0">
            <TreemapMetricSwitch value={metricId} onChange={setMetricId} />
          </div>
        </header>
        <Panel className="col-span-8" title="Units, largest first" subtitle={`${metric.label}, ${metric.unit}. Bar colour is health.`}>
          <Bars
            label={`Units ranked by ${metric.label.toLowerCase()}`}
            orientation="horizontal"
            categories={ranked.map((unit) => unit.name)}
            series={[{ id: 'value', label: metric.label, values: ranked.map((unit) => treemapValue(unit, metricId)) }]}
            tones={ranked.map(treemapTone)}
            unit={metric.unit}
            decimals={metric.decimals}
            showValues
            showLegend={false}
            height={470}
          />
        </Panel>
        <div className="col-span-4 flex flex-col gap-5">
          <Stat
            className="flex-1"
            size="lg"
            tone="critical"
            label={`Poor or tripped · ${byTone('critical').length} unit`}
            value={sum(byTone('critical'))}
            decimals={metric.decimals}
            unit={metric.unit}
            target={`${treemapShare(sum(byTone('critical')), total)} % of the plant`}
          />
          <Stat
            className="flex-1"
            size="lg"
            tone="warning"
            label={`Watch · ${byTone('warning').length} units`}
            value={sum(byTone('warning'))}
            decimals={metric.decimals}
            unit={metric.unit}
            target={`${treemapShare(sum(byTone('warning')), total)} % of the plant`}
          />
          <Stat
            className="flex-1"
            size="lg"
            tone="success"
            label={`Good · ${byTone('success').length} units`}
            value={sum(byTone('success'))}
            decimals={metric.decimals}
            unit={metric.unit}
            target={`${treemapShare(sum(byTone('success')), total)} % of the plant`}
          />
        </div>
      </Canvas>
    </LookScope>
  );
}

function TreemapExplorerPhone() {
  const explorer = useTreemapExplorer('nk-23', 'downtime');
  const headline = treemapHeadline(explorer);
  const { selected, metric } = explorer;
  return (
    <LookScope look="poster" className="mx-auto w-full max-w-sm">
      <Canvas padding="none" className={`flex flex-col border-2 ${TREEMAP_INK}`}>
        <header className="px-4 pb-4 pt-5">
          <p className="text-sm font-bold">
            {explorer.focus.tag} · {metric.label}
          </p>
          <h2 className="mt-1 text-3xl font-extrabold leading-none tracking-tighter">{headline.title}</h2>
        </header>
        <div className={`flex items-center justify-between gap-2 border-y-2 px-4 py-2 ${TREEMAP_INK}`}>
          <Button variant="outline" size="sm" disabled={explorer.focus.parentId === null} onClick={explorer.up}>
            <IconArrowBackUp /> Up
          </Button>
          <Legend items={TREEMAP_HEALTH_LEGEND.map((item) => ({ ...item, label: item.label.split(' ')[0] ?? item.label }))} />
        </div>
        <div className="h-[420px]">
          <TreemapMap explorer={explorer} width={380} height={420} />
        </div>
        <div className="bg-[var(--kit-text)] px-4 py-4 text-[color:var(--kit-surface)]">
          <p className="text-sm font-bold opacity-80">{selected.tag}</p>
          <p className="text-2xl font-extrabold leading-tight tracking-tight">{selected.name}</p>
          <p className="mt-2 flex items-baseline gap-2">
            <span className="text-5xl font-extrabold leading-none tracking-tighter tabular-nums">
              {selected.sensor ? formatNumber(selected.sensor.value, selected.sensor.decimals) : formatNumber(treemapValue(selected, metric.id), metric.decimals)}
            </span>
            <span className="text-base font-bold">{selected.sensor ? selected.sensor.unit : metric.unit}</span>
            <span data-tone={treemapTone(selected)} className="ml-auto bg-[var(--t-pop)] px-1.5 text-sm font-bold leading-6 text-[color:var(--t-on-pop)]">
              {selected.stateLabel}
            </span>
          </p>
        </div>
      </Canvas>
    </LookScope>
  );
}

function TreemapExplorerBlocks() {
  const [picked, setPicked] = useState('23-ka-9103');
  const area = TREEMAP_TREE.byId.get('nk-23') ?? TREEMAP_TREE.root;
  return (
    <LookScope look="poster" className="w-full">
      <div className={`h-[340px] border ${TREEMAP_INK}`}>
        <TreemapTiles label="Gas compression by maintenance spend" blocks={treemapBlocks(area, treemapMetric('cost'))} width={540} height={340} selectedId={picked} onPick={setPicked} />
      </div>
    </LookScope>
  );
}

function TreemapExplorerTagLevel() {
  const [picked, setPicked] = useState('tt-92532');
  const unit = TREEMAP_TREE.byId.get('23-ka-9101') ?? TREEMAP_TREE.root;
  return (
    <LookScope look="poster" className="w-full">
      <div className={`h-[340px] border ${TREEMAP_INK}`}>
        <TreemapTiles label="Tags on the 1st stage compressor" blocks={treemapBlocks(unit, treemapMetric('production'))} width={540} height={340} selectedId={picked} minShare={0.12} onPick={setPicked} />
      </div>
    </LookScope>
  );
}

function TreemapExplorerMetricSwitch() {
  const [metricId, setMetricId] = useState<TreemapMetricId>('energy');
  return (
    <LookScope look="poster" className="w-full max-w-xs bg-[var(--kit-canvas-bg)]">
      <TreemapMetricSwitch value={metricId} onChange={setMetricId} />
    </LookScope>
  );
}

function TreemapExplorerToolbar() {
  const explorer = useTreemapExplorer('nk-23');
  return (
    <LookScope look="poster" className="w-full bg-[var(--kit-canvas-bg)]">
      <TreemapToolbar explorer={explorer} />
    </LookScope>
  );
}

function TreemapExplorerDetail() {
  const node = TREEMAP_TREE.byId.get('23-ka-9103') ?? TREEMAP_TREE.root;
  return (
    <LookScope look="poster" className="w-full">
      <TreemapDetailStrip node={node} metric={treemapMetric('downtime')} />
    </LookScope>
  );
}

export default definePage({
  id: 'treemap-explorer',
  title: 'Treemap explorer',
  summary:
    'The plant as one full-bleed treemap: every unit is a solid block sized by what it accounts for and coloured by its health, so the big red block is the one to talk about. Click to select, click again to drill.',
  guidance: {
    use: [
      'To show where a total sits and whether those places are healthy, in one picture.',
      'When the size metric can change: production, power, spend, downtime.',
      'On a team screen, with the headline sentence doing the reading for the room.',
    ],
    avoid: [
      'More than about thirty blocks on one level; drill instead.',
      'Colour for anything but one scale. Here it is health, always with the word.',
      'Comparing blocks of similar size precisely; switch to the ranked bars.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Areas frame their units. Pick a block to read it in the strip below; pick it again, or an area header, to drill.',
      specimens: [
        {
          id: 'TreemapExplorerSignature',
          title: 'Treemap explorer',
          note: 'Pick it when the question is where the production, cost or downtime sits, and whether that place is healthy.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['experiences/drilldown/treemapLayout.ts', 'kit/miller-columns/assetTree.ts', 'kit/Canvas.tsx', 'kit/Legend.tsx', 'looks/LookScope.tsx'],
          Component: TreemapExplorerSignature,
        },
      ],
    },
    {
      id: 'variations',
      title: 'Variations',
      description: 'The ranked view of the same figures, and the map on a phone.',
      specimens: [
        {
          id: 'TreemapExplorerRanking',
          title: 'League table',
          note: 'Pick it when blocks of similar size need comparing exactly: the same units as ranked bars.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Bars.tsx', 'kit/Stat.tsx', 'kit/Panel.tsx', 'looks/LookScope.tsx'],
          Component: TreemapExplorerRanking,
        },
        {
          id: 'TreemapExplorerPhone',
          title: 'One area on a phone',
          note: 'Pick it for a handheld: one level at a time, drilled into an area, the selection underneath.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['experiences/drilldown/treemapLayout.ts', 'kit/Legend.tsx', 'looks/LookScope.tsx'],
          Component: TreemapExplorerPhone,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The blocks, the switch and the strips around the map.',
      specimens: [
        {
          id: 'TreemapExplorerBlocks',
          title: 'Unit blocks',
          note: 'A block prints less as it shrinks: name, figure and state word, then name and figure only.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['experiences/drilldown/treemapLayout.ts'],
          Component: TreemapExplorerBlocks,
        },
        {
          id: 'TreemapExplorerTagLevel',
          title: 'Tag blocks',
          note: 'At the bottom level tags are sized by how close they run to a limit and print their reading.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['experiences/drilldown/treemapLayout.ts', 'kit/miller-columns/assetTree.ts'],
          Component: TreemapExplorerTagLevel,
        },
        {
          id: 'TreemapExplorerMetricSwitch',
          title: 'Size-by switch',
          note: 'Each option carries the plant total, so the switch is also the summary.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          Component: TreemapExplorerMetricSwitch,
        },
        {
          id: 'TreemapExplorerToolbar',
          title: 'Level bar',
          note: 'Where you are, the way back up, the way further in, and what the colours mean.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['kit/Legend.tsx'],
          Component: TreemapExplorerToolbar,
        },
        {
          id: 'TreemapExplorerDetail',
          title: 'Selection strip',
          note: 'The selected block in full, and its share of every metric, so one switch is not the whole story.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          Component: TreemapExplorerDetail,
        },
      ],
    },
  ],
});
