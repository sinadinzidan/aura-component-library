import { Button } from '@cognite/aura/components/button';
import {
  IconActivity,
  IconAdjustmentsHorizontal,
  IconAlertOctagon,
  IconAlertTriangle,
  IconArrowLeft,
  IconArrowRight,
  IconBell,
  IconBolt,
  IconBuildingFactory2,
  IconChartLine,
  IconChevronRight,
  IconCircleCheck,
  IconContainer,
  IconCopy,
  IconDroplet,
  IconFlame,
  IconGauge,
  IconLayoutGrid,
  IconPlayerPause,
  IconPropeller,
  IconRipple,
  IconRotateClockwise,
  IconSitemap,
  IconStar,
  IconTemperature,
  IconWaveSine,
  IconWorld,
} from '@cognite/aura/icons';
import { useEffect, useId, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

import { AppFrame } from '../../../library/kit/AppFrame';
import { Canvas } from '../../../library/kit/Canvas';
import { Delta } from '../../../library/kit/Delta';
import { EmptyPanel } from '../../../library/kit/EmptyPanel';
import { IconChip } from '../../../library/kit/IconChip';
import { ListRow } from '../../../library/kit/ListRow';
import { Meter } from '../../../library/kit/Meter';
import {
  TREE_LEVEL_LABEL,
  TREE_LEVEL_PLURAL,
  buildAssetTree,
  childSummary,
  isAbnormal,
  isOpenAlarm,
  nodesAt,
  pathTo,
  type TreeAsset,
  type TreeLevel,
  type TreeNode,
  type TreeSensor,
} from '../../../library/kit/miller-columns/assetTree';
import { activeNode, millerColumns, movePath, selectNode, type MillerColumn, type MillerKey } from '../../../library/kit/miller-columns/millerPath';
import { EXTRA_SENSORS } from '../../../library/kit/miller-columns/plantFixture';
import { Panel } from '../../../library/kit/Panel';
import { RingGauge } from '../../../library/kit/RingGauge';
import { StatusPill } from '../../../library/kit/StatusPill';
import { TagId } from '../../../library/kit/TagId';
import { formatNumber, type Tone } from '../../../library/kit/tones';
import { TrendLine, type TrendLimit } from '../../../library/kit/TrendLine';
import { LookScope } from '../../../library/looks/LookScope';
import { ALARMS, ASSETS, SENSORS } from '../../data/plant';
import { MINUTE, formatAgo, formatTime, makeSeries } from '../../data/series';
import { definePage } from '../../types';

import source from './miller-columns.tsx?raw';

/** The fleet above Nordkapp: three more sites whose areas are listed but not yet mapped to units. */
const MILLER_FLEET: readonly TreeAsset[] = [
  { id: 'fleet', tag: 'NCS', name: 'Norwegian fleet', type: 'fleet', parentId: null, state: 'running', health: 'good', healthScore: 90 },
  { id: 'hl', tag: 'HL', name: 'Hammerfest LNG', type: 'site', parentId: 'fleet', state: 'running', health: 'watch', healthScore: 81 },
  { id: 'vs', tag: 'VS', name: 'Valhall Sør', type: 'site', parentId: 'fleet', state: 'running', health: 'good', healthScore: 93 },
  { id: 'st', tag: 'ST', name: 'Stord terminal', type: 'site', parentId: 'fleet', state: 'running', health: 'good', healthScore: 95 },
  { id: 'hl-25', tag: 'HL-25', name: 'Liquefaction', type: 'area', parentId: 'hl', state: 'running', health: 'watch', healthScore: 74 },
  { id: 'hl-30', tag: 'HL-30', name: 'Storage and loading', type: 'area', parentId: 'hl', state: 'running', health: 'good', healthScore: 90 },
  { id: 'hl-40', tag: 'HL-40', name: 'Utilities', type: 'area', parentId: 'hl', state: 'running', health: 'good', healthScore: 86 },
  { id: 'vs-10', tag: 'VS-10', name: 'Wellhead platform', type: 'area', parentId: 'vs', state: 'running', health: 'good', healthScore: 94 },
  { id: 'vs-20', tag: 'VS-20', name: 'Process platform', type: 'area', parentId: 'vs', state: 'running', health: 'good', healthScore: 92 },
  { id: 'st-50', tag: 'ST-50', name: 'Tank farm', type: 'area', parentId: 'st', state: 'running', health: 'good', healthScore: 96 },
  { id: 'st-60', tag: 'ST-60', name: 'Jetty', type: 'area', parentId: 'st', state: 'standby', health: 'good', healthScore: 94 },
];

const MILLER_ASSETS: readonly TreeAsset[] = [
  ...MILLER_FLEET.slice(0, 1),
  ...ASSETS.map((asset) => (asset.parentId === null ? { ...asset, parentId: 'fleet' } : asset)),
  ...MILLER_FLEET.slice(1),
];

const MILLER_TREE = buildAssetTree({
  assets: MILLER_ASSETS,
  sensors: [...SENSORS, ...EXTRA_SENSORS],
  alarms: ALARMS,
  levels: ['fleet', 'site', 'area', 'unit'],
});

/** The four columns the browser always shows, left to right. */
const MILLER_SLOTS: readonly TreeLevel[] = ['site', 'area', 'unit', 'tag'];

const MILLER_SLOT_HINT: Record<TreeLevel, string> = {
  fleet: 'Pick a fleet.',
  site: 'Pick a site.',
  area: 'Pick a site to list its areas.',
  unit: 'Pick an area to list its units.',
  tag: 'Pick a unit to list its tags.',
};

const MILLER_KEYS: Record<string, MillerKey> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  Home: 'home',
  End: 'end',
};

const MILLER_KIND_ICON: Record<string, ReactNode> = {
  fleet: <IconWorld />,
  site: <IconBuildingFactory2 />,
  area: <IconLayoutGrid />,
  system: <IconLayoutGrid />,
  compressor: <IconPropeller />,
  pump: <IconDroplet />,
  separator: <IconContainer />,
  exchanger: <IconTemperature />,
  valve: <IconAdjustmentsHorizontal />,
  turbine: <IconFlame />,
};

/** Instrument letters of a tag such as `23-VT-92540` choose the icon of a measurement. */
const MILLER_SIGNAL_ICON: Record<string, ReactNode> = {
  PT: <IconGauge />,
  TT: <IconTemperature />,
  VT: <IconWaveSine />,
  ST: <IconRotateClockwise />,
  FT: <IconRipple />,
  LT: <IconDroplet />,
  ZT: <IconAdjustmentsHorizontal />,
  IT: <IconBolt />,
};

const MILLER_CARD = 'border border-[color:var(--kit-rule)] bg-[var(--kit-surface)] rounded-[var(--kit-radius)]';

const MILLER_CARD_SHADOW = { boxShadow: 'var(--kit-panel-shadow)' };

function millerIcon(node: TreeNode): ReactNode {
  if (node.level === 'tag') return MILLER_SIGNAL_ICON[node.tag.split('-')[1] ?? ''] ?? <IconActivity />;
  return MILLER_KIND_ICON[node.kind] ?? <IconSitemap />;
}

/** The short word a row carries when its node is not simply running or normal. */
function millerWord(node: TreeNode): string | null {
  if (node.children.length > 0 && node.level !== 'unit') return node.tone === 'critical' ? 'Critical below' : node.tone === 'warning' ? 'Needs attention' : null;
  return node.stateLabel === 'Running' || node.stateLabel === 'Normal' ? null : node.stateLabel;
}

function millerValue(sensor: TreeSensor): string {
  return sensor.quality === 'bad' ? 'No reading' : `${formatNumber(sensor.value, sensor.decimals)} ${sensor.unit}`;
}

/** The last 24 hours of a tag, ending on its current value. A dead signal has no trend. */
function millerTrend(sensor: TreeSensor): { values: number[]; labels: string[] } {
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

function MillerStateIcon({ tone }: { tone: Tone }) {
  if (tone === 'critical') return <IconAlertOctagon />;
  if (tone === 'warning') return <IconAlertTriangle />;
  if (tone === 'info') return <IconPlayerPause />;
  return <IconCircleCheck />;
}

type MillerRowMode = 'active' | 'trail' | 'idle';

function MillerRow({ node, mode, compact = false, onSelect }: { node: TreeNode; mode: MillerRowMode; compact?: boolean; onSelect: (id: string) => void }) {
  const word = millerWord(node);
  const surface =
    mode === 'active'
      ? 'bg-[var(--kit-accent)] text-[color:var(--kit-on-accent)]'
      : mode === 'trail'
        ? 'bg-[color-mix(in_oklab,var(--kit-line-accent)_13%,transparent)]'
        : 'hover:bg-[color-mix(in_oklab,var(--kit-text)_5%,transparent)]';
  const quiet = mode === 'active' ? 'opacity-85' : 'text-[color:var(--kit-text-2)]';

  return (
    <li>
      <button
        type="button"
        data-row={node.id}
        aria-pressed={mode !== 'idle'}
        tabIndex={mode === 'active' ? 0 : -1}
        onClick={() => onSelect(node.id)}
        className={`flex w-full items-center gap-2.5 rounded-[var(--kit-radius-sm)] px-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--kit-line-accent)] ${compact ? 'py-1.5' : 'py-2.5'} ${surface}`}
      >
        <span className="hidden @min-[620px]:inline-flex">
          <IconChip tone={isAbnormal(node.tone) ? node.tone : node.level === 'tag' ? 'neutral' : 'accent'} size="sm">
            {millerIcon(node)}
          </IconChip>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium leading-5">{node.name}</span>
          <span className={`block text-xs leading-4 tabular-nums ${quiet}`}>
            {node.sensor ? <span className="font-medium">{millerValue(node.sensor)}</span> : node.tag}
          </span>
          {word ? (
            <span data-tone={node.tone} className={`block text-xs font-semibold leading-4 ${mode === 'active' ? '' : 'text-[color:var(--t-ink)]'}`}>
              {word}
            </span>
          ) : null}
        </span>
        {node.children.length > 0 ? <IconChevronRight aria-hidden="true" className={`size-4 shrink-0 ${quiet}`} /> : null}
      </button>
    </li>
  );
}

/** A thin stacked bar of how many rows are in each state, with the sentence that goes with it. */
function MillerRollup({ nodes }: { nodes: readonly TreeNode[] }) {
  const attention = nodes.filter((node) => isAbnormal(node.tone)).length;
  const order: readonly Tone[] = ['critical', 'warning', 'info', 'neutral', 'success'];
  return (
    <div className="space-y-1.5">
      <div className="flex h-1.5 gap-0.5 overflow-hidden rounded-full" aria-hidden="true">
        {order.flatMap((tone) =>
          nodes.filter((node) => node.tone === tone).map((node) => <span key={node.id} data-tone={tone} className="flex-1 bg-[var(--t-line)]" />)
        )}
      </div>
      <p className="text-xs text-[color:var(--kit-text-2)]">{attention === 0 ? 'All normal' : `${attention} of ${nodes.length} flagged`}</p>
    </div>
  );
}

function MillerColumnList({
  level,
  column,
  deadEnd,
  activeId,
  compact = false,
  onSelect,
}: {
  level: TreeLevel;
  column: MillerColumn | undefined;
  /** The selected node, when it has nothing below it and this is the column its children would fill. */
  deadEnd?: TreeNode;
  activeId: string;
  compact?: boolean;
  onSelect: (id: string) => void;
}) {
  const nodes = column?.nodes ?? [];
  return (
    <section aria-label={TREE_LEVEL_PLURAL[level]} className="flex min-h-0 min-w-0 flex-1 flex-col">
      <header className="flex items-center justify-between gap-2 border-b border-[color:var(--kit-rule)] px-4 py-3">
        <h3 className="text-sm font-semibold">{TREE_LEVEL_LABEL[level]}</h3>
        <span className="rounded-full bg-[color-mix(in_oklab,var(--kit-text)_7%,transparent)] px-2 text-xs font-medium leading-5 tabular-nums text-[color:var(--kit-text-2)]">
          {nodes.length}
        </span>
      </header>
      {nodes.length > 0 ? (
        <>
          <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-1.5">
            {nodes.map((node) => (
              <MillerRow
                key={node.id}
                node={node}
                compact={compact}
                mode={node.id === activeId ? 'active' : node.id === column?.selectedId ? 'trail' : 'idle'}
                onSelect={onSelect}
              />
            ))}
          </ul>
          {compact ? null : (
            <footer className="border-t border-[color:var(--kit-rule)] px-4 py-3">
              <MillerRollup nodes={nodes} />
            </footer>
          )}
        </>
      ) : (
        <div className="flex flex-1 items-center justify-center p-4 text-center">
          <p className="max-w-40 text-sm text-[color:var(--kit-text-2)]">
            {deadEnd ? `No ${TREE_LEVEL_PLURAL[level]} are mapped under ${deadEnd.name} yet.` : MILLER_SLOT_HINT[level]}
          </p>
        </div>
      )}
    </section>
  );
}

type MillerBrowser = {
  path: readonly string[];
  node: TreeNode;
  columns: readonly MillerColumn[];
  /** Marks the element that wraps the columns, so the keyboard can move focus with the selection. */
  scope: string;
  select: (id: string) => void;
  move: (key: MillerKey) => void;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
};

/** Selection state of one browser: click or arrow keys change the path, focus follows the keys. */
function useMillerBrowser(initial: readonly string[]): MillerBrowser {
  const [path, setPath] = useState<readonly string[]>(initial);
  const [keyMoves, setKeyMoves] = useState(0);
  const scope = useId();
  const node = activeNode(MILLER_TREE, path);

  useEffect(() => {
    if (keyMoves === 0) return;
    const row = document.querySelector(`[data-miller="${scope}"] [data-row="${node.id}"]`);
    if (row instanceof HTMLElement) row.focus();
  }, [keyMoves, node.id, scope]);

  const move = (key: MillerKey) => {
    setPath((current) => movePath(MILLER_TREE, current, key));
    setKeyMoves((count) => count + 1);
  };

  return {
    path,
    node,
    columns: millerColumns(MILLER_TREE, path),
    scope,
    select: (id) => setPath(selectNode(MILLER_TREE, id)),
    move,
    onKeyDown: (event) => {
      const key = MILLER_KEYS[event.key];
      if (!key) return;
      event.preventDefault();
      move(key);
    },
  };
}

/** The four columns side by side, divided by rules. Arrow keys work anywhere inside. */
function MillerColumnsRow({ browser, compact = false, slots = MILLER_SLOTS }: { browser: MillerBrowser; compact?: boolean; slots?: readonly TreeLevel[] }) {
  return (
    <div
      data-miller={browser.scope}
      role="group"
      aria-label="Asset hierarchy"
      onKeyDown={browser.onKeyDown}
      className="@container flex min-h-0 flex-1 divide-x divide-[color:var(--kit-rule)]"
    >
      {slots.map((level) => (
        <MillerColumnList
          key={level}
          level={level}
          column={browser.columns[MILLER_SLOTS.indexOf(level)]}
          deadEnd={MILLER_SLOTS.indexOf(level) === browser.columns.length && browser.node.children.length === 0 && browser.node.level !== 'tag' ? browser.node : undefined}
          activeId={browser.node.id}
          compact={compact}
          onSelect={browser.select}
        />
      ))}
    </div>
  );
}

function MillerCrumbs({ node, onSelect }: { node: TreeNode; onSelect: (id: string) => void }) {
  const trail = pathTo(MILLER_TREE, node.id);
  return (
    <nav aria-label="Path" className="min-w-0 flex-1">
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-0.5 text-sm">
        {trail.map((step, index) => (
          <li key={step.id} className="flex items-center gap-1">
            {index > 0 ? <IconChevronRight aria-hidden="true" className="size-3.5 text-[color:var(--kit-text-3)]" /> : null}
            <button
              type="button"
              aria-current={step.id === node.id ? 'location' : undefined}
              onClick={() => onSelect(step.id)}
              className={`rounded-[var(--kit-radius-sm)] px-1.5 py-0.5 tabular-nums hover:bg-[color-mix(in_oklab,var(--kit-text)_7%,transparent)] ${
                step.id === node.id ? 'font-semibold text-[color:var(--kit-text)]' : 'font-medium text-[color:var(--kit-text-2)]'
              }`}
            >
              {step.level === 'fleet' ? 'Fleet' : step.level === 'site' ? step.name : step.tag}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function MillerKeyHint({ keys, children }: { keys: string; children: ReactNode }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-[color:var(--kit-text-2)]">
      <span className="rounded-md border border-[color:var(--kit-rule-strong)] bg-[var(--kit-well)] px-1.5 text-xs font-semibold leading-5 text-[color:var(--kit-text)]">{keys}</span>
      {children}
    </span>
  );
}

/** The toolbar above the columns: where you are, and the two steps the arrow keys also take. */
function MillerToolbar({ browser }: { browser: MillerBrowser }) {
  const depth = pathTo(MILLER_TREE, browser.node.id).length;
  return (
    <div style={MILLER_CARD_SHADOW} className={`flex items-center gap-4 px-4 py-2.5 ${MILLER_CARD}`}>
      <div className="flex items-center gap-2.5">
        <IconChip tone="accent" size="sm">
          <IconSitemap />
        </IconChip>
        <span className="text-sm font-semibold">Asset browser</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Button variant="outline" size="sm" disabled={depth <= 2} onClick={() => browser.move('left')}>
          <IconArrowLeft /> Out
        </Button>
        <Button variant="outline" size="sm" disabled={browser.node.children.length === 0} onClick={() => browser.move('right')}>
          In <IconArrowRight />
        </Button>
      </div>
      <MillerCrumbs node={browser.node} onSelect={browser.select} />
      <div className="hidden items-center gap-3 @min-[1040px]:flex">
        <MillerKeyHint keys="↑ ↓">Move</MillerKeyHint>
        <MillerKeyHint keys="→">Open</MillerKeyHint>
        <MillerKeyHint keys="←">Back</MillerKeyHint>
      </div>
    </div>
  );
}

function MillerIdentity({ node }: { node: TreeNode }) {
  return (
    <div className="flex items-start gap-3">
      <IconChip tone={isAbnormal(node.tone) ? node.tone : 'accent'} size="lg">
        {millerIcon(node)}
      </IconChip>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-[color:var(--kit-text-2)]">{TREE_LEVEL_LABEL[node.level]}</p>
        <h3 className="text-lg font-semibold leading-6 tracking-tight">{node.name}</h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <TagId variant="chip">{node.tag}</TagId>
          <StatusPill tone={node.tone} icon={<MillerStateIcon tone={node.tone} />}>
            {node.stateLabel}
          </StatusPill>
        </div>
      </div>
    </div>
  );
}

/** The live value of a tag, as large as the pane allows, with its move over the day. */
function MillerReading({ sensor }: { sensor: TreeSensor }) {
  const { values } = millerTrend(sensor);
  const first = values[0];
  return (
    <div>
      <p className="text-xs font-medium text-[color:var(--kit-text-2)]">Now, 14:00 UTC</p>
      <p className="mt-0.5 flex items-baseline gap-2">
        <span className="text-5xl font-semibold tracking-tight tabular-nums">{sensor.quality === 'bad' ? '—' : formatNumber(sensor.value, sensor.decimals)}</span>
        <span className="text-base font-medium text-[color:var(--kit-text-2)]">{sensor.unit}</span>
      </p>
      {first !== undefined ? (
        <p className="mt-1.5 flex items-center gap-2 text-xs text-[color:var(--kit-text-2)]">
          <Delta value={sensor.value - first} decimals={sensor.decimals} good="none" /> over 24 hours
        </p>
      ) : (
        <p className="mt-1.5 text-xs text-[color:var(--kit-text-2)]">The transmitter has not reported since 05:02.</p>
      )}
    </div>
  );
}

function MillerTrendChart({ sensor, height = 196 }: { sensor: TreeSensor; height?: number }) {
  const { values, labels } = millerTrend(sensor);
  if (values.length === 0) {
    return <EmptyPanel title="No signal" description="Trend resumes when the transmitter reports again." icon={<IconChartLine />} />;
  }
  const limits: TrendLimit[] = [{ value: sensor.highLimit, label: 'High', tone: 'warning' }];
  if (sensor.highHighLimit !== undefined && sensor.value > sensor.highLimit * 0.9) limits.push({ value: sensor.highHighLimit, label: 'Trip', tone: 'critical' });
  return (
    <TrendLine
      label={`${sensor.name}, ${sensor.tag}, last 24 hours`}
      series={[{ id: 'value', label: sensor.name, values, tone: 'accent' }]}
      labels={labels}
      unit={sensor.unit}
      decimals={sensor.decimals}
      limits={sensor.value === 0 ? [] : limits}
      fill
      height={height}
      showLegend={false}
    />
  );
}

function MillerFact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-[color:var(--kit-rule)] py-2 text-sm first:border-t-0">
      <dt className="text-[color:var(--kit-text-2)]">{label}</dt>
      <dd className="text-right font-medium tabular-nums">{children}</dd>
    </div>
  );
}

function MillerTagFacts({ node, sensor }: { node: TreeNode; sensor: TreeSensor }) {
  const parent = node.parentId ? MILLER_TREE.byId.get(node.parentId) : undefined;
  const alarm = node.alarms[0];
  return (
    <dl>
      <MillerFact label="Measured on">{parent ? parent.tag : '—'}</MillerFact>
      <MillerFact label="Operating band">
        {formatNumber(sensor.lowLimit, sensor.decimals)} to {formatNumber(sensor.highLimit, sensor.decimals)} {sensor.unit}
      </MillerFact>
      <MillerFact label="Last alarm">{alarm ? `${alarm.id.replace('alm-', 'No. ')}, ${formatAgo(alarm.raisedAt)}` : 'None in 30 days'}</MillerFact>
    </dl>
  );
}

/** What sits under an asset, ranked worst first, each with its score as a bar. */
function MillerChildRanking({ node, limit = 5, onSelect }: { node: TreeNode; limit?: number; onSelect?: (id: string) => void }) {
  const ranked = [...node.children].sort((a, b) => a.score - b.score).slice(0, limit);
  return (
    <ul className="space-y-2.5">
      {ranked.map((child) => (
        <li key={child.id}>
          <button type="button" onClick={() => onSelect?.(child.id)} className="block w-full text-left">
            <span className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium">{child.name}</span>
              <span className="tabular-nums text-[color:var(--kit-text-2)]">{child.sensor ? millerValue(child.sensor) : `${child.score}`}</span>
            </span>
            <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-[var(--kit-track)]" aria-hidden="true">
              <span data-tone={child.tone} className="block h-full rounded-full bg-[var(--t-line)]" style={{ width: `${Math.max(child.score, 3)}%` }} />
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function MillerAlarmList({ node, limit = 2 }: { node: TreeNode; limit?: number }) {
  const open = node.alarms.filter(isOpenAlarm).slice(0, limit);
  if (open.length === 0) {
    return (
      <p className="flex items-center gap-2 text-sm text-[color:var(--kit-text-2)]">
        <IconCircleCheck aria-hidden="true" className="size-4" /> No open alarms on or below this {TREE_LEVEL_LABEL[node.level].toLowerCase()}.
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

function MillerHealth({ node }: { node: TreeNode }) {
  const units = nodesAt(node, 'unit').length;
  const tags = nodesAt(node, 'tag').length;
  return (
    <div className="flex items-center gap-5">
      <RingGauge label={`${node.name} health`} value={node.score} unit="" size={104} tone={node.tone === 'info' || node.tone === 'neutral' ? 'accent' : node.tone} hideLabel />
      <dl className="min-w-0 flex-1">
        <MillerFact label="Health score">{node.score} of 100</MillerFact>
        <MillerFact label="Below it">{node.level === 'unit' ? childSummary(node) : `${units} units, ${tags} tags`}</MillerFact>
        <MillerFact label="Open alarms">{node.openAlarms}</MillerFact>
      </dl>
    </div>
  );
}

function MillerPaneLabel({ children }: { children: ReactNode }) {
  return <h4 className="text-xs font-semibold text-[color:var(--kit-text-2)]">{children}</h4>;
}

/** The preview pane: a tag shows its reading, trend and limits; an asset its health and what is below. */
function MillerPreview({ node, onSelect, className }: { node: TreeNode; onSelect?: (id: string) => void; className?: string }) {
  const sensor = node.sensor;
  return (
    <Panel
      className={className}
      footer={
        <div className="flex items-center gap-2">
          <Button size="sm">{sensor ? 'Open trend' : 'Open asset page'}</Button>
          <Button variant="outline" size="sm">
            <IconCopy /> Copy path
          </Button>
          <Button variant="ghost" size="sm" className="ml-auto">
            <IconStar /> Pin
          </Button>
        </div>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <MillerIdentity node={node} />
        {sensor ? (
          <>
            <MillerReading sensor={sensor} />
            <MillerTrendChart sensor={sensor} />
            {sensor.quality === 'bad' ? null : (
              <Meter
                label="Position in range"
                value={sensor.value}
                min={sensor.rangeMin}
                max={sensor.rangeMax}
                unit={sensor.unit}
                decimals={sensor.decimals}
                high={sensor.highLimit}
                low={sensor.lowLimit > sensor.rangeMin ? sensor.lowLimit : undefined}
                target={{ value: sensor.highLimit, label: 'High limit' }}
                tone={node.tone === 'success' ? 'accent' : node.tone}
              />
            )}
            <MillerTagFacts node={node} sensor={sensor} />
          </>
        ) : (
          <>
            <MillerHealth node={node} />
            {node.children.length > 0 ? (
              <div className="space-y-3">
                <MillerPaneLabel>{node.level === 'unit' ? 'Tags, closest to a limit first' : `${TREE_LEVEL_LABEL[node.children[0]?.level ?? 'unit']}s, weakest first`}</MillerPaneLabel>
                <MillerChildRanking node={node} onSelect={onSelect} />
              </div>
            ) : (
              <EmptyPanel title="Not mapped yet" description="Units and tags appear here once the area is contextualised." icon={<IconSitemap />} />
            )}
            <div className="space-y-1">
              <MillerPaneLabel>Open alarms</MillerPaneLabel>
              <MillerAlarmList node={node} />
            </div>
          </>
        )}
      </div>
    </Panel>
  );
}

function MillerColumnsSignature() {
  const browser = useMillerBrowser(['nk', 'nk-23', '23-ka-9101', 'vt-92540']);
  const tags = nodesAt(MILLER_TREE.root, 'tag').length;
  const units = nodesAt(MILLER_TREE.root, 'unit').length;

  return (
    <LookScope look="studio">
      <Canvas className="@container flex h-[820px] flex-col gap-4">
        <MillerToolbar browser={browser} />
        <div className="flex min-h-0 flex-1 gap-4">
          <Panel
            padding="none"
            className="min-w-0 flex-1"
            footer={
              <p className="text-xs text-[color:var(--kit-text-2)]">
                {tags} tags on {units} units in 4 sites · {MILLER_TREE.root.openAlarms} open alarms · synced 14:00 UTC
              </p>
            }
          >
            <MillerColumnsRow browser={browser} />
          </Panel>
          <MillerPreview node={browser.node} onSelect={browser.select} className="w-[320px] shrink-0 @min-[1040px]:w-[352px]" />
        </div>
      </Canvas>
    </LookScope>
  );
}

function MillerColumnsTablet() {
  const browser = useMillerBrowser(['nk', 'nk-23', '23-ka-9103']);
  const depth = Math.min(Math.max(browser.path.length - 1, 0), MILLER_SLOTS.length - 2);
  const slots = MILLER_SLOTS.slice(depth, depth + 2);

  return (
    <LookScope look="studio" className="mx-auto w-full max-w-3xl">
      <Canvas className="flex flex-col gap-4">
        <div style={MILLER_CARD_SHADOW} className={`flex items-center gap-3 px-3 py-2 ${MILLER_CARD}`}>
          <Button variant="outline" size="sm" disabled={browser.path.length <= 1} onClick={() => browser.move('left')}>
            <IconArrowLeft /> Back
          </Button>
          <MillerCrumbs node={browser.node} onSelect={browser.select} />
        </div>
        <Panel padding="none" className="h-[440px]">
          <MillerColumnsRow browser={browser} slots={slots} />
        </Panel>
        <Panel>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-5">
              <MillerIdentity node={browser.node} />
              {browser.node.sensor ? <MillerReading sensor={browser.node.sensor} /> : <MillerHealth node={browser.node} />}
            </div>
            {browser.node.sensor ? (
              <MillerTrendChart sensor={browser.node.sensor} height={200} />
            ) : (
              <div className="space-y-1">
                <MillerPaneLabel>Open alarms</MillerPaneLabel>
                <MillerAlarmList node={browser.node} />
              </div>
            )}
          </div>
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function MillerColumnsConsole() {
  const browser = useMillerBrowser(['nk', 'nk-20', '20-va-1001', 'lt-10012']);
  const node = browser.node;
  const sensor = node.sensor;

  return (
    <LookScope look="console">
      <AppFrame
        brand={{ name: 'Nordkapp', detail: 'Tag browser', mark: <IconSitemap /> }}
        nav={[
          { id: 'browse', label: 'Browse', icon: <IconSitemap /> },
          { id: 'alarms', label: 'Alarms', icon: <IconBell />, badge: '4' },
          { id: 'pinned', label: 'Pinned', icon: <IconStar /> },
        ]}
        current="browse"
        tools={<span className="text-sm tabular-nums text-[color:var(--kit-text-2)]">12 Mar 14:00 UTC · Day shift</span>}
        padding="none"
      >
        <div className="flex flex-col gap-px">
          <div className="flex items-center gap-4 bg-[var(--kit-surface)] px-4 py-2">
            <MillerCrumbs node={node} onSelect={browser.select} />
            <StatusPill tone={node.tone} variant="filled" icon={<MillerStateIcon tone={node.tone} />}>
              {node.stateLabel}
            </StatusPill>
          </div>
          <div className="flex h-[330px] bg-[var(--kit-surface)]">
            <MillerColumnsRow browser={browser} compact />
          </div>
          <div className="grid grid-cols-12 gap-px">
            <Panel className="col-span-3" title={node.name} subtitle={node.tag}>
              {sensor ? <MillerReading sensor={sensor} /> : <MillerHealth node={node} />}
            </Panel>
            <Panel className="col-span-5" title="Last 24 hours" subtitle={sensor ? `${sensor.unit}, against the high limit` : 'Weakest first'}>
              {sensor ? <MillerTrendChart sensor={sensor} height={200} /> : <MillerChildRanking node={node} onSelect={browser.select} />}
            </Panel>
            <Panel className="col-span-4" title={sensor ? 'Limits' : 'Open alarms'} subtitle={sensor ? 'Operating band and range' : 'On or below this node'}>
              {sensor ? (
                <div className="flex flex-1 flex-col justify-between gap-4">
                  <Meter
                    label="Position in range"
                    value={sensor.value}
                    min={sensor.rangeMin}
                    max={sensor.rangeMax}
                    unit={sensor.unit}
                    decimals={sensor.decimals}
                    high={sensor.highLimit}
                    low={sensor.lowLimit}
                    target={{ value: sensor.highLimit, label: 'High limit' }}
                    tone={node.tone === 'success' ? 'accent' : node.tone}
                  />
                  <MillerTagFacts node={node} sensor={sensor} />
                </div>
              ) : (
                <MillerAlarmList node={node} limit={3} />
              )}
            </Panel>
          </div>
        </div>
      </AppFrame>
    </LookScope>
  );
}

function MillerColumnsColumn() {
  const browser = useMillerBrowser(['nk', 'nk-23', '23-ka-9101']);
  return (
    <LookScope look="studio" className="w-full">
      <Panel padding="none" className="h-[480px]">
        <MillerColumnsRow browser={browser} slots={['unit']} />
      </Panel>
    </LookScope>
  );
}

function MillerColumnsRowStates() {
  const [picked, setPicked] = useState('23-ka-9102');
  const rows: readonly string[] = ['23-ka-9102', '23-ka-9101', '23-ka-9103', '27-pa-2001b', 'tt-40015'];
  return (
    <LookScope look="studio" className="w-full">
      <Panel padding="tight" className="h-[480px]" title="Row states" subtitle="Selected, watch, tripped, standby, bad signal">
        <ul className="space-y-0.5">
          {rows.map((id) => {
            const node = MILLER_TREE.byId.get(id);
            return node ? <MillerRow key={id} node={node} mode={id === picked ? 'active' : 'idle'} onSelect={setPicked} /> : null;
          })}
        </ul>
      </Panel>
    </LookScope>
  );
}

function MillerColumnsEmptyColumn() {
  const browser = useMillerBrowser(['st', 'st-50']);
  return (
    <LookScope look="studio" className="w-full">
      <Panel padding="none" className="h-[480px]">
        <MillerColumnsRow browser={browser} slots={['area', 'unit']} />
      </Panel>
    </LookScope>
  );
}

function MillerColumnsToolbar() {
  const browser = useMillerBrowser(['nk', 'nk-27', '27-pa-2001a', 'it-20013']);
  return (
    <LookScope look="studio" className="w-full">
      <MillerToolbar browser={browser} />
    </LookScope>
  );
}

function MillerColumnsTagPreview() {
  const node = MILLER_TREE.byId.get('tt-92532') ?? MILLER_TREE.root;
  return (
    <LookScope look="studio" className="w-full">
      <MillerPreview node={node} />
    </LookScope>
  );
}

function MillerColumnsAssetPreview() {
  const [id, setId] = useState('nk-23');
  const node = MILLER_TREE.byId.get(id) ?? MILLER_TREE.root;
  return (
    <LookScope look="studio" className="flex w-full">
      <MillerPreview node={node} onSelect={setId} className="flex-1" />
    </LookScope>
  );
}

export default definePage({
  id: 'miller-columns',
  title: 'Column browser',
  summary:
    'An asset browser in cascading columns: site, area, unit and tag stay side by side, so the path is always on screen, and a preview pane shows the reading or the health of whatever is selected.',
  guidance: {
    use: [
      'For hierarchies people navigate by name: asset trees, document folders, data models.',
      'When users compare siblings at several levels while they drill.',
      'With a preview pane, so selecting a leaf never needs a page change.',
    ],
    avoid: [
      'Hierarchies deeper than five levels; columns run out of width — use a tree.',
      'Hiding the state of a row: carry the word on the row, not only a colour.',
      'Mouse-only columns. Arrow keys must move, open and step back.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Four columns and a preview pane under a path toolbar. Click a row or use the arrow keys.',
      specimens: [
        {
          id: 'MillerColumnsSignature',
          title: 'Column browser',
          note: 'Pick it when people know roughly where a tag lives and need to walk there fast.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/miller-columns/assetTree.ts', 'kit/miller-columns/millerPath.ts', 'kit/Panel.tsx', 'kit/TrendLine.tsx', 'kit/Meter.tsx', 'looks/LookScope.tsx'],
          Component: MillerColumnsSignature,
        },
      ],
    },
    {
      id: 'variations',
      title: 'Variations',
      description: 'The same browser where four columns do not fit, and on an operator console.',
      specimens: [
        {
          id: 'MillerColumnsTablet',
          title: 'Two columns on a tablet',
          note: 'Pick it under 800 px: only the current column and its children show, the preview moves below.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/miller-columns/millerPath.ts', 'kit/Panel.tsx', 'kit/RingGauge.tsx'],
          Component: MillerColumnsTablet,
        },
        {
          id: 'MillerColumnsConsole',
          title: 'Console with a detail strip',
          note: 'Pick it in a control room: dense columns on top, the selected tag across the bottom.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/AppFrame.tsx', 'kit/miller-columns/millerPath.ts', 'kit/TrendLine.tsx', 'looks/LookScope.tsx'],
          Component: MillerColumnsConsole,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The pieces the browser is made of.',
      specimens: [
        {
          id: 'MillerColumnsColumn',
          title: 'Column',
          note: 'One level: a header with the count, the rows, and a roll-up of their states.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          surface: 'muted',
          uses: ['kit/miller-columns/millerPath.ts', 'kit/IconChip.tsx'],
          Component: MillerColumnsColumn,
        },
        {
          id: 'MillerColumnsRowStates',
          title: 'Row states',
          note: 'A row names its state in words whenever it is not simply running.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          surface: 'muted',
          uses: ['kit/IconChip.tsx', 'kit/miller-columns/assetTree.ts'],
          Component: MillerColumnsRowStates,
        },
        {
          id: 'MillerColumnsEmptyColumn',
          title: 'Empty column',
          note: 'Say why a column is empty instead of leaving it blank.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          surface: 'muted',
          uses: ['kit/miller-columns/millerPath.ts'],
          Component: MillerColumnsEmptyColumn,
        },
        {
          id: 'MillerColumnsToolbar',
          title: 'Path toolbar',
          note: 'Step out, step in and jump to any ancestor; the key hints teach the arrow keys.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['kit/miller-columns/assetTree.ts', 'kit/IconChip.tsx'],
          Component: MillerColumnsToolbar,
        },
        {
          id: 'MillerColumnsTagPreview',
          title: 'Tag preview',
          note: 'For a leaf: the live value first, then its day and where it sits against the limits.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          surface: 'muted',
          uses: ['kit/TrendLine.tsx', 'kit/Meter.tsx', 'kit/Delta.tsx', 'kit/Panel.tsx'],
          Component: MillerColumnsTagPreview,
        },
        {
          id: 'MillerColumnsAssetPreview',
          title: 'Asset preview',
          note: 'For a branch: health, the weakest children and the alarms below it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          surface: 'muted',
          uses: ['kit/RingGauge.tsx', 'kit/ListRow.tsx', 'kit/Panel.tsx'],
          Component: MillerColumnsAssetPreview,
        },
      ],
    },
  ],
});
