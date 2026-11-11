import { Button } from '@cognite/aura/components/button';
import { IconArrowNarrowLeft, IconArrowNarrowRight } from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { Bars } from '../../../library/kit/Bars';
import { Canvas } from '../../../library/kit/Canvas';
import { Meter } from '../../../library/kit/Meter';
import {
  buildAssetTree,
  isAbnormal,
  isOpenAlarm,
  nodesAt,
  pathTo,
  type TreeLevel,
  type TreeNode,
  type TreeSensor,
} from '../../../library/kit/miller-columns/assetTree';
import { activeNode, sanitizePath, selectNode } from '../../../library/kit/miller-columns/millerPath';
import { EXTRA_SENSORS } from '../../../library/kit/miller-columns/plantFixture';
import { StatusPill } from '../../../library/kit/StatusPill';
import { TagId } from '../../../library/kit/TagId';
import { formatNumber, type Tone } from '../../../library/kit/tones';
import { TrendLine, type TrendLimit } from '../../../library/kit/TrendLine';
import { LookScope } from '../../../library/looks/LookScope';
import { ALARMS, ASSETS, SENSORS, WORK_ORDERS, findPerson } from '../../data/plant';
import { MINUTE, formatAgo, formatDate, formatTime, makeSeries } from '../../data/series';
import { definePage } from '../../types';

import source from './plant-to-sensor.tsx?raw';

const PTS_TREE = buildAssetTree({ assets: ASSETS, sensors: [...SENSORS, ...EXTRA_SENSORS], alarms: ALARMS });

type PtsChapter = { level: TreeLevel; number: string; label: string; next: string };

/** The four chapters of the story, one per level of the hierarchy. */
const PTS_CHAPTERS: readonly PtsChapter[] = [
  { level: 'site', number: '01', label: 'Plant', next: 'Choose an area' },
  { level: 'area', number: '02', label: 'Area', next: 'Choose a piece of equipment' },
  { level: 'unit', number: '03', label: 'Equipment', next: 'Choose a sensor' },
  { level: 'tag', number: '04', label: 'Sensor', next: 'The end of the line' },
];

/** Where each area sits on the plot plan, in the 232 × 170 box of the breadcrumb map. */
const PTS_PLAN: Record<string, { x: number; y: number; width: number; height: number }> = {
  'nk-20': { x: 12, y: 14, width: 62, height: 74 },
  'nk-23': { x: 84, y: 14, width: 78, height: 74 },
  'nk-27': { x: 172, y: 14, width: 48, height: 74 },
  'nk-40': { x: 84, y: 102, width: 78, height: 54 },
};

/** Headlines written for the path the story opens on; every other node gets one built from its data. */
const PTS_COPY: Record<string, { headline: string; standfirst: string }> = {
  nk: {
    headline: 'One plant, four areas, and one of them is hurting.',
    standfirst:
      'Nordkapp scores 91 for health, which hides a split: three areas run clean while gas compression carries almost every open alarm. Step into an area to see why.',
  },
  'nk-23': {
    headline: 'Compression is where the plant is losing margin.',
    standfirst:
      'Five machines move the gas from 12 to 96 bar. One has tripped, two are on watch, and the two that are left carry the export. The weakest three are the place to look.',
  },
  '23-ka-9101': {
    headline: 'The first stage is running hot and rough.',
    standfirst:
      'With the recompressor down, the first stage takes more of the load. Discharge temperature has crossed its high limit and the drive-end bearing is close behind. Six sensors tell the story.',
  },
  'vt-92540': {
    headline: 'Vibration sits 0.3 mm/s under its limit.',
    standfirst:
      'This is the sensor the whole chain comes down to. It has crept up through the afternoon; at 7.1 the operator gets an alarm and at 11.0 the machine trips, as its neighbour did at 13:46.',
  },
};

function ptsReading(sensor: TreeSensor): string {
  return sensor.quality === 'bad' ? 'No reading' : `${formatNumber(sensor.value, sensor.decimals)} ${sensor.unit}`;
}

function ptsCopy(node: TreeNode): { headline: string; standfirst: string } {
  const written = PTS_COPY[node.id];
  if (written) return written;
  if (node.sensor) {
    const sensor = node.sensor;
    return {
      headline: `${node.name} reads ${ptsReading(sensor).toLowerCase()}.`,
      standfirst: `${node.tag} is ${node.stateLabel.toLowerCase()}. Its operating band runs from ${formatNumber(sensor.lowLimit, sensor.decimals)} to ${formatNumber(sensor.highLimit, sensor.decimals)} ${sensor.unit}; the last 24 hours are drawn below.`,
    };
  }
  const flagged = node.children.filter((child) => isAbnormal(child.tone)).length;
  const kind = node.level === 'unit' ? 'sensors' : 'units';
  return {
    headline: flagged === 0 ? `${node.name} is running clean.` : `${node.name} has ${flagged} of ${node.children.length} ${kind} to look at.`,
    standfirst: `${node.tag} scores ${node.score} for health with ${node.openAlarms} open ${node.openAlarms === 1 ? 'alarm' : 'alarms'}. ${
      node.children.length > 0 ? `Its ${node.children.length} ${kind} are listed weakest first.` : 'Nothing is mapped below it yet.'
    }`,
  };
}

/** The last 24 hours of a tag, ending on its current value. A dead signal has no trend. */
function ptsTrend(sensor: TreeSensor): { values: number[]; labels: string[] } {
  if (sensor.quality === 'bad') return { values: [], labels: [] };
  const band = sensor.highLimit - sensor.lowLimit;
  const idle = sensor.value === 0;
  const raw = makeSeries({
    seed: sensor.seed,
    points: 49,
    base: sensor.value,
    amplitude: idle ? 0 : band * 0.06,
    noise: idle ? 0 : band * 0.025,
    cycles: 2,
    stepMs: 30 * MINUTE,
    decimals: sensor.decimals,
  });
  const offset = sensor.value - (raw[raw.length - 1]?.v ?? sensor.value);
  return {
    values: raw.map((point) => Number(Math.max(sensor.rangeMin, point.v + offset).toFixed(sensor.decimals))),
    labels: raw.map((point) => formatTime(point.t)),
  };
}

type PtsStory = {
  /** Root first, the current chapter's node last. */
  trail: readonly TreeNode[];
  node: TreeNode;
  chapter: PtsChapter;
  stepIn: (id: string) => void;
  stepOut: () => void;
  /** Jump back to an earlier chapter by its index. */
  goTo: (index: number) => void;
};

function usePtsStory(initial: readonly string[]): PtsStory {
  const [path, setPath] = useState<readonly string[]>(sanitizePath(PTS_TREE, initial));
  const node = activeNode(PTS_TREE, path);
  const trail = pathTo(PTS_TREE, node.id);
  return {
    trail,
    node,
    chapter: PTS_CHAPTERS[path.length] ?? PTS_CHAPTERS[0] ?? { level: 'site', number: '01', label: 'Plant', next: '' },
    stepIn: (id) => setPath(selectNode(PTS_TREE, id)),
    stepOut: () => setPath((current) => current.slice(0, -1)),
    goTo: (index) => setPath((current) => current.slice(0, index)),
  };
}

function ptsWeakestFirst(nodes: readonly TreeNode[]): TreeNode[] {
  return [...nodes].sort((a, b) => a.score - b.score);
}

/** The figure a node leads with: health for an asset, the live reading for a sensor. */
function PtsFigure({ node, size = 'lg' }: { node: TreeNode; size?: 'md' | 'lg' }) {
  const sensor = node.sensor;
  const scale = size === 'lg' ? 'text-8xl' : 'text-5xl';
  const flagged = isAbnormal(node.tone) && node.children.every((child) => child.level === 'tag');
  return (
    <p data-tone={node.tone} className="flex items-baseline gap-2 whitespace-nowrap">
      <span className={`${scale} font-medium leading-none tracking-tighter tabular-nums ${flagged ? 'text-[color:var(--t-ink)]' : ''}`}>
        {sensor ? (sensor.quality === 'bad' ? '—' : formatNumber(sensor.value, sensor.decimals)) : node.score}
      </span>
      <span className="text-base text-[color:var(--kit-text-2)]">{sensor ? sensor.unit : 'health'}</span>
    </p>
  );
}

/**
 * The persistent map: the plot plan with every unit as a small square. The chosen area is ruled
 * heavier, the chosen equipment is filled and the chosen sensor is ringed, so the path stays
 * visible however deep the story goes. Areas are buttons.
 */
function PtsBreadcrumbMap({ story }: { story: PtsStory }) {
  const area = story.trail[1];
  const unit = story.trail[2];
  const sensor = story.trail[3];
  return (
    <svg viewBox="0 0 232 170" role="group" aria-label="Plot plan with the current path" className="block w-full">
      <rect x="1" y="1" width="230" height="168" fill="none" stroke="var(--kit-rule-strong)" strokeWidth={story.trail.length === 1 ? 2 : 1} />
      <path d="M 74 51 H 84 M 162 51 H 172 M 123 88 V 102" stroke="var(--kit-rule-strong)" strokeWidth="1" />
      {PTS_TREE.root.children.map((candidate) => {
        const box = PTS_PLAN[candidate.id];
        if (!box) return null;
        const chosen = candidate.id === area?.id;
        return (
          <g key={candidate.id}>
            <rect
              x={box.x}
              y={box.y}
              width={box.width}
              height={box.height}
              role="button"
              tabIndex={0}
              aria-label={`${candidate.name}, health ${candidate.score}`}
              aria-pressed={chosen}
              onClick={() => story.stepIn(candidate.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  story.stepIn(candidate.id);
                }
              }}
              fill={chosen ? 'color-mix(in oklab, var(--kit-text) 8%, transparent)' : 'transparent'}
              stroke="var(--kit-text)"
              strokeWidth={chosen ? 2.5 : 1}
              className="cursor-pointer outline-none focus-visible:[stroke-width:3]"
            />
            {candidate.children.map((child, index) => {
              const x = box.x + 8 + (index % 3) * 16;
              const y = box.y + 10 + Math.floor(index / 3) * 16;
              const picked = child.id === unit?.id;
              return (
                <g key={child.id} data-tone={child.tone} className="pointer-events-none">
                  <rect
                    x={x}
                    y={y}
                    width="10"
                    height="10"
                    fill={picked ? 'var(--kit-text)' : isAbnormal(child.tone) ? 'var(--t-line)' : 'transparent'}
                    stroke={isAbnormal(child.tone) && !picked ? 'var(--t-line)' : 'var(--kit-text)'}
                    strokeWidth="1"
                  />
                  {picked && sensor ? <circle cx={x + 5} cy={y + 5} r="10" fill="none" stroke="var(--kit-text)" strokeWidth="1.5" strokeDasharray="3 2" /> : null}
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

/** The chapters as a contents list: reached ones are links back, later ones wait. */
function PtsChapterList({ story, orientation = 'column' }: { story: PtsStory; orientation?: 'column' | 'row' }) {
  return (
    <ol className={orientation === 'row' ? 'grid grid-cols-4 gap-4' : 'flex flex-col'}>
      {PTS_CHAPTERS.map((chapter, index) => {
        const node = story.trail[index];
        const current = index === story.trail.length - 1;
        return (
          <li key={chapter.level} className={`border-t ${current ? 'border-t-2 border-[color:var(--kit-rule-strong)]' : 'border-[color:var(--kit-rule)]'}`}>
            <button
              type="button"
              disabled={!node || current}
              aria-current={current ? 'step' : undefined}
              onClick={() => story.goTo(index)}
              className="flex w-full items-baseline gap-3 py-2.5 text-left outline-none enabled:hover:underline focus-visible:underline"
            >
              <span className={`text-sm tabular-nums ${current ? 'font-semibold' : 'text-[color:var(--kit-text-3)]'}`}>{chapter.number}</span>
              <span className="min-w-0 flex-1">
                <span className={`block text-xs ${node ? 'text-[color:var(--kit-text-2)]' : 'text-[color:var(--kit-text-3)]'}`}>{chapter.label}</span>
                <span className={`block text-sm leading-5 ${current ? 'font-semibold' : node ? 'font-medium' : 'text-[color:var(--kit-text-3)]'}`}>
                  {node ? node.name : (PTS_CHAPTERS[index - 1]?.next ?? 'Not chosen yet')}
                </span>
              </span>
              {node ? (
                <span data-tone={node.tone} className={`text-sm font-medium tabular-nums ${isAbnormal(node.tone) && index >= 2 ? 'text-[color:var(--t-ink)]' : ''}`}>
                  {node.sensor ? ptsReading(node.sensor) : node.score}
                </span>
              ) : null}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function PtsStepControls({ story }: { story: PtsStory }) {
  const next = ptsWeakestFirst(story.node.children)[0];
  const parent = story.trail[story.trail.length - 2];
  return (
    <div className="flex flex-col gap-2">
      <Button className="w-full" disabled={!next} onClick={() => (next ? story.stepIn(next.id) : undefined)}>
        {next ? `Step in to ${next.tag}` : 'Deepest level'} <IconArrowNarrowRight />
      </Button>
      <Button variant="outline" className="w-full" disabled={!parent} onClick={story.stepOut}>
        <IconArrowNarrowLeft /> {parent ? `Step out to ${parent.tag}` : 'Top level'}
      </Button>
    </div>
  );
}

/** Chapter numeral, headline and standfirst on the left; the chapter's one figure on the right. */
function PtsChapterHead({ story }: { story: PtsStory }) {
  const { node, chapter } = story;
  const copy = ptsCopy(node);
  return (
    <header className="grid grid-cols-[1fr_auto] items-end gap-x-10 gap-y-4 border-b-2 border-[color:var(--kit-rule-strong)] pb-6">
      <div>
        <p className="flex items-center gap-3 text-sm text-[color:var(--kit-text-2)]">
          <span className="font-semibold text-[color:var(--kit-text)]">Chapter {chapter.number}</span>
          <span>{chapter.label}</span>
          <TagId>{node.tag}</TagId>
          <StatusPill tone={node.tone}>{node.stateLabel}</StatusPill>
        </p>
        <h2 className="mt-3 max-w-2xl text-5xl font-medium leading-none tracking-tighter">{copy.headline}</h2>
      </div>
      <div className="text-right">
        <PtsFigure node={node} />
      </div>
      <p className="col-span-2 max-w-2xl text-base leading-7 text-[color:var(--kit-text-2)]">{copy.standfirst}</p>
    </header>
  );
}

function PtsColumnTitle({ children, detail }: { children: ReactNode; detail?: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-xl font-medium tracking-tight">{children}</h3>
      {detail ? <p className="text-sm text-[color:var(--kit-text-2)]">{detail}</p> : null}
    </div>
  );
}

/** Chapter one: the plot plan. Four areas where they stand, joined by the gas path, each with its score. */
function PtsPlotPlan({ story }: { story: PtsStory }) {
  const block = (id: string, className: string) => {
    const area = PTS_TREE.byId.get(id);
    if (!area) return null;
    const flagged = area.children.filter((child) => isAbnormal(child.tone)).length;
    return (
      <button
        type="button"
        data-tone={area.tone}
        onClick={() => story.stepIn(area.id)}
        className={`flex flex-col justify-between border border-[color:var(--kit-rule-strong)] p-4 text-left outline-none hover:bg-[color-mix(in_oklab,var(--kit-text)_5%,transparent)] focus-visible:ring-2 focus-visible:ring-[color:var(--kit-text)] ${
          isAbnormal(area.tone) ? 'border-t-4 border-t-[color:var(--t-line)]' : ''
        } ${className}`}
      >
        <span>
          <span className="block text-xs tabular-nums text-[color:var(--kit-text-2)]">{area.tag}</span>
          <span className="block text-lg font-medium leading-6 tracking-tight">{area.name}</span>
        </span>
        <span>
          <PtsFigure node={area} size="md" />
          <span className={`mt-1.5 block text-sm ${flagged > 0 ? 'font-medium text-[color:var(--t-ink)]' : 'text-[color:var(--kit-text-2)]'}`}>
            {flagged > 0 ? `${flagged} of ${area.children.length} units flagged` : `${area.children.length} ${area.children.length === 1 ? 'unit' : 'units'}, all normal`}
          </span>
        </span>
      </button>
    );
  };
  const pipe = (label: string) => (
    <span className="flex flex-col items-center justify-center gap-1 text-xs text-[color:var(--kit-text-2)]">
      {label}
      <IconArrowNarrowRight aria-hidden="true" className="size-6 text-[color:var(--kit-text)]" />
    </span>
  );
  return (
    <div className="grid grid-cols-[1fr_auto_1.25fr_auto_0.9fr] grid-rows-[13rem_auto_11.5rem] gap-x-3">
      {block('nk-20', '')}
      {pipe('Wet gas')}
      {block('nk-23', '')}
      {pipe('Dry gas')}
      {block('nk-27', '')}
      <span className="col-start-3 flex h-10 items-center justify-center gap-2 text-xs text-[color:var(--kit-text-2)]">
        <span aria-hidden="true" className="h-full border-l border-dashed border-[color:var(--kit-rule-strong)]" />
        Cooling loop
      </span>
      {block('nk-40', 'col-start-3 row-start-3')}
      <p className="col-span-2 col-start-1 row-start-3 self-end pr-6 text-sm leading-6 text-[color:var(--kit-text-2)]">
        Plot plan, not to scale. Gas runs left to right; cooling water serves the compressors from below. A heavy top rule marks an area with units on watch or tripped.
      </p>
      <dl className="col-span-2 col-start-4 row-start-3 self-end pl-3">
        <PtsFact label="Units on the plan">{nodesAt(PTS_TREE.root, 'unit').length}</PtsFact>
        <PtsFact label="Sensors below them">{nodesAt(PTS_TREE.root, 'tag').length}</PtsFact>
        <PtsFact label="Open alarms">{PTS_TREE.root.openAlarms}</PtsFact>
        <PtsFact label="Of those, in compression">{PTS_TREE.byId.get('nk-23')?.openAlarms ?? 0}</PtsFact>
      </dl>
    </div>
  );
}

/** Chapter two: the units of an area as bars of health, weakest first. */
function PtsAreaChart({ area }: { area: TreeNode }) {
  const units = ptsWeakestFirst(area.children);
  return (
    <Bars
      label={`Health of the units in ${area.name}`}
      orientation="horizontal"
      categories={units.map((unit) => unit.name)}
      series={[{ id: 'health', label: 'Health', values: units.map((unit) => unit.score) }]}
      tones={units.map((unit): Tone => (isAbnormal(unit.tone) ? unit.tone : 'neutral'))}
      limit={{ value: 75, label: 'Watch below', tone: 'warning' }}
      showValues
      showLegend={false}
      height={Math.max(units.length * 58 + 50, 200)}
    />
  );
}

/** Chapter three: every sensor on a machine against its own range and limits. */
function PtsSensorMeters({ unit }: { unit: TreeNode }) {
  return (
    <div className="grid grid-cols-2 gap-x-10 gap-y-7">
      {ptsWeakestFirst(unit.children).map((child) => {
        const sensor = child.sensor;
        if (!sensor) return null;
        if (sensor.quality === 'bad') {
          return (
            <p key={child.id} className="text-sm text-[color:var(--kit-text-2)]">
              <span className="block font-medium text-[color:var(--kit-text)]">{child.name}</span>
              No reading: the transmitter has not reported since 05:02.
            </p>
          );
        }
        return (
          <Meter
            key={child.id}
            label={child.name}
            value={sensor.value}
            min={sensor.rangeMin}
            max={sensor.rangeMax}
            unit={sensor.unit}
            decimals={sensor.decimals}
            high={sensor.highLimit}
            low={sensor.lowLimit > sensor.rangeMin ? sensor.lowLimit : undefined}
            target={{ value: sensor.highLimit, label: 'High' }}
            tone={isAbnormal(child.tone) ? child.tone : 'neutral'}
          />
        );
      })}
    </div>
  );
}

/** Chapter four: the sensor's day, with its limits ruled across and the moments worth a note beside it. */
function PtsSensorTrend({ node, sensor, height = 320 }: { node: TreeNode; sensor: TreeSensor; height?: number }) {
  const { values, labels } = ptsTrend(sensor);
  if (values.length === 0) return <p className="text-base text-[color:var(--kit-text-2)]">There is no trend to draw: {node.tag} has reported bad quality since 05:02.</p>;
  const high = Math.max(...values);
  const low = Math.min(...values);
  const limits: TrendLimit[] = [{ value: sensor.highLimit, label: 'High limit', tone: 'warning' }];
  if (sensor.highHighLimit !== undefined && sensor.value > sensor.highLimit) limits.push({ value: sensor.highHighLimit, label: 'Trip', tone: 'critical' });
  const margin = sensor.highLimit - sensor.value;
  return (
    <div>
      <TrendLine
        label={`${sensor.name}, ${sensor.tag}, last 24 hours`}
        series={[{ id: 'value', label: sensor.name, values, tone: isAbnormal(node.tone) ? node.tone : 'accent' }]}
        labels={labels}
        unit={sensor.unit}
        decimals={sensor.decimals}
        limits={sensor.value === 0 ? [] : limits}
        height={height}
        showLegend={false}
      />
      <ol className="mt-5 grid grid-cols-3 gap-8 border-t border-[color:var(--kit-rule)] pt-4 text-sm leading-6 text-[color:var(--kit-text-2)]">
        <li>
          <strong className="font-semibold text-base-foreground">{labels[values.indexOf(low)]}.</strong> The day&apos;s low, {formatNumber(low, sensor.decimals)} {sensor.unit}.
        </li>
        <li>
          <strong className="font-semibold text-base-foreground">{labels[values.indexOf(high)]}.</strong> The day&apos;s high, {formatNumber(high, sensor.decimals)} {sensor.unit}.
        </li>
        <li>
          <strong className="font-semibold text-base-foreground">14:00.</strong> Now {formatNumber(sensor.value, sensor.decimals)},{' '}
          {margin >= 0 ? `${formatNumber(margin, sensor.decimals)} under` : `${formatNumber(-margin, sensor.decimals)} over`} the high limit.
        </li>
      </ol>
    </div>
  );
}

/** The way further down: the children of the chapter's node as a typographic list, weakest first. */
function PtsStepInList({ story, limit = 6 }: { story: PtsStory; limit?: number }) {
  const children = ptsWeakestFirst(story.node.children).slice(0, limit);
  return (
    <ul className="border-b border-[color:var(--kit-rule)]">
      {children.map((child) => (
        <li key={child.id} className="border-t border-[color:var(--kit-rule)]">
          <button type="button" data-step={child.id} onClick={() => story.stepIn(child.id)} className="group flex w-full items-center gap-4 py-3 text-left outline-none focus-visible:underline">
            <span className="min-w-0 flex-1">
              <span className="block text-base font-medium leading-6 group-hover:underline">{child.name}</span>
              <span className="flex flex-wrap items-center gap-x-2 text-sm text-[color:var(--kit-text-2)]">
                <span className="tabular-nums">{child.tag}</span>
                {isAbnormal(child.tone) ? <StatusPill tone={child.tone}>{child.stateLabel}</StatusPill> : <span>{child.stateLabel}</span>}
              </span>
            </span>
            <span data-tone={child.tone} className={`whitespace-nowrap text-3xl font-medium tracking-tight tabular-nums ${isAbnormal(child.tone) ? 'text-[color:var(--t-ink)]' : ''}`}>
              {child.sensor ? (child.sensor.quality === 'bad' ? '—' : formatNumber(child.sensor.value, child.sensor.decimals)) : child.score}
              {child.sensor ? <span className="ml-1 text-sm font-normal tracking-normal text-[color:var(--kit-text-2)]">{child.sensor.unit}</span> : null}
            </span>
            <IconArrowNarrowRight aria-hidden="true" className="size-5 shrink-0 text-[color:var(--kit-text-3)] group-hover:text-[color:var(--kit-text)]" />
          </button>
        </li>
      ))}
    </ul>
  );
}

function PtsFact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-t border-[color:var(--kit-rule)] py-2.5 text-sm">
      <dt className="text-[color:var(--kit-text-2)]">{label}</dt>
      <dd className="text-right font-medium tabular-nums">{children}</dd>
    </div>
  );
}

/** The margin column of the last chapter: limits, the alarm on the tag and the work that follows. */
function PtsSensorFacts({ node, sensor }: { node: TreeNode; sensor: TreeSensor }) {
  const alarm = node.alarms.find(isOpenAlarm) ?? node.alarms[0];
  const order = WORK_ORDERS.find((candidate) => candidate.assetId === node.parentId && candidate.status !== 'done');
  const owner = order ? findPerson(order.assigneeId) : undefined;
  return (
    <div className="space-y-6">
      <dl className="border-b border-[color:var(--kit-rule)]">
        <PtsFact label="Operating band">
          {formatNumber(sensor.lowLimit, sensor.decimals)} to {formatNumber(sensor.highLimit, sensor.decimals)} {sensor.unit}
        </PtsFact>
        <PtsFact label="Trip limit">{sensor.highHighLimit === undefined ? 'None' : `${formatNumber(sensor.highHighLimit, sensor.decimals)} ${sensor.unit}`}</PtsFact>
        <PtsFact label="Signal quality">{sensor.quality === 'good' ? 'Good' : sensor.quality === 'bad' ? 'Bad' : 'Uncertain'}</PtsFact>
      </dl>
      <div>
        <h4 className="text-sm font-semibold">The alarm</h4>
        <p className="mt-1 text-sm leading-6 text-[color:var(--kit-text-2)]">
          {alarm ? `${alarm.message}: ${alarm.value} against a limit of ${alarm.limit}, raised ${formatAgo(alarm.raisedAt)}.` : 'No alarm has been raised on this tag in the last 30 days.'}
        </p>
      </div>
      <div>
        <h4 className="text-sm font-semibold">What happens next</h4>
        <p className="mt-1 text-sm leading-6 text-[color:var(--kit-text-2)]">
          {order ? `${order.title} (${order.id}), due ${formatDate(order.dueAt)}, ${owner ? `with ${owner.name}` : 'not yet assigned'}.` : 'No work is open on this equipment.'}
        </p>
      </div>
    </div>
  );
}

/** The body of the current chapter: its picture on the left, the way further down on the right. */
function PtsChapterBody({ story }: { story: PtsStory }) {
  const { node } = story;
  if (node.level === 'site') return <PtsPlotPlan story={story} />;
  if (node.sensor) {
    return (
      <div className="grid grid-cols-12 gap-10">
        <div className="col-span-8">
          <PtsColumnTitle detail={`${node.sensor.unit}, last 24 hours, with the limits ruled across.`}>The day on {node.tag}</PtsColumnTitle>
          <PtsSensorTrend node={node} sensor={node.sensor} />
        </div>
        <div className="col-span-4">
          <PtsColumnTitle>In the margin</PtsColumnTitle>
          <PtsSensorFacts node={node} sensor={node.sensor} />
        </div>
      </div>
    );
  }
  const kind = node.level === 'unit' ? 'sensors' : 'units';
  return (
    <div className="grid grid-cols-12 gap-10">
      <div className="col-span-7">
        <PtsColumnTitle detail={node.level === 'unit' ? 'Each sensor on its own range; the shaded end is beyond the high limit.' : 'Health out of 100. The dashed rule is where a unit goes on watch.'}>
          {node.level === 'unit' ? 'Six ways to look at one machine' : 'Weakest first'}
        </PtsColumnTitle>
        {node.children.length === 0 ? (
          <p className="text-base text-[color:var(--kit-text-2)]">Nothing is mapped below {node.tag} yet.</p>
        ) : node.level === 'unit' ? (
          <PtsSensorMeters unit={node} />
        ) : (
          <PtsAreaChart area={node} />
        )}
      </div>
      <div className="col-span-5">
        <PtsColumnTitle detail={`${node.children.length} ${kind}, the one to worry about on top.`}>Step in</PtsColumnTitle>
        <PtsStepInList story={story} />
      </div>
    </div>
  );
}

/** The left rail that never changes place: the map, the contents and the two steps. */
function PtsRail({ story }: { story: PtsStory }) {
  const tags = nodesAt(story.node, 'tag').length;
  return (
    <aside className="flex w-60 shrink-0 flex-col gap-6 border-r border-[color:var(--kit-rule)] pr-8">
      <div>
        <p className="text-sm font-semibold">Plant to sensor</p>
        <p className="text-sm text-[color:var(--kit-text-2)]">Nordkapp, 12 March, 14:00 UTC</p>
      </div>
      <PtsBreadcrumbMap story={story} />
      <PtsChapterList story={story} />
      <div className="mt-auto space-y-3">
        <p className="text-xs leading-5 text-[color:var(--kit-text-2)]">
          {story.node.sensor ? 'One sensor, at the end of the path.' : `${tags} ${tags === 1 ? 'sensor' : 'sensors'} below this chapter.`}
        </p>
        <PtsStepControls story={story} />
      </div>
    </aside>
  );
}

function PtsScreen({ initial }: { initial: readonly string[] }) {
  const story = usePtsStory(initial);
  return (
    <LookScope look="editorial">
      <Canvas className="flex min-h-[820px] gap-10">
        <PtsRail story={story} />
        <article className="flex min-w-0 flex-1 flex-col gap-8">
          <PtsChapterHead story={story} />
          <PtsChapterBody story={story} />
        </article>
      </Canvas>
    </LookScope>
  );
}

function PlantToSensorSignature() {
  return <PtsScreen initial={[]} />;
}

function PlantToSensorSensorChapter() {
  return <PtsScreen initial={['nk-23', '23-ka-9101', 'vt-92540']} />;
}

function PlantToSensorTablet() {
  const story = usePtsStory(['nk-23', '23-ka-9101']);
  const copy = ptsCopy(story.node);
  return (
    <LookScope look="editorial" className="mx-auto w-full max-w-3xl">
      <Canvas className="flex flex-col gap-8">
        <PtsChapterList story={story} orientation="row" />
        <header>
          <p className="flex flex-wrap items-center gap-3 text-sm text-[color:var(--kit-text-2)]">
            <span className="font-semibold text-[color:var(--kit-text)]">Chapter {story.chapter.number}</span>
            <TagId>{story.node.tag}</TagId>
            <StatusPill tone={story.node.tone}>{story.node.stateLabel}</StatusPill>
          </p>
          <h2 className="mt-3 text-4xl font-medium leading-none tracking-tighter">{copy.headline}</h2>
          <p className="mt-4 text-base leading-7 text-[color:var(--kit-text-2)]">{copy.standfirst}</p>
        </header>
        {story.node.sensor ? <PtsSensorTrend node={story.node} sensor={story.node.sensor} height={260} /> : story.node.level === 'unit' ? <PtsSensorMeters unit={story.node} /> : <PtsAreaChart area={story.node} />}
        {story.node.children.length > 0 ? <PtsStepInList story={story} limit={3} /> : null}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" disabled={story.trail.length <= 1} onClick={story.stepOut}>
            <IconArrowNarrowLeft /> Step out
          </Button>
          <Button
            disabled={story.node.children.length === 0}
            onClick={() => {
              const next = ptsWeakestFirst(story.node.children)[0];
              if (next) story.stepIn(next.id);
            }}
          >
            Step in <IconArrowNarrowRight />
          </Button>
        </div>
      </Canvas>
    </LookScope>
  );
}

function PlantToSensorBreadcrumbMap() {
  const story = usePtsStory(['nk-23', '23-ka-9101', 'vt-92540']);
  return (
    <LookScope look="editorial" className="w-full max-w-xs bg-[var(--kit-canvas-bg)] p-5">
      <PtsBreadcrumbMap story={story} />
    </LookScope>
  );
}

function PlantToSensorChapterList() {
  const story = usePtsStory(['nk-23', '23-ka-9103']);
  return (
    <LookScope look="editorial" className="w-full max-w-xs bg-[var(--kit-canvas-bg)] p-5">
      <PtsChapterList story={story} />
    </LookScope>
  );
}

function PlantToSensorStepControls() {
  const story = usePtsStory(['nk-23']);
  return (
    <LookScope look="editorial" className="w-full max-w-xs space-y-4 bg-[var(--kit-canvas-bg)] p-5">
      <p className="text-sm text-[color:var(--kit-text-2)]">
        At <span className="font-medium text-[color:var(--kit-text)]">{story.node.name}</span>, chapter {story.chapter.number}.
      </p>
      <PtsStepControls story={story} />
    </LookScope>
  );
}

function PlantToSensorChapterHead() {
  const story = usePtsStory(['nk-23']);
  return (
    <LookScope look="editorial" className="w-full bg-[var(--kit-canvas-bg)] p-6">
      <PtsChapterHead story={story} />
    </LookScope>
  );
}

function PlantToSensorAreaChapter() {
  const area = PTS_TREE.byId.get('nk-23') ?? PTS_TREE.root;
  return (
    <LookScope look="editorial" className="w-full bg-[var(--kit-canvas-bg)] p-6">
      <PtsColumnTitle detail="Health out of 100. The dashed rule is where a unit goes on watch.">Weakest first</PtsColumnTitle>
      <PtsAreaChart area={area} />
    </LookScope>
  );
}

function PlantToSensorStepInList() {
  const story = usePtsStory(['nk-23', '23-ka-9101']);
  return (
    <LookScope look="editorial" className="w-full bg-[var(--kit-canvas-bg)] p-6">
      <PtsColumnTitle detail={`${story.node.name}: pick one to move a chapter on.`}>Step in</PtsColumnTitle>
      <PtsStepInList story={story} limit={5} />
    </LookScope>
  );
}

export default definePage({
  id: 'plant-to-sensor',
  title: 'Plant to sensor',
  summary:
    'A drill-down told as a four-chapter story: plant, area, equipment, sensor. Each chapter has one headline, one figure and one picture, and a small plot plan in the margin keeps the whole path in view.',
  guidance: {
    use: [
      'To explain a finding to someone who does not know the plant: a review, a handover, an onboarding.',
      'When each level deserves its own picture: a plan, a ranking, a set of ranges, a trend.',
      'With a persistent map or contents list, so stepping in never loses the way back.',
    ],
    avoid: [
      'Daily monitoring: operators need all levels at once, not a chapter at a time.',
      'Skipping levels. If people jump straight to a tag, give them search or columns.',
      'A chapter without a sentence that says what the reader is looking at.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Chapter one: the plot plan. Pick an area on the plan or in the margin map, or use the step buttons.',
      specimens: [
        {
          id: 'PlantToSensorSignature',
          title: 'Plant to sensor',
          note: 'Pick it to walk a reader from the whole plant down to the one sensor that explains it.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/miller-columns/assetTree.ts', 'kit/miller-columns/millerPath.ts', 'kit/Canvas.tsx', 'kit/Bars.tsx', 'kit/Meter.tsx', 'kit/TrendLine.tsx', 'looks/LookScope.tsx'],
          Component: PlantToSensorSignature,
        },
      ],
    },
    {
      id: 'variations',
      title: 'Variations',
      description: 'The last chapter of the same story, and a middle chapter on a tablet.',
      specimens: [
        {
          id: 'PlantToSensorSensorChapter',
          title: 'Chapter four, the sensor',
          note: 'Where the story ends: one tag, its day with notes, and what happens next in the margin.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/TrendLine.tsx', 'kit/miller-columns/assetTree.ts', 'looks/LookScope.tsx'],
          Component: PlantToSensorSensorChapter,
        },
        {
          id: 'PlantToSensorTablet',
          title: 'Chapter three on a tablet',
          note: 'Pick it for a narrow page: the contents run across the top and the chapter reads in one column.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Meter.tsx', 'kit/StatusPill.tsx', 'looks/LookScope.tsx'],
          Component: PlantToSensorTablet,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The margin pieces that stay put, and the pieces a chapter is built from.',
      specimens: [
        {
          id: 'PlantToSensorBreadcrumbMap',
          title: 'Breadcrumb map',
          note: 'The path drawn on the plot plan: area ruled, equipment filled, sensor ringed.',
          origin: 'custom',
          size: 'sm',
          Component: PlantToSensorBreadcrumbMap,
        },
        {
          id: 'PlantToSensorChapterList',
          title: 'Chapter list',
          note: 'Contents and breadcrumb in one: reached chapters link back, the rest say what to choose.',
          origin: 'custom',
          size: 'sm',
          Component: PlantToSensorChapterList,
        },
        {
          id: 'PlantToSensorStepControls',
          title: 'Step controls',
          note: 'Two buttons that always say where they lead, so the story also works without a pointer.',
          origin: 'custom',
          size: 'sm',
          Component: PlantToSensorStepControls,
        },
        {
          id: 'PlantToSensorChapterHead',
          title: 'Chapter head',
          note: 'One sentence and one figure per chapter; everything else supports them.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['kit/StatusPill.tsx', 'kit/TagId.tsx'],
          Component: PlantToSensorChapterHead,
        },
        {
          id: 'PlantToSensorAreaChapter',
          title: 'Area picture',
          note: 'Chapter two ranks the units of an area by health against the watch line.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['kit/Bars.tsx'],
          Component: PlantToSensorAreaChapter,
        },
        {
          id: 'PlantToSensorStepInList',
          title: 'Step-in list',
          note: 'The way down as a list set in type: name, state in words, and the figure large.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['kit/StatusPill.tsx'],
          Component: PlantToSensorStepInList,
        },
      ],
    },
  ],
});
