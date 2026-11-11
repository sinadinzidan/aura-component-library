import { Button } from '@cognite/aura/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardHeaderCenter, CardTitle } from '@cognite/aura/components/card';
import { EmptyState, EmptyStateActions, EmptyStateDescription, EmptyStateIcon, EmptyStateTitle } from '@cognite/aura/components/empty-state';
import { Skeleton } from '@cognite/aura/components/skeleton';
import { IconFileOff } from '@cognite/aura/icons';
import { useState } from 'react';

import { symbolPort } from '../../../library/industrial/diagrams/symbolPaths';
import type { SymbolKind, SymbolPort } from '../../../library/industrial/diagrams/symbolPaths';
import { valvePositionStatus } from '../../../library/industrial/diagrams/symbolState';
import { runStateStatus } from '../../../library/industrial/status';
import { ViewerToolbar } from '../../../library/industrial/workflows/ViewerToolbar';
import { ThemeScope } from '../../../library/themes/ThemeScope';
import { PidCanvas } from '../../../library/tools/pid/PidCanvas';
import { PidLayerToggles } from '../../../library/tools/pid/PidLayerToggles';
import { PidLegend } from '../../../library/tools/pid/PidLegend';
import { ALL_LAYERS_ON, alarmsFor, documentsFor, equipmentBounds } from '../../../library/tools/pid/pidModel';
import type { PidAlarm, PidDocument, PidDrawing, PidEquipment, PidInstrument, PidLayers, PidLine, PidValve } from '../../../library/tools/pid/pidModel';
import { PidTagPanel } from '../../../library/tools/pid/PidTagPanel';
import type { PidPanelReading } from '../../../library/tools/pid/PidTagPanel';
import { PidTagSearch } from '../../../library/tools/pid/PidTagSearch';
import { PidTitleBlock } from '../../../library/tools/pid/PidTitleBlock';
import { PidViewer } from '../../../library/tools/pid/PidViewer';
import { ViewportMiniMap } from '../../../library/tools/pid/ViewportMiniMap';
import { ALARMS, ASSETS, SENSORS } from '../../data/plant';
import type { Sensor } from '../../data/plant';
import { HOUR, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './pid-viewer.tsx?raw';

const asset = (id: string) => {
  const found = ASSETS.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`Unknown asset ${id}`);
  return found;
};

const sensor = (id: string): Sensor => {
  const found = SENSORS.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`Unknown sensor ${id}`);
  return found;
};

const SIZE = 64;
const equipment = (id: string, kind: SymbolKind, x: number, y: number): PidEquipment => {
  const record = asset(id);
  return { id, tag: record.tag, name: record.name, kind, x, y, state: record.state };
};
const port = (item: PidEquipment, name: SymbolPort) => symbolPort(item.kind, name, item.x, item.y, SIZE);

const SEPARATOR = equipment('20-va-1001', 'horizontal-separator', 300, 330);
const COMPRESSOR_1 = equipment('23-ka-9101', 'compressor', 620, 330);
const COOLER = equipment('23-ha-9114', 'heat-exchanger', 820, 330);
const COMPRESSOR_2 = equipment('23-ka-9102', 'compressor', 1020, 330);
const RECOMPRESSOR = equipment('23-ka-9103', 'compressor', 820, 580);

const valve = (id: string, tag: string, name: string, type: PidValve['type'], x: number, position: PidValve['position']): PidValve => ({ id, tag, name, type, x, y: 330, position });
const INLET_VALVE: PidValve = { id: '20-xv-1105', tag: '20-XV-1105', name: 'Inlet shutdown valve', type: 'shutdown', x: 130, y: 330, position: 'open' };
const SUCTION_VALVE = valve('23-hv-9105', '23-HV-9105', 'Suction isolation valve', 'gate', 470, 'open');
const FLOW_VALVE = valve('23-fv-92510', '23-FV-92510', 'Gas flow control valve', 'control', 1260, 'open');

const limitsOf = (record: Sensor) => ({ low: record.lowLimit > record.rangeMin ? record.lowLimit : undefined, high: record.highLimit, highHigh: record.highHighLimit });

const instrument = (
  record: Sensor,
  letters: string,
  x: number,
  y: number,
  tapTo: { x: number; y: number },
  equipmentId: string,
  valueAt: 'above' | 'below' = 'above'
): PidInstrument => ({
  id: record.id,
  tag: record.tag,
  name: record.name,
  letters,
  loop: record.tag.split('-')[2],
  x,
  y,
  tapTo,
  equipmentId,
  unit: record.unit,
  decimals: record.decimals,
  limits: limitsOf(record),
  valueAt,
});

/** The recompressor's vibration probe is not in the shared sensor list; its alarm is. */
const RECOMPRESSOR_VIBRATION: PidInstrument = {
  id: 'vt-92740',
  tag: '23-VT-92740',
  name: 'Drive-end vibration',
  letters: 'VT',
  loop: '92740',
  x: 840,
  y: 500,
  tapTo: { x: 835, y: 566 },
  equipmentId: '23-ka-9103',
  unit: 'mm/s',
  decimals: 1,
  limits: { high: 7.1, highHigh: 11 },
  valueAt: 'above',
};

const INSTRUMENTS: readonly PidInstrument[] = [
  instrument(sensor('lt-10012'), 'LT', 300, 240, { x: 300, y: 317 }, '20-va-1001'),
  instrument(sensor('pt-10010'), 'PT', 380, 420, { x: 380, y: 330 }, '20-va-1001', 'below'),
  instrument(sensor('pt-92530'), 'PT', 575, 240, { x: 575, y: 330 }, '23-ka-9101'),
  instrument(sensor('vt-92540'), 'VT', 650, 240, { x: 650, y: 316 }, '23-ka-9101'),
  instrument(sensor('tt-92532'), 'TT', 760, 240, { x: 760, y: 330 }, '23-ka-9101'),
  instrument(sensor('pt-92531'), 'PT', 700, 420, { x: 700, y: 330 }, '23-ka-9101', 'below'),
  instrument(sensor('tt-91141'), 'TT', 960, 240, { x: 960, y: 330 }, '23-ha-9114'),
  instrument(sensor('ft-92510'), 'FT', 1160, 240, { x: 1160, y: 330 }, '23-ka-9102'),
  RECOMPRESSOR_VIBRATION,
];

const run = (id: string, number: string, service: string, points: PidLine['points'], extra: Partial<PidLine> = {}): PidLine => ({
  id,
  number,
  service,
  points,
  weight: 'heavy',
  flow: 'forward',
  ...extra,
});

const LINES: readonly PidLine[] = [
  run('l-1001', '12"-PG-20-1001', 'Inlet gas', [{ x: 40, y: 330 }, { x: 118, y: 330 }], { label: { x: 46, y: 320 } }),
  run('l-1002', '12"-PG-20-1002', 'Inlet gas', [{ x: 142, y: 330 }, port(SEPARATOR, 'in')], { label: { x: 150, y: 320 } }),
  run('l-1003', '12"-PG-20-1003', 'Separated gas', [port(SEPARATOR, 'out'), { x: 458, y: 330 }], { label: { x: 398, y: 320 } }),
  run('l-1004', '10"-PG-23-1004', 'Suction gas, 1st stage', [{ x: 482, y: 330 }, port(COMPRESSOR_1, 'in')], { label: { x: 486, y: 320 } }),
  run('l-1005', '10"-PG-23-1005', 'Discharge gas, 1st stage', [port(COMPRESSOR_1, 'out'), port(COOLER, 'in')], { label: { x: 652, y: 320 } }),
  run('l-1006', '10"-PG-23-1006', 'Cooled gas, 2nd stage suction', [port(COOLER, 'out'), port(COMPRESSOR_2, 'in')], { label: { x: 856, y: 320 } }),
  run('l-1007', '8"-PG-23-1007', 'Export gas', [port(COMPRESSOR_2, 'out'), { x: FLOW_VALVE.x - 12, y: 330 }], { label: { x: 1050, y: 320 } }),
  run('l-1008', '8"-PG-27-1008', 'Export gas', [{ x: FLOW_VALVE.x + 12, y: 330 }, { x: 1380, y: 330 }], { label: { x: 1290, y: 320 } }),
  run('l-1009', '4"-PG-23-1009', 'Recycle gas to recompressor', [{ x: 300, y: 362 }, { x: 300, y: 580 }, port(RECOMPRESSOR, 'in')], { weight: 'normal', label: { x: 310, y: 500 } }),
  run('l-1010', '4"-PG-23-1010', 'Recompressed gas', [port(RECOMPRESSOR, 'out'), { x: 930, y: 580 }, { x: 930, y: 330 }], { weight: 'normal', label: { x: 852, y: 598 } }),
];

/** The drawing: the compression area of Nordkapp from inlet to export, drawn from the shared plant records. */
const GAS_COMPRESSION: PidDrawing = {
  id: 'nk-23-pid-0001',
  number: 'NK-23-PID-0001',
  title: 'Gas compression, inlet to export',
  area: 'Gas compression (NK-23)',
  revision: 'C',
  status: 'Issued for operation',
  issuedOn: '4 Feb 2026',
  drawnBy: 'AK',
  checkedBy: 'LW',
  sheet: '1 of 3',
  width: 1440,
  height: 760,
  equipment: [SEPARATOR, COMPRESSOR_1, COOLER, COMPRESSOR_2, RECOMPRESSOR],
  valves: [INLET_VALVE, SUCTION_VALVE, FLOW_VALVE],
  instruments: INSTRUMENTS,
  lines: LINES,
  notes: [
    { id: 'n-1', x: 260, y: 690, text: 'Note 1: Relief valves discharge to the flare header, drawing NK-23-PID-0003.' },
    { id: 'n-2', x: 260, y: 708, text: 'Note 2: Vessel data per datasheet NK-20-DS-0101. Compressor data per NK-23-DS-9101.' },
  ],
  connectors: [
    { id: 'c-in', x: 40, y: 330, label: 'From inlet manifold', drawing: 'NK-20-PID-0001', direction: 'in' },
    { id: 'c-out', x: 1380, y: 330, label: 'To gas export', drawing: 'NK-27-PID-0001', direction: 'out' },
  ],
};

/** Readings as the plant records have them; two are moved to the values the open alarms report. */
const READINGS: Record<string, number | null> = {
  ...Object.fromEntries(INSTRUMENTS.map((item) => [item.id, SENSORS.find((record) => record.id === item.id)?.value ?? null])),
  'tt-92532': 146.3,
  'tt-91141': 40.8,
  'vt-92740': 11.6,
};

const TAG_IDS: Record<string, string> = { '23-VT-92740': 'vt-92740', '23-TT-92532': 'tt-92532', '23-VT-92540': 'vt-92540', '23-TT-91141': 'tt-91141' };

const ALARM_TAG = (sensorTag: string, assetId: string): string => TAG_IDS[sensorTag] ?? assetId;

/** Open and acknowledged alarms from the plant list that belong to this drawing. */
const DRAWING_ALARMS: readonly PidAlarm[] = ALARMS.filter((alarm) => (alarm.state === 'active' || alarm.state === 'acknowledged') && GAS_COMPRESSION.equipment.concat().some((item) => item.id === alarm.assetId)).map((alarm) => ({
  id: alarm.id,
  tagId: ALARM_TAG(alarm.sensorTag, alarm.assetId),
  severity: alarm.severity,
  message: alarm.message,
  detail: `${alarm.state === 'active' ? 'Active' : 'Acknowledged'}, ${alarm.value} against ${alarm.limit}`,
}));

const DOCUMENTS: readonly PidDocument[] = [
  { id: 'doc-ds-9101', title: 'Compressor 1st stage datasheet', kind: 'Datasheet', revision: 'C', tagIds: ['23-ka-9101'] },
  { id: 'doc-ds-9103', title: 'Recompressor datasheet', kind: 'Datasheet', revision: 'B', tagIds: ['23-ka-9103'] },
  { id: 'doc-ds-1001', title: 'Inlet separator datasheet', kind: 'Datasheet', revision: 'D', tagIds: ['20-va-1001', 'lt-10012', 'pt-10010'] },
  { id: 'doc-ld-92532', title: 'Loop diagram 92532', kind: 'Loop diagram', revision: 'A', tagIds: ['tt-92532', '23-ka-9101'] },
  { id: 'doc-ld-92740', title: 'Vibration monitoring loop 92740', kind: 'Loop diagram', revision: 'A', tagIds: ['vt-92740', '23-ka-9103'] },
  { id: 'doc-cm-9114', title: 'Interstage cooler cleaning procedure', kind: 'Procedure', revision: 'B', tagIds: ['23-ha-9114', 'tt-91141'] },
  { id: 'doc-ca-1105', title: 'Inlet shutdown valve cause and effect', kind: 'Cause and effect', revision: 'E', tagIds: ['20-xv-1105'] },
];

const TRENDS: Record<string, readonly number[]> = Object.fromEntries(
  INSTRUMENTS.map((item, index) => {
    const record = SENSORS.find((candidate) => candidate.id === item.id);
    const base = READINGS[item.id] ?? 0;
    const span = Math.max(1, ((record?.highLimit ?? base) - (record?.lowLimit ?? 0)) / 12);
    return [item.id, makeValues({ seed: 400 + index, points: 48, base: base - span, amplitude: span * 0.6, noise: span * 0.25, drift: span, cycles: 2, stepMs: HOUR / 2, decimals: item.decimals })];
  })
);

const reading = (item: PidInstrument): PidPanelReading => ({ id: item.id, tag: item.tag, name: item.name, value: READINGS[item.id] ?? null, unit: item.unit, decimals: item.decimals, limits: item.limits });
const instrumentById = (id: string): PidInstrument => {
  const found = INSTRUMENTS.find((item) => item.id === id);
  if (!found) throw new Error(`Unknown instrument ${id}`);
  return found;
};

const VIEWER = { drawing: GAS_COMPRESSION, readings: READINGS, trends: TRENDS, alarms: DRAWING_ALARMS, documents: DOCUMENTS } as const;

function PidViewerFull() {
  return (
    <div className="h-176 w-full">
      <PidViewer {...VIEWER} />
    </div>
  );
}

function PidViewerDarkScope() {
  return (
    <ThemeScope preset="control-room" className="h-176 w-full">
      <PidViewer {...VIEWER} initialSelection={{ kind: 'tag', id: '23-ka-9103' }} />
    </ThemeScope>
  );
}

function PidViewerToolbarDemo() {
  const [zoom, setZoom] = useState(100);
  return (
    <div className="rounded-lg border border-default p-1">
      <ViewerToolbar zoom={zoom} onZoomChange={setZoom} onFit={() => setZoom(100)} range={{ min: 25, max: 400, step: 25 }} label="Drawing zoom" />
    </div>
  );
}

function PidViewerMiniMapDemo() {
  const [centre, setCentre] = useState({ x: 520, y: 330 });
  return (
    <ViewportMiniMap
      world={{ x: 0, y: 0, width: GAS_COMPRESSION.width, height: GAS_COMPRESSION.height }}
      viewport={{ x: centre.x - 260, y: centre.y - 150, width: 520, height: 300 }}
      label="Mini-map of NK-23-PID-0001"
      onRecentre={setCentre}
    >
      <PidCanvas drawing={GAS_COMPRESSION} layers={{ ...ALL_LAYERS_ON, instruments: false, values: false, alarms: false, annotations: false }} />
    </ViewportMiniMap>
  );
}

function PidViewerLayerSwitch() {
  const [layers, setLayers] = useState<PidLayers>({ ...ALL_LAYERS_ON, annotations: false });
  return (
    <div className="flex flex-col items-start gap-3">
      <PidLayerToggles layers={layers} onToggle={(layer) => setLayers({ ...layers, [layer]: !layers[layer] })} alarmCount={DRAWING_ALARMS.length} annotationCount={2} />
      <p className="text-xs text-muted-foreground">{Object.values(layers).filter(Boolean).length} of 5 layers shown.</p>
    </div>
  );
}

function PidViewerSearchResults() {
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <PidTagSearch drawing={GAS_COMPRESSION} defaultQuery="23-pt" results="inline" onPick={(tag) => setPicked(`${tag.tag}, ${tag.name}`)} />
      <p role="status" className="min-h-4 text-xs text-muted-foreground">
        {picked ? `Flying to ${picked}.` : 'Choose a result to fly to it.'}
      </p>
    </div>
  );
}

function PidViewerTitleBlockFull() {
  return <PidTitleBlock drawing={GAS_COMPRESSION} className="w-full max-w-xs" />;
}

function PidViewerTitleBlockCompact() {
  return <PidTitleBlock drawing={GAS_COMPRESSION} variant="compact" />;
}

function PidViewerLegend() {
  return <PidLegend layout="row" />;
}

function PidViewerInstrumentPanel() {
  const item = instrumentById('tt-92532');
  return (
    <div className="h-136 w-full max-w-sm">
      <PidTagPanel
        frame="card"
        tag={{ id: item.id, tag: item.tag, name: item.name, kind: 'instrument' }}
        reading={reading(item)}
        trend={TRENDS[item.id]}
        alarms={alarmsFor(DRAWING_ALARMS, item.id)}
        documents={documentsFor(DOCUMENTS, item.id)}
        onOpenDocument={() => undefined}
      />
    </div>
  );
}

function PidViewerEquipmentPanel() {
  const compressor = COMPRESSOR_1;
  return (
    <div className="h-136 w-full max-w-sm">
      <PidTagPanel
        frame="card"
        tag={{ id: compressor.id, tag: compressor.tag, name: compressor.name, kind: 'equipment' }}
        status={runStateStatus(compressor.state)}
        measurements={INSTRUMENTS.filter((item) => item.equipmentId === compressor.id).map(reading)}
        alarms={alarmsFor(DRAWING_ALARMS, compressor.id)}
        documents={documentsFor(DOCUMENTS, compressor.id)}
        onOpenDocument={() => undefined}
      />
    </div>
  );
}

function PidViewerValvePanel() {
  return (
    <div className="h-136 w-full max-w-sm">
      <PidTagPanel
        frame="card"
        tag={{ id: INLET_VALVE.id, tag: INLET_VALVE.tag, name: INLET_VALVE.name, kind: 'valve' }}
        status={valvePositionStatus(INLET_VALVE.position)}
        documents={documentsFor(DOCUMENTS, INLET_VALVE.id)}
        onOpenDocument={() => undefined}
      />
    </div>
  );
}

function PidViewerSelectedLine() {
  return (
    <div className="h-120 w-full">
      <PidViewer {...VIEWER} initialSelection={{ kind: 'line', id: 'l-1006' }} />
    </div>
  );
}

function PidViewerAlarmOverlay() {
  return (
    <div className="h-120 w-full">
      <PidViewer {...VIEWER} initialLayers={{ values: false, annotations: false }} />
    </div>
  );
}

function PidViewerLinesOnly() {
  return (
    <div className="h-96 w-full">
      <PidViewer {...VIEWER} initialLayers={{ instruments: false, values: false, alarms: false, annotations: false }} />
    </div>
  );
}

function PidViewerPins() {
  return (
    <div className="h-120 w-full">
      <PidViewer
        {...VIEWER}
        initialSelection={{ kind: 'pin', id: 'pin-1' }}
        initialPins={[
          { id: 'pin-1', x: 640, y: 420, note: 'Check lube oil return line for weeping at the next shutdown.' },
          { id: 'pin-2', x: 930, y: 460, note: 'Spool replaced under WO-104471.' },
        ]}
      />
    </div>
  );
}

function PidViewerReadOnly() {
  return (
    <div className="h-120 w-full">
      <PidViewer {...VIEWER} readOnly />
    </div>
  );
}

function PidViewerCompactCard() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>Compression train</CardTitle>
          <CardDescription>Select a tag to read its value. Open the drawing for notes and documents.</CardDescription>
        </CardHeaderCenter>
      </CardHeader>
      <CardContent className="w-full">
        <div className="h-80 w-full">
          <PidViewer {...VIEWER} variant="compact" initialSelection={{ kind: 'tag', id: 'tt-92532' }} />
        </div>
      </CardContent>
    </Card>
  );
}

function PidViewerLoading() {
  return (
    <div role="status" aria-label="Loading drawing" className="flex h-96 w-full flex-col gap-3 rounded-xl border border-default p-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-52" />
        <Skeleton className="h-9 w-80" />
        <span className="flex-1" />
        <Skeleton className="h-9 w-40" />
      </div>
      <Skeleton className="min-h-0 w-full flex-1" />
      <p className="text-xs text-muted-foreground">Loading NK-23-PID-0001, revision C.</p>
    </div>
  );
}

function PidViewerNotFound() {
  return (
    <div className="flex h-96 w-full items-center justify-center rounded-xl border border-default">
      <EmptyState variant="full" type="not-found">
        <EmptyStateIcon>
          <IconFileOff />
        </EmptyStateIcon>
        <div className="flex flex-col items-center gap-2">
          <EmptyStateTitle as="h2">Drawing not found</EmptyStateTitle>
          <EmptyStateDescription>NK-23-PID-0007 is not in the document register. It may have been superseded or withdrawn.</EmptyStateDescription>
        </div>
        <EmptyStateActions>
          <Button variant="secondary">Open the drawing register</Button>
        </EmptyStateActions>
      </EmptyState>
    </div>
  );
}

function PidViewerStaticFigure() {
  const bounds = equipmentBounds(COMPRESSOR_1);
  return (
    <svg role="img" aria-label="Detail of the 1st stage compressor and its instruments on NK-23-PID-0001" viewBox={`${bounds.x - 140} 180 ${bounds.width + 280} 260`} className="block w-full max-w-lg">
      <PidCanvas drawing={GAS_COMPRESSION} readings={READINGS} alarms={DRAWING_ALARMS} />
    </svg>
  );
}

export default definePage({
  id: 'pid-viewer',
  title: 'P&ID viewer',
  summary:
    'A working piping and instrumentation diagram of the Nordkapp gas compression area. Pan by dragging, zoom about the pointer, find a tag and fly to it, click a tag or line for its live value, limits, alarms and documents, switch layers and pin notes.',
  guidance: {
    use: [
      'Operators and engineers need to see live values in the context of the process, with the drawing as the way into a tag.',
      'The drawing is large and detailed enough that people must zoom, search and follow lines.',
      'A tag should open its alarms and documents without leaving the drawing.',
    ],
    avoid: [
      'A schematic that fits on one screen without zooming. Use a static process diagram instead.',
      'Colouring every symbol. Equipment stays grey; colour appears only for a limit, an alarm or a trip.',
      'Hiding the revision. People must always see which issue of the drawing they are reading.',
    ],
  },
  source,
  sections: [
    {
      id: 'viewer',
      title: 'The viewer',
      description: 'The full tool in a light and a dark theme. Drag to pan, scroll to zoom, press plus, minus and zero, Tab through tags.',
      specimens: [
        {
          id: 'PidViewerFull',
          title: 'Full viewer',
          note: 'Pick it as the main drawing screen: search, layers, pins, mini-map, title block and a panel for the selected tag.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['tools/pid/PidViewer.tsx', 'tools/pid/PidCanvas.tsx', 'tools/pid/viewport.ts', 'tools/pid/pidReducer.ts'],
          Component: PidViewerFull,
        },
        {
          id: 'PidViewerDarkScope',
          title: 'In a dark theme',
          note: 'Pick it for control rooms: the same viewer in the control-room theme, opened on the tripped recompressor.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['tools/pid/PidViewer.tsx', 'themes/ThemeScope.tsx'],
          Component: PidViewerDarkScope,
        },
      ],
    },
    {
      id: 'controls',
      title: 'Controls',
      description: 'The parts that steer the view, used alone when a drawing is embedded in a different screen.',
      specimens: [
        {
          id: 'PidViewerToolbarDemo',
          title: 'Zoom toolbar',
          note: 'Pick it for stepwise zoom with a visible level and a fit button; the wheel and keys are in addition, not instead.',
          origin: 'custom',
          size: 'sm',
          uses: ['industrial/workflows/ViewerToolbar.tsx'],
          Component: PidViewerToolbarDemo,
        },
        {
          id: 'PidViewerMiniMapDemo',
          title: 'Mini-map',
          note: 'Pick it when a drawing is much larger than the screen: the frame shows where you are, a click or drag moves there.',
          origin: 'custom',
          size: 'sm',
          uses: ['tools/pid/ViewportMiniMap.tsx', 'tools/pid/PidCanvas.tsx'],
          Component: PidViewerMiniMapDemo,
        },
        {
          id: 'PidViewerLayerSwitch',
          title: 'Layer switch',
          note: 'Pick it to let people strip the drawing down: lines, instruments, live values, alarms and annotations.',
          origin: 'custom',
          size: 'sm',
          uses: ['tools/pid/PidLayerToggles.tsx', 'actions/ToggleGroup.tsx'],
          Component: PidViewerLayerSwitch,
        },
        {
          id: 'PidViewerSearchResults',
          title: 'Tag search results',
          note: 'Pick it to find a tag by a fragment of its number or name; arrow keys choose, Enter flies to it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/pid/PidTagSearch.tsx'],
          Component: PidViewerSearchResults,
        },
        {
          id: 'PidViewerTitleBlockFull',
          title: 'Title block',
          note: 'Pick it to show the drawing number, revision, status and sign-off in the drafting convention.',
          origin: 'custom',
          size: 'sm',
          uses: ['tools/pid/PidTitleBlock.tsx'],
          Component: PidViewerTitleBlockFull,
        },
        {
          id: 'PidViewerTitleBlockCompact',
          title: 'Compact title block',
          note: 'Pick it on a small viewer where only the number, revision and status fit.',
          origin: 'custom',
          size: 'sm',
          uses: ['tools/pid/PidTitleBlock.tsx'],
          Component: PidViewerTitleBlockCompact,
        },
        {
          id: 'PidViewerLegend',
          title: 'Legend',
          note: 'Pick it beside a drawing for first-time readers: line weights, symbol states, limit flags and alarm marks.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['tools/pid/PidLegend.tsx'],
          Component: PidViewerLegend,
        },
      ],
    },
    {
      id: 'panels',
      title: 'Tag panels',
      description: 'What opens when a tag is selected: a value and limits for an instrument, measurements for equipment, a position for a valve.',
      specimens: [
        {
          id: 'PidViewerInstrumentPanel',
          title: 'Instrument panel',
          note: 'Pick it for a measurement: live value against its limits, a 24 hour trend, open alarms and the loop diagram.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['tools/pid/PidTagPanel.tsx', 'industrial/Sparkline.tsx', 'patterns/structure/SidePanel.tsx'],
          Component: PidViewerInstrumentPanel,
        },
        {
          id: 'PidViewerEquipmentPanel',
          title: 'Equipment panel',
          note: 'Pick it for a machine: its run state, every measurement taken on it, its alarms and datasheets.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['tools/pid/PidTagPanel.tsx', 'industrial/StatusIndicator.tsx'],
          Component: PidViewerEquipmentPanel,
        },
        {
          id: 'PidViewerValvePanel',
          title: 'Valve panel',
          note: 'Pick it for a valve: its position in words and the documents that say what closes it.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['tools/pid/PidTagPanel.tsx', 'industrial/diagrams/symbolState.ts'],
          Component: PidViewerValvePanel,
        },
        {
          id: 'PidViewerStaticFigure',
          title: 'Drawing as a figure',
          note: 'Pick it to put a detail of the drawing in a report, with values and alarm rings but no controls.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/pid/PidCanvas.tsx'],
          Component: PidViewerStaticFigure,
        },
      ],
    },
    {
      id: 'states',
      title: 'States and embedding',
      description: 'The same viewer with something selected, switched off, locked, loading or missing.',
      specimens: [
        {
          id: 'PidViewerSelectedLine',
          title: 'Selected line',
          note: 'Pick it for tracing: a selected line is highlighted along its whole length and described in the panel.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['tools/pid/PidViewer.tsx'],
          Component: PidViewerSelectedLine,
        },
        {
          id: 'PidViewerAlarmOverlay',
          title: 'Alarm overlay',
          note: 'Pick it for alarm review: affected symbols get a pulsing ring and a severity mark, and live values are off.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['tools/pid/PidViewer.tsx', 'experiences/drilldown/SvgStatusMark.tsx'],
          Component: PidViewerAlarmOverlay,
        },
        {
          id: 'PidViewerLinesOnly',
          title: 'Process lines only',
          note: 'Pick it to follow the route of the gas without instruments, values or alarms in the way.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['tools/pid/PidViewer.tsx'],
          Component: PidViewerLinesOnly,
        },
        {
          id: 'PidViewerPins',
          title: 'With annotation pins',
          note: 'Pick it for field notes: pins are numbered, carry a note and can be removed or undone.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['tools/pid/PidViewer.tsx'],
          Component: PidViewerPins,
        },
        {
          id: 'PidViewerReadOnly',
          title: 'Read-only',
          note: 'Pick it for people who may look but not annotate: pins and undo are gone, tags stay clickable.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['tools/pid/PidViewer.tsx'],
          Component: PidViewerReadOnly,
        },
        {
          id: 'PidViewerCompactCard',
          title: 'Compact in a card',
          note: 'Pick it for an overview page: zoom and a one-line summary of the selected tag, no side panel.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['tools/pid/PidViewer.tsx'],
          Component: PidViewerCompactCard,
        },
        {
          id: 'PidViewerLoading',
          title: 'Loading',
          note: 'Pick it while the drawing and its tags are fetched; it keeps the size of the viewer.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: PidViewerLoading,
        },
        {
          id: 'PidViewerNotFound',
          title: 'Drawing not found',
          note: 'Pick it when a link points at a drawing that is not in the register, with a way to the register.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: PidViewerNotFound,
        },
      ],
    },
  ],
});
