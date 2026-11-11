import {
  SegmentedControl,
  SegmentedControlButton,
  SegmentedControlList,
} from '@cognite/aura/components/segmented-control';
import {
  IconAlertOctagon,
  IconAlertTriangle,
  IconArrowDown,
  IconBatteryCharging,
  IconBolt,
  IconBuildingBridge,
  IconCircleCheck,
  IconDoorExit,
  IconDroplet,
  IconFlame,
  IconPower,
  IconRadar2,
  IconSpeakerphone,
  IconSpray,
  IconWall,
  IconWind,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { Canvas } from '../../../library/kit/Canvas';
import { ListRow } from '../../../library/kit/ListRow';
import { Panel } from '../../../library/kit/Panel';
import { BarrierTile } from '../../../library/kit/safety-and-barriers/BarrierTile';
import { DaysSinceBanner } from '../../../library/kit/safety-and-barriers/DaysSinceBanner';
import { StatusPill } from '../../../library/kit/StatusPill';
import { TagId } from '../../../library/kit/TagId';
import type { Tone } from '../../../library/kit/tones';
import { LookScope } from '../../../library/looks/LookScope';
import { PLANT_KPIS } from '../../data/plant';
import { definePage } from '../../types';

import source from './safety-and-barriers.tsx?raw';

type SbState = 'healthy' | 'degraded' | 'impaired';

type SbElement = { tag: string; name: string; finding: string; measure: string; due: string; state: SbState };

type SbBarrier = { id: string; name: string; icon: ReactNode; elements: number; lastTest: string; faults: SbElement[] };

const SB_STATE_TONE: Record<SbState, Tone> = { healthy: 'success', degraded: 'warning', impaired: 'critical' };

const SB_STATE_LABEL: Record<SbState, string> = { healthy: 'Healthy', degraded: 'Degraded', impaired: 'Impaired' };

const SB_BARRIERS: SbBarrier[] = [
  { id: 'containment', name: 'Containment', icon: <IconDroplet />, elements: 18, lastTest: 'Leak survey 3 March', faults: [] },
  {
    id: 'gas',
    name: 'Gas detection',
    icon: <IconRadar2 />,
    elements: 46,
    lastTest: 'Function test stopped 12 March',
    faults: [
      { tag: 'GD-2311', name: 'Point detector, compressor deck north', finding: 'Inhibited for function test', measure: 'Fire watch posted', due: 'Fri 07:00', state: 'degraded' },
      { tag: 'GD-2312', name: 'Point detector, compressor deck south', finding: 'Inhibited for function test', measure: 'Fire watch posted', due: 'Fri 07:00', state: 'degraded' },
      { tag: 'GD-2313', name: 'Line detector, recompressor bay', finding: 'Inhibited for function test', measure: 'Portable detector in the bay', due: 'Fri 07:00', state: 'degraded' },
      { tag: 'GD-2314', name: 'Point detector, cooler platform', finding: 'Inhibited for function test', measure: 'Fire watch posted', due: 'Fri 07:00', state: 'degraded' },
    ],
  },
  { id: 'fire', name: 'Fire detection', icon: <IconFlame />, elements: 38, lastTest: 'Function test 24 February', faults: [] },
  { id: 'ignition', name: 'Ignition control', icon: <IconBolt />, elements: 27, lastTest: 'Ex inspection 18 February', faults: [] },
  {
    id: 'esd',
    name: 'Emergency shutdown',
    icon: <IconPower />,
    elements: 22,
    lastTest: 'Partial stroke 10 March',
    faults: [{ tag: '23-XV-9120', name: 'Compressor suction shutdown valve', finding: 'Closed in 14 s against a 12 s limit', measure: 'Actuator overhaul ordered, valve stays in service', due: '19 March', state: 'degraded' }],
  },
  { id: 'blowdown', name: 'Blowdown and flare', icon: <IconWind />, elements: 14, lastTest: 'Blowdown test 2 February', faults: [] },
  {
    id: 'firewater',
    name: 'Active fire protection',
    icon: <IconSpray />,
    elements: 31,
    lastTest: 'Deluge test 11 March',
    faults: [
      { tag: '71-PA-7001B', name: 'Fire water pump B', finding: 'Out of service, diesel starter failed', measure: 'Pump A and C cover 100 % demand', due: '14 March', state: 'impaired' },
      { tag: '71-DV-7112', name: 'Deluge valve, compressor deck', finding: 'Opened in 31 s against a 20 s limit', measure: 'Manual release briefed to operators', due: '13 March', state: 'impaired' },
    ],
  },
  { id: 'passive', name: 'Passive fire protection', icon: <IconWall />, elements: 64, lastTest: 'Coating survey January', faults: [] },
  { id: 'power', name: 'Emergency power', icon: <IconBatteryCharging />, elements: 9, lastTest: 'Black start test 1 March', faults: [] },
  {
    id: 'escape',
    name: 'Escape and evacuation',
    icon: <IconDoorExit />,
    elements: 16,
    lastTest: 'Muster drill 7 March',
    faults: [{ tag: '75-LB-0002', name: 'Lifeboat 2 davit', finding: 'Annual inspection 9 days overdue', measure: 'Lifeboats 1 and 3 hold 150 % of people on site', due: '16 March', state: 'degraded' }],
  },
  { id: 'alarm', name: 'Alarm and public address', icon: <IconSpeakerphone />, elements: 52, lastTest: 'Weekly test 9 March', faults: [] },
  { id: 'structure', name: 'Structural integrity', icon: <IconBuildingBridge />, elements: 12, lastTest: 'Survey December 2025', faults: [] },
];

function sbState(barrier: SbBarrier): SbState {
  if (barrier.faults.some((fault) => fault.state === 'impaired')) return 'impaired';
  return barrier.faults.length > 0 ? 'degraded' : 'healthy';
}

function sbDetail(barrier: SbBarrier): string {
  return barrier.faults.length === 0 ? `${barrier.elements} elements` : `${barrier.faults.length} of ${barrier.elements} elements`;
}

function sbBarrier(id: string): SbBarrier {
  return SB_BARRIERS.find((barrier) => barrier.id === id) ?? SB_BARRIERS[0];
}

function SbStateIcon({ state }: { state: SbState }) {
  if (state === 'impaired') return <IconAlertOctagon />;
  return state === 'degraded' ? <IconAlertTriangle /> : <IconCircleCheck />;
}

const SB_COUNTERS = [
  { label: 'days since a first-aid case', days: 34 },
  { label: 'days since a process safety event', days: 96 },
];

function SbBanner() {
  return (
    <DaysSinceBanner
      days={PLANT_KPIS.daysSinceIncident.value}
      label="days since the last recordable incident"
      record={412}
      lead="Nordkapp gas processing"
      lastEvent="Last one: hand injury during valve maintenance, 6 August 2025."
      counters={SB_COUNTERS}
    />
  );
}

function SbSummary({ barriers = SB_BARRIERS }: { barriers?: readonly SbBarrier[] }) {
  const states: SbState[] = ['healthy', 'degraded', 'impaired'];
  return (
    <div role="img" aria-label={states.map((state) => `${barriers.filter((barrier) => sbState(barrier) === state).length} ${state}`).join(', ')} className="flex min-w-0 flex-wrap gap-1">
      {states.map((state) => {
        const count = barriers.filter((barrier) => sbState(barrier) === state).length;
        return count > 0 ? (
          <span
            key={state}
            data-tone={SB_STATE_TONE[state]}
            className="flex h-11 min-w-fit items-center gap-2 rounded-(--kit-radius-sm) bg-(--t-vivid) px-3 text-base font-extrabold whitespace-nowrap text-(--t-on-vivid) tabular-nums"
            style={{ flexGrow: count, flexBasis: 0 }}
          >
            {count} {SB_STATE_LABEL[state].toLowerCase()}
          </span>
        ) : null;
      })}
    </div>
  );
}

function SbElements({ barrier }: { barrier: SbBarrier }) {
  const state = sbState(barrier);
  if (barrier.faults.length === 0) {
    return (
      <div className="flex flex-1 flex-col justify-center gap-3" data-tone="success">
        <IconCircleCheck aria-hidden="true" className="size-14 text-(--t-ink)" />
        <p className="text-3xl leading-tight font-extrabold tracking-tight">All {barrier.elements} elements healthy</p>
        <p className="text-base text-(--kit-text-2)">{barrier.lastTest}. Nothing is inhibited, overdue or failed.</p>
      </div>
    );
  }
  return (
    <div className="flex flex-1 flex-col gap-3">
      <ul className="flex flex-col gap-2">
        {barrier.faults.map((fault) => (
          <ListRow
            key={fault.tag}
            tone={SB_STATE_TONE[fault.state]}
            title={fault.name}
            meta={
              <>
                <TagId>{fault.tag}</TagId>
                <span>{fault.finding}</span>
              </>
            }
            trailing={<span className="text-sm font-semibold whitespace-nowrap">Fix by {fault.due}</span>}
          />
        ))}
      </ul>
      <div className="mt-auto rounded-(--kit-radius-sm) border border-(--kit-rule) p-3">
        <p className="text-sm font-semibold text-(--kit-text-2)">Compensating measures</p>
        <ul className="mt-1 text-base">
          {[...new Set(barrier.faults.map((fault) => fault.measure))].map((measure) => (
            <li key={measure}>{measure}</li>
          ))}
        </ul>
        <p className="mt-2 text-sm text-(--kit-text-2) tabular-nums">
          {barrier.elements - barrier.faults.length} of {barrier.elements} elements healthy · {SB_STATE_LABEL[state].toLowerCase()} since the last test
        </p>
      </div>
    </div>
  );
}

function SafetyAndBarriersSignature() {
  const [selectedId, setSelectedId] = useState('firewater');
  const selected = sbBarrier(selectedId);
  const state = sbState(selected);

  return (
    <LookScope look="signal">
      <Canvas className="flex flex-col gap-2">
        <SbBanner />
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-8 flex flex-col gap-2">
            <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 px-2 pt-2">
              <p className="text-xl font-extrabold tracking-tight">Barrier wall</p>
              <SbSummary />
            </div>
            <div className="grid flex-1 grid-cols-4 gap-2">
              {SB_BARRIERS.map((barrier, index) => (
                <BarrierTile
                  key={barrier.id}
                  name={barrier.name}
                  state={SB_STATE_LABEL[sbState(barrier)]}
                  tone={SB_STATE_TONE[sbState(barrier)]}
                  icon={barrier.icon}
                  detail={sbDetail(barrier)}
                  mark={String(index + 1).padStart(2, '0')}
                  selected={barrier.id === selectedId}
                  onSelect={() => setSelectedId(barrier.id)}
                />
              ))}
            </div>
          </div>
          <Panel
            className="col-span-4"
            title={selected.name}
            subtitle={selected.faults.length === 0 ? selected.lastTest : `${selected.faults.length} degraded ${selected.faults.length === 1 ? 'element' : 'elements'} · ${selected.lastTest.toLowerCase()}`}
            actions={
              <StatusPill tone={SB_STATE_TONE[state]} size="lg" icon={<SbStateIcon state={state} />}>
                {SB_STATE_LABEL[state]}
              </StatusPill>
            }
          >
            <SbElements barrier={selected} />
          </Panel>
        </div>
      </Canvas>
    </LookScope>
  );
}

type SbHazard = { id: string; label: string; threat: string; event: string; consequence: string; prevent: string[]; mitigate: string[] };

const SB_HAZARDS: SbHazard[] = [
  { id: 'release', label: 'Gas release', threat: 'Seal or flange leak in compression', event: 'Gas release', consequence: 'Fire or explosion on the compressor deck', prevent: ['containment', 'esd', 'blowdown'], mitigate: ['gas', 'ignition', 'firewater', 'escape'] },
  { id: 'fire', label: 'Process fire', threat: 'Ignited leak at the export pumps', event: 'Process fire', consequence: 'Escalation to neighbouring areas', prevent: ['ignition', 'containment'], mitigate: ['fire', 'firewater', 'passive', 'alarm', 'escape'] },
  { id: 'blackout', label: 'Loss of power', threat: 'Main generator trip', event: 'Blackout', consequence: 'Loss of control and safe shutdown', prevent: ['power'], mitigate: ['esd', 'blowdown', 'alarm'] },
];

function SbChainEnd({ label, children, tone }: { label: string; children: string; tone: Tone }) {
  return (
    <div data-tone={tone} className="flex flex-col justify-center rounded-(--kit-radius) border-2 border-(--t-ink) p-3">
      <p className="text-sm font-semibold text-(--t-ink)">{label}</p>
      <p className="text-base leading-snug font-semibold">{children}</p>
    </div>
  );
}

function SafetyAndBarriersLine() {
  const [hazardId, setHazardId] = useState('release');
  const hazard = SB_HAZARDS.find((item) => item.id === hazardId) ?? SB_HAZARDS[0];
  const line = [...hazard.prevent, ...hazard.mitigate].map(sbBarrier);
  const weak = line.filter((barrier) => sbState(barrier) !== 'healthy');
  const tile = (id: string) => {
    const barrier = sbBarrier(id);
    return <BarrierTile key={id} name={barrier.name} state={SB_STATE_LABEL[sbState(barrier)]} tone={SB_STATE_TONE[sbState(barrier)]} icon={barrier.icon} detail={sbDetail(barrier)} className="flex-1" />;
  };

  return (
    <LookScope look="signal" inheritTheme>
      <Canvas className="flex flex-col gap-4 p-5">
        <div className="flex flex-wrap items-end justify-between gap-4 px-1">
          <div>
            <p className="text-base font-semibold text-(--kit-text-2)">Line of defence · morning meeting</p>
            <p className="text-4xl font-extrabold tracking-tight tabular-nums">
              {weak.length === 0 ? 'Every barrier in this line is healthy' : `${weak.length} of ${line.length} barriers in this line are weakened`}
            </p>
          </div>
          <SegmentedControl value={hazardId} onValueChange={(next) => setHazardId(String(next))}>
            <SegmentedControlList aria-label="Hazard">
              {SB_HAZARDS.map((item) => (
                <SegmentedControlButton key={item.id} value={item.id}>
                  {item.label}
                </SegmentedControlButton>
              ))}
            </SegmentedControlList>
          </SegmentedControl>
        </div>
        <div className="grid grid-cols-[11rem_minmax(0,1fr)] gap-2">
          <SbChainEnd label="Threat" tone="neutral">
            {hazard.threat}
          </SbChainEnd>
          <div className="flex flex-col gap-1.5">
            <p className="px-1 text-sm font-semibold">Prevent · {hazard.prevent.length} barriers before the event</p>
            <div className="flex flex-1 gap-2">{hazard.prevent.map(tile)}</div>
          </div>
        </div>
        <div data-tone="critical" className="flex items-center justify-center gap-4 rounded-(--kit-radius) bg-(--t-vivid) px-5 py-3 text-(--t-on-vivid)">
          <IconArrowDown aria-hidden="true" className="size-6" />
          <p className="text-2xl font-extrabold tracking-tight">Top event: {hazard.event.toLowerCase()}</p>
          <IconArrowDown aria-hidden="true" className="size-6" />
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_11rem] gap-2">
          <div className="flex flex-col gap-1.5">
            <p className="px-1 text-sm font-semibold">Mitigate · {hazard.mitigate.length} barriers after the event</p>
            <div className="flex flex-1 gap-2">{hazard.mitigate.map(tile)}</div>
          </div>
          <SbChainEnd label="Consequence" tone="critical">
            {hazard.consequence}
          </SbChainEnd>
        </div>
        <Panel title="What weakens this line" subtitle={weak.length === 0 ? 'Nothing open' : `${weak.reduce((sum, barrier) => sum + barrier.faults.length, 0)} elements across ${weak.length} barriers`}>
          {weak.length === 0 ? (
            <p className="text-lg font-semibold">No degraded elements between the threat and the consequence.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-2">
              {weak.flatMap((barrier) =>
                barrier.faults.map((fault) => (
                  <ListRow
                    key={fault.tag}
                    tone={SB_STATE_TONE[fault.state]}
                    title={`${barrier.name}: ${fault.name}`}
                    meta={
                      <>
                        <TagId>{fault.tag}</TagId>
                        <span>{fault.finding}</span>
                      </>
                    }
                    trailing={<span className="text-sm font-semibold whitespace-nowrap">{fault.due}</span>}
                  />
                ))
              )}
            </ul>
          )}
        </Panel>
      </Canvas>
    </LookScope>
  );
}

type SbPermit = { id: string; type: string; work: string; holder: string; until: string; tone: Tone };

type SbArea = { id: string; name: string; tag: string; permits: SbPermit[] };

const SB_AREAS: SbArea[] = [
  { id: 'nk-20', name: 'Inlet and separation', tag: 'NK-20', permits: [{ id: 'PTW-2284', type: 'Cold work', work: 'Level transmitter calibration', holder: 'Jonas Nyberg', until: '16:00', tone: 'info' }] },
  {
    id: 'nk-23',
    name: 'Gas compression',
    tag: 'NK-23',
    permits: [
      { id: 'PTW-2291', type: 'Cold work', work: 'Recompressor bearing inspection', holder: 'Tomás Barros', until: '20:00', tone: 'info' },
      { id: 'PTW-2293', type: 'Work at height', work: 'Scaffold at the interstage cooler', holder: 'Scaffold team', until: '18:00', tone: 'warning' },
      { id: 'PTW-2295', type: 'Inhibit', work: 'Gas detector function test', holder: 'Jonas Nyberg', until: 'Fri 07:00', tone: 'warning' },
    ],
  },
  { id: 'nk-27', name: 'Gas export', tag: 'NK-27', permits: [{ id: 'PTW-2288', type: 'Hot work', work: 'Deck coating, grinding in bay 2', holder: 'Contractor crew', until: '17:00', tone: 'critical' }] },
  { id: 'nk-40', name: 'Cooling water', tag: 'NK-40', permits: [] },
];

function sbAreaTone(area: SbArea): Tone {
  if (area.permits.some((permit) => permit.tone === 'critical')) return 'critical';
  if (area.permits.some((permit) => permit.tone === 'warning')) return 'warning';
  return area.permits.length > 0 ? 'info' : 'success';
}

function sbAreaWord(area: SbArea): string {
  const tone = sbAreaTone(area);
  return tone === 'critical' ? 'Hot work' : tone === 'warning' ? 'Restricted' : tone === 'info' ? 'Work on' : 'Clear';
}

function SbPermitRows({ area }: { area: SbArea }) {
  return area.permits.length === 0 ? (
    <p className="text-lg font-semibold">No live permits. The area is clear for normal operation.</p>
  ) : (
    <ul className="flex flex-col gap-2">
      {area.permits.map((permit) => (
        <ListRow
          key={permit.id}
          tone={permit.tone}
          leading={<StatusPill tone={permit.tone}>{permit.type}</StatusPill>}
          title={permit.work}
          meta={
            <>
              <TagId>{permit.id}</TagId>
              <span>{permit.holder}</span>
            </>
          }
          trailing={<span className="text-sm font-semibold whitespace-nowrap">Until {permit.until}</span>}
        />
      ))}
    </ul>
  );
}

function SafetyAndBarriersPermits() {
  const [areaId, setAreaId] = useState('nk-23');
  const area = SB_AREAS.find((item) => item.id === areaId) ?? SB_AREAS[0];
  const total = SB_AREAS.reduce((sum, item) => sum + item.permits.length, 0);

  return (
    <LookScope look="signal">
      <Canvas className="grid grid-cols-12 gap-2">
        <div data-tone="neutral" className="col-span-3 flex flex-col justify-between gap-6 rounded-(--kit-radius) bg-(--kit-surface) p-5">
          <p className="text-xl font-extrabold tracking-tight">Permit board</p>
          <div>
            <p className="text-[7rem] leading-[0.85] font-extrabold tracking-tighter tabular-nums">{total}</p>
            <p className="mt-2 text-xl font-semibold">live permits on site</p>
            <p className="mt-1 text-base text-(--kit-text-2)">Thursday 12 March, 14:00. One hot work permit; no simultaneous hot work and inhibits in one area.</p>
          </div>
        </div>
        <div className="col-span-9 flex flex-col gap-2">
          <div className="grid grid-cols-4 gap-2">
            {SB_AREAS.map((item) => (
              <BarrierTile
                key={item.id}
                size="lg"
                name={item.name}
                state={sbAreaWord(item)}
                tone={sbAreaTone(item)}
                detail={`${item.permits.length} ${item.permits.length === 1 ? 'permit' : 'permits'}`}
                mark={item.tag}
                selected={item.id === areaId}
                onSelect={() => setAreaId(item.id)}
              />
            ))}
          </div>
          <Panel className="flex-1" title={area.name} subtitle={`${area.permits.length} live ${area.permits.length === 1 ? 'permit' : 'permits'}`}>
            <SbPermitRows area={area} />
          </Panel>
        </div>
      </Canvas>
    </LookScope>
  );
}

function SafetyAndBarriersBanner() {
  return (
    <LookScope look="signal">
      <Canvas>
        <SbBanner />
      </Canvas>
    </LookScope>
  );
}

function SafetyAndBarriersTiles() {
  return (
    <LookScope look="signal">
      <Canvas className="grid grid-cols-3 gap-2">
        {['containment', 'gas', 'firewater'].map((id) => {
          const barrier = sbBarrier(id);
          return <BarrierTile key={id} name={barrier.name} state={SB_STATE_LABEL[sbState(barrier)]} tone={SB_STATE_TONE[sbState(barrier)]} icon={barrier.icon} detail={sbDetail(barrier)} />;
        })}
      </Canvas>
    </LookScope>
  );
}

function SafetyAndBarriersSummary() {
  return (
    <LookScope look="signal" className="h-full">
      <Canvas className="flex h-full flex-col justify-center gap-3 p-4">
        <p className="text-xl font-extrabold tracking-tight">12 barriers</p>
        <SbSummary />
        <p className="text-base text-(--kit-text-2)">Widths follow the counts; the word is always written.</p>
      </Canvas>
    </LookScope>
  );
}

function SafetyAndBarriersElements() {
  const barrier = sbBarrier('gas');
  return (
    <LookScope look="signal">
      <Canvas>
        <Panel title={barrier.name} subtitle={`${barrier.faults.length} degraded elements`} actions={<StatusPill tone="warning" icon={<IconAlertTriangle />}>Degraded</StatusPill>}>
          <SbElements barrier={barrier} />
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function SafetyAndBarriersHealthy() {
  const barrier = sbBarrier('power');
  return (
    <LookScope look="signal" className="h-full">
      <Canvas className="h-full">
        <Panel className="h-full" title={barrier.name} subtitle={barrier.lastTest} actions={<StatusPill tone="success" icon={<IconCircleCheck />}>Healthy</StatusPill>}>
          <SbElements barrier={barrier} />
        </Panel>
      </Canvas>
    </LookScope>
  );
}

export default definePage({
  id: 'safety-and-barriers',
  title: 'Safety and barriers',
  summary:
    'A wall screen for barrier health: a days-since banner, twelve barriers as large tiles filled with their state, and the degraded elements of whichever barrier is selected.',
  guidance: {
    use: [
      'On a wall or meeting-room screen, where state must read from across the room.',
      'Fill the whole tile with the state and write the state as the largest word on it.',
      'Show the degraded elements and the compensating measure together: a weakened barrier is only acceptable with one.',
    ],
    avoid: [
      'State as a small dot or a coloured border; from five metres both disappear.',
      'A fourth and fifth state colour — healthy, degraded, impaired is what people can hold in mind.',
      'Charts on this screen; trends belong on the desk view.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'The barrier wall in the signal look.',
      specimens: [
        {
          id: 'SafetyAndBarriersSignature',
          title: 'Barrier wall',
          note: 'Pick it for the control room wall and the morning meeting: select a tile to see what is degraded and what covers for it.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['kit/safety-and-barriers/BarrierTile.tsx', 'kit/safety-and-barriers/DaysSinceBanner.tsx', 'kit/ListRow.tsx', 'kit/Panel.tsx', 'looks/LookScope.tsx'],
          Component: SafetyAndBarriersSignature,
        },
      ],
    },
    {
      id: 'variations',
      title: 'Other screens',
      description: 'The same barriers lined up against one hazard, in the surrounding light or dark mode, and the permit board.',
      specimens: [
        {
          id: 'SafetyAndBarriersLine',
          title: 'Line of defence',
          note: 'Pick it to discuss one hazard: the barriers in order from threat to consequence, and what weakens the line.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['kit/safety-and-barriers/BarrierTile.tsx', 'kit/ListRow.tsx', 'kit/Panel.tsx'],
          Component: SafetyAndBarriersLine,
        },
        {
          id: 'SafetyAndBarriersPermits',
          title: 'Permit board',
          note: 'Pick it for the permit office: areas as tiles, live permits for the selected area.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['kit/safety-and-barriers/BarrierTile.tsx', 'kit/ListRow.tsx', 'kit/StatusPill.tsx'],
          Component: SafetyAndBarriersPermits,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The pieces of the wall on their own.',
      specimens: [
        {
          id: 'SafetyAndBarriersBanner',
          title: 'Days-since banner',
          note: 'Use it as the one number a site wants everyone to see.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['kit/safety-and-barriers/DaysSinceBanner.tsx'],
          Component: SafetyAndBarriersBanner,
        },
        {
          id: 'SafetyAndBarriersTiles',
          title: 'Tile states',
          note: 'Use the three states only; each is a colour and a word.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['kit/safety-and-barriers/BarrierTile.tsx'],
          Component: SafetyAndBarriersTiles,
        },
        {
          id: 'SafetyAndBarriersSummary',
          title: 'State summary',
          note: 'Use it as the legend and the count in one strip.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          Component: SafetyAndBarriersSummary,
        },
        {
          id: 'SafetyAndBarriersElements',
          title: 'Degraded elements',
          note: 'Use it as the detail of one weakened barrier.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['kit/ListRow.tsx', 'kit/Panel.tsx'],
          Component: SafetyAndBarriersElements,
        },
        {
          id: 'SafetyAndBarriersHealthy',
          title: 'Healthy barrier',
          note: 'Use the empty state to confirm that nothing is open, with the last test date.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['kit/Panel.tsx'],
          Component: SafetyAndBarriersHealthy,
        },
      ],
    },
  ],
});
