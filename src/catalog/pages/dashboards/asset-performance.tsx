import {
  SegmentedControl,
  SegmentedControlButton,
  SegmentedControlList,
} from '@cognite/aura/components/segmented-control';
import { IconAlertTriangle, IconCircleCheck, IconFlame, IconTool } from '@cognite/aura/icons';
import { useState } from 'react';

import { BubbleMatrix, type MatrixAxis, type MatrixPoint, type MatrixQuadrant } from '../../../library/kit/asset-performance/BubbleMatrix';
import { DimensionLine } from '../../../library/kit/asset-performance/DimensionLine';
import { DrawingSheet, TitleBlock, type TitleBlockCell } from '../../../library/kit/asset-performance/DrawingSheet';
import { Bars } from '../../../library/kit/Bars';
import { Canvas } from '../../../library/kit/Canvas';
import { DataTable, type DataTableColumn } from '../../../library/kit/DataTable';
import { ListRow } from '../../../library/kit/ListRow';
import { Panel } from '../../../library/kit/Panel';
import { StatusPill } from '../../../library/kit/StatusPill';
import { TagId } from '../../../library/kit/TagId';
import type { Tone } from '../../../library/kit/tones';
import { TrendLine } from '../../../library/kit/TrendLine';
import { LookScope } from '../../../library/looks/LookScope';
import { findAsset, type Asset } from '../../data/plant';
import { makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './asset-performance.tsx?raw';

type ApRecord = {
  id: string;
  /** Consequence of failure, 0–100; the class follows from it. */
  consequence: number;
  /** Hours lost in the last 12 months. */
  downtime: number;
  /** Maintenance spend in the last 12 months, kNOK. */
  cost: number;
  mtbf: number;
  availability: number;
  /** Health score a year ago, to draw the trend from. */
  healthThen: number;
  mode: string;
  action: string;
  seed: number;
};

const AP_RECORDS: ApRecord[] = [
  { id: '23-ka-9103', consequence: 88, downtime: 126, cost: 1840, mtbf: 212, availability: 91.2, healthThen: 82, mode: 'Drive-end bearing wear, three trips since January', action: 'Bearing inspection running, WO-104482', seed: 71 },
  { id: '23-ka-9101', consequence: 97, downtime: 38, cost: 920, mtbf: 388, availability: 96.9, healthThen: 86, mode: 'Vibration rising 0.2 mm/s per month', action: 'Vibration survey waiting, WO-104466', seed: 72 },
  { id: '23-ka-9102', consequence: 90, downtime: 12, cost: 410, mtbf: 720, availability: 99.1, healthThen: 90, mode: 'No dominant failure mode', action: 'Seal oil filters changed this week', seed: 73 },
  { id: '23-gt-9001', consequence: 76, downtime: 22, cost: 1260, mtbf: 540, availability: 98.2, healthThen: 88, mode: 'Hot section wear at 4 000 hour inspection', action: 'Firmware upgrade planned for week 12', seed: 74 },
  { id: '20-va-1001', consequence: 68, downtime: 4, cost: 140, mtbf: 2100, availability: 99.8, healthThen: 94, mode: 'Level transmitter drift', action: 'Calibrated 11 March', seed: 75 },
  { id: '20-xv-1105', consequence: 83, downtime: 2, cost: 90, mtbf: 4300, availability: 99.9, healthThen: 96, mode: 'No dominant failure mode', action: 'Partial stroke test passed 10 March', seed: 76 },
  { id: '23-ha-9114', consequence: 58, downtime: 64, cost: 680, mtbf: 304, availability: 95.4, healthThen: 84, mode: 'Tube fouling, outlet 0.8 °C above limit', action: 'Bundle clean planned Friday, WO-104471', seed: 77 },
  { id: '27-pa-2001a', consequence: 52, downtime: 6, cost: 210, mtbf: 1500, availability: 99.6, healthThen: 91, mode: 'Motor current excursions under high export', action: 'Monitor; no order open', seed: 78 },
  { id: '27-pa-2001b', consequence: 44, downtime: 9, cost: 160, mtbf: 1280, availability: 99.4, healthThen: 93, mode: 'Standby start test overdue', action: 'Start test waiting, WO-104458', seed: 79 },
  { id: '40-pa-4001', consequence: 30, downtime: 41, cost: 380, mtbf: 420, availability: 96.1, healthThen: 80, mode: 'Bearing temperature signal lost', action: 'Transmitter swap planned Friday, WO-104479', seed: 80 },
  { id: '20-va-1002', consequence: 18, downtime: 3, cost: 60, mtbf: 2600, availability: 99.9, healthThen: 93, mode: 'No dominant failure mode', action: 'None', seed: 81 },
];

const AP_HEALTH_TONE: Record<Asset['health'], Tone> = { good: 'accent', watch: 'warning', poor: 'critical' };

const AP_HEALTH_LABEL: Record<Asset['health'], string> = { good: 'Good', watch: 'Watch', poor: 'Poor' };

const AP_STATE_LABEL: Record<Asset['state'], string> = {
  running: 'Running',
  standby: 'Standby',
  stopped: 'Stopped',
  tripped: 'Tripped',
  maintenance: 'In maintenance',
};

const AP_X: MatrixAxis = { label: 'Health score', min: 30, max: 112, ticks: [30, 40, 50, 60, 70, 80, 90, 100] };

const AP_Y: MatrixAxis = {
  label: 'Consequence of failure',
  min: -14,
  max: 116,
  ticks: [0, 33, 66, 100],
  bands: [
    { from: 66, to: 100, label: 'Class A' },
    { from: 33, to: 66, label: 'Class B' },
    { from: 0, to: 33, label: 'Class C' },
  ],
};

const AP_QUADRANTS: MatrixQuadrant[] = [
  { corner: 'top-left', title: 'Act now', note: 'Critical and degrading: repair first.', tone: 'critical' },
  { corner: 'top-right', title: 'Protect', note: 'Healthy: keep monitoring.' },
  { corner: 'bottom-left', title: 'Plan repair', note: 'Degraded, plant runs without it.', tone: 'warning' },
  { corner: 'bottom-right', title: 'Run to plan', note: 'Routine maintenance only.' },
];

const AP_MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

const AP_TITLE_CELLS: TitleBlockCell[] = [
  { label: 'Title', value: 'Asset performance', strong: true, grow: 2.2 },
  { label: 'Drawing', value: 'NK-AP-002' },
  { label: 'Period', value: 'Apr 2025 to Mar 2026', grow: 2 },
  { label: 'Revision', value: 'C', grow: 0.7 },
];

type ApUnit = { asset: Asset; record: ApRecord };

const AP_UNITS: ApUnit[] = AP_RECORDS.flatMap((record) => {
  const asset = findAsset(record.id);
  return asset ? [{ asset, record }] : [];
});

const AP_ROTATING: Asset['type'][] = ['compressor', 'pump', 'turbine'];

function apPoints(units: readonly ApUnit[], size: 'downtime' | 'cost'): MatrixPoint[] {
  return units.map(({ asset, record }) => ({
    id: asset.id,
    label: asset.tag,
    name: asset.name,
    x: asset.healthScore,
    y: record.consequence,
    size: record[size],
    tone: AP_HEALTH_TONE[asset.health],
  }));
}

function apTrend({ asset, record }: ApUnit): number[] {
  const values = makeValues({ seed: record.seed, points: 12, base: record.healthThen, noise: 1.2, drift: asset.healthScore - record.healthThen, decimals: 0, min: 20, max: 100 });
  return [...values.slice(0, -1), asset.healthScore];
}

function apUnit(id: string): ApUnit {
  return AP_UNITS.find((unit) => unit.asset.id === id) ?? AP_UNITS[0];
}

function ApSheetMark() {
  return (
    <span className="flex items-center gap-2 text-sm font-semibold">
      <IconFlame aria-hidden="true" className="size-5" /> Nordkapp
    </span>
  );
}

function ApDimensions({ unit }: { unit: ApUnit }) {
  const { asset, record } = unit;
  return (
    <div className="flex flex-col gap-1">
      <DimensionLine label="Health score" value={asset.healthScore} max={100} display={`${asset.healthScore} / 100`} limit={{ value: 60, label: 'Action below' }} tone={AP_HEALTH_TONE[asset.health]} />
      <DimensionLine label="Availability" value={record.availability - 85} max={15} display={`${record.availability.toFixed(1)} %`} tone={record.availability < 97.5 ? 'warning' : 'accent'} />
      <DimensionLine label="Time between failures" value={record.mtbf} max={Math.max(900, record.mtbf)} display={`${record.mtbf.toLocaleString('en-GB')} h`} limit={{ value: 450, label: 'Target' }} tone={record.mtbf < 450 ? 'warning' : 'accent'} />
      <DimensionLine label="Downtime, 12 months" value={record.downtime} max={126} display={`${record.downtime} h`} tone={record.downtime > 50 ? 'critical' : 'accent'} />
      <DimensionLine label="Maintenance cost" value={record.cost} max={1840} display={`${record.cost.toLocaleString('en-GB')} kNOK`} />
    </div>
  );
}

function ApHealthTrend({ unit, height = 200 }: { unit: ApUnit; height?: number }) {
  return (
    <TrendLine
      label={`Health score of ${unit.asset.name} over the last 12 months`}
      series={[{ id: 'health', label: 'Health score', values: apTrend(unit), tone: AP_HEALTH_TONE[unit.asset.health] }]}
      labels={AP_MONTHS}
      limits={[{ value: 60, label: 'Action', tone: 'critical' }]}
      yDomain={[30, 100]}
      decimals={0}
      height={height}
      highlightLast
    />
  );
}

function ApAssetSheet({ unit }: { unit: ApUnit }) {
  const { asset, record } = unit;
  return (
    <Panel title={asset.name} subtitle={asset.tag} padding="default" className="h-full">
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill tone={AP_HEALTH_TONE[asset.health] === 'accent' ? 'success' : AP_HEALTH_TONE[asset.health]} icon={asset.health === 'good' ? <IconCircleCheck /> : <IconAlertTriangle />}>
            Health {AP_HEALTH_LABEL[asset.health].toLowerCase()}
          </StatusPill>
          <StatusPill tone={asset.state === 'tripped' ? 'critical' : 'neutral'}>{AP_STATE_LABEL[asset.state]}</StatusPill>
          <StatusPill tone="neutral" variant="outline">
            Class {asset.criticality}
          </StatusPill>
        </div>
        <ApDimensions unit={unit} />
        <div className="border-t border-(--kit-rule) pt-3">
          <p className="mb-1 text-sm font-medium">Health score, 12 months</p>
          <ApHealthTrend unit={unit} />
        </div>
        <dl className="mt-auto grid grid-cols-1 gap-2 border-t border-(--kit-rule) pt-3 text-sm">
          <div>
            <dt className="text-xs text-(--kit-text-2)">Dominant failure mode</dt>
            <dd className="font-medium">{record.mode}</dd>
          </div>
          <div>
            <dt className="text-xs text-(--kit-text-2)">Action</dt>
            <dd className="font-medium">{record.action}</dd>
          </div>
        </dl>
      </div>
    </Panel>
  );
}

function AssetPerformanceSignature() {
  const [selectedId, setSelectedId] = useState('23-ka-9103');
  const [size, setSize] = useState<'downtime' | 'cost'>('downtime');
  const [scope, setScope] = useState('all');
  const units = AP_UNITS.filter(({ asset }) => (scope === 'all' ? true : scope === 'rotating' ? AP_ROTATING.includes(asset.type) : !AP_ROTATING.includes(asset.type)));
  const selected = units.find((unit) => unit.asset.id === selectedId) ?? units[0];
  const actNow = units.filter(({ asset, record }) => asset.healthScore < 75 && record.consequence >= 66).length;

  return (
    <LookScope look="blueprint">
      <Canvas>
        <DrawingSheet
          label="Asset performance, sheet 1 of 3: criticality against condition"
          titleBlock={<TitleBlock mark={<ApSheetMark />} cells={AP_TITLE_CELLS} end={<span className="text-sm font-semibold whitespace-nowrap tabular-nums">Sheet 1 of 3</span>} />}
        >
          <div className="grid flex-1 grid-cols-12 gap-6 pb-5">
            <div className="col-span-7 flex flex-col gap-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-2xl font-semibold tracking-tight">Criticality against condition</p>
                  <p className="text-sm text-(--kit-text-2) tabular-nums">
                    {units.length} units · {actNow} in the act-now quadrant · select a bubble for its sheet
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 border border-(--kit-rule-strong) bg-(--kit-halo) p-2">
                <span className="pl-1 text-sm font-medium">Show</span>
                <SegmentedControl value={scope} onValueChange={(next) => setScope(String(next))}>
                  <SegmentedControlList size="small" aria-label="Equipment shown">
                    <SegmentedControlButton value="all">All units</SegmentedControlButton>
                    <SegmentedControlButton value="rotating">Rotating</SegmentedControlButton>
                    <SegmentedControlButton value="static">Static</SegmentedControlButton>
                  </SegmentedControlList>
                </SegmentedControl>
                <span className="ml-auto text-sm font-medium">Bubble area</span>
                <SegmentedControl value={size} onValueChange={(next) => setSize(next === 'cost' ? 'cost' : 'downtime')}>
                  <SegmentedControlList size="small" aria-label="Bubble area">
                    <SegmentedControlButton value="downtime">Downtime</SegmentedControlButton>
                    <SegmentedControlButton value="cost">Cost</SegmentedControlButton>
                  </SegmentedControlList>
                </SegmentedControl>
              </div>
              <BubbleMatrix
                label="Consequence of failure against health score, one bubble per unit"
                points={apPoints(units, size)}
                xAxis={AP_X}
                yAxis={AP_Y}
                split={{ x: 75, y: 66 }}
                quadrants={AP_QUADRANTS}
                sizeLabel={size === 'downtime' ? 'downtime in hours, 12 months' : 'maintenance cost, 12 months'}
                selectedId={selected.asset.id}
                onSelect={setSelectedId}
                height={580}
              />
            </div>
            <div className="col-span-5">
              <ApAssetSheet unit={selected} />
            </div>
          </div>
        </DrawingSheet>
      </Canvas>
    </LookScope>
  );
}

const AP_RANKED = [...AP_UNITS].sort((a, b) => b.record.downtime - a.record.downtime);

const AP_REGISTER_COLUMNS: DataTableColumn<ApUnit>[] = [
  { id: 'rank', header: 'No.', cell: (unit) => String(AP_RANKED.indexOf(unit) + 1), numeric: true, nowrap: true },
  {
    id: 'unit',
    header: 'Unit',
    cell: ({ asset }) => (
      <div>
        <p className="font-medium">{asset.name}</p>
        <TagId>{asset.tag}</TagId>
      </div>
    ),
  },
  { id: 'class', header: 'Class', cell: ({ asset }) => asset.criticality, align: 'center', nowrap: true },
  { id: 'downtime', header: 'Downtime', cell: ({ record }) => `${record.downtime} h`, numeric: true, nowrap: true },
  { id: 'mtbf', header: 'MTBF', cell: ({ record }) => `${record.mtbf.toLocaleString('en-GB')} h`, numeric: true, nowrap: true },
  { id: 'cost', header: 'Cost, kNOK', cell: ({ record }) => record.cost.toLocaleString('en-GB'), numeric: true, nowrap: true },
];

function AssetPerformanceBadActors() {
  const [count, setCount] = useState('6');
  const rows = AP_RANKED.slice(0, Number(count));
  const total = AP_RANKED.reduce((sum, unit) => sum + unit.record.downtime, 0);
  const covered = rows.reduce((sum, unit) => sum + unit.record.downtime, 0);

  return (
    <LookScope look="blueprint">
      <Canvas>
        <DrawingSheet
          label="Asset performance, sheet 2 of 3: bad actor register"
          rows={['A', 'B', 'C']}
          titleBlock={
            <TitleBlock mark={<ApSheetMark />} cells={[{ label: 'Title', value: 'Bad actor register', strong: true, grow: 2.2 }, ...AP_TITLE_CELLS.slice(1)]} end={<span className="text-sm font-semibold whitespace-nowrap tabular-nums">Sheet 2 of 3</span>} />
          }
        >
          <div className="flex flex-col gap-5 pb-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-2xl font-semibold tracking-tight tabular-nums">
                  {rows.length} units carry {Math.round((covered / total) * 100)} % of the downtime
                </p>
                <p className="text-sm text-(--kit-text-2) tabular-nums">
                  {covered} of {total} hours lost in the last 12 months, ranked by hours
                </p>
              </div>
              <SegmentedControl value={count} onValueChange={(next) => setCount(String(next))}>
                <SegmentedControlList size="small" aria-label="Units listed">
                  <SegmentedControlButton value="3">Top 3</SegmentedControlButton>
                  <SegmentedControlButton value="6">Top 6</SegmentedControlButton>
                  <SegmentedControlButton value="11">All 11</SegmentedControlButton>
                </SegmentedControlList>
              </SegmentedControl>
            </div>
            <div className="grid grid-cols-12 gap-6">
              <Panel className="col-span-5" title="Downtime by unit" subtitle="Hours · 12 months">
                <Bars
                  label="Downtime hours per unit over the last 12 months, largest first"
                  orientation="horizontal"
                  categories={rows.map(({ asset }) => asset.tag)}
                  series={[{ id: 'downtime', label: 'Downtime', values: rows.map(({ record }) => record.downtime) }]}
                  tones={rows.map(({ asset }) => AP_HEALTH_TONE[asset.health])}
                  unit="h"
                  showValues
                  height={Math.max(220, rows.length * 44)}
                />
              </Panel>
              <Panel className="col-span-7" title="Register" subtitle={`${rows.length} of 11 units`} padding="none">
                <DataTable label="Bad actor register" columns={AP_REGISTER_COLUMNS} rows={rows} rowKey={(unit) => unit.asset.id} rowTone={({ asset }) => (asset.health === 'good' ? undefined : AP_HEALTH_TONE[asset.health])} flush />
              </Panel>
            </div>
          </div>
        </DrawingSheet>
      </Canvas>
    </LookScope>
  );
}

const AP_MODES = [
  { mode: 'Drive-end bearing wear', events: 3, hours: 96, share: 76 },
  { mode: 'Seal gas filter blockage', events: 2, hours: 18, share: 14 },
  { mode: 'Anti-surge valve sticking', events: 1, hours: 8, share: 6 },
  { mode: 'Instrument faults', events: 4, hours: 4, share: 4 },
];

const AP_MODE_COLUMNS: DataTableColumn<(typeof AP_MODES)[number]>[] = [
  { id: 'mode', header: 'Failure mode', cell: (row) => row.mode },
  { id: 'events', header: 'Events', cell: (row) => String(row.events), numeric: true },
  { id: 'hours', header: 'Hours lost', cell: (row) => `${row.hours} h`, numeric: true, nowrap: true },
  { id: 'share', header: 'Share', cell: (row) => `${row.share} %`, numeric: true, nowrap: true },
];

function AssetPerformanceAssetSheet() {
  const [id, setId] = useState('23-ka-9103');
  const unit = apUnit(id);
  const { asset, record } = unit;

  return (
    <LookScope look="blueprint">
      <Canvas>
        <DrawingSheet
          label={`Asset performance, sheet 3 of 3: ${asset.name}`}
          rows={['A', 'B', 'C']}
          titleBlock={
            <TitleBlock
              mark={<ApSheetMark />}
              cells={[{ label: 'Title', value: asset.tag, strong: true, grow: 2.2 }, ...AP_TITLE_CELLS.slice(1)]}
              end={<span className="text-sm font-semibold whitespace-nowrap tabular-nums">Sheet 3 of 3</span>}
            />
          }
        >
          <div className="flex flex-col gap-5 pb-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm text-(--kit-text-2)">
                  Class {asset.criticality} · {AP_STATE_LABEL[asset.state].toLowerCase()} · consequence {record.consequence} / 100
                </p>
                <p className="text-4xl font-semibold tracking-tight">{asset.name}</p>
              </div>
              <SegmentedControl value={id} onValueChange={(next) => setId(String(next))}>
                <SegmentedControlList size="small" aria-label="Unit">
                  <SegmentedControlButton value="23-ka-9103">23-KA-9103</SegmentedControlButton>
                  <SegmentedControlButton value="23-ka-9101">23-KA-9101</SegmentedControlButton>
                  <SegmentedControlButton value="23-ha-9114">23-HA-9114</SegmentedControlButton>
                </SegmentedControlList>
              </SegmentedControl>
            </div>
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-5 flex flex-col gap-3">
                <p className="border-b border-(--kit-rule-strong) pb-1 text-sm font-semibold">Dimensions</p>
                <ApDimensions unit={unit} />
              </div>
              <Panel className="col-span-7" title="Health score" subtitle="12 months · action below 60">
                <ApHealthTrend unit={unit} height={250} />
              </Panel>
              <Panel className="col-span-7" title="Failure modes" subtitle={`${record.downtime} h lost`} padding="none">
                <DataTable
                  label={`Failure modes of ${asset.name}`}
                  columns={AP_MODE_COLUMNS}
                  rows={AP_MODES.map((row) => ({ ...row, hours: Math.round((row.share / 100) * record.downtime) }))}
                  rowKey={(row) => row.mode}
                  flush
                />
              </Panel>
              <Panel className="col-span-5" title="Work in hand" subtitle="Orders on this unit">
                <ul>
                  <ListRow leading={<IconTool aria-hidden="true" className="size-5" />} title={record.action} meta={record.mode} trailing={<StatusPill tone="info">Open</StatusPill>} />
                  <ListRow leading={<IconTool aria-hidden="true" className="size-5" />} title="Oil analysis, quarterly" meta="Last sample 9 March, within limits" trailing={<StatusPill tone="success">Done</StatusPill>} />
                </ul>
              </Panel>
            </div>
          </div>
        </DrawingSheet>
      </Canvas>
    </LookScope>
  );
}

function AssetPerformanceMatrix() {
  const [selectedId, setSelectedId] = useState('23-ha-9114');
  const units = AP_UNITS.filter(({ asset }) => asset.parentId === 'nk-23');
  return (
    <LookScope look="blueprint">
      <Canvas>
        <BubbleMatrix
          label="Consequence against health for the gas compression area"
          points={apPoints(units, 'downtime')}
          xAxis={AP_X}
          yAxis={AP_Y}
          split={{ x: 75, y: 66 }}
          quadrants={AP_QUADRANTS.map((quadrant) => ({ ...quadrant, note: '' }))}
          sizeLabel="downtime in hours"
          selectedId={selectedId}
          onSelect={setSelectedId}
          height={320}
          diameters={[16, 48]}
        />
      </Canvas>
    </LookScope>
  );
}

function AssetPerformanceDimensions() {
  return (
    <LookScope look="blueprint">
      <Canvas className="flex h-full flex-col justify-center">
        <Panel title="1st stage compressor" subtitle="23-KA-9101">
          <ApDimensions unit={apUnit('23-ka-9101')} />
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function AssetPerformanceTitleBlock() {
  return (
    <LookScope look="blueprint">
      <Canvas>
        <TitleBlock mark={<ApSheetMark />} cells={[AP_TITLE_CELLS[0], AP_TITLE_CELLS[1], AP_TITLE_CELLS[3]]} end={<span className="text-sm font-semibold whitespace-nowrap">Sheet 1 of 3</span>} />
      </Canvas>
    </LookScope>
  );
}

function AssetPerformanceQuadrantKey() {
  return (
    <LookScope look="blueprint">
      <Canvas>
        <div className="grid grid-cols-2 border border-(--kit-rule-strong) bg-(--kit-halo)">
          {AP_QUADRANTS.map((quadrant, index) => (
            <div key={quadrant.corner} data-tone={quadrant.tone ?? 'neutral'} className={`p-3 ${index % 2 === 1 ? 'border-l border-dashed border-(--kit-rule-strong)' : ''} ${index > 1 ? 'border-t border-dashed border-(--kit-rule-strong)' : ''}`}>
              <p className={`text-base font-semibold ${quadrant.tone ? 'text-(--t-ink)' : ''}`}>{quadrant.title}</p>
              <p className="text-xs text-(--kit-text-2)">{quadrant.note}</p>
            </div>
          ))}
        </div>
      </Canvas>
    </LookScope>
  );
}

function AssetPerformanceHealthTrend() {
  return (
    <LookScope look="blueprint">
      <Canvas>
        <Panel title="Recompressor" subtitle="Health score · 12 months">
          <ApHealthTrend unit={apUnit('23-ka-9103')} height={220} />
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function AssetPerformanceRegister() {
  return (
    <LookScope look="blueprint">
      <Canvas>
        <Panel title="Register" subtitle="Top 4 by downtime" padding="none">
          <DataTable label="Top four bad actors" columns={AP_REGISTER_COLUMNS.filter((column) => column.id !== 'cost' && column.id !== 'class')} rows={AP_RANKED.slice(0, 4)} rowKey={(unit) => unit.asset.id} flush />
        </Panel>
      </Canvas>
    </LookScope>
  );
}

export default definePage({
  id: 'asset-performance',
  title: 'Asset performance',
  summary:
    'A reliability engineer’s drawing set for eleven units: a criticality-against-condition bubble matrix with quadrant instructions, and a dimensioned sheet for the selected asset.',
  guidance: {
    use: [
      'When the decision is where to spend reliability effort: two scores place the asset, a third sizes it.',
      'Write the instruction in each quadrant so the chart says what to do, not only where things are.',
      'Give the selected asset a sheet with figures drawn to scale against their targets.',
    ],
    avoid: [
      'A ranked table as the first view; ranking hides that a healthy critical unit and a failing minor one need different care.',
      'More than about fifteen labelled bubbles — filter by type or area first.',
      'Colour by equipment type on this chart; colour carries condition here.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Sheet 1 in the blueprint look: the matrix and the sheet of the selected unit.',
      specimens: [
        {
          id: 'AssetPerformanceSignature',
          title: 'Criticality matrix',
          note: 'Pick it for the reliability review: click a bubble to read the unit against its targets.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['kit/asset-performance/BubbleMatrix.tsx', 'kit/asset-performance/DimensionLine.tsx', 'kit/asset-performance/DrawingSheet.tsx', 'kit/TrendLine.tsx', 'looks/LookScope.tsx'],
          Component: AssetPerformanceSignature,
        },
      ],
    },
    {
      id: 'variations',
      title: 'Other sheets',
      description: 'The rest of the drawing set: the bad actor register and a full asset sheet.',
      specimens: [
        {
          id: 'AssetPerformanceBadActors',
          title: 'Bad actor register',
          note: 'Pick it when the meeting needs a ranked list with the share of downtime it explains.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['kit/asset-performance/DrawingSheet.tsx', 'kit/Bars.tsx', 'kit/DataTable.tsx'],
          Component: AssetPerformanceBadActors,
        },
        {
          id: 'AssetPerformanceAssetSheet',
          title: 'Asset sheet',
          note: 'Pick it as the drill-down page of one unit, printed or on screen.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['kit/asset-performance/DimensionLine.tsx', 'kit/asset-performance/DrawingSheet.tsx', 'kit/TrendLine.tsx', 'kit/DataTable.tsx'],
          Component: AssetPerformanceAssetSheet,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The pieces of the drawing set on their own.',
      specimens: [
        {
          id: 'AssetPerformanceMatrix',
          title: 'Bubble matrix',
          note: 'Use a small matrix for one area, with quadrant names only.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['kit/asset-performance/BubbleMatrix.tsx'],
          Component: AssetPerformanceMatrix,
        },
        {
          id: 'AssetPerformanceDimensions',
          title: 'Dimension lines',
          note: 'Use them for figures that mean more against a scale and a target than as bare numbers.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['kit/asset-performance/DimensionLine.tsx', 'kit/Panel.tsx'],
          Component: AssetPerformanceDimensions,
        },
        {
          id: 'AssetPerformanceHealthTrend',
          title: 'Health trend',
          note: 'Use it to show whether a unit is drifting toward its action limit.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['kit/TrendLine.tsx', 'kit/Panel.tsx'],
          Component: AssetPerformanceHealthTrend,
        },
        {
          id: 'AssetPerformanceRegister',
          title: 'Register table',
          note: 'Use it for a short ranked list inside another page.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['kit/DataTable.tsx', 'kit/Panel.tsx'],
          Component: AssetPerformanceRegister,
        },
        {
          id: 'AssetPerformanceTitleBlock',
          title: 'Title block',
          note: 'Use it to name a sheet, its number, period and revision in one ruled strip.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['kit/asset-performance/DrawingSheet.tsx'],
          Component: AssetPerformanceTitleBlock,
        },
        {
          id: 'AssetPerformanceQuadrantKey',
          title: 'Quadrant key',
          note: 'Use it as a legend when the matrix is too small to carry the instructions.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          Component: AssetPerformanceQuadrantKey,
        },
      ],
    },
  ],
});
