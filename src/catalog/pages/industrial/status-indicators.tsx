import { Button } from '@cognite/aura/components/button';
import { IconAlertOctagon, IconAlertTriangle, IconBellRinging, IconCircleCheck, IconPlugConnectedX, IconTool } from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { Canvas } from '../../../library/kit/Canvas';
import { DataTable, type DataTableColumn } from '../../../library/kit/DataTable';
import { Grid } from '../../../library/kit/Grid';
import { ListRow } from '../../../library/kit/ListRow';
import { Meter } from '../../../library/kit/Meter';
import { Panel } from '../../../library/kit/Panel';
import { RingGauge } from '../../../library/kit/RingGauge';
import { SectionHeader } from '../../../library/kit/SectionHeader';
import { Stat } from '../../../library/kit/Stat';
import { StackLight, type StackLamp } from '../../../library/kit/status-indicators/StackLight';
import { StateGlyph } from '../../../library/kit/status-indicators/StateGlyph';
import { StateLabel } from '../../../library/kit/status-indicators/StateLabel';
import { StateMatrix, type MatrixCell } from '../../../library/kit/status-indicators/StateMatrix';
import { StateTally } from '../../../library/kit/status-indicators/StateTally';
import { StateTile } from '../../../library/kit/status-indicators/StateTile';
import { HEALTH_STATES, QUALITY_STATES, RUN_STATES, SEVERITY_STATES, tally, worst, type StateDescriptor } from '../../../library/kit/status-indicators/status';
import { StatusPill } from '../../../library/kit/StatusPill';
import { TagId } from '../../../library/kit/TagId';
import { formatNumber } from '../../../library/kit/tones';
import { LookScope } from '../../../library/looks/LookScope';
import { ALARMS, ASSETS, SENSORS, childrenOf, findAsset, type Asset } from '../../data/plant';
import { formatAgo } from '../../data/series';
import { definePage } from '../../types';

import source from './status-indicators.tsx?raw';

const STATUS_EQUIPMENT = ASSETS.filter((asset) => asset.type !== 'site' && asset.type !== 'area' && asset.type !== 'system');

const STATUS_AREAS = childrenOf('nk');

const STATUS_COMPRESSION = childrenOf('nk-23');

const STATUS_RUN_TALLY = tally(STATUS_EQUIPMENT.map((asset) => RUN_STATES[asset.state]));

const STATUS_HEALTH_TALLY = tally(STATUS_EQUIPMENT.map((asset) => HEALTH_STATES[asset.health]));

const STATUS_OPEN_ALARMS = ALARMS.filter((alarm) => alarm.state === 'active' || alarm.state === 'acknowledged');

const STATUS_SEVERITY_TALLY = tally(STATUS_OPEN_ALARMS.map((alarm) => SEVERITY_STATES[alarm.severity]));

const STATUS_RECOMPRESSOR = findAsset('23-ka-9103') ?? ASSETS[0];

const STATUS_CELLS: MatrixCell[] = STATUS_EQUIPMENT.map((asset) => ({ id: asset.id, label: asset.tag.slice(3), name: asset.name, state: RUN_STATES[asset.state] }));

const STATUS_LAMPS: StackLamp[] = [
  { id: 'tripped', label: 'Fault', tone: 'critical' },
  { id: 'maintenance', label: 'Attention', tone: 'warning' },
  { id: 'running', label: 'Running', tone: 'success' },
  { id: 'standby', label: 'Standby', tone: 'info' },
];

const STATUS_RUN_NOTES: Record<Asset['state'], string> = {
  running: 'In service and delivering',
  standby: 'Ready to start, not delivering',
  stopped: 'Out of service by choice',
  maintenance: 'Isolated for work',
  tripped: 'Stopped by a protection function',
};

const STATUS_HEALTH_NOTES: Record<Asset['health'], string> = {
  good: 'Condition score 85 or higher',
  watch: 'Score 60–84: plan an inspection',
  poor: 'Score below 60: act now',
};

const STATUS_QUALITY_NOTES = {
  good: 'The reading can be trusted',
  uncertain: 'Out of calibration, substituted or stale',
  bad: 'No valid reading: sensor or link failure',
} as const;

const STATUS_SEVERITY_NOTES = {
  critical: 'Act within minutes',
  high: 'Act within the hour',
  medium: 'Act within the shift',
  low: 'For information',
} as const;

function StatusToneIcon({ state }: { state: StateDescriptor }) {
  if (state.tone === 'critical') return <IconAlertOctagon aria-hidden="true" />;
  if (state.tone === 'warning') return <IconAlertTriangle aria-hidden="true" />;
  if (state.tone === 'neutral') return <IconPlugConnectedX aria-hidden="true" />;
  return <IconCircleCheck aria-hidden="true" />;
}

function StatusPillOf({ state, variant, size }: { state: StateDescriptor; variant?: 'filled' | 'soft' | 'outline'; size?: 'md' | 'lg' }) {
  return (
    <StatusPill tone={state.tone} variant={variant} size={size} icon={<StateGlyph shape={state.shape} tone={state.tone} size={size === 'lg' ? 12 : 10} ink />}>
      {state.label}
    </StatusPill>
  );
}

function StatusSheet({ title, subtitle, actions, footer, padding, children }: { title: string; subtitle: string; actions?: ReactNode; footer?: ReactNode; padding?: 'default' | 'none'; children: ReactNode }) {
  return (
    <Canvas>
      <Panel title={title} subtitle={subtitle} actions={actions} footer={footer} padding={padding}>
        {children}
      </Panel>
    </Canvas>
  );
}

function StatusVocabulary({ entries }: { entries: ReadonlyArray<{ state: StateDescriptor; note: string }> }) {
  return (
    <div className="flex flex-col">
      {entries.map(({ state, note }) => (
        <ListRow key={state.label} leading={<StateGlyph shape={state.shape} tone={state.tone} size={20} />} title={state.label} meta={note} trailing={<StatusPillOf state={state} />} />
      ))}
    </div>
  );
}

function StatusIndicatorRunStates() {
  return (
    <StatusSheet title="Run state" subtitle="What a machine is doing · five states, five shapes">
      <StatusVocabulary entries={(['running', 'standby', 'stopped', 'maintenance', 'tripped'] as const).map((key) => ({ state: RUN_STATES[key], note: STATUS_RUN_NOTES[key] }))} />
    </StatusSheet>
  );
}

function StatusIndicatorSeverity() {
  return (
    <StatusSheet title="Alarm severity" subtitle="How fast someone must act · four levels">
      <div className="flex h-full flex-col justify-between gap-4">
        <StatusVocabulary entries={(['critical', 'high', 'medium', 'low'] as const).map((key) => ({ state: SEVERITY_STATES[key], note: STATUS_SEVERITY_NOTES[key] }))} />
        <StateTally label="Open alarms by severity" entries={STATUS_SEVERITY_TALLY} noun="open alarms" />
      </div>
    </StatusSheet>
  );
}

function StatusIndicatorHealth() {
  return (
    <StatusSheet title="Health" subtitle="The condition of an asset · three levels">
      <StatusVocabulary entries={(['good', 'watch', 'poor'] as const).map((key) => ({ state: HEALTH_STATES[key], note: STATUS_HEALTH_NOTES[key] }))} />
    </StatusSheet>
  );
}

function StatusIndicatorQuality() {
  return (
    <StatusSheet title="Signal quality" subtitle="Whether a reading can be trusted · three levels">
      <StatusVocabulary entries={(['good', 'uncertain', 'bad'] as const).map((key) => ({ state: QUALITY_STATES[key], note: STATUS_QUALITY_NOTES[key] }))} />
    </StatusSheet>
  );
}

function StatusFormCell({ caption, hint, children }: { caption: string; hint: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex min-h-16 items-center">{children}</div>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-(--kit-text)">{caption}</span>
        <span className="text-xs text-(--kit-text-2)">{hint}</span>
      </div>
    </div>
  );
}

function StatusIndicatorForms() {
  const state = RUN_STATES.tripped;
  return (
    <StatusSheet title="One state, seven forms" subtitle="Recompressor 23-KA-9103, tripped · from the quietest form to the loudest">
      <div className="grid grid-cols-7 gap-5">
        <StatusFormCell caption="Glyph" hint="Dense grids and maps">
          <StateGlyph shape={state.shape} tone={state.tone} size={22} label="Tripped" />
        </StatusFormCell>
        <StatusFormCell caption="Glyph and word" hint="Tables and lists">
          <StateLabel state={state} />
        </StatusFormCell>
        <StatusFormCell caption="Outline pill" hint="Beside a title">
          <StatusPillOf state={state} variant="outline" />
        </StatusFormCell>
        <StatusFormCell caption="Soft pill" hint="Cards and headers">
          <StatusPillOf state={state} variant="soft" />
        </StatusFormCell>
        <StatusFormCell caption="Filled pill" hint="Needs attention">
          <StatusPillOf state={state} variant="filled" />
        </StatusFormCell>
        <StatusFormCell caption="Signal tower" hint="Machine by machine">
          <StackLight label="Recompressor" lamps={STATUS_LAMPS.slice(0, 3)} lit="tripped" hideCaption />
        </StatusFormCell>
        <StatusFormCell caption="Tile" hint="Overviews and walls">
          <StateTile className="w-full" title="Recompressor" state={state} anatomy="solid" />
        </StatusFormCell>
      </div>
    </StatusSheet>
  );
}

function StatusIndicatorSizes() {
  return (
    <StatusSheet title="Sizes" subtitle="Small in a table, medium in a list, large in a header">
      <div className="grid grid-cols-3 items-center gap-x-6 gap-y-5">
        <StateLabel size="sm" state={RUN_STATES.running} />
        <StateLabel size="md" state={RUN_STATES.running} />
        <StateLabel size="lg" state={RUN_STATES.running} />
        <StateLabel size="sm" state={RUN_STATES.maintenance} detail="WO-104479" />
        <StateLabel size="md" state={RUN_STATES.maintenance} detail="WO-104479" />
        <StateLabel size="lg" state={RUN_STATES.maintenance} detail="WO-104479" />
        <span className="text-xs text-(--kit-text-2)">Pill has no small size</span>
        <StatusPillOf state={RUN_STATES.tripped} />
        <StatusPillOf state={RUN_STATES.tripped} size="lg" />
      </div>
    </StatusSheet>
  );
}

function StatusIndicatorWithDetail() {
  return (
    <StatusSheet title="With detail and attention" subtitle="A second line says since when or why; a ring says someone must act">
      <div className="grid grid-cols-2 gap-x-8 gap-y-5">
        <StateLabel size="lg" state={RUN_STATES.tripped} detail="High vibration · 14 min ago" attention />
        <StateLabel size="lg" state={RUN_STATES.running} detail="Since 3 March, 216 h" />
        <StateLabel size="lg" state={QUALITY_STATES.bad} detail="No signal since 05:00" />
        <StateLabel size="lg" state={RUN_STATES.standby} detail="Start test overdue by 4 d" attention />
        <StateLabel size="lg" state={SEVERITY_STATES.high} detail="Acknowledged by Ingrid Haugen" coloured />
        <StateLabel size="lg" state={HEALTH_STATES.watch} detail="Score 72, down 6 this week" coloured />
      </div>
    </StatusSheet>
  );
}

function StatusIndicatorShapes() {
  const rows: Array<{ shape: StateDescriptor; means: string }> = [
    { shape: RUN_STATES.running, means: 'Normal, in service' },
    { shape: RUN_STATES.standby, means: 'Ready, idle' },
    { shape: RUN_STATES.stopped, means: 'Off' },
    { shape: RUN_STATES.maintenance, means: 'Caution' },
    { shape: RUN_STATES.tripped, means: 'Fault, act' },
    { shape: QUALITY_STATES.bad, means: 'No data' },
  ];
  return (
    <StatusSheet title="Shape carries the state" subtitle="The same glyphs in colour and in ink: still six different states" footer={<span>About one in twelve men cannot tell red from green. Shape and word must be enough.</span>}>
      <div className="grid grid-cols-6 gap-4">
        {rows.map(({ shape, means }) => (
          <div key={shape.label} className="flex flex-col items-center gap-2 text-center">
            <StateGlyph shape={shape.shape} tone={shape.tone} size={28} />
            <span className="text-(--kit-text)">
              <StateGlyph shape={shape.shape} tone={shape.tone} size={28} ink />
            </span>
            <span className="text-xs font-medium text-(--kit-text)">{means}</span>
          </div>
        ))}
      </div>
    </StatusSheet>
  );
}

function StatusIndicatorStackLights() {
  return (
    <StatusSheet title="Signal towers" subtitle="Gas compression · the position of the lit lamp says the state as much as its colour">
      <div className="grid grid-cols-5 items-start justify-items-center gap-4">
        {STATUS_COMPRESSION.map((asset) => (
          <StackLight key={asset.id} label={asset.name} lamps={STATUS_LAMPS} lit={asset.state} />
        ))}
      </div>
    </StatusSheet>
  );
}

function StatusIndicatorTally() {
  return (
    <StatusSheet title="Counts by state" subtitle="11 pieces of equipment · three ways to show a tally">
      <div className="flex flex-col gap-6">
        <StateTally label="Equipment by run state" entries={STATUS_RUN_TALLY} noun="assets" />
        <StateTally label="Equipment by run state, as chips" entries={STATUS_RUN_TALLY} layout="chips" />
        <StateTally label="Equipment by health" entries={STATUS_HEALTH_TALLY} layout="list" />
      </div>
    </StatusSheet>
  );
}

function StatusIndicatorMatrix() {
  const [selected, setSelected] = useState(STATUS_RECOMPRESSOR.id);
  const asset = findAsset(selected) ?? STATUS_RECOMPRESSOR;
  return (
    <StatusSheet title="Equipment matrix" subtitle="One cell per asset · select a cell to read it">
      <div className="flex flex-col gap-5">
        <StateMatrix label="Run state of all equipment" cells={STATUS_CELLS} columns={6} selected={selected} onSelect={setSelected} />
        <div className="flex items-center justify-between gap-4 px-4 py-3" style={{ background: 'var(--kit-well)', borderRadius: 'var(--kit-radius-sm)' }}>
          <span className="flex flex-col">
            <span className="text-sm font-semibold text-(--kit-text)">{asset.name}</span>
            <TagId>{asset.tag}</TagId>
          </span>
          <span className="flex items-center gap-4">
            <StateLabel state={HEALTH_STATES[asset.health]} detail={`Health ${asset.healthScore}`} />
            <StatusPillOf state={RUN_STATES[asset.state]} />
          </span>
        </div>
      </div>
    </StatusSheet>
  );
}

function StatusIndicatorNoSignal() {
  const sensors = SENSORS.filter((sensor) => ['pt-92531', 'tt-91141', 'tt-40015'].includes(sensor.id));
  return (
    <StatusSheet title="Quality beside a value" subtitle="Good says nothing; uncertain and bad always speak up">
      <div className="flex flex-col">
        {sensors.map((sensor) => {
          const quality = QUALITY_STATES[sensor.quality];
          return (
            <ListRow
              key={sensor.id}
              tone={sensor.quality === 'good' ? 'neutral' : quality.tone}
              title={sensor.name}
              meta={<TagId>{sensor.tag}</TagId>}
              trailing={
                <span className="flex items-center gap-4">
                  {sensor.quality === 'good' ? null : <StateLabel size="sm" state={quality} detail={sensor.quality === 'bad' ? 'Since 05:00' : 'Last calibrated 14 months ago'} />}
                  <span className="w-24 text-right text-lg font-semibold tabular-nums" style={{ color: sensor.quality === 'bad' ? 'var(--kit-text-3)' : 'var(--kit-text)' }}>
                    {sensor.quality === 'bad' ? '—' : formatNumber(sensor.value, sensor.decimals)} <span className="text-xs font-medium text-(--kit-text-3)">{sensor.unit}</span>
                  </span>
                </span>
              }
            />
          );
        })}
      </div>
    </StatusSheet>
  );
}

const STATUS_TABLE_COLUMNS: DataTableColumn<Asset>[] = [
  { id: 'tag', header: 'Tag', nowrap: true, cell: (asset) => <TagId>{asset.tag}</TagId> },
  { id: 'name', header: 'Equipment', cell: (asset) => asset.name },
  { id: 'state', header: 'Run state', cell: (asset) => <StatusPillOf state={RUN_STATES[asset.state]} /> },
  { id: 'health', header: 'Health', cell: (asset) => <StateLabel size="sm" state={HEALTH_STATES[asset.health]} /> },
  { id: 'score', header: 'Score', numeric: true, cell: (asset) => asset.healthScore },
  { id: 'criticality', header: 'Criticality', align: 'center', muted: true, cell: (asset) => asset.criticality },
];

function statusRowTone(asset: Asset) {
  const state = worst([RUN_STATES[asset.state], HEALTH_STATES[asset.health]]);
  return state && state.rank > 0 && state.tone !== 'info' ? state.tone : undefined;
}

function StatusIndicatorLookConsole() {
  return (
    <LookScope look="console">
      <Canvas>
        <Grid>
          <Panel className="col-span-8" title="Equipment" subtitle="Gas compression and export · filled blocks, edge bars" padding="none">
            <DataTable flush label="Equipment state" columns={STATUS_TABLE_COLUMNS} rows={STATUS_EQUIPMENT} rowKey={(asset) => asset.id} rowTone={statusRowTone} />
          </Panel>
          <Panel className="col-span-4" title="Compression" subtitle="NK-23" padding="tight">
            <div className="grid flex-1 grid-cols-1 gap-px">
              {STATUS_COMPRESSION.slice(0, 4).map((asset) => (
                <StateTile key={asset.id} title={asset.name} subtitle={asset.tag} state={RUN_STATES[asset.state]} />
              ))}
            </div>
          </Panel>
        </Grid>
      </Canvas>
    </LookScope>
  );
}

function StatusIndicatorLookSignal() {
  return (
    <LookScope look="signal">
      <Canvas>
        <Grid>
          {STATUS_COMPRESSION.slice(0, 4).map((asset) => (
            <StateTile
              key={asset.id}
              className="col-span-3"
              size="lg"
              title={asset.name}
              subtitle={asset.tag}
              state={RUN_STATES[asset.state]}
              icon={<StatusToneIcon state={RUN_STATES[asset.state]} />}
              detail={`Health ${asset.healthScore} · ${HEALTH_STATES[asset.health].label.toLowerCase()}`}
            />
          ))}
        </Grid>
      </Canvas>
    </LookScope>
  );
}

function StatusIndicatorLookPoster() {
  return (
    <LookScope look="poster">
      <Canvas>
        <Grid>
          <Stat className="col-span-4" size="hero" tone="green" label="Running" value={STATUS_EQUIPMENT.filter((asset) => asset.state === 'running').length} unit={`of ${STATUS_EQUIPMENT.length}`} target="1 tripped · 1 in maintenance" />
          <Panel className="col-span-8" title="Every machine, one block" subtitle="Solid means it needs you">
            <div className="flex flex-1 flex-col justify-between gap-5">
              <StateMatrix label="Run state of all equipment" cells={STATUS_CELLS} columns={6} />
              <StateTally label="Equipment by run state" entries={STATUS_RUN_TALLY} layout="chips" />
            </div>
          </Panel>
        </Grid>
      </Canvas>
    </LookScope>
  );
}

function StatusIndicatorLookBlueprint() {
  return (
    <LookScope look="blueprint">
      <Canvas>
        <Grid>
          <Panel className="col-span-7" title="Equipment schedule" subtitle="Outlined cells · state by shape">
            <StateMatrix label="Run state of all equipment" cells={STATUS_CELLS} columns={6} />
          </Panel>
          <Panel className="col-span-5" title="Key" subtitle="Symbols used on this sheet">
            <div className="grid flex-1 grid-cols-2 content-center gap-x-6 gap-y-4">
              {(['running', 'standby', 'stopped', 'maintenance', 'tripped'] as const).map((key) => (
                <StateLabel key={key} state={RUN_STATES[key]} detail={STATUS_RUN_NOTES[key]} />
              ))}
              <StateLabel state={QUALITY_STATES.bad} detail="No valid signal" />
            </div>
          </Panel>
        </Grid>
      </Canvas>
    </LookScope>
  );
}

function StatusIndicatorLookGlass() {
  return (
    <LookScope look="glass">
      <Canvas>
        <Grid>
          <Panel className="col-span-5" title="Plant state" subtitle="11 assets">
            <div className="flex flex-1 items-center justify-around gap-6">
              <RingGauge label="Running" value={(STATUS_EQUIPMENT.filter((asset) => asset.state === 'running').length / STATUS_EQUIPMENT.length) * 100} tone="success" size={128} />
              <StateTally className="min-w-44" label="Equipment by run state" entries={STATUS_RUN_TALLY} layout="list" />
            </div>
          </Panel>
          <Panel className="col-span-7" title="Signal towers" subtitle="Gas compression">
            <div className="grid flex-1 grid-cols-5 items-center justify-items-center gap-3">
              {STATUS_COMPRESSION.map((asset) => (
                <StackLight key={asset.id} label={asset.name} lamps={STATUS_LAMPS} lit={asset.state} />
              ))}
            </div>
          </Panel>
        </Grid>
      </Canvas>
    </LookScope>
  );
}

function StatusIndicatorLookSoft() {
  return (
    <LookScope look="soft">
      <Canvas>
        <Grid>
          {STATUS_AREAS.map((area) => {
            const children = childrenOf(area.id);
            return (
              <Panel key={area.id} className="col-span-3" tone={HEALTH_STATES[area.health].tone} title={area.name} subtitle={area.tag}>
                <div className="flex flex-1 flex-col justify-between gap-4">
                  <StatusPillOf state={HEALTH_STATES[area.health]} size="lg" />
                  <Meter label="Health score" value={area.healthScore} max={100} tone={HEALTH_STATES[area.health].tone} hideScale />
                  <StateTally label={`Equipment in ${area.name}`} entries={tally(children.map((asset) => RUN_STATES[asset.state]))} layout="chips" />
                </div>
              </Panel>
            );
          })}
        </Grid>
      </Canvas>
    </LookScope>
  );
}

function StatusIndicatorAssetHeader() {
  const alarm = ALARMS[0];
  return (
    <Canvas>
      <Grid>
        <Panel
          className="col-span-12"
          title={STATUS_RECOMPRESSOR.name}
          subtitle={`${STATUS_RECOMPRESSOR.tag} · Gas compression · criticality ${STATUS_RECOMPRESSOR.criticality}`}
          actions={
            <>
              <StatusPillOf state={RUN_STATES.tripped} variant="filled" size="lg" />
              <Button variant="outline" size="sm">
                <IconTool aria-hidden="true" />
                Open work order
              </Button>
            </>
          }
          footer={
            <span className="flex items-center gap-2">
              <IconBellRinging aria-hidden="true" className="size-4" />
              {alarm.message} · {alarm.value} against a {alarm.limit} limit · raised {formatAgo(alarm.raisedAt)}
            </span>
          }
        >
          <div className="grid grid-cols-4 gap-4">
            <StateTile title="Run state" state={RUN_STATES[STATUS_RECOMPRESSOR.state]} detail="Protection trip, 13:46" />
            <StateTile title="Health" state={HEALTH_STATES[STATUS_RECOMPRESSOR.health]} detail={`Score ${STATUS_RECOMPRESSOR.healthScore} of 100`} />
            <StateTile title="Signal quality" state={QUALITY_STATES.good} detail="14 of 14 signals good" />
            <StateTile title="Highest open alarm" state={SEVERITY_STATES.critical} detail="1 critical · 0 high" />
          </div>
        </Panel>
      </Grid>
    </Canvas>
  );
}

function StatusIndicatorAreaBoard() {
  return (
    <Canvas>
      <div className="flex flex-col gap-4">
        <SectionHeader title="Areas" description="The worst state of each area leads; the tally shows what is behind it." size="sm" />
        <Grid>
          {STATUS_AREAS.map((area) => {
            const children = childrenOf(area.id);
            const lead = worst(children.map((asset) => RUN_STATES[asset.state])) ?? RUN_STATES.running;
            return (
              <Panel key={area.id} className="col-span-3" title={area.name} subtitle={area.tag} actions={<StatusPillOf state={lead} />}>
                <div className="flex flex-1 flex-col justify-between gap-4">
                  <div className="flex flex-col">
                    {children.map((asset) => (
                      <ListRow key={asset.id} title={asset.name} trailing={<StateLabel size="sm" state={RUN_STATES[asset.state]} />} />
                    ))}
                  </div>
                  <StateTally label={`Equipment in ${area.name}`} entries={tally(children.map((asset) => RUN_STATES[asset.state]))} />
                </div>
              </Panel>
            );
          })}
        </Grid>
      </div>
    </Canvas>
  );
}

function StatusIndicatorEquipmentTable() {
  return (
    <Canvas>
      <Panel title="Equipment" subtitle="11 assets · run state as a pill, health as glyph and word, rows off normal get an edge" padding="none" footer={<StateTally label="Equipment by run state" entries={STATUS_RUN_TALLY} noun="assets" className="w-full" />}>
        <DataTable flush label="Equipment with run state and health" columns={STATUS_TABLE_COLUMNS} rows={STATUS_EQUIPMENT} rowKey={(asset) => asset.id} rowTone={statusRowTone} />
      </Panel>
    </Canvas>
  );
}

export default definePage({
  id: 'status-indicators',
  title: 'Status indicators',
  summary:
    'How a state is shown: run state, health, signal quality and alarm severity, each as colour, shape and a word together. From a glyph in a table cell to a pill, a signal tower, a tally, a matrix and a state-filled tile on a wall screen — and how every look draws them.',
  guidance: {
    use: [
      'Always pair the colour with a word or a distinct shape; the state must survive a greyscale print.',
      'Keep one vocabulary per meaning: run state, health, quality and severity are four different things.',
      'Let the quiet states be quiet and spend fill and weight on the states that need someone to act.',
      'Say since when, or why, in a second line when the state is not normal.',
    ],
    avoid: [
      'A lone coloured dot; it is unreadable for colour-blind users and too small to hit.',
      'Red and green for anything that is not a state, such as categories or series.',
      'Blinking or pulsing indicators; use a static ring or a filled form for attention.',
      'A quality badge on every good reading; mark only uncertain and bad.',
    ],
  },
  source,
  sections: [
    {
      id: 'vocabularies',
      title: 'State vocabularies',
      description: 'Four meanings, each with its own words, colours and shapes.',
      specimens: [
        {
          id: 'StatusIndicatorRunStates',
          title: 'Run state',
          note: 'Pick it for what a machine is doing right now: running, standby, stopped, maintenance or tripped.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/status-indicators/status.ts', 'kit/status-indicators/StateGlyph.tsx', 'kit/StatusPill.tsx', 'kit/ListRow.tsx'],
          Component: StatusIndicatorRunStates,
        },
        {
          id: 'StatusIndicatorSeverity',
          title: 'Alarm severity',
          note: 'Pick it for how fast an alarm must be handled; the tally below counts the open ones per level.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/status-indicators/status.ts', 'kit/status-indicators/StateGlyph.tsx', 'kit/status-indicators/StateTally.tsx', 'kit/StatusPill.tsx'],
          Component: StatusIndicatorSeverity,
        },
        {
          id: 'StatusIndicatorHealth',
          title: 'Health',
          note: 'Pick it for the condition of an asset over days and weeks, never for what it is doing this minute.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/status-indicators/status.ts', 'kit/status-indicators/StateGlyph.tsx', 'kit/StatusPill.tsx'],
          Component: StatusIndicatorHealth,
        },
        {
          id: 'StatusIndicatorQuality',
          title: 'Signal quality',
          note: 'Pick it for whether a reading can be trusted; bad quality is neutral grey, because it is missing data, not a fault of the process.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/status-indicators/status.ts', 'kit/status-indicators/StateGlyph.tsx', 'kit/StatusPill.tsx'],
          Component: StatusIndicatorQuality,
        },
      ],
    },
    {
      id: 'forms',
      title: 'Forms',
      description: 'The same state from the quietest form to the loudest, and the details that go with it.',
      specimens: [
        {
          id: 'StatusIndicatorForms',
          title: 'Seven forms of one state',
          note: 'Pick the quietest form that still gets noticed where it sits: glyph, glyph and word, pill, signal tower or tile.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/status-indicators/StateGlyph.tsx', 'kit/status-indicators/StateLabel.tsx', 'kit/status-indicators/StackLight.tsx', 'kit/status-indicators/StateTile.tsx', 'kit/StatusPill.tsx'],
          Component: StatusIndicatorForms,
        },
        {
          id: 'StatusIndicatorShapes',
          title: 'Shape carries the state',
          note: 'Pick shapes from the vocabulary so the state reads in monochrome and for colour-blind users.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/status-indicators/StateGlyph.tsx', 'kit/status-indicators/status.ts'],
          Component: StatusIndicatorShapes,
        },
        {
          id: 'StatusIndicatorSizes',
          title: 'Sizes',
          note: 'Pick small for table cells, medium for lists and large for the header of an asset.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/status-indicators/StateLabel.tsx', 'kit/StatusPill.tsx'],
          Component: StatusIndicatorSizes,
        },
        {
          id: 'StatusIndicatorWithDetail',
          title: 'With detail and attention',
          note: 'Pick the second line whenever the state is not normal, and the ring only when someone has to act.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/status-indicators/StateLabel.tsx', 'kit/status-indicators/status.ts'],
          Component: StatusIndicatorWithDetail,
        },
        {
          id: 'StatusIndicatorNoSignal',
          title: 'Quality beside a value',
          note: 'Pick it next to live readings: good stays silent, uncertain is flagged, and a bad value is replaced by a dash.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/status-indicators/StateLabel.tsx', 'kit/ListRow.tsx', 'kit/TagId.tsx'],
          Component: StatusIndicatorNoSignal,
        },
        {
          id: 'StatusIndicatorStackLights',
          title: 'Signal towers',
          note: 'Pick it for a row of machines, where operators already know the tower on the shop floor.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/status-indicators/StackLight.tsx'],
          Component: StatusIndicatorStackLights,
        },
      ],
    },
    {
      id: 'many',
      title: 'Many states at once',
      description: 'Counting and scanning: tallies and a matrix.',
      specimens: [
        {
          id: 'StatusIndicatorTally',
          title: 'Counts by state',
          note: 'Pick the strip for proportions, the chips for a header and the list when the counts are compared.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/status-indicators/StateTally.tsx', 'kit/status-indicators/status.ts'],
          Component: StatusIndicatorTally,
        },
        {
          id: 'StatusIndicatorMatrix',
          title: 'Equipment matrix',
          note: 'Pick it to scan dozens of assets for the few that are off normal, then select one to read it.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/status-indicators/StateMatrix.tsx', 'kit/status-indicators/StateLabel.tsx', 'kit/StatusPill.tsx', 'kit/TagId.tsx'],
          Component: StatusIndicatorMatrix,
        },
      ],
    },
    {
      id: 'looks',
      title: 'The same states in six looks',
      description: 'Blocks and edge bars, filled tiles, outlines, glowing lamps and tinted cards.',
      specimens: [
        {
          id: 'StatusIndicatorLookConsole',
          title: 'Console: filled blocks and edge bars',
          note: 'Pick it for a control room: square filled pills in a dense table and edge-striped tiles for the train.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/status-indicators/StateTile.tsx', 'kit/status-indicators/StateLabel.tsx', 'kit/DataTable.tsx', 'kit/StatusPill.tsx', 'looks/LookScope.tsx'],
          Component: StatusIndicatorLookConsole,
        },
        {
          id: 'StatusIndicatorLookSignal',
          title: 'Signal: state-filled tiles',
          note: 'Pick it for a wall screen: the whole tile is the state, with a giant word and icon.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/status-indicators/StateTile.tsx', 'looks/LookScope.tsx'],
          Component: StatusIndicatorLookSignal,
        },
        {
          id: 'StatusIndicatorLookPoster',
          title: 'Poster: one count and solid blocks',
          note: 'Pick it for a team screen: a huge count, and every machine as a block that is solid only when it needs you.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/status-indicators/StateMatrix.tsx', 'kit/status-indicators/StateTally.tsx', 'kit/Stat.tsx', 'looks/LookScope.tsx'],
          Component: StatusIndicatorLookPoster,
        },
        {
          id: 'StatusIndicatorLookBlueprint',
          title: 'Blueprint: outlined cells and a key',
          note: 'Pick it for drawings and documents: one ink, outlined cells, and a key that explains every symbol.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/status-indicators/StateMatrix.tsx', 'kit/status-indicators/StateLabel.tsx', 'looks/LookScope.tsx'],
          Component: StatusIndicatorLookBlueprint,
        },
        {
          id: 'StatusIndicatorLookGlass',
          title: 'Glass: glowing lamps and a ring',
          note: 'Pick it for a dark showcase: lit lamps glow, and one ring says how much of the plant is running.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/status-indicators/StackLight.tsx', 'kit/status-indicators/StateTally.tsx', 'kit/RingGauge.tsx', 'looks/LookScope.tsx'],
          Component: StatusIndicatorLookGlass,
        },
        {
          id: 'StatusIndicatorLookSoft',
          title: 'Soft: tinted area cards',
          note: 'Pick it for a friendly overview: each area is a card tinted with its health, with a large pill and chips.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/status-indicators/StateTally.tsx', 'kit/Meter.tsx', 'kit/Panel.tsx', 'kit/StatusPill.tsx', 'looks/LookScope.tsx'],
          Component: StatusIndicatorLookSoft,
        },
      ],
    },
    {
      id: 'in-use',
      title: 'In use',
      description: 'Compositions ready to drop into a product.',
      specimens: [
        {
          id: 'StatusIndicatorAssetHeader',
          title: 'Asset status header',
          note: 'Pick it as the top of an asset page: the four vocabularies side by side, the alarm that explains them, and the next action.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/status-indicators/StateTile.tsx', 'kit/status-indicators/status.ts', 'kit/Panel.tsx', 'kit/StatusPill.tsx'],
          Component: StatusIndicatorAssetHeader,
        },
        {
          id: 'StatusIndicatorAreaBoard',
          title: 'Area board',
          note: 'Pick it as a plant overview: one card per area led by its worst state, with the equipment and a tally behind it.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/status-indicators/StateLabel.tsx', 'kit/status-indicators/StateTally.tsx', 'kit/status-indicators/status.ts', 'kit/Panel.tsx', 'kit/ListRow.tsx'],
          Component: StatusIndicatorAreaBoard,
        },
        {
          id: 'StatusIndicatorEquipmentTable',
          title: 'Equipment table',
          note: 'Pick it for a full equipment list: the loud form for run state, the quiet one for health, and an edge on rows off normal.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/status-indicators/StateLabel.tsx', 'kit/status-indicators/StateTally.tsx', 'kit/DataTable.tsx', 'kit/StatusPill.tsx', 'kit/TagId.tsx'],
          Component: StatusIndicatorEquipmentTable,
        },
      ],
    },
  ],
});
