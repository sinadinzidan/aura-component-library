import { Button } from '@cognite/aura/components/button';
import {
  SegmentedControl,
  SegmentedControlButton,
  SegmentedControlList,
} from '@cognite/aura/components/segmented-control';
import { IconAlertOctagon, IconAlertTriangle, IconArrowBackUp, IconBell, IconChevronRight, IconCircleCheck, IconPlayerPause } from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { Canvas } from '../../../library/kit/Canvas';
import { IconChip } from '../../../library/kit/IconChip';
import { ListRow } from '../../../library/kit/ListRow';
import {
  TREE_LEVEL_LABEL,
  TREE_LEVEL_PLURAL,
  buildAssetTree,
  isAbnormal,
  isOpenAlarm,
  leafCount,
  nodesAt,
  pathTo,
  type TreeLevel,
  type TreeNode,
  type TreeSensor,
} from '../../../library/kit/miller-columns/assetTree';
import { EXTRA_SENSORS } from '../../../library/kit/miller-columns/plantFixture';
import { Panel } from '../../../library/kit/Panel';
import { RingGauge } from '../../../library/kit/RingGauge';
import { Stat } from '../../../library/kit/Stat';
import { StatusPill } from '../../../library/kit/StatusPill';
import { SunburstRings, type SunburstDatum } from '../../../library/kit/sunburst-hierarchy/SunburstRings';
import { TagId } from '../../../library/kit/TagId';
import { formatNumber, type Tone } from '../../../library/kit/tones';
import { TrendLine } from '../../../library/kit/TrendLine';
import { LookScope } from '../../../library/looks/LookScope';
import { ALARMS, ASSETS, SENSORS } from '../../data/plant';
import { MINUTE, formatAgo, formatTime, makeSeries } from '../../data/series';
import { definePage } from '../../types';

import source from './sunburst-hierarchy.tsx?raw';

const SUNBURST_TREE = buildAssetTree({ assets: ASSETS, sensors: [...SENSORS, ...EXTRA_SENSORS], alarms: ALARMS });

/** One decorative family per area, chosen to stay clear of the warning and critical colours. */
const SUNBURST_AREA_TONE: Record<string, Tone> = {
  'nk-20': 'blue',
  'nk-23': 'purple',
  'nk-27': 'teal',
  'nk-40': 'sky',
};

type SunburstWeight = 'tags' | 'risk';

type SunburstColour = 'area' | 'state';

const SUNBURST_WEIGHT_LABEL: Record<SunburstWeight, string> = {
  tags: 'Tag count',
  risk: 'Closeness to limits',
};

function sunburstAreaTone(node: TreeNode): Tone {
  const area = pathTo(SUNBURST_TREE, node.id).find((step) => step.level === 'area');
  return (area ? SUNBURST_AREA_TONE[area.id] : undefined) ?? 'accent';
}

function sunburstReading(sensor: TreeSensor): string {
  return sensor.quality === 'bad' ? 'no reading' : `${formatNumber(sensor.value, sensor.decimals)} ${sensor.unit}`;
}

/** Instrument letters of a tag: `23-VT-92540` → `VT`. Short enough for the outer ring. */
function sunburstShort(node: TreeNode): string {
  return node.level === 'tag' ? (node.tag.split('-')[1] ?? node.tag) : node.tag;
}

/** Turns a tree node into what the chart draws. Units and tags in trouble are filled in their state. */
function sunburstDatum(node: TreeNode, weight: SunburstWeight, colour: SunburstColour): SunburstDatum {
  const alert = isAbnormal(node.tone) && (colour === 'state' || node.level === 'unit' || node.level === 'tag');
  const base: Tone = colour === 'state' ? (node.tone === 'info' || node.tone === 'neutral' ? 'neutral' : 'success') : sunburstAreaTone(node);
  return {
    id: node.id,
    label: node.level === 'tag' ? sunburstShort(node) : node.name,
    short: sunburstShort(node),
    title: `${node.name}, ${node.tag}, ${node.sensor ? `${sunburstReading(node.sensor)}, ` : ''}${node.stateLabel}`,
    tone: alert ? node.tone : base,
    emphasis: alert ? 'alert' : 'normal',
    weight: weight === 'tags' ? 1 : 108 - node.score,
    children: node.children.map((child) => sunburstDatum(child, weight, colour)),
  };
}

/** The last 24 hours of a tag, ending on its current value. A dead signal has no trend. */
function sunburstTrend(sensor: TreeSensor): { values: number[]; labels: string[] } {
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

type SunburstExplorer = {
  /** The node in the middle of the chart. */
  focus: TreeNode;
  /** The node the side panels describe: a picked tag, otherwise the focus. */
  selected: TreeNode;
  weight: SunburstWeight;
  setWeight: (weight: SunburstWeight) => void;
  /** Click on an arc: zoom to it when it has rings below it, otherwise select it. */
  pick: (id: string) => void;
  zoomTo: (id: string) => void;
  up: () => void;
};

function useSunburstExplorer(initialFocus: string, initialSelected: string | null = null): SunburstExplorer {
  const [focusId, setFocusId] = useState(initialFocus);
  const [selectedId, setSelectedId] = useState<string | null>(initialSelected);
  const [weight, setWeight] = useState<SunburstWeight>('tags');
  const focus = SUNBURST_TREE.byId.get(focusId) ?? SUNBURST_TREE.root;
  const selected = (selectedId ? SUNBURST_TREE.byId.get(selectedId) : undefined) ?? focus;

  const zoomTo = (id: string) => {
    setFocusId(id);
    setSelectedId(null);
  };

  return {
    focus,
    selected,
    weight,
    setWeight,
    zoomTo,
    pick: (id) => {
      const node = SUNBURST_TREE.byId.get(id);
      if (!node) return;
      if (node.children.length > 0) zoomTo(id);
      else setSelectedId(id === selectedId ? null : id);
    },
    up: () => {
      if (selectedId) setSelectedId(null);
      else if (focus.parentId) zoomTo(focus.parentId);
    },
  };
}

function SunburstStateIcon({ tone }: { tone: Tone }) {
  if (tone === 'critical') return <IconAlertOctagon />;
  if (tone === 'warning') return <IconAlertTriangle />;
  if (tone === 'info') return <IconPlayerPause />;
  return <IconCircleCheck />;
}

/** The centre of the chart: the focused node and its health. Pressing it steps out one level. */
function SunburstCenter({ explorer, size = 'lg' }: { explorer: SunburstExplorer; size?: 'md' | 'lg' }) {
  const { focus } = explorer;
  const top = focus.parentId === null;
  return (
    <button
      type="button"
      disabled={top}
      onClick={explorer.up}
      aria-label={top ? `${focus.name}, health ${focus.score}` : `${focus.name}, health ${focus.score}. Step out`}
      className="flex h-full w-full flex-col items-center justify-center rounded-full border border-[color:var(--kit-rule)] bg-[var(--kit-surface)] px-4 text-center outline-none backdrop-blur-xl focus-visible:ring-2 focus-visible:ring-[color:var(--kit-text)] enabled:hover:bg-[color-mix(in_oklab,var(--kit-text)_12%,transparent)]"
    >
      <span className="text-xs font-medium text-[color:var(--kit-text-2)]">{TREE_LEVEL_LABEL[focus.level]} health</span>
      <span className={`font-semibold tracking-tight tabular-nums ${size === 'lg' ? 'text-6xl' : 'text-4xl'} leading-none`}>{focus.score}</span>
      <span className={`mt-1 font-semibold leading-tight ${size === 'lg' ? 'text-sm' : 'text-xs'}`}>{focus.name}</span>
      {top ? null : (
        <span className="mt-1.5 flex items-center gap-1 text-xs font-medium text-[color:var(--kit-text-2)]">
          <IconArrowBackUp aria-hidden="true" className="size-3.5" /> Step out
        </span>
      )}
    </button>
  );
}

function SunburstChart({
  explorer,
  colour = 'area',
  centerSize = 'lg',
  displaySize = 600,
  className,
}: {
  explorer: SunburstExplorer;
  colour?: SunburstColour;
  centerSize?: 'md' | 'lg';
  /** The width the chart is drawn at, in px: keeps arc labels readable. */
  displaySize?: number;
  className?: string;
}) {
  const { focus, selected, weight } = explorer;
  return (
    <SunburstRings
      label={`${focus.name}: ${leafCount(focus)} tags by ${TREE_LEVEL_PLURAL[focus.children[0]?.level ?? 'tag']}`}
      root={sunburstDatum(focus, weight, colour)}
      selectedId={selected.id === focus.id ? null : selected.id}
      onPick={explorer.pick}
      center={<SunburstCenter explorer={explorer} size={centerSize} />}
      displaySize={displaySize}
      className={className}
    />
  );
}

/** A floating glass chip: the surface every overlay around the chart sits on. */
function SunburstFloat({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      style={{ boxShadow: 'var(--kit-panel-shadow)' }}
      className={`rounded-[var(--kit-radius-sm)] border border-[color:var(--kit-rule)] bg-[var(--kit-surface)] backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}

function SunburstCrumbs({ explorer }: { explorer: SunburstExplorer }) {
  const trail = pathTo(SUNBURST_TREE, explorer.selected.id);
  return (
    <SunburstFloat className="flex items-center gap-1 p-1.5">
      <Button variant="ghost" size="sm" disabled={trail.length <= 1} onClick={explorer.up}>
        <IconArrowBackUp /> Back
      </Button>
      <nav aria-label="Path">
        <ol className="flex flex-wrap items-center gap-0.5 pr-2 text-sm">
          {trail.map((node, index) => {
            const current = node.id === explorer.selected.id;
            return (
              <li key={node.id} className="flex items-center gap-0.5">
                {index > 0 ? <IconChevronRight aria-hidden="true" className="size-3.5 text-[color:var(--kit-text-3)]" /> : null}
                <button
                  type="button"
                  aria-current={current ? 'location' : undefined}
                  onClick={() => (node.children.length > 0 ? explorer.zoomTo(node.id) : explorer.pick(node.id))}
                  className={`rounded-full px-2 py-0.5 tabular-nums hover:bg-[color-mix(in_oklab,var(--kit-text)_12%,transparent)] ${
                    current ? 'bg-[color-mix(in_oklab,var(--kit-text)_14%,transparent)] font-semibold' : 'font-medium text-[color:var(--kit-text-2)]'
                  }`}
                >
                  {index === 0 ? node.name : node.tag}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
    </SunburstFloat>
  );
}

function SunburstWeightSwitch({ explorer }: { explorer: SunburstExplorer }) {
  return (
    <SegmentedControl value={explorer.weight} onValueChange={(next) => explorer.setWeight(next === 'risk' ? 'risk' : 'tags')}>
      <SegmentedControlList size="small" aria-label="Arc width">
        <SegmentedControlButton value="tags">{SUNBURST_WEIGHT_LABEL.tags}</SegmentedControlButton>
        <SegmentedControlButton value="risk">{SUNBURST_WEIGHT_LABEL.risk}</SegmentedControlButton>
      </SegmentedControlList>
    </SegmentedControl>
  );
}

/** Which ring is which level, drawn as the rings themselves, with the count on each. */
function SunburstRingGuide({ focus }: { focus: TreeNode }) {
  const levels: TreeLevel[] = [];
  let cursor: TreeNode | undefined = focus.children[0];
  while (cursor) {
    levels.push(cursor.level);
    cursor = cursor.children[0];
  }
  return (
    <SunburstFloat className="p-3">
      <p className="text-xs font-semibold text-[color:var(--kit-text-2)]">Rings, from the centre</p>
      <ol className="mt-2 space-y-1.5">
        {levels.map((level, index) => (
          <li key={level} className="flex items-center gap-2.5 text-sm">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5 shrink-0">
              {levels.map((ring, ringIndex) => (
                <circle
                  key={ring}
                  cx="12"
                  cy="12"
                  r={4 + ringIndex * 3.5}
                  fill="none"
                  strokeWidth={ringIndex === index ? 2.5 : 1}
                  stroke={ringIndex === index ? 'var(--kit-text)' : 'var(--kit-rule-strong)'}
                />
              ))}
            </svg>
            <span className="font-medium">{TREE_LEVEL_LABEL[level]}s</span>
            <span className="ml-auto pl-4 tabular-nums text-[color:var(--kit-text-2)]">{nodesAt(focus, level).length}</span>
          </li>
        ))}
      </ol>
    </SunburstFloat>
  );
}

/** How many tags under the focus are in each state: the legend for the solid arcs. */
function SunburstStateLegend({ focus }: { focus: TreeNode }) {
  const tags = nodesAt(focus, 'tag');
  const count = (tone: Tone) => tags.filter((tag) => tag.tone === tone).length;
  return (
    <SunburstFloat className="flex flex-col items-start gap-1.5 p-3">
      <p className="text-xs font-semibold text-[color:var(--kit-text-2)]">Tags by state</p>
      <StatusPill tone="critical" variant="filled" icon={<IconAlertOctagon />}>
        {count('critical')} critical
      </StatusPill>
      <StatusPill tone="warning" variant="filled" icon={<IconAlertTriangle />}>
        {count('warning')} in alarm
      </StatusPill>
      <StatusPill tone="success" icon={<IconCircleCheck />}>
        {count('success')} normal
      </StatusPill>
    </SunburstFloat>
  );
}

function SunburstFact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-[color:var(--kit-rule)] py-2 text-sm first:border-t-0">
      <dt className="text-[color:var(--kit-text-2)]">{label}</dt>
      <dd className="text-right font-medium tabular-nums">{children}</dd>
    </div>
  );
}

/** Who is selected: name, tag and state, then health for an asset or the reading for a tag. */
function SunburstFocusPanel({ node, className }: { node: TreeNode; className?: string }) {
  const sensor = node.sensor;
  const parent = node.parentId ? SUNBURST_TREE.byId.get(node.parentId) : undefined;
  return (
    <Panel className={className} tone={isAbnormal(node.tone) ? node.tone : sunburstAreaTone(node)}>
      <p className="text-xs font-medium text-[color:var(--kit-text-2)]">{TREE_LEVEL_LABEL[node.level]}</p>
      <h3 className="text-xl font-semibold leading-6 tracking-tight">{node.name}</h3>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <TagId variant="chip">{node.tag}</TagId>
        <StatusPill tone={node.tone} icon={<SunburstStateIcon tone={node.tone} />}>
          {node.stateLabel}
        </StatusPill>
      </div>
      {sensor ? (
        <div className="mt-4">
          <p className="flex items-baseline gap-2">
            <span className="text-5xl font-semibold leading-none tracking-tight tabular-nums">{sensor.quality === 'bad' ? '—' : formatNumber(sensor.value, sensor.decimals)}</span>
            <span className="text-base font-medium text-[color:var(--kit-text-2)]">{sensor.unit}</span>
          </p>
          <dl className="mt-3">
            <SunburstFact label="High limit">
              {formatNumber(sensor.highLimit, sensor.decimals)} {sensor.unit}
            </SunburstFact>
            <SunburstFact label="Measured on">{parent ? parent.name : '—'}</SunburstFact>
          </dl>
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-4">
          <RingGauge label={`${node.name} health`} value={node.score} unit="" size={92} tone={isAbnormal(node.tone) ? node.tone : 'success'} hideLabel />
          <dl className="min-w-0 flex-1">
            <SunburstFact label="Units">{nodesAt(node, 'unit').length}</SunburstFact>
            <SunburstFact label="Tags">{nodesAt(node, 'tag').length}</SunburstFact>
            <SunburstFact label="Open alarms">{node.openAlarms}</SunburstFact>
          </dl>
        </div>
      )}
    </Panel>
  );
}

/** The first ring as a list: each child with its share of the circle. Pick one to zoom to it. */
function SunburstInsideList({ explorer, limit = 5 }: { explorer: SunburstExplorer; limit?: number }) {
  const { focus, weight } = explorer;
  const weigh = (node: TreeNode): number => (node.children.length === 0 ? (weight === 'tags' ? 1 : 108 - node.score) : node.children.reduce((sum, child) => sum + weigh(child), 0));
  const total = weigh(focus) || 1;
  const ranked = [...focus.children].sort((a, b) => weigh(b) - weigh(a)).slice(0, limit);
  return (
    <ul className="flex flex-1 flex-col justify-between gap-2.5">
      {ranked.map((child) => {
        const share = Math.round((weigh(child) / total) * 100);
        const alert = isAbnormal(child.tone);
        return (
          <li key={child.id}>
            <button type="button" onClick={() => explorer.pick(child.id)} className="block w-full rounded-[var(--kit-radius-sm)] text-left outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--kit-text)]">
              <span className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-medium">{child.name}</span>
                <span className="shrink-0 tabular-nums text-[color:var(--kit-text-2)]">{child.sensor ? sunburstReading(child.sensor) : `${share} %`}</span>
              </span>
              <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-[var(--kit-track)]" aria-hidden="true">
                <span data-tone={alert ? child.tone : sunburstAreaTone(child)} className="block h-full rounded-full bg-[var(--t-line)]" style={{ width: `${Math.max(share, 3)}%` }} />
              </span>
              {alert ? (
                <span data-tone={child.tone} className="mt-1 block text-xs font-semibold text-[color:var(--t-ink)]">
                  {child.stateLabel}
                </span>
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function SunburstTagTrend({ sensor, height = 190 }: { sensor: TreeSensor; height?: number }) {
  const { values, labels } = sunburstTrend(sensor);
  if (values.length === 0) return <p className="text-sm text-[color:var(--kit-text-2)]">The transmitter has not reported since 05:02, so there is no trend to draw.</p>;
  return (
    <TrendLine
      label={`${sensor.name}, ${sensor.tag}, last 24 hours`}
      series={[{ id: 'value', label: sensor.name, values, tone: 'accent' }]}
      labels={labels}
      unit={sensor.unit}
      decimals={sensor.decimals}
      limits={sensor.value === 0 ? [] : [{ value: sensor.highLimit, label: 'High', tone: 'warning' }]}
      fill
      height={height}
      showLegend={false}
    />
  );
}

function SunburstAlarmList({ node, limit = 2 }: { node: TreeNode; limit?: number }) {
  const open = node.alarms.filter(isOpenAlarm).slice(0, limit);
  if (open.length === 0) {
    return (
      <p className="flex items-center gap-2 text-sm text-[color:var(--kit-text-2)]">
        <IconCircleCheck aria-hidden="true" className="size-4 shrink-0" /> Nothing open on or below this {TREE_LEVEL_LABEL[node.level].toLowerCase()}.
      </p>
    );
  }
  return (
    <ul>
      {open.map((alarm) => {
        const tone: Tone = alarm.severity === 'critical' ? 'critical' : alarm.severity === 'low' ? 'neutral' : 'warning';
        return (
          <ListRow
            key={alarm.id}
            tone={tone}
            leading={
              <IconChip tone={tone} size="sm">
                <IconBell />
              </IconChip>
            }
            title={alarm.message}
            meta={
              <span className="tabular-nums">
                {alarm.sensorTag} · {alarm.value} · {formatAgo(alarm.raisedAt)}
              </span>
            }
          />
        );
      })}
    </ul>
  );
}

function SunburstHierarchySignature() {
  const explorer = useSunburstExplorer('nk');
  const { focus, selected } = explorer;
  const sensor = selected.sensor;

  return (
    <LookScope look="glass">
      <Canvas className="@container flex h-[840px] gap-4">
        <div className="relative flex min-w-0 flex-1 items-center justify-center">
          <SunburstChart explorer={explorer} className="max-h-full max-w-[720px]" />
          <div className="absolute left-0 top-0 max-w-[calc(100%-18rem)]">
            <SunburstCrumbs explorer={explorer} />
          </div>
          <div className="absolute right-0 top-0">
            <SunburstFloat className="p-1.5">
              <SunburstWeightSwitch explorer={explorer} />
            </SunburstFloat>
          </div>
          <div className="absolute bottom-0 left-0">
            <SunburstRingGuide focus={focus} />
          </div>
          <div className="absolute bottom-0 right-0">
            <SunburstStateLegend focus={focus} />
          </div>
        </div>
        <div className="flex w-[300px] shrink-0 flex-col gap-4 @min-[1040px]:w-[330px]">
          <SunburstFocusPanel node={selected} />
          <Panel
            className="flex-1"
            title={sensor ? 'Last 24 hours' : `Inside ${focus.name}`}
            subtitle={sensor ? `${sensor.unit}, against the high limit` : `Share of the circle by ${SUNBURST_WEIGHT_LABEL[explorer.weight].toLowerCase()}`}
          >
            {sensor ? <SunburstTagTrend sensor={sensor} /> : <SunburstInsideList explorer={explorer} />}
          </Panel>
          <Panel title="Open alarms" subtitle="Newest first">
            <SunburstAlarmList node={selected} />
          </Panel>
        </div>
      </Canvas>
    </LookScope>
  );
}

function SunburstHierarchyTablet() {
  const explorer = useSunburstExplorer('nk-23');
  const { focus } = explorer;
  return (
    <LookScope look="glass" className="mx-auto w-full max-w-2xl">
      <Canvas className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <SunburstCrumbs explorer={explorer} />
          <StatusPill tone={focus.tone} size="lg" variant="filled" icon={<SunburstStateIcon tone={focus.tone} />}>
            {focus.stateLabel}
          </StatusPill>
        </div>
        <SunburstChart explorer={explorer} displaySize={520} className="mx-auto max-w-[520px]" />
        <Panel title={`Inside ${focus.name}`} subtitle="Pick a row or an arc to zoom">
          <ul className="grid grid-cols-2 gap-x-6">
            {focus.children.map((child) => (
              <ListRow
                key={child.id}
                tone={isAbnormal(child.tone) ? child.tone : 'neutral'}
                title={
                  <button type="button" className="text-left font-medium" onClick={() => explorer.pick(child.id)}>
                    {child.name}
                  </button>
                }
                meta={child.sensor ? sunburstReading(child.sensor) : <TagId>{child.tag}</TagId>}
                trailing={
                  <StatusPill tone={child.tone} icon={<SunburstStateIcon tone={child.tone} />}>
                    {child.stateLabel}
                  </StatusPill>
                }
              />
            ))}
          </ul>
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function SunburstHierarchyWall() {
  const explorer = useSunburstExplorer('nk');
  const areas = SUNBURST_TREE.root.children;
  const flagged = areas.filter((area) => isAbnormal(area.tone));
  return (
    <LookScope look="signal">
      <Canvas className="grid grid-cols-12 items-stretch gap-4">
        <div className="col-span-5 flex flex-col gap-4">
          <Stat
            size="hero"
            tone={flagged.some((area) => area.tone === 'critical') ? 'critical' : flagged.length > 0 ? 'warning' : 'success'}
            label="Nordkapp plant, 14:00 UTC"
            value={flagged.length}
            unit={`of ${areas.length} areas`}
            state={flagged.length > 0 ? 'Need attention' : 'All normal'}
            stateIcon={<IconAlertOctagon />}
          />
          <div className="grid flex-1 grid-cols-2 gap-4">
            {areas.map((area) => (
              <Stat
                key={area.id}
                size="md"
                tone={area.tone === 'info' || area.tone === 'neutral' ? 'success' : area.tone}
                label={area.name}
                value={area.score}
                unit="health"
                state={area.tone === 'success' ? 'Normal' : area.tone === 'critical' ? 'Critical' : 'Watch'}
                stateIcon={<SunburstStateIcon tone={area.tone} />}
              />
            ))}
          </div>
        </div>
        <Panel className="col-span-7" title="Where it is" subtitle="Every tag in the plant; solid arcs are in alarm or tripped">
          <div className="flex flex-1 items-center justify-center">
            <SunburstChart explorer={explorer} colour="state" centerSize="md" displaySize={520} className="max-w-[520px]" />
          </div>
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function SunburstHierarchyChart() {
  const explorer = useSunburstExplorer('23-ka-9101');
  return (
    <LookScope look="glass" className="w-full">
      <Canvas className="flex justify-center">
        <SunburstChart explorer={explorer} centerSize="md" displaySize={440} className="max-w-[440px]" />
      </Canvas>
    </LookScope>
  );
}

function SunburstHierarchyFocusPanel() {
  const node = SUNBURST_TREE.byId.get('nk-23') ?? SUNBURST_TREE.root;
  const tag = SUNBURST_TREE.byId.get('vt-92740') ?? SUNBURST_TREE.root;
  return (
    <LookScope look="glass" className="w-full">
      <Canvas className="flex h-full flex-col justify-center gap-4">
        <SunburstFocusPanel node={node} />
        <SunburstFocusPanel node={tag} />
      </Canvas>
    </LookScope>
  );
}

function SunburstHierarchyCrumbs() {
  const explorer = useSunburstExplorer('nk-23');
  return (
    <LookScope look="glass" className="w-full">
      <Canvas className="flex min-h-40 items-center justify-center">
        <SunburstCrumbs explorer={explorer} />
      </Canvas>
    </LookScope>
  );
}

function SunburstHierarchyRingGuide() {
  return (
    <LookScope look="glass" className="w-full">
      <Canvas className="flex min-h-40 items-center justify-center">
        <SunburstRingGuide focus={SUNBURST_TREE.root} />
      </Canvas>
    </LookScope>
  );
}

function SunburstHierarchyStateLegend() {
  return (
    <LookScope look="glass" className="w-full">
      <Canvas className="flex min-h-40 items-center justify-center">
        <SunburstStateLegend focus={SUNBURST_TREE.root} />
      </Canvas>
    </LookScope>
  );
}

function SunburstHierarchyInside() {
  const explorer = useSunburstExplorer('nk-23');
  return (
    <LookScope look="glass" className="w-full">
      <Canvas>
        <Panel
          title={`Inside ${explorer.focus.name}`}
          subtitle={`Share of the circle by ${SUNBURST_WEIGHT_LABEL[explorer.weight].toLowerCase()}`}
          actions={<SunburstWeightSwitch explorer={explorer} />}
        >
          <SunburstInsideList explorer={explorer} />
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function SunburstHierarchyTagTrend() {
  const node = SUNBURST_TREE.byId.get('tt-92532');
  return (
    <LookScope look="glass" className="w-full">
      <Canvas>
        <Panel title="Last 24 hours" subtitle="Discharge temperature, °C, against the high limit">
          {node?.sensor ? <SunburstTagTrend sensor={node.sensor} height={230} /> : null}
        </Panel>
      </Canvas>
    </LookScope>
  );
}

export default definePage({
  id: 'sunburst-hierarchy',
  title: 'Sunburst hierarchy',
  summary:
    'The asset tree as rings: the plant in the middle, then areas, units and tags. Arc width is the number of tags below, or how close they run to their limits, and anything in alarm is filled solid. Pick an arc to make it the centre.',
  guidance: {
    use: [
      'To show the shape of a hierarchy and where its trouble sits in one picture.',
      'With three or four levels and a few dozen leaves; zoom to go deeper.',
      'As a showpiece or an overview next to a list that carries the exact figures.',
    ],
    avoid: [
      'Reading precise values off arc lengths; pair it with a list or a table.',
      'More than four rings at once: the outer arcs become slivers.',
      'A hue per node. Hue is the area; state is the solid fill, always with a word nearby.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Pick an arc to zoom, the centre or the breadcrumb to step back out. Pick a tag to read it on the right.',
      specimens: [
        {
          id: 'SunburstHierarchySignature',
          title: 'Sunburst hierarchy',
          note: 'Pick it when people need to see the whole tree and its trouble spots at once, then zoom in.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/sunburst-hierarchy/SunburstRings.tsx', 'experiences/drilldown/sunburstLayout.ts', 'kit/miller-columns/assetTree.ts', 'kit/Panel.tsx', 'kit/RingGauge.tsx', 'looks/LookScope.tsx'],
          Component: SunburstHierarchySignature,
        },
      ],
    },
    {
      id: 'variations',
      title: 'Variations',
      description: 'Zoomed into one area on a tablet, and the same tree as a status wall.',
      specimens: [
        {
          id: 'SunburstHierarchyTablet',
          title: 'One area on a tablet',
          note: 'Pick it for a narrow screen: the chart on top, the first ring as a list underneath.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/sunburst-hierarchy/SunburstRings.tsx', 'kit/ListRow.tsx', 'kit/StatusPill.tsx'],
          Component: SunburstHierarchyTablet,
        },
        {
          id: 'SunburstHierarchyWall',
          title: 'Status wall',
          note: 'Pick it for a wall screen: colour carries state only, and the count of areas in trouble leads.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/sunburst-hierarchy/SunburstRings.tsx', 'kit/Stat.tsx', 'looks/LookScope.tsx'],
          Component: SunburstHierarchyWall,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The chart and the floating pieces around it.',
      specimens: [
        {
          id: 'SunburstHierarchyChart',
          title: 'Chart on one unit',
          note: 'With one ring left the arcs are wide enough to carry instrument letters.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/sunburst-hierarchy/SunburstRings.tsx'],
          Component: SunburstHierarchyChart,
        },
        {
          id: 'SunburstHierarchyFocusPanel',
          title: 'Focus panel',
          note: 'An asset shows health and counts; a tag shows its reading and limit.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/RingGauge.tsx', 'kit/TagId.tsx'],
          Component: SunburstHierarchyFocusPanel,
        },
        {
          id: 'SunburstHierarchyCrumbs',
          title: 'Breadcrumb',
          note: 'The way back: every ancestor is one press away.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          Component: SunburstHierarchyCrumbs,
        },
        {
          id: 'SunburstHierarchyRingGuide',
          title: 'Ring guide',
          note: 'Says which ring is which level, since the rings themselves carry no axis.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          Component: SunburstHierarchyRingGuide,
        },
        {
          id: 'SunburstHierarchyStateLegend',
          title: 'State legend',
          note: 'Counts the solid arcs by state, in words.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['kit/StatusPill.tsx'],
          Component: SunburstHierarchyStateLegend,
        },
        {
          id: 'SunburstHierarchyInside',
          title: 'First ring as a list',
          note: 'The exact shares the arcs only suggest, with the switch for what arc width means.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx'],
          Component: SunburstHierarchyInside,
        },
        {
          id: 'SunburstHierarchyTagTrend',
          title: 'Tag trend',
          note: 'What replaces the list when a tag is picked.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/TrendLine.tsx'],
          Component: SunburstHierarchyTagTrend,
        },
      ],
    },
  ],
});
