import { useState } from 'react';

import type { CautionItem, CautionLevel } from '../../../library/experiences/spatial/cautions';
import { CautionStrip } from '../../../library/experiences/spatial/CautionStrip';
import { ContourBackdrop } from '../../../library/experiences/spatial/ContourBackdrop';
import { GlassPanel } from '../../../library/experiences/spatial/GlassPanel';
import { LayerSwitch } from '../../../library/experiences/spatial/LayerSwitch';
import { TapeIndicator } from '../../../library/experiences/spatial/TapeIndicator';
import { RadialGauge } from '../../../library/industrial/RadialGauge';
import { Sparkline } from '../../../library/industrial/Sparkline';
import { formatDelta, toneFromLimits } from '../../../library/industrial/status';
import type { Limits } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { ThemeScope } from '../../../library/themes/ThemeScope';
import { ALARMS } from '../../data/plant';
import type { Severity } from '../../data/plant';
import { formatTime, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './glass-cockpit.tsx?raw';

type GlassCockpitMode = 'pressure' | 'temperature' | 'flow';

type GlassCockpitVariable = {
  name: string;
  tag: string;
  unit: string;
  value: number;
  decimals: number;
  setpoint: number;
  span: number;
  majorStep: number;
  minorPerMajor: number;
  min: number;
  max: number;
  limits: Limits;
  trend: readonly number[];
};

type GlassCockpitGauge = { label: string; value: number; unit: string; decimals: number; max: number; limits?: Limits };

type GlassCockpitEngine = { title: string; tag: string; gauges: readonly GlassCockpitGauge[] };

type GlassCockpitPanelId = 'left' | 'primary' | 'right' | 'alerts';

const GLASS_COCKPIT_MODE_OPTIONS = [
  { value: 'pressure', label: 'Pressure' },
  { value: 'temperature', label: 'Temperature' },
  { value: 'flow', label: 'Flow' },
] as const;

const GLASS_COCKPIT_VARIABLES: Record<GlassCockpitMode, GlassCockpitVariable> = {
  pressure: {
    name: 'Discharge pressure',
    tag: '23-PT-92531',
    unit: 'barg',
    value: 48.6,
    decimals: 1,
    setpoint: 48,
    span: 20,
    majorStep: 5,
    minorPerMajor: 5,
    min: 0,
    max: 60,
    limits: { low: 40, high: 52, highHigh: 55 },
    trend: [...makeValues({ seed: 11, points: 59, base: 48.1, amplitude: 1.1, noise: 0.35, cycles: 2 }), 48.6],
  },
  temperature: {
    name: 'Discharge temperature',
    tag: '23-TT-92532',
    unit: '°C',
    value: 146.3,
    decimals: 1,
    setpoint: 138,
    span: 50,
    majorStep: 10,
    minorPerMajor: 5,
    min: 0,
    max: 180,
    limits: { low: 90, high: 145, highHigh: 155 },
    trend: [...makeValues({ seed: 13, points: 59, base: 140.5, amplitude: 2.2, noise: 0.6, cycles: 1.5, drift: 5 }), 146.3],
  },
  flow: {
    name: 'Gas flow',
    tag: '23-FT-92510',
    unit: 'kSm³/h',
    value: 182.4,
    decimals: 1,
    setpoint: 185,
    span: 80,
    majorStep: 20,
    minorPerMajor: 4,
    min: 0,
    max: 250,
    limits: { low: 120, high: 210 },
    trend: [...makeValues({ seed: 16, points: 59, base: 184, amplitude: 4, noise: 1.2, cycles: 2.5 }), 182.4],
  },
};

const GLASS_COCKPIT_ENGINE_ONE: GlassCockpitEngine = {
  title: 'Stage 1',
  tag: '23-KA-9101',
  gauges: [
    { label: 'Speed', value: 82, unit: '%', decimals: 0, max: 110, limits: { high: 100, highHigh: 105 } },
    { label: 'Vibration', value: 6.8, unit: 'mm/s', decimals: 1, max: 15, limits: { high: 7.1, highHigh: 11 } },
    { label: 'Suction', value: 12.4, unit: 'barg', decimals: 1, max: 20, limits: { low: 10, high: 15 } },
    { label: 'Lube oil', value: 2.6, unit: 'barg', decimals: 1, max: 5, limits: { lowLow: 1.2, low: 1.8 } },
  ],
};

const GLASS_COCKPIT_ENGINE_TWO: GlassCockpitEngine = {
  title: 'Stage 2',
  tag: '23-KA-9102',
  gauges: [
    { label: 'Speed', value: 80, unit: '%', decimals: 0, max: 110, limits: { high: 100, highHigh: 105 } },
    { label: 'Vibration', value: 3.9, unit: 'mm/s', decimals: 1, max: 15, limits: { high: 7.1, highHigh: 11 } },
    { label: 'Discharge', value: 96.2, unit: 'barg', decimals: 1, max: 120, limits: { high: 104, highHigh: 110 } },
    { label: 'Lube oil', value: 2.9, unit: 'barg', decimals: 1, max: 5, limits: { lowLow: 1.2, low: 1.8 } },
  ],
};

const GLASS_COCKPIT_LEVEL: Record<Severity, CautionLevel> = { critical: 'warning', high: 'caution', medium: 'advisory', low: 'advisory' };

const GLASS_COCKPIT_CAUTIONS: readonly CautionItem[] = ALARMS.filter((alarm) => alarm.state === 'active' || alarm.state === 'acknowledged').map(
  (alarm) => ({
    id: alarm.id,
    level: GLASS_COCKPIT_LEVEL[alarm.severity],
    message: alarm.message,
    source: alarm.sensorTag,
    raisedAt: alarm.raisedAt,
    time: formatTime(alarm.raisedAt),
    acknowledged: alarm.state === 'acknowledged',
  })
);

const GLASS_COCKPIT_COLUMNS: Record<GlassCockpitPanelId | 'none', string> = {
  none: '1fr 1.9fr 1fr',
  primary: '0.92fr 2.2fr 0.92fr',
  left: '1.35fr 1.8fr 0.92fr',
  right: '0.92fr 1.8fr 1.35fr',
  alerts: '1fr 1.9fr 1fr',
};

const GLASS_COCKPIT_BAR =
  'rounded-xl border border-[color-mix(in_oklab,var(--primary-background)_30%,transparent)] bg-[color-mix(in_oklab,var(--card-background)_58%,transparent)] backdrop-blur-md';

function GlassCockpitEngineGauges({ engine, large = false }: { engine: GlassCockpitEngine; large?: boolean }) {
  return (
    <div className="grid h-full grid-cols-2 place-items-center gap-x-2 gap-y-3">
      {engine.gauges.map((gauge) => (
        <RadialGauge
          key={gauge.label}
          label={gauge.label}
          value={gauge.value}
          unit={gauge.unit}
          decimals={gauge.decimals}
          max={gauge.max}
          limits={gauge.limits}
          size={large ? 'md' : 'sm'}
          showRange={false}
        />
      ))}
    </div>
  );
}

function GlassCockpitPrimaryDisplay({ mode }: { mode: GlassCockpitMode }) {
  const variable = GLASS_COCKPIT_VARIABLES[mode];
  const tone = toneFromLimits(variable.value, variable.limits);
  const deviation = variable.value - variable.setpoint;

  return (
    <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-3">
      <div className="grid min-h-0 grid-cols-[auto_minmax(0,1fr)] gap-5">
        <TapeIndicator
          label={variable.name}
          value={variable.value}
          unit={variable.unit}
          decimals={variable.decimals}
          span={variable.span}
          majorStep={variable.majorStep}
          minorPerMajor={variable.minorPerMajor}
          min={variable.min}
          max={variable.max}
          setpoint={variable.setpoint}
          limits={variable.limits}
          length={250}
        />
        <div className="flex min-h-0 min-w-0 flex-col justify-between gap-3">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
            <div>
              <ValueReadout value={variable.value} unit={variable.unit} decimals={variable.decimals} size="xl" tone={tone} />
              <p className="font-mono text-xs text-muted-foreground">{variable.tag}</p>
            </div>
            <dl className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
              <div>
                <dt>Setpoint</dt>
                <dd className="text-base font-semibold tabular-nums text-base-foreground">{variable.setpoint.toFixed(variable.decimals)}</dd>
              </div>
              <div>
                <dt>Deviation</dt>
                <dd className="text-base font-semibold tabular-nums text-base-foreground">{formatDelta(deviation, variable.decimals)}</dd>
              </div>
              <div>
                <dt>High limit</dt>
                <dd className="text-base font-semibold tabular-nums text-base-foreground">{variable.limits.high}</dd>
              </div>
            </dl>
          </div>
          <div>
            <p className="pb-1 text-xs text-muted-foreground">Last 60 minutes, dashed line at the high limit</p>
            <Sparkline
              values={variable.trend}
              label={`${variable.name}, last 60 minutes`}
              variant="area"
              height={72}
              tone={tone}
              showLast
              limit={variable.limits.high}
              unit={variable.unit}
              decimals={variable.decimals}
            />
          </div>
        </div>
      </div>
      <TapeIndicator
        label="Shaft speed"
        value={9840}
        unit="rpm"
        span={2400}
        majorStep={400}
        minorPerMajor={4}
        min={0}
        max={12000}
        setpoint={9900}
        limits={{ low: 7000, high: 10500 }}
        orientation="horizontal"
        length={470}
      />
    </div>
  );
}

function GlassCockpitScreen({ animated = false }: { animated?: boolean }) {
  const [mode, setMode] = useState<GlassCockpitMode>('pressure');
  const [focus, setFocus] = useState<GlassCockpitPanelId | null>(null);
  const [cautions, setCautions] = useState(GLASS_COCKPIT_CAUTIONS);
  const panel = (id: GlassCockpitPanelId) => ({
    focused: focus === id,
    receded: focus !== null && focus !== id,
    onFocusChange: (next: boolean) => setFocus(next ? id : null),
  });
  const acknowledge = (id: string) => setCautions((items) => items.map((item) => (item.id === id ? { ...item, acknowledged: true } : item)));

  return (
    <div className="relative h-[48rem] w-full overflow-hidden rounded-xl border border-default">
      <ContourBackdrop animated={animated} />
      <div className="relative grid h-full grid-rows-[auto_minmax(0,1fr)_auto] gap-3 p-4">
        <header className={`flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-2 ${GLASS_COCKPIT_BAR}`}>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-base-foreground">Gas compression, Nordkapp</p>
            <p className="truncate text-xs text-muted-foreground">
              1st stage compressor <span className="font-mono">23-KA-9101</span> · 14:00 UTC
            </p>
          </div>
          <LayerSwitch label="Primary display" value={mode} options={GLASS_COCKPIT_MODE_OPTIONS} onValueChange={setMode} />
          <StatusIndicator tone="warning" label="Reduced capacity" detail="recompressor tripped" shape="square" />
        </header>
        <div
          className="grid min-h-0 gap-3 transition-[grid-template-columns] duration-500 motion-reduce:transition-none"
          style={{ gridTemplateColumns: GLASS_COCKPIT_COLUMNS[focus ?? 'none'] }}
        >
          <GlassPanel title={GLASS_COCKPIT_ENGINE_ONE.title} caption={GLASS_COCKPIT_ENGINE_ONE.tag} {...panel('left')}>
            <GlassCockpitEngineGauges engine={GLASS_COCKPIT_ENGINE_ONE} large={focus === 'left'} />
          </GlassPanel>
          <GlassPanel title="Primary display" caption={GLASS_COCKPIT_VARIABLES[mode].tag} {...panel('primary')}>
            <GlassCockpitPrimaryDisplay mode={mode} />
          </GlassPanel>
          <GlassPanel title={GLASS_COCKPIT_ENGINE_TWO.title} caption={GLASS_COCKPIT_ENGINE_TWO.tag} {...panel('right')}>
            <GlassCockpitEngineGauges engine={GLASS_COCKPIT_ENGINE_TWO} large={focus === 'right'} />
          </GlassPanel>
        </div>
        <GlassPanel title="Crew alerting" {...panel('alerts')}>
          <CautionStrip items={cautions} limit={focus === 'alerts' ? 5 : 3} onAcknowledge={acknowledge} />
        </GlassPanel>
      </div>
    </div>
  );
}

function GlassCockpitExperience() {
  return (
    <ThemeScope preset="neon-dusk" className="w-full">
      <GlassCockpitScreen animated />
    </ThemeScope>
  );
}

function GlassCockpitHologram() {
  return (
    <ThemeScope preset="hologram" className="w-full">
      <GlassCockpitScreen />
    </ThemeScope>
  );
}

function GlassCockpitAuraDark() {
  return (
    <ThemeScope preset="aura-dark" className="w-full">
      <GlassCockpitScreen />
    </ThemeScope>
  );
}

function GlassCockpitPanel() {
  return (
    <div className="relative w-full overflow-hidden rounded-xl p-6">
      <ContourBackdrop lines={10} animated={false} />
      <GlassPanel title="Export header" caption="27-PT-20010" className="relative">
        <ValueReadout value={131.4} unit="barg" decimals={1} size="lg" />
        <p className="pt-1 text-xs text-muted-foreground">Steady for 6 hours</p>
      </GlassPanel>
    </div>
  );
}

function GlassCockpitFocusStates() {
  const [focus, setFocus] = useState<'a' | 'b' | null>('a');

  return (
    <div className="relative w-full overflow-hidden rounded-xl p-6">
      <ContourBackdrop lines={10} animated={false} />
      <div className="relative grid grid-cols-2 gap-4">
        <GlassPanel
          title="Stage 1"
          caption="23-KA-9101"
          focused={focus === 'a'}
          receded={focus === 'b'}
          onFocusChange={(next) => setFocus(next ? 'a' : null)}
        >
          <ValueReadout value={82} unit="% speed" size="lg" />
          <p className="pt-1 text-xs text-muted-foreground">Vibration 6.8 mm/s, near its limit</p>
        </GlassPanel>
        <GlassPanel
          title="Stage 2"
          caption="23-KA-9102"
          focused={focus === 'b'}
          receded={focus === 'a'}
          onFocusChange={(next) => setFocus(next ? 'b' : null)}
        >
          <ValueReadout value={80} unit="% speed" size="lg" />
          <p className="pt-1 text-xs text-muted-foreground">Vibration 3.9 mm/s, normal</p>
        </GlassPanel>
      </div>
    </div>
  );
}

function GlassCockpitTapeVertical() {
  return (
    <div className="h-80">
      <TapeIndicator
        label="Discharge pressure"
        value={48.6}
        unit="barg"
        decimals={1}
        span={20}
        majorStep={5}
        min={0}
        max={60}
        setpoint={48}
        limits={{ low: 40, high: 52, highHigh: 55 }}
      />
    </div>
  );
}

function GlassCockpitTapeOutsideLimits() {
  return (
    <div className="h-80">
      <TapeIndicator
        label="Discharge temperature"
        value={146.3}
        unit="°C"
        decimals={1}
        span={50}
        majorStep={10}
        min={0}
        max={180}
        setpoint={138}
        limits={{ low: 90, high: 145, highHigh: 155 }}
      />
    </div>
  );
}

function GlassCockpitEngineDisplay() {
  return (
    <div className="relative w-full max-w-xs overflow-hidden rounded-xl p-4">
      <ContourBackdrop lines={10} animated={false} />
      <GlassPanel title={GLASS_COCKPIT_ENGINE_ONE.title} caption={GLASS_COCKPIT_ENGINE_ONE.tag} className="relative">
        <GlassCockpitEngineGauges engine={GLASS_COCKPIT_ENGINE_ONE} />
      </GlassPanel>
    </div>
  );
}

function GlassCockpitTapeHorizontal() {
  return (
    <div className="w-full max-w-md">
      <TapeIndicator
        label="Shaft speed"
        value={9840}
        unit="rpm"
        span={2400}
        majorStep={400}
        minorPerMajor={4}
        min={0}
        max={12000}
        setpoint={9900}
        limits={{ low: 7000, high: 10500 }}
        orientation="horizontal"
      />
    </div>
  );
}

function GlassCockpitModeSelector() {
  const [mode, setMode] = useState<GlassCockpitMode>('temperature');
  const variable = GLASS_COCKPIT_VARIABLES[mode];

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <LayerSwitch label="Primary display" value={mode} options={GLASS_COCKPIT_MODE_OPTIONS} onValueChange={setMode} />
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground">{variable.name}</p>
          <ValueReadout
            value={variable.value}
            unit={variable.unit}
            decimals={variable.decimals}
            size="lg"
            tone={toneFromLimits(variable.value, variable.limits)}
          />
        </div>
        <p className="font-mono text-xs text-muted-foreground">{variable.tag}</p>
      </div>
    </div>
  );
}

function GlassCockpitCautionStrip() {
  const [cautions, setCautions] = useState(GLASS_COCKPIT_CAUTIONS);

  return (
    <CautionStrip
      items={cautions}
      limit={5}
      onAcknowledge={(id) => setCautions((items) => items.map((item) => (item.id === id ? { ...item, acknowledged: true } : item)))}
      className="w-full"
    />
  );
}

function GlassCockpitBackdrop() {
  return (
    <div className="relative h-56 w-full overflow-hidden rounded-xl border border-default">
      <ContourBackdrop lines={12} />
    </div>
  );
}

export default definePage({
  id: 'glass-cockpit',
  title: 'Glass cockpit',
  summary:
    'A compressor train flown like an aircraft: frosted panels over a flowing backdrop, a moving tape for the variable being steered, engine dials on either side and one alerting list in priority order.',
  guidance: {
    use: [
      'For one machine or train where a single variable is steered against a setpoint and limits.',
      'On a showpiece or wall screen where depth and motion help separate the layers.',
      'Keep one primary display and switch its variable, instead of adding more tapes.',
      'Let one panel come forward at a time; the others stay readable behind it.',
    ],
    avoid: [
      'Glass panels on a plain page: without a backdrop the blur is cost with no effect.',
      'Dense tables or long text on glass — use a solid card for those.',
      'More than a handful of alerting lines; summarise the rest as a count.',
      'Motion that carries meaning: the backdrop is decoration and stops for reduced motion.',
    ],
  },
  source,
  sections: [
    {
      id: 'experience',
      title: 'Experience',
      description:
        'Shown in the Neon dusk theme. Switch the primary display between pressure, temperature and flow; click a panel or its corner button to bring it forward and click the button again to release it; acknowledge alerting lines.',
      specimens: [
        {
          id: 'GlassCockpitExperience',
          title: 'Glass cockpit',
          note: 'Pick it for a single critical machine where one steered variable, its limits and the alerts must share a screen.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'experiences/spatial/ContourBackdrop.tsx',
            'experiences/spatial/GlassPanel.tsx',
            'experiences/spatial/TapeIndicator.tsx',
            'experiences/spatial/tapeScale.ts',
            'experiences/spatial/CautionStrip.tsx',
            'experiences/spatial/cautions.ts',
            'experiences/spatial/LayerSwitch.tsx',
            'industrial/RadialGauge.tsx',
            'industrial/Sparkline.tsx',
            'industrial/ValueReadout.tsx',
            'industrial/StatusIndicator.tsx',
            'themes/ThemeScope.tsx',
          ],
          Component: GlassCockpitExperience,
        },
      ],
    },
    {
      id: 'themes',
      title: 'In other themes',
      description: 'The same screen in two more presets, with the backdrop held still. Glass, glow and backdrop all come from the theme accent.',
      specimens: [
        {
          id: 'GlassCockpitHologram',
          title: 'Hologram',
          note: 'Pick it beside 3D and digital-twin views: teal on black with soft corners.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: GlassCockpitHologram,
        },
        {
          id: 'GlassCockpitAuraDark',
          title: 'Aura dark',
          note: 'Pick it when the cockpit sits inside a standard dark Aura application and should not shout.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: GlassCockpitAuraDark,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'Each part on its own, in the theme of the page around it.',
      specimens: [
        {
          id: 'GlassCockpitPanel',
          title: 'Glass panel',
          note: 'Pick it for content that floats over a moving or detailed backdrop.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['experiences/spatial/GlassPanel.tsx', 'experiences/spatial/ContourBackdrop.tsx', 'industrial/ValueReadout.tsx'],
          Component: GlassCockpitPanel,
        },
        {
          id: 'GlassCockpitFocusStates',
          title: 'Focused and receded',
          note: 'Pick it when several panels compete and one should come forward on demand.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['experiences/spatial/GlassPanel.tsx', 'experiences/spatial/ContourBackdrop.tsx', 'industrial/ValueReadout.tsx'],
          Component: GlassCockpitFocusStates,
        },
        {
          id: 'GlassCockpitTapeVertical',
          title: 'Vertical tape',
          note: 'Pick it for the variable being steered: the scale moves, the value and setpoint bug stay in view.',
          origin: 'custom',
          size: 'sm',
          uses: ['experiences/spatial/TapeIndicator.tsx', 'experiences/spatial/tapeScale.ts'],
          Component: GlassCockpitTapeVertical,
        },
        {
          id: 'GlassCockpitTapeOutsideLimits',
          title: 'Tape outside limits',
          note: 'Pick it to see how a value past its high limit is shown: status colour, a band on the edge and the state in words.',
          origin: 'custom',
          size: 'sm',
          uses: ['experiences/spatial/TapeIndicator.tsx', 'experiences/spatial/tapeScale.ts'],
          Component: GlassCockpitTapeOutsideLimits,
        },
        {
          id: 'GlassCockpitEngineDisplay',
          title: 'Engine display',
          note: 'Pick it for the four readings that say whether one rotating machine is healthy.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['experiences/spatial/GlassPanel.tsx', 'experiences/spatial/ContourBackdrop.tsx', 'industrial/RadialGauge.tsx'],
          Component: GlassCockpitEngineDisplay,
        },
        {
          id: 'GlassCockpitTapeHorizontal',
          title: 'Horizontal tape',
          note: 'Pick it under a display for a secondary variable, the way a heading ribbon sits under an attitude display.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['experiences/spatial/TapeIndicator.tsx', 'experiences/spatial/tapeScale.ts'],
          Component: GlassCockpitTapeHorizontal,
        },
        {
          id: 'GlassCockpitModeSelector',
          title: 'Mode selector',
          note: 'Pick it to switch one display between a few variables instead of showing them all at once.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['experiences/spatial/LayerSwitch.tsx', 'industrial/ValueReadout.tsx'],
          Component: GlassCockpitModeSelector,
        },
        {
          id: 'GlassCockpitCautionStrip',
          title: 'Crew alerting strip',
          note: 'Pick it as the one list of what is abnormal, most urgent level first, with acknowledgement.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['experiences/spatial/CautionStrip.tsx', 'experiences/spatial/cautions.ts', 'industrial/StatusDot.tsx'],
          Component: GlassCockpitCautionStrip,
        },
        {
          id: 'GlassCockpitBackdrop',
          title: 'Contour backdrop',
          note: 'Pick it as the living layer behind glass panels; it is decoration and stops moving for reduced motion.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['experiences/spatial/ContourBackdrop.tsx', 'experiences/spatial/contours.ts'],
          Component: GlassCockpitBackdrop,
        },
      ],
    },
  ],
});
