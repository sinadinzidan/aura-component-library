import { SegmentedControl, SegmentedControlButton, SegmentedControlList } from '@cognite/aura/components/segmented-control';
import { IconAlertOctagon, IconAlertTriangle, IconCircleCheck, IconPlayerPause, IconPlugConnectedX, IconShieldCheck } from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { Bars } from '../../../library/kit/Bars';
import { Canvas } from '../../../library/kit/Canvas';
import { DataTable, type DataTableColumn } from '../../../library/kit/DataTable';
import { Donut } from '../../../library/kit/Donut';
import { Grid } from '../../../library/kit/Grid';
import { ListRow } from '../../../library/kit/ListRow';
import { Meter } from '../../../library/kit/Meter';
import { Panel } from '../../../library/kit/Panel';
import { RingGauge } from '../../../library/kit/RingGauge';
import { SectionHeader } from '../../../library/kit/SectionHeader';
import { Stat } from '../../../library/kit/Stat';
import { StatGroup } from '../../../library/kit/StatGroup';
import { StatusPill } from '../../../library/kit/StatusPill';
import { TagId } from '../../../library/kit/TagId';
import type { Tone } from '../../../library/kit/tones';
import { TrendArea } from '../../../library/kit/TrendArea';
import { TrendLine } from '../../../library/kit/TrendLine';
import { AndonBoard, type AndonStation } from '../../../library/kit/wall-displays/AndonBoard';
import { BigFigure } from '../../../library/kit/wall-displays/BigFigure';
import { HourBoard, type HourRow } from '../../../library/kit/wall-displays/HourBoard';
import { SafetyCalendar, type SafetyDayState } from '../../../library/kit/wall-displays/SafetyCalendar';
import { Ticker, type TickerItem } from '../../../library/kit/wall-displays/Ticker';
import { WallScreen } from '../../../library/kit/wall-displays/WallScreen';
import { LookScope } from '../../../library/looks/LookScope';
import { ALARMS, PLANT_KPIS, childrenOf, type Alarm, type Asset } from '../../data/plant';
import { HOUR, REFERENCE_NOW, formatAgo, formatTime, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './wall-displays.tsx?raw';

const WALL_AREAS = childrenOf('nk');

const WALL_HEALTH_TONE: Record<Asset['health'], Tone> = { good: 'success', watch: 'warning', poor: 'critical' };

const WALL_HEALTH_WORD: Record<Asset['health'], string> = { good: 'Normal', watch: 'Watch', poor: 'Act now' };

const WALL_SEVERITY_TONE: Record<Alarm['severity'], Tone> = { critical: 'critical', high: 'warning', medium: 'info', low: 'neutral' };

const WALL_SEVERITY_WORD: Record<Alarm['severity'], string> = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' };

const WALL_OPEN_ALARMS = ALARMS.filter((alarm) => alarm.state === 'active' || alarm.state === 'acknowledged');

const WALL_TOP_ALARMS = WALL_OPEN_ALARMS.slice(0, 4);

const WALL_EXPORT = makeValues({ seed: 31, points: 24, base: 4.4, amplitude: 0.1, noise: 0.03, drift: -0.04, decimals: 2 });

const WALL_TIMES = Array.from({ length: 24 }, (_, index) => formatTime(REFERENCE_NOW - (23 - index) * HOUR));

const WALL_STATIONS: readonly AndonStation[] = [
  { id: 'st1', code: 'ST 1', name: 'Depalletiser', state: 'Running', tone: 'success', detail: '1,296 in' },
  { id: 'st2', code: 'ST 2', name: 'Rinser', state: 'Running', tone: 'success', detail: '1,291 through' },
  { id: 'st3', code: 'ST 3', name: 'Filler', state: 'Blocked', tone: 'critical', detail: 'Jam at infeed · 6 min' },
  { id: 'st4', code: 'ST 4', name: 'Capper', state: 'Starved', tone: 'warning', detail: 'Waiting for filler' },
  { id: 'st5', code: 'ST 5', name: 'Labeller', state: 'Running', tone: 'success', detail: '1,284 through' },
  { id: 'st6', code: 'ST 6', name: 'Palletiser', state: 'Help called', tone: 'info', detail: 'Film roll change' },
];

const WALL_HOUR_ROWS: readonly HourRow[] = [
  { hour: '06–07', plan: 180, actual: 184 },
  { hour: '07–08', plan: 180, actual: 181 },
  { hour: '08–09', plan: 180, actual: 142, note: 'Label reel change overran' },
  { hour: '09–10', plan: 150, actual: 153, note: 'Break 09:30' },
  { hour: '10–11', plan: 180, actual: 186 },
  { hour: '11–12', plan: 180, actual: 179 },
  { hour: '12–13', plan: 180, actual: 104, note: 'Filler jam, running' },
  { hour: '13–14', plan: 180, actual: null },
];

const WALL_MADE = WALL_HOUR_ROWS.reduce((sum, row) => sum + (row.actual ?? 0), 0);

const WALL_SAFETY_DAYS: readonly SafetyDayState[] = Array.from({ length: 31 }, (_, index) => (index === 3 ? 'near-miss' : index < 12 ? 'safe' : 'ahead'));

const WALL_TICKER: readonly TickerItem[] = [
  { id: 'lift', kind: 'Safety', text: 'Crane lift over module 23 at 15:00, deck closed', tone: 'warning' },
  { id: 'visit', kind: 'Visit', text: 'Authority inspection Friday 09:00', tone: 'info' },
  { id: 'weather', kind: 'Weather', text: 'Wind 14 m/s from north-west, easing tonight' },
];

function WallAlarmIcon({ severity }: { severity: Alarm['severity'] }) {
  if (severity === 'critical') return <IconAlertOctagon aria-hidden="true" />;
  return <IconAlertTriangle aria-hidden="true" />;
}

function WallStateIcon({ tone }: { tone: Tone }) {
  if (tone === 'critical') return <IconAlertOctagon aria-hidden="true" />;
  if (tone === 'warning') return <IconAlertTriangle aria-hidden="true" />;
  if (tone === 'neutral') return <IconPlugConnectedX aria-hidden="true" />;
  return <IconCircleCheck aria-hidden="true" />;
}

function WallAlarmRows({ alarms = WALL_TOP_ALARMS }: { alarms?: readonly Alarm[] }) {
  return (
    <ul className="flex flex-1 flex-col justify-between gap-3">
      {alarms.map((alarm) => (
        <li key={alarm.id} data-tone={WALL_SEVERITY_TONE[alarm.severity]} className="flex items-center gap-5 rounded-(--kit-radius-sm) bg-(--t-soft) px-5 py-4 text-(--t-on-soft)">
          <StatusPill tone={WALL_SEVERITY_TONE[alarm.severity]} variant="filled" size="lg" icon={<WallAlarmIcon severity={alarm.severity} />}>
            {WALL_SEVERITY_WORD[alarm.severity]}
          </StatusPill>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-2xl leading-8 font-semibold text-(--kit-text)">{alarm.message}</span>
            <span className="text-base text-(--kit-text-2)">
              <TagId>{alarm.sensorTag}</TagId> · {alarm.value} against {alarm.limit}
            </span>
          </div>
          <span className="shrink-0 text-2xl leading-8 font-semibold whitespace-nowrap text-(--kit-text) tabular-nums">{formatAgo(alarm.raisedAt)}</span>
        </li>
      ))}
    </ul>
  );
}

function WallExportFigure({ size }: { size?: 'lg' | 'xl' }) {
  return (
    <BigFigure
      label="Gas export"
      value={PLANT_KPIS.gasExport.value}
      decimals={2}
      unit="MSm³/d"
      state="Behind plan"
      stateIcon={<IconAlertTriangle aria-hidden="true" />}
      tone="warning"
      reference="Plan 4.50 · 97 % of plan"
      progress={PLANT_KPIS.gasExport.value / PLANT_KPIS.gasExport.target}
      size={size}
    />
  );
}

function WallPlantPill() {
  return (
    <StatusPill tone="warning" size="lg" variant="filled" icon={<IconAlertTriangle aria-hidden="true" />}>
      Reduced capacity
    </StatusPill>
  );
}

function WallAreaTiles({ size = 'lg' }: { size?: 'md' | 'lg' }) {
  return (
    <>
      {WALL_AREAS.map((area) => (
        <Stat
          key={area.id}
          size={size}
          tone={WALL_HEALTH_TONE[area.health]}
          label={area.name}
          state={WALL_HEALTH_WORD[area.health]}
          stateIcon={<WallStateIcon tone={WALL_HEALTH_TONE[area.health]} />}
          value={area.healthScore}
          unit="health"
          target={`${WALL_HEALTH_WORD[area.health]} · ${area.health === 'watch' ? '4 open alarms' : 'no open alarms'}`}
        />
      ))}
    </>
  );
}

function WallExportTrend({ height = 300 }: { height?: number }) {
  return (
    <TrendArea
      label="Gas export over the last 24 hours against the daily plan"
      series={[{ id: 'export', label: 'Gas export', values: WALL_EXPORT }]}
      labels={WALL_TIMES}
      unit="MSm³/d"
      decimals={2}
      limits={[{ value: PLANT_KPIS.gasExport.target, label: 'Plan', tone: 'warning' }]}
      height={height}
    />
  );
}

function WallDisplayFigures() {
  return (
    <Canvas>
      <div className="grid grid-cols-3 gap-4">
        <WallExportFigure />
        <BigFigure label="Availability" value={PLANT_KPIS.availability.value} decimals={1} unit="%" state="Under target" stateIcon={<IconAlertTriangle aria-hidden="true" />} tone="warning" reference="Target 97.5 · 1.1 short" progress={PLANT_KPIS.availability.value / 100} />
        <BigFigure label="Days without incident" value={PLANT_KPIS.daysSinceIncident.value} state="Keep it up" stateIcon={<IconShieldCheck aria-hidden="true" />} tone="success" reference="Site record 365" progress={PLANT_KPIS.daysSinceIncident.value / 365} />
      </div>
    </Canvas>
  );
}

function WallDisplayFigureStates() {
  return (
    <LookScope look="signal">
      <Canvas>
        <div className="grid grid-cols-4 gap-3">
          <BigFigure label="Line 1 output" value={1412} unit="units" state="On plan" stateIcon={<IconCircleCheck aria-hidden="true" />} tone="success" reference="Plan 1,410" />
          <BigFigure label="Line 2 output" value={WALL_MADE} unit="units" state="Behind" stateIcon={<IconAlertTriangle aria-hidden="true" />} tone="warning" reference="Plan 1,230" />
          <BigFigure label="Line 3 output" value={612} unit="units" state="Stopped" stateIcon={<IconAlertOctagon aria-hidden="true" />} tone="critical" reference="Down 42 min" />
          <BigFigure label="Line 4 output" value={null} unit="units" state="No data" stateIcon={<IconPlugConnectedX aria-hidden="true" />} tone="neutral" reference="Counter offline since 11:20" />
        </div>
      </Canvas>
    </LookScope>
  );
}

function WallDisplayHero() {
  return (
    <Canvas>
      <BigFigure size="xl" label="Units this shift" value={WALL_MADE} state="Behind plan" stateIcon={<IconAlertTriangle aria-hidden="true" />} tone="warning" reference="Plan so far 1,230 · 101 behind" progress={WALL_MADE / 1410} />
    </Canvas>
  );
}

const WALL_DISTANCES = [
  { distance: '3 m', place: 'Team board', size: '1.5rem', px: '24 px' },
  { distance: '6 m', place: 'Control room wall', size: '3rem', px: '48 px' },
  { distance: '10 m', place: 'Workshop', size: '4.5rem', px: '72 px' },
  { distance: '15 m', place: 'Production hall', size: '6.5rem', px: '104 px' },
];

function WallDisplayDistance() {
  return (
    <Canvas>
      <Panel title="Size for the distance" subtitle="Figure height for a 55-inch screen, by how far the reader stands" footer={<span>Rule of thumb: 8 px of numeral height per metre, labels at half the figure.</span>}>
        <ul className="flex flex-col">
          {WALL_DISTANCES.map((row) => (
            <li key={row.distance} className="flex items-end gap-6 py-3 [&:not(:last-child)]:[border-bottom:1px_solid_var(--kit-rule)]">
              <div className="flex w-36 shrink-0 flex-col pb-1">
                <span className="text-lg leading-6 font-semibold text-(--kit-text)">{row.distance}</span>
                <span className="text-sm text-(--kit-text-2)">{row.place}</span>
              </div>
              <span className="flex-1 font-semibold text-(--kit-text) tabular-nums" style={{ fontSize: row.size, lineHeight: 1, letterSpacing: '-0.03em' }}>
                4.38
              </span>
              <span className="pb-1 text-sm font-medium text-(--kit-text-2) tabular-nums">{row.px}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </Canvas>
  );
}

function WallDisplayAndon() {
  const [selected, setSelected] = useState('st3');
  const station = WALL_STATIONS.find((candidate) => candidate.id === selected) ?? WALL_STATIONS[2];
  return (
    <Canvas>
      <Panel
        title="Packaging line 2"
        subtitle="Six stations in line order · select one for its detail"
        actions={
          <StatusPill tone="critical" size="lg" icon={<IconAlertOctagon aria-hidden="true" />}>
            Line stopped 6 min
          </StatusPill>
        }
        footer={
          <span>
            <strong className="font-semibold text-(--kit-text)">
              {station.code} {station.name}:
            </strong>{' '}
            {station.state.toLowerCase()}. {station.detail}.
          </span>
        }
      >
        <AndonBoard label="Packaging line 2 andon" stations={WALL_STATIONS} selected={selected} onSelect={setSelected} />
      </Panel>
    </Canvas>
  );
}

function WallDisplayHourBoard() {
  return (
    <Canvas>
      <Panel title="Hour by hour" subtitle="Packaging line 2 · day shift" actions={<StatusPill tone="warning">101 behind</StatusPill>}>
        <HourBoard label="Packaging line 2, plan and actual per hour" rows={WALL_HOUR_ROWS} current="12–13" />
      </Panel>
    </Canvas>
  );
}

function WallDisplaySafetyCalendar() {
  return (
    <Canvas>
      <Panel title="Safety calendar" subtitle="March 2026 · Nordkapp plant" footer={<span>One near miss on 4 March: dropped tool on the compressor deck, no injury.</span>}>
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-3 gap-4">
            <Stat variant="plain" size="lg" tone="success" label="Days without incident" value={PLANT_KPIS.daysSinceIncident.value} />
            <Stat variant="plain" size="lg" label="Near misses, month" value={1} />
            <Stat variant="plain" size="lg" label="Observations, month" value={37} />
          </div>
          <SafetyCalendar label="March 2026" days={WALL_SAFETY_DAYS} offset={6} />
        </div>
      </Panel>
    </Canvas>
  );
}

function WallDisplayAlarmWall() {
  return (
    <Canvas>
      <Panel title="Open alarms" subtitle="Most severe first · four rows, never a scrolling list" actions={<StatusPill tone="critical" size="lg">{`${WALL_OPEN_ALARMS.length} open`}</StatusPill>}>
        <WallAlarmRows />
      </Panel>
    </Canvas>
  );
}

function WallDisplayAreaTiles() {
  return (
    <LookScope look="signal">
      <Canvas>
        <div className="grid grid-cols-2 gap-3">
          <WallAreaTiles size="md" />
        </div>
      </Canvas>
    </LookScope>
  );
}

function WallDisplayTrend() {
  return (
    <Canvas>
      <Panel title="Gas export" subtitle="Last 24 hours against the plan" actions={<StatusPill tone="warning">3 % under plan</StatusPill>}>
        <WallExportTrend height={292} />
      </Panel>
    </Canvas>
  );
}

function WallDisplayChrome() {
  return (
    <Canvas>
      <WallScreen site="Nordkapp · control room 1" title="Plant status" clock="14:00" meta="Thursday 12 March · day shift" status={<WallPlantPill />} footer={<Ticker label="Site messages" items={WALL_TICKER} trailing="Updated 14:00:05" />}>
        <div className="grid grid-cols-3 gap-4">
          <WallExportFigure />
          <BigFigure label="Open alarms" value={WALL_OPEN_ALARMS.length} state="1 critical" stateIcon={<IconAlertOctagon aria-hidden="true" />} tone="critical" reference="7 at this time yesterday" />
          <BigFigure label="Flaring" value={PLANT_KPIS.flaring.value} decimals={1} unit="kSm³/d" state="Inside limit" stateIcon={<IconCircleCheck aria-hidden="true" />} tone="success" reference="Limit 15.0" progress={PLANT_KPIS.flaring.value / 15} />
        </div>
      </WallScreen>
    </Canvas>
  );
}

const WALL_ROTATION = [
  { id: 'status', label: 'Status' },
  { id: 'alarms', label: 'Alarms' },
  { id: 'export', label: 'Export' },
];

function WallDisplayRotation() {
  const [screen, setScreen] = useState('status');
  const index = WALL_ROTATION.findIndex((entry) => entry.id === screen);
  return (
    <Canvas>
      <WallScreen
        site="Nordkapp · workshop"
        title={`Screen ${index + 1} of ${WALL_ROTATION.length}`}
        clock="14:00"
        status={
          <SegmentedControl value={screen} onValueChange={(next) => setScreen(String(next))}>
            <SegmentedControlList aria-label="Screen in rotation">
              {WALL_ROTATION.map((entry) => (
                <SegmentedControlButton key={entry.id} value={entry.id}>
                  {entry.label}
                </SegmentedControlButton>
              ))}
            </SegmentedControlList>
          </SegmentedControl>
        }
        meta="Rotates every 30 s"
        footer={
          <div aria-hidden="true" className="flex gap-1.5 px-6 py-3">
            {WALL_ROTATION.map((entry, position) => (
              <span key={entry.id} className="h-1.5 flex-1 rounded-full" style={{ background: position <= index ? 'var(--kit-accent)' : 'var(--kit-track)' }} />
            ))}
          </div>
        }
      >
        {screen === 'status' ? (
          <div className="grid grid-cols-4 gap-4">
            <WallAreaTiles size="md" />
          </div>
        ) : null}
        {screen === 'alarms' ? <WallAlarmRows alarms={WALL_TOP_ALARMS.slice(0, 3)} /> : null}
        {screen === 'export' ? (
          <Panel title="Gas export" subtitle="Last 24 hours against the plan">
            <WallExportTrend height={236} />
          </Panel>
        ) : null}
      </WallScreen>
    </Canvas>
  );
}

function WallDisplayLookSignal() {
  return (
    <LookScope look="signal">
      <WallScreen site="Nordkapp · control room 1" title="Plant status" clock="14:00" meta="Day shift" status={<WallPlantPill />}>
        <Grid columns={4}>
          <WallAreaTiles />
          <div className="col-span-4 grid grid-cols-3 gap-(--kit-gap)">
            <WallExportFigure />
            <BigFigure label="Open alarms" value={WALL_OPEN_ALARMS.length} state="1 critical" stateIcon={<IconAlertOctagon aria-hidden="true" />} tone="critical" reference="Recompressor tripped 14 min ago" />
            <BigFigure label="Days without incident" value={PLANT_KPIS.daysSinceIncident.value} state="Safe" stateIcon={<IconShieldCheck aria-hidden="true" />} tone="success" reference="Site record 365" />
          </div>
        </Grid>
      </WallScreen>
    </LookScope>
  );
}

const WALL_ALARM_COLUMNS: DataTableColumn<Alarm>[] = [
  { id: 'severity', header: 'Priority', nowrap: true, cell: (alarm) => <StatusPill tone={WALL_SEVERITY_TONE[alarm.severity]}>{WALL_SEVERITY_WORD[alarm.severity]}</StatusPill> },
  { id: 'message', header: 'Alarm', cell: (alarm) => alarm.message },
  { id: 'tag', header: 'Tag', nowrap: true, cell: (alarm) => <TagId>{alarm.sensorTag}</TagId> },
  { id: 'value', header: 'Value', numeric: true, nowrap: true, cell: (alarm) => alarm.value },
  { id: 'age', header: 'Raised', numeric: true, nowrap: true, cell: (alarm) => formatAgo(alarm.raisedAt) },
];

function WallDisplayLookConsole() {
  return (
    <LookScope look="console">
      <WallScreen site="Nordkapp · control room 1" title="Plant status" clock="14:00" meta="Day shift · I. Haugen" status={<WallPlantPill />} padding="none" footer={<Ticker label="Site messages" items={WALL_TICKER.slice(0, 2)} trailing="Updated 14:00:05" />}>
        <Grid>
          <StatGroup columns={5} label="Plant KPIs" className="col-span-12">
            <Stat variant="plain" size="lg" tone="warning" label="Gas export" value={PLANT_KPIS.gasExport.value} decimals={2} unit="MSm³/d" target="Plan 4.50" />
            <Stat variant="plain" size="lg" tone="warning" label="Availability" value={PLANT_KPIS.availability.value} decimals={1} unit="%" target="Target 97.5" />
            <Stat variant="plain" size="lg" label="OEE" value={PLANT_KPIS.oee.value} decimals={1} unit="%" target="Target 85.0" />
            <Stat variant="plain" size="lg" tone="success" label="Flaring" value={PLANT_KPIS.flaring.value} decimals={1} unit="kSm³/d" target="Limit 15.0" />
            <Stat variant="plain" size="lg" tone="critical" label="Open alarms" value={WALL_OPEN_ALARMS.length} target="1 critical · 2 high" />
          </StatGroup>
          <Panel className="col-span-7" title="Alarms" subtitle="Open, most severe first" padding="none">
            <DataTable label="Open alarms" columns={WALL_ALARM_COLUMNS} rows={WALL_OPEN_ALARMS} rowKey={(alarm) => alarm.id} rowTone={(alarm) => WALL_SEVERITY_TONE[alarm.severity]} density="default" flush />
          </Panel>
          <Panel className="col-span-5" title="Gas export" subtitle="MSm³/d · 24 h · plan 4.50">
            <WallExportTrend height={200} />
          </Panel>
        </Grid>
      </WallScreen>
    </LookScope>
  );
}

function WallDisplayLookPoster() {
  return (
    <LookScope look="poster">
      <WallScreen site="Packaging hall" title="Line 2" clock="12:40" meta="Day shift" status={<StatusPill tone="critical" size="lg" icon={<IconPlayerPause aria-hidden="true" />}>Stopped 6 min</StatusPill>}>
        <Grid>
          <BigFigure className="col-span-5" size="xl" label="Units this shift" value={WALL_MADE} state="Behind" stateIcon={<IconAlertTriangle aria-hidden="true" />} tone="amber" reference="Plan so far 1,230 · 101 behind" progress={WALL_MADE / 1410} />
          <Panel className="col-span-7" title="Units per hour" subtitle="Against a plan of 180">
            <Bars
              label="Units per hour on line 2 against the hourly plan"
              categories={WALL_HOUR_ROWS.filter((row) => row.actual !== null).map((row) => row.hour)}
              series={[{ id: 'actual', label: 'Actual', values: WALL_HOUR_ROWS.flatMap((row) => (row.actual === null ? [] : [row.actual])) }]}
              tones={WALL_HOUR_ROWS.flatMap((row) => (row.actual === null ? [] : [row.actual >= row.plan ? 'success' : 'critical']))}
              showValues
              limit={{ value: 180, label: 'Plan', tone: 'neutral' }}
              height={250}
            />
          </Panel>
          <div className="col-span-12">
            <AndonBoard label="Line 2 andon, poster" stations={WALL_STATIONS} />
          </div>
        </Grid>
      </WallScreen>
    </LookScope>
  );
}

function WallDisplayLookGlass() {
  return (
    <LookScope look="glass">
      <WallScreen site="Nordkapp · visitor centre" title="The plant right now" clock="14:00" meta="Thursday 12 March">
        <Grid>
          <Panel className="col-span-7" title="Gas export" subtitle="MSm³ per day, last 24 hours">
            <WallExportTrend height={260} />
          </Panel>
          <Panel className="col-span-5" title="Area health" subtitle="Condition score out of 100">
            <div className="grid flex-1 grid-cols-2 items-center justify-items-center gap-5">
              {WALL_AREAS.map((area) => (
                <RingGauge key={area.id} label={area.name} value={area.healthScore} unit="" tone={WALL_HEALTH_TONE[area.health]} size={124} />
              ))}
            </div>
          </Panel>
          <div className="col-span-12 grid grid-cols-3 gap-(--kit-gap)">
            <WallExportFigure />
            <BigFigure label="Energy intensity" value={PLANT_KPIS.energyIntensity.value} decimals={1} unit="kWh/boe" state="Improving" stateIcon={<IconCircleCheck aria-hidden="true" />} tone="success" reference="32.6 last week · target 30.0" />
            <BigFigure label="Days without incident" value={PLANT_KPIS.daysSinceIncident.value} state="Safe" stateIcon={<IconShieldCheck aria-hidden="true" />} tone="success" reference="Site record 365" progress={PLANT_KPIS.daysSinceIncident.value / 365} />
          </div>
        </Grid>
      </WallScreen>
    </LookScope>
  );
}

function WallDisplayShiftBoard() {
  return (
    <Canvas>
      <WallScreen
        site="Packaging hall · line 2"
        title="Shift board"
        clock="12:40"
        meta="Day shift · team B"
        status={
          <StatusPill tone="critical" size="lg" variant="filled" icon={<IconPlayerPause aria-hidden="true" />}>
            Stopped 6 min
          </StatusPill>
        }
        footer={<Ticker label="Line messages" items={[{ id: 'jam', kind: 'Now', text: 'Filler jam at infeed, technician on the way', tone: 'critical' }, { id: 'change', kind: 'Next', text: 'Changeover to 0.5 l at 13:30', tone: 'info' }]} trailing="Updated 12:40" />}
      >
        <Grid>
          <BigFigure className="col-span-4" label="Units this shift" value={WALL_MADE} state="Behind plan" stateIcon={<IconAlertTriangle aria-hidden="true" />} tone="warning" reference="Plan so far 1,230 · 101 behind" progress={WALL_MADE / 1410} />
          <BigFigure className="col-span-4" label="OEE" value={78.4} decimals={1} unit="%" state="Under target" stateIcon={<IconAlertTriangle aria-hidden="true" />} tone="warning" reference="Target 85.0" progress={0.784} />
          <BigFigure className="col-span-4" label="Scrap" value={0.8} decimals={1} unit="%" state="On target" stateIcon={<IconCircleCheck aria-hidden="true" />} tone="success" reference="Limit 1.5" progress={0.8 / 1.5} />
          <Panel className="col-span-7" title="Hour by hour" subtitle="Plan, actual and the reason for a miss">
            <HourBoard label="Line 2 hour by hour" rows={WALL_HOUR_ROWS} current="12–13" />
          </Panel>
          <Panel className="col-span-5" title="Stations" subtitle="In line order">
            <AndonBoard className="flex-1" label="Line 2 stations" stations={WALL_STATIONS} columns={2} />
          </Panel>
        </Grid>
      </WallScreen>
    </Canvas>
  );
}

function WallDisplayLobby() {
  return (
    <LookScope look="soft">
      <WallScreen site="Nordkapp · main entrance" title="Welcome. Work safely today." clock="14:00" meta="Thursday 12 March">
        <Grid>
          <BigFigure className="col-span-5" size="xl" label="Days without incident" value={PLANT_KPIS.daysSinceIncident.value} state="Keep it up" stateIcon={<IconShieldCheck aria-hidden="true" />} tone="green" reference="147 days to the site record" progress={PLANT_KPIS.daysSinceIncident.value / 365} />
          <Panel className="col-span-7" title="March so far" subtitle="Every day marked by what happened">
            <SafetyCalendar label="March 2026, lobby" days={WALL_SAFETY_DAYS} offset={6} />
          </Panel>
          <Panel className="col-span-7" title="Today on site" subtitle="What to know before you go out">
            <ul className="flex flex-1 flex-col justify-between">
              <ListRow tone="warning" leading={<StatusPill tone="warning" size="lg">15:00</StatusPill>} title="Crane lift over module 23" meta="Compressor deck closed from 14:45 to 16:00." />
              <ListRow tone="info" leading={<StatusPill tone="info" size="lg">All day</StatusPill>} title="Hot work in the workshop" meta="Permit 2026-0412, fire watch posted." />
              <ListRow leading={<StatusPill tone="neutral" size="lg">16:30</StatusPill>} title="Muster drill, station B" meta="Everyone on site takes part." />
            </ul>
          </Panel>
          <Panel className="col-span-5" title="Safety observations" subtitle="Reported this month, by kind">
            <div className="flex flex-1 items-center justify-center">
              <Donut
                label="Safety observations this month by kind"
                segments={[
                  { label: 'Good practice', value: 21, tone: 'green' },
                  { label: 'Unsafe condition', value: 11, tone: 'amber' },
                  { label: 'Unsafe act', value: 4, tone: 'pink' },
                  { label: 'Near miss', value: 1, tone: 'purple' },
                ]}
                centerCaption="reports"
                size={168}
              />
            </div>
          </Panel>
        </Grid>
      </WallScreen>
    </LookScope>
  );
}

const WALL_LOSSES = [
  { id: 'jam', cause: 'Filler jams', minutes: 74 },
  { id: 'reel', cause: 'Label reel changes', minutes: 41 },
  { id: 'change', cause: 'Changeover overrun', minutes: 28 },
  { id: 'wait', cause: 'Waiting for pallets', minutes: 17 },
];

const WALL_ACTIONS: readonly { id: string; action: string; owner: string; due: string; state: string; tone: Tone }[] = [
  { id: 'a1', action: 'Replace worn infeed guide on the filler', owner: 'Tomás Barros', due: 'Today', state: 'In progress', tone: 'info' },
  { id: 'a2', action: 'Pre-stage label reels at the labeller', owner: 'Liv Wold', due: 'Fri 13 Mar', state: 'Open', tone: 'neutral' },
  { id: 'a3', action: 'Review the 0.5 l changeover checklist', owner: 'Magnus Solberg', due: 'Mon 16 Mar', state: 'Late', tone: 'critical' },
];

const WALL_ACTION_COLUMNS: DataTableColumn<(typeof WALL_ACTIONS)[number]>[] = [
  { id: 'action', header: 'Action', cell: (row) => row.action },
  { id: 'owner', header: 'Owner', nowrap: true, cell: (row) => row.owner },
  { id: 'due', header: 'Due', nowrap: true, cell: (row) => row.due },
  { id: 'state', header: 'State', nowrap: true, cell: (row) => <StatusPill tone={row.tone}>{row.state}</StatusPill> },
];

function WallDisplayMorningMeeting(): ReactNode {
  return (
    <LookScope look="editorial">
      <Canvas>
        <Grid>
          <SectionHeader className="col-span-12" size="lg" eyebrow="Line 2 morning meeting · Thursday 12 March, 07:45" title="Yesterday we made 2,712 of 2,880. Filler jams cost most of the gap." />
          <StatGroup columns={4} label="Yesterday" className="col-span-12">
            <Stat variant="plain" size="lg" label="Units made" value={2712} delta={{ value: -168, decimals: 0, caption: 'against plan' }} />
            <Stat variant="plain" size="lg" label="OEE" value={79.6} decimals={1} unit="%" delta={{ value: -5.4, caption: 'against target' }} />
            <Stat variant="plain" size="lg" label="Stops" value={14} delta={{ value: 3, decimals: 0, good: 'down', caption: 'on the day before' }} />
            <Stat variant="plain" size="lg" label="Scrap" value={0.9} decimals={1} unit="%" delta={{ value: -0.2, good: 'down', caption: 'on the day before' }} />
          </StatGroup>
          <Panel className="col-span-7" title="Output by day against the plan" subtitle="Units per day this week, both shifts.">
            <Bars label="Units per day this week against the daily plan" categories={['Mon', 'Tue', 'Wed']} series={[{ id: 'made', label: 'Made', values: [2861, 2894, 2712] }]} showValues limit={{ value: 2880, label: 'Plan', tone: 'neutral' }} height={250} />
          </Panel>
          <Panel className="col-span-5" title="Where the time went" subtitle="Minutes lost yesterday, by cause.">
            <div className="flex flex-1 flex-col justify-between gap-4">
              {WALL_LOSSES.map((loss) => (
                <Meter key={loss.id} label={loss.cause} value={loss.minutes} max={80} unit="min" hideScale tone={loss.minutes > 60 ? 'critical' : 'accent'} />
              ))}
            </div>
          </Panel>
          <Panel className="col-span-12" title="Actions" subtitle="Agreed at the board, reviewed every morning." padding="none">
            <DataTable label="Morning meeting actions" columns={WALL_ACTION_COLUMNS} rows={WALL_ACTIONS} rowKey={(row) => row.id} flush />
          </Panel>
        </Grid>
      </Canvas>
    </LookScope>
  );
}

function WallDisplayExportLine() {
  return (
    <LookScope look="blueprint">
      <Canvas>
        <Grid>
          <Panel className="col-span-8" title="Export against plan" subtitle="Sheet W-04 · every hour marked">
            <TrendLine
              label="Gas export per hour drawn against the plan"
              series={[{ id: 'export', label: 'Gas export', values: WALL_EXPORT }]}
              labels={WALL_TIMES}
              unit="MSm³/d"
              decimals={2}
              limits={[{ value: PLANT_KPIS.gasExport.target, label: 'Plan', tone: 'warning' }]}
              height={280}
            />
          </Panel>
          <div className="col-span-4 flex flex-col gap-(--kit-gap)">
            <WallExportFigure />
            <BigFigure label="Open alarms" value={WALL_OPEN_ALARMS.length} state="1 critical" stateIcon={<IconAlertOctagon aria-hidden="true" />} tone="critical" reference="7 at this time yesterday" />
          </div>
        </Grid>
      </Canvas>
    </LookScope>
  );
}

export default definePage({
  id: 'wall-displays',
  title: 'Wall displays',
  summary:
    'Large-format screens read from across a room: giant figures with a state word, andon and hour-by-hour boards, alarm walls and safety calendars, in looks from status-filled signal tiles to a poster production board.',
  guidance: {
    use: [
      'Size numerals for the distance: about 8 px of height per metre between the wall and the reader.',
      'Put the state in words and an icon next to every figure; a colour alone does not carry across a hall.',
      'Keep each screen to one question and rotate screens rather than shrinking content.',
      'Show the time and when the data was last updated, so a frozen screen is obvious.',
    ],
    avoid: [
      'Scrolling tickers and long lists: nobody can scroll a wall.',
      'Controls that need a mouse, hover or a tooltip to make sense.',
      'More than about seven figures per screen.',
      'Low-contrast greys and thin type: they vanish at ten metres.',
    ],
  },
  source,
  sections: [
    {
      id: 'figures',
      title: 'Figures for distance',
      description: 'One number, its unit and its state, large enough to read from the far wall.',
      specimens: [
        {
          id: 'WallDisplayFigures',
          title: 'Figure row',
          note: 'Pick it for the three numbers a room agrees to watch all day.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/wall-displays/BigFigure.tsx'],
          Component: WallDisplayFigures,
        },
        {
          id: 'WallDisplayFigureStates',
          title: 'State-filled figures',
          note: 'Pick it when the state matters more than the number: on plan, behind, stopped or no data.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['looks/LookScope.tsx', 'kit/wall-displays/BigFigure.tsx'],
          Component: WallDisplayFigureStates,
        },
        {
          id: 'WallDisplayHero',
          title: 'Single hero figure',
          note: 'Pick it for a screen at the end of a hall that answers one question.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/wall-displays/BigFigure.tsx'],
          Component: WallDisplayHero,
        },
        {
          id: 'WallDisplayDistance',
          title: 'Size for the distance',
          note: 'Pick it as the reference when deciding how large a figure must be for where the screen hangs.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/Panel.tsx'],
          Component: WallDisplayDistance,
        },
      ],
    },
    {
      id: 'boards',
      title: 'Boards',
      description: 'The fixed-position boards of a shop floor and a control room.',
      specimens: [
        {
          id: 'WallDisplayAndon',
          title: 'Andon board',
          note: 'Pick it to show which station of a line is stopping the others.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/wall-displays/AndonBoard.tsx', 'kit/StatusPill.tsx'],
          Component: WallDisplayAndon,
        },
        {
          id: 'WallDisplayHourBoard',
          title: 'Hour-by-hour board',
          note: 'Pick it for a team that reviews plan against actual every hour and writes down why it missed.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/wall-displays/HourBoard.tsx'],
          Component: WallDisplayHourBoard,
        },
        {
          id: 'WallDisplaySafetyCalendar',
          title: 'Safety calendar',
          note: 'Pick it for the entrance or the canteen: the month at a glance and the days since the last incident.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/wall-displays/SafetyCalendar.tsx', 'kit/Stat.tsx'],
          Component: WallDisplaySafetyCalendar,
        },
        {
          id: 'WallDisplayAlarmWall',
          title: 'Alarm wall',
          note: 'Pick it for the top open alarms in a control room, limited to what fits without scrolling.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/StatusPill.tsx', 'kit/TagId.tsx', 'kit/Panel.tsx'],
          Component: WallDisplayAlarmWall,
        },
        {
          id: 'WallDisplayAreaTiles',
          title: 'Area state tiles',
          note: 'Pick it for a plant map in four words: each area is its state.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['looks/LookScope.tsx', 'kit/Stat.tsx'],
          Component: WallDisplayAreaTiles,
        },
        {
          id: 'WallDisplayTrend',
          title: 'Trend for a wall',
          note: 'Pick it when the shape of the day matters: one series, one plan line, the current value called out.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/TrendArea.tsx'],
          Component: WallDisplayTrend,
        },
      ],
    },
    {
      id: 'screens',
      title: 'Screen chrome',
      description: 'What frames the content: where, what, the time, messages and rotation.',
      specimens: [
        {
          id: 'WallDisplayChrome',
          title: 'Header and message strip',
          note: 'Pick it as the frame of every wall screen: site, title, plant state, clock and a strip of whole messages.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/wall-displays/WallScreen.tsx', 'kit/wall-displays/Ticker.tsx', 'kit/wall-displays/BigFigure.tsx'],
          Component: WallDisplayChrome,
        },
        {
          id: 'WallDisplayRotation',
          title: 'Rotating screens',
          note: 'Pick it when one display must cover several questions: one screen at a time with a visible position.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/wall-displays/WallScreen.tsx', 'kit/Stat.tsx', 'kit/TrendArea.tsx'],
          Component: WallDisplayRotation,
        },
      ],
    },
    {
      id: 'looks',
      title: 'The same wall in five looks',
      description: 'A look changes what a wall screen is made of: state-filled tiles, hairline strips, solid blocks, glass or a drawing.',
      specimens: [
        {
          id: 'WallDisplayLookSignal',
          title: 'Signal: every tile is its state',
          note: 'Pick it for the control-room wall, where the answer to "is anything wrong" must be instant.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['looks/LookScope.tsx', 'kit/wall-displays/WallScreen.tsx', 'kit/wall-displays/BigFigure.tsx', 'kit/Stat.tsx'],
          Component: WallDisplayLookSignal,
        },
        {
          id: 'WallDisplayLookConsole',
          title: 'Console: strips, table and trend',
          note: 'Pick it for operators who also read the wall for detail: dense, ruled and edge to edge.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['looks/LookScope.tsx', 'kit/wall-displays/WallScreen.tsx', 'kit/wall-displays/Ticker.tsx', 'kit/DataTable.tsx', 'kit/StatGroup.tsx', 'kit/TrendArea.tsx'],
          Component: WallDisplayLookConsole,
        },
        {
          id: 'WallDisplayLookPoster',
          title: 'Poster: production board in blocks',
          note: 'Pick it for a production hall: one huge count, bars per hour and the line in solid blocks.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['looks/LookScope.tsx', 'kit/wall-displays/WallScreen.tsx', 'kit/wall-displays/BigFigure.tsx', 'kit/wall-displays/AndonBoard.tsx', 'kit/Bars.tsx'],
          Component: WallDisplayLookPoster,
        },
        {
          id: 'WallDisplayLookGlass',
          title: 'Glass: visitor-centre display',
          note: 'Pick it where the screen also has to impress: a glowing trend, rings and calm figures.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['looks/LookScope.tsx', 'kit/wall-displays/WallScreen.tsx', 'kit/wall-displays/BigFigure.tsx', 'kit/RingGauge.tsx', 'kit/TrendArea.tsx'],
          Component: WallDisplayLookGlass,
        },
        {
          id: 'WallDisplayExportLine',
          title: 'Blueprint: drawn trend and outlined figures',
          note: 'Pick it for an engineering office wall, where precision reads better than colour.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['looks/LookScope.tsx', 'kit/wall-displays/BigFigure.tsx', 'kit/TrendLine.tsx'],
          Component: WallDisplayExportLine,
        },
      ],
    },
    {
      id: 'in-use',
      title: 'In use',
      description: 'Whole screens that could go on a wall tomorrow.',
      specimens: [
        {
          id: 'WallDisplayShiftBoard',
          title: 'Line shift board',
          note: 'Pick it as the screen at the head of a production line: count, OEE, the hours and the stations.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/wall-displays/WallScreen.tsx', 'kit/wall-displays/BigFigure.tsx', 'kit/wall-displays/HourBoard.tsx', 'kit/wall-displays/AndonBoard.tsx', 'kit/wall-displays/Ticker.tsx'],
          Component: WallDisplayShiftBoard,
        },
        {
          id: 'WallDisplayLobby',
          title: 'Entrance safety screen',
          note: 'Pick it for the gate or the lobby: days without incident, the month and what is happening on site today.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['looks/LookScope.tsx', 'kit/wall-displays/WallScreen.tsx', 'kit/wall-displays/BigFigure.tsx', 'kit/wall-displays/SafetyCalendar.tsx', 'kit/Donut.tsx', 'kit/ListRow.tsx'],
          Component: WallDisplayLobby,
        },
        {
          id: 'WallDisplayMorningMeeting',
          title: 'Morning meeting board',
          note: 'Pick it for the stand-up at the line: yesterday in one sentence, the losses and the agreed actions.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['looks/LookScope.tsx', 'kit/StatGroup.tsx', 'kit/Bars.tsx', 'kit/Meter.tsx', 'kit/DataTable.tsx', 'kit/SectionHeader.tsx'],
          Component: WallDisplayMorningMeeting,
        },
      ],
    },
  ],
});
