import { Button } from '@cognite/aura/components/button';
import { Slider } from '@cognite/aura/components/slider';
import { useId, useState } from 'react';

import { ArcSegment } from '../../../library/experiences/spatial/ArcSegment';
import { ConcentricRings } from '../../../library/experiences/spatial/ConcentricRings';
import { OrbitNode } from '../../../library/experiences/spatial/OrbitNode';
import { FOCUS_ANGLE, fanAngles, orbitAngles, rotationToFocus, spoke } from '../../../library/experiences/spatial/polar';
import { RING_SWATCH } from '../../../library/experiences/spatial/ringStyle';
import { TimeRing } from '../../../library/experiences/spatial/TimeRing';
import type { TimeRingEvent } from '../../../library/experiences/spatial/TimeRing';
import { toFraction } from '../../../library/industrial/geometry';
import { formatReading, formatValue, healthStatus } from '../../../library/industrial/status';
import type { StatusDescriptor, Tone } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { ThemeScope } from '../../../library/themes/ThemeScope';
import { ALARMS } from '../../data/plant';
import { DAY, HOUR, REFERENCE_NOW, formatTime, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './orbit-mission-control.tsx?raw';

type OrbitMissionReading = { label: string; unit: string; decimals: number; min: number; max: number; history: readonly number[]; high?: number };

type OrbitMissionNode = { id: string; code: string; name: string; scores: readonly number[]; readings: readonly OrbitMissionReading[] };

/** Step 0 is 24 hours ago; the last step is now. */
const ORBIT_MISSION_STEPS = 24;
const ORBIT_MISSION_NOW_HOUR = 14;
const ORBIT_MISSION_CENTRE = 320;
const ORBIT_MISSION_SIZE = 640;

function orbitMissionHistory(seed: number, base: number, spread: number, now: number = base): number[] {
  return [...makeValues({ seed, points: ORBIT_MISSION_STEPS, base, amplitude: spread, noise: spread * 0.4, cycles: 1.5 }), now];
}

function orbitMissionReading(
  seed: number,
  label: string,
  value: number,
  unit: string,
  decimals: number,
  max: number,
  options: { min?: number; high?: number; base?: number } = {}
): OrbitMissionReading {
  const base = options.base ?? value;
  return { label, unit, decimals, min: options.min ?? 0, max, high: options.high, history: orbitMissionHistory(seed, base, max * 0.015, value) };
}

const ORBIT_MISSION_NODES: readonly OrbitMissionNode[] = [
  {
    id: 'nk-20',
    code: 'NK-20',
    name: 'Inlet and separation',
    scores: orbitMissionHistory(120, 94, 1.2),
    readings: [
      orbitMissionReading(121, 'Separator level', 54.3, '%', 1, 100, { high: 70 }),
      orbitMissionReading(122, 'Separator pressure', 13.1, 'barg', 1, 20, { high: 15 }),
      orbitMissionReading(123, 'Liquid rate', 86, 'm³/h', 0, 150),
    ],
  },
  {
    id: 'nk-23',
    code: 'NK-23',
    name: 'Gas compression',
    scores: orbitMissionHistory(230, 89, 1.5, 78),
    readings: [
      orbitMissionReading(231, 'Discharge pressure', 48.6, 'barg', 1, 60, { high: 52 }),
      orbitMissionReading(232, 'Discharge temperature', 146.3, '°C', 1, 180, { high: 145, base: 140 }),
      orbitMissionReading(233, 'Drive-end vibration', 6.8, 'mm/s', 1, 15, { high: 7.1, base: 5.6 }),
    ],
  },
  {
    id: 'nk-24',
    code: 'NK-24',
    name: 'Gas dehydration',
    scores: orbitMissionHistory(240, 91, 1),
    readings: [
      orbitMissionReading(241, 'Contactor pressure', 47.9, 'barg', 1, 60),
      orbitMissionReading(242, 'Glycol circulation', 4.2, 'm³/h', 1, 6),
      orbitMissionReading(243, 'Reboiler temperature', 198, '°C', 0, 250, { high: 204 }),
    ],
  },
  {
    id: 'nk-27',
    code: 'NK-27',
    name: 'Gas export',
    scores: orbitMissionHistory(270, 96, 0.8),
    readings: [
      orbitMissionReading(271, 'Export pressure', 131.4, 'barg', 1, 160),
      orbitMissionReading(272, 'Export flow', 412, 'm³/h', 0, 600),
      orbitMissionReading(273, 'Motor current', 86.2, 'A', 1, 120, { high: 95 }),
    ],
  },
  {
    id: 'nk-29',
    code: 'NK-29',
    name: 'Flare and vent',
    scores: orbitMissionHistory(290, 88, 1.5),
    readings: [
      orbitMissionReading(291, 'Flare rate', 12.4, 'kSm³/d', 1, 40, { high: 15 }),
      orbitMissionReading(292, 'Knock-out drum level', 18, '%', 0, 100, { high: 60 }),
      orbitMissionReading(293, 'Pilot temperature', 642, '°C', 0, 900),
    ],
  },
  {
    id: 'nk-40',
    code: 'NK-40',
    name: 'Cooling water',
    scores: orbitMissionHistory(400, 89, 1.2),
    readings: [
      orbitMissionReading(401, 'Supply temperature', 18.4, '°C', 1, 40, { high: 25 }),
      orbitMissionReading(402, 'Header pressure', 4.6, 'barg', 1, 8),
      orbitMissionReading(403, 'Circulation flow', 1240, 'm³/h', 0, 2000),
    ],
  },
  {
    id: 'nk-43',
    code: 'NK-43',
    name: 'Fuel gas',
    scores: orbitMissionHistory(430, 97, 0.6),
    readings: [
      orbitMissionReading(431, 'Header pressure', 28.5, 'barg', 1, 40),
      orbitMissionReading(432, 'Gas temperature', 41, '°C', 0, 80),
      orbitMissionReading(433, 'Consumption', 6.2, 'kSm³/h', 1, 10),
    ],
  },
  {
    id: 'nk-62',
    code: 'NK-62',
    name: 'Instrument air',
    scores: orbitMissionHistory(620, 99, 0.3),
    readings: [
      orbitMissionReading(621, 'Header pressure', 8.1, 'barg', 1, 10),
      orbitMissionReading(622, 'Compressor load', 64, '%', 0, 100),
      orbitMissionReading(623, 'Receiver temperature', 31, '°C', 0, 60),
    ],
  },
  {
    id: 'nk-80',
    code: 'NK-80',
    name: 'Power generation',
    scores: orbitMissionHistory(800, 85, 1.5, 62),
    readings: [
      orbitMissionReading(801, 'Generator load', 29.4, 'MW', 1, 32, { high: 28.8, base: 24.6 }),
      orbitMissionReading(802, 'Exhaust temperature', 548, '°C', 0, 650, { high: 540, base: 512 }),
      orbitMissionReading(803, 'Spinning reserve', 2.6, 'MW', 1, 12, { base: 7.4 }),
    ],
  },
];

const ORBIT_MISSION_ANGLES = orbitAngles(ORBIT_MISSION_NODES.length);

const ORBIT_MISSION_RINGS = [
  { id: 'availability', label: 'Availability', history: orbitMissionHistory(901, 97.3, 0.5, 96.4) },
  { id: 'performance', label: 'Performance', history: orbitMissionHistory(902, 89.4, 1.2, 86.6) },
  { id: 'quality', label: 'Quality', history: orbitMissionHistory(903, 99.2, 0.2, 99.1) },
] as const;

const ORBIT_MISSION_EVENT_KIND = { critical: 'trip', high: 'alarm', medium: 'alarm', low: 'note' } as const;

const ORBIT_MISSION_EVENTS: readonly TimeRingEvent[] = ALARMS.filter((alarm) => REFERENCE_NOW - alarm.raisedAt < DAY).map((alarm) => ({
  id: alarm.id,
  hour: (alarm.raisedAt % DAY) / HOUR,
  kind: ORBIT_MISSION_EVENT_KIND[alarm.severity],
  label: `${alarm.message} at ${formatTime(alarm.raisedAt)}`,
}));

function orbitMissionStatus(score: number): StatusDescriptor {
  if (score >= 85) return healthStatus('good');
  return healthStatus(score >= 65 ? 'watch' : 'poor');
}

function orbitMissionReadingTone(reading: OrbitMissionReading, step: number): Tone {
  return reading.high !== undefined && reading.history[step] > reading.high ? 'warning' : 'neutral';
}

function orbitMissionClock(step: number): number {
  return (step + ORBIT_MISSION_NOW_HOUR) % 24;
}

function orbitMissionTimeLabel(step: number): string {
  const time = `${String(orbitMissionClock(step)).padStart(2, '0')}:00`;
  if (step === ORBIT_MISSION_STEPS) return `${time}, now`;
  return `${time}, ${ORBIT_MISSION_STEPS - step} h ago`;
}

function orbitMissionRingValues(step: number) {
  const rings = ORBIT_MISSION_RINGS.map((ring) => ({ id: ring.id, label: ring.label, value: ring.history[step] }));
  const oee = rings.reduce((product, ring) => (product * ring.value) / 100, 100);
  return { rings, oee };
}

function OrbitMissionRingLegend({ step }: { step: number }) {
  const { rings } = orbitMissionRingValues(step);

  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
      {rings.map((ring, index) => (
        <li key={ring.id} className="inline-flex items-center gap-2">
          <span aria-hidden="true" className={`h-1 w-4 rounded-full ${RING_SWATCH[index]}`} />
          {ring.label}
          <span className="font-medium tabular-nums text-base-foreground">{formatValue(ring.value, 1)} %</span>
        </li>
      ))}
    </ul>
  );
}

function OrbitMissionFan({ node, step }: { node: OrbitMissionNode; step: number }) {
  const angles = fanAngles(node.readings.length, FOCUS_ANGLE, 58, 3);

  return (
    <g key={node.id} className="motion-safe:animate-in motion-safe:fade-in motion-safe:duration-700">
      {node.readings.map((reading, index) => (
        <ArcSegment
          key={reading.label}
          cx={ORBIT_MISSION_CENTRE}
          cy={ORBIT_MISSION_CENTRE}
          innerRadius={232}
          outerRadius={248}
          startAngle={angles[index].start}
          endAngle={angles[index].end}
          fraction={toFraction(reading.history[step], reading.min, reading.max)}
          tone={orbitMissionReadingTone(reading, step)}
          marker={String(index + 1)}
          label={`${reading.label}: ${formatReading(reading.history[step], reading.unit, reading.decimals)}`}
        />
      ))}
    </g>
  );
}

function OrbitMissionDial({
  step,
  selectedId,
  rotation,
  onSelect,
}: {
  step: number;
  selectedId: string;
  rotation: number;
  onSelect: (id: string) => void;
}) {
  const { rings, oee } = orbitMissionRingValues(step);
  const selected = ORBIT_MISSION_NODES.find((node) => node.id === selectedId) ?? ORBIT_MISSION_NODES[0];
  const c = ORBIT_MISSION_CENTRE;
  const glowId = useId();

  return (
    <svg
      role="group"
      aria-label="Plant performance dial with nine systems and a 24-hour event ring"
      viewBox={`0 0 ${ORBIT_MISSION_SIZE} ${ORBIT_MISSION_SIZE}`}
      className="h-full w-full"
    >
      <defs>
        <radialGradient id={glowId}>
          <stop offset="0%" stopColor="var(--primary-background)" stopOpacity={0.3} />
          <stop offset="100%" stopColor="var(--primary-background)" stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={c} cy={c} r={270} fill={`url(#${glowId})`} />
      <circle cx={c} cy={c} r={184} fill="none" strokeWidth={1} strokeDasharray="2 6" className="stroke-[color-mix(in_oklab,var(--primary-background)_40%,transparent)]" />
      <TimeRing cx={c} cy={c} radius={288} events={ORBIT_MISSION_EVENTS} cursorHour={orbitMissionClock(step)} nowHour={ORBIT_MISSION_NOW_HOUR} />
      <g
        style={{ transform: `rotate(${rotation}deg)`, transformOrigin: `${c}px ${c}px` }}
        className="transition-transform duration-700 ease-in-out motion-reduce:transition-none"
      >
        {ORBIT_MISSION_NODES.map((node, index) => {
          const line = spoke(c, c, 100, 152, ORBIT_MISSION_ANGLES[index]);
          const at = spoke(c, c, 0, 184, ORBIT_MISSION_ANGLES[index]);
          const status = orbitMissionStatus(node.scores[step]);
          return (
            <g key={node.id}>
              <line
                {...line}
                strokeWidth={node.id === selectedId ? 2 : 1}
                className={
                  node.id === selectedId
                    ? 'stroke-[color:var(--primary-background)]'
                    : 'stroke-[color-mix(in_oklab,var(--primary-background)_35%,transparent)]'
                }
              />
              <OrbitNode
                cx={at.x2}
                cy={at.y2}
                radius={28}
                label={node.name}
                code={node.code}
                value={node.scores[step]}
                tone={status.tone}
                shape={status.shape}
                stateLabel={status.label}
                selected={node.id === selectedId}
                counterRotation={-rotation}
                onSelect={() => onSelect(node.id)}
              />
            </g>
          );
        })}
      </g>
      <ConcentricRings cx={c} cy={c} radius={92} thickness={11} gap={5} rings={rings} value={oee} unit="%" caption="OEE" />
      <OrbitMissionFan node={selected} step={step} />
    </svg>
  );
}

function OrbitMissionReadout({ node, step }: { node: OrbitMissionNode; step: number }) {
  const score = node.scores[step];
  const status = orbitMissionStatus(score);

  return (
    <section
      aria-label={`${node.name} readout`}
      className="flex flex-col gap-3 rounded-xl border border-[color-mix(in_oklab,var(--primary-background)_45%,transparent)] bg-card-background p-4"
    >
      <div className="min-w-0">
        <p className="font-mono text-xs text-muted-foreground">{node.code}</p>
        <h3 className="truncate text-sm font-semibold text-base-foreground">{node.name}</h3>
      </div>
      <div className="flex items-end justify-between gap-3">
        <ValueReadout value={score} unit="% health" decimals={0} size="lg" tone={status.tone === 'success' ? 'neutral' : status.tone} />
        <StatusIndicator {...status} size="sm" />
      </div>
      <ol className="flex flex-col gap-2">
        {node.readings.map((reading, index) => {
          const tone = orbitMissionReadingTone(reading, step);
          return (
            <li key={reading.label} className="flex min-w-0 items-baseline gap-2 text-sm">
              <span className="w-4 shrink-0 text-xs font-medium tabular-nums text-muted-foreground">{index + 1}</span>
              <span className="min-w-0 flex-1 text-medium-foreground">{reading.label}</span>
              <span className={`shrink-0 font-medium tabular-nums ${tone === 'warning' ? 'text-warning-foreground-strong' : 'text-base-foreground'}`}>
                {formatReading(reading.history[step], reading.unit, reading.decimals)}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="text-xs text-muted-foreground">Numbers match the arc segments beside the selected system.</p>
    </section>
  );
}

function OrbitMissionScreen() {
  const sliderLabel = useId();
  const [step, setStep] = useState(ORBIT_MISSION_STEPS);
  const [selection, setSelection] = useState({ id: 'nk-23', rotation: rotationToFocus(ORBIT_MISSION_ANGLES[1]) });
  const select = (id: string) =>
    setSelection((current) => {
      const index = ORBIT_MISSION_NODES.findIndex((node) => node.id === id);
      return index === -1 ? current : { id, rotation: rotationToFocus(ORBIT_MISSION_ANGLES[index], current.rotation) };
    });
  const selected = ORBIT_MISSION_NODES.find((node) => node.id === selection.id) ?? ORBIT_MISSION_NODES[0];
  const live = step === ORBIT_MISSION_STEPS;

  return (
    <div className="grid h-[46rem] w-full grid-rows-[auto_minmax(0,1fr)_auto] gap-3 overflow-hidden rounded-xl border border-default bg-base-background p-4">
      <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <div>
          <h3 className="text-sm font-semibold text-base-foreground">Nordkapp mission control</h3>
          <p className="text-xs text-muted-foreground">Overall equipment effectiveness and system health</p>
        </div>
        <OrbitMissionRingLegend step={step} />
        <StatusIndicator tone={live ? 'success' : 'info'} shape={live ? 'dot' : 'ring'} label={live ? 'Live' : 'Replay'} detail={orbitMissionTimeLabel(step)} />
      </header>
      <div className="grid min-h-0 grid-cols-[minmax(0,1fr)_20rem] gap-4">
        <div className="min-h-0 min-w-0">
          <OrbitMissionDial step={step} selectedId={selection.id} rotation={selection.rotation} onSelect={select} />
        </div>
        <div className="flex min-h-0 flex-col gap-3">
          <OrbitMissionReadout node={selected} step={step} />
          <ul aria-label="Systems" className="flex min-h-0 flex-col">
            {ORBIT_MISSION_NODES.map((node) => (
              <li key={node.id}>
                <Button
                  variant={node.id === selection.id ? 'secondary' : 'ghost'}
                  size="sm"
                  aria-pressed={node.id === selection.id}
                  onClick={() => select(node.id)}
                  className="w-full justify-between"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="font-mono text-xs">{node.code}</span>
                    <span className="truncate">{node.name}</span>
                  </span>
                  <span className="tabular-nums">{formatValue(node.scores[step], 0)}</span>
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <footer className="flex items-center gap-4">
        <span id={sliderLabel} className="shrink-0 text-xs font-medium text-muted-foreground">
          Replay last 24 hours
        </span>
        <Slider value={[step]} onValueChange={(value) => setStep(value[0] ?? ORBIT_MISSION_STEPS)} min={0} max={ORBIT_MISSION_STEPS} step={1} aria-labelledby={sliderLabel} className="min-w-0 flex-1" />
        <output className="w-40 shrink-0 whitespace-nowrap text-right text-sm font-medium tabular-nums text-base-foreground">{orbitMissionTimeLabel(step)}</output>
        <Button variant="outline" size="sm" onClick={() => setStep(ORBIT_MISSION_STEPS)}>
          Return to now
        </Button>
      </footer>
    </div>
  );
}

function OrbitMissionExperience() {
  return (
    <ThemeScope preset="tron" className="w-full">
      <OrbitMissionScreen />
    </ThemeScope>
  );
}

function OrbitMissionEmber() {
  return (
    <ThemeScope preset="ember" className="w-full">
      <OrbitMissionScreen />
    </ThemeScope>
  );
}

function OrbitMissionControlRoom() {
  return (
    <ThemeScope preset="control-room" className="w-full">
      <OrbitMissionScreen />
    </ThemeScope>
  );
}

function OrbitMissionCentreRings() {
  const { rings, oee } = orbitMissionRingValues(ORBIT_MISSION_STEPS);

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox="0 0 220 220" className="size-52">
        <ConcentricRings cx={110} cy={110} radius={104} thickness={12} gap={5} rings={rings} value={oee} unit="%" caption="OEE" />
      </svg>
      <OrbitMissionRingLegend step={ORBIT_MISSION_STEPS} />
    </div>
  );
}

function OrbitMissionOrbitNodes() {
  const [selected, setSelected] = useState('NK-23');
  const nodes = [
    { code: 'NK-27', label: 'Gas export', value: 96 },
    { code: 'NK-23', label: 'Gas compression', value: 78 },
    { code: 'NK-80', label: 'Power generation', value: 62 },
  ];

  return (
    <svg role="group" aria-label="System nodes in three states" viewBox="0 0 300 110" className="w-full max-w-xs">
      {nodes.map((node, index) => {
        const status = orbitMissionStatus(node.value);
        return (
          <OrbitNode
            key={node.code}
            cx={50 + index * 100}
            cy={44}
            {...node}
            tone={status.tone}
            shape={status.shape}
            stateLabel={status.label}
            selected={selected === node.code}
            onSelect={() => setSelected(node.code)}
          />
        );
      })}
    </svg>
  );
}

function OrbitMissionArcSegments() {
  return (
    <svg role="group" aria-label="Arc segments at three fill levels" viewBox="0 0 220 130" className="w-full max-w-xs">
      <ArcSegment cx={110} cy={120} innerRadius={78} outerRadius={96} startAngle={-80} endAngle={-30} fraction={0.81} marker="1" label="Discharge pressure: 48.6 barg" />
      <ArcSegment cx={110} cy={120} innerRadius={78} outerRadius={96} startAngle={-25} endAngle={25} fraction={0.92} marker="2" tone="warning" label="Discharge temperature: 146.3 °C, warning" />
      <ArcSegment cx={110} cy={120} innerRadius={78} outerRadius={96} startAngle={30} endAngle={80} fraction={0} marker="3" label="Liquid rate: no flow" />
    </svg>
  );
}

function OrbitMissionDetailFan() {
  const node = ORBIT_MISSION_NODES[1];

  return (
    <div className="flex w-full items-center justify-center gap-6">
      <svg role="group" aria-label="Detail fan for gas compression" viewBox="440 190 210 260" className="h-56 shrink-0">
        <OrbitNode cx={504} cy={320} label={node.name} code={node.code} value={78} tone="warning" shape="square" stateLabel="Watch" selected />
        <OrbitMissionFan node={node} step={ORBIT_MISSION_STEPS} />
      </svg>
      <div className="w-80 min-w-0">
        <OrbitMissionReadout node={node} step={ORBIT_MISSION_STEPS} />
      </div>
    </div>
  );
}

function OrbitMissionTimeRing() {
  const label = useId();
  const [step, setStep] = useState(19);

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-3">
      <svg role="group" aria-label="24-hour event ring" viewBox="0 0 260 260" className="size-60">
        <TimeRing cx={130} cy={130} radius={100} events={ORBIT_MISSION_EVENTS} cursorHour={orbitMissionClock(step)} nowHour={ORBIT_MISSION_NOW_HOUR} />
        <text x={130} y={130} textAnchor="middle" dominantBaseline="central" fontSize={15} className="fill-base-foreground font-semibold tabular-nums">
          {orbitMissionTimeLabel(step)}
        </text>
      </svg>
      <span id={label} className="text-xs text-muted-foreground">
        Replay last 24 hours
      </span>
      <Slider value={[step]} onValueChange={(value) => setStep(value[0] ?? ORBIT_MISSION_STEPS)} min={0} max={ORBIT_MISSION_STEPS} step={1} aria-labelledby={label} className="w-full" />
    </div>
  );
}

function OrbitMissionReadoutCard() {
  return (
    <div className="w-full max-w-xs">
      <OrbitMissionReadout node={ORBIT_MISSION_NODES[8]} step={ORBIT_MISSION_STEPS} />
    </div>
  );
}

function OrbitMissionOrbit() {
  const nodes = ORBIT_MISSION_NODES.slice(0, 6);
  const angles = orbitAngles(nodes.length);
  const [selection, setSelection] = useState({ id: nodes[1].id, rotation: rotationToFocus(angles[1]) });

  return (
    <svg role="group" aria-label="Orbit of six systems that turns the selected one to 3 o'clock" viewBox="0 0 340 340" className="size-80">
      <circle cx={170} cy={170} r={112} fill="none" strokeWidth={1} strokeDasharray="2 6" className="stroke-[color-mix(in_oklab,var(--primary-background)_40%,transparent)]" />
      <g
        style={{ transform: `rotate(${selection.rotation}deg)`, transformOrigin: '170px 170px' }}
        className="transition-transform duration-700 ease-in-out motion-reduce:transition-none"
      >
        {nodes.map((node, index) => {
          const at = spoke(170, 170, 30, 112, angles[index]);
          const status = orbitMissionStatus(node.scores[ORBIT_MISSION_STEPS]);
          return (
            <g key={node.id}>
              <line x1={at.x1} y1={at.y1} x2={at.x2} y2={at.y2} strokeWidth={1} className="stroke-[color-mix(in_oklab,var(--primary-background)_35%,transparent)]" />
              <OrbitNode
                cx={at.x2}
                cy={at.y2}
                radius={26}
                label={node.name}
                code={node.code}
                value={node.scores[ORBIT_MISSION_STEPS]}
                tone={status.tone}
                shape={status.shape}
                stateLabel={status.label}
                selected={node.id === selection.id}
                counterRotation={-selection.rotation}
                onSelect={() => setSelection((current) => ({ id: node.id, rotation: rotationToFocus(angles[index], current.rotation) }))}
              />
            </g>
          );
        })}
      </g>
      <circle cx={170} cy={170} r={28} strokeWidth={1} className="fill-card-background stroke-[color-mix(in_oklab,var(--primary-background)_45%,transparent)]" />
      <text x={170} y={170} textAnchor="middle" dominantBaseline="central" fontSize={12} className="fill-muted-foreground">
        Plant
      </text>
    </svg>
  );
}

export default definePage({
  id: 'orbit-mission-control',
  title: 'Orbit mission control',
  summary:
    'The whole plant round one dial: effectiveness as nested rings in the middle, nine systems in orbit, the selected one turned to 3 o clock with its readings fanned out, and the last 24 hours on the bezel.',
  guidance: {
    use: [
      'When one headline figure and a handful of peer systems are the whole story.',
      'For a wall or lobby screen where the shape itself should be memorable.',
      'Keep the orbit to eight to ten nodes, each with one score.',
      'Pair every arc with a legend or a readout; position on a circle is hard to read precisely.',
    ],
    avoid: [
      'Precise comparison of many values — a table or bar chart is easier to read.',
      'More than three or four segments in the detail fan.',
      'Text along curves; keep labels horizontal and outside the arcs.',
      'Hiding the systems list: the dial needs a plain keyboard path beside it.',
    ],
  },
  source,
  sections: [
    {
      id: 'experience',
      title: 'Experience',
      description:
        'Shown in the Tron theme. Select a system on the orbit or in the list to turn it to 3 o clock and fan out its readings; drag the slider to replay the rings, the orbit and the readout hour by hour.',
      specimens: [
        {
          id: 'OrbitMissionExperience',
          title: 'Orbit mission control',
          note: 'Pick it when plant effectiveness and the health of up to ten systems should read as one object.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'experiences/spatial/polar.ts',
            'experiences/spatial/ConcentricRings.tsx',
            'experiences/spatial/ringStyle.ts',
            'experiences/spatial/OrbitNode.tsx',
            'experiences/spatial/ArcSegment.tsx',
            'experiences/spatial/TimeRing.tsx',
            'industrial/StatusIndicator.tsx',
            'industrial/ValueReadout.tsx',
            'themes/ThemeScope.tsx',
          ],
          Component: OrbitMissionExperience,
        },
      ],
    },
    {
      id: 'themes',
      title: 'In other themes',
      description: 'The same dial, unchanged, in two more presets.',
      specimens: [
        {
          id: 'OrbitMissionEmber',
          title: 'Ember',
          note: 'Pick it for furnace, flare and heat-centred plants: amber on black with high contrast.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: OrbitMissionEmber,
        },
        {
          id: 'OrbitMissionControlRoom',
          title: 'Control room',
          note: 'Pick it on an operator console: teal accent, sharp corners and compact controls.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: OrbitMissionControlRoom,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'Each part on its own, in the theme of the page around it. All are SVG fragments laid out with the polar helpers.',
      specimens: [
        {
          id: 'OrbitMissionCentreRings',
          title: 'Centre rings',
          note: 'Pick it for a headline that is the product of a few factors, such as OEE.',
          origin: 'custom',
          size: 'sm',
          uses: ['experiences/spatial/ConcentricRings.tsx', 'experiences/spatial/ringStyle.ts'],
          Component: OrbitMissionCentreRings,
        },
        {
          id: 'OrbitMissionOrbitNodes',
          title: 'Orbit nodes',
          note: 'Pick it to show peers with one score each; shape and colour repeat good, watch and poor.',
          origin: 'custom',
          size: 'sm',
          uses: ['experiences/spatial/OrbitNode.tsx'],
          Component: OrbitMissionOrbitNodes,
        },
        {
          id: 'OrbitMissionArcSegments',
          title: 'Arc segments',
          note: 'Pick it for a reading drawn on a curve: normal, outside its limit and empty.',
          origin: 'custom',
          size: 'sm',
          uses: ['experiences/spatial/ArcSegment.tsx', 'experiences/spatial/polar.ts'],
          Component: OrbitMissionArcSegments,
        },
        {
          id: 'OrbitMissionDetailFan',
          title: 'Detail fan with readout',
          note: 'Pick it to open one node: numbered segments beside it and the same numbers in a readout card.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['experiences/spatial/ArcSegment.tsx', 'experiences/spatial/OrbitNode.tsx', 'experiences/spatial/polar.ts', 'industrial/ValueReadout.tsx'],
          Component: OrbitMissionDetailFan,
        },
        {
          id: 'OrbitMissionReadoutCard',
          title: 'Readout card',
          note: 'Pick it as the plain-text twin of the fan, here for a system in a poor state.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['industrial/ValueReadout.tsx', 'industrial/StatusIndicator.tsx'],
          Component: OrbitMissionReadoutCard,
        },
        {
          id: 'OrbitMissionTimeRing',
          title: 'Time ring with scrubber',
          note: 'Pick it to frame a dial with the day: events at the hour they happened and a cursor driven by a slider.',
          origin: 'custom',
          size: 'md',
          uses: ['experiences/spatial/TimeRing.tsx', 'experiences/spatial/polar.ts'],
          Component: OrbitMissionTimeRing,
        },
        {
          id: 'OrbitMissionOrbit',
          title: 'Rotating orbit',
          note: 'Pick it when selecting should physically bring the choice to a fixed focus position.',
          origin: 'custom',
          size: 'md',
          uses: ['experiences/spatial/OrbitNode.tsx', 'experiences/spatial/polar.ts'],
          Component: OrbitMissionOrbit,
        },
      ],
    },
  ],
});
