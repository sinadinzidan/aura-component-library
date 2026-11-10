import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardHeaderCenter, CardHeaderEnd, CardTitle } from '@cognite/aura/components/card';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { AreaBlock } from '../../../library/industrial/diagrams/AreaBlock';
import { DiagramCanvas } from '../../../library/industrial/diagrams/DiagramCanvas';
import type { Point } from '../../../library/industrial/diagrams/diagramGeometry';
import { DiagramHotspot } from '../../../library/industrial/diagrams/DiagramHotspot';
import { EquipmentSymbol } from '../../../library/industrial/diagrams/EquipmentSymbol';
import { FlowArrow } from '../../../library/industrial/diagrams/FlowArrow';
import { InstrumentBubble } from '../../../library/industrial/diagrams/InstrumentBubble';
import { PipeLine } from '../../../library/industrial/diagrams/PipeLine';
import { symbolPort } from '../../../library/industrial/diagrams/symbolPaths';
import type { SymbolKind, SymbolPort } from '../../../library/industrial/diagrams/symbolPaths';
import { runStateAppearance } from '../../../library/industrial/diagrams/symbolState';
import { ValueTag } from '../../../library/industrial/diagrams/ValueTag';
import { ValveSymbol } from '../../../library/industrial/diagrams/ValveSymbol';
import { runStateStatus, toneFromLimits } from '../../../library/industrial/status';
import type { Limits, Tone } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { ALARMS, ASSETS, SENSORS, sensorsOf } from '../../data/plant';
import type { Asset, RunState, Sensor } from '../../data/plant';
import { REFERENCE_NOW, formatDateTime, formatTime } from '../../data/series';
import { definePage } from '../../types';

import source from './process-diagrams.tsx?raw';

function findSensor(id: string): Sensor {
  const sensor = SENSORS.find((candidate) => candidate.id === id);
  if (!sensor) throw new Error(`Unknown sensor ${id}`);
  return sensor;
}

function findAssetById(id: string): Asset {
  const asset = ASSETS.find((candidate) => candidate.id === id);
  if (!asset) throw new Error(`Unknown asset ${id}`);
  return asset;
}

/** Plant sensor limits in the shape the status helpers take. */
const limitsOf = (sensor: Sensor): Limits => ({
  low: sensor.lowLimit > sensor.rangeMin ? sensor.lowLimit : undefined,
  high: sensor.highLimit,
  highHigh: sensor.highHighLimit,
});

/** Tone and letter flag of a reading against its limits. */
function limitState(value: number, sensor: Sensor): { tone: Tone; flag?: string } {
  const tone = toneFromLimits(value, limitsOf(sensor));
  if (tone === 'critical') return { tone, flag: 'HH' };
  if (tone === 'warning') return { tone, flag: value > sensor.highLimit ? 'H' : 'L' };
  return { tone };
}

const SEPARATOR = findAssetById('20-va-1001');
const INLET_VALVE = findAssetById('20-xv-1105');
const COMPRESSOR_1 = findAssetById('23-ka-9101');
const COMPRESSOR_2 = findAssetById('23-ka-9102');
const RECOMPRESSOR = findAssetById('23-ka-9103');
const COOLER = findAssetById('23-ha-9114');
const PUMP_A = findAssetById('27-pa-2001a');
const PUMP_B = findAssetById('27-pa-2001b');

const SEPARATOR_PRESSURE = findSensor('pt-10010');
const SEPARATOR_LEVEL = findSensor('lt-10012');
const SUCTION_PRESSURE = findSensor('pt-92530');
const DISCHARGE_PRESSURE = findSensor('pt-92531');
const DISCHARGE_TEMPERATURE = findSensor('tt-92532');
const VIBRATION = findSensor('vt-92540');
const GAS_FLOW = findSensor('ft-92510');
const COOLER_TEMPERATURE = findSensor('tt-91141');
const EXPORT_FLOW = findSensor('ft-20011');
const MOTOR_CURRENT = findSensor('it-20013');

/** Symbol size used on every diagram of this page, in diagram units. */
const UNIT = 44;

type PlacedUnit = { kind: SymbolKind; x: number; y: number; tag: string; name?: string; state: RunState };

const place = (asset: Asset, kind: SymbolKind, x: number, y: number): PlacedUnit => ({ kind, x, y, tag: asset.tag, name: asset.name, state: asset.state });

const portOf = (unit: PlacedUnit, port: SymbolPort, size: number = UNIT): Point => symbolPort(unit.kind, port, unit.x, unit.y, size);

/** Centre of an in-line valve whose ports sit on a line at `y`. */
const valveCentre = (y: number, size: number): number => y - size / 8;

/** Text on a diagram: tags in monospace, names and notes in the quiet colour. */
function ProcessText({
  x,
  y,
  anchor = 'middle',
  mono = false,
  quiet = false,
  className,
  children,
}: {
  x: number;
  y: number;
  anchor?: 'start' | 'middle' | 'end';
  mono?: boolean;
  quiet?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <text x={x} y={y} fontSize={10} textAnchor={anchor} className={className ?? `${quiet ? 'fill-muted-foreground' : 'fill-base-foreground'} ${mono ? 'font-mono' : ''}`}>
      {children}
    </text>
  );
}

/** A symbol with its tag and name underneath, coloured and filled by run state. */
function ProcessUnit({ unit, size = UNIT, labels = true, textClassName }: { unit: PlacedUnit; size?: number; labels?: boolean; textClassName?: string }) {
  return (
    <g>
      <EquipmentSymbol kind={unit.kind} size={size} cx={unit.x} cy={unit.y} label={`${unit.tag}${unit.name ? ` ${unit.name}` : ''}, ${unit.state}`} {...runStateAppearance(unit.state)} />
      {labels ? (
        <ProcessText x={unit.x} y={unit.y + size / 2 + 14} mono className={textClassName ? `${textClassName} font-mono` : undefined}>
          {unit.tag}
        </ProcessText>
      ) : null}
      {labels && unit.name ? (
        <ProcessText x={unit.x} y={unit.y + size / 2 + 27} quiet className={textClassName}>
          {unit.name}
        </ProcessText>
      ) : null}
    </g>
  );
}

type TrainMode = 'normal' | 'upset' | 'stale';

/** Separator, compressor and cooler with three readings: the diagram the framed specimens share. */
function ProcessMiniTrain({ mode = 'normal' }: { mode?: TrainMode }) {
  const y = 100;
  const separator = place(SEPARATOR, 'horizontal-separator', 70, y);
  const compressor = place(COMPRESSOR_1, 'compressor', 210, y);
  const cooler = place(COOLER, 'heat-exchanger', 350, y);
  const readings = [
    { sensor: SEPARATOR_PRESSURE, value: SEPARATOR_PRESSURE.value, x: 70, to: portOf(separator, 'top') },
    { sensor: DISCHARGE_TEMPERATURE, value: mode === 'upset' ? 146.3 : DISCHARGE_TEMPERATURE.value, x: 280, to: { x: 280, y } },
    { sensor: COOLER_TEMPERATURE, value: mode === 'upset' ? 40.8 : COOLER_TEMPERATURE.value, x: 420, to: { x: 420, y } },
  ];
  const summary = mode === 'upset' ? 'two readings above their high limit' : mode === 'stale' ? 'no live values' : 'all readings normal';
  return (
    <DiagramCanvas label={`Inlet separator, 1st stage compressor and interstage cooler, ${summary}`} width={480} height={170}>
      <PipeLine points={[{ x: 12, y }, portOf(separator, 'in')]} weight="heavy" flow="forward" />
      <PipeLine points={[portOf(separator, 'out'), portOf(compressor, 'in')]} weight="heavy" flow="forward" />
      <PipeLine points={[portOf(compressor, 'out'), portOf(cooler, 'in')]} weight="heavy" flow="forward" />
      <PipeLine points={[portOf(cooler, 'out'), { x: 468, y }]} weight="heavy" flow="forward" />
      {[separator, compressor, cooler].map((unit) => (
        <ProcessUnit key={unit.tag} unit={unit} />
      ))}
      {readings.map((reading) => (
        <ValueTag
          key={reading.sensor.id}
          x={reading.x}
          y={12}
          anchor="middle"
          label={reading.sensor.tag}
          mono
          value={mode === 'stale' ? null : reading.value}
          unit={reading.sensor.unit}
          decimals={reading.sensor.decimals}
          leaderTo={reading.to}
          {...(mode === 'stale' ? {} : limitState(reading.value, reading.sensor))}
        />
      ))}
    </DiagramCanvas>
  );
}

/** Two export pumps in parallel, A on duty and B on standby. */
function ProcessPumpSkid() {
  const pumpA = { ...place(PUMP_A, 'centrifugal-pump', 220, 62), name: 'Duty' };
  const pumpB = { ...place(PUMP_B, 'centrifugal-pump', 220, 172), name: 'Standby' };
  const valveSize = 28;
  const branches = [
    { pump: pumpA, flowing: true, current: MOTOR_CURRENT.value },
    { pump: pumpB, flowing: false, current: 0 },
  ];
  return (
    <DiagramCanvas
      label={`Export pump skid: pump A on duty at ${MOTOR_CURRENT.value} amperes, pump B on standby, ${EXPORT_FLOW.value} cubic metres per hour to export`}
      width={460}
      height={230}
    >
      <PipeLine points={[{ x: 12, y: 117 }, { x: 70, y: 117 }]} weight="heavy" flow="forward" />
      <PipeLine points={[{ x: 70, y: 62 }, { x: 70, y: 172 }]} weight="heavy" />
      <PipeLine points={[{ x: 380, y: 62 }, { x: 380, y: 172 }]} weight="heavy" />
      <PipeLine points={[{ x: 380, y: 117 }, { x: 448, y: 117 }]} weight="heavy" flow="forward" />
      {branches.map(({ pump, flowing, current }) => {
        const valve: PlacedUnit = { kind: 'check-valve', x: 310, y: valveCentre(pump.y, valveSize), tag: 'Check valve', state: 'stopped' };
        return (
          <g key={pump.tag}>
            <PipeLine points={[{ x: 70, y: pump.y }, portOf(pump, 'in')]} dashed={!flowing} flow={flowing ? 'forward' : undefined} />
            <PipeLine points={[portOf(pump, 'out'), portOf(valve, 'in', valveSize)]} dashed={!flowing} />
            <PipeLine points={[portOf(valve, 'out', valveSize), { x: 380, y: pump.y }]} dashed={!flowing} flow={flowing ? 'forward' : undefined} />
            <EquipmentSymbol kind="check-valve" size={valveSize} cx={valve.x} cy={valve.y} />
            <ProcessUnit unit={pump} />
            <ValueTag x={150} y={pump.y - 34} anchor="middle" value={current} unit={MOTOR_CURRENT.unit} decimals={1} />
          </g>
        );
      })}
      <ValueTag x={448} y={72} anchor="end" label={EXPORT_FLOW.tag} mono value={EXPORT_FLOW.value} unit={EXPORT_FLOW.unit} />
    </DiagramCanvas>
  );
}

function ProcessDiagramFlowArrows() {
  return (
    <DiagramCanvas label="Flow direction arrows: one per straight run, reversed for reverse flow, and one on each leg of a bend" width={280} height={170}>
      <PipeLine points={[{ x: 8, y: 16 }, { x: 272, y: 16 }]} weight="heavy" flow="forward" />
      <ProcessText x={8} y={36} anchor="start" quiet>
        Forward, one arrow per run
      </ProcessText>
      <PipeLine points={[{ x: 8, y: 66 }, { x: 272, y: 66 }]} weight="heavy" flow="reverse" />
      <ProcessText x={8} y={86} anchor="start" quiet>
        Reverse flow
      </ProcessText>
      <PipeLine points={[{ x: 8, y: 116 }, { x: 140, y: 116 }]} weight="heavy" flow="forward" />
      <PipeLine points={[{ x: 140, y: 116 }, { x: 140, y: 146 }, { x: 272, y: 146 }]} weight="heavy" />
      <FlowArrow x={206} y={146} />
      <ProcessText x={8} y={162} anchor="start" quiet>
        An arrow on each leg of a bend
      </ProcessText>
    </DiagramCanvas>
  );
}

function ProcessDiagramFlowStates() {
  const rows = [
    { y: 22, name: 'Flowing', dashed: false, weight: 'heavy', value: EXPORT_FLOW.value },
    { y: 78, name: 'No flow', dashed: true, weight: 'heavy', value: 0 },
    { y: 134, name: 'Not measured', dashed: true, weight: 'light', value: null },
  ] as const;
  return (
    <DiagramCanvas label="Flow shown without animation: a solid line with arrows when flowing, a dashed line with no arrows when not, and a light dashed line when the flow is not measured" width={280} height={160}>
      {rows.map((row) => (
        <g key={row.name}>
          <PipeLine points={[{ x: 8, y: row.y }, { x: 170, y: row.y }]} weight={row.weight} dashed={row.dashed} flow={row.dashed ? undefined : 'forward'} arrows={2} />
          <ProcessText x={8} y={row.y + 18} anchor="start" quiet>
            {row.name}
          </ProcessText>
          <ValueTag x={272} y={row.y - 10} anchor="end" value={row.value} unit="m³/h" />
        </g>
      ))}
    </DiagramCanvas>
  );
}

function ProcessDiagramBranch() {
  return (
    <DiagramCanvas label="A line of 412 cubic metres per hour splitting at a tee into 248 and 164" width={280} height={160}>
      <PipeLine points={[{ x: 8, y: 80 }, { x: 110, y: 80 }]} weight="heavy" flow="forward" />
      <PipeLine points={[{ x: 110, y: 80 }, { x: 110, y: 40 }, { x: 272, y: 40 }]} flow="forward" arrows={2} />
      <PipeLine points={[{ x: 110, y: 80 }, { x: 110, y: 120 }, { x: 272, y: 120 }]} flow="forward" arrows={2} />
      <circle cx={110} cy={80} r={3.5} className="fill-medium-foreground" />
      <ValueTag x={56} y={90} anchor="middle" value={412} unit="m³/h" />
      <ValueTag x={272} y={10} anchor="end" value={248} unit="m³/h" />
      <ValueTag x={272} y={130} anchor="end" value={164} unit="m³/h" />
    </DiagramCanvas>
  );
}

function ProcessDiagramUtilityLines() {
  const y = 100;
  const exchanger = place(COOLER, 'heat-exchanger', 230, y);
  const size = 52;
  const top = portOf(exchanger, 'top', size);
  const bottom = portOf(exchanger, 'bottom', size);
  return (
    <DiagramCanvas
      label={`Process gas cooled from ${DISCHARGE_TEMPERATURE.value} to ${COOLER_TEMPERATURE.value} degrees Celsius in the interstage cooler, with cooling water supply and return drawn as light lines`}
      width={460}
      height={200}
    >
      <PipeLine points={[{ x: 12, y }, portOf(exchanger, 'in', size)]} weight="heavy" flow="forward" />
      <PipeLine points={[portOf(exchanger, 'out', size), { x: 448, y }]} weight="heavy" flow="forward" />
      <PipeLine points={[{ x: 120, y: 184 }, { x: 230, y: 184 }, bottom]} weight="light" flow="forward" arrowSize={6} />
      <PipeLine points={[top, { x: 230, y: 20 }, { x: 340, y: 20 }]} weight="light" flow="forward" arrowSize={6} />
      <EquipmentSymbol kind="heat-exchanger" size={size} cx={230} cy={y} fill="solid" label={`${COOLER.tag} ${COOLER.name}, running`} />
      <ProcessText x={12} y={y - 10} anchor="start" quiet>
        Process gas
      </ProcessText>
      <ProcessText x={120} y={176} anchor="start" quiet>
        Cooling water supply
      </ProcessText>
      <ProcessText x={346} y={23} anchor="start" quiet>
        Cooling water return
      </ProcessText>
      <ProcessText x={268} y={y + 20} anchor="start" mono>
        {COOLER.tag}
      </ProcessText>
      <ValueTag x={110} y={36} anchor="middle" value={DISCHARGE_TEMPERATURE.value} unit="°C" decimals={1} leaderTo={{ x: 110, y }} />
      <ValueTag x={380} y={140} anchor="middle" value={COOLER_TEMPERATURE.value} unit="°C" decimals={1} leaderTo={{ x: 380, y }} />
    </DiagramCanvas>
  );
}

function ProcessDiagramValveInLine() {
  const y = 110;
  const control = 44;
  const isolation = 32;
  return (
    <DiagramCanvas label="A flow control loop: an open isolation valve, a control valve at 62 percent open and a flow transmitter reading 412 cubic metres per hour" width={460} height={180}>
      <PipeLine points={[{ x: 12, y }, { x: 90 - isolation / 3, y }]} weight="heavy" flow="forward" />
      <PipeLine points={[{ x: 90 + isolation / 3, y }, { x: 230 - control / 3, y }]} weight="heavy" flow="forward" />
      <PipeLine points={[{ x: 230 + control / 3, y }, { x: 448, y }]} weight="heavy" flow="forward" arrows={2} />
      <ValveSymbol type="gate" position="open" size={isolation} cx={90} cy={valveCentre(y, isolation)} label="Isolation valve" />
      <ValveSymbol type="control" position="open" size={control} cx={230} cy={valveCentre(y, control)} label="27-FV-20011 flow control valve, 62 percent" />
      <PipeLine points={[{ x: 340, y }, { x: 340, y: 60 }]} weight="light" dashed />
      <PipeLine points={[{ x: 326, y: 46 }, { x: 230, y: 46 }, { x: 230, y: valveCentre(y, control) - control / 2 + 6 }]} weight="light" dashed />
      <InstrumentBubble letters="FT" loop="20011" size={30} cx={340} cy={46} />
      <ValueTag x={364} y={36} value={EXPORT_FLOW.value} unit={EXPORT_FLOW.unit} />
      <ValueTag x={196} y={64} anchor="end" label="Position" value={62} unit="%" />
      <ProcessText x={230} y={y + 28} mono>
        27-FV-20011
      </ProcessText>
      <ProcessText x={90} y={y + 28} quiet>
        Open
      </ProcessText>
    </DiagramCanvas>
  );
}

function ProcessDiagramValueTag() {
  return (
    <DiagramCanvas label={`${DISCHARGE_PRESSURE.name} ${DISCHARGE_PRESSURE.value} barg`} width={160} height={52}>
      <ValueTag x={80} y={10} anchor="middle" label={DISCHARGE_PRESSURE.tag} mono value={DISCHARGE_PRESSURE.value} unit={DISCHARGE_PRESSURE.unit} decimals={1} />
    </DiagramCanvas>
  );
}

function ProcessDiagramInstrumentTap() {
  return (
    <DiagramCanvas label={`Pressure transmitter 92531 tapped off the discharge line, reading ${DISCHARGE_PRESSURE.value} barg`} width={260} height={120}>
      <PipeLine points={[{ x: 8, y: 96 }, { x: 252, y: 96 }]} weight="heavy" flow="forward" arrows={2} />
      <PipeLine points={[{ x: 110, y: 96 }, { x: 110, y: 52 }]} weight="light" dashed />
      <InstrumentBubble letters="PT" loop="92531" size={34} cx={110} cy={36} />
      <ValueTag x={136} y={26} value={DISCHARGE_PRESSURE.value} unit={DISCHARGE_PRESSURE.unit} decimals={1} />
    </DiagramCanvas>
  );
}

function ProcessDiagramUnitLabel() {
  const unit = place(COMPRESSOR_1, 'compressor', 110, 40);
  return (
    <DiagramCanvas label={`${COMPRESSOR_1.tag} ${COMPRESSOR_1.name}, running, with lines in and out`} width={220} height={100}>
      <PipeLine points={[{ x: 8, y: 40 }, portOf(unit, 'in')]} weight="heavy" flow="forward" />
      <PipeLine points={[portOf(unit, 'out'), { x: 212, y: 40 }]} weight="heavy" flow="forward" />
      <ProcessUnit unit={unit} />
    </DiagramCanvas>
  );
}

function ProcessDiagramValueLimits() {
  const tags = [
    { caption: 'Normal', label: DISCHARGE_PRESSURE.tag, value: DISCHARGE_PRESSURE.value, unit: 'barg', tone: 'neutral', flag: undefined },
    { caption: 'Low', label: SUCTION_PRESSURE.tag, value: 9.2, unit: 'barg', tone: 'warning', flag: 'L' },
    { caption: 'High', label: DISCHARGE_TEMPERATURE.tag, value: 146.3, unit: '°C', tone: 'warning', flag: 'H' },
    { caption: 'Trip limit', label: '23-VT-92740', value: 11.6, unit: 'mm/s', tone: 'critical', flag: 'HH' },
    { caption: 'No data', label: '40-TT-40015', value: null, unit: '°C', tone: 'neutral', flag: undefined },
  ] as const;
  return (
    <DiagramCanvas label="Value callouts by limit state: normal, low, high, at the trip limit and with no data" width={500} height={76}>
      {tags.map((tag, index) => (
        <g key={tag.caption}>
          <ValueTag x={50 + index * 100} y={8} anchor="middle" label={tag.label} mono value={tag.value} unit={tag.unit} decimals={1} tone={tag.tone} flag={tag.flag} width={88} />
          <ProcessText x={50 + index * 100} y={60} quiet>
            {tag.caption}
          </ProcessText>
        </g>
      ))}
    </DiagramCanvas>
  );
}

function ProcessDiagramStale() {
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <StatusIndicator size="sm" tone="warning" shape="ring" label="Data stale" detail={`since ${formatTime(REFERENCE_NOW - 14 * 60_000)} UTC · values hidden`} />
      <ProcessMiniTrain mode="stale" />
    </div>
  );
}

function ProcessDiagramSeparator() {
  const size = 120;
  const vessel = place(SEPARATOR, 'horizontal-separator', 220, 125);
  const top = portOf(vessel, 'top', size);
  const bottom = portOf(vessel, 'bottom', size);
  const levelY = bottom.y - ((bottom.y - top.y) * SEPARATOR_LEVEL.value) / 100;
  return (
    <DiagramCanvas
      label={`${SEPARATOR.tag} ${SEPARATOR.name} at ${SEPARATOR_PRESSURE.value} barg and ${SEPARATOR_LEVEL.value} percent level, with gas, oil and produced water outlets`}
      width={460}
      height={230}
    >
      <PipeLine points={[{ x: 12, y: 125 }, portOf(vessel, 'in', size)]} weight="heavy" flow="forward" />
      <PipeLine points={[top, { x: top.x, y: 44 }, { x: 448, y: 44 }]} weight="heavy" flow="forward" arrows={2} />
      <PipeLine points={[portOf(vessel, 'out', size), { x: 448, y: 125 }]} flow="forward" />
      <PipeLine points={[bottom, { x: bottom.x, y: 206 }, { x: 448, y: 206 }]} flow="forward" arrows={2} />
      <EquipmentSymbol kind="horizontal-separator" size={size} cx={vessel.x} cy={vessel.y} label={`${SEPARATOR.tag}, running`} />
      <path d={`M ${vessel.x - 44} ${levelY} H ${vessel.x + 14}`} strokeWidth={1.5} strokeDasharray="4 3" className="stroke-medium-foreground" />
      <PipeLine points={[{ x: 180, y: top.y }, { x: 180, y: 74 }]} weight="light" dashed />
      <InstrumentBubble letters="PT" loop="10010" size={30} cx={180} cy={59} />
      <ValueTag x={158} y={49} anchor="end" value={SEPARATOR_PRESSURE.value} unit={SEPARATOR_PRESSURE.unit} decimals={1} />
      <PipeLine points={[{ x: 180, y: bottom.y }, { x: 180, y: 190 }, { x: 137, y: 190 }]} weight="light" dashed />
      <InstrumentBubble letters="LT" loop="10012" size={30} cx={122} cy={190} />
      <ValueTag x={100} y={180} anchor="end" value={SEPARATOR_LEVEL.value} unit={SEPARATOR_LEVEL.unit} decimals={1} />
      <ProcessText x={448} y={34} anchor="end" quiet>
        Gas to compression
      </ProcessText>
      <ProcessText x={448} y={115} anchor="end" quiet>
        Oil to export
      </ProcessText>
      <ProcessText x={448} y={196} anchor="end" quiet>
        Produced water
      </ProcessText>
      <ProcessText x={290} y={166} anchor="start" mono>
        {SEPARATOR.tag}
      </ProcessText>
      <ProcessText x={290} y={179} anchor="start" quiet>
        {SEPARATOR.name}
      </ProcessText>
    </DiagramCanvas>
  );
}

function ProcessDiagramPumpSkid() {
  return <ProcessPumpSkid />;
}

function ProcessDiagramCoolingLoop() {
  const pump: PlacedUnit = { kind: 'centrifugal-pump', x: 130, y: 60, tag: '40-PA-4002', name: 'Cooling water pump B', state: 'running' };
  const exchanger = place(COOLER, 'heat-exchanger', 330, 60);
  const cooler: PlacedUnit = { kind: 'air-cooler', x: 240, y: 180, tag: '40-HA-4010', name: 'Cooling water cooler', state: 'running' };
  return (
    <DiagramCanvas label="Closed cooling water loop: pump B circulates 640 cubic metres per hour through the interstage cooler at 18.4 degrees supply and 31.6 degrees return, then through the cooling water cooler" width={460} height={240}>
      <PipeLine points={[{ x: 40, y: 180 }, { x: 40, y: 60 }, portOf(pump, 'in')]} flow="forward" arrows={2} />
      <PipeLine points={[portOf(pump, 'out'), portOf(exchanger, 'in')]} flow="forward" />
      <PipeLine points={[portOf(exchanger, 'out'), { x: 420, y: 60 }, { x: 420, y: 180 }, portOf(cooler, 'out')]} flow="forward" arrows={2} />
      <PipeLine points={[portOf(cooler, 'in'), { x: 40, y: 180 }]} flow="forward" />
      {[pump, exchanger, cooler].map((unit) => (
        <ProcessUnit key={unit.tag} unit={unit} />
      ))}
      <ValueTag x={230} y={14} anchor="middle" label="Supply" value={18.4} unit="°C" decimals={1} leaderTo={{ x: 230, y: 60 }} />
      <ValueTag x={410} y={104} anchor="end" label="Return" value={31.6} unit="°C" decimals={1} />
      <ValueTag x={50} y={104} label="Circulation" value={640} unit="m³/h" />
    </DiagramCanvas>
  );
}

function ProcessDiagramAlarmUnit() {
  const y = 112;
  const upstream = place(COMPRESSOR_2, 'compressor', 90, y);
  const tripped = place(RECOMPRESSOR, 'compressor', 240, y);
  const downstream = place(COOLER, 'heat-exchanger', 390, y);
  const alarm = ALARMS[0];
  return (
    <DiagramCanvas label={`${RECOMPRESSOR.tag} ${RECOMPRESSOR.name} highlighted: ${alarm.message}, ${alarm.value} against a limit of ${alarm.limit}`} width={460} height={200}>
      <rect x={176} y={12} width={128} height={176} rx={8} className="fill-critical-background" />
      <PipeLine points={[{ x: 12, y }, portOf(upstream, 'in')]} weight="heavy" flow="forward" />
      <PipeLine points={[portOf(upstream, 'out'), portOf(tripped, 'in')]} weight="heavy" dashed />
      <PipeLine points={[portOf(tripped, 'out'), portOf(downstream, 'in')]} weight="heavy" dashed />
      <PipeLine points={[portOf(downstream, 'out'), { x: 448, y }]} weight="heavy" dashed />
      <ProcessUnit unit={upstream} />
      <ProcessUnit unit={downstream} />
      <ProcessUnit unit={tripped} textClassName="fill-critical-foreground" />
      <ValueTag x={240} y={24} anchor="middle" label={alarm.sensorTag} mono value={11.6} unit="mm/s" decimals={1} tone="critical" flag="HH" />
      <ProcessText x={240} y={76} className="fill-critical-foreground font-medium">
        Tripped · high vibration
      </ProcessText>
    </DiagramCanvas>
  );
}

function ProcessDiagramCompressorTrain() {
  const y = 112;
  const scrubber: PlacedUnit = { kind: 'vertical-vessel', x: 100, y, tag: '23-VG-9100', name: 'Suction scrubber', state: 'running' };
  const stage1 = place(COMPRESSOR_1, 'compressor', 280, y);
  const cooler = place(COOLER, 'heat-exchanger', 460, y);
  const stage2 = place(COMPRESSOR_2, 'compressor', 640, y);
  const aftercooler: PlacedUnit = { kind: 'air-cooler', x: 820, y, tag: '23-HA-9124', name: 'Aftercooler', state: 'running' };
  const units = [scrubber, stage1, cooler, stage2, aftercooler];
  const instruments = [
    { letters: 'PT', loop: '92530', x: 190, above: true, value: SUCTION_PRESSURE.value, unit: 'barg' },
    { letters: 'PT', loop: '92531', x: 345, above: true, value: DISCHARGE_PRESSURE.value, unit: 'barg' },
    { letters: 'TT', loop: '92532', x: 395, above: false, value: DISCHARGE_TEMPERATURE.value, unit: '°C' },
    { letters: 'TT', loop: '91141', x: 550, above: true, value: COOLER_TEMPERATURE.value, unit: '°C' },
    { letters: 'PT', loop: '92631', x: 705, above: true, value: 112.4, unit: 'barg' },
    { letters: 'TT', loop: '92632', x: 755, above: false, value: 138.5, unit: '°C' },
  ];
  return (
    <DiagramCanvas
      label={`Two-stage gas compression train with suction scrubber, interstage cooler and aftercooler: suction ${SUCTION_PRESSURE.value} barg, first stage discharge ${DISCHARGE_PRESSURE.value} barg at ${DISCHARGE_TEMPERATURE.value} degrees, second stage discharge 112.4 barg at 138.5 degrees`}
      width={920}
      height={224}
    >
      <PipeLine points={[{ x: 12, y }, portOf(scrubber, 'in')]} weight="heavy" flow="forward" />
      {units.slice(1).map((unit, index) => (
        <PipeLine key={unit.tag} points={[portOf(units[index], 'out'), portOf(unit, 'in')]} weight="heavy" flow="forward" />
      ))}
      <PipeLine points={[portOf(aftercooler, 'out'), { x: 908, y }]} weight="heavy" flow="forward" />
      {units.map((unit) => (
        <ProcessUnit key={unit.tag} unit={unit} />
      ))}
      {instruments.map((instrument) => {
        const bubbleY = instrument.above ? y - 52 : y + 52;
        return (
          <g key={instrument.loop}>
            <PipeLine points={[{ x: instrument.x, y }, { x: instrument.x, y: instrument.above ? bubbleY + 15 : bubbleY - 15 }]} weight="light" dashed />
            <InstrumentBubble letters={instrument.letters} loop={instrument.loop} size={30} cx={instrument.x} cy={bubbleY} />
            <ValueTag x={instrument.x} y={instrument.above ? bubbleY - 42 : bubbleY + 22} anchor="middle" value={instrument.value} unit={instrument.unit} decimals={1} />
          </g>
        );
      })}
    </DiagramCanvas>
  );
}

function ProcessDiagramOneLine() {
  const y = 124;
  const valveSize = 36;
  const separator = place(SEPARATOR, 'horizontal-separator', 240, y);
  const compressor = place(COMPRESSOR_1, 'compressor', 420, y);
  const cooler = place(COOLER, 'heat-exchanger', 600, y);
  const liquid = portOf(separator, 'bottom');
  const tags = [
    { sensor: SEPARATOR_PRESSURE, x: 198, to: { x: 198, y } },
    { sensor: SEPARATOR_LEVEL, x: 282, to: { x: 282, y } },
    { sensor: SUCTION_PRESSURE, x: 366, to: { x: 366, y } },
    { sensor: DISCHARGE_PRESSURE, x: 478, to: { x: 478, y } },
    { sensor: DISCHARGE_TEMPERATURE, x: 562, to: { x: 540, y } },
    { sensor: COOLER_TEMPERATURE, x: 668, to: { x: 668, y } },
    { sensor: GAS_FLOW, x: 790, to: { x: 790, y } },
  ];
  return (
    <DiagramCanvas
      label={`One-line process from inlet to gas export: inlet shutdown valve open, inlet separator at ${SEPARATOR_PRESSURE.value} barg, 1st stage compressor discharging at ${DISCHARGE_PRESSURE.value} barg, interstage cooler outlet at ${COOLER_TEMPERATURE.value} degrees, ${GAS_FLOW.value} standard cubic metres per hour to export`}
      width={900}
      height={220}
    >
      <PipeLine points={[{ x: 12, y }, { x: 100 - valveSize / 3, y }]} weight="heavy" flow="forward" />
      <PipeLine points={[{ x: 100 + valveSize / 3, y }, portOf(separator, 'in')]} weight="heavy" flow="forward" />
      <PipeLine points={[portOf(separator, 'out'), portOf(compressor, 'in')]} weight="heavy" flow="forward" />
      <PipeLine points={[portOf(compressor, 'out'), portOf(cooler, 'in')]} weight="heavy" flow="forward" />
      <PipeLine points={[portOf(cooler, 'out'), { x: 888, y }]} weight="heavy" flow="forward" arrows={3} />
      <PipeLine points={[liquid, { x: liquid.x, y: 204 }, { x: 330, y: 204 }]} flow="forward" arrowSize={6} />
      <ValveSymbol type="shutdown" position="open" size={valveSize} cx={100} cy={valveCentre(y, valveSize)} label={INLET_VALVE.tag} />
      <ProcessText x={100} y={y + 28} mono>
        {INLET_VALVE.tag}
      </ProcessText>
      <ProcessText x={100} y={y + 41} quiet>
        Open
      </ProcessText>
      {[separator, compressor, cooler].map((unit) => (
        <ProcessUnit key={unit.tag} unit={unit} />
      ))}
      {tags.map((tag, index) => (
        <ValueTag
          key={tag.sensor.id}
          x={tag.x}
          y={index % 2 === 0 ? 10 : 50}
          anchor="middle"
          label={tag.sensor.tag}
          mono
          value={tag.sensor.value}
          unit={tag.sensor.unit}
          decimals={tag.sensor.decimals}
          leaderTo={tag.to}
          {...limitState(tag.sensor.value, tag.sensor)}
        />
      ))}
      <ProcessText x={12} y={y - 12} anchor="start" quiet>
        Inlet
      </ProcessText>
      <ProcessText x={888} y={y + 20} anchor="end" quiet>
        Gas export
      </ProcessText>
      <ProcessText x={336} y={207} anchor="start" quiet>
        Liquids to export pumps
      </ProcessText>
    </DiagramCanvas>
  );
}

function ProcessDiagramSelectable() {
  const y = 62;
  const units = [
    { asset: SEPARATOR, unit: place(SEPARATOR, 'horizontal-separator', 130, y) },
    { asset: COMPRESSOR_1, unit: place(COMPRESSOR_1, 'compressor', 330, y) },
    { asset: COOLER, unit: place(COOLER, 'heat-exchanger', 530, y) },
    { asset: PUMP_A, unit: place(PUMP_A, 'centrifugal-pump', 730, y) },
  ];
  const [selectedId, setSelectedId] = useState(COMPRESSOR_1.id);
  const selected = units.find(({ asset }) => asset.id === selectedId)?.asset ?? COMPRESSOR_1;
  const readings = sensorsOf(selected.id).slice(0, 4);
  return (
    <div className="flex w-full flex-col gap-4">
      <DiagramCanvas label="Process overview. Select a unit to see its readings" width={860} height={132} interactive>
        <PipeLine points={[{ x: 12, y }, portOf(units[0].unit, 'in')]} weight="heavy" flow="forward" />
        {units.slice(1).map(({ unit }, index) => (
          <PipeLine key={unit.tag} points={[portOf(units[index].unit, 'out'), portOf(unit, 'in')]} weight="heavy" flow="forward" />
        ))}
        <PipeLine points={[portOf(units[3].unit, 'out'), { x: 848, y }]} weight="heavy" flow="forward" />
        {units.map(({ asset, unit }) => (
          <DiagramHotspot
            key={asset.id}
            x={unit.x - 64}
            y={10}
            width={128}
            height={112}
            label={`${asset.tag} ${asset.name}`}
            selected={asset.id === selectedId}
            onSelect={() => setSelectedId(asset.id)}
          >
            <ProcessUnit unit={unit} />
          </DiagramHotspot>
        ))}
      </DiagramCanvas>
      <div aria-live="polite" className="flex flex-wrap items-center gap-x-10 gap-y-4 rounded-lg bg-muted-background p-4">
        <div className="flex min-w-48 flex-col gap-1">
          <span className="font-mono text-xs text-muted-foreground">{selected.tag}</span>
          <span className="text-sm font-medium text-base-foreground">{selected.name}</span>
          <StatusIndicator size="sm" {...runStateStatus(selected.state)} />
        </div>
        {readings.map((sensor) => (
          <div key={sensor.id} className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">{sensor.name}</span>
            <ValueReadout size="sm" value={sensor.value} unit={sensor.unit} decimals={sensor.decimals} tone={toneFromLimits(sensor.value, limitsOf(sensor))} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ProcessDiagramNormalVsUpset() {
  return (
    <div className="grid w-full grid-cols-1 gap-x-8 gap-y-6 lg:grid-cols-2">
      <figure className="flex flex-col gap-3">
        <figcaption className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-base-foreground">Normal</span>
          <StatusIndicator size="sm" tone="neutral" shape="ring" label="No active alarms" />
        </figcaption>
        <ProcessMiniTrain mode="normal" />
      </figure>
      <figure className="flex flex-col gap-3">
        <figcaption className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-base-foreground">Upset</span>
          <StatusIndicator size="sm" tone="warning" shape="square" label="2 readings above limit" />
        </figcaption>
        <ProcessMiniTrain mode="upset" />
      </figure>
    </div>
  );
}

function ProcessDiagramOverviewMap() {
  const [inlet, compression, exportArea, cooling] = ['nk-20', 'nk-23', 'nk-27', 'nk-40'].map(findAssetById);
  const alarmsIn = (area: Asset): number =>
    ALARMS.filter((alarm) => alarm.state === 'active' && ASSETS.some((asset) => asset.id === alarm.assetId && asset.parentId === area.id)).length;
  const arrow = <EquipmentSymbol kind="pipe" size="sm" label="flows to" />;
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2">
        <AreaBlock name={inlet.name} tag={inlet.tag} status={runStateStatus(inlet.state)} />
        {arrow}
        <AreaBlock name={compression.name} tag={compression.tag} status={runStateStatus(compression.state)} alarmCount={alarmsIn(compression)} selected />
        {arrow}
        <AreaBlock name={exportArea.name} tag={exportArea.tag} status={runStateStatus(exportArea.state)} alarmCount={alarmsIn(exportArea)} alarmTone="neutral" />
        <span className="col-start-3 flex justify-center">
          <EquipmentSymbol kind="pipe" size="sm" label="serves" className="-rotate-90" />
        </span>
        <AreaBlock className="col-start-3" name={cooling.name} tag={cooling.tag} status={runStateStatus(cooling.state)} />
      </div>
      <p className="text-xs text-muted-foreground">The outlined area is the one shown in the diagram below.</p>
    </div>
  );
}

function ProcessDiagramCompact() {
  const y = 30;
  const size = 28;
  const units: readonly PlacedUnit[] = [
    place(SEPARATOR, 'horizontal-separator', 44, y),
    place(COMPRESSOR_1, 'compressor', 104, y),
    place(COOLER, 'heat-exchanger', 164, y),
    place(COMPRESSOR_2, 'compressor', 224, y),
  ];
  return (
    <div className="flex flex-col items-center gap-3">
      <DiagramCanvas label="Thumbnail of the gas compression train: separator, first stage, cooler and second stage, all running" width={268} height={60}>
        <PipeLine points={[{ x: 8, y }, portOf(units[0], 'in', size)]} />
        {units.slice(1).map((unit, index) => (
          <PipeLine key={unit.tag} points={[portOf(units[index], 'out', size), portOf(unit, 'in', size)]} />
        ))}
        <PipeLine points={[portOf(units[3], 'out', size), { x: 260, y }]} flow="forward" arrowSize={6} />
        {units.map((unit) => (
          <ProcessUnit key={unit.tag} unit={unit} size={size} labels={false} />
        ))}
      </DiagramCanvas>
      <div className="flex flex-col items-center gap-1">
        <span className="text-sm font-medium text-base-foreground">Gas compression</span>
        <StatusIndicator size="sm" {...runStateStatus('running')} detail="4 of 4 units" />
      </div>
    </div>
  );
}

function ProcessDiagramWithLegend() {
  return (
    <div className="flex w-full flex-col gap-4">
      <ProcessPumpSkid />
      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 border-t border-default pt-3">
        <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <li className="flex items-center gap-2">
            <EquipmentSymbol kind="centrifugal-pump" size="sm" label="Filled symbol" {...runStateAppearance('running')} />
            Running
          </li>
          <li className="flex items-center gap-2">
            <EquipmentSymbol kind="centrifugal-pump" size="sm" label="Lightly filled symbol" {...runStateAppearance('standby')} />
            Standby
          </li>
          <li className="flex items-center gap-2">
            <EquipmentSymbol kind="pipe" size="sm" label="Solid line with arrow" />
            Flow
          </li>
          <li className="flex items-center gap-2">
            <svg role="img" aria-label="Dashed line" viewBox="0 0 24 24" className="size-6 text-medium-foreground">
              <path d="M 2 12 H 22" stroke="currentColor" strokeWidth={1.5} strokeDasharray="5 4" />
            </svg>
            No flow
          </li>
        </ul>
        <span className="text-xs text-muted-foreground tabular-nums">Live · {formatDateTime(REFERENCE_NOW)} UTC</span>
      </div>
    </div>
  );
}

function ProcessDiagramCard() {
  const area = findAssetById('nk-23');
  return (
    <Card className="w-full">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>{area.name}</CardTitle>
          <CardDescription>
            {area.tag} · updated {formatTime(REFERENCE_NOW)} UTC
          </CardDescription>
        </CardHeaderCenter>
        <CardHeaderEnd>
          <StatusIndicator variant="badge" tone="warning" label="2 above limit" />
        </CardHeaderEnd>
      </CardHeader>
      <CardContent>
        <ProcessMiniTrain mode="upset" />
      </CardContent>
      <CardFooter className="flex flex-wrap gap-x-6 gap-y-2">
        <StatusIndicator size="sm" {...runStateStatus('running')} detail="3 units" />
        <StatusIndicator size="sm" {...runStateStatus('tripped')} detail="0 units" />
        <StatusIndicator size="sm" tone="warning" shape="square" label="Above limit" detail={`${DISCHARGE_TEMPERATURE.tag}, ${COOLER_TEMPERATURE.tag}`} />
        <StatusIndicator size="sm" tone="neutral" shape="ring" label="Vibration" detail={`${VIBRATION.value} ${VIBRATION.unit}`} />
      </CardFooter>
    </Card>
  );
}

export default definePage({
  id: 'process-diagrams',
  title: 'Process diagrams',
  summary:
    'Simplified process schematics built from the equipment symbols: units joined by lines, with live values where they are measured. They show how the process hangs together and where it is off, not every pipe.',
  guidance: {
    use: [
      'Draw the process left to right with the main line heaviest and utilities light.',
      'Put each value next to the point it is measured, with its unit and, when abnormal, a letter flag.',
      'Keep everything grey until something is abnormal, then colour only that unit or reading.',
      'Give every diagram an accessible name that says what it shows and what is abnormal.',
    ],
    avoid: [
      'Copying the P&ID; a process display leaves out drains, vents and spares.',
      'Animated flow, spinning rotors or moving dashes; a static arrow says the same thing.',
      'More than a dozen live values on one diagram; split it into area views.',
      'Showing a stale value as if it were live; hide it and say since when.',
    ],
  },
  source,
  sections: [
    {
      id: 'lines',
      title: 'Lines and flow',
      description: 'Line weight says how important a line is; arrows and dashes say whether it flows.',
      specimens: [
        {
          id: 'ProcessDiagramFlowArrows',
          title: 'Flow direction arrows',
          note: 'Pick one arrow per straight run, and one on each leg where a line turns.',
          origin: 'custom',
          uses: ['industrial/diagrams/PipeLine.tsx', 'industrial/diagrams/FlowArrow.tsx', 'industrial/diagrams/DiagramCanvas.tsx'],
          Component: ProcessDiagramFlowArrows,
        },
        {
          id: 'ProcessDiagramFlowStates',
          title: 'Flow without animation',
          note: 'Pick it to show flowing, stopped and unmeasured lines by line style and a value, with nothing moving.',
          origin: 'custom',
          uses: ['industrial/diagrams/PipeLine.tsx', 'industrial/diagrams/ValueTag.tsx', 'industrial/diagrams/DiagramCanvas.tsx'],
          Component: ProcessDiagramFlowStates,
        },
        {
          id: 'ProcessDiagramBranch',
          title: 'Branch with split',
          note: 'Pick it where a line divides and people need to see how the flow is shared.',
          origin: 'custom',
          uses: ['industrial/diagrams/PipeLine.tsx', 'industrial/diagrams/ValueTag.tsx', 'industrial/diagrams/DiagramCanvas.tsx'],
          Component: ProcessDiagramBranch,
        },
        {
          id: 'ProcessDiagramUtilityLines',
          title: 'Process and utility lines',
          note: 'Pick it where a utility meets the process: the heavy line is the product, the light lines serve it.',
          origin: 'custom',
          uses: ['industrial/diagrams/PipeLine.tsx', 'industrial/diagrams/EquipmentSymbol.tsx', 'industrial/diagrams/ValueTag.tsx', 'industrial/diagrams/DiagramCanvas.tsx'],
          size: 'md',
          align: 'stretch',
          Component: ProcessDiagramUtilityLines,
        },
        {
          id: 'ProcessDiagramValveInLine',
          title: 'Valves and a control loop',
          note: 'Pick it for a controlled flow: the valve position, the measurement and the dashed signal between them.',
          origin: 'custom',
          uses: [
            'industrial/diagrams/ValveSymbol.tsx',
            'industrial/diagrams/InstrumentBubble.tsx',
            'industrial/diagrams/PipeLine.tsx',
            'industrial/diagrams/ValueTag.tsx',
            'industrial/diagrams/DiagramCanvas.tsx',
          ],
          size: 'md',
          align: 'stretch',
          Component: ProcessDiagramValveInLine,
        },
      ],
    },
    {
      id: 'values',
      title: 'Values and labels',
      description: 'Callouts carry the number, its unit and its limit state; labels carry the tag.',
      specimens: [
        {
          id: 'ProcessDiagramValueTag',
          title: 'Value callout',
          note: 'Pick it for every live value on a diagram: tag, number and unit in one quiet box.',
          origin: 'custom',
          uses: ['industrial/diagrams/ValueTag.tsx', 'industrial/diagrams/DiagramCanvas.tsx'],
          Component: ProcessDiagramValueTag,
        },
        {
          id: 'ProcessDiagramInstrumentTap',
          title: 'Instrument with value',
          note: 'Pick it when it matters where on the line a reading is taken; the dashed tap shows the point.',
          origin: 'custom',
          uses: ['industrial/diagrams/InstrumentBubble.tsx', 'industrial/diagrams/ValueTag.tsx', 'industrial/diagrams/PipeLine.tsx', 'industrial/diagrams/DiagramCanvas.tsx'],
          Component: ProcessDiagramInstrumentTap,
        },
        {
          id: 'ProcessDiagramUnitLabel',
          title: 'Unit with tag and name',
          note: 'Pick it for each piece of equipment: tag in monospace, name underneath, lines on the ports.',
          origin: 'custom',
          uses: ['industrial/diagrams/EquipmentSymbol.tsx', 'industrial/diagrams/PipeLine.tsx', 'industrial/diagrams/symbolPaths.ts', 'industrial/diagrams/DiagramCanvas.tsx'],
          Component: ProcessDiagramUnitLabel,
        },
        {
          id: 'ProcessDiagramValueLimits',
          title: 'Callouts by limit state',
          note: 'Pick it to see every state a callout takes; the tint always comes with a letter flag.',
          origin: 'custom',
          uses: ['industrial/diagrams/ValueTag.tsx', 'industrial/diagrams/DiagramCanvas.tsx'],
          size: 'md',
          align: 'stretch',
          Component: ProcessDiagramValueLimits,
        },
        {
          id: 'ProcessDiagramStale',
          title: 'Stale data',
          note: 'Pick it when the feed stops: the process stays drawn, the values go, and the diagram says since when.',
          origin: 'custom',
          uses: ['industrial/diagrams/ValueTag.tsx', 'industrial/diagrams/DiagramCanvas.tsx', 'industrial/StatusIndicator.tsx'],
          size: 'md',
          align: 'stretch',
          Component: ProcessDiagramStale,
        },
      ],
    },
    {
      id: 'units',
      title: 'Unit schematics',
      description: 'One unit or skid with the instruments that describe it.',
      specimens: [
        {
          id: 'ProcessDiagramSeparator',
          title: 'Separator with level and pressure',
          note: 'Pick it for a vessel: inlet, three outlets, and the level drawn inside as well as printed.',
          origin: 'custom',
          uses: [
            'industrial/diagrams/EquipmentSymbol.tsx',
            'industrial/diagrams/InstrumentBubble.tsx',
            'industrial/diagrams/PipeLine.tsx',
            'industrial/diagrams/ValueTag.tsx',
            'industrial/diagrams/DiagramCanvas.tsx',
          ],
          size: 'md',
          align: 'stretch',
          Component: ProcessDiagramSeparator,
        },
        {
          id: 'ProcessDiagramPumpSkid',
          title: 'Pump skid, duty and standby',
          note: 'Pick it for parallel machines: the duty branch is solid and filled, the standby branch dashed and light.',
          origin: 'custom',
          uses: ['industrial/diagrams/EquipmentSymbol.tsx', 'industrial/diagrams/PipeLine.tsx', 'industrial/diagrams/ValueTag.tsx', 'industrial/diagrams/symbolState.ts', 'industrial/diagrams/DiagramCanvas.tsx'],
          size: 'md',
          align: 'stretch',
          Component: ProcessDiagramPumpSkid,
        },
        {
          id: 'ProcessDiagramCoolingLoop',
          title: 'Cooling loop',
          note: 'Pick it for a closed utility loop, where supply and return temperatures tell the story.',
          origin: 'custom',
          uses: ['industrial/diagrams/EquipmentSymbol.tsx', 'industrial/diagrams/PipeLine.tsx', 'industrial/diagrams/ValueTag.tsx', 'industrial/diagrams/DiagramCanvas.tsx'],
          size: 'md',
          align: 'stretch',
          Component: ProcessDiagramCoolingLoop,
        },
        {
          id: 'ProcessDiagramAlarmUnit',
          title: 'Alarm on one unit',
          note: 'Pick it when a unit trips: a tinted field, the cause in words, and the lines it has stopped feeding dashed.',
          origin: 'custom',
          uses: ['industrial/diagrams/EquipmentSymbol.tsx', 'industrial/diagrams/PipeLine.tsx', 'industrial/diagrams/ValueTag.tsx', 'industrial/diagrams/symbolState.ts', 'industrial/diagrams/DiagramCanvas.tsx'],
          size: 'md',
          align: 'stretch',
          Component: ProcessDiagramAlarmUnit,
        },
        {
          id: 'ProcessDiagramCompressorTrain',
          title: 'Compressor train',
          note: 'Pick it for a multi-stage train: suction and discharge instruments sit on the line between the stages.',
          origin: 'custom',
          uses: [
            'industrial/diagrams/EquipmentSymbol.tsx',
            'industrial/diagrams/InstrumentBubble.tsx',
            'industrial/diagrams/PipeLine.tsx',
            'industrial/diagrams/ValueTag.tsx',
            'industrial/diagrams/DiagramCanvas.tsx',
          ],
          size: 'full',
          align: 'stretch',
          Component: ProcessDiagramCompressorTrain,
        },
      ],
    },
    {
      id: 'process',
      title: 'Whole process',
      description: 'The process from inlet to export, to read, to explore and to compare.',
      specimens: [
        {
          id: 'ProcessDiagramOneLine',
          title: 'One-line process with live values',
          note: 'Pick it as the overview of a plant or area: the main path, its key units and under a dozen readings.',
          origin: 'custom',
          uses: [
            'industrial/diagrams/EquipmentSymbol.tsx',
            'industrial/diagrams/ValveSymbol.tsx',
            'industrial/diagrams/PipeLine.tsx',
            'industrial/diagrams/ValueTag.tsx',
            'industrial/diagrams/symbolPaths.ts',
            'industrial/diagrams/DiagramCanvas.tsx',
          ],
          size: 'full',
          align: 'stretch',
          Component: ProcessDiagramOneLine,
        },
        {
          id: 'ProcessDiagramSelectable',
          title: 'Selectable units with detail',
          note: 'Pick it when the diagram is the navigation: select a unit and its readings appear underneath.',
          origin: 'custom',
          uses: ['industrial/diagrams/DiagramHotspot.tsx', 'industrial/diagrams/EquipmentSymbol.tsx', 'industrial/diagrams/PipeLine.tsx', 'industrial/diagrams/DiagramCanvas.tsx', 'industrial/ValueReadout.tsx', 'industrial/StatusIndicator.tsx'],
          size: 'full',
          align: 'stretch',
          Component: ProcessDiagramSelectable,
        },
        {
          id: 'ProcessDiagramNormalVsUpset',
          title: 'Normal and upset',
          note: 'Pick it to check a design: the normal view should be almost colourless, so the upset is found in a second.',
          origin: 'custom',
          uses: ['industrial/diagrams/EquipmentSymbol.tsx', 'industrial/diagrams/PipeLine.tsx', 'industrial/diagrams/ValueTag.tsx', 'industrial/diagrams/DiagramCanvas.tsx', 'industrial/StatusIndicator.tsx'],
          size: 'full',
          align: 'stretch',
          Component: ProcessDiagramNormalVsUpset,
        },
      ],
    },
    {
      id: 'framed',
      title: 'Framed for a screen',
      description: 'A diagram with the context around it: where it sits in the plant, what the marks mean, how fresh it is.',
      specimens: [
        {
          id: 'ProcessDiagramOverviewMap',
          title: 'Plant area mini-map',
          note: 'Pick it above an area diagram, to show which part of the plant is on screen and what feeds it.',
          origin: 'custom',
          uses: ['industrial/diagrams/AreaBlock.tsx', 'industrial/diagrams/EquipmentSymbol.tsx', 'industrial/status.ts'],
          size: 'lg',
          align: 'stretch',
          Component: ProcessDiagramOverviewMap,
        },
        {
          id: 'ProcessDiagramCompact',
          title: 'Thumbnail',
          note: 'Pick it in a card or list as a picture of the area; no tags, no values, just the shape of the process.',
          origin: 'custom',
          uses: ['industrial/diagrams/EquipmentSymbol.tsx', 'industrial/diagrams/PipeLine.tsx', 'industrial/diagrams/DiagramCanvas.tsx', 'industrial/StatusIndicator.tsx'],
          Component: ProcessDiagramCompact,
        },
        {
          id: 'ProcessDiagramWithLegend',
          title: 'With legend and time stamp',
          note: 'Pick it for any diagram that leaves the control room: a report, a handover, a shared link.',
          origin: 'custom',
          uses: ['industrial/diagrams/EquipmentSymbol.tsx', 'industrial/diagrams/PipeLine.tsx', 'industrial/diagrams/ValueTag.tsx', 'industrial/diagrams/symbolState.ts', 'industrial/diagrams/DiagramCanvas.tsx'],
          size: 'md',
          align: 'stretch',
          Component: ProcessDiagramWithLegend,
        },
        {
          id: 'ProcessDiagramCard',
          title: 'Card with status summary',
          note: 'Pick it on a dashboard: the header names the area and its worst state, the footer counts what is behind it.',
          origin: 'custom',
          uses: ['industrial/diagrams/EquipmentSymbol.tsx', 'industrial/diagrams/PipeLine.tsx', 'industrial/diagrams/ValueTag.tsx', 'industrial/diagrams/DiagramCanvas.tsx', 'industrial/StatusIndicator.tsx'],
          size: 'md',
          align: 'stretch',
          Component: ProcessDiagramCard,
        },
      ],
    },
  ],
});
