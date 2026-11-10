import { Button } from '@cognite/aura/components/button';
import { IconRefresh } from '@cognite/aura/icons';

import { DashboardFrame } from '../../../library/dashboards/DashboardFrame';
import { DashboardCell, DashboardGrid } from '../../../library/dashboards/DashboardGrid';
import { DashboardPanel } from '../../../library/dashboards/DashboardPanel';
import { TrendChart } from '../../../library/industrial/charts/TrendChart';
import { KpiTile } from '../../../library/industrial/KpiTile';
import { RangeIndicator } from '../../../library/industrial/RangeIndicator';
import { formatValue, runStateStatus, severityStatus, toneFromLimits } from '../../../library/industrial/status';
import type { Limits, RunState, Tone } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { ConditionList } from '../../../library/industrial/workflows/ConditionList';
import type { Condition } from '../../../library/industrial/workflows/ConditionList';
import { LogEntry } from '../../../library/industrial/workflows/LogEntry';
import { ThemeScope } from '../../../library/themes/ThemeScope';
import { ALARMS, childrenOf, findAsset } from '../../data/plant';
import { MINUTE, formatAgo, makeSeries, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './control-room-console.tsx?raw';

type ConsoleReading = {
  id: string;
  label: string;
  tag: string;
  value: number;
  unit: string;
  decimals: number;
  min: number;
  max: number;
  limits: Limits;
  seed: number;
  noise: number;
};

/** The four readings the area is steered by. Gas flow is shown in thousands so the figure fits a tile. */
const CONSOLE_READINGS: readonly ConsoleReading[] = [
  { id: 'pressure', label: 'Discharge pressure', tag: '23-PT-92531', value: 48.6, unit: 'barg', decimals: 1, min: 30, max: 60, limits: { low: 40, high: 52, highHigh: 55 }, seed: 11, noise: 0.5 },
  { id: 'temperature', label: 'Discharge temperature', tag: '23-TT-92532', value: 141.2, unit: '°C', decimals: 1, min: 80, max: 160, limits: { low: 90, high: 145, highHigh: 155 }, seed: 13, noise: 1.2 },
  { id: 'vibration', label: 'Drive-end vibration', tag: '23-VT-92540', value: 6.8, unit: 'mm/s', decimals: 1, min: 0, max: 12, limits: { high: 7.1, highHigh: 11 }, seed: 14, noise: 0.2 },
  { id: 'flow', label: 'Gas flow', tag: '23-FT-92510', value: 182.4, unit: 'kSm³/h', decimals: 1, min: 100, max: 230, limits: { low: 120, high: 210 }, seed: 16, noise: 2.5 },
];

const CONSOLE_LIMIT_WORD: Record<Tone, string> = {
  neutral: 'In limits',
  success: 'In limits',
  info: 'In limits',
  warning: 'Outside limits',
  critical: 'At trip limit',
};

type ConsoleTrainReading = { label: string; value: number | null; unit: string; decimals: number; high?: number };

type ConsoleTrainUnit = { assetId: string; duty: string; readings: readonly ConsoleTrainReading[] };

const CONSOLE_TRAIN: readonly ConsoleTrainUnit[] = [
  {
    assetId: '23-ka-9101',
    duty: 'On load, 82% speed',
    readings: [
      { label: 'Suction', value: 12.4, unit: 'barg', decimals: 1 },
      { label: 'Discharge', value: 48.6, unit: 'barg', decimals: 1, high: 52 },
      { label: 'Temperature', value: 141.2, unit: '°C', decimals: 1, high: 145 },
      { label: 'Vibration', value: 6.8, unit: 'mm/s', decimals: 1, high: 7.1 },
      { label: 'Speed', value: 9840, unit: 'rpm', decimals: 0 },
    ],
  },
  {
    assetId: '23-ka-9102',
    duty: 'On load, 82% speed',
    readings: [
      { label: 'Suction', value: 47.9, unit: 'barg', decimals: 1 },
      { label: 'Discharge', value: 118.4, unit: 'barg', decimals: 1, high: 125 },
      { label: 'Temperature', value: 132.6, unit: '°C', decimals: 1, high: 145 },
      { label: 'Vibration', value: 3.9, unit: 'mm/s', decimals: 1, high: 7.1 },
      { label: 'Speed', value: 9840, unit: 'rpm', decimals: 0 },
    ],
  },
  {
    assetId: '23-ka-9103',
    duty: 'Tripped 13:46, isolated',
    readings: [
      { label: 'Suction', value: 2.1, unit: 'barg', decimals: 1 },
      { label: 'Discharge', value: 2.3, unit: 'barg', decimals: 1, high: 18 },
      { label: 'Temperature', value: 34, unit: '°C', decimals: 1, high: 120 },
      { label: 'Vibration', value: null, unit: 'mm/s', decimals: 1, high: 11 },
      { label: 'Speed', value: 0, unit: 'rpm', decimals: 0 },
    ],
  },
];

const CONSOLE_STEP = 10 * MINUTE;

const CONSOLE_PRESSURE_8H = makeSeries({ seed: 11, points: 49, base: 48.4, amplitude: 1.1, noise: 0.35, cycles: 1.5, stepMs: CONSOLE_STEP, decimals: 1 });

const CONSOLE_TEMPERATURE_8H = makeSeries({ seed: 13, points: 49, base: 137.5, amplitude: 2.2, noise: 0.9, drift: 5, cycles: 1.2, stepMs: CONSOLE_STEP, decimals: 1 });

const CONSOLE_PRESSURE_RANGE = [Math.min(...CONSOLE_PRESSURE_8H.map((point) => point.v)), Math.max(...CONSOLE_PRESSURE_8H.map((point) => point.v))] as const;

const CONSOLE_TEMPERATURE_PEAK = Math.max(...CONSOLE_TEMPERATURE_8H.map((point) => point.v));

const CONSOLE_ALARMS = ALARMS.filter(
  (alarm) => (alarm.state === 'active' || alarm.state === 'acknowledged') && findAsset(alarm.assetId)?.parentId === 'nk-23'
);

const CONSOLE_CONDITIONS: readonly Condition[] = [
  { id: 'lube', label: 'Lube oil pressure established', detail: '23-PT-92710 · 2.4 barg, minimum 1.8', state: 'met' },
  { id: 'seal', label: 'Seal gas differential pressure', detail: '23-PDT-92722 · 3.1 bar, minimum 2.0', state: 'met' },
  { id: 'surge', label: 'Anti-surge valve open', detail: '23-FV-92715 · 100% open', state: 'met' },
  { id: 'suction', label: 'Suction valve open', detail: '23-XV-92701 · closed by trip logic', state: 'unmet' },
  { id: 'reset', label: 'Vibration trip reset', detail: '23-VT-92740 · latched at 11.6 mm/s', state: 'unmet' },
  { id: 'bearing', label: 'Bearing temperature interlock', detail: 'Bypassed by Liv Wold until 18:00', state: 'bypassed' },
];

type ConsoleUnit = { tag: string; name: string; state: RunState };

/** Main units of the area from the plant model, followed by its auxiliaries. */
const CONSOLE_UNITS: readonly ConsoleUnit[] = [
  ...childrenOf('nk-23').map((asset) => ({ tag: asset.tag, name: asset.name, state: asset.state })),
  { tag: '23-PA-9120A', name: 'Lube oil pump A', state: 'running' },
  { tag: '23-PA-9120B', name: 'Lube oil pump B', state: 'standby' },
  { tag: '23-KA-9130', name: 'Seal gas booster', state: 'running' },
];

function consoleLimitsOf(reading: ConsoleTrainReading): Limits {
  return reading.high === undefined ? {} : { high: reading.high };
}

function ConsoleReadingsRow() {
  return (
    <DashboardGrid>
      {CONSOLE_READINGS.map((reading) => {
        const tone = toneFromLimits(reading.value, reading.limits);
        return (
          <DashboardCell key={reading.id} span={3}>
            <KpiTile
              label={reading.label}
              value={reading.value}
              unit={reading.unit}
              decimals={reading.decimals}
              tone={tone}
              status={{ tone, label: CONSOLE_LIMIT_WORD[tone] }}
              trend={{
                values: makeValues({ seed: reading.seed, points: 32, base: reading.value, noise: reading.noise, decimals: reading.decimals }),
                label: `${reading.label}, last 8 hours`,
              }}
              footnote={reading.tag}
            >
              <RangeIndicator
                label={`${reading.label} against its limits`}
                value={reading.value}
                min={reading.min}
                max={reading.max}
                limits={reading.limits}
                unit={reading.unit}
                decimals={reading.decimals}
                showHeader={false}
              />
            </KpiTile>
          </DashboardCell>
        );
      })}
    </DashboardGrid>
  );
}

function ConsoleTrainPanel() {
  return (
    <DashboardPanel title="Compressor train" description="State and key readings per compressor">
      <ul className="grid w-full grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-3">
        {CONSOLE_TRAIN.map((unit) => {
          const asset = findAsset(unit.assetId);
          if (!asset) return null;
          return (
            <li key={unit.assetId} className="flex min-w-0 flex-col gap-3">
              <div className="flex flex-col gap-1">
                <p className="font-mono text-xs text-muted-foreground">{asset.tag}</p>
                <p className="text-sm font-medium text-base-foreground">{asset.name}</p>
                <StatusIndicator {...runStateStatus(asset.state)} size="sm" />
                <p className="text-xs text-muted-foreground">{unit.duty}</p>
              </div>
              <dl className="flex flex-col border-t border-default">
                {unit.readings.map((reading) => (
                  <div key={reading.label} className="flex items-baseline justify-between gap-3 border-b border-default py-1.5">
                    <dt className="text-xs text-muted-foreground">{reading.label}</dt>
                    <dd>
                      <ValueReadout
                        value={reading.value}
                        unit={reading.unit}
                        decimals={reading.decimals}
                        size="xs"
                        tone={reading.value === null ? 'neutral' : toneFromLimits(reading.value, consoleLimitsOf(reading))}
                      />
                    </dd>
                  </div>
                ))}
              </dl>
            </li>
          );
        })}
      </ul>
    </DashboardPanel>
  );
}

function ConsoleConditionsPanel() {
  return (
    <DashboardPanel title="Permissives and interlocks" description="Restart of 23-KA-9103 · 3 of 6 healthy">
      <ConditionList
        label="Start permissives and interlocks, 23-KA-9103"
        conditions={CONSOLE_CONDITIONS}
        stateLabels={{ met: 'Healthy', unmet: 'Not healthy' }}
      />
    </DashboardPanel>
  );
}

function ConsoleTrendPanel() {
  return (
    <DashboardPanel
      title="Discharge trend"
      description="1st stage compressor, last 8 hours with high limits"
      footnote={`Pressure held between ${formatValue(CONSOLE_PRESSURE_RANGE[0], 1)} and ${formatValue(CONSOLE_PRESSURE_RANGE[1], 1)} barg, under the 52 high limit. Temperature climbed through the shift and peaked at ${formatValue(CONSOLE_TEMPERATURE_PEAK, 1)} °C against the 145 high limit.`}
    >
      <TrendChart
        legend
        label="Discharge pressure in barg on the left axis and discharge temperature in degrees Celsius on the right axis over the last 8 hours, each with its high limit"
        series={[
          { key: 'pressure', label: 'Discharge pressure (barg, left)', points: CONSOLE_PRESSURE_8H },
          { key: 'temperature', label: 'Discharge temperature (°C, right)', points: CONSOLE_TEMPERATURE_8H, axis: 'right' },
        ]}
        limits={[
          { value: 52, label: 'High 52 barg', tone: 'warning', align: 'left' },
          { value: 145, label: 'High 145 °C', tone: 'warning', axis: 'right', align: 'right' },
        ]}
        yDomain={[40, 56]}
        yTicks={[40, 44, 48, 52, 56]}
        rightDomain={[120, 152]}
        unit="barg"
        rightUnit="°C"
        heightClassName="h-56"
      />
    </DashboardPanel>
  );
}

function ConsoleAlarmsPanel() {
  return (
    <DashboardPanel title="Standing alarms" description={`${CONSOLE_ALARMS.length} in gas compression, most severe first`}>
      <ul className="flex w-full flex-col gap-4">
        {CONSOLE_ALARMS.map((alarm) => (
          <li key={alarm.id} className="flex min-w-0 flex-col gap-1">
            <div className="flex items-center justify-between gap-3">
              <StatusIndicator {...severityStatus(alarm.severity)} size="sm" detail={alarm.state === 'active' ? 'unacknowledged' : 'acknowledged'} />
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{formatAgo(alarm.raisedAt)}</span>
            </div>
            <p className="text-sm text-base-foreground">{alarm.message}</p>
            <p className="text-xs text-muted-foreground">
              <span className="font-mono">{alarm.sensorTag}</span> · <span className="tabular-nums">{alarm.value}</span> · limit{' '}
              <span className="tabular-nums">{alarm.limit}</span>
            </p>
          </li>
        ))}
      </ul>
    </DashboardPanel>
  );
}

function ConsoleRunStatesPanel() {
  return (
    <DashboardPanel title="Equipment run states" description="Main units and auxiliaries in gas compression">
      <ul className="grid w-full grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
        {CONSOLE_UNITS.map((unit) => (
          <li key={unit.tag} className="flex min-w-0 items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm text-base-foreground">{unit.name}</p>
              <p className="font-mono text-xs text-muted-foreground">{unit.tag}</p>
            </div>
            <StatusIndicator {...runStateStatus(unit.state)} size="sm" />
          </li>
        ))}
      </ul>
    </DashboardPanel>
  );
}

function ConsoleShiftNotePanel() {
  return (
    <DashboardPanel title="Shift note" description="Day shift, latest entry first">
      <LogEntry
        time="13:52"
        author="Ingrid Haugen"
        category="operations"
        links={[
          { kind: 'asset', label: '23-KA-9103' },
          { kind: 'work-order', label: 'WO-104482' },
        ]}
      >
        Recompressor tripped on drive-end vibration at 13:46. Unit isolated and depressurised. Do not restart before the
        bearing inspection is closed.
      </LogEntry>
      <LogEntry time="06:10" author="Liv Wold" category="safety" pinned>
        Keep 1st stage discharge temperature under 145 °C. Reduce load before the high alarm stands for 30 minutes.
      </LogEntry>
    </DashboardPanel>
  );
}

function ConsoleDashboard() {
  return (
    <DashboardFrame
      title="Control room console"
      subtitle="Gas compression · NK-23 · updated 14:00 UTC"
      status={<StatusIndicator tone="critical" shape="diamond" label="1 unit tripped" detail="recompressor" />}
      actions={
        <Button variant="outline" size="sm">
          <IconRefresh /> Refresh
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <ConsoleReadingsRow />
        <DashboardGrid>
          <DashboardCell span={8}>
            <ConsoleTrainPanel />
          </DashboardCell>
          <DashboardCell span={4}>
            <ConsoleConditionsPanel />
          </DashboardCell>
          <DashboardCell span={8}>
            <ConsoleTrendPanel />
          </DashboardCell>
          <DashboardCell span={4}>
            <ConsoleAlarmsPanel />
          </DashboardCell>
          <DashboardCell span={8}>
            <ConsoleRunStatesPanel />
          </DashboardCell>
          <DashboardCell span={4}>
            <ConsoleShiftNotePanel />
          </DashboardCell>
        </DashboardGrid>
      </div>
    </DashboardFrame>
  );
}

function ControlConsoleSignature() {
  return (
    <ThemeScope preset="control-room" className="w-full">
      <ConsoleDashboard />
    </ThemeScope>
  );
}

function ControlConsoleAura() {
  return (
    <ThemeScope preset="aura" className="w-full">
      <ConsoleDashboard />
    </ThemeScope>
  );
}

function ControlConsoleTerminal() {
  return (
    <ThemeScope preset="terminal" className="w-full">
      <ConsoleDashboard />
    </ThemeScope>
  );
}

function ControlConsoleNordicNight() {
  return (
    <ThemeScope preset="nordic-night" className="w-full">
      <ConsoleDashboard />
    </ThemeScope>
  );
}

function ControlConsoleReadings() {
  return <ConsoleReadingsRow />;
}

function ControlConsoleTrain() {
  return <ConsoleTrainPanel />;
}

function ControlConsolePermissives() {
  return <ConsoleConditionsPanel />;
}

function ControlConsoleTrend() {
  return <ConsoleTrendPanel />;
}

function ControlConsoleAlarms() {
  return <ConsoleAlarmsPanel />;
}

function ControlConsoleRunStates() {
  return <ConsoleRunStatesPanel />;
}

function ControlConsoleShiftNote() {
  return <ConsoleShiftNotePanel />;
}

export default definePage({
  id: 'control-room-console',
  title: 'Control room console',
  summary:
    'The dense operator view of one process area: live readings against their limits, the state of every machine, what is alarming and what blocks a restart. Built for a seat that watches it all shift.',
  guidance: {
    use: [
      'For one process area an operator is responsible for, on a console that stays open.',
      'Show every headline reading with its limits, so "in limits" is visible without reading a number.',
      'Keep the alarm list and the permissives beside the equipment they concern.',
      'Lead with the abnormal: the tripped unit is named beside the title.',
    ],
    avoid: [
      'Plant-wide KPIs and production totals — those belong on the plant overview.',
      'Colour on readings that are inside their limits; the console stays neutral until something is wrong.',
      'More than two tags on one trend; add a second trend panel instead.',
      'Controls that change the process. The console shows state; commands go through the control system.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Shown in the Control room theme: dark, compact, sharp and high contrast, on one 12-column grid.',
      specimens: [
        {
          id: 'ControlConsoleSignature',
          title: 'Control room console',
          note: 'Pick it for the operator seat of one process area, where density matters more than white space.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'dashboards/DashboardFrame.tsx',
            'dashboards/DashboardGrid.tsx',
            'dashboards/DashboardPanel.tsx',
            'industrial/KpiTile.tsx',
            'industrial/RangeIndicator.tsx',
            'industrial/StatusIndicator.tsx',
            'industrial/ValueReadout.tsx',
            'industrial/charts/TrendChart.tsx',
            'industrial/workflows/ConditionList.tsx',
            'industrial/workflows/LogEntry.tsx',
            'themes/ThemeScope.tsx',
          ],
          Component: ControlConsoleSignature,
        },
      ],
    },
    {
      id: 'themes',
      title: 'In other themes',
      description: 'The same console, unchanged, in three more presets.',
      specimens: [
        {
          id: 'ControlConsoleAura',
          title: 'Aura',
          note: 'Pick it for an engineering office in daylight, where the console sits beside other Aura apps.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: ControlConsoleAura,
        },
        {
          id: 'ControlConsoleTerminal',
          title: 'Terminal',
          note: 'Pick it when tags and readings dominate and a monospaced face keeps every digit aligned.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: ControlConsoleTerminal,
        },
        {
          id: 'ControlConsoleNordicNight',
          title: 'Nordic night',
          note: 'Pick it for a softer dark console with default spacing, for rooms that are dim but not dark.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: ControlConsoleNordicNight,
        },
      ],
    },
    {
      id: 'panels',
      title: 'Panels',
      description: 'Each part on its own, ready to drop into another dashboard.',
      specimens: [
        {
          id: 'ControlConsoleReadings',
          title: 'Live readings with limits',
          note: 'Pick it as the first row when each headline figure is a measurement with operating limits.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['dashboards/DashboardGrid.tsx', 'industrial/KpiTile.tsx', 'industrial/RangeIndicator.tsx'],
          Component: ControlConsoleReadings,
        },
        {
          id: 'ControlConsoleTrain',
          title: 'Compressor train',
          note: 'Pick it to compare two to four machines of one train reading by reading.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/StatusIndicator.tsx', 'industrial/ValueReadout.tsx'],
          Component: ControlConsoleTrain,
        },
        {
          id: 'ControlConsolePermissives',
          title: 'Permissives and interlocks',
          note: 'Pick it when the operator needs to see what blocks a start, and what has been bypassed.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/workflows/ConditionList.tsx'],
          Component: ControlConsolePermissives,
        },
        {
          id: 'ControlConsoleTrend',
          title: 'Trend with limit lines',
          note: 'Pick it for the two tags that explain each other, each drawn against its own limit.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/charts/TrendChart.tsx'],
          Component: ControlConsoleTrend,
        },
        {
          id: 'ControlConsoleAlarms',
          title: 'Standing alarms',
          note: 'Pick it for a narrow column: each alarm wraps instead of cutting its message short.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/StatusIndicator.tsx'],
          Component: ControlConsoleAlarms,
        },
        {
          id: 'ControlConsoleRunStates',
          title: 'Equipment run states',
          note: 'Pick it to list every unit of an area, auxiliaries included, with its run state.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/StatusIndicator.tsx'],
          Component: ControlConsoleRunStates,
        },
        {
          id: 'ControlConsoleShiftNote',
          title: 'Shift note',
          note: 'Pick it to keep the latest log entry and the standing instruction in the operator’s view.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/workflows/LogEntry.tsx'],
          Component: ControlConsoleShiftNote,
        },
      ],
    },
  ],
});
