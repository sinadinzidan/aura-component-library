import { Button } from '@cognite/aura/components/button';
import { IconChevronLeft, IconChevronRight, IconLockOpen } from '@cognite/aura/icons';
import { useReducer } from 'react';
import type { ReactNode } from 'react';

import { ArcReadout } from '../../../library/experiences/futuristic/ArcReadout';
import { BracketFrame } from '../../../library/experiences/futuristic/BracketFrame';
import { EdgeRuler } from '../../../library/experiences/futuristic/EdgeRuler';
import { GlowText } from '../../../library/experiences/futuristic/GlowText';
import { neonFromStatus } from '../../../library/experiences/futuristic/neon';
import type { NeonTone } from '../../../library/experiences/futuristic/neon';
import { cycleTarget } from '../../../library/experiences/futuristic/radar';
import { RadarScope } from '../../../library/experiences/futuristic/RadarScope';
import type { RadarGroup } from '../../../library/experiences/futuristic/RadarScope';
import { Reticle } from '../../../library/experiences/futuristic/Reticle';
import { formatReading, healthStatus, runStateStatus, severityStatus, toneFromLimits } from '../../../library/industrial/status';
import type { Tone } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ThemeScope } from '../../../library/themes/ThemeScope';
import { ALARMS, ASSETS, childrenOf, findAsset, sensorsOf } from '../../data/plant';
import type { Asset } from '../../data/plant';
import { MINUTE, REFERENCE_NOW, formatAgo, formatTime } from '../../data/series';
import { definePage } from '../../types';

import source from './hud-command-center.tsx?raw';

type HudCommandLogEntry = { id: string; time: string; text: string; tone?: NeonTone };
type HudCommandState = { lockedId: string | null; log: readonly HudCommandLogEntry[]; sequence: number };
type HudCommandAction = { type: 'lock'; id: string } | { type: 'step'; direction: 1 | -1 } | { type: 'release' };

const HUD_COMMAND_AREAS = ASSETS.filter((asset) => asset.type === 'area' || asset.type === 'system');
const HUD_COMMAND_UNITS = HUD_COMMAND_AREAS.flatMap((area) => childrenOf(area.id));
const HUD_COMMAND_UNIT_IDS = HUD_COMMAND_UNITS.map((unit) => unit.id);
const HUD_COMMAND_OPEN_ALARMS = ALARMS.filter((alarm) => alarm.state === 'active' || alarm.state === 'acknowledged');
/** The queue shows the most severe alarms; the rest are counted. `ALARMS` is already in that order. */
const HUD_COMMAND_QUEUE_LENGTH = 4;

/** Load (share of rated duty) and overall vibration per unit; the shared plant model has no such roll-up. */
const HUD_COMMAND_METRICS: Record<string, { load: number; vibration: number }> = {
  '20-va-1001': { load: 64, vibration: 0.4 },
  '20-va-1002': { load: 0, vibration: 0 },
  '20-xv-1105': { load: 100, vibration: 0.2 },
  '23-ka-9101': { load: 91, vibration: 6.8 },
  '23-ka-9102': { load: 86, vibration: 3.1 },
  '23-ka-9103': { load: 0, vibration: 11.6 },
  '23-ha-9114': { load: 78, vibration: 0.9 },
  '23-gt-9001': { load: 83, vibration: 2.7 },
  '27-pa-2001a': { load: 72, vibration: 2.2 },
  '27-pa-2001b': { load: 0, vibration: 0 },
  '40-pa-4001': { load: 0, vibration: 0 },
};

const HUD_COMMAND_INITIAL_LOG: readonly HudCommandLogEntry[] = [
  { id: 'l4', time: formatTime(REFERENCE_NOW - 14 * MINUTE), text: '23-KA-9103 tripped, high vibration', tone: 'critical' },
  { id: 'l3', time: formatTime(REFERENCE_NOW - 21 * MINUTE), text: 'Field crew dispatched to NK-23', tone: 'accent' },
  { id: 'l2', time: formatTime(REFERENCE_NOW - 38 * MINUTE), text: '23-KA-9101 discharge temperature high', tone: 'warning' },
  { id: 'l1', time: formatTime(REFERENCE_NOW - 95 * MINUTE), text: 'Shift handover complete', tone: 'accent' },
];

/** Blip tone: a trip is critical, degraded health or maintenance a warning, standby informational. */
function hudCommandTone(unit: Asset): Tone {
  if (unit.state === 'tripped' || unit.health === 'poor') return 'critical';
  if (unit.state === 'maintenance' || unit.health === 'watch') return 'warning';
  if (unit.state === 'standby') return 'info';
  return 'neutral';
}

const HUD_COMMAND_GROUPS: readonly RadarGroup[] = HUD_COMMAND_AREAS.map((area) => ({
  id: area.id,
  label: area.tag,
  items: childrenOf(area.id).map((unit) => ({
    id: unit.id,
    label: unit.tag,
    score: unit.healthScore,
    description: `${unit.tag} ${unit.name}, health ${unit.healthScore}, ${runStateStatus(unit.state).label.toLowerCase()}`,
    tone: neonFromStatus(hudCommandTone(unit)),
  })),
}));

function hudCommandLog(state: HudCommandState, text: string, tone: NeonTone): Pick<HudCommandState, 'log' | 'sequence'> {
  const sequence = state.sequence + 1;
  // New entries are numbered, not timed: the demo has no clock.
  const entry = { id: `s${sequence}`, time: `OP ${String(sequence).padStart(2, '0')}`, text, tone };
  return { sequence, log: [entry, ...state.log].slice(0, 7) };
}

function hudCommandReducer(state: HudCommandState, action: HudCommandAction): HudCommandState {
  switch (action.type) {
    case 'release':
      if (state.lockedId === null) return state;
      return { lockedId: null, ...hudCommandLog(state, 'Target released', 'neutral') };
    case 'lock':
    case 'step': {
      const id = action.type === 'lock' ? action.id : cycleTarget(HUD_COMMAND_UNIT_IDS, state.lockedId, action.direction);
      const unit = id ? findAsset(id) : undefined;
      if (!unit || unit.id === state.lockedId) return state;
      return { lockedId: unit.id, ...hudCommandLog(state, `Target lock ${unit.tag}`, 'accent') };
    }
  }
}

function HudCommandStatusPanel({ className }: { className?: string }) {
  return (
    <BracketFrame title="System status" meta={`${HUD_COMMAND_UNITS.length} units`} className={className}>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-muted-foreground">
            <th scope="col" className="pb-1 font-normal">
              Area
            </th>
            <th scope="col" className="pb-1 font-normal">
              Health
            </th>
            <th scope="col" className="pb-1 text-right font-normal">
              Score
            </th>
          </tr>
        </thead>
        <tbody>
          {HUD_COMMAND_AREAS.map((area) => (
            <tr key={area.id} className="border-t border-default">
              <th scope="row" className="py-1.5 text-left font-normal">
                <span className="block font-mono font-medium text-base-foreground">{area.tag}</span>
                <span className="block text-muted-foreground">{area.name}</span>
              </th>
              <td className="py-1.5 align-top">
                <StatusIndicator {...healthStatus(area.health)} size="sm" />
              </td>
              <td className="py-1.5 text-right align-top font-mono tabular-nums text-base-foreground">{area.healthScore}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </BracketFrame>
  );
}

function HudCommandLogPanel({ log, className }: { log: readonly HudCommandLogEntry[]; className?: string }) {
  return (
    <BracketFrame title="Comms log" meta="Newest first" className={className}>
      <ol role="log" aria-label="Comms log" className="flex flex-col gap-1.5 text-xs">
        {log.map((entry) => (
          <li key={entry.id} className="flex gap-2">
            <span className="w-11 shrink-0 font-mono tabular-nums text-muted-foreground">{entry.time}</span>
            <GlowText tone={entry.tone ?? 'accent'} glow={false} className={entry.tone === 'neutral' || entry.tone === 'accent' ? 'text-medium-foreground' : undefined}>
              {entry.text}
            </GlowText>
          </li>
        ))}
      </ol>
    </BracketFrame>
  );
}

function HudCommandAlarmPanel({ lockedId, onLock, className }: { lockedId: string | null; onLock: (id: string) => void; className?: string }) {
  const shown = HUD_COMMAND_OPEN_ALARMS.slice(0, HUD_COMMAND_QUEUE_LENGTH);
  const hidden = HUD_COMMAND_OPEN_ALARMS.length - shown.length;
  return (
    <BracketFrame title="Alarm queue" meta={`${HUD_COMMAND_OPEN_ALARMS.length} open`} tone="warning" className={className}>
      <ul className="flex flex-col text-xs">
        {shown.map((alarm) => {
          const asset = findAsset(alarm.assetId);
          const canLock = HUD_COMMAND_UNIT_IDS.includes(alarm.assetId);
          return (
            <li key={alarm.id} className="border-t border-default first:border-t-0">
              <button
                type="button"
                disabled={!canLock}
                aria-pressed={lockedId === alarm.assetId}
                aria-label={`Lock on ${asset?.tag ?? alarm.sensorTag}: ${alarm.message}`}
                onClick={() => onLock(alarm.assetId)}
                className="flex w-full flex-col gap-0.5 px-1 py-1.5 text-left outline-none hover:bg-[color-mix(in_oklab,var(--primary-background)_10%,transparent)] focus-visible:bg-[color-mix(in_oklab,var(--primary-background)_20%,transparent)] aria-pressed:bg-[color-mix(in_oklab,var(--primary-background)_14%,transparent)]"
              >
                <span className="flex items-center justify-between gap-2">
                  <StatusIndicator {...severityStatus(alarm.severity)} size="sm" />
                  <span className="font-mono tabular-nums text-muted-foreground">{formatAgo(alarm.raisedAt)}</span>
                </span>
                <span className="text-base-foreground">{alarm.message}</span>
                <span className="font-mono text-muted-foreground">{asset?.tag}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {hidden > 0 ? <p className="mt-auto px-1 pt-1 text-xs text-muted-foreground">{`${hidden} more of lower priority`}</p> : null}
    </BracketFrame>
  );
}

function HudCommandTargetPanel({ unit, className }: { unit: Asset | undefined; className?: string }) {
  if (!unit) {
    return (
      <BracketFrame title="Target" meta="No lock" tone="neutral" className={className}>
        <p className="text-sm text-medium-foreground">No target locked.</p>
        <p className="mt-1 text-xs text-muted-foreground">Select a blip on the scope, an alarm in the queue, or step through the units with Next target.</p>
      </BracketFrame>
    );
  }
  const tone = neonFromStatus(hudCommandTone(unit));
  const metrics = HUD_COMMAND_METRICS[unit.id];
  const sensors = sensorsOf(unit.id).slice(0, 3);
  return (
    <BracketFrame title="Target" meta={`Crit ${unit.criticality}`} tone={tone} className={className}>
      <div className="flex flex-col gap-1">
        <GlowText tone={tone} mono className="text-base font-semibold">
          {unit.tag}
        </GlowText>
        <span className="text-sm text-base-foreground">{unit.name}</span>
        <StatusIndicator {...runStateStatus(unit.state)} size="sm" />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <ArcReadout value={unit.healthScore} label="Health" tone={tone} className="w-full" />
        <ArcReadout value={metrics.load} label="Load" unit="%" className="w-full" />
        <ArcReadout
          value={metrics.vibration}
          label="Vibration"
          unit="mm/s"
          decimals={1}
          max={15}
          tone={metrics.vibration >= 11 ? 'critical' : metrics.vibration > 7.1 ? 'warning' : 'accent'}
          className="w-full"
        />
      </div>
      {sensors.length > 0 ? (
        <dl className="mt-3 grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 text-xs">
          {sensors.map((sensor) => {
            const sensorTone = toneFromLimits(sensor.value, { low: sensor.lowLimit, high: sensor.highLimit, highHigh: sensor.highHighLimit });
            return (
              <div key={sensor.id} className="contents">
                <dt className="text-muted-foreground">{sensor.name}</dt>
                <dd className="text-right font-mono tabular-nums text-base-foreground">
                  {formatReading(sensor.value, sensor.unit, sensor.decimals)}
                  {sensorTone === 'neutral' ? null : <span className="pl-1 text-warning-foreground-strong">high</span>}
                </dd>
              </div>
            );
          })}
        </dl>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">No live tags mapped to this unit.</p>
      )}
    </BracketFrame>
  );
}

function HudCommandControls({ unit, dispatch }: { unit: Asset | undefined; dispatch: (action: HudCommandAction) => void }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Button variant="outline" size="sm" onClick={() => dispatch({ type: 'step', direction: -1 })}>
        <IconChevronLeft />
        Previous target
      </Button>
      <Button variant="outline" size="sm" onClick={() => dispatch({ type: 'step', direction: 1 })}>
        Next target
        <IconChevronRight />
      </Button>
      {unit ? (
        <Button variant="ghost" size="sm" onClick={() => dispatch({ type: 'release' })}>
          <IconLockOpen />
          Release lock
        </Button>
      ) : null}
    </div>
  );
}

function HudCommandRulers() {
  return (
    <>
      <EdgeRuler edge="top" className="absolute inset-x-3 top-1 w-auto" />
      <EdgeRuler edge="bottom" className="absolute inset-x-3 bottom-1 w-auto" />
      <EdgeRuler edge="left" divisions={60} className="absolute inset-y-3 left-1 h-auto" />
      <EdgeRuler edge="right" divisions={60} className="absolute inset-y-3 right-1 h-auto" />
    </>
  );
}

function HudCommandScreen({ initialLockedId = null }: { initialLockedId?: string | null }) {
  const [state, dispatch] = useReducer(hudCommandReducer, { lockedId: initialLockedId, log: HUD_COMMAND_INITIAL_LOG, sequence: 0 });
  const unit = state.lockedId ? findAsset(state.lockedId) : undefined;
  const lock = (id: string) => dispatch({ type: 'lock', id });

  return (
    <div className="relative h-[44rem] overflow-hidden rounded-xl border border-default bg-base-background text-base-foreground">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--primary-background)_12%,transparent),transparent_60%)]"
      />
      <HudCommandRulers />
      <div className="relative grid h-full grid-cols-[16rem_minmax(0,1fr)_16rem] grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-x-5 gap-y-4 p-6">
        <HudCommandStatusPanel className="col-start-1 row-start-1" />
        <HudCommandLogPanel log={state.log} className="col-start-1 row-start-2" />
        <div className="col-start-2 row-span-2 row-start-1 flex min-h-0 flex-col items-center gap-3">
          <div className="flex flex-col items-center gap-1 text-center">
            <GlowText variant="label">HUD // Command center</GlowText>
            <span className="text-xs text-muted-foreground">Nordkapp. Sector is area, distance from the core is health. Degraded units sink inwards.</span>
          </div>
          <div className="min-h-0 w-full flex-1">
            <RadarScope
              groups={HUD_COMMAND_GROUPS}
              label="Equipment by area and health. Select a unit to lock on."
              lockedId={state.lockedId}
              onLock={lock}
              criticalBelow={50}
            />
          </div>
          <HudCommandControls unit={unit} dispatch={dispatch} />
        </div>
        <HudCommandAlarmPanel lockedId={state.lockedId} onLock={lock} className="col-start-3 row-start-1" />
        <HudCommandTargetPanel unit={unit} className="col-start-3 row-start-2" />
      </div>
    </div>
  );
}

function HudCommandStage({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <ThemeScope preset="hologram" className="w-full">
      <div className={`rounded-xl border border-default bg-base-background p-5 text-base-foreground ${className}`.trim()}>{children}</div>
    </ThemeScope>
  );
}

function HudCommandCenterExperience() {
  return (
    <ThemeScope preset="hologram" className="w-full">
      <HudCommandScreen />
    </ThemeScope>
  );
}

function HudCommandCenterTron() {
  return (
    <ThemeScope preset="tron" className="w-full">
      <HudCommandScreen initialLockedId="23-ka-9103" />
    </ThemeScope>
  );
}

function HudCommandCenterEmber() {
  return (
    <ThemeScope preset="ember" className="w-full">
      <HudCommandScreen initialLockedId="23-ka-9101" />
    </ThemeScope>
  );
}

function HudCommandPartScope() {
  const [state, dispatch] = useReducer(hudCommandReducer, { lockedId: '27-pa-2001a', log: [], sequence: 0 });
  return (
    <HudCommandStage className="h-[26rem]">
      <RadarScope
        groups={HUD_COMMAND_GROUPS}
        label="Equipment by area and health"
        lockedId={state.lockedId}
        onLock={(id) => dispatch({ type: 'lock', id })}
        criticalBelow={50}
      />
    </HudCommandStage>
  );
}

function HudCommandPartTarget() {
  return (
    <HudCommandStage className="flex h-[26rem] items-center justify-center">
      <HudCommandTargetPanel unit={findAsset('23-ka-9101')} className="w-full max-w-xs" />
    </HudCommandStage>
  );
}

function HudCommandPartBracketFrame() {
  return (
    <HudCommandStage>
      <div className="flex flex-col gap-5">
        <BracketFrame title="Field crew" meta="2 on site">
          <p className="text-sm text-medium-foreground">Tomás Barros and Jonas Nyberg are at the recompressor skid.</p>
        </BracketFrame>
        <BracketFrame title="Trip" meta="23-KA-9103" tone="critical">
          <p className="text-sm text-medium-foreground">Recompressor tripped on high vibration 14 min ago.</p>
        </BracketFrame>
      </div>
    </HudCommandStage>
  );
}

function HudCommandPartArcReadouts() {
  return (
    <HudCommandStage>
      <div className="grid grid-cols-3 gap-3">
        <ArcReadout value={88} label="Health" className="w-full" />
        <ArcReadout value={7.6} label="Vibration" unit="mm/s" decimals={1} max={15} tone="warning" className="w-full" />
        <ArcReadout value={41} label="Health" tone="critical" className="w-full" />
        <ArcReadout value={100} label="Valve open" unit="%" className="w-full" />
        <ArcReadout value={0} label="Load" unit="%" className="w-full" />
        <ArcReadout value={null} label="Bearing temp" unit="°C" tone="neutral" className="w-full" />
      </div>
    </HudCommandStage>
  );
}

function HudCommandPartReticle() {
  return (
    <HudCommandStage>
      <svg viewBox="0 0 270 130" role="img" aria-label="Three reticles: locked, locked on a critical target, and idle" className="block w-full">
        <Reticle x={45} y={55} />
        <Reticle x={135} y={55} tone="critical" />
        <Reticle x={225} y={55} locked={false} />
        <g textAnchor="middle" className="fill-muted-foreground font-mono text-[0.6875rem]">
          <text x={45} y={120}>
            Locked
          </text>
          <text x={135} y={120}>
            Critical
          </text>
          <text x={225} y={120}>
            Idle
          </text>
        </g>
      </svg>
    </HudCommandStage>
  );
}

function HudCommandPartAlarmQueue() {
  const [state, dispatch] = useReducer(hudCommandReducer, { lockedId: '23-ka-9101', log: [], sequence: 0 });
  return (
    <HudCommandStage className="flex justify-center">
      <HudCommandAlarmPanel lockedId={state.lockedId} onLock={(id) => dispatch({ type: 'lock', id })} className="w-full max-w-xs" />
    </HudCommandStage>
  );
}

function HudCommandPartStatusAndLog() {
  return (
    <HudCommandStage>
      <div className="grid grid-cols-2 gap-5">
        <HudCommandStatusPanel />
        <HudCommandLogPanel log={HUD_COMMAND_INITIAL_LOG} />
      </div>
    </HudCommandStage>
  );
}

function HudCommandPartRulers() {
  return (
    <HudCommandStage className="relative h-40">
      <HudCommandRulers />
      <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
        <GlowText variant="label">Frame rulers</GlowText>
        <span className="text-xs text-muted-foreground">Minor ticks with a longer tick every fifth, on all four edges.</span>
      </div>
    </HudCommandStage>
  );
}

export default definePage({
  id: 'hud-command-center',
  title: 'HUD command center',
  summary:
    'A heads-up display for the plant: every unit is a blip on a circular scope, placed by area and health, with bracketed panels docked in the corners. Locking a target slides the reticle onto it and fills the readout.',
  guidance: {
    use: [
      'For an incident or command view where one unit at a time is in focus and the rest is context.',
      'When position can carry meaning: here the sector is the area and the distance from the core is health.',
      'With ten to thirty items; each blip keeps a readable label and its own sector room.',
      'Draw in lines, arcs and brackets and leave the ground empty — the look depends on restraint.',
    ],
    avoid: [
      'Filled cards or heavy panels inside the frame; they break the display into a dashboard.',
      'Relying on blip colour: shape repeats the state and every blip has a full spoken description.',
      'Using the sweep as a loading or refresh indicator. It is decoration and stops with reduced motion.',
      'Hiding the alarm queue behind the scope; the list stays visible and also locks targets.',
    ],
  },
  source,
  sections: [
    {
      id: 'experience',
      title: 'Experience',
      description:
        'Shown in the Hologram theme. Click a blip to lock on, or use Previous target and Next target; an alarm in the queue locks its unit too. Tab reaches every blip, Enter or Space locks, and Release lock clears the reticle.',
      specimens: [
        {
          id: 'HudCommandCenterExperience',
          title: 'HUD command center',
          note: 'Pick it for a command or incident view where people lock onto one unit and read everything about it.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'experiences/futuristic/RadarScope.tsx',
            'experiences/futuristic/Reticle.tsx',
            'experiences/futuristic/BracketFrame.tsx',
            'experiences/futuristic/ArcReadout.tsx',
            'experiences/futuristic/EdgeRuler.tsx',
            'experiences/futuristic/GlowText.tsx',
            'experiences/futuristic/radar.ts',
            'experiences/futuristic/neon.ts',
            'industrial/StatusIndicator.tsx',
            'themes/ThemeScope.tsx',
          ],
          Component: HudCommandCenterExperience,
        },
      ],
    },
    {
      id: 'themes',
      title: 'Themes',
      description: 'The same display in two other presets, each opened with a target locked.',
      specimens: [
        {
          id: 'HudCommandCenterTron',
          title: 'Tron',
          note: 'Pick it for a sharper, monospaced instrument; shown locked on the tripped recompressor.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: HudCommandCenterTron,
        },
        {
          id: 'HudCommandCenterEmber',
          title: 'Ember',
          note: 'Pick it for heat-centred or night screens; amber lines at high contrast.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: HudCommandCenterEmber,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The reusable pieces on their own stage. All of them are strokes on a transparent ground.',
      specimens: [
        {
          id: 'HudCommandPartScope',
          title: 'Radar scope',
          note: 'Pick it when two properties of every item can be read as direction and distance.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          surface: 'muted',
          uses: ['experiences/futuristic/RadarScope.tsx', 'experiences/futuristic/Reticle.tsx', 'experiences/futuristic/radar.ts'],
          Component: HudCommandPartScope,
        },
        {
          id: 'HudCommandPartTarget',
          title: 'Target readout',
          note: 'Pick it as the panel a lock fills in: identity, state, three arcs and the live tags.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          surface: 'muted',
          uses: ['experiences/futuristic/BracketFrame.tsx', 'experiences/futuristic/ArcReadout.tsx', 'industrial/StatusIndicator.tsx'],
          Component: HudCommandPartTarget,
        },
        {
          id: 'HudCommandPartBracketFrame',
          title: 'Bracket frame',
          note: 'Pick it for a panel that should not hide what is behind it; give it a status tone only for a status.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          surface: 'muted',
          uses: ['experiences/futuristic/BracketFrame.tsx'],
          Component: HudCommandPartBracketFrame,
        },
        {
          id: 'HudCommandPartArcReadouts',
          title: 'Arc readouts',
          note: 'Pick them for two to four figures where the proportion matters as much as the number.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          surface: 'muted',
          uses: ['experiences/futuristic/ArcReadout.tsx'],
          Component: HudCommandPartArcReadouts,
        },
        {
          id: 'HudCommandPartReticle',
          title: 'Reticle',
          note: 'Pick it to mark the one selected thing in a drawing; it slides when its position changes.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          surface: 'muted',
          uses: ['experiences/futuristic/Reticle.tsx'],
          Component: HudCommandPartReticle,
        },
        {
          id: 'HudCommandPartAlarmQueue',
          title: 'Alarm queue',
          note: 'Pick it beside a scope so the abnormal units are one click from a lock.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          surface: 'muted',
          uses: ['experiences/futuristic/BracketFrame.tsx', 'industrial/StatusIndicator.tsx'],
          Component: HudCommandPartAlarmQueue,
        },
        {
          id: 'HudCommandPartStatusAndLog',
          title: 'Status and comms log',
          note: 'Pick the pair for the quiet corners: a roll-up per area and a short running log.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          surface: 'muted',
          uses: ['experiences/futuristic/BracketFrame.tsx', 'experiences/futuristic/GlowText.tsx', 'industrial/StatusIndicator.tsx'],
          Component: HudCommandPartStatusAndLog,
        },
        {
          id: 'HudCommandPartRulers',
          title: 'Edge rulers',
          note: 'Pick them to give a full-screen frame its instrument feel; they are decoration and carry no values.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['experiences/futuristic/EdgeRuler.tsx'],
          Component: HudCommandPartRulers,
        },
      ],
    },
  ],
});
