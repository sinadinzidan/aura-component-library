import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardHeaderCenter, CardHeaderEnd, CardTitle } from '@cognite/aura/components/card';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { Breaker } from '../../../library/industrial/diagrams/Breaker';
import { DiagramCanvas } from '../../../library/industrial/diagrams/DiagramCanvas';
import { DiagramHotspot } from '../../../library/industrial/diagrams/DiagramHotspot';
import { EquipmentSymbol } from '../../../library/industrial/diagrams/EquipmentSymbol';
import { PipeLine } from '../../../library/industrial/diagrams/PipeLine';
import { symbolPort } from '../../../library/industrial/diagrams/symbolPaths';
import type { SymbolKind } from '../../../library/industrial/diagrams/symbolPaths';
import { breakerStatus, runStateAppearance } from '../../../library/industrial/diagrams/symbolState';
import type { BreakerState } from '../../../library/industrial/diagrams/symbolState';
import { ValueTag } from '../../../library/industrial/diagrams/ValueTag';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { HOUR, MINUTE, REFERENCE_NOW, formatDateTime, formatTime } from '../../data/series';
import { definePage } from '../../types';

import source from './single-line-diagrams.tsx?raw';

type SldFeeder = {
  /** Breaker designation on the board. */
  id: string;
  /** Tag of the load it feeds. */
  tag: string;
  name: string;
  kind: SymbolKind;
  breaker: BreakerState;
  kw: number;
  amps: number;
  /** Shown when the breaker is not closed. */
  reason?: string;
  operatedAt: number;
};

/** Feeders of the Nordkapp 690 V main switchboard, 82-EN-001. Tags match the plant's equipment. */
const FEEDERS: readonly SldFeeder[] = [
  { id: 'Q11', tag: '27-PA-2001A', name: 'Export pump A', kind: 'motor', breaker: 'closed', kw: 88, amps: 86.2, operatedAt: REFERENCE_NOW - 41 * 24 * HOUR },
  { id: 'Q12', tag: '27-PA-2001B', name: 'Export pump B', kind: 'motor', breaker: 'open', kw: 0, amps: 0, reason: 'Standby', operatedAt: REFERENCE_NOW - 34 * 24 * HOUR },
  { id: 'Q13', tag: '40-PA-4001', name: 'Cooling water pump', kind: 'motor', breaker: 'open', kw: 0, amps: 0, reason: 'Isolated', operatedAt: REFERENCE_NOW - 9 * HOUR },
  { id: 'Q14', tag: '40-PA-4002', name: 'Cooling water pump B', kind: 'motor', breaker: 'closed', kw: 75, amps: 74.0, operatedAt: REFERENCE_NOW - 9 * HOUR },
  { id: 'Q15', tag: '23-HA-9124', name: 'Aftercooler fans', kind: 'motor', breaker: 'closed', kw: 45, amps: 44.3, operatedAt: REFERENCE_NOW - 12 * 24 * HOUR },
  { id: 'Q16', tag: '71-GA-0012', name: 'Ventilation supply fan', kind: 'motor', breaker: 'tripped', kw: 0, amps: 0, reason: 'Earth fault', operatedAt: REFERENCE_NOW - 26 * MINUTE },
];

const TOTAL_KW = FEEDERS.reduce((sum, feeder) => sum + feeder.kw, 0);
const TOTAL_AMPS = FEEDERS.reduce((sum, feeder) => sum + feeder.amps, 0);
const countBreakers = (state: BreakerState): number => FEEDERS.filter((feeder) => feeder.breaker === state).length;

/** Symbol size on every single-line diagram of this page, in diagram units. */
const SYM = 28;
const BREAKER = 24;

const TH = 'px-3 py-2 text-left text-xs font-medium text-muted-foreground';
const TD = 'px-3 py-2 align-middle';

/** Text on a diagram: designations in monospace, notes in the quiet colour. */
function SingleLineText({
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
    <text x={x} y={y} fontSize={10} textAnchor={anchor} className={className ?? `tabular-nums ${quiet ? 'fill-muted-foreground' : 'fill-base-foreground'} ${mono ? 'font-mono' : ''}`}>
      {children}
    </text>
  );
}

/** A busbar: heavy and solid when energised, light and dashed when dead, and labelled either way. */
function SingleLineBus({
  x1,
  x2,
  y,
  label,
  live = true,
  labelAt = 'start',
  labelBelow = false,
}: {
  x1: number;
  x2: number;
  y: number;
  label: string;
  live?: boolean;
  labelAt?: 'start' | 'end';
  labelBelow?: boolean;
}) {
  return (
    <g>
      <PipeLine points={[{ x: x1, y }, { x: x2, y }]} weight={live ? 'heavy' : 'light'} dashed={!live} />
      <SingleLineText x={labelAt === 'start' ? x1 : x2} y={labelBelow ? y + 18 : y - 9} anchor={labelAt} quiet>
        {live ? label : `${label} · de-energised`}
      </SingleLineText>
    </g>
  );
}

/** One feeder dropping from a bus: breaker, conductor, load symbol and its load values. */
function SingleLineFeeder({ feeder, x, busY, compact = false, live = true }: { feeder: SldFeeder; x: number; busY: number; compact?: boolean; live?: boolean }) {
  const energised = live && feeder.breaker === 'closed';
  const breakerY = busY + 34;
  const loadY = busY + 92;
  const textY = loadY + SYM / 2 + 14;
  return (
    <g>
      <PipeLine points={[{ x, y: busY }, { x, y: breakerY - 10 }]} weight={live ? 'normal' : 'light'} dashed={!live} />
      <PipeLine points={[{ x, y: breakerY + 10 }, symbolPort(feeder.kind, 'top', x, loadY, SYM)]} weight={energised ? 'normal' : 'light'} dashed={!energised} />
      <Breaker state={feeder.breaker} size={BREAKER} cx={x} cy={breakerY} label={`${feeder.id} ${feeder.name}`} />
      <EquipmentSymbol kind={feeder.kind} size={SYM} cx={x} cy={loadY} fill={energised ? 'solid' : 'none'} label={`${feeder.tag} ${feeder.name}`} />
      <SingleLineText x={x + 16} y={breakerY + 4} anchor="start" mono quiet>
        {feeder.id}
      </SingleLineText>
      <SingleLineText x={x} y={textY} mono>
        {feeder.tag}
      </SingleLineText>
      {feeder.breaker === 'closed' ? (
        <SingleLineText x={x} y={textY + 14}>
          {compact ? `${feeder.kw} kW` : `${feeder.kw} kW · ${feeder.amps.toFixed(1)} A`}
        </SingleLineText>
      ) : (
        <SingleLineText x={x} y={textY + 14} className={feeder.breaker === 'tripped' ? 'fill-critical-foreground-strong font-medium' : 'fill-muted-foreground'}>
          {feeder.breaker === 'tripped' ? `Tripped · ${feeder.reason ?? 'fault'}` : `Open · ${feeder.reason ?? 'off'}`}
        </SingleLineText>
      )}
    </g>
  );
}

/** The 690 V switchboard: an incomer on top, a bus, and the feeders spread along it. */
function SingleLineBoard({ feeders, spacing, compact = false }: { feeders: readonly SldFeeder[]; spacing: number; compact?: boolean }) {
  const busY = 70;
  const first = spacing / 2 + 10;
  const width = feeders.length * spacing + 20;
  const incomerX = width / 2;
  const closed = feeders.filter((feeder) => feeder.breaker === 'closed');
  const tripped = feeders.filter((feeder) => feeder.breaker === 'tripped');
  return (
    <DiagramCanvas
      label={`690 volt main switchboard 82-EN-001 with ${feeders.length} feeders: ${closed.length} closed carrying ${closed.reduce((sum, feeder) => sum + feeder.kw, 0)} kilowatts, ${tripped.length} tripped`}
      width={width}
      height={220}
    >
      <PipeLine points={[{ x: incomerX, y: 6 }, { x: incomerX, y: 26 }]} flow="forward" arrowSize={6} />
      <PipeLine points={[{ x: incomerX, y: 46 }, { x: incomerX, y: busY }]} />
      <Breaker state="closed" size={BREAKER} cx={incomerX} cy={36} label="Q01 incomer from transformer T1" />
      <SingleLineText x={incomerX + 16} y={32} anchor="start" mono quiet>
        Q01
      </SingleLineText>
      <SingleLineText x={incomerX + 16} y={45} anchor="start" quiet>
        Incomer from T1
      </SingleLineText>
      <SingleLineBus x1={12} x2={width - 12} y={busY} label="82-EN-001 · 690 V" />
      {feeders.map((feeder, index) => (
        <SingleLineFeeder key={feeder.id} feeder={feeder} x={first + index * spacing} busY={busY} compact={compact} />
      ))}
    </DiagramCanvas>
  );
}

/** A figure with a caption, for the element specimens. */
function SingleLineFigure({ caption, detail, children }: { caption: string; detail?: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-2 text-center">
      {children}
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-base-foreground">{caption}</span>
        {detail ? <span className="text-xs text-muted-foreground">{detail}</span> : null}
      </div>
    </div>
  );
}

function SingleLineBreakerStates() {
  const states: readonly BreakerState[] = ['closed', 'open', 'tripped'];
  return (
    <div className="flex items-start gap-8">
      {states.map((state) => (
        <div key={state} className="flex flex-col items-center gap-3">
          <Breaker state={state} size="lg" />
          <StatusIndicator size="sm" {...breakerStatus(state)} />
        </div>
      ))}
    </div>
  );
}

function SingleLineBusbar() {
  return (
    <DiagramCanvas label="A 690 volt busbar with three feeder drops, reading 692 volts" width={280} height={110}>
      <SingleLineBus x1={12} x2={268} y={64} label="Bus A · 690 V" />
      {[60, 140, 220].map((x) => (
        <PipeLine key={x} points={[{ x, y: 64 }, { x, y: 100 }]} />
      ))}
      <ValueTag x={268} y={12} anchor="end" value={692} unit="V" />
    </DiagramCanvas>
  );
}

function SingleLineFeederSingle() {
  return (
    <DiagramCanvas label={`Feeder ${FEEDERS[0].id} to ${FEEDERS[0].name}: breaker closed, ${FEEDERS[0].kw} kilowatts, ${FEEDERS[0].amps} amperes`} width={220} height={180}>
      <SingleLineBus x1={30} x2={190} y={28} label="Bus A" />
      <SingleLineFeeder feeder={FEEDERS[0]} x={110} busY={28} />
    </DiagramCanvas>
  );
}

function SingleLineElements() {
  return (
    <div className="grid w-full grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4">
      <SingleLineFigure caption="Busbar" detail="Heavy line, feeders drop from it">
        <svg role="img" aria-label="Busbar" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" className="size-12 text-medium-foreground">
          <path d="M 2 9 H 22" strokeWidth={3} vectorEffect="non-scaling-stroke" />
          <path d="M 7 9 V 19 M 17 9 V 19" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
        </svg>
      </SingleLineFigure>
      <SingleLineFigure caption="Breaker" detail="Switches load and clears faults">
        <Breaker state="closed" size="lg" />
      </SingleLineFigure>
      <SingleLineFigure caption="Disconnector" detail="Isolates, never under load">
        <EquipmentSymbol kind="disconnector" size="lg" />
      </SingleLineFigure>
      <SingleLineFigure caption="Transformer" detail="Between two voltage levels">
        <EquipmentSymbol kind="transformer" size="lg" />
      </SingleLineFigure>
      <SingleLineFigure caption="Generator" detail="A source on the bus">
        <EquipmentSymbol kind="generator" size="lg" />
      </SingleLineFigure>
      <SingleLineFigure caption="Motor load" detail="A pump, fan or compressor drive">
        <EquipmentSymbol kind="motor" size="lg" />
      </SingleLineFigure>
      <SingleLineFigure caption="Feeder" detail="Outgoing supply to another board">
        <EquipmentSymbol kind="load" size="lg" />
      </SingleLineFigure>
      <SingleLineFigure caption="Earth" detail="Connection to ground">
        <EquipmentSymbol kind="earth" size="lg" />
      </SingleLineFigure>
    </div>
  );
}

function SingleLineEarthed() {
  const feeder = FEEDERS[2];
  const x = 80;
  const busY = 28;
  const loadY = busY + 126;
  return (
    <DiagramCanvas label={`Feeder ${feeder.id} to ${feeder.name}: breaker open and the cable earthed for work order WO-104479`} width={240} height={212}>
      <SingleLineBus x1={20} x2={220} y={busY} label="Bus A" />
      <PipeLine points={[{ x, y: busY }, { x, y: busY + 24 }]} />
      <Breaker state="open" size={BREAKER} cx={x} cy={busY + 34} label={`${feeder.id} ${feeder.name}`} />
      <PipeLine points={[{ x, y: busY + 44 }, symbolPort('motor', 'top', x, loadY, SYM)]} weight="light" dashed />
      <PipeLine points={[{ x, y: busY + 70 }, { x: 150, y: busY + 70 }]} weight="light" />
      <EquipmentSymbol kind="earth" size={SYM} cx={150} cy={busY + 70 + SYM / 2 - SYM / 12} label="Earthing switch closed" />
      <EquipmentSymbol kind="motor" size={SYM} cx={x} cy={loadY} label={`${feeder.tag}, isolated`} {...runStateAppearance('maintenance')} />
      <SingleLineText x={x + 16} y={busY + 38} anchor="start" mono quiet>
        {feeder.id}
      </SingleLineText>
      <SingleLineText x={172} y={busY + 86} anchor="start">
        Earthed
      </SingleLineText>
      <SingleLineText x={172} y={busY + 99} anchor="start" mono quiet>
        WO-104479
      </SingleLineText>
      <SingleLineText x={x} y={loadY + 28} mono>
        {feeder.tag}
      </SingleLineText>
      <SingleLineText x={x} y={loadY + 42} quiet>
        Isolated for work
      </SingleLineText>
    </DiagramCanvas>
  );
}

function SingleLineEnergised() {
  const busY = 44;
  return (
    <DiagramCanvas
      label="Two bus sections with the bus tie open: bus A energised and drawn heavy and solid, bus B de-energised and drawn light and dashed"
      width={460}
      height={150}
    >
      <SingleLineBus x1={20} x2={206} y={busY} label="Bus A · energised" />
      <SingleLineBus x1={254} x2={440} y={busY} label="Bus B" live={false} labelAt="end" />
      <Breaker state="open" orientation="horizontal" size={BREAKER} cx={230} cy={busY} label="Q03 bus tie" />
      <PipeLine points={[{ x: 206, y: busY }, { x: 220, y: busY }]} />
      <PipeLine points={[{ x: 240, y: busY }, { x: 254, y: busY }]} weight="light" dashed />
      <SingleLineText x={230} y={busY + 26} mono quiet>
        Q03
      </SingleLineText>
      {[70, 150].map((x) => (
        <g key={x}>
          <PipeLine points={[{ x, y: busY }, { x, y: busY + 24 }]} />
          <Breaker state="closed" size={BREAKER} cx={x} cy={busY + 34} />
          <PipeLine points={[{ x, y: busY + 44 }, { x, y: busY + 74 }]} flow="forward" arrowSize={6} />
        </g>
      ))}
      {[310, 390].map((x) => (
        <g key={x}>
          <PipeLine points={[{ x, y: busY }, { x, y: busY + 24 }]} weight="light" dashed />
          <Breaker state="open" size={BREAKER} cx={x} cy={busY + 34} />
          <PipeLine points={[{ x, y: busY + 44 }, { x, y: busY + 74 }]} weight="light" dashed />
        </g>
      ))}
      <SingleLineText x={110} y={busY + 94} quiet>
        Live: heavy, solid, with flow
      </SingleLineText>
      <SingleLineText x={350} y={busY + 94} quiet>
        Dead: light, dashed, no arrows
      </SingleLineText>
    </DiagramCanvas>
  );
}

function SingleLinePowerFlow() {
  const busY = 92;
  const lines = [
    { x: 90, from: 10, to: busY, label: 'Grid import', kw: 310, tagY: 28 },
    { x: 230, from: 10, to: busY, label: 'Solar', kw: 180, tagY: 28 },
    { x: 160, from: busY, to: 176, label: 'Process loads', kw: 420, tagY: 122 },
    { x: 330, from: busY, to: 176, label: 'Battery charging', kw: 70, tagY: 122 },
  ];
  return (
    <DiagramCanvas label="Power flow on a 690 volt bus: 310 kilowatts imported from the grid and 180 from solar, 420 to process loads and 70 charging the battery" width={460} height={186}>
      <SingleLineBus x1={20} x2={440} y={busY} label="Bus A · 690 V" labelAt="end" />
      {lines.map((line) => (
        <g key={line.label}>
          <PipeLine points={[{ x: line.x, y: line.from }, { x: line.x, y: line.to }]} flow="forward" arrows={2} arrowSize={7} />
          <ValueTag x={line.x + 12} y={line.tagY} label={line.label} value={line.kw} unit="kW" />
        </g>
      ))}
    </DiagramCanvas>
  );
}

function SingleLineTransformerIncomer() {
  const x = 70;
  return (
    <DiagramCanvas label="Incomer from the 11 kilovolt network: disconnector, breaker, a 2.5 MVA transformer to 690 volts, and the low-voltage breaker onto bus A" width={240} height={236}>
      <SingleLineText x={x + 16} y={14} anchor="start" quiet>
        11 kV network
      </SingleLineText>
      <PipeLine points={[{ x, y: 6 }, { x, y: 24 }]} />
      <EquipmentSymbol kind="disconnector" size={SYM} cx={x} cy={36} label="Disconnector, shown open" />
      <PipeLine points={[{ x, y: 48 }, { x, y: 66 }]} />
      <Breaker state="closed" size={BREAKER} cx={x} cy={76} label="Q-HV1 high-voltage breaker" />
      <PipeLine points={[{ x, y: 86 }, { x, y: 104 }]} />
      <EquipmentSymbol kind="transformer" size={36} cx={x} cy={120} label="Transformer T1, 11 to 0.69 kilovolts" />
      <PipeLine points={[{ x, y: 136 }, { x, y: 158 }]} flow="forward" arrowSize={6} />
      <Breaker state="closed" size={BREAKER} cx={x} cy={168} label="Q01 incomer" />
      <PipeLine points={[{ x, y: 178 }, { x, y: 204 }]} />
      <SingleLineBus x1={16} x2={224} y={204} label="Bus A · 690 V" labelAt="end" />
      <SingleLineText x={x + 16} y={80} anchor="start" mono quiet>
        Q-HV1
      </SingleLineText>
      <SingleLineText x={x + 24} y={117} anchor="start" mono>
        T1
      </SingleLineText>
      <SingleLineText x={x + 24} y={130} anchor="start" quiet>
        11 / 0.69 kV · 2.5 MVA
      </SingleLineText>
      <SingleLineText x={x + 16} y={172} anchor="start" mono quiet>
        Q01
      </SingleLineText>
    </DiagramCanvas>
  );
}

function SingleLineMeterCallouts() {
  return (
    <DiagramCanvas label={`Bus A measurements: 692 volts, 50.0 hertz, ${TOTAL_KW} kilowatts`} width={280} height={120}>
      <SingleLineBus x1={12} x2={268} y={92} label="Bus A" />
      <ValueTag x={52} y={20} anchor="middle" label="Voltage" value={692} unit="V" leaderTo={{ x: 52, y: 92 }} />
      <ValueTag x={140} y={20} anchor="middle" label="Frequency" value={50} unit="Hz" decimals={1} leaderTo={{ x: 140, y: 92 }} />
      <ValueTag x={228} y={20} anchor="middle" label="Load" value={TOTAL_KW} unit="kW" leaderTo={{ x: 228, y: 92 }} />
    </DiagramCanvas>
  );
}

function SingleLineGeneratorSet() {
  const x = 80;
  const busY = 138;
  return (
    <DiagramCanvas label="Emergency generator 82-EG-001 running at 640 kilowatts and 50.0 hertz, feeding the emergency bus through breaker Q20" width={280} height={222}>
      <EquipmentSymbol kind="generator" size={40} cx={x} cy={34} fill="solid" label="82-EG-001 emergency generator, running" />
      <PipeLine points={[{ x, y: 47.5 }, { x, y: 88 }]} flow="forward" arrowSize={6} />
      <Breaker state="closed" size={BREAKER} cx={x} cy={98} label="Q20 generator breaker" />
      <PipeLine points={[{ x, y: 108 }, { x, y: busY }]} />
      <SingleLineBus x1={16} x2={264} y={busY} label="Emergency bus · 690 V" labelAt="end" />
      <SingleLineText x={x + 28} y={30} anchor="start" mono>
        82-EG-001
      </SingleLineText>
      <SingleLineText x={x + 28} y={43} anchor="start" quiet>
        Emergency generator
      </SingleLineText>
      <SingleLineText x={x + 16} y={102} anchor="start" mono quiet>
        Q20
      </SingleLineText>
      <ValueTag x={264} y={60} anchor="end" value={640} unit="kW" />
      <ValueTag x={264} y={86} anchor="end" value={50} unit="Hz" decimals={1} />
      {[
        { x: 80, name: 'Essential loads' },
        { x: 200, name: 'Emergency lighting' },
      ].map((load) => (
        <g key={load.name}>
          <PipeLine points={[{ x: load.x, y: busY }, { x: load.x, y: busY + 22 }]} />
          <EquipmentSymbol kind="load" size={SYM} cx={load.x} cy={busY + 32} label={load.name} />
          <SingleLineText x={load.x} y={busY + 66} quiet>
            {load.name}
          </SingleLineText>
        </g>
      ))}
    </DiagramCanvas>
  );
}

function SingleLineSwitchboard() {
  return <SingleLineBoard feeders={FEEDERS} spacing={136} />;
}

function SingleLineIncomerBusTie() {
  const busY = 112;
  const incomers = [
    { x: 220, name: 'T1', breaker: 'Q01', amps: 204.5 },
    { x: 640, name: 'T2', breaker: 'Q02', amps: 0 },
  ];
  const positions = [110, 220, 330, 530, 640, 750];
  return (
    <DiagramCanvas
      label="Two incomers and a bus tie: transformer T1 feeds bus A through Q01, transformer T2 feeds bus B through Q02, and bus tie Q03 is open, so each bus stands on its own incomer"
      width={860}
      height={266}
    >
      {incomers.map((incomer) => (
        <g key={incomer.name}>
          <PipeLine points={[{ x: incomer.x, y: 6 }, { x: incomer.x, y: 20 }]} />
          <EquipmentSymbol kind="transformer" size={32} cx={incomer.x} cy={34} label={`Transformer ${incomer.name}`} />
          <PipeLine points={[{ x: incomer.x, y: 48 }, { x: incomer.x, y: 66 }]} flow="forward" arrowSize={6} />
          <Breaker state="closed" size={BREAKER} cx={incomer.x} cy={76} label={`${incomer.breaker} incomer from ${incomer.name}`} />
          <PipeLine points={[{ x: incomer.x, y: 86 }, { x: incomer.x, y: busY }]} />
          <SingleLineText x={incomer.x + 22} y={31} anchor="start" mono>
            {incomer.name}
          </SingleLineText>
          <SingleLineText x={incomer.x + 22} y={44} anchor="start" quiet>
            11 / 0.69 kV · 2.5 MVA
          </SingleLineText>
          <SingleLineText x={incomer.x + 16} y={80} anchor="start" mono quiet>
            {incomer.breaker}
          </SingleLineText>
        </g>
      ))}
      <SingleLineBus x1={50} x2={400} y={busY} label="Bus A · 690 V" />
      <SingleLineBus x1={460} x2={810} y={busY} label="Bus B · 690 V" labelAt="end" />
      <PipeLine points={[{ x: 400, y: busY }, { x: 420, y: busY }]} />
      <PipeLine points={[{ x: 440, y: busY }, { x: 460, y: busY }]} />
      <Breaker state="open" orientation="horizontal" size={BREAKER} cx={430} cy={busY} label="Q03 bus tie" />
      <SingleLineText x={430} y={busY - 20} mono quiet>
        Q03
      </SingleLineText>
      <SingleLineText x={430} y={busY + 26} quiet>
        Bus tie open
      </SingleLineText>
      {FEEDERS.map((feeder, index) => (
        <SingleLineFeeder key={feeder.id} feeder={feeder} x={positions[index]} busY={busY} compact />
      ))}
    </DiagramCanvas>
  );
}

function SingleLineTrippedFeeder() {
  const feeders = [FEEDERS[0], FEEDERS[3], FEEDERS[5], FEEDERS[4]];
  const busY = 34;
  return (
    <DiagramCanvas label={`Switchboard section with feeder ${FEEDERS[5].id} to the ${FEEDERS[5].name} tripped on an earth fault and highlighted`} width={470} height={190}>
      <rect x={235} y={busY + 12} width={120} height={138} rx={8} className="fill-critical-background" />
      <SingleLineBus x1={12} x2={458} y={busY} label="82-EN-001 · 690 V" />
      {feeders.map((feeder, index) => (
        <SingleLineFeeder key={feeder.id} feeder={feeder} x={65 + index * 115} busY={busY} compact />
      ))}
    </DiagramCanvas>
  );
}

function SingleLineSelectable() {
  const feeders = FEEDERS.slice(0, 4);
  const busY = 30;
  const [selectedId, setSelectedId] = useState('Q11');
  const selected = feeders.find((feeder) => feeder.id === selectedId) ?? feeders[0];
  return (
    <div className="flex w-full flex-col gap-4">
      <DiagramCanvas label="Switchboard feeders. Select a feeder to see its load" width={470} height={184} interactive>
        <SingleLineBus x1={12} x2={458} y={busY} label="82-EN-001 · 690 V" />
        {feeders.map((feeder, index) => (
          <DiagramHotspot
            key={feeder.id}
            x={10 + index * 115}
            y={busY + 10}
            width={110}
            height={140}
            label={`${feeder.id} ${feeder.name}`}
            selected={feeder.id === selectedId}
            onSelect={() => setSelectedId(feeder.id)}
          >
            <SingleLineFeeder feeder={feeder} x={65 + index * 115} busY={busY} compact />
          </DiagramHotspot>
        ))}
      </DiagramCanvas>
      <div aria-live="polite" className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-lg bg-muted-background p-4">
        <div className="flex min-w-36 flex-col gap-1">
          <span className="font-mono text-xs text-muted-foreground">
            {selected.id} · {selected.tag}
          </span>
          <span className="text-sm font-medium text-base-foreground">{selected.name}</span>
          <StatusIndicator size="sm" {...breakerStatus(selected.breaker)} detail={selected.reason} />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">Active power</span>
          <ValueReadout size="sm" value={selected.kw} unit="kW" />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">Current</span>
          <ValueReadout size="sm" value={selected.amps} unit="A" decimals={1} />
        </div>
      </div>
    </div>
  );
}

function SingleLineWindString() {
  const busY = 150;
  const turbines = [
    { id: 'WT01', mw: 2.1, breaker: 'closed', note: '' },
    { id: 'WT02', mw: 2.0, breaker: 'closed', note: '' },
    { id: 'WT03', mw: 1.9, breaker: 'closed', note: '' },
    { id: 'WT04', mw: 0, breaker: 'open', note: 'Out for service' },
    { id: 'WT05', mw: 2.0, breaker: 'closed', note: '' },
    { id: 'WT06', mw: 1.8, breaker: 'closed', note: '' },
  ] as const;
  const total = turbines.reduce((sum, turbine) => sum + turbine.mw, 0);
  return (
    <DiagramCanvas
      label={`Wind farm string A: six turbines on one 33 kilovolt collector cable, five generating ${total.toFixed(1)} megawatts in total and WT04 disconnected for service`}
      width={860}
      height={190}
    >
      <SingleLineBus x1={40} x2={730} y={busY} label="String A collector · 33 kV" labelBelow />
      <PipeLine points={[{ x: 730, y: busY }, { x: 760, y: busY }]} />
      <Breaker state="closed" orientation="horizontal" size={BREAKER} cx={770} cy={busY} label="Q31 string A breaker" />
      <PipeLine points={[{ x: 780, y: busY }, { x: 848, y: busY }]} weight="heavy" flow="forward" />
      <SingleLineText x={770} y={busY + 26} mono quiet>
        Q31
      </SingleLineText>
      <SingleLineText x={848} y={busY + 26} anchor="end" quiet>
        To substation
      </SingleLineText>
      <ValueTag x={848} y={busY - 52} anchor="end" label="String A" value={total} unit="MW" decimals={1} />
      {turbines.map((turbine, index) => {
        const x = 90 + index * 118;
        const live = turbine.breaker === 'closed';
        return (
          <g key={turbine.id}>
            <EquipmentSymbol
              kind="wind-turbine"
              size={40}
              cx={x}
              cy={44}
              label={`${turbine.id}, ${live ? 'generating' : 'out of service'}`}
              tone={live ? 'neutral' : 'warning'}
            />
            <PipeLine points={[{ x, y: 80.7 }, { x, y: 100 }]} weight={live ? 'normal' : 'light'} dashed={!live} flow={live ? 'forward' : undefined} arrowSize={6} />
            <Breaker state={turbine.breaker} size={BREAKER} cx={x} cy={110} label={`${turbine.id} breaker`} />
            <PipeLine points={[{ x, y: 120 }, { x, y: busY }]} />
            <SingleLineText x={x + 24} y={38} anchor="start" mono>
              {turbine.id}
            </SingleLineText>
            <SingleLineText x={x + 24} y={52} anchor="start" className={live ? undefined : 'fill-warning-foreground-strong font-medium'}>
              {live ? `${turbine.mw.toFixed(1)} MW` : turbine.note}
            </SingleLineText>
          </g>
        );
      })}
    </DiagramCanvas>
  );
}

function SingleLineSolarString() {
  const dcY = 96;
  const x = 130;
  return (
    <DiagramCanvas label="Solar inverter string: three panel strings on a 782 volt DC bus, one inverter at 96.8 percent efficiency, and 180 kilowatts AC onto bus A" width={460} height={250}>
      {[50, 130, 210].map((panelX, index) => (
        <g key={panelX}>
          <EquipmentSymbol kind="solar-panel" size={40} cx={panelX} cy={38} fill="soft" label={`Panel string ${index + 1}`} />
          <PipeLine points={[{ x: panelX, y: 48 }, { x: panelX, y: dcY }]} weight="light" />
          <SingleLineText x={panelX} y={14} quiet>
            {`PV ${index + 1}`}
          </SingleLineText>
        </g>
      ))}
      <PipeLine points={[{ x: 30, y: dcY }, { x: 230, y: dcY }]} />
      <PipeLine points={[{ x, y: dcY }, { x, y: 124 }]} flow="forward" arrowSize={6} />
      <EquipmentSymbol kind="inverter" size={36} cx={x} cy={136} label="Inverter 85-EI-001" />
      <PipeLine points={[{ x, y: 148 }, { x, y: 176 }]} flow="forward" arrowSize={6} />
      <Breaker state="closed" size={BREAKER} cx={x} cy={186} label="Q41 solar breaker" />
      <PipeLine points={[{ x, y: 196 }, { x, y: 226 }]} />
      <SingleLineBus x1={16} x2={444} y={226} label="Bus A · 690 V" labelAt="end" />
      <SingleLineText x={x + 26} y={132} anchor="start" mono>
        85-EI-001
      </SingleLineText>
      <SingleLineText x={x + 26} y={145} anchor="start" quiet>
        Inverter
      </SingleLineText>
      <SingleLineText x={x + 16} y={190} anchor="start" mono quiet>
        Q41
      </SingleLineText>
      <SingleLineText x={238} y={dcY + 4} anchor="start" quiet>
        DC side, light lines
      </SingleLineText>
      <ValueTag x={444} y={24} anchor="end" label="DC bus" value={782} unit="V" width={92} />
      <ValueTag x={444} y={64} anchor="end" label="Efficiency" value={96.8} unit="%" decimals={1} width={92} />
      <ValueTag x={444} y={150} anchor="end" label="AC output" value={180} unit="kW" width={92} />
    </DiagramCanvas>
  );
}

function SingleLineBatteryTieIn() {
  const x = 130;
  const busY = 34;
  return (
    <DiagramCanvas label="Battery storage tie-in: battery 86-EB-001 at 64 percent charge, charging at 70 kilowatts from bus A through an inverter and breaker Q51" width={460} height={250}>
      <SingleLineBus x1={16} x2={444} y={busY} label="Bus A · 690 V" labelAt="end" />
      <PipeLine points={[{ x, y: busY }, { x, y: 62 }]} />
      <Breaker state="closed" size={BREAKER} cx={x} cy={72} label="Q51 battery breaker" />
      <PipeLine points={[{ x, y: 82 }, { x, y: 118 }]} flow="forward" arrowSize={6} />
      <EquipmentSymbol kind="inverter" size={36} cx={x} cy={130} label="Converter 86-EI-001" />
      <PipeLine points={[{ x, y: 142 }, { x, y: 184 }]} weight="light" flow="forward" arrowSize={6} />
      <EquipmentSymbol kind="battery" size={40} cx={x} cy={200.7} label="Battery 86-EB-001, charging" />
      <SingleLineText x={x + 16} y={76} anchor="start" mono quiet>
        Q51
      </SingleLineText>
      <SingleLineText x={x + 26} y={127} anchor="start" mono>
        86-EI-001
      </SingleLineText>
      <SingleLineText x={x + 26} y={140} anchor="start" quiet>
        Converter
      </SingleLineText>
      <SingleLineText x={x + 26} y={197} anchor="start" mono>
        86-EB-001
      </SingleLineText>
      <SingleLineText x={x + 26} y={210} anchor="start" quiet>
        Battery, 500 kWh
      </SingleLineText>
      <SingleLineText x={16} y={240} anchor="start" quiet>
        Arrows show charging; they turn round when it discharges
      </SingleLineText>
      <ValueTag x={444} y={62} anchor="end" label="Charging" value={70} unit="kW" width={104} />
      <ValueTag x={444} y={102} anchor="end" label="State of charge" value={64} unit="%" width={104} />
      <ValueTag x={444} y={142} anchor="end" label="Time to full" value={2.6} unit="h" decimals={1} width={104} />
    </DiagramCanvas>
  );
}

function SingleLineSubstation() {
  const hvY = 92;
  const mvY = 196;
  const transformers = [
    { x: 320, name: 'T1', live: true },
    { x: 560, name: 'T2', live: false },
  ];
  const feeders = [
    { x: 130, kind: 'transformer', name: 'Process plant', value: '3.9 MW', flow: 'forward' },
    { x: 290, kind: 'wind-turbine', name: 'Wind string A', value: '9.8 MW', flow: 'reverse' },
    { x: 450, kind: 'solar-panel', name: 'Solar field', value: '0.2 MW', flow: 'reverse' },
    { x: 610, kind: 'battery', name: 'Battery storage', value: '0.1 MW', flow: 'forward' },
    { x: 770, kind: 'load', name: 'Stord terminal', value: '1.2 MW', flow: 'forward' },
  ] as const;
  return (
    <DiagramCanvas
      label="Substation overview: a 132 kilovolt grid connection exporting 4.8 megawatts, transformer T1 in service and T2 on standby, and an 11 kilovolt bus with feeders to the process plant, wind string A, the solar field, battery storage and Stord terminal"
      width={900}
      height={320}
    >
      <PipeLine points={[{ x: 440, y: 6 }, { x: 440, y: 22 }]} flow="reverse" arrowSize={6} />
      <EquipmentSymbol kind="disconnector" size={SYM} cx={440} cy={30} label="Grid disconnector" />
      <PipeLine points={[{ x: 440, y: 42 }, { x: 440, y: 50 }]} />
      <Breaker state="closed" size={BREAKER} cx={440} cy={60} label="Q-G1 grid breaker" />
      <PipeLine points={[{ x: 440, y: 70 }, { x: 440, y: hvY }]} />
      <SingleLineText x={456} y={16} anchor="start" quiet>
        Grid
      </SingleLineText>
      <SingleLineText x={456} y={64} anchor="start" mono quiet>
        Q-G1
      </SingleLineText>
      <ValueTag x={416} y={20} anchor="end" label="Export to grid" value={4.8} unit="MW" decimals={1} />
      <SingleLineBus x1={240} x2={640} y={hvY} label="132 kV" />
      {transformers.map((transformer) => (
        <g key={transformer.name}>
          <PipeLine points={[{ x: transformer.x, y: hvY }, { x: transformer.x, y: 112 }]} />
          <EquipmentSymbol kind="transformer" size={32} cx={transformer.x} cy={126} label={`Transformer ${transformer.name}, ${transformer.live ? 'in service' : 'standby'}`} />
          <PipeLine points={[{ x: transformer.x, y: 140 }, { x: transformer.x, y: 152 }]} weight={transformer.live ? 'normal' : 'light'} dashed={!transformer.live} />
          <Breaker state={transformer.live ? 'closed' : 'open'} size={BREAKER} cx={transformer.x} cy={162} label={`${transformer.name} low-side breaker`} />
          <PipeLine points={[{ x: transformer.x, y: 172 }, { x: transformer.x, y: mvY }]} />
          <SingleLineText x={transformer.x + 22} y={123} anchor="start" mono>
            {transformer.name}
          </SingleLineText>
          <SingleLineText x={transformer.x + 22} y={136} anchor="start" quiet>
            {transformer.live ? '132 / 11 kV · in service' : '132 / 11 kV · standby'}
          </SingleLineText>
        </g>
      ))}
      <SingleLineBus x1={60} x2={840} y={mvY} label="11 kV" />
      {feeders.map((feeder) => {
        const symbolY = 268;
        const isTurbine = feeder.kind === 'wind-turbine';
        const symbolX = isTurbine ? feeder.x + 26 : feeder.x;
        const top = symbolPort(feeder.kind, isTurbine ? 'bottom' : 'top', symbolX, symbolY, 32);
        return (
          <g key={feeder.name}>
            <PipeLine points={[{ x: feeder.x, y: mvY }, { x: feeder.x, y: 214 }]} />
            <Breaker state="closed" size={BREAKER} cx={feeder.x} cy={224} label={`${feeder.name} breaker`} />
            <PipeLine points={isTurbine ? [{ x: feeder.x, y: 234 }, { x: feeder.x, y: top.y }, top] : [{ x: feeder.x, y: 234 }, top]} />
            <EquipmentSymbol kind={feeder.kind} size={32} cx={symbolX} cy={symbolY} label={feeder.name} />
            <SingleLineText x={feeder.x + 20} y={212} anchor="start">
              {`${feeder.flow === 'reverse' ? '↑' : '↓'} ${feeder.value}`}
            </SingleLineText>
            <SingleLineText x={feeder.x} y={304} quiet>
              {feeder.name}
            </SingleLineText>
          </g>
        );
      })}
    </DiagramCanvas>
  );
}

function SingleLineWithLoadList() {
  return (
    <div className="grid w-full grid-cols-1 items-center gap-x-8 gap-y-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <SingleLineBoard feeders={FEEDERS} spacing={100} compact />
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th scope="col" className={TH}>
              Feeder
            </th>
            <th scope="col" className={TH}>
              Breaker
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Load
            </th>
          </tr>
        </thead>
        <tbody>
          {FEEDERS.map((feeder) => (
            <tr key={feeder.id} className="border-t border-default">
              <td className={TD}>
                <span className="flex items-baseline gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{feeder.id}</span>
                  <span className="text-base-foreground">{feeder.name}</span>
                </span>
              </td>
              <td className={TD}>
                <StatusIndicator size="sm" {...breakerStatus(feeder.breaker)} />
              </td>
              <td className={`${TD} text-right`}>
                <ValueReadout size="xs" value={feeder.breaker === 'closed' ? feeder.kw : null} unit="kW" />
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-emphasized">
            <td className={`${TD} font-medium text-base-foreground`} colSpan={2}>
              Total on bus
            </td>
            <td className={`${TD} text-right`}>
              <ValueReadout size="xs" value={TOTAL_KW} unit="kW" />
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function SingleLineLegend() {
  const lineIcon = (label: string, heavy: boolean) => (
    <svg role="img" aria-label={label} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" className="size-6 shrink-0 text-medium-foreground">
      <path d="M 2 12 H 22" strokeWidth={heavy ? 3 : 1} strokeDasharray={heavy ? undefined : '3 3'} vectorEffect="non-scaling-stroke" />
    </svg>
  );
  return (
    <ul className="flex w-full max-w-xs flex-col gap-3 text-xs text-base-foreground">
      <li className="flex items-center gap-3">
        <Breaker state="closed" size="sm" />
        Breaker closed
      </li>
      <li className="flex items-center gap-3">
        <Breaker state="open" size="sm" />
        Breaker open
      </li>
      <li className="flex items-center gap-3">
        <Breaker state="tripped" size="sm" />
        Breaker tripped
      </li>
      <li className="flex items-center gap-3">
        {lineIcon('Heavy solid line', true)}
        Energised
      </li>
      <li className="flex items-center gap-3">
        {lineIcon('Light dashed line', false)}
        De-energised
      </li>
      <li className="flex items-center gap-3">
        <EquipmentSymbol kind="pipe" size="sm" label="Line with arrow" />
        Direction of power flow
      </li>
    </ul>
  );
}

function SingleLineCard() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>690 V main switchboard</CardTitle>
          <CardDescription>82-EN-001 · updated {formatTime(REFERENCE_NOW)} UTC</CardDescription>
        </CardHeaderCenter>
        <CardHeaderEnd>
          <StatusIndicator variant="badge" tone="critical" label="1 tripped" />
        </CardHeaderEnd>
      </CardHeader>
      <CardContent>
        <SingleLineBoard feeders={FEEDERS} spacing={104} compact />
      </CardContent>
      <CardFooter className="flex flex-wrap gap-x-6 gap-y-2">
        <StatusIndicator size="sm" {...breakerStatus('closed')} detail={`${countBreakers('closed')} feeders`} />
        <StatusIndicator size="sm" {...breakerStatus('open')} detail={`${countBreakers('open')} feeders`} />
        <StatusIndicator size="sm" {...breakerStatus('tripped')} detail={`${countBreakers('tripped')} feeder`} />
        <span className="ml-auto text-xs text-muted-foreground tabular-nums">
          {TOTAL_KW} kW · {TOTAL_AMPS.toFixed(1)} A on bus
        </span>
      </CardFooter>
    </Card>
  );
}

function SingleLineBreakerTable() {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-xl border-collapse text-sm">
        <thead>
          <tr>
            <th scope="col" className={`${TH} w-12`}>
              <span className="sr-only">Symbol</span>
            </th>
            <th scope="col" className={TH}>
              Breaker
            </th>
            <th scope="col" className={TH}>
              Feeds
            </th>
            <th scope="col" className={TH}>
              State
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Current
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Power
            </th>
            <th scope="col" className={TH}>
              Last operated
            </th>
          </tr>
        </thead>
        <tbody>
          {FEEDERS.map((feeder) => (
            <tr key={feeder.id} className="border-t border-default">
              <td className={TD}>
                <Breaker state={feeder.breaker} size="sm" label={feeder.id} />
              </td>
              <td className={`${TD} font-mono text-xs text-base-foreground`}>{feeder.id}</td>
              <td className={TD}>
                <span className="flex flex-col">
                  <span className="text-base-foreground">{feeder.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">{feeder.tag}</span>
                </span>
              </td>
              <td className={TD}>
                <StatusIndicator size="sm" {...breakerStatus(feeder.breaker)} detail={feeder.reason} />
              </td>
              <td className={`${TD} text-right`}>
                <ValueReadout size="xs" value={feeder.breaker === 'closed' ? feeder.amps : null} unit="A" decimals={1} />
              </td>
              <td className={`${TD} text-right`}>
                <ValueReadout size="xs" value={feeder.breaker === 'closed' ? feeder.kw : null} unit="kW" />
              </td>
              <td className={`${TD} whitespace-nowrap text-muted-foreground tabular-nums`}>{formatDateTime(feeder.operatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default definePage({
  id: 'single-line-diagrams',
  title: 'Single-line diagrams',
  summary:
    'Electrical networks drawn as one line per circuit: busbars, breakers, transformers, sources and loads. They answer what is live, what is open, and where the power is going.',
  guidance: {
    use: [
      'Draw the bus as the heaviest line and let feeders drop from it, sources above and loads below.',
      'Show breaker state by shape: solid closed, hollow open, crossed tripped. Colour only for the trip.',
      'Show energised and dead sections by line weight and dash, and say which is which in a label.',
      'Print load as kW and A under each feeder, and the bus total where the incomer lands.',
    ],
    avoid: [
      'Red for closed and green for open, or the reverse; the convention differs between sites and fails without colour.',
      'Drawing all three phases, cable sizes or protection relays; that is the electrical drawing, not the display.',
      'Animated power flow; an arrow and a signed value say the same.',
      'A diagram wider than its container; split the board into sections instead of shrinking the text.',
    ],
  },
  source,
  sections: [
    {
      id: 'elements',
      title: 'Elements',
      description: 'The parts of a single-line diagram, and how each shows its state.',
      specimens: [
        {
          id: 'SingleLineBreakerStates',
          title: 'Breaker states',
          note: 'Pick it for every switching device: closed is solid, open is hollow, tripped is crossed and critical.',
          origin: 'custom',
          uses: ['industrial/diagrams/Breaker.tsx', 'industrial/diagrams/symbolState.ts', 'industrial/StatusIndicator.tsx'],
          Component: SingleLineBreakerStates,
        },
        {
          id: 'SingleLineBusbar',
          title: 'Busbar',
          note: 'Pick it as the backbone of a board: the heaviest line on the diagram, named with its voltage.',
          origin: 'custom',
          uses: ['industrial/diagrams/PipeLine.tsx', 'industrial/diagrams/ValueTag.tsx', 'industrial/diagrams/DiagramCanvas.tsx'],
          Component: SingleLineBusbar,
        },
        {
          id: 'SingleLineFeederSingle',
          title: 'Feeder with load values',
          note: 'Pick it for each outgoing circuit: breaker, load symbol, tag, and the load in kW and A.',
          origin: 'custom',
          uses: ['industrial/diagrams/Breaker.tsx', 'industrial/diagrams/EquipmentSymbol.tsx', 'industrial/diagrams/PipeLine.tsx', 'industrial/diagrams/DiagramCanvas.tsx'],
          Component: SingleLineFeederSingle,
        },
        {
          id: 'SingleLineElements',
          title: 'Element set',
          note: 'Pick from these eight before drawing anything new; they share one grid and one stroke.',
          origin: 'custom',
          uses: ['industrial/diagrams/EquipmentSymbol.tsx', 'industrial/diagrams/Breaker.tsx', 'industrial/diagrams/symbolPaths.ts'],
          size: 'lg',
          align: 'stretch',
          Component: SingleLineElements,
        },
        {
          id: 'SingleLineEarthed',
          title: 'Isolated and earthed',
          note: 'Pick it for a circuit under work: breaker open, cable earthed, and the work order that holds it.',
          origin: 'custom',
          uses: ['industrial/diagrams/Breaker.tsx', 'industrial/diagrams/EquipmentSymbol.tsx', 'industrial/diagrams/PipeLine.tsx', 'industrial/diagrams/symbolState.ts', 'industrial/diagrams/DiagramCanvas.tsx'],
          Component: SingleLineEarthed,
        },
        {
          id: 'SingleLineEnergised',
          title: 'Energised and de-energised',
          note: 'Pick it to show what is live: weight and dash carry it, a label confirms it, and colour is not involved.',
          origin: 'custom',
          uses: ['industrial/diagrams/PipeLine.tsx', 'industrial/diagrams/Breaker.tsx', 'industrial/diagrams/DiagramCanvas.tsx'],
          size: 'md',
          align: 'stretch',
          Component: SingleLineEnergised,
        },
        {
          id: 'SingleLinePowerFlow',
          title: 'Power flow direction',
          note: 'Pick it where power can go either way: arrows give the direction, the callout gives the amount.',
          origin: 'custom',
          uses: ['industrial/diagrams/PipeLine.tsx', 'industrial/diagrams/FlowArrow.tsx', 'industrial/diagrams/ValueTag.tsx', 'industrial/diagrams/DiagramCanvas.tsx'],
          size: 'md',
          align: 'stretch',
          Component: SingleLinePowerFlow,
        },
        {
          id: 'SingleLineTransformerIncomer',
          title: 'Transformer incomer',
          note: 'Pick it for the supply to a board: isolation, protection, transformation, then the bus.',
          origin: 'custom',
          uses: ['industrial/diagrams/EquipmentSymbol.tsx', 'industrial/diagrams/Breaker.tsx', 'industrial/diagrams/PipeLine.tsx', 'industrial/diagrams/DiagramCanvas.tsx'],
          Component: SingleLineTransformerIncomer,
        },
        {
          id: 'SingleLineGeneratorSet',
          title: 'Generator feeding a bus',
          note: 'Pick it for a generator set: the source on top, its output beside it, the loads it carries below.',
          origin: 'custom',
          uses: ['industrial/diagrams/EquipmentSymbol.tsx', 'industrial/diagrams/Breaker.tsx', 'industrial/diagrams/PipeLine.tsx', 'industrial/diagrams/ValueTag.tsx', 'industrial/diagrams/DiagramCanvas.tsx'],
          Component: SingleLineGeneratorSet,
        },
        {
          id: 'SingleLineMeterCallouts',
          title: 'Bus measurements',
          note: 'Pick it to put voltage, frequency and total load on the bus they belong to.',
          origin: 'custom',
          uses: ['industrial/diagrams/ValueTag.tsx', 'industrial/diagrams/PipeLine.tsx', 'industrial/diagrams/DiagramCanvas.tsx'],
          Component: SingleLineMeterCallouts,
        },
      ],
    },
    {
      id: 'boards',
      title: 'Switchboards',
      description: 'A bus with its incomers and feeders, read from the supply down to the loads.',
      specimens: [
        {
          id: 'SingleLineSwitchboard',
          title: 'Switchboard with feeders',
          note: 'Pick it as the standard view of a board: every feeder with its breaker state and load.',
          origin: 'custom',
          uses: ['industrial/diagrams/Breaker.tsx', 'industrial/diagrams/EquipmentSymbol.tsx', 'industrial/diagrams/PipeLine.tsx', 'industrial/diagrams/DiagramCanvas.tsx'],
          size: 'full',
          align: 'stretch',
          Component: SingleLineSwitchboard,
        },
        {
          id: 'SingleLineIncomerBusTie',
          title: 'Two incomers and a bus tie',
          note: 'Pick it for a board with redundant supply, where the tie position decides which bus feeds what.',
          origin: 'custom',
          uses: ['industrial/diagrams/Breaker.tsx', 'industrial/diagrams/EquipmentSymbol.tsx', 'industrial/diagrams/PipeLine.tsx', 'industrial/diagrams/DiagramCanvas.tsx'],
          size: 'full',
          align: 'stretch',
          Component: SingleLineIncomerBusTie,
        },
        {
          id: 'SingleLineTrippedFeeder',
          title: 'Tripped feeder highlighted',
          note: 'Pick it when a breaker trips: a tinted field, the crossed breaker and the cause in words.',
          origin: 'custom',
          uses: ['industrial/diagrams/Breaker.tsx', 'industrial/diagrams/EquipmentSymbol.tsx', 'industrial/diagrams/PipeLine.tsx', 'industrial/diagrams/DiagramCanvas.tsx'],
          size: 'md',
          align: 'stretch',
          Component: SingleLineTrippedFeeder,
        },
        {
          id: 'SingleLineSelectable',
          title: 'Selectable feeders',
          note: 'Pick it when the diagram is the way in: select a feeder to read its state, power and current.',
          origin: 'custom',
          uses: ['industrial/diagrams/DiagramHotspot.tsx', 'industrial/diagrams/Breaker.tsx', 'industrial/diagrams/DiagramCanvas.tsx', 'industrial/ValueReadout.tsx', 'industrial/StatusIndicator.tsx'],
          size: 'md',
          align: 'stretch',
          Component: SingleLineSelectable,
        },
      ],
    },
    {
      id: 'renewables',
      title: 'Generation and storage',
      description: 'Wind, solar and battery connections, and the substation that ties them to the grid.',
      specimens: [
        {
          id: 'SingleLineWindString',
          title: 'Wind farm string',
          note: 'Pick it for turbines on a collector cable: each with its output, and the string total where it leaves.',
          origin: 'custom',
          uses: ['industrial/diagrams/EquipmentSymbol.tsx', 'industrial/diagrams/Breaker.tsx', 'industrial/diagrams/PipeLine.tsx', 'industrial/diagrams/ValueTag.tsx', 'industrial/diagrams/DiagramCanvas.tsx'],
          size: 'full',
          align: 'stretch',
          Component: SingleLineWindString,
        },
        {
          id: 'SingleLineSolarString',
          title: 'Solar inverter string',
          note: 'Pick it for PV: panel strings on a DC bus drawn light, one inverter, and the AC output onto the board.',
          origin: 'custom',
          uses: ['industrial/diagrams/EquipmentSymbol.tsx', 'industrial/diagrams/Breaker.tsx', 'industrial/diagrams/PipeLine.tsx', 'industrial/diagrams/ValueTag.tsx', 'industrial/diagrams/DiagramCanvas.tsx'],
          size: 'md',
          align: 'stretch',
          Component: SingleLineSolarString,
        },
        {
          id: 'SingleLineBatteryTieIn',
          title: 'Battery storage tie-in',
          note: 'Pick it for storage: the arrows say charging or discharging, the callouts say how much and how full.',
          origin: 'custom',
          uses: ['industrial/diagrams/EquipmentSymbol.tsx', 'industrial/diagrams/Breaker.tsx', 'industrial/diagrams/PipeLine.tsx', 'industrial/diagrams/ValueTag.tsx', 'industrial/diagrams/DiagramCanvas.tsx'],
          size: 'md',
          align: 'stretch',
          Component: SingleLineBatteryTieIn,
        },
        {
          id: 'SingleLineSubstation',
          title: 'Substation overview',
          note: 'Pick it as the top level of an electrical system: grid, transformers, the main bus and what hangs on it.',
          origin: 'custom',
          uses: ['industrial/diagrams/EquipmentSymbol.tsx', 'industrial/diagrams/Breaker.tsx', 'industrial/diagrams/PipeLine.tsx', 'industrial/diagrams/ValueTag.tsx', 'industrial/diagrams/symbolPaths.ts', 'industrial/diagrams/DiagramCanvas.tsx'],
          size: 'full',
          align: 'stretch',
          Component: SingleLineSubstation,
        },
      ],
    },
    {
      id: 'lists',
      title: 'With lists and legends',
      description: 'The diagram beside the table that says the same thing in rows.',
      specimens: [
        {
          id: 'SingleLineWithLoadList',
          title: 'Diagram with load list',
          note: 'Pick it when people need both the picture and the numbers; the list repeats every breaker state in words.',
          origin: 'custom',
          uses: ['industrial/diagrams/Breaker.tsx', 'industrial/diagrams/EquipmentSymbol.tsx', 'industrial/diagrams/DiagramCanvas.tsx', 'industrial/diagrams/symbolState.ts', 'industrial/StatusIndicator.tsx', 'industrial/ValueReadout.tsx'],
          size: 'full',
          align: 'stretch',
          Component: SingleLineWithLoadList,
        },
        {
          id: 'SingleLineCard',
          title: 'Card with status summary',
          note: 'Pick it on a dashboard: the header names the board and its worst state, the footer counts breakers and load.',
          origin: 'custom',
          uses: ['industrial/diagrams/Breaker.tsx', 'industrial/diagrams/EquipmentSymbol.tsx', 'industrial/diagrams/DiagramCanvas.tsx', 'industrial/diagrams/symbolState.ts', 'industrial/StatusIndicator.tsx'],
          size: 'lg',
          align: 'stretch',
          Component: SingleLineCard,
        },
        {
          id: 'SingleLineLegend',
          title: 'Legend',
          note: 'Pick it beside any single-line diagram; breaker and line conventions differ between sites.',
          origin: 'custom',
          uses: ['industrial/diagrams/Breaker.tsx', 'industrial/diagrams/EquipmentSymbol.tsx'],
          Component: SingleLineLegend,
        },
        {
          id: 'SingleLineBreakerTable',
          title: 'Breaker state table',
          note: 'Pick it for switching logs and handovers: every breaker with its state, load and when it last operated.',
          origin: 'custom',
          uses: ['industrial/diagrams/Breaker.tsx', 'industrial/diagrams/symbolState.ts', 'industrial/StatusIndicator.tsx', 'industrial/ValueReadout.tsx'],
          size: 'full',
          align: 'stretch',
          Component: SingleLineBreakerTable,
        },
      ],
    },
  ],
});
