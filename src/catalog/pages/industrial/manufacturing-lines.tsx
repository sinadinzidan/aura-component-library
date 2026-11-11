import { Button } from '@cognite/aura/components/button';
import { CheckboxItem, CheckboxItemControl, CheckboxItemLabel } from '@cognite/aura/components/checkbox';
import {
  IconAlertTriangle,
  IconBuildingFactory2,
  IconCircleCheck,
  IconCircleX,
  IconClock,
  IconGauge,
  IconPackage,
  IconSettings,
  IconTarget,
  IconTool,
  IconUser,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { Bars } from '../../../library/kit/Bars';
import { Canvas } from '../../../library/kit/Canvas';
import { DataTable, type DataTableColumn } from '../../../library/kit/DataTable';
import { Grid } from '../../../library/kit/Grid';
import { IconChip } from '../../../library/kit/IconChip';
import { ListRow } from '../../../library/kit/ListRow';
import { AndonBoard, type AndonTile } from '../../../library/kit/manufacturing-lines/AndonBoard';
import {
  STATION_MEANING,
  STATION_STATES,
  STATION_TONE,
  STATION_WORD,
  bottleneckIndex,
  firstPassYield,
  formatClock,
  taktVerdict,
  type Station,
} from '../../../library/kit/manufacturing-lines/lines';
import { LineStrip } from '../../../library/kit/manufacturing-lines/LineStrip';
import { StationCard } from '../../../library/kit/manufacturing-lines/StationCard';
import { TaktClock } from '../../../library/kit/manufacturing-lines/TaktClock';
import { Meter } from '../../../library/kit/Meter';
import { Panel } from '../../../library/kit/Panel';
import { RingGauge } from '../../../library/kit/RingGauge';
import { SectionHeader } from '../../../library/kit/SectionHeader';
import { Stat } from '../../../library/kit/Stat';
import { StatGroup } from '../../../library/kit/StatGroup';
import { StatusPill } from '../../../library/kit/StatusPill';
import type { Tone } from '../../../library/kit/tones';
import { TrendArea } from '../../../library/kit/TrendArea';
import type { LookId } from '../../../library/looks/looks';
import { LookScope } from '../../../library/looks/LookScope';
import { makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './manufacturing-lines.tsx?raw';

const MANUFACTURING_LINES_TAKT = 48;

/** Line 3, valve actuator assembly, in flow order. */
const MANUFACTURING_LINES_STATIONS: Station[] = [
  { id: 's1', code: 'S1', name: 'Housing load', state: 'running', cycleSeconds: 44, buffer: { count: 4, capacity: 6 } },
  { id: 's2', code: 'S2', name: 'Bearing press', state: 'running', cycleSeconds: 46, buffer: { count: 5, capacity: 6 } },
  { id: 's3', code: 'S3', name: 'Gear assembly', state: 'running', cycleSeconds: 52, buffer: { count: 6, capacity: 6 } },
  { id: 's4', code: 'S4', name: 'Leak test', state: 'blocked', reason: 'Buffer to S5 is full', since: '6 min', buffer: { count: 6, capacity: 6 } },
  { id: 's5', code: 'S5', name: 'Torque and seal', state: 'down', reason: 'Torque tool fault E-217', since: '12 min', buffer: { count: 0, capacity: 6 } },
  { id: 's6', code: 'S6', name: 'Final test', state: 'starved', reason: 'No parts from S5', since: '9 min', buffer: { count: 1, capacity: 6 } },
  { id: 's7', code: 'S7', name: 'Pack out', state: 'running', cycleSeconds: 35 },
];

type ManufacturingLinesStationRow = Station & { count: number; good: number };

const MANUFACTURING_LINES_ROWS: ManufacturingLinesStationRow[] = MANUFACTURING_LINES_STATIONS.map((station, index) => ({
  ...station,
  count: [368, 362, 356, 350, 344, 343, 342][index],
  good: [366, 359, 349, 341, 334, 337, 342][index],
}));

const MANUFACTURING_LINES_STATION_COLUMNS: DataTableColumn<ManufacturingLinesStationRow>[] = [
  { id: 'code', header: 'Stn', width: 'w-14', cell: (row) => row.code },
  { id: 'name', header: 'Station', cell: (row) => row.name },
  { id: 'state', header: 'State', nowrap: true, cell: (row) => <StatusPill tone={STATION_TONE[row.state]}>{STATION_WORD[row.state]}</StatusPill> },
  { id: 'cycle', header: 'Cycle', numeric: true, nowrap: true, cell: (row) => (row.cycleSeconds === undefined ? '—' : `${row.cycleSeconds} s`) },
  { id: 'takt', header: 'Against takt', nowrap: true, muted: true, cell: (row) => (row.cycleSeconds === undefined ? (row.reason ?? '—') : taktVerdict(row.cycleSeconds, MANUFACTURING_LINES_TAKT).word) },
  { id: 'count', header: 'Count', numeric: true, cell: (row) => row.count },
  { id: 'fpy', header: 'First-pass yield', numeric: true, nowrap: true, cell: (row) => `${firstPassYield(row.good, row.count).toFixed(1)} %` },
];

const MANUFACTURING_LINES_HOURS = ['06', '07', '08', '09', '10', '11', '12', '13'];

const MANUFACTURING_LINES_HOURLY = [72, 76, 74, 51, 69, 0, 0, 0];

const MANUFACTURING_LINES_CYCLE_BINS = ['36', '38', '40', '42', '44', '46', '48', '50', '52', '54', '56'];

const MANUFACTURING_LINES_CYCLE_COUNTS = [2, 6, 14, 31, 58, 74, 49, 33, 21, 9, 3];

const MANUFACTURING_LINES_CYCLE_TONES: Tone[] = MANUFACTURING_LINES_CYCLE_BINS.map((bin) => (Number(bin) >= MANUFACTURING_LINES_TAKT ? 'warning' : 'accent'));

const MANUFACTURING_LINES_OEE = makeValues({ seed: 86, points: 24, base: 78, amplitude: 4, noise: 1.4, drift: -5, min: 55, max: 92, decimals: 0 });

const MANUFACTURING_LINES_OEE_LABELS = MANUFACTURING_LINES_OEE.map((_, index) => `${String(6 + Math.floor(index / 4)).padStart(2, '0')}:${String((index % 4) * 15).padStart(2, '0')}`);

const MANUFACTURING_LINES_CHANGEOVER_STEPS = ['Run out the last M40 actuators', 'Swap the gear nest at S3', 'Load torque program M52 at S5', 'Change leak-test adapter at S4', 'First-off part approved by quality'];

type ManufacturingLinesCall = { id: string; station: string; kind: string; detail: string; age: string; tone: Tone; word: string; icon: ReactNode };

const MANUFACTURING_LINES_CALLS: ManufacturingLinesCall[] = [
  { id: 'c1', station: 'S5 · Torque and seal', kind: 'Maintenance', detail: 'Torque tool fault E-217 · Tomás Barros on his way', age: '12 min', tone: 'critical', word: 'Open', icon: <IconTool /> },
  { id: 'c2', station: 'S3 · Gear assembly', kind: 'Material', detail: 'Gear kits low, 14 left · replenishment ordered', age: '7 min', tone: 'warning', word: 'Acknowledged', icon: <IconPackage /> },
  { id: 'c3', station: 'S4 · Leak test', kind: 'Quality', detail: 'Two leak rejects in a row · sample sent to lab', age: '21 min', tone: 'info', word: 'In hand', icon: <IconGauge /> },
  { id: 'c4', station: 'S1 · Housing load', kind: 'Team leader', detail: 'Glove change · closed after 3 min', age: '48 min', tone: 'success', word: 'Closed', icon: <IconUser /> },
];

const MANUFACTURING_LINES_ANDON: AndonTile[] = MANUFACTURING_LINES_STATIONS.map((station) => ({
  id: station.id,
  code: station.code,
  name: station.name,
  state: STATION_WORD[station.state],
  tone: STATION_TONE[station.state],
  detail: station.reason ? `${station.reason}, ${station.since ?? ''}` : `${station.cycleSeconds ?? 0} s cycle`,
}));

type ManufacturingLinesLine = { id: string; name: string; product: string; state: string; tone: Tone; count: number; target: number; oee: number; stop: string };

const MANUFACTURING_LINES_LINES: ManufacturingLinesLine[] = [
  { id: 'l1', name: 'Line 1', product: 'Ball valve DN50', state: 'Running', tone: 'success', count: 412, target: 400, oee: 88, stop: 'None' },
  { id: 'l2', name: 'Line 2', product: 'Ball valve DN80', state: 'Changeover', tone: 'info', count: 228, target: 260, oee: 71, stop: 'Changeover, 18 of 25 min' },
  { id: 'l3', name: 'Line 3', product: 'Actuator M40', state: 'Down', tone: 'critical', count: 342, target: 360, oee: 68, stop: 'S5 torque tool fault, 12 min' },
  { id: 'l4', name: 'Line 4', product: 'Positioner P2', state: 'Running', tone: 'success', count: 190, target: 192, oee: 84, stop: 'None' },
];

const MANUFACTURING_LINES_LINE_COLUMNS: DataTableColumn<ManufacturingLinesLine>[] = [
  {
    id: 'line',
    header: 'Line',
    cell: (line) => (
      <span className="flex flex-col">
        <span className="font-medium">{line.name}</span>
        <span className="text-xs text-(--kit-text-2)">{line.product}</span>
      </span>
    ),
  },
  { id: 'state', header: 'State', nowrap: true, cell: (line) => <StatusPill tone={line.tone}>{line.state}</StatusPill> },
  { id: 'count', header: 'Count', numeric: true, nowrap: true, cell: (line) => `${line.count} of ${line.target}` },
  { id: 'pace', header: 'Against pace', numeric: true, nowrap: true, cell: (line) => (line.count >= line.target ? `+${line.count - line.target}` : `−${line.target - line.count}`) },
  { id: 'oee', header: 'OEE', numeric: true, nowrap: true, cell: (line) => `${line.oee} %` },
  { id: 'stop', header: 'Current stop', muted: true, cell: (line) => line.stop },
];

/** One sheet of the page: a look scope with its canvas. Without a look it follows the app's look. */
function ManufacturingLinesSheet({ look, children }: { look?: LookId; children: ReactNode }) {
  const canvas = <Canvas className="h-full">{children}</Canvas>;
  return look ? (
    <LookScope look={look} className="h-full w-full">
      {canvas}
    </LookScope>
  ) : (
    <div className="h-full w-full">{canvas}</div>
  );
}

function ManufacturingLinesStrip() {
  const [selected, setSelected] = useState('s5');
  const station = MANUFACTURING_LINES_STATIONS.find((item) => item.id === selected) ?? MANUFACTURING_LINES_STATIONS[0];
  return (
    <ManufacturingLinesSheet>
      <Panel
        title="Line 3 · actuator assembly"
        subtitle="Stations in flow order with the buffers between them · takt 48 s"
        icon={<IconBuildingFactory2 />}
        actions={<StatusPill tone="critical" icon={<IconAlertTriangle />}>Down at S5</StatusPill>}
        footer={
          <span className="text-sm text-(--kit-text-2)">
            {station.code} {station.name}: {STATION_WORD[station.state].toLowerCase()}. {station.reason ? `${station.reason}, ${station.since}.` : `Cycle ${station.cycleSeconds} s against a takt of ${MANUFACTURING_LINES_TAKT} s.`}
          </span>
        }
      >
        <LineStrip label="Line 3, stations in flow order" stations={MANUFACTURING_LINES_STATIONS} taktSeconds={MANUFACTURING_LINES_TAKT} selected={selected} onSelect={setSelected} />
      </Panel>
    </ManufacturingLinesSheet>
  );
}

function ManufacturingLinesStationCards() {
  return (
    <ManufacturingLinesSheet>
      <Grid>
        <StationCard className="col-span-4" station={MANUFACTURING_LINES_STATIONS[0]} taktSeconds={MANUFACTURING_LINES_TAKT} count={368} yieldPercent={99.5} />
        <StationCard className="col-span-4" station={{ ...MANUFACTURING_LINES_STATIONS[2], reason: 'Slowest station on the line' }} taktSeconds={MANUFACTURING_LINES_TAKT} count={356} yieldPercent={98} />
        <StationCard
          className="col-span-4"
          station={MANUFACTURING_LINES_STATIONS[4]}
          taktSeconds={MANUFACTURING_LINES_TAKT}
          count={344}
          yieldPercent={97.1}
          action={
            <Button size="sm" variant="secondary">
              Call maintenance
            </Button>
          }
        />
      </Grid>
    </ManufacturingLinesSheet>
  );
}

function ManufacturingLinesStates() {
  return (
    <ManufacturingLinesSheet>
      <Panel title="Station states" subtitle="Six states, each with one meaning and one colour">
        <AndonBoard
          label="Station states"
          columns={2}
          tiles={STATION_STATES.map((state, index) => ({ id: state, code: String(index + 1), name: '', state: STATION_WORD[state], tone: STATION_TONE[state], detail: STATION_MEANING[state] }))}
        />
      </Panel>
    </ManufacturingLinesSheet>
  );
}

function ManufacturingLinesStop() {
  const [acknowledged, setAcknowledged] = useState(false);
  return (
    <ManufacturingLinesSheet>
      <Panel
        title="Current stop"
        subtitle="S5 · Torque and seal"
        icon={<IconCircleX />}
        tone="critical"
        actions={<StatusPill tone={acknowledged ? 'warning' : 'critical'}>{acknowledged ? 'Acknowledged' : 'Unanswered'}</StatusPill>}
        footer={
          <div className="flex w-full items-center justify-between gap-3">
            <span className="text-sm text-(--kit-text-2)">{acknowledged ? 'Tomás Barros is on his way.' : 'Escalates to the shift lead at 15 minutes.'}</span>
            <Button size="sm" disabled={acknowledged} onClick={() => setAcknowledged(true)}>
              Acknowledge
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <p data-tone="critical" className="tabular-nums">
            <span className="text-6xl leading-none font-semibold tracking-tight text-(--t-ink)">{formatClock(754)}</span>
            <span className="ml-2 text-sm text-(--kit-text-2)">stopped</span>
          </p>
          <p className="text-base font-medium">Torque tool fault E-217</p>
          <StatGroup joined columns={3} label="Cost of the stop">
            <Stat variant="plain" size="sm" label="Parts lost" value={15} tone="critical" />
            <Stat variant="plain" size="sm" label="Stops today" value={3} />
            <Stat variant="plain" size="sm" label="Same fault, 7 days" value={4} />
          </StatGroup>
        </div>
      </Panel>
    </ManufacturingLinesSheet>
  );
}

function ManufacturingLinesTakt() {
  return (
    <ManufacturingLinesSheet>
      <Panel title="Count against target" subtitle="Line 3 · day shift 06:00 to 14:00" icon={<IconTarget />}>
        <TaktClock label="Actuators M40" count={342} target={600} elapsedShare={0.6} remaining="3 h 10 min left" rate="71 an hour now, 81 needed to finish" />
      </Panel>
    </ManufacturingLinesSheet>
  );
}

function ManufacturingLinesHourly() {
  return (
    <ManufacturingLinesSheet>
      <Grid>
        <Panel className="col-span-8" title="Production by hour" subtitle="Good parts per hour against the hourly target of 75">
          <Bars
            label="Good parts per hour this shift, against the hourly target"
            categories={MANUFACTURING_LINES_HOURS}
            series={[{ id: 'count', label: 'Good parts', values: MANUFACTURING_LINES_HOURLY }]}
            tones={['warning', 'success', 'warning', 'critical', 'warning', 'neutral', 'neutral', 'neutral']}
            limit={{ value: 75, label: 'Target', tone: 'neutral' }}
            showValues
            height={230}
            notes="09:00 lost 24 parts to the gear nest jam at S3. The last three hours have not run yet."
          />
        </Panel>
        <div className="col-span-4 flex flex-col gap-(--kit-gap)">
          <Stat className="flex-1" label="Good parts" value={342} unit="of 600" icon={<IconPackage />} tone="blue" target="18 behind pace" />
          <Stat className="flex-1" label="Best hour" value={76} unit="parts" icon={<IconCircleCheck />} tone="green" target="07:00, one over target" />
          <Stat className="flex-1" label="Worst hour" value={51} unit="parts" icon={<IconAlertTriangle />} tone="critical" target="09:00, gear nest jam" />
        </div>
      </Grid>
    </ManufacturingLinesSheet>
  );
}

function ManufacturingLinesChangeover() {
  const [done, setDone] = useState<number[]>([0, 1, 2]);
  const finished = done.length === MANUFACTURING_LINES_CHANGEOVER_STEPS.length;
  return (
    <ManufacturingLinesSheet>
      <Panel
        title="Changeover M40 to M52"
        subtitle="Line 2 · target 25 minutes"
        icon={<IconSettings />}
        actions={<StatusPill tone={finished ? 'success' : 'info'}>{finished ? 'Ready to run' : `${done.length} of ${MANUFACTURING_LINES_CHANGEOVER_STEPS.length} steps`}</StatusPill>}
      >
        <div className="flex flex-col gap-5">
          <Meter size="lg" label="Elapsed" value={18} max={35} unit="min" tone="info" target={{ value: 25, label: 'Target' }} />
          <div className="flex flex-col gap-3">
            {MANUFACTURING_LINES_CHANGEOVER_STEPS.map((step, index) => (
              <CheckboxItem key={step}>
                <CheckboxItemControl checked={done.includes(index)} onCheckedChange={(checked) => setDone(checked === true ? [...done, index] : done.filter((item) => item !== index))} />
                <CheckboxItemLabel>{step}</CheckboxItemLabel>
              </CheckboxItem>
            ))}
          </div>
        </div>
      </Panel>
    </ManufacturingLinesSheet>
  );
}

function ManufacturingLinesBuffers() {
  return (
    <ManufacturingLinesSheet>
      <Panel title="Buffers between stations" subtitle="Parts waiting · a full buffer blocks, an empty one starves" icon={<IconPackage />}>
        <div className="flex flex-col gap-5">
          <Meter label="S2 to S3" value={5} max={6} unit="parts" tone="success" />
          <Meter label="S3 to S4" value={6} max={6} unit="parts" tone="warning" />
          <Meter label="S4 to S5 · full, S4 is blocked" value={6} max={6} unit="parts" tone="critical" />
          <Meter label="S5 to S6 · empty, S6 is starved" value={0} max={6} unit="parts" tone="critical" />
        </div>
      </Panel>
    </ManufacturingLinesSheet>
  );
}

function ManufacturingLinesHistogram() {
  return (
    <ManufacturingLinesSheet>
      <Panel title="Cycle times at S3" subtitle="Gear assembly · last 300 cycles, seconds">
        <Bars
          label="Distribution of cycle times at gear assembly, last 300 cycles; bins at or above the 48 second takt are highlighted"
          categories={MANUFACTURING_LINES_CYCLE_BINS}
          series={[{ id: 'cycles', label: 'Cycles', values: MANUFACTURING_LINES_CYCLE_COUNTS }]}
          tones={MANUFACTURING_LINES_CYCLE_TONES}
          height={220}
          notes="115 of 300 cycles ran at or over the 48 s takt (shown in the warning colour). The median is 46 s."
        />
      </Panel>
    </ManufacturingLinesSheet>
  );
}

function ManufacturingLinesScrap() {
  return (
    <ManufacturingLinesSheet>
      <Panel title="Scrap and rework by reason" subtitle="Line 3 · this week, parts">
        <Bars
          label="Scrap and rework by reason this week"
          orientation="horizontal"
          stacked
          categories={['Leak test reject', 'Torque out of range', 'Gear misaligned', 'Housing scratched', 'Seal damaged']}
          series={[
            { id: 'scrap', label: 'Scrap', values: [14, 9, 6, 2, 4], tone: 'critical' },
            { id: 'rework', label: 'Rework', values: [22, 12, 7, 9, 3], tone: 'amber' },
          ]}
          showLegend
          height={240}
        />
      </Panel>
    </ManufacturingLinesSheet>
  );
}

function ManufacturingLinesYield() {
  return (
    <ManufacturingLinesSheet>
      <Grid>
        <Panel className="col-span-8" title="First-pass yield per station" subtitle="Share of parts passed first time, this shift">
          <div className="flex h-full items-center justify-around gap-3">
            {MANUFACTURING_LINES_ROWS.slice(0, 6).map((row) => {
              const value = firstPassYield(row.good, row.count);
              return <RingGauge key={row.id} label={`${row.code} ${row.name}`} value={value} decimals={1} tone={value >= 98 ? 'success' : value >= 97.2 ? 'warning' : 'critical'} size={104} />;
            })}
          </div>
        </Panel>
        <Panel className="col-span-4" title="Quality gate" subtitle="Lot 24-0312-A · final test" actions={<StatusPill tone="warning">Held</StatusPill>}>
          <div className="flex flex-col">
            <ListRow tone="success" title="Torque signature" meta="48 of 48 within window" trailing={<StatusPill tone="success">Pass</StatusPill>} />
            <ListRow tone="success" title="Stroke time" meta="1.82 s, limit 2.00 s" trailing={<StatusPill tone="success">Pass</StatusPill>} />
            <ListRow tone="critical" title="Leak rate" meta="2 of 48 above 0.5 ml/min" trailing={<StatusPill tone="critical">Fail</StatusPill>} />
          </div>
        </Panel>
      </Grid>
    </ManufacturingLinesSheet>
  );
}

function ManufacturingLinesPareto() {
  return (
    <ManufacturingLinesSheet>
      <Panel title="Downtime by reason" subtitle="Line 3 · this week, minutes · largest first">
        <Bars
          label="Downtime by reason this week, in minutes, largest first"
          orientation="horizontal"
          categories={['Torque tool fault', 'Gear nest jam', 'Changeover overrun', 'Waiting for material', 'Leak-test adapter', 'Other']}
          series={[{ id: 'minutes', label: 'Downtime', values: [142, 96, 58, 41, 27, 19] }]}
          tones={['critical', 'critical', 'warning', 'warning', 'neutral', 'neutral']}
          unit="min"
          showValues
          height={250}
          notes="The first two reasons are 62 % of the week's 383 minutes."
        />
      </Panel>
    </ManufacturingLinesSheet>
  );
}

function ManufacturingLinesCalls() {
  return (
    <ManufacturingLinesSheet>
      <Panel title="Operator calls" subtitle="Line 3 · this shift" actions={<StatusPill tone="critical">1 open</StatusPill>}>
        <div className="flex flex-col">
          {MANUFACTURING_LINES_CALLS.map((call) => (
            <ListRow
              key={call.id}
              tone={call.tone}
              leading={
                <IconChip tone={call.tone} size="sm">
                  {call.icon}
                </IconChip>
              }
              title={`${call.kind} · ${call.station}`}
              meta={call.detail}
              trailing={
                <span className="flex flex-col items-end gap-1">
                  <StatusPill tone={call.tone}>{call.word}</StatusPill>
                  <span className="text-xs text-(--kit-text-2) tabular-nums">{call.age}</span>
                </span>
              }
            />
          ))}
        </div>
      </Panel>
    </ManufacturingLinesSheet>
  );
}

function ManufacturingLinesConsole() {
  return (
    <ManufacturingLinesSheet look="console">
      <Grid>
        <StatGroup className="col-span-12" columns={5} label="Line 3 figures">
          <Stat variant="plain" label="Line 3" value="Down" tone="critical" target="S5 torque tool, 12 min" />
          <Stat variant="plain" label="Count" value={342} unit="of 600" tone="warning" target="18 behind pace" />
          <Stat variant="plain" label="Takt" value={48} unit="s" target="Bottleneck S3 at 52 s" />
          <Stat variant="plain" label="OEE" value={68} unit="%" tone="warning" target="Target 80 %" />
          <Stat variant="plain" label="First-pass yield" value={97.1} decimals={1} unit="%" tone="success" target="Target 97 %" />
        </StatGroup>
        <div className="col-span-12 bg-(--kit-surface) p-3">
          <LineStrip label="Line 3, stations in flow order" stations={MANUFACTURING_LINES_STATIONS} taktSeconds={MANUFACTURING_LINES_TAKT} />
        </div>
        <Panel className="col-span-12" title="Stations" subtitle="Cycle, count and yield this shift" padding="none">
          <DataTable
            label="Stations of line 3"
            flush
            columns={MANUFACTURING_LINES_STATION_COLUMNS}
            rows={MANUFACTURING_LINES_ROWS}
            rowKey={(row) => row.id}
            rowTone={(row) => (row.state === 'running' ? undefined : STATION_TONE[row.state])}
          />
        </Panel>
      </Grid>
    </ManufacturingLinesSheet>
  );
}

function ManufacturingLinesPoster() {
  return (
    <ManufacturingLinesSheet look="poster">
      <Grid>
        <Panel className="col-span-7" title="Line 3 · day shift">
          <TaktClock label="Actuators M40" count={342} target={600} elapsedShare={0.6} remaining="3 h 10 min left" rate="Need 81 an hour" />
        </Panel>
        <Stat className="col-span-5" size="hero" tone="pink" label="Stopped at S5" value={formatClock(754)} unit="min" />
        <div className="col-span-12">
          <LineStrip label="Line 3, stations in flow order" stations={MANUFACTURING_LINES_STATIONS} taktSeconds={MANUFACTURING_LINES_TAKT} />
        </div>
      </Grid>
    </ManufacturingLinesSheet>
  );
}

function ManufacturingLinesSignal() {
  return (
    <ManufacturingLinesSheet look="signal">
      <div className="p-2">
        <AndonBoard label="Andon board, line 3" tiles={MANUFACTURING_LINES_ANDON} columns={4} />
      </div>
    </ManufacturingLinesSheet>
  );
}

function ManufacturingLinesBlueprint() {
  return (
    <ManufacturingLinesSheet look="blueprint">
      <Grid>
        <Panel className="col-span-12" title="Line 3 layout" subtitle="Flow left to right · buffers hold 6 · takt 48 s">
          <LineStrip label="Line 3 layout" stations={MANUFACTURING_LINES_STATIONS} taktSeconds={MANUFACTURING_LINES_TAKT} />
        </Panel>
        <Panel className="col-span-7" title="Cycle-time study, S3" subtitle="300 cycles, 2 s bins">
          <Bars
            label="Cycle-time study at gear assembly, 300 cycles in 2 second bins"
            categories={MANUFACTURING_LINES_CYCLE_BINS}
            series={[{ id: 'cycles', label: 'Cycles', values: MANUFACTURING_LINES_CYCLE_COUNTS }]}
            tones={MANUFACTURING_LINES_CYCLE_TONES}
            height={200}
          />
        </Panel>
        <Panel className="col-span-5" title="Station sheet, S3" subtitle="Gear assembly">
          <div className="flex flex-col gap-5">
            <Meter size="lg" label="Cycle time" value={52} max={72} unit="s" tone="critical" target={{ value: 48, label: 'Takt' }} />
            <Meter label="Buffer to S4" value={6} max={6} unit="parts" tone="warning" />
          </div>
        </Panel>
      </Grid>
    </ManufacturingLinesSheet>
  );
}

function ManufacturingLinesGlass() {
  return (
    <ManufacturingLinesSheet look="glass">
      <Grid>
        <Panel className="col-span-5" title="OEE, line 3" subtitle="Availability × performance × quality">
          <div className="flex h-full items-center justify-around gap-3">
            <RingGauge label="Availability" value={81} tone="pink" size={112} />
            <RingGauge label="Performance" value={86} tone="sky" size={112} />
            <RingGauge label="Quality" value={97} tone="green" size={112} />
          </div>
        </Panel>
        <Panel className="col-span-7" title="OEE through the shift" subtitle="15-minute values against the 80 % target">
          <TrendArea
            label="OEE of line 3 through the shift, against the target"
            labels={MANUFACTURING_LINES_OEE_LABELS}
            unit="%"
            height={190}
            series={[{ id: 'oee', label: 'OEE', values: MANUFACTURING_LINES_OEE, tone: 'accent' }]}
            limits={[{ value: 80, label: 'Target', tone: 'warning' }]}
          />
        </Panel>
      </Grid>
    </ManufacturingLinesSheet>
  );
}

function ManufacturingLinesSoft() {
  return (
    <ManufacturingLinesSheet look="soft">
      <Grid>
        <Panel className="col-span-5" tone="blue" title="How the shift is going" subtitle="Line 3 · day shift">
          <TaktClock label="Actuators M40" count={342} target={600} elapsedShare={0.6} remaining="3 h 10 min left" />
        </Panel>
        <Panel className="col-span-7" tone="pink" title="Who needs help" subtitle="Three stations are not running">
          <AndonBoard label="Stations that need help" columns={3} tiles={MANUFACTURING_LINES_ANDON.filter((tile) => tile.tone !== 'success')} />
        </Panel>
      </Grid>
    </ManufacturingLinesSheet>
  );
}

function ManufacturingLinesOverview() {
  const [selected, setSelected] = useState('s5');
  const index = MANUFACTURING_LINES_STATIONS.findIndex((item) => item.id === selected);
  const station = MANUFACTURING_LINES_STATIONS[index] ?? MANUFACTURING_LINES_STATIONS[0];
  const row = MANUFACTURING_LINES_ROWS[index] ?? MANUFACTURING_LINES_ROWS[0];
  const slowest = MANUFACTURING_LINES_STATIONS[bottleneckIndex(MANUFACTURING_LINES_STATIONS)];
  return (
    <ManufacturingLinesSheet>
      <Grid>
        <SectionHeader
          className="col-span-12"
          size="sm"
          level={4}
          title="Line 3 · actuator assembly"
          description="Product M40 · day shift · takt 48 s"
          actions={
            <StatusPill tone="critical" icon={<IconAlertTriangle />}>
              Down at S5 for {formatClock(754)}
            </StatusPill>
          }
        />
        <Stat className="col-span-3" label="Good parts" value={342} unit="of 600" icon={<IconPackage />} tone="blue" target="18 behind pace" />
        <Stat className="col-span-3" label="OEE" value={68} unit="%" icon={<IconGauge />} tone="purple" delta={{ value: -9, decimals: 0, unit: ' pts', caption: 'vs yesterday' }} target="Target 80 %" />
        <Stat className="col-span-3" label="First-pass yield" value={97.1} decimals={1} unit="%" icon={<IconCircleCheck />} tone="green" delta={{ value: 0.4, unit: ' pts', caption: 'vs yesterday' }} />
        <Stat className="col-span-3" label="Downtime today" value={41} unit="min" icon={<IconClock />} tone="critical" target={`Bottleneck ${slowest.code} at ${slowest.cycleSeconds} s`} />
        <Panel className="col-span-12" title="Stations" subtitle="Select a station to see it in detail">
          <LineStrip label="Line 3, stations in flow order" stations={MANUFACTURING_LINES_STATIONS} taktSeconds={MANUFACTURING_LINES_TAKT} selected={selected} onSelect={setSelected} />
        </Panel>
        <StationCard
          className="col-span-4"
          station={station}
          taktSeconds={MANUFACTURING_LINES_TAKT}
          count={row.count}
          yieldPercent={firstPassYield(row.good, row.count)}
          action={
            station.state === 'down' ? (
              <Button size="sm" variant="secondary">
                Call maintenance
              </Button>
            ) : undefined
          }
        />
        <Panel className="col-span-8" title="Production by hour" subtitle="Good parts against the hourly target of 75">
          <Bars
            label="Good parts per hour this shift, against the hourly target"
            categories={MANUFACTURING_LINES_HOURS}
            series={[{ id: 'count', label: 'Good parts', values: MANUFACTURING_LINES_HOURLY }]}
            tones={['warning', 'success', 'warning', 'critical', 'warning', 'neutral', 'neutral', 'neutral']}
            limit={{ value: 75, label: 'Target', tone: 'neutral' }}
            showValues
            height={210}
          />
        </Panel>
      </Grid>
    </ManufacturingLinesSheet>
  );
}

function ManufacturingLinesPlant() {
  return (
    <ManufacturingLinesSheet>
      <Grid>
        <SectionHeader className="col-span-12" size="sm" level={4} title="Assembly hall" description="Four lines · day shift, 10:48" actions={<StatusPill tone="critical">1 line down</StatusPill>} />
        <div className="col-span-12">
          <AndonBoard
            label="Lines in the assembly hall"
            columns={4}
            tiles={MANUFACTURING_LINES_LINES.map((line) => ({ id: line.id, code: line.name, name: line.product, state: line.state, tone: line.tone, detail: line.stop === 'None' ? `${line.count} of ${line.target} by now` : line.stop }))}
          />
        </div>
        <Panel className="col-span-12" title="Lines" subtitle="Count against where each line should be by now" padding="none">
          <DataTable label="Lines in the assembly hall" flush columns={MANUFACTURING_LINES_LINE_COLUMNS} rows={MANUFACTURING_LINES_LINES} rowKey={(line) => line.id} rowTone={(line) => (line.tone === 'success' ? undefined : line.tone)} />
        </Panel>
      </Grid>
    </ManufacturingLinesSheet>
  );
}

export default definePage({
  id: 'manufacturing-lines',
  title: 'Manufacturing lines',
  summary:
    'A discrete production line at a glance: stations in flow order with their buffers, cycle time against takt, count against pace, changeovers, quality and the reasons for lost time. Each part is shown in several looks.',
  guidance: {
    use: [
      'Draw stations in flow order so starving and blocking point at their cause.',
      'Compare the count with where it should be by now, not only with the shift target.',
      'Mark takt on every cycle-time scale.',
      'Name the state in a word on every station.',
    ],
    avoid: [
      'One colour for starved and down: one waits, the other needs a person.',
      'OEE alone on a shop-floor screen: say what is stopping the line.',
      'A stop timer without its reason.',
      'Sorting downtime reasons alphabetically: largest first.',
    ],
  },
  source,
  sections: [
    {
      id: 'line-and-stations',
      title: 'Line and stations',
      description: 'The line as flow, and one station in detail.',
      specimens: [
        {
          id: 'ManufacturingLinesStrip',
          title: 'Line status strip',
          note: 'Pick it as the top of a line screen: every station and buffer in flow order, selectable, bottleneck named.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/manufacturing-lines/LineStrip.tsx', 'kit/manufacturing-lines/lines.ts', 'kit/Panel.tsx'],
          Component: ManufacturingLinesStrip,
        },
        {
          id: 'ManufacturingLinesStationCards',
          title: 'Station cards',
          note: 'Pick a card per station when cycle time, count and yield are read together: under takt, over takt and down.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/manufacturing-lines/StationCard.tsx', 'kit/manufacturing-lines/lines.ts'],
          Component: ManufacturingLinesStationCards,
        },
        {
          id: 'ManufacturingLinesStates',
          title: 'Station states',
          note: 'Pick it as the legend beside a board: six states, what each means and who has to act.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/manufacturing-lines/AndonBoard.tsx', 'kit/manufacturing-lines/lines.ts'],
          Component: ManufacturingLinesStates,
        },
        {
          id: 'ManufacturingLinesStop',
          title: 'Current stop',
          note: 'Pick it when the line is down: the clock, the reason, what it has cost and one button to take the call.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/StatGroup.tsx', 'kit/manufacturing-lines/lines.ts'],
          Component: ManufacturingLinesStop,
        },
      ],
    },
    {
      id: 'count-and-pace',
      title: 'Count, pace and changeover',
      description: 'Is the shift going to make its number.',
      specimens: [
        {
          id: 'ManufacturingLinesTakt',
          title: 'Count against target with pace',
          note: 'Pick it for the number the team works to: the count, where it should be by now and the rate needed.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/manufacturing-lines/TaktClock.tsx', 'kit/Panel.tsx'],
          Component: ManufacturingLinesTakt,
        },
        {
          id: 'ManufacturingLinesChangeover',
          title: 'Changeover timer and checklist',
          note: 'Pick it during a product change: elapsed time against the target and the steps ticked off.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/Meter.tsx', 'kit/Panel.tsx', 'kit/StatusPill.tsx'],
          Component: ManufacturingLinesChangeover,
        },
        {
          id: 'ManufacturingLinesHourly',
          title: 'Production by hour',
          note: 'Pick it for the hour-by-hour board: each hour against target, with the bad hour explained.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Bars.tsx', 'kit/Stat.tsx', 'kit/Panel.tsx'],
          Component: ManufacturingLinesHourly,
        },
        {
          id: 'ManufacturingLinesBuffers',
          title: 'Buffer levels',
          note: 'Pick it to explain a blocked or starved station: the buffer on each side says which neighbour is the cause.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/Meter.tsx', 'kit/Panel.tsx'],
          Component: ManufacturingLinesBuffers,
        },
        {
          id: 'ManufacturingLinesHistogram',
          title: 'Cycle-time histogram with takt',
          note: 'Pick it to judge a station fairly: the spread of cycles, with everything at or over takt highlighted.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/Bars.tsx', 'kit/Panel.tsx'],
          Component: ManufacturingLinesHistogram,
        },
      ],
    },
    {
      id: 'quality-and-losses',
      title: 'Quality, losses and calls',
      description: 'Where parts and minutes are lost.',
      specimens: [
        {
          id: 'ManufacturingLinesYield',
          title: 'First-pass yield and quality gate',
          note: 'Pick it for the quality view: yield per station as rings, and the gate result of the lot on hold.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/RingGauge.tsx', 'kit/ListRow.tsx', 'kit/manufacturing-lines/lines.ts'],
          Component: ManufacturingLinesYield,
        },
        {
          id: 'ManufacturingLinesScrap',
          title: 'Scrap and rework by reason',
          note: 'Pick stacked bars when scrap and rework share reasons and the split matters.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/Bars.tsx', 'kit/Panel.tsx'],
          Component: ManufacturingLinesScrap,
        },
        {
          id: 'ManufacturingLinesPareto',
          title: 'Downtime by reason',
          note: 'Pick ranked bars to choose what to fix first: reasons largest first, with the minutes written out.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/Bars.tsx', 'kit/Panel.tsx'],
          Component: ManufacturingLinesPareto,
        },
        {
          id: 'ManufacturingLinesCalls',
          title: 'Operator calls',
          note: 'Pick it for the team leader: who called, for what, how long ago and whether someone has it.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/ListRow.tsx', 'kit/IconChip.tsx', 'kit/StatusPill.tsx'],
          Component: ManufacturingLinesCalls,
        },
      ],
    },
    {
      id: 'looks',
      title: 'In other looks',
      description: 'The same line as a console, a poster, an andon wall, a layout drawing, glass rings and soft cards.',
      specimens: [
        {
          id: 'ManufacturingLinesConsole',
          title: 'Console line board',
          note: 'Pick it for the line office: figures in a strip, stations as solid state blocks and a dense table.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/StatGroup.tsx', 'kit/DataTable.tsx', 'kit/manufacturing-lines/LineStrip.tsx', 'looks/LookScope.tsx'],
          Component: ManufacturingLinesConsole,
        },
        {
          id: 'ManufacturingLinesPoster',
          title: 'Poster shift board',
          note: 'Pick it for the screen at the end of the line: the count, the stop clock and the stations as blocks.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/manufacturing-lines/TaktClock.tsx', 'kit/manufacturing-lines/LineStrip.tsx', 'kit/Stat.tsx', 'looks/LookScope.tsx'],
          Component: ManufacturingLinesPoster,
        },
        {
          id: 'ManufacturingLinesSignal',
          title: 'Signal andon board',
          note: 'Pick it for the andon screen above the line: every station filled with its state, read from across the hall.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/manufacturing-lines/AndonBoard.tsx', 'looks/LookScope.tsx'],
          Component: ManufacturingLinesSignal,
        },
        {
          id: 'ManufacturingLinesBlueprint',
          title: 'Blueprint line layout',
          note: 'Pick it for an engineering study: the layout as an outlined drawing with the cycle-time study beside it.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/manufacturing-lines/LineStrip.tsx', 'kit/Bars.tsx', 'kit/Meter.tsx', 'looks/LookScope.tsx'],
          Component: ManufacturingLinesBlueprint,
        },
        {
          id: 'ManufacturingLinesGlass',
          title: 'Glass OEE rings',
          note: 'Pick it for a management display: the three OEE factors as rings and the trend through the shift.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/RingGauge.tsx', 'kit/TrendArea.tsx', 'looks/LookScope.tsx'],
          Component: ManufacturingLinesGlass,
        },
        {
          id: 'ManufacturingLinesSoft',
          title: 'Soft team view',
          note: 'Pick it for a tablet the team shares: how the shift is going and which stations need help.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/manufacturing-lines/TaktClock.tsx', 'kit/manufacturing-lines/AndonBoard.tsx', 'looks/LookScope.tsx'],
          Component: ManufacturingLinesSoft,
        },
      ],
    },
    {
      id: 'in-use',
      title: 'In use',
      description: 'Compositions that can be dropped into a product.',
      specimens: [
        {
          id: 'ManufacturingLinesOverview',
          title: 'Line overview',
          note: 'Pick it as the line screen: four figures, the strip, the selected station and the hour-by-hour count.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/manufacturing-lines/LineStrip.tsx', 'kit/manufacturing-lines/StationCard.tsx', 'kit/Stat.tsx', 'kit/Bars.tsx'],
          Component: ManufacturingLinesOverview,
        },
        {
          id: 'ManufacturingLinesPlant',
          title: 'Assembly hall',
          note: 'Pick it for the hall supervisor: every line as a state tile, then the count against pace in a table.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/manufacturing-lines/AndonBoard.tsx', 'kit/DataTable.tsx', 'kit/SectionHeader.tsx'],
          Component: ManufacturingLinesPlant,
        },
      ],
    },
  ],
});
