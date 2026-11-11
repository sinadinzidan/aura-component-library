import { IconAlertOctagon, IconAlertTriangle, IconCircleCheck, IconListDetails, IconTopologyStar3 } from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { Canvas } from '../../../library/kit/Canvas';
import { DataTable, type DataTableColumn } from '../../../library/kit/DataTable';
import { InstrumentBubble } from '../../../library/kit/equipment-symbols/InstrumentBubble';
import { SymbolGlyph } from '../../../library/kit/equipment-symbols/SymbolGlyph';
import { SYMBOLS, symbolsIn, type SymbolCategory, type SymbolKind } from '../../../library/kit/equipment-symbols/symbols';
import { SymbolTile } from '../../../library/kit/equipment-symbols/SymbolTile';
import { SymbolTrain, type TrainNode } from '../../../library/kit/equipment-symbols/SymbolTrain';
import { Grid } from '../../../library/kit/Grid';
import { IconChip } from '../../../library/kit/IconChip';
import { Legend } from '../../../library/kit/Legend';
import { Meter } from '../../../library/kit/Meter';
import { Panel } from '../../../library/kit/Panel';
import { Stat } from '../../../library/kit/Stat';
import { StatGroup } from '../../../library/kit/StatGroup';
import { StatusPill } from '../../../library/kit/StatusPill';
import { TagId } from '../../../library/kit/TagId';
import type { Tone } from '../../../library/kit/tones';
import { LookScope } from '../../../library/looks/LookScope';
import { ASSETS, sensorsOf, type Asset, type RunState } from '../../data/plant';
import { definePage } from '../../types';

import source from './equipment-symbols.tsx?raw';

const SYM_STATE_TONE: Record<RunState, Tone> = { running: 'success', standby: 'info', stopped: 'neutral', tripped: 'critical', maintenance: 'warning' };

const SYM_STATE_LABEL: Record<RunState, string> = { running: 'Running', standby: 'Standby', stopped: 'Stopped', tripped: 'Tripped', maintenance: 'Maintenance' };

const SYM_STATES: readonly RunState[] = ['running', 'standby', 'stopped', 'tripped', 'maintenance'];

const SYM_KIND: Partial<Record<Asset['type'], SymbolKind>> = {
  compressor: 'compressor',
  pump: 'centrifugal-pump',
  separator: 'horizontal-separator',
  exchanger: 'heat-exchanger',
  valve: 'shutdown-valve',
  turbine: 'gas-turbine',
};

const SYM_UNITS = ASSETS.filter((asset) => SYM_KIND[asset.type] !== undefined);

const SYM_CATEGORIES: readonly { id: SymbolCategory; title: string }[] = [
  { id: 'rotating', title: 'Rotating' },
  { id: 'static', title: 'Static' },
  { id: 'valve', title: 'Valves' },
];

const SYM_TRAIN: readonly TrainNode[] = [
  { id: '20-va-1001', kind: 'horizontal-separator', tag: '20-VA-1001', name: 'Inlet separator', tone: 'success', value: '54.3 %', outLabel: '13.1 barg' },
  { id: '23-ka-9101', kind: 'compressor', tag: '23-KA-9101', name: '1st stage', tone: 'warning', state: 'Watch', value: '6.8 mm/s', outLabel: '48.6 barg' },
  { id: '23-ha-9114', kind: 'heat-exchanger', tag: '23-HA-9114', name: 'Interstage cooler', tone: 'warning', state: 'Watch', value: '38.9 °C', outLabel: '38.9 °C' },
  { id: '23-ka-9102', kind: 'compressor', tag: '23-KA-9102', name: '2nd stage', tone: 'success', value: '4.1 mm/s', outLabel: '112 barg' },
  { id: '27-xv-2005', kind: 'shutdown-valve', tag: '27-XV-2005', name: 'Export valve', tone: 'success', value: 'Open', outLabel: '4.38 MSm³/d' },
  { id: '27-pa-2001a', kind: 'centrifugal-pump', tag: '27-PA-2001A', name: 'Export pump A', tone: 'success', value: '412 m³/h' },
];

const SYM_TRAIN_COMPACT: readonly TrainNode[] = SYM_TRAIN.map((node) => ({ ...node, outLabel: undefined }));

function symKind(asset: Asset): SymbolKind {
  return SYM_KIND[asset.type] ?? 'vertical-vessel';
}

function symReading(asset: Asset): string | undefined {
  const sensor = sensorsOf(asset.id)[0];
  return sensor && sensor.quality !== 'bad' ? `${sensor.value.toLocaleString('en-GB')} ${sensor.unit}` : undefined;
}

function SymStateIcon({ state }: { state: RunState }) {
  if (state === 'tripped') return <IconAlertOctagon aria-hidden="true" />;
  if (state === 'maintenance') return <IconAlertTriangle aria-hidden="true" />;
  return <IconCircleCheck aria-hidden="true" />;
}

function SymSheet({ title, subtitle, actions, footer, children }: { title: string; subtitle: string; actions?: ReactNode; footer?: ReactNode; children: ReactNode }) {
  return (
    <Canvas>
      <Panel title={title} subtitle={subtitle} actions={actions} footer={footer}>
        {children}
      </Panel>
    </Canvas>
  );
}

function SymLegendCell({ kind, size = 44 }: { kind: SymbolKind; size?: number }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <SymbolGlyph kind={kind} label={null} size={size} />
      <span className="text-xs leading-4 font-medium text-(--kit-text-2)">{SYMBOLS[kind].label}</span>
    </div>
  );
}

function SymUnitTile({ asset, selected, onSelect, size }: { asset: Asset; selected?: boolean; onSelect?: () => void; size?: number }) {
  return (
    <SymbolTile
      kind={symKind(asset)}
      name={asset.name}
      tag={asset.tag}
      state={SYM_STATE_LABEL[asset.state]}
      tone={SYM_STATE_TONE[asset.state]}
      value={symReading(asset)}
      dashed={asset.state === 'maintenance'}
      fault={asset.state === 'tripped'}
      selected={selected}
      onSelect={onSelect}
      size={size}
    />
  );
}

function SymbolsProcessSet() {
  return (
    <SymSheet title="Process symbols" subtitle="One 24-unit grid, one stroke weight · read left to right" actions={<StatusPill tone="neutral">{`${SYM_CATEGORIES.reduce((sum, category) => sum + symbolsIn(category.id).length, 0)} symbols`}</StatusPill>}>
      <div className="flex flex-col gap-6">
        {SYM_CATEGORIES.map((category) => (
          <div key={category.id} className="grid grid-cols-[6rem_minmax(0,1fr)] items-start gap-4">
            <span className="pt-3 text-sm font-semibold text-(--kit-text)">{category.title}</span>
            <div className="grid grid-cols-8 gap-x-2 gap-y-5">
              {symbolsIn(category.id).map((kind) => (
                <SymLegendCell key={kind} kind={kind} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </SymSheet>
  );
}

function SymbolsElectricalSet() {
  return (
    <SymSheet title="Electrical symbols" subtitle="Read top to bottom, for single-line diagrams">
      <div className="grid grid-cols-4 gap-x-2 gap-y-5">
        {symbolsIn('electrical').map((kind) => (
          <SymLegendCell key={kind} kind={kind} />
        ))}
      </div>
    </SymSheet>
  );
}

function SymbolsSizes() {
  return (
    <SymSheet title="Sizes" subtitle="The stroke keeps its weight; only the drawing grows" footer={<span>24 in a table row · 40 in a list · 64 in a diagram · 112 as the picture of a card</span>}>
      <div className="flex items-end justify-around gap-4">
        {[24, 40, 64, 112].map((size) => (
          <div key={size} className="flex flex-col items-center gap-2">
            <SymbolGlyph kind="compressor" label={`Compressor at ${size} pixels`} size={size} tone="blue" />
            <span className="text-xs font-medium text-(--kit-text-3) tabular-nums">{size} px</span>
          </div>
        ))}
      </div>
    </SymSheet>
  );
}

function SymbolsInstrumentBubbles() {
  return (
    <SymSheet title="Instrument bubbles" subtitle="Function letters over the loop number; the frame tells where it is mounted">
      <div className="grid grid-cols-3 gap-x-4 gap-y-5">
        <div className="flex flex-col items-center gap-2 text-center">
          <InstrumentBubble letters="PT" loop="92531" />
          <span className="text-xs font-medium text-(--kit-text-2)">In the field</span>
        </div>
        <div className="flex flex-col items-center gap-2 text-center">
          <InstrumentBubble letters="PI" loop="92531" mounting="panel" />
          <span className="text-xs font-medium text-(--kit-text-2)">On the panel</span>
        </div>
        <div className="flex flex-col items-center gap-2 text-center">
          <InstrumentBubble letters="PIC" loop="92531" mounting="dcs" />
          <span className="text-xs font-medium text-(--kit-text-2)">In the control system</span>
        </div>
        <div className="flex flex-col items-center gap-2 text-center">
          <InstrumentBubble letters="TT" loop="92532" tone="success" />
          <StatusPill tone="success">Normal</StatusPill>
        </div>
        <div className="flex flex-col items-center gap-2 text-center">
          <InstrumentBubble letters="TAH" loop="92532" tone="warning" />
          <StatusPill tone="warning">High alarm</StatusPill>
        </div>
        <div className="flex flex-col items-center gap-2 text-center">
          <InstrumentBubble letters="VSHH" loop="92740" mounting="dcs" tone="critical" />
          <StatusPill tone="critical">Trip</StatusPill>
        </div>
      </div>
    </SymSheet>
  );
}

function SymbolsRunStates() {
  return (
    <SymSheet title="Run states" subtitle="The same compressor in each state: colour, fill and a word together">
      <div className="grid grid-cols-5 gap-3">
        {SYM_STATES.map((state) => (
          <SymbolTile
            key={state}
            kind="compressor"
            name="Recompressor"
            tag="23-KA-9103"
            state={SYM_STATE_LABEL[state]}
            tone={SYM_STATE_TONE[state]}
            dashed={state === 'maintenance'}
            fault={state === 'tripped'}
            size={64}
          />
        ))}
      </div>
    </SymSheet>
  );
}

function SymbolsValvePositions() {
  return (
    <SymSheet title="Valve positions" subtitle="20-XV-1105 · open is hollow, closed is solid, and a fault is marked">
      <div className="grid grid-cols-4 justify-items-center gap-3">
        <div className="flex flex-col items-center gap-2">
          <SymbolGlyph kind="shutdown-valve" label="Shutdown valve, open" size={64} tone="success" fill="none" />
          <StatusPill tone="success">Open</StatusPill>
        </div>
        <div className="flex flex-col items-center gap-2">
          <SymbolGlyph kind="shutdown-valve" label="Shutdown valve, closed" size={64} tone="neutral" fill="solid" />
          <StatusPill tone="neutral">Closed</StatusPill>
        </div>
        <div className="flex flex-col items-center gap-2">
          <SymbolGlyph kind="shutdown-valve" label="Shutdown valve, in travel" size={64} tone="info" fill="soft" dashed />
          <StatusPill tone="info">In travel</StatusPill>
        </div>
        <div className="flex flex-col items-center gap-2">
          <SymbolGlyph kind="shutdown-valve" label="Shutdown valve, failed to close" size={64} tone="critical" fill="soft" fault />
          <StatusPill tone="critical" icon={<IconAlertOctagon aria-hidden="true" />}>
            Failed to close
          </StatusPill>
        </div>
      </div>
    </SymSheet>
  );
}

function SymbolsWithReadings() {
  return (
    <SymSheet title="With tag, reading and state" subtitle="What a symbol needs around it to be read without the diagram">
      <div className="grid grid-cols-2 gap-3">
        {SYM_UNITS.filter((asset) => ['23-ka-9101', '20-va-1001', '27-pa-2001a', '23-ha-9114'].includes(asset.id)).map((asset) => (
          <SymUnitTile key={asset.id} asset={asset} />
        ))}
      </div>
    </SymSheet>
  );
}

function SymbolsSelectable() {
  const [selected, setSelected] = useState('23-ka-9103');
  const asset = SYM_UNITS.find((unit) => unit.id === selected) ?? SYM_UNITS[0];
  return (
    <SymSheet
      title="Hover and select"
      subtitle="Gas compression · select a unit"
      footer={
        <span>
          Selected: <TagId>{asset.tag}</TagId> {asset.name}, health {asset.healthScore} of 100, criticality {asset.criticality}.
        </span>
      }
    >
      <div className="grid grid-cols-3 gap-3">
        {SYM_UNITS.filter((unit) => unit.parentId === 'nk-23')
          .slice(0, 3)
          .map((unit) => (
            <SymUnitTile key={unit.id} asset={unit} selected={unit.id === selected} onSelect={() => setSelected(unit.id)} />
          ))}
      </div>
    </SymSheet>
  );
}

function SymbolsLookConsole() {
  return (
    <LookScope look="console">
      <Canvas>
        <Grid>
          <Panel className="col-span-8" title="Compression train" subtitle="Solid state fills on a dark ground">
            <SymbolTrain label="Gas compression train" nodes={SYM_TRAIN_COMPACT} selectedId="23-ka-9101" size={52} />
          </Panel>
          <Panel className="col-span-4" title="Units" subtitle="State edge and word">
            <div className="flex flex-1 flex-col justify-between gap-1">
              {SYM_UNITS.filter((unit) => unit.parentId === 'nk-23')
                .slice(0, 3)
                .map((unit) => (
                  <SymUnitTile key={unit.id} asset={unit} size={32} />
                ))}
            </div>
          </Panel>
        </Grid>
      </Canvas>
    </LookScope>
  );
}

function SymbolsLookBlueprint() {
  return (
    <LookScope look="blueprint">
      <Canvas>
        <Grid>
          <Panel className="col-span-8" title="Compression train, simplified" subtitle="Drawing NK-23-PFD-001 · line only">
            <SymbolTrain label="Gas compression train" nodes={SYM_TRAIN_COMPACT.map((node) => ({ ...node, tone: 'neutral', state: undefined }))} size={56} />
          </Panel>
          <Panel className="col-span-4" title="Instruments" subtitle="23-KA-9101">
            <div className="grid flex-1 grid-cols-3 items-center justify-items-center gap-3">
              <InstrumentBubble letters="PT" loop="92531" />
              <InstrumentBubble letters="TT" loop="92532" />
              <InstrumentBubble letters="VT" loop="92540" />
              <InstrumentBubble letters="PIC" loop="92531" mounting="dcs" />
              <InstrumentBubble letters="TAH" loop="92532" mounting="panel" />
              <InstrumentBubble letters="ST" loop="92501" />
            </div>
          </Panel>
        </Grid>
      </Canvas>
    </LookScope>
  );
}

function SymbolsLookPoster() {
  return (
    <LookScope look="poster">
      <Canvas>
        <Grid>
          {SYM_UNITS.filter((unit) => ['23-ka-9101', '23-ka-9103', '27-pa-2001b', '40-pa-4001'].includes(unit.id)).map((unit) => (
            <div key={unit.id} className="col-span-3 flex">
              <SymbolTile className="flex-1" kind={symKind(unit)} name={unit.name} tag={unit.tag} state={SYM_STATE_LABEL[unit.state]} tone={SYM_STATE_TONE[unit.state]} fault={unit.state === 'tripped'} size={88} />
            </div>
          ))}
        </Grid>
      </Canvas>
    </LookScope>
  );
}

function SymbolsLookGlass() {
  return (
    <LookScope look="glass">
      <Canvas>
        <Grid>
          <Panel className="col-span-12" title="Gas path" subtitle="Inlet to export · glowing state on a dark backdrop" actions={<StatusPill tone="warning">2 at watch</StatusPill>}>
            <SymbolTrain label="Gas path from inlet to export" nodes={SYM_TRAIN} selectedId="23-ha-9114" size={64} />
          </Panel>
        </Grid>
      </Canvas>
    </LookScope>
  );
}

function SymbolsLookSignal() {
  return (
    <LookScope look="signal">
      <Canvas>
        <div className="grid grid-cols-5 gap-(--kit-gap)">
          {SYM_UNITS.filter((unit) => unit.parentId === 'nk-23' || unit.parentId === 'nk-27')
            .slice(0, 5)
            .map((unit) => (
              <SymbolTile key={unit.id} kind={symKind(unit)} name={unit.name} tag={unit.tag} state={SYM_STATE_LABEL[unit.state]} tone={SYM_STATE_TONE[unit.state]} fault={unit.state === 'tripped'} size={72} />
            ))}
        </div>
      </Canvas>
    </LookScope>
  );
}

function SymbolsLookSoft() {
  return (
    <LookScope look="soft">
      <Canvas>
        <Grid>
          <Panel className="col-span-12" tone="teal" title="Export pumps and separators" subtitle="Rounded strokes and tinted grounds">
            <div className="grid grid-cols-4 gap-3">
              {SYM_UNITS.filter((unit) => unit.type === 'pump' || unit.type === 'separator')
                .slice(0, 4)
                .map((unit) => (
                  <SymUnitTile key={unit.id} asset={unit} size={56} />
                ))}
            </div>
          </Panel>
        </Grid>
      </Canvas>
    </LookScope>
  );
}

function SymbolsUseTrain() {
  const [selected, setSelected] = useState('23-ka-9101');
  const node = SYM_TRAIN.find((item) => item.id === selected) ?? SYM_TRAIN[0];
  const asset = ASSETS.find((item) => item.id === node.id);
  const sensors = sensorsOf(node.id).slice(0, 3);
  return (
    <Canvas>
      <Grid>
        <Panel
          className="col-span-8"
          icon={
            <IconChip tone="blue">
              <IconTopologyStar3 />
            </IconChip>
          }
          title="Gas compression train"
          subtitle="Inlet to export · select a unit"
          actions={<StatusPill tone="warning">Reduced capacity</StatusPill>}
          footer={
            <Legend
              items={[
                { label: 'Running', tone: 'success' },
                { label: 'Watch', tone: 'warning' },
                { label: 'Tripped', tone: 'critical' },
              ]}
            />
          }
        >
          <SymbolTrain label="Gas compression train" nodes={SYM_TRAIN_COMPACT} selectedId={selected} onSelect={setSelected} size={56} />
        </Panel>
        <Panel className="col-span-4" title={asset?.name ?? node.name} subtitle={node.tag} actions={<StatusPill tone={node.tone ?? 'neutral'}>{node.state ?? 'Running'}</StatusPill>}>
          <div className="flex flex-1 flex-col justify-between gap-4">
            <StatGroup columns={2} joined label="Unit figures">
              <Stat variant="plain" size="sm" label="Health" value={asset?.healthScore ?? 90} unit="/ 100" />
              <Stat variant="plain" size="sm" label="Criticality" value={asset?.criticality ?? 'B'} />
            </StatGroup>
            {sensors.length > 0 ? (
              sensors.map((sensor) => (
                <Meter key={sensor.id} label={sensor.name} value={sensor.value} min={sensor.rangeMin} max={sensor.rangeMax} unit={sensor.unit} decimals={sensor.decimals} high={sensor.highLimit} hideScale />
              ))
            ) : (
              <p className="text-sm text-(--kit-text-2)">No instruments are mapped to this unit yet. Readings appear here once its tags are linked.</p>
            )}
          </div>
        </Panel>
      </Grid>
    </Canvas>
  );
}

function SymbolsUseLegend() {
  return (
    <SymSheet title="Diagram legend" subtitle="Ships with every diagram: what the shapes and the colours mean">
      <div className="grid grid-cols-2 gap-6">
        <ul className="flex flex-col gap-3">
          {(['compressor', 'centrifugal-pump', 'heat-exchanger', 'horizontal-separator', 'shutdown-valve'] satisfies SymbolKind[]).map((kind) => (
            <li key={kind} className="flex items-center gap-3">
              <SymbolGlyph kind={kind} label={null} size={32} />
              <span className="text-sm text-(--kit-text)">{SYMBOLS[kind].label}</span>
            </li>
          ))}
        </ul>
        <ul className="flex flex-col gap-3">
          {SYM_STATES.map((state) => (
            <li key={state} className="flex items-center gap-3">
              <SymbolGlyph kind="motor" label={null} size={32} tone={SYM_STATE_TONE[state]} dashed={state === 'maintenance'} fault={state === 'tripped'} />
              <span className="text-sm text-(--kit-text)">{SYM_STATE_LABEL[state]}</span>
            </li>
          ))}
        </ul>
      </div>
    </SymSheet>
  );
}

const SYM_COLUMNS: readonly DataTableColumn<Asset>[] = [
  { id: 'symbol', header: 'Symbol', width: 'w-20', cell: (asset) => <SymbolGlyph kind={symKind(asset)} label={SYMBOLS[symKind(asset)].label} size={28} tone={SYM_STATE_TONE[asset.state]} dashed={asset.state === 'maintenance'} /> },
  { id: 'tag', header: 'Tag', nowrap: true, cell: (asset) => <TagId>{asset.tag}</TagId> },
  { id: 'name', header: 'Equipment', cell: (asset) => asset.name },
  { id: 'reading', header: 'Reading', numeric: true, nowrap: true, cell: (asset) => symReading(asset) ?? 'No signal' },
  { id: 'health', header: 'Health', numeric: true, cell: (asset) => `${asset.healthScore} / 100` },
  {
    id: 'state',
    header: 'State',
    cell: (asset) => (
      <StatusPill tone={SYM_STATE_TONE[asset.state]} icon={<SymStateIcon state={asset.state} />}>
        {SYM_STATE_LABEL[asset.state]}
      </StatusPill>
    ),
  },
];

function SymbolsUseEquipmentList() {
  return (
    <Canvas>
      <Panel
        padding="none"
        icon={
          <IconChip tone="purple">
            <IconListDetails />
          </IconChip>
        }
        title="Equipment list"
        subtitle={`${SYM_UNITS.length} units · the symbol in the row matches the one in the diagram`}
      >
        <DataTable
          flush
          label="Equipment list"
          columns={SYM_COLUMNS}
          rows={SYM_UNITS.slice(0, 8)}
          rowKey={(asset) => asset.id}
          rowTone={(asset) => (asset.state === 'tripped' || asset.state === 'maintenance' ? SYM_STATE_TONE[asset.state] : undefined)}
        />
      </Panel>
    </Canvas>
  );
}

export default definePage({
  id: 'equipment-symbols',
  title: 'Equipment symbols',
  summary:
    'The glyphs process and electrical diagrams are built from: pumps, compressors, vessels, valves, instruments and electrical gear on one grid, with states, tags and readings, joined into trains, and redrawn by each look.',
  guidance: {
    use: [
      'Use the same symbol for the same equipment type everywhere: diagram, legend, list and card.',
      'Show state with colour, fill and a word together; a dashed outline means out of service.',
      'Put the tag next to every symbol that stands for a real asset.',
      'Let the look decide the stroke and fill; pass only the kind and the state.',
    ],
    avoid: [
      'Recolouring symbols to tell equipment types apart; shape does that, colour is state.',
      'Symbols smaller than 24 px, where valves and pumps start to look alike.',
      'Mixing process symbols, which read left to right, with electrical ones in one train.',
      'A symbol as the only sign of an alarm; pair it with the state word.',
    ],
  },
  source,
  sections: [
    {
      id: 'set',
      title: 'The set',
      description: 'Every symbol on the same 24-unit grid, so they line up in a legend and scale together.',
      specimens: [
        {
          id: 'SymbolsProcessSet',
          title: 'Process symbols',
          note: 'Pick from this sheet for process flow and P&ID-style diagrams; rotating, static and valves.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/equipment-symbols/SymbolGlyph.tsx', 'kit/equipment-symbols/symbols.ts', 'kit/Panel.tsx'],
          Component: SymbolsProcessSet,
        },
        {
          id: 'SymbolsElectricalSet',
          title: 'Electrical symbols',
          note: 'Pick these for single-line diagrams and power overviews; they connect top to bottom.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/equipment-symbols/SymbolGlyph.tsx', 'kit/equipment-symbols/symbols.ts'],
          Component: SymbolsElectricalSet,
        },
        {
          id: 'SymbolsInstrumentBubbles',
          title: 'Instrument bubbles',
          note: 'Pick the frame by where the instrument is mounted, and tint the bubble when its loop is in alarm.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/equipment-symbols/InstrumentBubble.tsx', 'kit/StatusPill.tsx'],
          Component: SymbolsInstrumentBubbles,
        },
        {
          id: 'SymbolsSizes',
          title: 'Sizes',
          note: 'Pick the size by where the symbol sits; the stroke weight stays the same at all of them.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/equipment-symbols/SymbolGlyph.tsx'],
          Component: SymbolsSizes,
        },
        {
          id: 'SymbolsValvePositions',
          title: 'Valve positions',
          note: 'Pick it wherever a valve is drawn: hollow open, solid closed, dashed in travel, crossed when failed.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/equipment-symbols/SymbolGlyph.tsx', 'kit/StatusPill.tsx'],
          Component: SymbolsValvePositions,
        },
      ],
    },
    {
      id: 'states',
      title: 'States, tags and readings',
      description: 'A symbol becomes an asset when it carries a tag, a state and a reading.',
      specimens: [
        {
          id: 'SymbolsRunStates',
          title: 'Run states',
          note: 'Pick the state from the asset: each has a colour, a fill and a word, and tripped adds a fault mark.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/equipment-symbols/SymbolTile.tsx', 'kit/equipment-symbols/SymbolGlyph.tsx'],
          Component: SymbolsRunStates,
        },
        {
          id: 'SymbolsWithReadings',
          title: 'With tag and reading',
          note: 'Pick it for an asset shown outside a diagram: the tile adds the tag, a live reading and the state.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/equipment-symbols/SymbolTile.tsx'],
          Component: SymbolsWithReadings,
        },
        {
          id: 'SymbolsSelectable',
          title: 'Hover and select',
          note: 'Pick it when a symbol opens detail: the tile is a toggle button with a visible selected ring.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/equipment-symbols/SymbolTile.tsx', 'kit/TagId.tsx'],
          Component: SymbolsSelectable,
        },
      ],
    },
    {
      id: 'looks',
      title: 'Symbols in six looks',
      description: 'Stroke weight, corner style, fill and the tile around the symbol all belong to the look.',
      specimens: [
        {
          id: 'SymbolsLookConsole',
          title: 'Console: solid fills and state strips',
          note: 'Pick it for an operator display: a filled symbol is readable at a glance on a dark ground.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/equipment-symbols/SymbolTrain.tsx', 'kit/equipment-symbols/SymbolTile.tsx', 'looks/LookScope.tsx'],
          Component: SymbolsLookConsole,
        },
        {
          id: 'SymbolsLookBlueprint',
          title: 'Blueprint: line only with instrument bubbles',
          note: 'Pick it for engineering drawings, where symbols are thin square-cut outlines and nothing is filled.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/equipment-symbols/SymbolTrain.tsx', 'kit/equipment-symbols/InstrumentBubble.tsx', 'looks/LookScope.tsx'],
          Component: SymbolsLookBlueprint,
        },
        {
          id: 'SymbolsLookPoster',
          title: 'Poster: heavy symbols on colour blocks',
          note: 'Pick it for a team board where four units and their state must read from across the room.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/equipment-symbols/SymbolTile.tsx', 'looks/LookScope.tsx'],
          Component: SymbolsLookPoster,
        },
        {
          id: 'SymbolsLookGlass',
          title: 'Glass: glowing gas path',
          note: 'Pick it for a showpiece overview on a dark display.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/equipment-symbols/SymbolTrain.tsx', 'looks/LookScope.tsx'],
          Component: SymbolsLookGlass,
        },
        {
          id: 'SymbolsLookSignal',
          title: 'Signal: state-filled unit tiles',
          note: 'Pick it for a wall screen: the tile is the state, the symbol says which kind of unit it is.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/equipment-symbols/SymbolTile.tsx', 'looks/LookScope.tsx'],
          Component: SymbolsLookSignal,
        },
        {
          id: 'SymbolsLookSoft',
          title: 'Soft: rounded strokes on tinted cards',
          note: 'Pick it for a friendly asset overview outside the control room.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/equipment-symbols/SymbolTile.tsx', 'looks/LookScope.tsx'],
          Component: SymbolsLookSoft,
        },
      ],
    },
    {
      id: 'in-use',
      title: 'In use',
      description: 'Compositions ready to drop into a product.',
      specimens: [
        {
          id: 'SymbolsUseTrain',
          title: 'Train with unit detail',
          note: 'Pick it as a simplified process view: select a unit in the train to read its figures beside it.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/equipment-symbols/SymbolTrain.tsx', 'kit/Meter.tsx', 'kit/StatGroup.tsx', 'kit/Legend.tsx', 'kit/Panel.tsx'],
          Component: SymbolsUseTrain,
        },
        {
          id: 'SymbolsUseEquipmentList',
          title: 'Equipment list',
          note: 'Pick it for a table of assets: the symbol column ties each row to its shape in the diagram.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/equipment-symbols/SymbolGlyph.tsx', 'kit/DataTable.tsx', 'kit/StatusPill.tsx', 'kit/TagId.tsx'],
          Component: SymbolsUseEquipmentList,
        },
        {
          id: 'SymbolsUseLegend',
          title: 'Diagram legend',
          note: 'Pick it beside any diagram: shapes on the left, state colours on the right.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/equipment-symbols/SymbolGlyph.tsx', 'kit/equipment-symbols/symbols.ts'],
          Component: SymbolsUseLegend,
        },
      ],
    },
  ],
});
