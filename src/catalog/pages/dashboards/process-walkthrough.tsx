import { useReducer } from 'react';
import type { KeyboardEvent } from 'react';

import { ProcessRibbon } from '../../../library/experiences/journeys/ProcessRibbon';
import type { RibbonStation } from '../../../library/experiences/journeys/ProcessRibbon';
import { ProfileRail } from '../../../library/experiences/journeys/ProfileRail';
import type { ProfileSeries } from '../../../library/experiences/journeys/ProfileRail';
import { StageStepper } from '../../../library/experiences/journeys/StageStepper';
import { createWalk, walkActionFromKey, walkReducer } from '../../../library/experiences/journeys/walkReducer';
import { RangeIndicator } from '../../../library/industrial/RangeIndicator';
import { Sparkline } from '../../../library/industrial/Sparkline';
import { formatValue, runStateStatus, toneFromLimits } from '../../../library/industrial/status';
import type { Limits, RunState, Tone } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { ThemeScope } from '../../../library/themes/ThemeScope';
import { makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './process-walkthrough.tsx?raw';

type WalkReading = {
  label: string;
  tag: string;
  value: number;
  unit: string;
  decimals: number;
  min: number;
  max: number;
  limits: Limits;
};

type WalkStage = {
  id: string;
  label: string;
  tag: string;
  /** What happens here, in one sentence. */
  sentence: string;
  pressure: number;
  temperature: number;
  readings: readonly WalkReading[];
  trend: { label: string; unit: string; decimals: number; values: readonly number[]; limit?: number };
  equipment: readonly { tag: string; name: string; state: RunState }[];
  abnormal: readonly { tone: Tone; title: string; detail: string }[];
};

const WALK_STAGES: readonly WalkStage[] = [
  {
    id: 'inlet',
    label: 'Inlet',
    tag: 'NK-20',
    sentence: 'The well stream arrives from the subsea flowline and passes the inlet shutdown valve, which can isolate the whole plant within seconds.',
    pressure: 14.2,
    temperature: 31.4,
    readings: [
      { label: 'Inlet pressure', tag: '20-PT-10001', value: 14.2, unit: 'barg', decimals: 1, min: 8, max: 20, limits: { low: 11, high: 16 } },
      { label: 'Inlet temperature', tag: '20-TT-10002', value: 31.4, unit: '°C', decimals: 1, min: 0, max: 60, limits: { low: 15, high: 45 } },
      { label: 'Inlet flow', tag: '20-FT-10003', value: 196500, unit: 'Sm³/h', decimals: 0, min: 0, max: 250000, limits: { low: 120000, high: 210000 } },
    ],
    trend: { label: 'Inlet pressure', unit: 'barg', decimals: 1, values: makeValues({ seed: 61, points: 48, base: 14.2, amplitude: 0.4, noise: 0.12 }) },
    equipment: [{ tag: '20-XV-1105', name: 'Inlet shutdown valve', state: 'running' }],
    abnormal: [],
  },
  {
    id: 'separation',
    label: 'Separation',
    tag: '20-VA-1001',
    sentence: 'The inlet separator splits the stream by gravity: gas leaves from the top, while condensate and water drain from the bottom.',
    pressure: 13.1,
    temperature: 28.2,
    readings: [
      { label: 'Separator level', tag: '20-LT-10012', value: 54.3, unit: '%', decimals: 1, min: 0, max: 100, limits: { low: 30, high: 70, highHigh: 85 } },
      { label: 'Separator pressure', tag: '20-PT-10010', value: 13.1, unit: 'barg', decimals: 1, min: 8, max: 20, limits: { low: 11, high: 15 } },
      { label: 'Gas outlet temperature', tag: '20-TT-10014', value: 28.2, unit: '°C', decimals: 1, min: 0, max: 60, limits: { low: 15, high: 40 } },
      { label: 'Flash gas recovered', tag: '23-FT-92710', value: 0, unit: 'Sm³/h', decimals: 0, min: 0, max: 12000, limits: { low: 4000, high: 10000 } },
    ],
    trend: { label: 'Separator level', unit: '%', decimals: 1, values: makeValues({ seed: 17, points: 48, base: 54, amplitude: 4, noise: 1.2 }), limit: 70 },
    equipment: [
      { tag: '20-VA-1001', name: 'Inlet separator', state: 'running' },
      { tag: '20-VA-1002', name: 'Test separator', state: 'standby' },
      { tag: '23-KA-9103', name: 'Recompressor', state: 'tripped' },
    ],
    abnormal: [
      { tone: 'critical', title: 'Recompressor tripped on high vibration', detail: 'Since 13:46. Flash gas goes to flare until the restart.' },
    ],
  },
  {
    id: 'stage-1',
    label: '1st stage compression',
    tag: '23-KA-9101',
    sentence: 'The 1st stage compressor, driven by the gas turbine, lifts the gas from 12 to 49 barg, and the work of compression heats it to about 140 °C.',
    pressure: 48.6,
    temperature: 146.3,
    readings: [
      { label: 'Suction pressure', tag: '23-PT-92530', value: 12.4, unit: 'barg', decimals: 1, min: 6, max: 20, limits: { low: 10, high: 15 } },
      { label: 'Discharge pressure', tag: '23-PT-92531', value: 48.6, unit: 'barg', decimals: 1, min: 30, max: 60, limits: { low: 40, high: 52, highHigh: 55 } },
      { label: 'Discharge temperature', tag: '23-TT-92532', value: 146.3, unit: '°C', decimals: 1, min: 60, max: 170, limits: { low: 90, high: 145, highHigh: 155 } },
      { label: 'Drive-end vibration', tag: '23-VT-92540', value: 6.8, unit: 'mm/s', decimals: 1, min: 0, max: 15, limits: { high: 7.1, highHigh: 11 } },
    ],
    trend: {
      label: 'Discharge temperature',
      unit: '°C',
      decimals: 1,
      values: makeValues({ seed: 13, points: 48, base: 139, amplitude: 2.5, noise: 0.8, drift: 6.5 }),
      limit: 145,
    },
    equipment: [
      { tag: '23-KA-9101', name: '1st stage compressor', state: 'running' },
      { tag: '23-GT-9001', name: 'Compressor gas turbine', state: 'running' },
    ],
    abnormal: [
      { tone: 'warning', title: 'Discharge temperature high', detail: '146.3 °C against a 145.0 °C limit, raised 38 min ago.' },
      { tone: 'warning', title: 'Drive-end vibration approaching limit', detail: '6.8 of 7.1 mm/s. Acknowledged, survey WO-104466 open.' },
    ],
  },
  {
    id: 'cooling',
    label: 'Cooling',
    tag: '23-HA-9114',
    sentence: 'The interstage cooler takes the heat of compression out against cooling water, so the 2nd stage receives cool, dense gas.',
    pressure: 47.9,
    temperature: 40.8,
    readings: [
      { label: 'Gas inlet temperature', tag: '23-TT-91140', value: 144.9, unit: '°C', decimals: 1, min: 60, max: 170, limits: { low: 90, high: 150 } },
      { label: 'Cooler outlet temperature', tag: '23-TT-91141', value: 40.8, unit: '°C', decimals: 1, min: 10, max: 60, limits: { low: 20, high: 40, highHigh: 45 } },
      { label: 'Cooling water supply', tag: '40-TT-40011', value: 12.6, unit: '°C', decimals: 1, min: 0, max: 30, limits: { low: 4, high: 18 } },
      { label: 'Gas-side pressure drop', tag: '23-PDT-91142', value: 0.7, unit: 'bar', decimals: 2, min: 0, max: 1.2, limits: { high: 0.8 } },
    ],
    trend: {
      label: 'Cooler outlet temperature',
      unit: '°C',
      decimals: 1,
      values: makeValues({ seed: 19, points: 48, base: 37.6, amplitude: 0.9, noise: 0.3, drift: 3 }),
      limit: 40,
    },
    equipment: [
      { tag: '23-HA-9114', name: 'Interstage cooler', state: 'running' },
      { tag: '40-PA-4001', name: 'Cooling water pump', state: 'maintenance' },
    ],
    abnormal: [
      { tone: 'warning', title: 'Cooler outlet temperature high', detail: '40.8 °C against a 40.0 °C limit. Tube bundle cleaning WO-104471 is waiting.' },
    ],
  },
  {
    id: 'stage-2',
    label: '2nd stage compression',
    tag: '23-KA-9102',
    sentence: 'The 2nd stage compressor brings the cooled gas up to pipeline pressure, about 142 barg.',
    pressure: 142,
    temperature: 128.4,
    readings: [
      { label: 'Suction pressure', tag: '23-PT-92630', value: 47.9, unit: 'barg', decimals: 1, min: 30, max: 60, limits: { low: 40, high: 52 } },
      { label: 'Discharge pressure', tag: '23-PT-92631', value: 142, unit: 'barg', decimals: 1, min: 100, max: 170, limits: { low: 130, high: 150, highHigh: 155 } },
      { label: 'Discharge temperature', tag: '23-TT-92632', value: 128.4, unit: '°C', decimals: 1, min: 60, max: 170, limits: { low: 90, high: 145, highHigh: 155 } },
      { label: 'Shaft speed', tag: '23-ST-92601', value: 10120, unit: 'rpm', decimals: 0, min: 0, max: 12000, limits: { low: 7000, high: 10500 } },
    ],
    trend: { label: 'Discharge pressure', unit: 'barg', decimals: 1, values: makeValues({ seed: 71, points: 48, base: 141.6, amplitude: 1.4, noise: 0.5 }), limit: 150 },
    equipment: [{ tag: '23-KA-9102', name: '2nd stage compressor', state: 'running' }],
    abnormal: [],
  },
  {
    id: 'export',
    label: 'Export',
    tag: 'NK-27',
    sentence: 'Dry gas is metered and leaves through the export pipeline, while the export pumps send the condensate ashore.',
    pressure: 139.5,
    temperature: 42,
    readings: [
      { label: 'Export pressure', tag: '27-PT-20001', value: 139.5, unit: 'barg', decimals: 1, min: 100, max: 170, limits: { low: 130, high: 150 } },
      { label: 'Gas export rate', tag: '27-FT-20002', value: 4.38, unit: 'MSm³/d', decimals: 2, min: 3, max: 5, limits: { low: 4, high: 4.8 } },
      { label: 'Condensate export flow', tag: '27-FT-20011', value: 412, unit: 'm³/h', decimals: 0, min: 0, max: 600, limits: { low: 300, high: 480 } },
      { label: 'Pump A motor current', tag: '27-IT-20013', value: 86.2, unit: 'A', decimals: 1, min: 0, max: 120, limits: { low: 40, high: 95, highHigh: 105 } },
    ],
    trend: {
      label: 'Gas export rate',
      unit: 'MSm³/d',
      decimals: 2,
      values: makeValues({ seed: 31, points: 48, base: 4.34, amplitude: 0.12, noise: 0.04, cycles: 1.2, decimals: 2 }),
    },
    equipment: [
      { tag: '27-PA-2001A', name: 'Export pump A', state: 'running' },
      { tag: '27-PA-2001B', name: 'Export pump B', state: 'standby' },
    ],
    abnormal: [{ tone: 'info', title: 'Export pump B standby test overdue', detail: '34 days since the last start test; the limit is 30 days.' }],
  },
];

const WALK_STATIONS: readonly RibbonStation[] = WALK_STAGES.map((stage) => {
  const worst = stage.abnormal.some((item) => item.tone === 'critical') ? 'critical' : 'warning';
  const flagged = stage.abnormal.filter((item) => item.tone === 'critical' || item.tone === 'warning').length;
  return {
    id: stage.id,
    label: stage.label,
    tag: stage.tag,
    caption: `${formatValue(stage.pressure, 1)} barg · ${formatValue(stage.temperature, 0)} °C`,
    status: flagged > 0 ? { tone: worst, label: worst === 'critical' ? 'Trip' : `${flagged} ${flagged === 1 ? 'alarm' : 'alarms'}` } : undefined,
  };
});

const WALK_STOPS: readonly string[] = WALK_STAGES.map((stage) => stage.label.replace(' compression', ''));

const WALK_PROFILES: readonly ProfileSeries[] = [
  { id: 'pressure', label: 'Pressure', unit: 'barg', decimals: 1, values: WALK_STAGES.map((stage) => stage.pressure) },
  { id: 'temperature', label: 'Temperature', unit: '°C', decimals: 0, values: WALK_STAGES.map((stage) => stage.temperature) },
];

const WALK_CARD = 'rounded-xl border border-default bg-card-background p-4';
const WALK_EYEBROW = 'text-xs font-medium text-muted-foreground';

function ProcessWalkStory({ stage, index }: { stage: WalkStage; index: number }) {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div>
        <p className={WALK_EYEBROW}>
          Stage {index + 1} of {WALK_STAGES.length} · <span className="font-mono font-normal">{stage.tag}</span>
        </p>
        <h4 className="mt-1 text-xl font-semibold text-base-foreground">{stage.label}</h4>
        <p className="mt-2 text-sm text-medium-foreground">{stage.sentence}</p>
      </div>
      <div>
        <p className={WALK_EYEBROW}>Equipment involved</p>
        <ul className="mt-2 flex flex-col gap-2">
          {stage.equipment.map((item) => (
            <li key={item.tag} className="flex items-center justify-between gap-3">
              <span className="min-w-0">
                <span className="block text-sm text-base-foreground">{item.name}</span>
                <span className="block font-mono text-xs text-muted-foreground">{item.tag}</span>
              </span>
              <StatusIndicator {...runStateStatus(item.state)} size="sm" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ProcessWalkReadings({ stage }: { stage: WalkStage }) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <p className={WALK_EYEBROW}>Readings that matter here</p>
      <ul className="flex flex-col gap-4">
        {stage.readings.map((reading) => (
          <li key={reading.tag} className="flex flex-col gap-1.5">
            <div className="flex items-end justify-between gap-3">
              <span className="min-w-0">
                <span className="block text-sm text-base-foreground">{reading.label}</span>
                <span className="block font-mono text-xs text-muted-foreground">{reading.tag}</span>
              </span>
              <ValueReadout
                value={reading.value}
                unit={reading.unit}
                decimals={reading.decimals}
                size="sm"
                tone={toneFromLimits(reading.value, reading.limits)}
              />
            </div>
            <RangeIndicator
              label={reading.label}
              value={reading.value}
              min={reading.min}
              max={reading.max}
              limits={reading.limits}
              unit={reading.unit}
              decimals={reading.decimals}
              showHeader={false}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProcessWalkWatch({ stage }: { stage: WalkStage }) {
  const low = Math.min(...stage.trend.values);
  const high = Math.max(...stage.trend.values);

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-col gap-2">
        <p className={WALK_EYEBROW}>{stage.trend.label}, last 48 hours</p>
        <Sparkline
          values={stage.trend.values}
          label={`${stage.trend.label}, last 48 hours`}
          variant="area"
          height={72}
          showLast
          limit={stage.trend.limit}
          unit={stage.trend.unit}
          decimals={stage.trend.decimals}
        />
        <p className="text-xs text-muted-foreground tabular-nums">
          Range {formatValue(low, stage.trend.decimals)}–{formatValue(high, stage.trend.decimals)} {stage.trend.unit}
          {stage.trend.limit === undefined ? '' : ` · dashed line: limit ${formatValue(stage.trend.limit, 0)} ${stage.trend.unit}`}
        </p>
      </div>
      <div>
        <p className={WALK_EYEBROW}>Abnormal at this stage</p>
        {stage.abnormal.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Nothing abnormal. All readings are inside their operating bands.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-3">
            {stage.abnormal.map((item) => (
              <li key={item.title} className="flex flex-col gap-0.5">
                <StatusIndicator
                  tone={item.tone}
                  label={item.title}
                  shape={item.tone === 'critical' ? 'diamond' : item.tone === 'warning' ? 'square' : 'dot'}
                  size="sm"
                  className="whitespace-normal items-start [&>span:first-child]:mt-1"
                />
                <p className="pl-3.5 text-xs text-muted-foreground">{item.detail}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ProcessWalkStagePanel({ stage, index }: { stage: WalkStage; index: number }) {
  return (
    <div className={`${WALK_CARD} grid grid-cols-1 gap-x-8 gap-y-6 lg:grid-cols-3`}>
      <ProcessWalkStory stage={stage} index={index} />
      <ProcessWalkReadings stage={stage} />
      <ProcessWalkWatch stage={stage} />
    </div>
  );
}

function ProcessWalkExperience() {
  // Archetype: a horizontal journey — one process line read left to right, with the detail of one
  //   stop below it. No grid of panels, no headline tiles.
  // Dominant element: the process ribbon, a scrolling flow line with a station per stage and a
  //   "you are here" marker.
  // Interaction: stepping. Next / Previous, the arrow keys (Home and End for the ends) or a click
  //   on a station or on the profile rail moves the marker, glides the ribbon and swaps the stage
  //   panel; the profile rail keeps the whole route in view.
  const [walk, dispatch] = useReducer(walkReducer, createWalk(WALK_STAGES.length));
  const stage = WALK_STAGES[walk.index] ?? WALK_STAGES[0];

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const action = walkActionFromKey(event.key);
    if (!action) return;
    event.preventDefault();
    dispatch(action);
  };

  return (
    <section
      aria-label="Process walkthrough, inlet to export"
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="flex min-h-[44rem] w-full flex-col gap-4 rounded-xl bg-base-background p-6 text-base-foreground outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring-default)]"
    >
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h3 className="text-2xl font-semibold text-base-foreground">Follow the gas</h3>
          <p className="mt-1 text-sm text-muted-foreground">Nordkapp gas processing plant · inlet to export in six stages · values at 14:00 UTC</p>
        </div>
        <StageStepper
          index={walk.index}
          count={walk.count}
          stageLabel={stage.label}
          previousLabel={WALK_STAGES[walk.index - 1]?.label}
          nextLabel={WALK_STAGES[walk.index + 1]?.label}
          onPrevious={() => dispatch({ type: 'previous' })}
          onNext={() => dispatch({ type: 'next' })}
        />
      </header>

      <div className={WALK_CARD}>
        <ProcessRibbon
          stations={WALK_STATIONS}
          activeIndex={walk.index}
          onSelect={(index) => dispatch({ type: 'goTo', index })}
          label="Gas route, inlet to export"
        />
      </div>

      <ProcessWalkStagePanel stage={stage} index={walk.index} />

      <div className={WALK_CARD}>
        <p className={`${WALK_EYEBROW} mb-2`}>Along the whole route</p>
        <ProfileRail
          stops={WALK_STOPS}
          series={WALK_PROFILES}
          activeIndex={walk.index}
          onSelect={(index) => dispatch({ type: 'goTo', index })}
          label="Pressure and temperature along the gas route"
        />
      </div>
    </section>
  );
}

function ProcessWalkSignature() {
  return (
    <ThemeScope preset="nordic" className="w-full">
      <ProcessWalkExperience />
    </ThemeScope>
  );
}

function ProcessWalkHologram() {
  return (
    <ThemeScope preset="hologram" className="w-full">
      <ProcessWalkExperience />
    </ThemeScope>
  );
}

function ProcessWalkEditorial() {
  return (
    <ThemeScope preset="editorial" className="w-full">
      <ProcessWalkExperience />
    </ThemeScope>
  );
}

function ProcessWalkPartRibbon() {
  const [walk, dispatch] = useReducer(walkReducer, createWalk(WALK_STAGES.length, 2));

  return (
    <ProcessRibbon
      stations={WALK_STATIONS}
      activeIndex={walk.index}
      onSelect={(index) => dispatch({ type: 'goTo', index })}
      label="Gas route, inlet to export"
    />
  );
}

function ProcessWalkPartStepper() {
  const [walk, dispatch] = useReducer(walkReducer, createWalk(WALK_STAGES.length, 3));

  return (
    <div className="flex w-full justify-center">
      <StageStepper
        index={walk.index}
        count={walk.count}
        stageLabel={WALK_STAGES[walk.index]?.label ?? ''}
        onPrevious={() => dispatch({ type: 'previous' })}
        onNext={() => dispatch({ type: 'next' })}
      />
    </div>
  );
}

function ProcessWalkPartRail() {
  const [walk, dispatch] = useReducer(walkReducer, createWalk(WALK_STAGES.length, 4));

  return (
    <ProfileRail
      stops={WALK_STOPS}
      series={WALK_PROFILES}
      activeIndex={walk.index}
      onSelect={(index) => dispatch({ type: 'goTo', index })}
      label="Pressure and temperature along the gas route"
    />
  );
}

function ProcessWalkPartStagePanel() {
  return <ProcessWalkStagePanel stage={WALK_STAGES[2]} index={2} />;
}

function ProcessWalkPartStory() {
  return (
    <div className={`${WALK_CARD} w-full`}>
      <ProcessWalkStory stage={WALK_STAGES[1]} index={1} />
    </div>
  );
}

function ProcessWalkPartReadings() {
  return (
    <div className={`${WALK_CARD} w-full`}>
      <ProcessWalkReadings stage={WALK_STAGES[3]} />
    </div>
  );
}

function ProcessWalkPartWatch() {
  return (
    <div className={`${WALK_CARD} w-full`}>
      <ProcessWalkWatch stage={WALK_STAGES[2]} />
    </div>
  );
}

function ProcessWalkPartQuietStage() {
  return (
    <div className={`${WALK_CARD} w-full`}>
      <ProcessWalkWatch stage={WALK_STAGES[4]} />
    </div>
  );
}

export default definePage({
  id: 'process-walkthrough',
  title: 'Process walkthrough',
  summary:
    'A guided journey along the process: follow the gas from inlet to export, one stage at a time. Each stop says what happens there, shows the few readings that matter and flags anything abnormal, while a profile rail keeps the whole route in view.',
  guidance: {
    use: [
      'To explain a process to someone new to the plant, or to brief a shift on where the trouble is.',
      'When the order of the stages is the story: upstream causes, downstream effects.',
      'Keep each stage to one sentence, three or four readings and one trend.',
      'Show the route-wide profile so a local reading is always seen in context.',
    ],
    avoid: [
      'Using it as a monitoring screen; nobody steps through six stages to find an alarm.',
      'More than eight stages on one ribbon. Split the route into sections.',
      'Hiding abnormal stages until the user reaches them; flag them on the ribbon.',
      'Auto-advancing. The reader sets the pace.',
    ],
  },
  source,
  sections: [
    {
      id: 'experience',
      title: 'Experience',
      description:
        'Shown in the Nordic theme. Press Next or Previous, use the left and right arrow keys, or click a station or a column of the profile rail to travel along the route.',
      specimens: [
        {
          id: 'ProcessWalkSignature',
          title: 'Process walkthrough',
          note: 'Pick it when people need to understand a process in order, stage by stage, with live values at every stop.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'experiences/journeys/ProcessRibbon.tsx',
            'experiences/journeys/StageStepper.tsx',
            'experiences/journeys/ProfileRail.tsx',
            'experiences/journeys/walkReducer.ts',
            'experiences/journeys/profileGeometry.ts',
            'industrial/RangeIndicator.tsx',
            'industrial/Sparkline.tsx',
            'industrial/StatusIndicator.tsx',
            'industrial/ValueReadout.tsx',
            'themes/ThemeScope.tsx',
          ],
          Component: ProcessWalkSignature,
        },
      ],
    },
    {
      id: 'themes',
      title: 'In other themes',
      description: 'The same journey, unchanged, in a dark digital-twin preset and a spacious editorial one.',
      specimens: [
        {
          id: 'ProcessWalkHologram',
          title: 'Hologram',
          note: 'Pick it beside a 3D or digital-twin view, where the walkthrough should feel part of the same dark scene.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: ProcessWalkHologram,
        },
        {
          id: 'ProcessWalkEditorial',
          title: 'Editorial',
          note: 'Pick it for onboarding and training material, where generous space and larger type help a first read.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: ProcessWalkEditorial,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'Each part on its own, ready for another journey.',
      specimens: [
        {
          id: 'ProcessWalkPartRibbon',
          title: 'Process ribbon',
          note: 'Pick it when a route has more stops than fit the width and the current stop must stay centred.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['experiences/journeys/ProcessRibbon.tsx', 'experiences/journeys/walkReducer.ts'],
          Component: ProcessWalkPartRibbon,
        },
        {
          id: 'ProcessWalkPartRail',
          title: 'Profile rail',
          note: 'Pick it to show how one or two quantities change across every stop, with the current stop marked.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['experiences/journeys/ProfileRail.tsx', 'experiences/journeys/profileGeometry.ts'],
          Component: ProcessWalkPartRail,
        },
        {
          id: 'ProcessWalkPartStory',
          title: 'Stage story',
          note: 'Pick it to introduce a stop: one sentence on what happens and the equipment that does it.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['industrial/StatusIndicator.tsx'],
          Component: ProcessWalkPartStory,
        },
        {
          id: 'ProcessWalkPartStepper',
          title: 'Stage stepper',
          note: 'Pick it as the transport of any stepped journey; it names the stage and explains a disabled end.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['experiences/journeys/StageStepper.tsx', 'experiences/journeys/walkReducer.ts'],
          Component: ProcessWalkPartStepper,
        },
        {
          id: 'ProcessWalkPartReadings',
          title: 'Stage readings',
          note: 'Pick it when distance to a limit matters more than the number: each reading sits in its operating band.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/RangeIndicator.tsx', 'industrial/ValueReadout.tsx'],
          Component: ProcessWalkPartReadings,
        },
        {
          id: 'ProcessWalkPartStagePanel',
          title: 'Stage panel',
          note: 'Pick it as the detail of one stop: story, readings, then trend and abnormal items side by side.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['industrial/RangeIndicator.tsx', 'industrial/Sparkline.tsx', 'industrial/StatusIndicator.tsx', 'industrial/ValueReadout.tsx'],
          Component: ProcessWalkPartStagePanel,
        },
        {
          id: 'ProcessWalkPartWatch',
          title: 'Trend and abnormal items',
          note: 'Pick it when a stage has open alarms: the trend shows the drift, the list says what is wrong.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/Sparkline.tsx', 'industrial/StatusIndicator.tsx'],
          Component: ProcessWalkPartWatch,
        },
        {
          id: 'ProcessWalkPartQuietStage',
          title: 'Quiet stage',
          note: 'Pick it for a stage with nothing abnormal; it says so in words instead of leaving a gap.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/Sparkline.tsx'],
          Component: ProcessWalkPartQuietStage,
        },
      ],
    },
  ],
});
