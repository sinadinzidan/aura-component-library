import { Button } from '@cognite/aura/components/button';
import { Switch } from '@cognite/aura/components/switch';
import { IconAlertTriangle, IconChevronLeft, IconChevronRight, IconCircleCheck } from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { Canvas } from '../../../library/kit/Canvas';
import { focusRotation, placeContact, scoreRadius, sectorSize, stepFocus } from '../../../library/kit/hud-command-center/scope';
import { Meter } from '../../../library/kit/Meter';
import { arcBand, arcLine, polarPoint } from '../../../library/kit/radial-mission-control/polar';
import { RingGauge } from '../../../library/kit/RingGauge';
import { SparkLine } from '../../../library/kit/SparkLine';
import { StatusPill } from '../../../library/kit/StatusPill';
import { TagId } from '../../../library/kit/TagId';
import type { Tone } from '../../../library/kit/tones';
import { LookScope } from '../../../library/looks/LookScope';
import { ALARMS, ASSETS, PLANT_KPIS, findAsset, type Asset } from '../../data/plant';
import { makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './hud-command-center.tsx?raw';

type HudContact = { tag: string; name: string; score: number; state: string };

type HudSector = {
  id: string;
  name: string;
  short: string;
  contacts: readonly HudContact[];
  alarms: number;
  reading: { label: string; value: string; unit: string; trend: readonly number[] };
};

const HUD_STATE_LABEL: Record<Asset['state'], string> = {
  running: 'Running',
  standby: 'Standby',
  stopped: 'Stopped',
  tripped: 'Tripped',
  maintenance: 'Maintenance',
};

function hudContacts(areaId: string): HudContact[] {
  return ASSETS.filter((asset) => asset.parentId === areaId).map((asset) => ({
    tag: asset.tag,
    name: asset.name,
    score: asset.healthScore,
    state: HUD_STATE_LABEL[asset.state],
  }));
}

function hudAlarms(areaId: string): number {
  return ALARMS.filter((alarm) => alarm.state !== 'cleared' && findAsset(alarm.assetId)?.parentId === areaId).length;
}

const HUD_SECTORS: readonly HudSector[] = [
  {
    id: 'compression',
    name: 'Gas compression',
    short: 'Compression',
    contacts: hudContacts('nk-23'),
    alarms: hudAlarms('nk-23'),
    reading: {
      label: 'Discharge pressure',
      value: '48.6',
      unit: 'barg',
      trend: makeValues({ seed: 11, points: 32, base: 48.2, amplitude: 1.6, noise: 0.5 }),
    },
  },
  {
    id: 'export',
    name: 'Gas export',
    short: 'Export',
    contacts: hudContacts('nk-27'),
    alarms: hudAlarms('nk-27'),
    reading: { label: 'Export flow', value: '412', unit: 'm³/h', trend: makeValues({ seed: 20, points: 32, base: 405, amplitude: 14, noise: 5 }) },
  },
  {
    id: 'cooling',
    name: 'Cooling water',
    short: 'Cooling',
    contacts: [
      ...hudContacts('nk-40'),
      { tag: '40-PA-4002', name: 'Duty cooling pump', score: 91, state: 'Running' },
      { tag: '40-HA-4010', name: 'Seawater exchanger', score: 87, state: 'Running' },
    ],
    alarms: hudAlarms('nk-40'),
    reading: { label: 'Supply temperature', value: '18.4', unit: '°C', trend: makeValues({ seed: 23, points: 32, base: 18.2, amplitude: 0.6, noise: 0.2 }) },
  },
  {
    id: 'power',
    name: 'Power generation',
    short: 'Power',
    contacts: [
      { tag: '80-GT-8001', name: 'Generator A', score: 93, state: 'Running' },
      { tag: '80-GT-8002', name: 'Generator B', score: 90, state: 'Running' },
      { tag: '80-GT-8003', name: 'Generator C', score: 82, state: 'Standby' },
    ],
    alarms: 0,
    reading: { label: 'Load', value: '31.4', unit: 'MW', trend: makeValues({ seed: 24, points: 32, base: 31, amplitude: 1.2, noise: 0.4 }) },
  },
  {
    id: 'flare',
    name: 'Flare and relief',
    short: 'Flare',
    contacts: [
      { tag: '43-FL-4301', name: 'High-pressure flare', score: 96, state: 'Standby' },
      { tag: '43-VD-4305', name: 'Knock-out drum', score: 88, state: 'Running' },
    ],
    alarms: 0,
    reading: { label: 'Flaring', value: '12.4', unit: 'kSm³/d', trend: makeValues({ seed: 47, points: 32, base: 15, amplitude: 1.5, noise: 0.8, drift: -3 }) },
  },
  {
    id: 'inlet',
    name: 'Inlet and separation',
    short: 'Inlet',
    contacts: hudContacts('nk-20'),
    alarms: hudAlarms('nk-20'),
    reading: { label: 'Separator level', value: '54.3', unit: '%', trend: makeValues({ seed: 17, points: 32, base: 54, amplitude: 4, noise: 1.2 }) },
  },
];

const HUD_COUNT = HUD_SECTORS.length;

const HUD_RINGS = [
  { score: 85, radius: scoreRadius(85, 100, 40, 44, 268) },
  { score: 70, radius: scoreRadius(70, 100, 40, 44, 268) },
  { score: 55, radius: scoreRadius(55, 100, 40, 44, 268) },
];

function hudTone(score: number): Tone {
  return score >= 85 ? 'success' : score >= 60 ? 'warning' : 'critical';
}

function hudWord(score: number): string {
  return score >= 85 ? 'Good' : score >= 60 ? 'Watch' : 'Poor';
}

function hudSectorScore(sector: HudSector): number {
  return Math.round(sector.contacts.reduce((sum, contact) => sum + contact.score, 0) / sector.contacts.length);
}

const HUD_GLOW = 'drop-shadow(0 0 5px color-mix(in oklab, var(--kit-accent) 70%, transparent))';

type HudScopeProps = {
  /** Number of sector steps the scope has been turned; the focus sector is `turn` modulo the sector count. */
  turn: number;
  /** Run the rotating sweep beam. */
  sweep?: boolean;
  /** Tag labels on the contacts of the focus sector. */
  labels?: boolean;
};

/** The scope: sectors around a centre, contacts further out the worse their health, focus sector at the top. */
function HudScope({ turn, sweep = false, labels = true }: HudScopeProps) {
  const focus = stepFocus(turn, 0, HUD_COUNT);
  const rotation = focusRotation(turn, HUD_COUNT);
  const half = sectorSize(HUD_COUNT) / 2;
  const percent = (value: number) => `${(value / 600) * 100}%`;
  const move = 'transition-all duration-700 ease-out motion-reduce:transition-none';
  return (
    <div
      role="img"
      aria-label={`Plant scope, focus on ${HUD_SECTORS[focus].name}. Contacts sit further from the centre the lower their health.`}
      className="relative aspect-square w-full"
    >
      <svg viewBox="0 0 600 600" className="absolute inset-0 size-full" aria-hidden="true">
        <circle cx="300" cy="300" r="288" style={{ fill: 'color-mix(in oklab, var(--mountain-black) 55%, transparent)' }} />
        <g className={move} style={{ transform: `rotate(${rotation}deg)`, transformOrigin: '300px 300px' }}>
          {HUD_SECTORS.map((sector, index) => {
            const edge = polarPoint(300, 300, 288, index * sectorSize(HUD_COUNT));
            return <line key={sector.id} x1="300" y1="300" x2={edge.x} y2={edge.y} strokeWidth="1" style={{ stroke: 'var(--kit-rule-strong)' }} />;
          })}
          {Array.from({ length: 72 }, (_, tick) => {
            const from = polarPoint(300, 300, 288, tick * 5);
            const to = polarPoint(300, 300, tick % 6 === 0 ? 274 : 281, tick * 5);
            return <line key={tick} x1={from.x} y1={from.y} x2={to.x} y2={to.y} strokeWidth="1.5" style={{ stroke: 'var(--kit-rule-strong)' }} />;
          })}
        </g>
        {HUD_RINGS.map((ring) => (
          <circle key={ring.score} cx="300" cy="300" r={ring.radius} fill="none" strokeWidth="1" strokeDasharray="3 6" style={{ stroke: 'var(--kit-rule-strong)' }} />
        ))}
        <path d={arcBand(300, 300, 288, 0, -half, half)} style={{ fill: 'color-mix(in oklab, var(--kit-accent) 16%, transparent)' }} />
        <g fill="none" style={{ stroke: 'var(--kit-accent)', filter: HUD_GLOW }}>
          <circle cx="300" cy="300" r="288" strokeWidth="2" />
          <path d={arcLine(300, 300, 296, -half, half)} strokeWidth="5" strokeLinecap="round" />
          <path d={`M 300 300 L ${polarPoint(300, 300, 288, -half).x} ${polarPoint(300, 300, 288, -half).y}`} strokeWidth="2" />
          <path d={`M 300 300 L ${polarPoint(300, 300, 288, half).x} ${polarPoint(300, 300, 288, half).y}`} strokeWidth="2" />
          <path d="M 300 276 V 292 M 300 308 V 324 M 276 300 H 292 M 308 300 H 324" strokeWidth="2" />
          <circle cx="300" cy="300" r="16" strokeWidth="1.5" />
        </g>
      </svg>
      {sweep ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-[2%] rounded-full [animation-duration:7s] motion-safe:animate-spin motion-reduce:hidden"
          style={{
            background: 'conic-gradient(from 0deg, transparent 0deg 290deg, color-mix(in oklab, var(--kit-accent) 34%, transparent) 360deg)',
          }}
        />
      ) : null}
      {HUD_RINGS.map((ring) => (
        <span
          key={ring.score}
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-xs font-medium text-[var(--kit-text-2)] tabular-nums"
          style={{ left: '50%', top: percent(300 + ring.radius + 11) }}
        >
          {ring.score}
        </span>
      ))}
      {HUD_SECTORS.map((sector, index) => {
        if (index === focus) return null;
        const point = polarPoint(300, 300, 246, (index + 0.5) * sectorSize(HUD_COUNT) + rotation);
        return (
          <span
            key={sector.id}
            className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-xs font-semibold text-[var(--kit-text-2)] ${move}`}
            style={{ left: percent(point.x), top: percent(point.y) }}
          >
            {sector.short}
          </span>
        );
      })}
      {HUD_SECTORS.flatMap((sector, index) =>
        sector.contacts.map((contact, slot) => {
          const place = placeContact(index, HUD_COUNT, slot, sector.contacts.length, scoreRadius(contact.score, 100, 40, 44, 268), rotation);
          const point = polarPoint(300, 300, place.radius, place.angle);
          const focused = index === focus;
          const tone = hudTone(contact.score);
          const side = slot < sector.contacts.length / 2 && sector.contacts.length > 1 ? 'right-full mr-2' : 'left-full ml-2';
          return (
            <span
              key={contact.tag}
              data-tone={tone}
              className={`pointer-events-none absolute flex -translate-x-1/2 -translate-y-1/2 items-center ${move}`}
              style={{ left: percent(point.x), top: percent(point.y) }}
            >
              <span
                className={`block border-2 border-[var(--t-line)] ${tone === 'success' ? 'rounded-full' : tone === 'warning' ? 'rounded-sm' : 'rotate-45 rounded-none'} ${
                  focused ? 'size-4 bg-[var(--t-line)]' : 'size-3 bg-[color-mix(in_oklab,var(--t-line)_35%,transparent)]'
                }`}
                style={focused ? { boxShadow: '0 0 12px 2px color-mix(in oklab, var(--t-line) 70%, transparent)' } : undefined}
              />
              {focused && labels ? (
                <span className={`absolute top-1/2 -translate-y-1/2 text-xs font-semibold whitespace-nowrap text-[var(--kit-text)] tabular-nums ${side}`}>
                  {contact.tag}
                </span>
              ) : null}
            </span>
          );
        })
      )}
    </div>
  );
}

/** A corner instrument: a glass plate with bracket corners, the HUD's only container. */
function HudInstrument({ title, aside, className = '', children }: { title: string; aside?: ReactNode; className?: string; children: ReactNode }) {
  const corner = 'pointer-events-none absolute size-3 border-[var(--kit-accent)]';
  return (
    <section
      className={`relative flex flex-col gap-3 border border-[var(--kit-rule)] bg-[var(--kit-surface)] p-4 backdrop-blur-md ${className}`}
      aria-label={title}
    >
      <span aria-hidden="true" className={`${corner} -top-px -left-px border-t-2 border-l-2`} />
      <span aria-hidden="true" className={`${corner} -top-px -right-px border-t-2 border-r-2`} />
      <span aria-hidden="true" className={`${corner} -bottom-px -left-px border-b-2 border-l-2`} />
      <span aria-hidden="true" className={`${corner} -right-px -bottom-px border-r-2 border-b-2`} />
      <header className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-[var(--kit-text-2)]">{title}</h3>
        {aside}
      </header>
      {children}
    </section>
  );
}

function HudPlant({ className }: { className?: string }) {
  return (
    <HudInstrument
      title="Nordkapp"
      className={className}
      aside={
        <StatusPill tone="warning" icon={<IconAlertTriangle />}>
          Reduced capacity
        </StatusPill>
      }
    >
      <p className="text-4xl leading-none font-semibold tracking-tight tabular-nums">
        {PLANT_KPIS.gasExport.value.toFixed(2)} <span className="text-sm font-medium text-[var(--kit-text-2)]">MSm³/d export</span>
      </p>
      <Meter label="Against plan" value={PLANT_KPIS.gasExport.value} min={3.5} max={5} decimals={2} unit="MSm³/d" target={{ value: 4.5, label: 'Plan' }} tone="warning" />
    </HudInstrument>
  );
}

function HudFocus({ sector, className }: { sector: HudSector; className?: string }) {
  const score = hudSectorScore(sector);
  const running = sector.contacts.filter((contact) => contact.state === 'Running').length;
  return (
    <HudInstrument title="Focus sector" className={className} aside={<StatusPill tone={hudTone(score)}>{hudWord(score)}</StatusPill>}>
      <div className="flex items-center gap-4">
        <RingGauge label={`${sector.name} health`} value={score} unit="" tone={hudTone(score)} size={84} hideLabel />
        <div className="min-w-0">
          <p className="text-xl leading-tight font-semibold">{sector.name}</p>
          <p className="mt-1 text-sm text-[var(--kit-text-2)] tabular-nums">
            {running} of {sector.contacts.length} running · {sector.alarms} {sector.alarms === 1 ? 'alarm' : 'alarms'}
          </p>
        </div>
      </div>
    </HudInstrument>
  );
}

function HudContacts({ sector, className }: { sector: HudSector; className?: string }) {
  return (
    <HudInstrument title="Contacts in sector" className={className} aside={<span className="text-sm text-[var(--kit-text-2)] tabular-nums">{sector.contacts.length}</span>}>
      <ul className="flex flex-col gap-2">
        {sector.contacts.map((contact) => (
          <li key={contact.tag} data-tone={hudTone(contact.score)} className="flex items-center gap-3 border-l-[3px] border-[var(--t-line)] pl-2.5">
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-tight font-medium">{contact.name}</p>
              <p className="text-xs text-[var(--kit-text-2)]">
                <TagId>{contact.tag}</TagId> · {contact.state}
              </p>
            </div>
            <span className="text-base font-semibold text-[var(--t-ink)] tabular-nums">{contact.score}</span>
          </li>
        ))}
      </ul>
    </HudInstrument>
  );
}

function HudReading({ sector, className }: { sector: HudSector; className?: string }) {
  return (
    <HudInstrument title={sector.reading.label} className={className} aside={<span className="text-sm text-[var(--kit-text-2)]">Last 8 h</span>}>
      <p className="text-4xl leading-none font-semibold tracking-tight tabular-nums">
        {sector.reading.value} <span className="text-sm font-medium text-[var(--kit-text-2)]">{sector.reading.unit}</span>
      </p>
      <SparkLine values={sector.reading.trend} label={`${sector.reading.label}, last 8 hours`} tone="accent" variant="area" className="h-20 w-full" />
    </HudInstrument>
  );
}

/** The heading tape: sectors in order with the focus one in the middle. */
function HudTape({ turn }: { turn: number }) {
  const offsets = [-2, -1, 0, 1, 2];
  return (
    <div className="flex items-end justify-center gap-5" aria-hidden="true">
      {offsets.map((offset) => {
        const sector = HUD_SECTORS[stepFocus(turn, offset, HUD_COUNT)];
        return offset === 0 ? (
          <span key={offset} className="border-b-2 border-[var(--kit-accent)] px-3 pb-1 text-lg leading-tight font-semibold">
            {sector.name}
          </span>
        ) : (
          <span key={offset} className={`pb-1.5 text-sm font-medium ${Math.abs(offset) === 1 ? 'text-[var(--kit-text-2)]' : 'text-[var(--kit-text-3)] opacity-70'}`}>
            {sector.short}
          </span>
        );
      })}
    </div>
  );
}

function HudRotate({ turn, onTurn }: { turn: number; onTurn: (turn: number) => void }) {
  const focus = stepFocus(turn, 0, HUD_COUNT);
  return (
    <div className="flex items-center gap-3 rounded-full border border-[var(--kit-rule)] bg-[var(--kit-surface)] p-1.5 backdrop-blur-md">
      <Button variant="ghost" size="sm" onClick={() => onTurn(turn - 1)}>
        <IconChevronLeft /> {HUD_SECTORS[stepFocus(turn, -1, HUD_COUNT)].short}
      </Button>
      <p className="text-sm font-medium tabular-nums" aria-live="polite">
        Sector {focus + 1} of {HUD_COUNT}
      </p>
      <Button variant="ghost" size="sm" onClick={() => onTurn(turn + 1)}>
        {HUD_SECTORS[stepFocus(turn, 1, HUD_COUNT)].short} <IconChevronRight />
      </Button>
    </div>
  );
}

/** The HUD's own backdrop: one teal glow behind the scope on near-black. */
function HudBackdrop({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      data-accent="nordic"
      className={`relative overflow-hidden ${className}`}
      style={{
        background:
          'radial-gradient(48% 56% at 50% 46%, color-mix(in oklab, var(--nordic-600) 46%, transparent), transparent 74%), radial-gradient(40% 40% at 50% 110%, color-mix(in oklab, var(--fjord-600) 40%, transparent), transparent 70%), var(--mountain-black)',
      }}
    >
      {children}
    </div>
  );
}

function HudCommandCenterSignature() {
  const [turn, setTurn] = useState(0);
  const [sweep, setSweep] = useState(false);
  const sector = HUD_SECTORS[stepFocus(turn, 0, HUD_COUNT)];
  return (
    <LookScope look="glass">
      <Canvas padding="none">
        <HudBackdrop className="h-[47.5rem]">
          <div data-look="glass" className="absolute inset-x-0 top-5">
            <HudTape turn={turn} />
          </div>
          <div data-look="glass" className="absolute top-[4.5rem] left-1/2 w-[min(54%,35.5rem)] -translate-x-1/2">
            <HudScope turn={turn} sweep={sweep} />
          </div>
          <div data-look="glass" className="absolute top-4 left-4 w-[16.5rem]">
            <HudPlant />
          </div>
          <div data-look="glass" className="absolute top-4 right-4 w-[16.5rem]">
            <HudFocus sector={sector} />
          </div>
          <div data-look="glass" className="absolute bottom-4 left-4 w-[16.5rem]">
            <HudContacts sector={sector} />
          </div>
          <div data-look="glass" className="absolute right-4 bottom-4 w-[16.5rem]">
            <HudReading sector={sector} />
          </div>
          <div data-look="glass" className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-4">
            <HudRotate turn={turn} onTurn={setTurn} />
            <Switch label="Sweep" checked={sweep} onCheckedChange={setSweep} />
          </div>
        </HudBackdrop>
      </Canvas>
    </LookScope>
  );
}

function HudCommandCenterSectorLock() {
  const [turn, setTurn] = useState(5);
  const sector = HUD_SECTORS[stepFocus(turn, 0, HUD_COUNT)];
  const score = hudSectorScore(sector);
  return (
    <LookScope look="glass">
      <Canvas padding="none">
        <HudBackdrop className="p-5">
          <div data-look="glass" className="grid grid-cols-[minmax(0,5fr)_minmax(0,6fr)] items-center gap-6">
            <div className="flex flex-col items-center gap-4">
              <HudScope turn={turn} labels={false} />
              <HudRotate turn={turn} onTurn={setTurn} />
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-sm font-medium text-[var(--kit-text-2)]">Sector lock</p>
                <p className="text-3xl leading-tight font-semibold tracking-tight">{sector.name}</p>
                <div className="mt-2 flex items-center gap-3">
                  <StatusPill tone={hudTone(score)} size="lg" icon={score >= 85 ? <IconCircleCheck /> : <IconAlertTriangle />}>
                    {hudWord(score)} · {score} / 100
                  </StatusPill>
                  <span className="text-sm text-[var(--kit-text-2)] tabular-nums">
                    {sector.alarms} open {sector.alarms === 1 ? 'alarm' : 'alarms'}
                  </span>
                </div>
              </div>
              <ul className="flex flex-col gap-3">
                {sector.contacts.map((contact) => (
                  <li key={contact.tag} className="border border-[var(--kit-rule)] bg-[var(--kit-surface)] p-3 backdrop-blur-md">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-base font-semibold">{contact.name}</p>
                      <StatusPill tone={contact.state === 'Tripped' ? 'critical' : contact.state === 'Running' ? 'success' : 'info'}>{contact.state}</StatusPill>
                    </div>
                    <Meter label={contact.tag} value={contact.score} max={100} tone={hudTone(contact.score)} low={60} target={{ value: 85, label: 'Good from' }} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </HudBackdrop>
      </Canvas>
    </LookScope>
  );
}

function HudCommandCenterVisor() {
  const [turn, setTurn] = useState(1);
  const sector = HUD_SECTORS[stepFocus(turn, 0, HUD_COUNT)];
  return (
    <LookScope look="glass">
      <Canvas padding="none">
        <HudBackdrop className="p-4">
          <div data-look="glass" className="flex flex-col items-center gap-4">
            <HudFocus sector={sector} className="w-full" />
            <HudScope turn={turn} labels={false} />
            <HudRotate turn={turn} onTurn={setTurn} />
          </div>
        </HudBackdrop>
      </Canvas>
    </LookScope>
  );
}

function HudCommandCenterScope() {
  const [sweep, setSweep] = useState(false);
  return (
    <LookScope look="glass" className="w-full">
      <Canvas padding="none">
        <HudBackdrop className="p-5">
          <div data-look="glass" className="flex flex-col items-center gap-3">
            <HudScope turn={0} sweep={sweep} labels={false} />
            <Switch label="Sweep" checked={sweep} onCheckedChange={setSweep} />
          </div>
        </HudBackdrop>
      </Canvas>
    </LookScope>
  );
}

function HudCommandCenterTape() {
  const [turn, setTurn] = useState(2);
  return (
    <LookScope look="glass" className="w-full">
      <Canvas padding="none">
        <HudBackdrop className="flex h-full flex-col items-center justify-center gap-8 p-6">
          <div data-look="glass">
            <HudTape turn={turn} />
          </div>
          <div data-look="glass">
            <HudRotate turn={turn} onTurn={setTurn} />
          </div>
        </HudBackdrop>
      </Canvas>
    </LookScope>
  );
}

function HudCommandCenterPlant() {
  return (
    <LookScope look="glass" className="w-full">
      <Canvas padding="none">
        <HudBackdrop className="flex h-full flex-col justify-center gap-4 p-5">
          <HudPlant />
          <HudFocus sector={HUD_SECTORS[0]} />
        </HudBackdrop>
      </Canvas>
    </LookScope>
  );
}

function HudCommandCenterContacts() {
  return (
    <LookScope look="glass" className="w-full">
      <Canvas padding="none">
        <HudBackdrop className="flex h-full flex-col justify-center p-5">
          <HudContacts sector={HUD_SECTORS[0]} />
        </HudBackdrop>
      </Canvas>
    </LookScope>
  );
}

function HudCommandCenterReading() {
  return (
    <LookScope look="glass" className="w-full">
      <Canvas padding="none">
        <HudBackdrop className="flex h-full flex-col justify-center gap-4 p-5">
          <HudReading sector={HUD_SECTORS[0]} />
          <HudReading sector={HUD_SECTORS[3]} />
        </HudBackdrop>
      </Canvas>
    </LookScope>
  );
}

export default definePage({
  id: 'hud-command-center',
  title: 'HUD command center',
  summary:
    'A head-up view of the plant: one circular scope with every unit as a contact, further from the centre the worse its health, and four corner instruments that follow the sector in focus.',
  guidance: {
    use: [
      'When the question is where the trouble is: distance from the centre answers it before any number is read.',
      'For five to eight sectors with a handful of units each; the focus sector carries the labels.',
      'On a large dark display, with the sweep left off unless the room wants motion.',
    ],
    avoid: [
      'Labelling every contact at once: only the focus sector is named, the instruments name the rest.',
      'Colour alone for health: contacts change shape as well, and the list spells the state.',
      'Small monospaced HUD captions; the instruments use the same readable type as every other screen.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Rotate the scope with the two buttons: the next sector turns to the top and all four instruments follow.',
      specimens: [
        {
          id: 'HudCommandCenterSignature',
          title: 'Head-up scope',
          note: 'Pick it when one operator watches the whole plant and needs to see where health is slipping.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/hud-command-center/scope.ts', 'kit/radial-mission-control/polar.ts', 'kit/Meter.tsx', 'kit/RingGauge.tsx', 'kit/SparkLine.tsx', 'looks/LookScope.tsx'],
          Component: HudCommandCenterSignature,
        },
      ],
    },
    {
      id: 'variations',
      title: 'Variations',
      description: 'Two more screens: a sector locked and opened up beside the scope, and the visor layout for a narrow display.',
      specimens: [
        {
          id: 'HudCommandCenterSectorLock',
          title: 'Sector lock',
          note: 'Pick it as the drill-in: the scope shrinks to a locator and every contact gets its health bar.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          bleed: true,
          uses: ['kit/hud-command-center/scope.ts', 'kit/Meter.tsx', 'kit/StatusPill.tsx'],
          Component: HudCommandCenterSectorLock,
        },
        {
          id: 'HudCommandCenterVisor',
          title: 'Visor',
          note: 'Pick it for a tablet or a narrow side screen: focus readout on top, scope below, rotate with the thumb.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['kit/hud-command-center/scope.ts', 'kit/RingGauge.tsx'],
          Component: HudCommandCenterVisor,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The scope, the tape and the corner instruments on their own.',
      specimens: [
        {
          id: 'HudCommandCenterScope',
          title: 'Scope',
          note: 'Pick it to place items by group and by score; turn the sweep on only when motion helps.',
          origin: 'custom',
          align: 'stretch',
          bleed: true,
          uses: ['kit/hud-command-center/scope.ts', 'kit/radial-mission-control/polar.ts'],
          Component: HudCommandCenterScope,
        },
        {
          id: 'HudCommandCenterPlant',
          title: 'Plant and focus instruments',
          note: 'Pick them for the two top corners: the plant figure that never changes place and the sector in focus.',
          origin: 'custom',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Meter.tsx', 'kit/RingGauge.tsx', 'kit/StatusPill.tsx'],
          Component: HudCommandCenterPlant,
        },
        {
          id: 'HudCommandCenterContacts',
          title: 'Contact list',
          note: 'Pick it to name what the scope shows as shapes: unit, tag, state and score.',
          origin: 'custom',
          align: 'stretch',
          bleed: true,
          uses: ['kit/TagId.tsx'],
          Component: HudCommandCenterContacts,
        },
        {
          id: 'HudCommandCenterReading',
          title: 'Reading instrument',
          note: 'Pick it for one live value with the shape of its last hours.',
          origin: 'custom',
          align: 'stretch',
          bleed: true,
          uses: ['kit/SparkLine.tsx'],
          Component: HudCommandCenterReading,
        },
        {
          id: 'HudCommandCenterTape',
          title: 'Sector tape and rotate control',
          note: 'Pick them together: the tape says where the scope points, the control turns it one sector at a time.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/hud-command-center/scope.ts'],
          Component: HudCommandCenterTape,
        },
      ],
    },
  ],
});
