import { ChartContainer, ChartTooltip, ChartTooltipContent, chartSeriesColor } from '@cognite/aura/chart';
import type { ChartConfig } from '@cognite/aura/chart';
import { Button } from '@cognite/aura/components/button';
import { Card } from '@cognite/aura/components/card';
import { IconArrowRight } from '@cognite/aura/icons';
import { Fragment } from 'react';
import type { ReactNode } from 'react';
import { CartesianGrid, ComposedChart, Line, ReferenceLine, Scatter, XAxis, YAxis } from 'recharts';

import { SeriesLegend } from '../../../library/industrial/charts/SeriesLegend';
import { TrendChart } from '../../../library/industrial/charts/TrendChart';
import { DaysOfCover } from '../../../library/industrial/domains/DaysOfCover';
import { ShareBarList } from '../../../library/industrial/domains/ShareBarList';
import { TankInventoryTile } from '../../../library/industrial/domains/TankInventoryTile';
import { judgeCompliance } from '../../../library/industrial/domains2/compliance';
import type { ComplianceLimit } from '../../../library/industrial/domains2/compliance';
import { ComplianceTile } from '../../../library/industrial/domains2/ComplianceTile';
import { PumpingStationCard } from '../../../library/industrial/domains2/PumpingStationCard';
import type { StationPump } from '../../../library/industrial/domains2/PumpingStationCard';
import { KpiTile } from '../../../library/industrial/KpiTile';
import { LinearGauge } from '../../../library/industrial/LinearGauge';
import { DistributionBar } from '../../../library/industrial/operations/DistributionBar';
import { RangeIndicator } from '../../../library/industrial/RangeIndicator';
import { formatValue } from '../../../library/industrial/status';
import type { Tone } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { DAY, HOUR, REFERENCE_NOW, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './water-and-utilities.tsx?raw';

const NOW = REFERENCE_NOW;
const CHART_FRAME = 'aspect-auto h-full w-full';
const TH = 'px-3 py-2 text-left text-xs font-medium text-muted-foreground';
const TD = 'px-3 py-2.5 align-middle';

type Shape = 'dot' | 'ring' | 'square' | 'diamond';
type Verdict = { tone: Tone; label: string; shape: Shape };

/** Stord water works: the utility that supplies the Stord terminal and the town around it. */
const BOOSTER_PUMPS: readonly StationPump[] = [
  { id: 'a', tag: '61-PA-1001A', duty: 'duty', state: 'running', speed: 84 },
  { id: 'b', tag: '61-PA-1001B', duty: 'assist', state: 'running', speed: 62 },
  { id: 'c', tag: '61-PA-1001C', duty: 'standby', state: 'standby' },
];

const INTAKE_PUMPS: readonly StationPump[] = [
  { id: 'a', tag: '60-PA-0101A', duty: 'duty', state: 'tripped' },
  { id: 'b', tag: '60-PA-0101B', duty: 'standby', state: 'running', speed: 91 },
  { id: 'c', tag: '60-PA-0101C', duty: 'standby', state: 'maintenance' },
];

type PressureZone = { id: string; name: string; pressure: number; low: number; high: number; nightFlow: number; properties: number; verdict: Verdict };

const PRESSURE_ZONES: readonly PressureZone[] = [
  { id: 'z1', name: 'Leirvik centre', pressure: 4.6, low: 3.0, high: 6.0, nightFlow: 6.2, properties: 3410, verdict: { tone: 'success', label: 'Normal', shape: 'dot' } },
  { id: 'z2', name: 'Kårevik industrial', pressure: 5.4, low: 4.0, high: 7.0, nightFlow: 11.8, properties: 212, verdict: { tone: 'success', label: 'Normal', shape: 'dot' } },
  { id: 'z3', name: 'Heiane high level', pressure: 2.7, low: 3.0, high: 6.0, nightFlow: 9.4, properties: 1880, verdict: { tone: 'warning', label: 'Low pressure', shape: 'square' } },
  { id: 'z4', name: 'Sagvåg', pressure: 4.1, low: 3.0, high: 6.0, nightFlow: 3.1, properties: 1245, verdict: { tone: 'success', label: 'Normal', shape: 'dot' } },
  { id: 'z5', name: 'Huglo ferry quay', pressure: 6.3, low: 3.0, high: 6.0, nightFlow: 0.9, properties: 164, verdict: { tone: 'warning', label: 'High pressure', shape: 'square' } },
];

type TrainReading = { label: string; value: number; unit: string; decimals: number; tone?: Tone };
type TrainStage = { id: string; name: string; detail: string; readings: readonly TrainReading[] };

const TREATMENT_TRAIN: readonly TrainStage[] = [
  {
    id: 'raw',
    name: 'Raw water',
    detail: 'Ådlandsvatnet intake',
    readings: [
      { label: 'Turbidity', value: 2.8, unit: 'NTU', decimals: 1 },
      { label: 'pH', value: 6.4, unit: '', decimals: 1 },
    ],
  },
  {
    id: 'coag',
    name: 'Coagulation',
    detail: 'Ferric chloride',
    readings: [
      { label: 'Dose', value: 11.5, unit: 'mg/L', decimals: 1 },
      { label: 'pH', value: 5.9, unit: '', decimals: 1 },
    ],
  },
  {
    id: 'filter',
    name: 'Filtration',
    detail: '4 of 4 filters in service',
    readings: [
      { label: 'Turbidity', value: 0.31, unit: 'NTU', decimals: 2 },
      { label: 'Head loss', value: 1.9, unit: 'm', decimals: 1, tone: 'warning' },
    ],
  },
  {
    id: 'uv',
    name: 'UV disinfection',
    detail: '2 reactors',
    readings: [
      { label: 'Dose', value: 46, unit: 'mJ/cm²', decimals: 0 },
      { label: 'Transmittance', value: 91, unit: '%', decimals: 0 },
    ],
  },
  {
    id: 'clear',
    name: 'Clear water',
    detail: 'To supply',
    readings: [
      { label: 'Free chlorine', value: 0.22, unit: 'mg/L', decimals: 2, tone: 'warning' },
      { label: 'pH', value: 7.9, unit: '', decimals: 1 },
    ],
  },
];

type EffluentRow = { parameter: string; unit: string; result: number; limit: ComplianceLimit; decimals: number; samples: string };

/** Final effluent of the Stord wastewater works against its discharge permit, 30-day means. */
const EFFLUENT: readonly EffluentRow[] = [
  { parameter: 'BOD₅', unit: 'mg/L', result: 14, limit: { max: 25 }, decimals: 0, samples: '8 of 8' },
  { parameter: 'COD', unit: 'mg/L', result: 71, limit: { max: 125 }, decimals: 0, samples: '8 of 8' },
  { parameter: 'Suspended solids', unit: 'mg/L', result: 33, limit: { max: 35 }, decimals: 0, samples: '7 of 8' },
  { parameter: 'Total phosphorus', unit: 'mg/L', result: 1.3, limit: { max: 1 }, decimals: 1, samples: '5 of 8' },
  { parameter: 'Ammonia nitrogen', unit: 'mg/L', result: 3.2, limit: { max: 10 }, decimals: 1, samples: '8 of 8' },
  { parameter: 'pH', unit: '', result: 7.4, limit: { min: 6, max: 9 }, decimals: 1, samples: '30 of 30' },
];

/** Demand in L/s through today, hourly: measured to now, with the typical weekday and its usual range. */
const DAY_START = NOW - 14 * HOUR;
const DEMAND_SHAPE = [62, 55, 50, 48, 49, 58, 96, 131, 126, 112, 104, 101, 106, 103, 98, 100, 108, 124, 133, 121, 104, 90, 78, 68, 62];
const DEMAND_NOISE = makeValues({ seed: 71, points: 15, base: 0, noise: 3, decimals: 0 });
const DEMAND_TYPICAL = DEMAND_SHAPE.map((value, index) => ({ t: DAY_START + index * HOUR, v: value }));
const DEMAND_TODAY = DEMAND_SHAPE.slice(0, 15).map((value, index) => ({ t: DAY_START + index * HOUR, v: value + DEMAND_NOISE[index] + (index < 6 ? 9 : 0) }));
const DEMAND_RANGE = DEMAND_SHAPE.map((value, index) => ({ t: DAY_START + index * HOUR, low: Math.round(value * 0.9), high: Math.round(value * 1.1) }));
const DEMAND_NOW = DEMAND_TODAY[DEMAND_TODAY.length - 1].v;
const NIGHT_FLOW = Math.min(...DEMAND_TODAY.map((point) => point.v));

/** Water balance for February in thousand m³. */
const WATER_BALANCE = { input: 412, billed: 301, unbilled: 9, apparent: 14, real: 88 };
const NON_REVENUE = WATER_BALANCE.input - WATER_BALANCE.billed;

/** Efficiency curve of booster pump 61-PA-1001A at full speed, and where it has been running. */
const PUMP_CURVE = [
  { flow: 60, efficiency: 48 },
  { flow: 100, efficiency: 63 },
  { flow: 140, efficiency: 74 },
  { flow: 180, efficiency: 81 },
  { flow: 220, efficiency: 84 },
  { flow: 260, efficiency: 82 },
  { flow: 300, efficiency: 75 },
  { flow: 340, efficiency: 63 },
];
const BEST_FLOW = 220;
const DUTY_HOURS = makeValues({ seed: 72, points: 24, base: 152, amplitude: 26, noise: 6, decimals: 0 }).map((flow) => ({
  flow,
  efficiency: Math.round((84 - ((flow - BEST_FLOW) / 22) ** 2) * 10) / 10,
}));
const DUTY_NOW = DUTY_HOURS[DUTY_HOURS.length - 1];

const DUTY_CONFIG = {
  curve: { label: 'Efficiency curve', color: 'var(--color-chart-neutral-450)' },
  efficiency: { label: 'Hourly duty points', color: chartSeriesColor(1) },
} satisfies ChartConfig;

/** Service reservoirs: days for the stored volume to be replaced. Above three days, chlorine residual fades. */
const TURNOVER = [
  { id: 'r4', label: 'Huglo', value: 5.8, detail: '450 m³', tone: 'warning' as const },
  { id: 'r2', label: 'Heiane', value: 3.4, detail: '2,400 m³', tone: 'warning' as const },
  { id: 'r1', label: 'Leirvik', value: 1.9, detail: '4,000 m³' },
  { id: 'r3', label: 'Sagvåg', value: 1.6, detail: '1,200 m³' },
  { id: 'r5', label: 'Kårevik', value: 0.8, detail: '1,800 m³' },
];

type Valve = { tag: string; name: string; position: number; mode: string; moved: string; verdict?: Verdict };

const VALVES: readonly Valve[] = [
  { tag: '62-XV-2011', name: 'Leirvik zone inlet', position: 100, mode: 'Remote', moved: '3 Mar' },
  { tag: '62-PCV-2014', name: 'Heiane pressure reducing', position: 38, mode: 'Auto', moved: '12 Mar, 13:52' },
  { tag: '62-XV-2020', name: 'Sagvåg cross-connection', position: 0, mode: 'Local', moved: '14 Jan' },
  { tag: '62-XV-2031', name: 'Kårevik isolation', position: 0, mode: 'Remote', moved: '12 Mar, 11:05', verdict: { tone: 'warning', label: 'Closed for repair', shape: 'square' } },
  { tag: '62-FCV-2040', name: 'Reservoir inlet, Leirvik', position: 64, mode: 'Auto', moved: '12 Mar, 13:58' },
  { tag: '62-XV-2044', name: 'Huglo sea crossing', position: 100, mode: 'Remote', moved: '9 Feb', verdict: { tone: 'critical', label: 'Position not confirmed', shape: 'diamond' } },
];

type SpillEvent = { id: string; location: string; tag: string; start: string; duration: string; volume: number | null; cause: string; reported: Verdict };

const SPILLS: readonly SpillEvent[] = [
  { id: 'sp-0311', location: 'Vikanes storm overflow', tag: '65-CSO-03', start: '11 Mar, 21:40', duration: '1 h 25 min', volume: 310, cause: 'Rainfall, 18 mm in 2 hours', reported: { tone: 'success', label: 'Reported', shape: 'dot' } },
  { id: 'sp-0309', location: 'Sagvåg pumping station', tag: '65-PS-07', start: '9 Mar, 04:15', duration: '38 min', volume: 42, cause: 'Both pumps tripped on power dip', reported: { tone: 'success', label: 'Reported', shape: 'dot' } },
  { id: 'sp-0306', location: 'Vikanes storm overflow', tag: '65-CSO-03', start: '6 Mar, 16:05', duration: '3 h 10 min', volume: 880, cause: 'Rainfall, 31 mm in 6 hours', reported: { tone: 'warning', label: 'Report due 13 Mar', shape: 'square' } },
  { id: 'sp-0302', location: 'Leirvik inlet works', tag: '65-SC-01', start: '2 Mar, 09:50', duration: '12 min', volume: null, cause: 'Screen blinded, volume not metered', reported: { tone: 'critical', label: 'Report overdue', shape: 'diamond' } },
];

type LeakAlert = { id: string; kind: string; zone: string; detected: string; evidence: string; loss: string; verdict: Verdict; action: string };

const LEAK_ALERTS: readonly LeakAlert[] = [
  { id: 'lk-118', kind: 'Burst main', zone: 'Kårevik industrial', detected: '12 Mar, 10:48', evidence: 'Zone inlet flow +38 L/s in 4 minutes, pressure down 1.9 bar', loss: 'About 140 m³/h', verdict: { tone: 'critical', label: 'Burst, isolating', shape: 'diamond' }, action: 'View isolation plan' },
  { id: 'lk-117', kind: 'Suspected leak', zone: 'Heiane high level', detected: '10 Mar, 03:00', evidence: 'Minimum night flow up from 6.1 to 9.4 L/s over 5 nights', loss: 'About 12 m³/h', verdict: { tone: 'warning', label: 'Survey planned', shape: 'square' }, action: 'Assign leak survey' },
];

function Panel({ title, meta, children }: { title: string; meta?: ReactNode; children: ReactNode }) {
  return (
    <Card className="w-full min-w-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="text-sm font-medium text-base-foreground">{title}</h3>
        {meta ? <span className="text-xs tabular-nums text-muted-foreground">{meta}</span> : null}
      </div>
      {children}
    </Card>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="whitespace-nowrap tabular-nums text-base-foreground">{children}</dd>
    </div>
  );
}

function WaterUtilityPumpingStation() {
  return (
    <div className="w-full max-w-80">
      <PumpingStationCard
        name="Kårevik booster station"
        tag="61-PS-10"
        pumps={BOOSTER_PUMPS}
        readings={[
          { label: 'Flow', value: 148, unit: 'L/s' },
          { label: 'Delivery pressure', value: 6.4, unit: 'bar', decimals: 1 },
        ]}
      />
    </div>
  );
}

function WaterUtilityStationTripped() {
  return (
    <div className="w-full max-w-80">
      <PumpingStationCard
        name="Ådlandsvatnet intake"
        tag="60-PS-01"
        pumps={INTAKE_PUMPS}
        readings={[
          { label: 'Flow', value: 121, unit: 'L/s' },
          { label: 'Wet well level', value: 2.1, unit: 'm', decimals: 1 },
        ]}
      />
    </div>
  );
}

function WaterUtilityTankLevel() {
  return (
    <div className="w-full max-w-80">
      <TankInventoryTile
        tag="63-TK-0001"
        product="Leirvik service reservoir"
        volume={2870}
        capacity={4000}
        unit="m³"
        limits={{ lowLow: 20, low: 35, high: 92 }}
        movement={{ direction: 'filling', rate: 46, rateUnit: 'm³/h' }}
      />
    </div>
  );
}

function WaterUtilityPressureZones() {
  return (
    <Panel title="Network pressure zones" meta="Critical point pressure, bar">
      <ul aria-label="Pressure zones" className="flex w-full flex-col">
        {PRESSURE_ZONES.map((zone) => (
          <li key={zone.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-x-4 gap-y-1 border-t border-default py-2.5 first:border-t-0 first:pt-0 last:pb-0">
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-sm text-base-foreground">{zone.name}</span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {formatValue(zone.properties)} properties · night flow {formatValue(zone.nightFlow, 1)} L/s
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <StatusIndicator size="sm" {...zone.verdict} />
                <ValueReadout size="xs" value={zone.pressure} unit="bar" decimals={1} tone={zone.verdict.tone === 'success' ? 'neutral' : zone.verdict.tone} />
              </div>
              <RangeIndicator showHeader={false} showLimits={false} label={`${zone.name} pressure`} value={zone.pressure} min={0} max={8} limits={{ low: zone.low, high: zone.high }} unit="bar" decimals={1} />
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function WaterUtilityValveList() {
  return (
    <Panel title="Valve status" meta="Distribution network">
      <ul aria-label="Network valves" className="flex w-full flex-col">
        {VALVES.map((valve) => {
          const state = valve.position === 0 ? 'Closed' : valve.position === 100 ? 'Open' : `Throttled ${valve.position} %`;
          return (
            <li key={valve.tag} className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-default py-2.5 first:border-t-0 first:pt-0 last:pb-0">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-sm text-base-foreground">{valve.name}</span>
                <span className="text-xs text-muted-foreground">
                  <span className="font-mono">{valve.tag}</span> · {valve.mode} · moved {valve.moved}
                </span>
              </div>
              {valve.verdict ? (
                <StatusIndicator size="sm" {...valve.verdict} />
              ) : (
                <StatusIndicator size="sm" tone="neutral" label={state} shape={valve.position === 0 ? 'square' : valve.position === 100 ? 'dot' : 'ring'} />
              )}
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

function WaterUtilityTreatmentTrain() {
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="text-sm font-medium text-base-foreground">Treatment train, Stord water works</h3>
        <span className="text-xs tabular-nums text-muted-foreground">Online analysers · 12 Mar, 14:00 · 121 L/s through the works</span>
      </div>
      <ol aria-label="Treatment stages in flow order" className="flex w-full flex-col items-stretch gap-2 lg:flex-row lg:items-center">
        {TREATMENT_TRAIN.map((stage, index) => (
          <Fragment key={stage.id}>
            {index > 0 ? <IconArrowRight aria-hidden className="hidden size-4 shrink-0 text-muted-foreground lg:block" /> : null}
            <li className="flex min-w-0 flex-1 flex-col gap-3 rounded-xl border border-default bg-card-background p-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-base-foreground">{stage.name}</span>
                <span className="text-xs text-muted-foreground">{stage.detail}</span>
              </div>
              <dl className="flex flex-col gap-2">
                {stage.readings.map((reading) => (
                  <div key={reading.label} className="flex items-baseline justify-between gap-2">
                    <dt className="text-xs text-muted-foreground">{reading.label}</dt>
                    <dd>
                      <ValueReadout size="xs" value={reading.value} unit={reading.unit} decimals={reading.decimals} tone={reading.tone ?? 'neutral'} />
                    </dd>
                  </div>
                ))}
              </dl>
            </li>
          </Fragment>
        ))}
      </ol>
      <p className="text-xs text-muted-foreground">Two readings need attention: filter head loss is near the 2.0 m backwash trigger, and free chlorine is close to its 0.20 mg/L minimum.</p>
    </div>
  );
}

function WaterUtilityComplianceTile() {
  return (
    <div className="w-full max-w-72">
      <ComplianceTile
        label="Turbidity, treated water"
        value={0.31}
        unit="NTU"
        decimals={2}
        limit={{ max: 1 }}
        samples={{ compliant: 360, total: 360 }}
        basis="Drinking water regulation · last 30 days"
      />
    </div>
  );
}

function WaterUtilityComplianceClose() {
  return (
    <div className="w-full max-w-72">
      <ComplianceTile
        label="Free chlorine, leaving the works"
        value={0.22}
        unit="mg/L"
        decimals={2}
        limit={{ min: 0.2 }}
        scaleMax={1}
        samples={{ compliant: 357, total: 360 }}
        basis="Operating permit · last 30 days"
      />
    </div>
  );
}

function WaterUtilityComplianceExceeded() {
  return (
    <div className="w-full max-w-72">
      <ComplianceTile
        label="Total phosphorus, final effluent"
        value={1.3}
        unit="mg/L"
        decimals={1}
        limit={{ max: 1 }}
        scaleMax={2}
        samples={{ compliant: 5, total: 8 }}
        basis="Discharge permit · 30-day mean"
      />
    </div>
  );
}

function WaterUtilityEffluentTable() {
  return (
    <Panel title="Final effluent quality" meta="Stord wastewater works · 30-day means against permit">
      <div className="w-full overflow-x-auto">
        <table aria-label="Final effluent quality against discharge permit limits" className="w-full min-w-144 border-collapse text-sm">
          <thead>
            <tr>
              <th scope="col" className={`${TH} pl-0`}>
                Parameter
              </th>
              <th scope="col" className={`${TH} text-right`}>
                Result
              </th>
              <th scope="col" className={`${TH} text-right`}>
                Permit limit
              </th>
              <th scope="col" className={`${TH} text-right`}>
                Samples within
              </th>
              <th scope="col" className={`${TH} pr-0`}>
                Verdict
              </th>
            </tr>
          </thead>
          <tbody>
            {EFFLUENT.map((row) => {
              const result = judgeCompliance(row.result, row.limit);
              const limitText = row.limit.min === undefined ? `≤ ${row.limit.max}` : `${row.limit.min}–${row.limit.max}`;
              return (
                <tr key={row.parameter} className="border-t border-default">
                  <td className={`${TD} pl-0 text-base-foreground`}>
                    {row.parameter}
                    {row.unit ? <span className="text-muted-foreground"> · {row.unit}</span> : null}
                  </td>
                  <td className={`${TD} text-right`}>
                    <ValueReadout size="xs" value={row.result} decimals={row.decimals} tone={result.verdict === 'within' ? 'neutral' : result.tone} />
                  </td>
                  <td className={`${TD} text-right tabular-nums text-medium-foreground`}>{limitText}</td>
                  <td className={`${TD} text-right tabular-nums text-medium-foreground`}>{row.samples}</td>
                  <td className={`${TD} pr-0`}>
                    <StatusIndicator size="sm" tone={result.tone} label={result.label} shape={result.shape} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function WaterUtilityDosing() {
  return (
    <Card className="w-full max-w-72 gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">Ferric chloride dosing</span>
        <span className="font-mono text-xs text-muted-foreground">64-PD-0301</span>
      </div>
      <ValueReadout size="md" value={11.5} unit="mg/L" decimals={1} />
      <LinearGauge showHeader={false} size="sm" label="Dose against setpoint" value={11.5} max={20} target={12} unit="mg/L" decimals={1} />
      <dl className="flex flex-col gap-1.5 text-xs">
        <Fact label="Setpoint, flow-paced">12.0 mg/L</Fact>
        <Fact label="Pump rate">5.0 L/h</Fact>
        <Fact label="Tank 64-TK-0301">1,680 L</Fact>
      </dl>
      <DaysOfCover label="Stock at the current rate" onHand={1680} dailyUse={120} leadTimeDays={10} />
    </Card>
  );
}

function WaterUtilityDemandProfile() {
  return (
    <Panel title="Demand profile" meta="Stord supply area · today · L/s">
      <TrendChart
        label="Water demand today against a typical weekday; demand before 06:00 ran about 9 litres per second above the usual night level"
        series={[
          { key: 'typical', label: 'Typical weekday', points: DEMAND_TYPICAL, ghost: true },
          { key: 'today', label: 'Today', points: DEMAND_TODAY },
        ]}
        envelopes={[{ key: 'range', label: 'Usual range', points: DEMAND_RANGE, color: 'var(--color-chart-neutral-200)' }]}
        regions={[{ from: DAY_START + 1 * HOUR, to: DAY_START + 5 * HOUR, label: 'Night flow', tone: 'neutral' }]}
        events={[{ t: NOW, label: 'Now', solid: true }]}
        yDomain={[0, 160]}
        unit="L/s"
        maxTicks={7}
        showLast
        legend
        heightClassName="h-60"
        summary="Night flow sat above the usual range from 01:00 to 05:00: the sign of a new leak rather than of use."
      />
    </Panel>
  );
}

function WaterUtilityDemandTile() {
  return (
    <div className="w-full max-w-72">
      <KpiTile
        label="Demand now"
        value={DEMAND_NOW}
        unit="L/s"
        delta={{ reference: DEMAND_SHAPE[14], caption: 'vs typical for 14:00', decimals: 0 }}
        trend={{ values: DEMAND_TODAY.map((point) => point.v), variant: 'area', label: 'Demand today' }}
        footnote="Evening peak expected at 18:00, about 133 L/s"
      />
    </div>
  );
}

function WaterUtilityPumpDutyPoint() {
  return (
    <Panel title="Pump efficiency at duty point" meta="61-PA-1001A · last 24 hours">
      <div className="h-56 w-full">
        <ChartContainer
          config={DUTY_CONFIG}
          className={CHART_FRAME}
          aria-label={`Pump efficiency against flow: the pump has run between 120 and 185 litres per second, well left of its best efficiency point at ${BEST_FLOW} litres per second`}
        >
          <ComposedChart margin={{ top: 16, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="flow" type="number" domain={[40, 360]} ticks={[40, 120, 200, 280, 360]} tickLine={false} axisLine={false} allowDuplicatedCategory={false} />
            <YAxis dataKey="efficiency" type="number" domain={[40, 90]} ticks={[40, 50, 60, 70, 80, 90]} tickLine={false} axisLine={false} width={28} />
            <ChartTooltip content={<ChartTooltipContent hideLabel valueFormatter={(value) => `${formatValue(Number(value), 1)} %`} />} />
            <ReferenceLine x={BEST_FLOW} stroke="var(--color-chart-neutral-450)" strokeDasharray="3 3" label={{ value: 'Best efficiency', position: 'top', className: 'fill-muted-foreground text-xs' }} />
            <Line data={PUMP_CURVE} dataKey="efficiency" name="curve" type="monotone" stroke="var(--color-curve)" strokeWidth={2} dot={false} isAnimationActive={false} />
            <Scatter data={DUTY_HOURS} dataKey="efficiency" name="efficiency" fill="var(--color-efficiency)" fillOpacity={0.7} isAnimationActive={false} />
          </ComposedChart>
        </ChartContainer>
      </div>
      <SeriesLegend
        items={[
          { key: 'efficiency', label: 'Hourly duty points', color: DUTY_CONFIG.efficiency.color, mark: 'dot' },
          { key: 'curve', label: 'Efficiency curve (%)', color: DUTY_CONFIG.curve.color, mark: 'line' },
        ]}
      />
      <p className="text-xs text-muted-foreground">
        Flow in L/s along the bottom. Now {DUTY_NOW.flow} L/s at {formatValue(DUTY_NOW.efficiency, 1)} %, about {formatValue(84 - DUTY_NOW.efficiency)} points under best efficiency. One pump at higher speed would sit
        closer to it than two throttled back.
      </p>
    </Panel>
  );
}

function WaterUtilityTurnover() {
  return (
    <Panel title="Service reservoir turnover" meta="Days to replace the stored volume">
      <ShareBarList label="Turnover time per service reservoir in days" items={TURNOVER} unit="d" decimals={1} max={7} />
      <p className="text-xs text-muted-foreground">Target is three days or less. Huglo and Heiane hold water long enough for the chlorine residual to fade; lower their top level or cycle them deeper.</p>
    </Panel>
  );
}

function WaterUtilityNrwSummary() {
  return (
    <Card className="w-full max-w-80 gap-3">
      <span className="text-xs text-muted-foreground">Non-revenue water, February</span>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <ValueReadout size="md" value={(NON_REVENUE / WATER_BALANCE.input) * 100} unit="%" decimals={1} tone="warning" />
        <span className="text-xs tabular-nums text-muted-foreground">
          {formatValue(NON_REVENUE)} of {formatValue(WATER_BALANCE.input)} thousand m³
        </span>
      </div>
      <DistributionBar
        size="sm"
        label="Water balance, February"
        unit="k m³"
        segments={[
          { id: 'billed', label: 'Billed', value: WATER_BALANCE.billed, colorClass: 'bg-chart-neutral-300' },
          { id: 'unbilled', label: 'Unbilled, authorised', value: WATER_BALANCE.unbilled, colorClass: 'bg-chart-1-200' },
          { id: 'apparent', label: 'Metering and theft', value: WATER_BALANCE.apparent, colorClass: 'bg-chart-1-300' },
          { id: 'real', label: 'Leakage', value: WATER_BALANCE.real, colorClass: 'bg-chart-1-450' },
        ]}
      />
      <StatusIndicator size="sm" tone="warning" label="Above the 20 % target" shape="square" />
    </Card>
  );
}

function WaterUtilityNightFlowTile() {
  return (
    <div className="w-full max-w-72">
      <KpiTile
        label="Minimum night flow"
        value={NIGHT_FLOW}
        unit="L/s"
        status={{ tone: 'warning', label: 'Rising', shape: 'square' }}
        delta={{ reference: 48, goodDirection: 'down', caption: 'vs 30-day mean', decimals: 0 }}
        trend={{ values: [...makeValues({ seed: 73, points: 29, base: 48, noise: 1.2, drift: 2, stepMs: DAY, decimals: 0 }), NIGHT_FLOW], variant: 'bar', label: 'Minimum night flow, last 30 nights', limit: 52 }}
        footnote="Lowest hourly demand between 01:00 and 05:00"
      />
    </div>
  );
}

function WaterUtilityEnergyTile() {
  return (
    <div className="w-full max-w-72">
      <KpiTile
        label="Energy per m³ supplied"
        value={0.46}
        unit="kWh/m³"
        decimals={2}
        delta={{ reference: 0.43, goodDirection: 'down', caption: 'vs last month', decimals: 2 }}
        target={{ value: 0.42 }}
        trend={{ values: makeValues({ seed: 74, points: 30, base: 0.43, drift: 0.03, noise: 0.008, stepMs: DAY, decimals: 2 }), label: 'Energy per cubic metre, last 30 days' }}
        footnote="Pumping 81 %, treatment 14 %"
      />
    </div>
  );
}

function WaterUtilityLeakAlerts() {
  return (
    <Panel title="Leak and burst alerts" meta="2 open">
      <ul aria-label="Open leak and burst alerts" className="flex w-full flex-col">
        {LEAK_ALERTS.map((alert) => (
          <li key={alert.id} className="flex flex-wrap items-start gap-x-6 gap-y-3 border-t border-default py-3 first:border-t-0 first:pt-0 last:pb-0">
            <div className="flex min-w-0 flex-1 basis-72 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-sm font-medium text-base-foreground">
                  {alert.kind}, {alert.zone}
                </span>
                <StatusIndicator size="sm" {...alert.verdict} pulse={alert.verdict.tone === 'critical'} />
              </div>
              <p className="text-sm text-medium-foreground">{alert.evidence}</p>
              <span className="text-xs tabular-nums text-muted-foreground">
                <span className="font-mono">{alert.id.toUpperCase()}</span> · detected {alert.detected} · {alert.loss}
              </span>
            </div>
            <Button variant={alert.verdict.tone === 'critical' ? 'secondary' : 'ghost'} size="sm">
              {alert.action}
            </Button>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function WaterUtilityCustomerImpact() {
  return (
    <Card className="w-full max-w-72 gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">Supply interruption</span>
        <StatusIndicator size="sm" tone="critical" label="Ongoing" shape="diamond" />
      </div>
      <ValueReadout size="md" value={212} unit="properties" tone="critical" />
      <dl className="flex flex-col gap-1.5 text-xs">
        <Fact label="Zone">Kårevik industrial</Fact>
        <Fact label="Without water since">11:05</Fact>
        <Fact label="Estimated restore">17:30</Fact>
        <Fact label="Customer minutes lost">37,100</Fact>
      </dl>
      <span className="text-xs text-muted-foreground">Includes the Stord terminal fire water top-up line.</span>
    </Card>
  );
}

function WaterUtilitySpillLog() {
  return (
    <div className="w-full overflow-x-auto">
      <table aria-label="Overflow and spill events, March" className="w-full min-w-208 border-collapse text-sm">
        <thead>
          <tr>
            <th scope="col" className={TH}>
              Start
            </th>
            <th scope="col" className={TH}>
              Location
            </th>
            <th scope="col" className={TH}>
              Cause
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Duration
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Volume, m³
            </th>
            <th scope="col" className={TH}>
              Regulator report
            </th>
          </tr>
        </thead>
        <tbody>
          {SPILLS.map((spill) => (
            <tr key={spill.id} className="border-t border-default">
              <td className={`${TD} whitespace-nowrap tabular-nums text-medium-foreground`}>{spill.start}</td>
              <td className={TD}>
                <span className="block text-base-foreground">{spill.location}</span>
                <span className="block font-mono text-xs text-muted-foreground">{spill.tag}</span>
              </td>
              <td className={`${TD} text-medium-foreground`}>{spill.cause}</td>
              <td className={`${TD} whitespace-nowrap text-right tabular-nums text-medium-foreground`}>{spill.duration}</td>
              <td className={`${TD} text-right tabular-nums text-base-foreground`}>{formatValue(spill.volume)}</td>
              <td className={TD}>
                <StatusIndicator size="sm" {...spill.reported} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WaterUtilityOverview() {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-base font-semibold text-base-foreground">Stord water supply</h3>
        <span className="text-xs tabular-nums text-muted-foreground">12 Mar 2026, 14:00 · 1 burst being isolated · 212 properties without water</span>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiTile size="compact" label="Demand" value={DEMAND_NOW} unit="L/s" delta={{ reference: DEMAND_SHAPE[14], caption: 'vs typical', decimals: 0 }} />
        <KpiTile size="compact" label="Reservoir storage" value={71.8} unit="%" decimals={1} delta={{ reference: 68.9, goodDirection: 'up', caption: 'vs 06:00', decimals: 1 }} />
        <KpiTile size="compact" label="Free chlorine" value={0.22} unit="mg/L" decimals={2} status={{ tone: 'warning', label: 'Close to limit', shape: 'square' }} target={{ value: 0.2, label: 'Minimum' }} />
        <KpiTile size="compact" label="Non-revenue water" value={(NON_REVENUE / WATER_BALANCE.input) * 100} unit="%" decimals={1} status={{ tone: 'warning', label: 'Above target', shape: 'square' }} target={{ value: 20 }} />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="w-full min-w-0 lg:col-span-2">
          <TrendChart
            label="Water demand today against a typical weekday"
            series={[
              { key: 'typical', label: 'Typical weekday', points: DEMAND_TYPICAL, ghost: true },
              { key: 'today', label: 'Today', points: DEMAND_TODAY },
            ]}
            events={[{ t: NOW, label: 'Now', solid: true }]}
            yDomain={[0, 160]}
            unit="L/s"
            maxTicks={7}
            legend
            heightClassName="h-52"
          />
        </Card>
        <PumpingStationCard
          name="Kårevik booster station"
          tag="61-PS-10"
          pumps={BOOSTER_PUMPS}
          readings={[
            { label: 'Flow', value: 148, unit: 'L/s' },
            { label: 'Delivery pressure', value: 6.4, unit: 'bar', decimals: 1 },
          ]}
        />
      </div>
    </div>
  );
}

export default definePage({
  id: 'water-and-utilities',
  title: 'Water and utilities',
  summary:
    'The kit for water supply and wastewater applications: pumping stations and reservoirs, treatment quality against regulatory limits, demand, losses and the event logs a regulator asks for.',
  guidance: {
    use: [
      'Every regulated reading next to its limit, with the verdict in words.',
      'Duty, assist and standby named per pump; a station is judged by its duty pump.',
      'Night flow as the leakage signal, drawn against the usual range for the hour.',
      'Losses as a balance that adds up to system input, not as one percentage.',
    ],
    avoid: [
      'Green ticks on every compliant parameter: only the ones near or past a limit need colour.',
      'A compliance percentage without the number of samples behind it.',
      'Event logs without duration, volume and whether the event was reported.',
      'Valve positions as colour only; write open, closed or the percentage.',
    ],
  },
  source,
  sections: [
    {
      id: 'stations-and-network',
      title: 'Stations, storage and network',
      description: 'The assets that move and hold water, and the pressure they keep.',
      specimens: [
        {
          id: 'WaterUtilityPumpingStation',
          title: 'Pumping station card',
          note: 'A station in normal rotation: duty and assist running, standby at rest.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/domains2/PumpingStationCard.tsx'],
          Component: WaterUtilityPumpingStation,
        },
        {
          id: 'WaterUtilityStationTripped',
          title: 'Station on its standby pump',
          note: 'The duty pump has tripped and the last available pump carries the station.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/domains2/PumpingStationCard.tsx'],
          Component: WaterUtilityStationTripped,
        },
        {
          id: 'WaterUtilityTankLevel',
          title: 'Reservoir level with volume',
          note: 'A service reservoir, where the volume stored and the room left matter more than the level.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/domains/TankInventoryTile.tsx'],
          Component: WaterUtilityTankLevel,
        },
        {
          id: 'WaterUtilityPressureZones',
          title: 'Network pressure zones',
          note: 'Every zone against its own service band, with night flow as the leakage hint.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/RangeIndicator.tsx', 'industrial/StatusIndicator.tsx', 'industrial/ValueReadout.tsx'],
          Component: WaterUtilityPressureZones,
        },
        {
          id: 'WaterUtilityValveList',
          title: 'Valve status list',
          note: 'Network valves with position in words; only an abnormal position takes a status colour.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/StatusIndicator.tsx'],
          Component: WaterUtilityValveList,
        },
      ],
    },
    {
      id: 'treatment-and-quality',
      title: 'Treatment and quality',
      description: 'What the works does to the water, and whether the result meets its limits.',
      specimens: [
        {
          id: 'WaterUtilityTreatmentTrain',
          title: 'Treatment train with quality readings',
          note: 'Following water through the works, with the readings that prove each stage is doing its job.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['industrial/ValueReadout.tsx'],
          Component: WaterUtilityTreatmentTrain,
        },
        {
          id: 'WaterUtilityComplianceTile',
          title: 'Compliance, within limit',
          note: 'A regulated parameter with comfortable margin: neutral number, verdict in words.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/domains2/ComplianceTile.tsx', 'industrial/domains2/compliance.ts'],
          Component: WaterUtilityComplianceTile,
        },
        {
          id: 'WaterUtilityComplianceClose',
          title: 'Compliance, close to minimum',
          note: 'A lower limit, such as a disinfectant residual, with less than a tenth of margin left.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/domains2/ComplianceTile.tsx', 'industrial/domains2/compliance.ts'],
          Component: WaterUtilityComplianceClose,
        },
        {
          id: 'WaterUtilityComplianceExceeded',
          title: 'Compliance, limit exceeded',
          note: 'A breach of a permit limit, with the share of samples that failed.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/domains2/ComplianceTile.tsx', 'industrial/domains2/compliance.ts'],
          Component: WaterUtilityComplianceExceeded,
        },
        {
          id: 'WaterUtilityEffluentTable',
          title: 'Effluent quality table',
          note: 'All permit parameters at once, each with its limit, sample count and verdict.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['industrial/domains2/compliance.ts', 'industrial/StatusIndicator.tsx', 'industrial/ValueReadout.tsx'],
          Component: WaterUtilityEffluentTable,
        },
        {
          id: 'WaterUtilityDosing',
          title: 'Chemical dosing with stock days',
          note: 'A dosing point, where the rate and how long the chemical lasts belong together.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/domains/DaysOfCover.tsx', 'industrial/LinearGauge.tsx', 'industrial/ValueReadout.tsx'],
          Component: WaterUtilityDosing,
        },
      ],
    },
    {
      id: 'demand-and-efficiency',
      title: 'Demand and efficiency',
      description: 'How much water is wanted through the day, and what it costs to deliver.',
      specimens: [
        {
          id: 'WaterUtilityDemandProfile',
          title: 'Demand profile, 24 hours',
          note: 'Today against the typical day, so both an unusual peak and a raised night flow stand out.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx'],
          Component: WaterUtilityDemandProfile,
        },
        {
          id: 'WaterUtilityDemandTile',
          title: 'Demand tile',
          note: 'The current demand on a control room wall, with what to expect next.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/KpiTile.tsx'],
          Component: WaterUtilityDemandTile,
        },
        {
          id: 'WaterUtilityPumpDutyPoint',
          title: 'Pump efficiency at duty point',
          note: 'Checking whether a pump runs near its best efficiency point or wastes energy away from it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/SeriesLegend.tsx'],
          Component: WaterUtilityPumpDutyPoint,
        },
        {
          id: 'WaterUtilityTurnover',
          title: 'Service reservoir turnover',
          note: 'Ranking reservoirs by water age to find where quality is at risk.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/domains/ShareBarList.tsx'],
          Component: WaterUtilityTurnover,
        },
        {
          id: 'WaterUtilityNrwSummary',
          title: 'Non-revenue water summary',
          note: 'The monthly water balance: what was billed and where the rest went.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/operations/DistributionBar.tsx', 'industrial/StatusIndicator.tsx', 'industrial/ValueReadout.tsx'],
          Component: WaterUtilityNrwSummary,
        },
        {
          id: 'WaterUtilityNightFlowTile',
          title: 'Minimum night flow tile',
          note: 'The earliest signal of new leakage, tracked night by night.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/KpiTile.tsx'],
          Component: WaterUtilityNightFlowTile,
        },
        {
          id: 'WaterUtilityEnergyTile',
          title: 'Energy per cubic metre tile',
          note: 'Energy intensity of supply, where lower is better and the split says where to look.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/KpiTile.tsx'],
          Component: WaterUtilityEnergyTile,
        },
      ],
    },
    {
      id: 'events',
      title: 'Leaks, interruptions and spills',
      description: 'What went wrong, who it affects and what the regulator needs to hear.',
      specimens: [
        {
          id: 'WaterUtilityLeakAlerts',
          title: 'Leak and burst alert rows',
          note: 'Alerts that carry their evidence, so the operator can judge a burst from a slow leak.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['industrial/StatusIndicator.tsx'],
          Component: WaterUtilityLeakAlerts,
        },
        {
          id: 'WaterUtilityCustomerImpact',
          title: 'Supply interruption tile',
          note: 'The customer side of an incident: how many are affected and for how long.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/StatusIndicator.tsx', 'industrial/ValueReadout.tsx'],
          Component: WaterUtilityCustomerImpact,
        },
        {
          id: 'WaterUtilitySpillLog',
          title: 'Overflow and spill event log',
          note: 'The record of discharges: cause, duration, volume and whether each has been reported.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['industrial/StatusIndicator.tsx'],
          Component: WaterUtilitySpillLog,
        },
      ],
    },
    {
      id: 'full-blocks',
      title: 'Full blocks',
      description: 'The pieces combined into a supply overview.',
      specimens: [
        {
          id: 'WaterUtilityOverview',
          title: 'Water supply overview',
          note: 'The landing view of a utility control room: headline figures, demand and a key station.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['industrial/domains2/PumpingStationCard.tsx', 'industrial/KpiTile.tsx', 'industrial/charts/TrendChart.tsx'],
          Component: WaterUtilityOverview,
        },
      ],
    },
  ],
});
